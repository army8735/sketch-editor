import { Rich, TextProps } from '../format';
import { calPoint, inverse4 } from '../math/matrix';
import CanvasCache from '../refresh/CanvasCache';
import config from '../refresh/config';
import { RefreshLevel } from '../refresh/level';
import {
  color2rgbaInt,
  color2rgbaStr,
  getBaseline,
  setFontStyle,
} from '../style/css';
import { StyleUnit, TEXT_ALIGN } from '../style/define';
import font from '../style/font';
import Event from '../util/Event';
import inject from '../util/inject';
import { LayoutData } from './layout';
import LineBox from './LineBox';
import Node from './Node';
import TextBox from './TextBox';

/**
 * 在给定宽度w的情况下，测量文字content多少个满足塞下，只支持水平书写，从start的索引开始，content长length
 * 尽可能地少的次数调用canvas的measureText或svg的html节点的width，因为比较消耗性能
 * 这就需要一种算法，不能逐字遍历看总长度是否超过，也不能单字宽度相加因为有文本整形某些字体多个字宽度不等于每个之和
 * 简单的2分法实现简单，但是次数稍多，对于性能不是最佳，因为内容的slice裁剪和传递给canvas测量都随尺寸增加而加大
 * 由于知道w和fontSize，因此能推测出平均值为fontSize/w，即字的个数，
 * 进行测量后得出w2，和真实w对比，产生误差d，再看d和fontSize推测差距个数，如此反复
 * 返回内容和end索引和长度，最少也要1个字符
 */
function measure(
  ctx: CanvasRenderingContext2D,
  start: number,
  length: number,
  content: string,
  w: number,
  perW: number,
  letterSpacing: number,
) {
  let i = start,
    j = length,
    rw = 0,
    newLine = false;
  // 没有letterSpacing或者是svg模式可以完美获取TextMetrics
  let hypotheticalNum = Math.round(w / perW);
  // 不能增长0个字符，至少也要1个
  if (hypotheticalNum <= 0) {
    hypotheticalNum = 1;
  }
  // 超过内容长度范围也不行
  else if (hypotheticalNum > length - start) {
    hypotheticalNum = length - start;
  }
  // 类似2分的一个循环
  while (i < j) {
    let mw = ctx.measureText(
      content.slice(start, start + hypotheticalNum),
    ).width;
    if (letterSpacing) {
      // mw += hypotheticalNum * letterSpacing;
    }
    if (mw === w) {
      rw = w;
      newLine = true;
      break;
    }
    // 超出，设置右边界，并根据余量推测减少个数，
    // 因为精度问题，固定宽度或者累加的剩余空间，不用相等判断，而是为原本w宽度加一点点冗余1e-10
    if (mw > w + 1e-10) {
      newLine = true;
      // 限制至少1个
      if (hypotheticalNum === 1) {
        rw = mw;
        break;
      }
      // 注意特殊判断i和j就差1个可直接得出结果，因为现在超了而-1不超肯定是-1的结果
      if (i === j - 1 || i - start === hypotheticalNum - 1) {
        hypotheticalNum = i - start;
        break;
      }
      j = hypotheticalNum + start - 1;
      let reduce = Math.round((mw - w) / perW);
      if (reduce <= 0) {
        reduce = 1;
      }
      hypotheticalNum -= reduce;
      if (hypotheticalNum < i - start) {
        hypotheticalNum = i - start;
      }
    }
    // 还有空余，设置左边界，并根据余量推测增加的个数
    else {
      rw = mw;
      if (hypotheticalNum === length - start) {
        break;
      }
      i = hypotheticalNum + start;
      let add = Math.round((w - mw) / perW);
      if (add <= 0) {
        add = 1;
      }
      hypotheticalNum += add;
      if (hypotheticalNum > j - start) {
        hypotheticalNum = j - start;
      }
    }
  }
  // 查看是否有空格，防止字符串过长indexOf无效查找
  let hasEnter = false;
  for (let i = start, len = start + hypotheticalNum; i < len; i++) {
    if (content.charAt(i) === '\n') {
      hypotheticalNum = i - start; // 遇到换行数量变化，不包含换行，强制newLine为false，换行在主循环
      rw = ctx.measureText(content.slice(start, start + hypotheticalNum)).width;
      if (letterSpacing) {
        // rw += hypotheticalNum * letterSpacing;
      }
      newLine = false;
      hasEnter = true;
      break;
    }
  }
  // 下一个字符是回车，强制忽略换行，外层循环识别
  if (!hasEnter && content.charAt(start + hypotheticalNum) === '\n') {
    newLine = false;
  }
  return { hypotheticalNum, rw, newLine };
}

export type Cursor = {
  isMulti: boolean; // 是否选择了多个文字，还是单个光标
  startLineBox: number;
  endLineBox: number;
  startTextBox: number;
  endTextBox: number;
  startString: number; // 位于textBox中字符串的索引
  endString: number;
};

class Text extends Node {
  _content: string;
  rich?: Array<Rich>;
  lineBoxList: Array<LineBox>;
  lastCursorX: number; // 上一次手动指定的光标x相对坐标，上下移动时保持定位
  cursor: Cursor; // 光标信息
  showSelectArea: boolean;
  asyncRefresh: boolean;

  constructor(props: TextProps) {
    super(props);
    this.isText = true;
    this._content = props.content;
    this.rich = props.rich;
    this.lineBoxList = [];
    this.lastCursorX = 0;
    this.cursor = {
      isMulti: false,
      startLineBox: 0,
      endLineBox: 0,
      startTextBox: 0,
      endTextBox: 0,
      startString: 0,
      endString: 0,
    };
    this.showSelectArea = false;
    this.asyncRefresh = false;
  }

  override lay(data: LayoutData) {
    super.lay(data);
    const { rich, style, computedStyle, _content: content, lineBoxList } = this;
    const autoW =
      style.width.u === StyleUnit.AUTO &&
      (style.left.u === StyleUnit.AUTO || style.right.u === StyleUnit.AUTO);
    const autoH =
      style.height.u === StyleUnit.AUTO &&
      (style.top.u !== StyleUnit.AUTO || style.bottom.u !== StyleUnit.AUTO);
    let i = 0;
    let length = content.length;
    let perW: number;
    let letterSpacing: number;
    let paragraphSpacing: number;
    let lineHeight;
    let baseline;
    let maxW = 0;
    let x = 0,
      y = 0;
    // 富文本每串不同的需要设置字体测量，这个索引记录每个rich块首字符的start索引，在遍历时到这个字符则重设
    const SET_FONT_INDEX: Array<number> = [];
    if (rich && rich.length) {
      for (let i = 0, len = rich.length; i < len; i++) {
        const item = rich[i];
        SET_FONT_INDEX[item.location] = i;
        const family = item.fontFamily.toLowerCase();
        const data = font.data[family];
        if (data) {
          const list = data.list || [];
          for (let j = 0, len = list.length; j < len; j++) {
            const item = list[j];
            if (item.postscriptName === family) {
              if (!item.loaded && item.url) {
                inject.loadFont(family, item.url, (cache: any) => {
                  item.loaded = true;
                  // 加载成功后再次判断是否是这个字体，防止多次连续变更，rich中可能会很多重复，用异步刷新
                  if (
                    cache.success &&
                    rich &&
                    rich[i] &&
                    rich[i].fontFamily.toLowerCase() === family
                  ) {
                    if (this.asyncRefresh) {
                      return;
                    }
                    this.asyncRefresh = true;
                    inject.requestAnimationFrame(() => {
                      if (
                        cache.success &&
                        rich &&
                        rich[i] &&
                        rich[i].fontFamily.toLowerCase() === family
                      ) {
                        this.asyncRefresh = false;
                        this.refresh(RefreshLevel.REFLOW);
                      }
                    });
                  }
                });
              }
              break;
            }
          }
        }
      }
    } else {
      const family = computedStyle.fontFamily.toLowerCase();
      const data = font.data[family];
      if (data) {
        const list = data.list || [];
        for (let i = 0, len = list.length; i < len; i++) {
          const item = list[i];
          if (item.postscriptName === family) {
            if (!item.loaded && item.url) {
              inject.loadFont(family, item.url, (cache: any) => {
                item.loaded = true;
                // 加载成功后再次判断是否是这个字体，防止多次连续变更
                if (
                  cache.success &&
                  (!rich || !rich?.length) &&
                  computedStyle.fontFamily.toLowerCase() === family
                ) {
                  this.refresh(RefreshLevel.REFLOW);
                }
              });
            }
            break;
          }
        }
      }
    }
    const ctx = inject.getFontCanvas().ctx;
    // 第一个肯定要设置测量font
    if (rich && rich.length) {
      const first = rich[0];
      letterSpacing = first.letterSpacing;
      paragraphSpacing = first.paragraphSpacing;
      perW = first.fontSize * 0.8 + letterSpacing;
      lineHeight = first.lineHeight;
      baseline = getBaseline(first);
      ctx.font = setFontStyle(first);
      // @ts-ignore
      ctx.letterSpacing = letterSpacing + 'px';
    }
    // 无富文本则通用
    else {
      letterSpacing = computedStyle.letterSpacing;
      paragraphSpacing = computedStyle.paragraphSpacing;
      perW = computedStyle.fontWeight * 0.8 + letterSpacing;
      lineHeight = computedStyle.lineHeight;
      baseline = getBaseline(computedStyle);
      ctx.font = setFontStyle(computedStyle);
      // @ts-ignore
      ctx.letterSpacing = letterSpacing + 'px';
    }
    let lineBox = new LineBox(y, lineHeight, i, false);
    lineBoxList.splice(0);
    lineBoxList.push(lineBox);
    // 布局考虑几种情况，是否自动宽和自动高，目前暂无自动宽+固定高
    const W = autoW ? Number.MAX_SAFE_INTEGER : this.width;
    const H = autoH ? Number.MAX_SAFE_INTEGER : this.height;
    while (i < length) {
      // 定高超过不显示也无需定位
      if (!autoH && y >= H) {
        break;
      }
      const setFontIndex = SET_FONT_INDEX[i];
      // 每串富文本重置font测量
      if (i && rich && setFontIndex) {
        const cur = rich[setFontIndex];
        letterSpacing = cur.letterSpacing;
        paragraphSpacing = cur.paragraphSpacing;
        perW = cur.fontSize * 0.8 + letterSpacing;
        lineHeight = cur.lineHeight;
        baseline = getBaseline(cur);
        ctx.font = setFontStyle(cur);
        // @ts-ignore
        ctx.letterSpacing = letterSpacing + 'px';
      }
      // \n，行开头会遇到，需跳过
      if (content.charAt(i) === '\n') {
        i++;
        x = 0;
        y += lineHeight + paragraphSpacing;
        lineBox.verticalAlign();
        lineBox.endEnter = true;
        lineBox = new LineBox(y, lineHeight, i, true);
        lineBoxList.push(lineBox);
        continue;
      }
      // 富文本需限制最大length，非富普通情况无需
      let len = length;
      if (rich && rich.length) {
        for (let j = i + 1; j < len; j++) {
          if (SET_FONT_INDEX[j]) {
            len = j;
            break;
          }
        }
      }
      // 如果无法放下一个字符，且x不是0开头则换行，预估测量里限制了至少有1个字符
      const min = ctx.measureText(content.charAt(i)).width;
      if (min > W - x + 1e-10 && x) {
        x = 0;
        y += lineBox.lineHeight + paragraphSpacing;
        if (i < length) {
          lineBox.verticalAlign();
          lineBox = new LineBox(y, lineHeight, i, false);
          lineBoxList.push(lineBox);
        }
        continue;
      }
      // 预估法获取测量结果
      const {
        hypotheticalNum: num,
        rw,
        newLine,
      } = measure(ctx, i, len, content, W - x, perW, letterSpacing);
      const textBox = new TextBox(
        x,
        y,
        rw,
        lineHeight,
        baseline,
        i,
        content.slice(i, i + num),
        ctx.font,
        // @ts-ignore
        ctx.letterSpacing,
      );
      lineBox.add(textBox);
      i += num;
      maxW = Math.max(maxW, rw + x);
      // 换行则x重置、y增加、新建LineBox，否则继续水平增加x
      if (newLine) {
        x = 0;
        y += lineBox.lineHeight + paragraphSpacing;
        // 最后一行对齐外面做
        if (i < length) {
          lineBox.verticalAlign();
          lineBox = new LineBox(y, lineHeight, i, false);
          lineBoxList.push(lineBox);
        }
      } else {
        x += rw;
      }
    }
    // 最后一行循环里没算要再算一次
    maxW = Math.max(maxW, lineBox.w);
    if (autoW) {
      this.width = computedStyle.width = maxW;
    }
    if (autoH) {
      this.height = computedStyle.height = lineBox.y + lineBox.lineHeight;
    }
    // 最后一行对齐
    lineBox.verticalAlign();
    // 非左对齐偏移
    const textAlign = computedStyle.textAlign;
    if (textAlign === TEXT_ALIGN.CENTER) {
      for (let i = 0, len = lineBoxList.length; i < len; i++) {
        const lineBox = lineBoxList[i];
        const d = this.width - lineBox.w;
        if (d) {
          lineBox.offsetX(d * 0.5);
        }
      }
    } else if (textAlign === TEXT_ALIGN.RIGHT) {
      for (let i = 0, len = lineBoxList.length; i < len; i++) {
        const lineBox = lineBoxList[i];
        const d = this.width - lineBox.w;
        if (d) {
          lineBox.offsetX(d);
        }
      }
    }
  }

  override calContent(): boolean {
    return (this.hasContent = !!this._content);
  }

  override renderCanvas(scale: number) {
    super.renderCanvas(scale);
    const bbox = this._bbox || this.bbox;
    const x = bbox[0],
      y = bbox[1],
      w = bbox[2] - x,
      h = bbox[3] - y;
    while (
      w * scale > config.MAX_TEXTURE_SIZE ||
      h * scale > config.MAX_TEXTURE_SIZE
      ) {
      if (scale <= 1) {
        break;
      }
      scale = scale >> 1;
    }
    if (
      w * scale > config.MAX_TEXTURE_SIZE ||
      h * scale > config.MAX_TEXTURE_SIZE
    ) {
      return;
    }
    const dx = -x * scale,
      dy = -y * scale;
    const { rich, computedStyle, lineBoxList } = this;
    const canvasCache = (this.canvasCache = CanvasCache.getInstance(
      w * scale,
      h * scale,
    ));
    canvasCache.available = true;
    const ctx = canvasCache.offscreen.ctx;
    // 如果处于选择范围状态，渲染背景
    if (this.showSelectArea) {
      ctx.fillStyle = '#f4d3c1';
      const cursor = this.cursor;
      // 单行多行区分开
      if (cursor.startLineBox === cursor.endLineBox) {
        const lineBox = lineBoxList[cursor.startLineBox];
        const list = lineBox.list;
        let textBox = list[cursor.startTextBox];
        let x1 = textBox.x * scale;
        ctx.font = textBox.font;
        x1 +=
          ctx.measureText(textBox.str.slice(0, cursor.startString)).width *
          scale;
        textBox = list[cursor.endTextBox];
        let x2 = textBox.x * scale;
        ctx.font = textBox.font;
        x2 +=
          ctx.measureText(textBox.str.slice(0, cursor.endString)).width * scale;
        // 反向api自动支持了
        ctx.fillRect(
          x1,
          lineBox.y * scale,
          x2 - x1,
          lineBox.lineHeight * scale,
        );
      } else {
        // 可能end会大于start，渲染需要排好顺序，这里只需考虑跨行顺序，同行进不来
        const {
          startLineBox,
          startTextBox,
          startString,
          endLineBox,
          endTextBox,
          endString,
        } = this.getSortedCursor();
        // 先首行
        let lineBox = lineBoxList[startLineBox];
        let list = lineBox.list;
        let textBox = list[startTextBox];
        if (textBox) {
          let x1 = textBox.x * scale;
          ctx.font = textBox.font;
          x1 +=
            ctx.measureText(textBox.str.slice(0, startString)).width * scale;
          ctx.fillRect(
            x1,
            lineBox.y * scale,
            lineBox.w * scale - x1,
            lineBox.lineHeight * scale,
          );
        }
        // 中间循环
        for (let i = startLineBox + 1, len = endLineBox; i < len; i++) {
          const lineBox = lineBoxList[i];
          ctx.fillRect(
            0,
            lineBox.y * scale,
            lineBox.w * scale,
            lineBox.lineHeight * scale,
          );
        }
        // 最后尾行
        lineBox = lineBoxList[endLineBox];
        list = lineBox.list;
        textBox = list[endTextBox];
        if (textBox) {
          let x1 = textBox.x * scale;
          ctx.font = textBox.font;
          x1 += ctx.measureText(textBox.str.slice(0, endString)).width * scale;
          ctx.fillRect(0, lineBox.y * scale, x1, lineBox.lineHeight * scale);
        }
      }
    }
    // 富文本每串不同的需要设置字体颜色
    const SET_COLOR_INDEX: Array<{ index: number; color: string }> = [];
    let color: string;
    if (rich && rich.length) {
      for (let i = 0, len = rich.length; i < len; i++) {
        const item = rich[i];
        SET_COLOR_INDEX.push({
          index: item.location,
          color: color2rgbaStr(item.color),
        });
      }
      const first = rich[0];
      color = color2rgbaStr(first.color);
    }
    // 非富默认颜色
    else {
      color = color2rgbaStr(computedStyle.color);
    }
    for (let i = 0, len = lineBoxList.length; i < len; i++) {
      const lineBox = lineBoxList[i];
      // 固定尺寸超过则overflow: hidden
      if (lineBox.y >= h) {
        break;
      }
      const list = lineBox.list;
      const len = list.length;
      for (let i = 0; i < len; i++) {
        const textBox = list[i];
        // textBox的分隔一定是按rich的，用字符索引来获取颜色
        const index = textBox.index;
        if (SET_COLOR_INDEX.length && index >= SET_COLOR_INDEX[0].index) {
          const cur = SET_COLOR_INDEX.shift()!;
          color = color2rgbaStr(cur.color);
        }
        // 缩放影响字号
        if (scale !== 1) {
          ctx.font = textBox.font.replace(
            /([\d.e+-]+)px/gi,
            ($0, $1) => $1 * scale + 'px',
          );
          // @ts-ignore
          ctx.letterSpacing = textBox.letterSpacing.replace(
            /([\d.e+-]+)px/gi,
            ($0, $1) => $1 * scale + 'px',
          );
        } else {
          ctx.font = textBox.font;
          // @ts-ignore
          ctx.letterSpacing = textBox.letterSpacing;
        }
        ctx.fillStyle = color;
        ctx.fillText(
          textBox.str,
          textBox.x * scale + dx,
          (textBox.y + textBox.baseline) * scale + dy,
        );
      }
    }
  }

  // 根据绝对坐标获取光标位置，同时设置开始光标位置
  setCursorStartByAbsCoord(x: number, y: number) {
    const dpi = this.root!.dpi;
    const m = this.matrixWorld;
    const im = inverse4(m);
    const local = calPoint({ x: x * dpi, y: y * dpi }, im);
    const lineBoxList = this.lineBoxList;
    const cursor = this.cursor;
    cursor.isMulti = false;
    const len = lineBoxList.length;
    for (let i = 0; i < len; i++) {
      const lineBox = lineBoxList[i];
      // 确定y在哪一行后
      if (local.y >= lineBox.y && local.y < lineBox.y + lineBox.h) {
        cursor.startLineBox = i;
        const res = this.getCursorByLocalX(local.x, lineBox, false);
        this.lastCursorX = res.x;
        const p = calPoint({ x: res.x, y: res.y }, m);
        return {
          x: p.x,
          y: p.y,
          h: res.h * m[0],
        };
      }
    }
    // 找不到认为是最后一行末尾
    const lineBox = lineBoxList[len - 1];
    cursor.startLineBox = len - 1;
    const res = this.getCursorByLocalX(this.width, lineBox, false);
    this.lastCursorX = res.x;
    const p = calPoint({ x: res.x, y: res.y }, m);
    return {
      x: p.x,
      y: p.y,
      h: res.h * m[0],
    };
  }

  // 设置结束光标位置
  setCursorEndByAbsCoord(x: number, y: number) {
    const dpi = this.root!.dpi;
    const m = this.matrixWorld;
    const im = inverse4(m);
    const local = calPoint({ x: x * dpi, y: y * dpi }, im);
    const lineBoxList = this.lineBoxList;
    const cursor = this.cursor;
    const { endLineBox: i, endTextBox: j, endString: k } = cursor;
    cursor.isMulti = true;
    const len = lineBoxList.length;
    for (let i = 0; i < len; i++) {
      const lineBox = lineBoxList[i];
      // 确定y在哪一行后
      if (local.y >= lineBox.y && local.y < lineBox.y + lineBox.h) {
        cursor.endLineBox = i;
        this.getCursorByLocalX(local.x, lineBox, true);
        // 变化需要更新渲染
        if (
          cursor.endLineBox !== i ||
          cursor.endTextBox !== j ||
          cursor.endString !== k
        ) {
          // 还要检查首尾，相同时不是多选
          const isMulti =
            cursor.startLineBox !== cursor.endLineBox ||
            cursor.startTextBox !== cursor.endTextBox ||
            cursor.startString !== cursor.endString;
          cursor.isMulti = isMulti;
          this.showSelectArea = isMulti;
          this.root?.addUpdate(
            this,
            [],
            RefreshLevel.REPAINT,
            false,
            false,
            undefined,
          );
        }
        return;
      }
    }
    // 找不到认为是最后一行末尾
    const lineBox = lineBoxList[len - 1];
    cursor.endLineBox = len - 1;
    this.getCursorByLocalX(this.width, lineBox, true);
    // 变化需要更新渲染
    if (
      cursor.endLineBox !== i ||
      cursor.endTextBox !== j ||
      cursor.endString !== k
    ) {
      this.showSelectArea = true;
      this.root?.addUpdate(
        this,
        [],
        RefreshLevel.REPAINT,
        false,
        false,
        undefined,
      );
    }
  }

  hideSelectArea() {
    this.showSelectArea = false;
    this.root?.addUpdate(
      this,
      [],
      RefreshLevel.REPAINT,
      false,
      false,
      undefined,
    );
  }

  /**
   * 改变尺寸前防止中心对齐导致位移，一般只有left百分比+定宽（水平方向，垂直同理），
   * 但是文本是个特殊存在，可以改变是否固定尺寸的模式，因此只考虑left百分比，
   * 文本不会有left+right百分比，只会有left+right像素
   */
  private beforeEdit() {
    const { style, computedStyle } = this;
    const { left, top, translateX, translateY } = style;
    const isLeft =
      // width.u === StyleUnit.AUTO &&
      left.u === StyleUnit.PERCENT;
    // right.u === StyleUnit.AUTO;
    if (isLeft) {
      const { left: left2, width: width2 } = computedStyle;
      left.v = left2 - width2 * 0.5;
      left.u = StyleUnit.PX;
      translateX.v = 0;
      translateX.u = StyleUnit.PX;
    }
    const isTop =
      // height.u === StyleUnit.AUTO &&
      top.u === StyleUnit.PERCENT;
    // bottom.u === StyleUnit.AUTO;
    if (isTop) {
      const { top: top2, height: height2 } = computedStyle;
      top.v = top2 - height2 * 0.5;
      top.u = StyleUnit.PX;
      translateY.v = 0;
      translateY.u = StyleUnit.PX;
    }
    return { isLeft, isTop };
  }

  // 改变后如果是中心对齐还原
  private afterEdit(isLeft: boolean, isTop: boolean) {
    if (!isLeft && !isTop) {
      return;
    }
    const { style, computedStyle } = this;
    const { left, top, translateX, translateY } = style;
    if (isLeft) {
      const width = this.width;
      const v = computedStyle.left + width * 0.5;
      left.v = ((computedStyle.left + width * 0.5) * 100) / this.parent!.width;
      left.u = StyleUnit.PERCENT;
      translateX.v = -50;
      translateX.u = StyleUnit.PERCENT;
      computedStyle.left = v;
    }
    if (isTop) {
      const height = this.height;
      const v = computedStyle.top + height * 0.5;
      top.v = ((computedStyle.top + height * 0.5) * 100) / this.parent!.height;
      top.u = StyleUnit.PERCENT;
      translateY.v = -50;
      translateY.u = StyleUnit.PERCENT;
      computedStyle.top = v;
    }
  }

  /**
   * 在左百分比+宽度自动的情况，输入后要保持原本的位置，因为是中心点百分比对齐父级，
   * 其它几种都不需要：左右百分比定宽、左固定、右固定、左百分比+定宽，
   * 不会出现仅右百分比的情况，所有改变处理都一样
   */
  inputContent(s: string) {
    const { isLeft, isTop } = this.beforeEdit();
    const lineBoxList = this.lineBoxList;
    // 先记录下光标对应字符的索引
    const cursor = this.cursor;
    const { startLineBox: i, startTextBox: j, startString: k } = cursor;
    const lineBox = lineBoxList[i];
    const textBox = lineBox.list[j];
    const m = textBox.index + k;
    const c = this._content;
    this.content = c.slice(0, m) + s + c.slice(m);
    // 位移还原，无需渲染仅数据即可
    this.afterEdit(isLeft, isTop);
    // 同步更新光标位置
    this.updateCursorByIndex(m + s.length);
  }

  // 根据字符串索引更新光标
  private updateCursorByIndex(index: number) {
    const textBox = this.setCursorByIndex(index, false);
    if (textBox) {
      const { cursor, lineBoxList } = this;
      const ctx = inject.getFontCanvas().ctx;
      ctx.font = textBox.font;
      // @ts-ignore
      ctx.letterSpacing = textBox.letterSpacing;
      const str = textBox.str;
      const w = ctx.measureText(str.slice(0, cursor.startString)).width;
      this.lastCursorX = textBox.x + w;
      const m = this.matrixWorld;
      const p = calPoint({ x: this.lastCursorX, y: textBox.y }, m);
      this.root?.emit(
        Event.UPDATE_CURSOR,
        p.x,
        p.y,
        lineBoxList[cursor.startLineBox].lineHeight * m[0],
      );
    }
  }

  private setCursorByIndex(index: number, isEnd = false) {
    const lineBoxList = this.lineBoxList;
    const cursor = this.cursor;
    for (let i = 0, len = lineBoxList.length; i < len; i++) {
      const lineBox = lineBoxList[i];
      const list = lineBox.list;
      for (let j = 0, len = list.length; j < len; j++) {
        const textBox = list[j];
        if (
          index >= textBox.index &&
          index < textBox.index + textBox.str.length
        ) {
          if (isEnd) {
            cursor.endLineBox = i;
            cursor.endTextBox = j;
            cursor.endString = index - textBox.index;
          } else {
            cursor.startLineBox = i;
            cursor.startTextBox = j;
            cursor.startString = index - textBox.index;
          }
          return textBox;
        }
      }
    }
  }

  // 选区结束后，可能选择的范围为空，此时要重置光标multi不是多选状态
  checkCursorMulti() {
    const cursor = this.cursor;
    if (cursor.isMulti) {
      if (
        cursor.startLineBox === cursor.endLineBox &&
        cursor.startTextBox === cursor.endTextBox &&
        cursor.startString === cursor.endString
      ) {
        cursor.isMulti = false;
        this.showSelectArea = false;
      }
    }
    return cursor.isMulti;
  }

  // 获取光标当前坐标，无视multi，只取开头，没有高度，一般在滚动画布时更新获取新位置
  getCursorAbsCoord() {
    const m = this.matrixWorld;
    const lineBoxList = this.lineBoxList;
    const cursor = this.cursor;
    const lineBox = lineBoxList[cursor.startLineBox];
    const list = lineBox.list;
    // 空行
    if (!list.length) {
      return calPoint({ x: 0, y: lineBox.y }, m);
    }
    const textBox = list[cursor.startTextBox];
    const ctx = inject.getFontCanvas().ctx;
    ctx.font = textBox.font;
    // @ts-ignore
    ctx.letterSpacing = textBox.letterSpacing;
    const str = textBox.str;
    const w = ctx.measureText(str.slice(0, cursor.startString)).width;
    return calPoint({ x: textBox.x + w, y: textBox.y }, m);
  }

  // 上下左右按键移动光标，上下保持当前x，左右则更新
  moveCursor(code: number) {
    const m = this.matrixWorld;
    // 先求得当前光标位置在字符串的索引
    const cursor = this.cursor;
    let { startLineBox: i, startTextBox: j, startString: k } = cursor;
    let lineBoxList = this.lineBoxList;
    let lineBox = lineBoxList[i];
    let list = lineBox.list;
    let textBox = list[j];
    const pos = textBox ? textBox.index + k : lineBox.index + k; // 空行时k就是0
    // 左
    if (code === 37) {
      if (cursor.isMulti) {
        cursor.isMulti = false;
        return;
      }
      if (pos === 0) {
        return;
      }
      // textBox开头
      if (k === 0) {
        // 行开头要到上行末尾
        if (j === 0) {
          cursor.startLineBox = --i;
          lineBox = lineBoxList[i];
          list = lineBox.list;
          // 防止上一行是空行
          if (!list.length) {
            cursor.startTextBox = 0;
            cursor.startString = 0;
          } else {
            cursor.startTextBox = j = list.length - 1;
            // 看是否是enter，决定是否到末尾
            textBox = list[j];
            cursor.startString =
              textBox.str.length - (lineBox.endEnter ? 0 : 1);
          }
        }
        // 非行开头到上个textBox末尾
        else {
          cursor.startTextBox = --j;
          textBox = list[j];
          cursor.startString = textBox.str.length - 1;
        }
      }
      // textBox内容中
      else {
        cursor.startString = --k;
      }
    }
    // 上
    else if (code === 38) {
      cursor.isMulti = false;
      if (pos === 0) {
        return;
      }
      // 第一行到开头
      if (i === 0) {
        cursor.startTextBox = 0;
        textBox = list[0];
        cursor.startString = 0;
      }
      // 向上一行找最接近的，保持当前的x，直接返回结果
      else {
        lineBox = lineBoxList[--i];
        cursor.startLineBox = i;
        const res = this.getCursorByLocalX(this.lastCursorX, lineBox, false);
        const p = calPoint({ x: res.x, y: res.y }, m);
        this.root?.emit(
          Event.UPDATE_CURSOR,
          p.x,
          p.y,
          lineBox.lineHeight * m[0],
        );
        return;
      }
    }
    // 右
    else if (code === 39) {
      if (cursor.isMulti) {
        cursor.isMulti = false;
        cursor.startLineBox = cursor.endLineBox;
        cursor.startTextBox = cursor.endTextBox;
        cursor.startString = cursor.endString;
        return;
      }
      if (pos === this._content.length) {
        return;
      }
      // 本行空行，或者已经到行末尾且是enter换行
      if (
        !textBox ||
        (j === list.length - 1 && k === textBox.str.length && lineBox.endEnter)
      ) {
        cursor.startLineBox = ++i;
        cursor.startTextBox = 0;
        cursor.startString = 0;
        lineBox = lineBoxList[i];
        list = lineBox.list;
        textBox = list[0];
      }
      // 已经到行末尾，自动换行用鼠标也能点到末尾，下行一定有内容不可能是enter
      else if (j === list.length - 1 && k === textBox.str.length) {
        cursor.startLineBox = ++i;
        cursor.startTextBox = 0;
        cursor.startString = 1;
        lineBox = lineBoxList[i];
        list = lineBox.list;
        textBox = list[0];
      }
      // 已经到textBox末尾（行中非行尾），等同于next的开头
      else if (k === textBox.str.length) {
        cursor.startTextBox = ++j;
        textBox = list[j];
        cursor.startString = 1;
        // 歧义的原因，可能此时已经到了行尾（最后一个textBox只有1个字符，光标算作prev的末尾时右移），如果不是enter要视作下行开头
        if (j === list.length - 1 && textBox.str.length === 1) {
          if (!lineBox.endEnter && i < lineBoxList.length - 1) {
            cursor.startLineBox = ++i;
            lineBox = lineBoxList[i];
            list = lineBox.list;
            cursor.startTextBox = j = 0;
            textBox = list[j];
            cursor.startString = 0;
          }
        }
      }
      // textBox即将到末尾（差一个）
      else if (k === textBox.str.length - 1) {
        // 行末尾特殊检查是否是回车导致的换行，回车停留在末尾，否则到下行开头，最后一行也停留
        if (j === list.length - 1) {
          if (lineBox.endEnter || i === lineBoxList.length - 1) {
            cursor.startString++;
          } else {
            cursor.startLineBox = ++i;
            lineBox = lineBoxList[i];
            list = lineBox.list;
            cursor.startTextBox = j = 0;
            textBox = list[j];
            cursor.startString = 0;
          }
        }
        // 非行末尾到下个textBox开头
        else {
          cursor.startTextBox = ++j;
          textBox = list[j];
          cursor.startString = 0;
        }
      }
      // textBox非末尾
      else {
        cursor.startString = ++k;
      }
    }
    // 下
    else if (code === 40) {
      cursor.isMulti = false;
      if (pos === this._content.length) {
        return;
      }
      // 最后一行到末尾
      if (i === lineBoxList.length - 1) {
        cursor.startTextBox = j = list.length - 1;
        textBox = list[j];
        cursor.startString = textBox ? textBox.str.length : 0;
      }
      // 向下一行找最接近的，保持当前的x，直接返回结果
      else {
        lineBox = lineBoxList[++i];
        cursor.startLineBox = i;
        const res = this.getCursorByLocalX(this.lastCursorX, lineBox, false);
        const p = calPoint({ x: res.x, y: res.y }, m);
        this.root?.emit(
          Event.UPDATE_CURSOR,
          p.x,
          p.y,
          lineBox.lineHeight * m[0],
        );
        return;
      }
    }
    // 左右和特殊情况的上下，前面计算了cursorIndex的位置，据此获取光标位置，并记录x
    if (textBox) {
      const ctx = inject.getFontCanvas().ctx;
      ctx.font = textBox.font;
      // @ts-ignore
      ctx.letterSpacing = textBox.letterSpacing;
      const str = textBox.str;
      const w = ctx.measureText(str.slice(0, cursor.startString)).width;
      this.lastCursorX = textBox.x + w;
    } else {
      this.lastCursorX = 0;
    }
    const p = calPoint({ x: this.lastCursorX, y: lineBox.y }, m);
    this.root?.emit(Event.UPDATE_CURSOR, p.x, p.y, lineBox.lineHeight * m[0]);
  }

  enter() {
    const { isLeft, isTop } = this.beforeEdit();
    const cursor = this.cursor;
    const { startLineBox: i, startTextBox: j, startString: k } = cursor;
    const lineBoxList = this.lineBoxList;
    const lineBox = lineBoxList[i];
    const list = lineBox.list;
    const textBox = list[j];
    const index = textBox.index + k;
    const c = this._content;
    this.content = c.slice(0, index) + '\n' + c.slice(index);
    this.afterEdit(isLeft, isTop);
    this.updateCursorByIndex(index + 1);
  }

  delete() {
    const c = this._content;
    // 没内容没法删
    if (!c) {
      return;
    }
    const { isLeft, isTop } = this.beforeEdit();
    const cursor = this.cursor;
    const { startLineBox: i, startTextBox: j, startString: k } = cursor;
    // 开头也没法删
    if (!i && !j && !k) {
      return;
    }
    const lineBoxList = this.lineBoxList;
    const lineBox = lineBoxList[i];
    const list = lineBox.list;
    const textBox = list[j];
    const index = textBox ? textBox.index + k : lineBox.index + k;
    this.content = c.slice(0, index - 1) + c.slice(index);
    this.afterEdit(isLeft, isTop);
    this.updateCursorByIndex(index - 1);
  }

  // 给定相对x坐标获取光标位置，y已知传入lineBox
  private getCursorByLocalX(localX: number, lineBox: LineBox, isEnd = false) {
    const list = lineBox.list; // 可能为空行，返回行开头坐标0
    const cursor = this.cursor;
    let rx = 0,
      ry = lineBox.y,
      rh = lineBox.lineHeight;
    // 可能空行，先赋值默认0，再循环2分查找
    if (isEnd) {
      cursor.endString = 0;
    } else {
      cursor.startString = 0;
    }
    outer: for (let i = 0, len = list.length; i < len; i++) {
      const { x, w, str, font } = list[i];
      // x位于哪个textBox上，注意开头结尾
      if (
        (!i && localX <= x + w) ||
        (localX >= x && localX <= x + w) ||
        i === len - 1
      ) {
        if (isEnd) {
          cursor.endTextBox = i;
        } else {
          cursor.startTextBox = i;
        }
        const ctx = inject.getFontCanvas().ctx;
        ctx.font = font;
        let start = 0,
          end = str.length;
        while (start < end) {
          if (start === end - 1) {
            // 只差1个情况看更靠近哪边
            const w1 = ctx.measureText(str.slice(0, start)).width;
            const w2 = ctx.measureText(str.slice(0, end)).width;
            if (localX - (x + w1) > x + w2 - localX) {
              rx = x + w2;
              if (isEnd) {
                cursor.endString = end;
              } else {
                cursor.startString = end;
              }
            } else {
              rx = x + w1;
              if (isEnd) {
                cursor.endString = start;
              } else {
                cursor.startString = start;
              }
            }
            break outer;
          }
          const mid = start + ((end - start) >> 1);
          const w = ctx.measureText(str.slice(0, mid)).width;
          if (localX > x + w) {
            start = mid;
          } else if (localX < x + w) {
            end = mid;
          } else {
            if (isEnd) {
              cursor.endString = mid;
            } else {
              cursor.startString = mid;
            }
            rx = x + w;
            break outer;
          }
        }
      }
    }
    return { x: rx, y: ry, h: rh };
  }

  updateTextStyle(style: any, cb?: (sync: boolean) => void) {
    const { isLeft, isTop } = this.beforeEdit();
    const rich = this.rich;
    let hasChange = false;
    if (rich) {
      rich.forEach((item) => {
        hasChange = this.updateRich(item, style) || hasChange;
      });
    }
    // 防止rich变更但整体没有变更结果不刷新
    const keys = this.updateStyleData(style);
    if (keys.length) {
      this.root?.addUpdate(this, keys, undefined, false, false, cb);
    } else if (hasChange) {
      this.refresh(RefreshLevel.REFLOW, cb);
    }
    this.afterEdit(isLeft, isTop);
  }

  updateTextRangeStyle(style: any, cb?: (sync: boolean) => void) {
    const { cursor, rich } = this;
    // 正常情况不会出现光标单选
    if (!cursor.isMulti || !rich || !rich.length) {
      return false;
    }
    const { isLeft, isTop } = this.beforeEdit();
    const { isReversed, start, end } = this.getSortedCursor();
    let hasChange = false;
    // 找到所处的rich开始结束范围
    for (let i = 0, len = rich.length; i < len; i++) {
      const item = rich[i];
      if (item.location + item.length > start) {
        for (let j = len - 1; j >= i; j--) {
          const item2 = rich[j];
          if (item2.location < end) {
            // 同一个rich拆分为2段或者3段或者不拆分，在中间就是3段，索引靠近首尾一侧拆2段，全相等不拆分
            if (i === j) {
              // 整个rich恰好被选中
              if (
                item.location === start &&
                item.location + item.length === end
              ) {
                hasChange = this.updateRich(item, style);
              }
              // 选区开头是start则更新，后面新生成一段
              else if (item.location === start) {
                const n = Object.assign({}, item);
                hasChange = this.updateRich(item, style);
                if (hasChange) {
                  const length = item.length;
                  item.length = end - start;
                  n.location = end;
                  n.length = length - item.length;
                  rich.splice(i + 1, 0, n);
                }
              }
              // 选取结尾是end则更新，前面插入一段
              else if (item.location + item.length === end) {
                const n = Object.assign({}, item);
                hasChange = this.updateRich(n, style);
                if (hasChange) {
                  item.length = start - item.location;
                  n.location = start;
                  n.length = end - start;
                  rich.splice(i + 1, 0, n);
                }
              }
              // 选了中间一段，原有的部分作为开头，后面拆入2段新的
              else {
                const n = Object.assign({}, item);
                hasChange = this.updateRich(n, style);
                if (hasChange) {
                  const length = item.length;
                  item.length = start - item.location;
                  n.location = start;
                  n.length = end - start;
                  rich.splice(i + 1, 0, n);
                  const n2 = Object.assign({}, item);
                  n2.location = end;
                  n2.length = length - item.length - n.length;
                  rich.splice(i + 2, 0, n2);
                }
              }
            }
            // 跨rich段，开头结尾的rich除了检测更新样式外，还要看是否造成了分割，中间部分的只需检查更新即可
            else {
              const first = Object.assign({}, item);
              const item3 = rich[j];
              const last = Object.assign({}, item3);
              // 倒序进行，先从后面更新
              if (this.updateRich(item3, style)) {
                hasChange = true;
                if (end < item3.location + item3.length) {
                  last.location = end;
                  last.length = item3.location + item3.length - end;
                  item3.length = end - item3.location;
                  rich.splice(j + 1, 0, last);
                }
              }
              for (let k = i + 1; k < j - 1; k++) {
                hasChange = this.updateRich(rich[k], style) || hasChange;
              }
              if (this.updateRich(first, style)) {
                hasChange = true;
                if (start > item.location) {
                  first.location = start;
                  first.length = item.location + item.length - start;
                  item.length = start - item.location;
                  rich.splice(i + 1, 0, first);
                }
              }
            }
            break;
          }
        }
        break;
      }
    }
    if (hasChange) {
      // 合并相同的rich段，更新光标位置
      this.mergeRich();
      const parent = this.parent!;
      // 手动重新布局，因为要重新生成lineBox和textBox，然后设置光标再刷新
      this.layout({
        x: 0,
        y: 0,
        w: parent.width,
        h: parent.height,
      });
      this.clearCacheUpward(false);
      this.setCursorByIndex(isReversed ? end : start, false);
      this.setCursorByIndex(isReversed ? start : end, true);
      this.refresh(RefreshLevel.REPAINT, cb);
    }
    this.afterEdit(isLeft, isTop);
    return hasChange;
  }

  private updateRich(item: Rich, style: any) {
    let hasChange = false;
    if (
      style.hasOwnProperty('fontFamily') &&
      style.fontFamily !== item.fontFamily
    ) {
      item.fontFamily = style.fontFamily;
      hasChange = true;
    }
    if (style.hasOwnProperty('fontSize') && style.fontSize !== item.fontSize) {
      item.fontSize = style.fontSize;
      hasChange = true;
    }
    if (style.hasOwnProperty('color')) {
      const c = color2rgbaInt(style.color);
      if (
        item.color[0] !== c[0] ||
        item.color[1] !== c[1] ||
        item.color[2] !== c[2] ||
        item.color[3] !== c[3]
      ) {
        item.color = c;
        hasChange = true;
      }
    }
    if (
      style.hasOwnProperty('letterSpacing') &&
      style.letterSpacing !== item.letterSpacing
    ) {
      item.letterSpacing = style.letterSpacing;
      hasChange = true;
    }
    if (
      style.hasOwnProperty('lineHeight') &&
      style.lineHeight !== item.lineHeight
    ) {
      item.lineHeight = style.lineHeight;
      hasChange = true;
    }
    if (
      style.hasOwnProperty('paragraphSpacing') &&
      style.paragraphSpacing !== item.paragraphSpacing
    ) {
      item.paragraphSpacing = style.paragraphSpacing;
      hasChange = true;
    }
    return hasChange;
  }

  private mergeRich() {
    const rich = this.rich;
    if (!rich || !rich.length) {
      return false;
    }
    let hasChange = false;
    for (let i = rich.length - 2; i >= 0; i--) {
      const a = rich[i];
      const b = rich[i + 1];
      if (equalRich(a, b)) {
        a.length += b.length;
        rich.splice(i + 1, 1);
        hasChange = true;
      }
    }
    return hasChange;
  }

  // 如果end索引大于start，将其对换返回
  getSortedCursor() {
    let {
      isMulti,
      startLineBox,
      startTextBox,
      startString,
      endLineBox,
      endTextBox,
      endString,
    } = this.cursor;
    let isReversed = false;
    if (isMulti) {
      // 确保先后顺序，
      if (startLineBox > endLineBox) {
        [
          startLineBox,
          startTextBox,
          startString,
          endLineBox,
          endTextBox,
          endString,
        ] = [
          endLineBox,
          endTextBox,
          endString,
          startLineBox,
          startTextBox,
          startString,
        ];
        isReversed = true;
      } else if (startLineBox === endLineBox && startTextBox > endTextBox) {
        [startTextBox, startString, endTextBox, endString] = [
          endTextBox,
          endString,
          startTextBox,
          startString,
        ];
        isReversed = true;
      } else if (
        startLineBox === endLineBox &&
        startTextBox === endTextBox &&
        startString > endString
      ) {
        [startString, endString] = [endString, startString];
        isReversed = true;
      }
    }
    const lineBoxList = this.lineBoxList;
    let start = 0;
    let lineBox = lineBoxList[startLineBox];
    let list = lineBox.list;
    if (!list.length) {
      start = lineBox.index;
    } else {
      const textBox = list[startTextBox];
      start = textBox.index + startString;
    }
    let end = 0;
    lineBox = lineBoxList[endLineBox];
    list = lineBox.list;
    if (!list.length) {
      end = lineBox.index;
    } else {
      const textBox = list[endTextBox];
      end = textBox.index + endString;
    }
    return {
      isMulti,
      startLineBox,
      startTextBox,
      startString,
      endLineBox,
      endTextBox,
      endString,
      start,
      end,
      isReversed,
    };
  }

  // 返回光标所在的Rich数据列表
  getCursorRich() {
    const { rich, lineBoxList } = this;
    if (!rich) {
      return;
    }
    if (rich.length === 1) {
      return [rich[0]];
    }
    const res: Array<Rich> = [];
    // 字符索引对应的rich快速查找
    const RICH_INDEX: Array<Rich> = [];
    for (let i = 0, len = rich.length; i < len; i++) {
      const item = rich[i];
      const { location, length } = item;
      for (let i = location, len = location + length; i < len; i++) {
        RICH_INDEX[i] = item;
      }
    }
    const {
      isMulti,
      startLineBox,
      startTextBox,
      startString,
      endLineBox,
      endTextBox,
      endString,
    } = this.getSortedCursor();
    // 多选区域
    if (isMulti) {
      let start = 0;
      let end = 0;
      // 获取开头结尾的字符串索引
      let lineBox = lineBoxList[startLineBox];
      let list = lineBox.list;
      if (!list) {
        start = lineBox.index;
      } else {
        const textBox = list[startTextBox];
        start = textBox.index + startString;
      }
      lineBox = lineBoxList[endLineBox];
      list = lineBox.list;
      if (!list) {
        end = lineBox.index;
      } else {
        const textBox = list[endTextBox];
        end = textBox.index + endString;
      }
      // 从start到end（不含）的rich存入
      for (let i = 0, len = rich.length; i < len; i++) {
        const r = rich[i];
        if (r.location >= end) {
          break;
        }
        if (r.location + r.length > start) {
          res.push(r);
        }
      }
    }
    // 单光标位置
    else {
      const lineBox = lineBoxList[startLineBox];
      const list = lineBox.list;
      // 空行
      if (!list.length) {
        const r = RICH_INDEX[lineBox.index];
        if (res.indexOf(r) === -1) {
          res.push(r);
        }
      } else {
        // 如果光标在textBox的开头，要取前一个的，除非当前textBox是行首
        const i =
          startString === 0 && startTextBox > 0
            ? startTextBox - 1
            : startTextBox;
        const textBox = list[i];
        const r = RICH_INDEX[textBox.index];
        if (res.indexOf(r) === -1) {
          res.push(r);
        }
      }
    }
    return res;
  }

  get content() {
    return this._content;
  }

  set content(v: string) {
    if (v !== this._content) {
      this._content = v;
      this.root?.addUpdate(
        this,
        [],
        RefreshLevel.REFLOW,
        false,
        false,
        undefined,
      );
    }
  }
}

function equalRich(a: Rich, b: Rich) {
  const keys = [
    'fontFamily',
    'fontSize',
    'lineHeight',
    'letterSpacing',
    'paragraphSpacing',
    'color',
  ];
  for (let i = 0, len = keys.length; i < len; i++) {
    const k = keys[i];
    // @ts-ignore
    const oa = a[k];
    // @ts-ignore
    const ob = b[k];
    if (k === 'color') {
      if (
        oa[0] !== ob[0] ||
        oa[1] !== ob[1] ||
        oa[2] !== ob[2] ||
        oa[3] !== ob[3]
      ) {
        return false;
      }
    } else {
      if (oa !== ob) {
        return false;
      }
    }
  }
  return true;
}

export default Text;
