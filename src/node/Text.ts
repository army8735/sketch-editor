import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { JNode, Override, Rich, TAG_NAME, TextProps } from '../format';
import { calPoint, inverse4 } from '../math/matrix';
import CanvasCache from '../refresh/CanvasCache';
import { RefreshLevel } from '../refresh/level';
import {
  calNormalLineHeight,
  color2rgbaInt,
  color2rgbaStr,
  getBaseline,
  getContentArea,
  setFontStyle,
} from '../style/css';
import {
  ComputedGradient,
  ComputedPattern,
  GRADIENT,
  MIX_BLEND_MODE,
  PATTERN_FILL_TYPE,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
  Style,
  StyleUnit,
  TEXT_ALIGN,
  TEXT_DECORATION,
  TEXT_VERTICAL_ALIGN,
} from '../style/define';
import font from '../style/font';
import Event from '../util/Event';
import inject, { OffScreen } from '../util/inject';
import { clone } from '../util/util';
import { LayoutData } from './layout';
import LineBox from './LineBox';
import Node from './Node';
import TextBox from './TextBox';
import { getConic, getLinear, getRadial } from '../style/gradient';
import { getCanvasGCO } from '../style/mbm';

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
  // 查看是否有换行，防止字符串过长indexOf无效查找
  for (let i = start, len = start + hypotheticalNum; i < len; i++) {
    if (content.charAt(i) === '\n') {
      hypotheticalNum = i - start; // 遇到换行数量变化，不包含换行，强制newLine为false，换行在主循环
      rw = ctx.measureText(content.slice(start, start + hypotheticalNum)).width;
      newLine = false;
      break;
    }
  }
  // 末尾是英文或数字时，本行前面有空格或者CJK，需要把末尾英文数字放到下一行
  if ((start + hypotheticalNum) < length &&
    /[\w.-]/.test(content.charAt(start + hypotheticalNum - 1))) {
    for (let i = start + hypotheticalNum - 2; i > start; i--) {
      if (!/[\w.-]/.test(content.charAt(i))) {
        hypotheticalNum = i - start + 1;
        rw = ctx.measureText(content.slice(start, start + hypotheticalNum)).width;
        newLine = true;
        break;
      }
    }
  }
  // 下一个字符是回车，强制忽略换行，外层循环识别
  else if (content.charAt(start + hypotheticalNum) === '\n') {
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

type Loader = {
  error: boolean;
  loading: boolean;
  source?: HTMLImageElement;
  width: number;
  height: number;
};

class Text extends Node {
  _content: string;
  rich: Rich[];
  lineBoxList: LineBox[];
  tempCursorX: number; // 上一次手动指定的光标x相对坐标，键盘上下移动时保持定位
  currentCursorX: number; // 当前光标x相对坐标，滚动画布时需要获取这个缓存
  cursor: Cursor; // 光标信息
  showSelectArea: boolean;
  asyncRefresh: boolean;
  loaders: Loader[];
  // textBehaviour: TEXT_BEHAVIOUR;

  constructor(props: TextProps) {
    super(props);
    this.isText = true;
    this._content = props.content;
    this.rich = props.rich || [];
    // this.textBehaviour = props.textBehaviour ?? TEXT_BEHAVIOUR.FLEXIBLE;
    this.lineBoxList = [];
    this.tempCursorX = 0;
    this.currentCursorX = 0;
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
    this.loaders = [];
  }

  override lay(data: LayoutData) {
    super.lay(data);
    const { rich, style, computedStyle, _content: content, lineBoxList } = this;
    // const autoW = textBehaviour === TEXT_BEHAVIOUR.FLEXIBLE;
    // const autoH = textBehaviour !== TEXT_BEHAVIOUR.FIXED_SIZE;
    const {
      left,
      right,
      top,
      bottom,
      width,
      height,
    } = style;
    const autoW = width.u === StyleUnit.AUTO
      && (left.u === StyleUnit.AUTO || right.u === StyleUnit.AUTO);
    const autoH = height.u === StyleUnit.AUTO
      && (top.u === StyleUnit.AUTO || bottom.u === StyleUnit.AUTO);
    let i = 0;
    let length = content.length;
    let perW: number;
    let letterSpacing: number;
    let paragraphSpacing: number;
    let lineHeight: number;
    let baseline: number;
    let contentArea: number;
    let fontFamily: string;
    let fontSize: number;
    let color: string;
    let textDecoration: TEXT_DECORATION[] = [];
    let maxW = 0;
    let x = 0,
      y = 0;
    // 富文本每串不同的需要设置字体测量，这个索引记录每个rich块首字符的start索引，在遍历时到这个字符则重设
    const SET_FONT_INDEX: number[] = [];
    if (rich.length) {
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
    }
    else {
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
                  !rich.length &&
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
    if (rich.length) {
      const first = rich[0];
      letterSpacing = first.letterSpacing;
      paragraphSpacing = first.paragraphSpacing;
      perW = first.fontSize * 0.8 + letterSpacing;
      lineHeight = first.lineHeight;
      baseline = getBaseline(first);
      contentArea = getContentArea(first);
      fontFamily = first.fontFamily;
      fontSize = first.fontSize;
      color = color2rgbaStr(first.color);
      textDecoration = first.textDecoration || [];
      if (!lineHeight) {
        lineHeight = calNormalLineHeight(first);
        baseline += lineHeight * 0.5;
        contentArea += lineHeight * 0.5;
      }
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
      contentArea = getContentArea(computedStyle);
      fontFamily = computedStyle.fontFamily;
      fontSize = computedStyle.fontSize;
      color = color2rgbaStr(computedStyle.color);
      textDecoration = computedStyle.textDecoration || [];
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
      if (i && setFontIndex) {
        const cur = rich[setFontIndex];
        letterSpacing = cur.letterSpacing;
        paragraphSpacing = cur.paragraphSpacing;
        perW = cur.fontSize * 0.8 + letterSpacing;
        lineHeight = cur.lineHeight;
        baseline = getBaseline(cur);
        contentArea = getContentArea(cur);
        fontFamily = cur.fontFamily;
        fontSize = cur.fontSize;
        color = color2rgbaStr(cur.color);
        textDecoration = cur.textDecoration || [];
        if (!lineHeight) {
          lineHeight = calNormalLineHeight(cur);
          baseline += lineHeight * 0.5;
          contentArea += lineHeight * 0.5;
        }
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
      if (rich.length) {
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
        contentArea,
        i,
        content.slice(i, i + num),
        ctx.font,
        fontFamily,
        fontSize,
        color,
        letterSpacing,
        textDecoration,
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
      }
      else {
        x += rw;
      }
    }
    // 最后一行对齐，以及最后一行循环里没算要再算一次
    lineBox.verticalAlign();
    maxW = Math.max(maxW, lineBox.w);
    if (letterSpacing && letterSpacing < 0) {
      maxW -= letterSpacing;
    }
    /**
     * 文字排版定位非常特殊的地方，本身在sketch中有frame的rect属性标明矩形包围框的x/y/w/h，理想情况下按此即可，
     * 但可能存在字体缺失、末尾空格忽略不换行、环境测量精度不一致等问题，这样canvas计算排版后可能与rect不一致，
     * 所以在转换过程中，文字的尺寸在非固定情况下会变成auto，在Node的lay()中auto会被计算为min值0.5。
     * 根据差值，以及是否固定宽高，将这些差值按照是否固定上下左右的不同，追加到定位数据上。
     * 另外编辑文字修改内容后，新的尺寸肯定和老的rect不一致，差值修正的逻辑正好被复用做修改后重排版。
     */
    if (autoW) {
      const d = maxW - this.width;
      if (d) {
        this.width = computedStyle.width = maxW;
        const { left, right } = style;
        if (left.u !== StyleUnit.AUTO && right.u !== StyleUnit.AUTO) {}
        else if (left.u !== StyleUnit.AUTO) {
          computedStyle.right -= d;
        }
        else if (right.u !== StyleUnit.AUTO) {
          computedStyle.left -= d;
        }
      }
    }
    if (autoH) {
      const h = lineBox.y + lineBox.lineHeight;
      const d = h - this.height;
      if (d) {
        this.height = computedStyle.height = h;
        const { top, bottom } = style;
        if (top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO) {}
        else if (top.u !== StyleUnit.AUTO) {
          computedStyle.bottom -= d;
        }
        else if (bottom.u !== StyleUnit.AUTO) {
          computedStyle.top -= d;
        }
      }
    }
    // 水平非左对齐偏移
    const textAlign = computedStyle.textAlign;
    if (textAlign === TEXT_ALIGN.CENTER) {
      for (let i = 0, len = lineBoxList.length; i < len; i++) {
        const lineBox = lineBoxList[i];
        const d = this.width - lineBox.w;
        if (d) {
          lineBox.offsetX(d * 0.5);
        }
      }
    }
    else if (textAlign === TEXT_ALIGN.RIGHT) {
      for (let i = 0, len = lineBoxList.length; i < len; i++) {
        const lineBox = lineBoxList[i];
        const d = this.width - lineBox.w;
        if (d) {
          lineBox.offsetX(d);
        }
      }
    }
    // 垂直对齐偏移
    const dh = this.height - lineBox.y - lineBox.lineHeight;
    if (dh) {
      const textVerticalAlign = computedStyle.textVerticalAlign;
      if (textVerticalAlign === TEXT_VERTICAL_ALIGN.MIDDLE) {
        for (let i = 0, len = lineBoxList.length; i < len; i++) {
          const lineBox = lineBoxList[i];
          lineBox.offsetY(dh * 0.5);
        }
      }
      else if (textVerticalAlign === TEXT_VERTICAL_ALIGN.BOTTOM) {
        for (let i = 0, len = lineBoxList.length; i < len; i++) {
          const lineBox = lineBoxList[i];
          lineBox.offsetY(dh);
        }
      }
    }
  }

  override calContent(): boolean {
    return (this.hasContent = !!this._content);
  }

  override renderCanvas(scale: number) {
    super.renderCanvas(scale);
    const bbox = this._bbox2 || this.bbox2;
    const x = bbox[0],
      y = bbox[1];
    let w = bbox[2] - x,
      h = bbox[3] - y;
    const dx = -x * scale,
      dy = -y * scale;
    w *= scale;
    h *= scale;
    const { rich, computedStyle, lineBoxList } = this;
    const canvasCache = (this.canvasCache = CanvasCache.getInstance(w, h, dx, dy));
    canvasCache.available = true;
    const list = canvasCache.list;
    // 如果处于选择范围状态，渲染背景
    if (this.showSelectArea) {
      for (let i = 0, len = list.length; i < len; i++) {
        const { x, y, os: { ctx } } = list[i];
        ctx.fillStyle = '#f4d3c1';
        const cursor = this.cursor;
        // 单行多行区分开
        if (cursor.startLineBox === cursor.endLineBox) {
          const lineBox = lineBoxList[cursor.startLineBox];
          const list = lineBox.list;
          let textBox = list[cursor.startTextBox];
          let x1 = textBox.x * scale + dx;
          ctx.font = textBox.font;
          x1 +=
            ctx.measureText(textBox.str.slice(0, cursor.startString)).width *
            scale;
          textBox = list[cursor.endTextBox];
          let x2 = textBox.x * scale + dx;
          ctx.font = textBox.font;
          x2 +=
            ctx.measureText(textBox.str.slice(0, cursor.endString)).width * scale;
          // 反向api自动支持了
          ctx.fillRect(
            x1,
            lineBox.y * scale + dy,
            x2 - x1,
            lineBox.lineHeight * scale,
          );
        }
        else {
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
            let x1 = textBox.x * scale + dx;
            ctx.font = textBox.font;
            x1 +=
              ctx.measureText(textBox.str.slice(0, startString)).width * scale;
            ctx.fillRect(
              x1,
              lineBox.y * scale + dy,
              lineBox.w * scale - x1,
              lineBox.lineHeight * scale,
            );
          }
          // 中间循环
          for (let i = startLineBox + 1, len = endLineBox; i < len; i++) {
            const lineBox = lineBoxList[i];
            if (lineBox.list.length) {
              ctx.fillRect(
                lineBox.list[0].x * scale + dx,
                lineBox.y * scale + dy,
                lineBox.w * scale,
                lineBox.lineHeight * scale,
              );
            }
          }
          // 最后尾行
          lineBox = lineBoxList[endLineBox];
          list = lineBox.list;
          textBox = list[endTextBox];
          if (textBox) {
            let x1 = textBox.x * scale + dx;
            ctx.font = textBox.font;
            let x2 =
              ctx.measureText(textBox.str.slice(0, endString)).width * scale + dx;
            ctx.fillRect(x1, lineBox.y * scale + dy, x2, lineBox.lineHeight * scale);
          }
        }
      }
    }
    // 富文本每串不同的需要设置字体颜色
    const SET_COLOR_INDEX: { index: number; color: string }[] = [];
    let color: string;
    // 如果有fill，原本的颜色失效，sketch多个fill还将忽略颜色的alpha，这里都忽略
    let hasFill = false;
    const {
      fill,
      fillOpacity,
      fillEnable,
      fillMode,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
    } = computedStyle;
    for (let i = 0, len = fill.length; i < len; i++) {
      if (fillEnable[i] && fillOpacity[i]) {
        hasFill = true;
        break;
      }
    }

    // fill/stroke复用
    function draw(ctx: CanvasRenderingContext2D, isFillOrStroke = true) {
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
          const textDecoration = textBox.textDecoration;
          setFontAndLetterSpacing(ctx, textBox, scale);
          if (isFillOrStroke) {
            ctx.fillText(
              textBox.str,
              textBox.x * scale + dx,
              (textBox.y + textBox.baseline) * scale + dy,
            );
            if (textDecoration.length) {
              textDecoration.forEach(item => {
                if (item === TEXT_DECORATION.UNDERLINE) {
                  ctx.fillRect(
                    textBox.x,
                    (textBox.y + textBox.contentArea - 1.5) * scale + dy,
                    textBox.w * scale,
                    3 * scale,
                  );
                }
                else if (item === TEXT_DECORATION.LINE_THROUGH) {
                  ctx.fillRect(
                    textBox.x,
                    (textBox.y + textBox.lineHeight * 0.5 - 1.5) * scale + dy,
                    textBox.w * scale,
                    3 * scale,
                  );
                }
              });
            }
          }
          else {
            ctx.strokeText(
              textBox.str,
              textBox.x * scale + dx,
              (textBox.y + textBox.baseline) * scale + dy,
            );
            if (textDecoration.length) {
              textDecoration.forEach(item => {
                if (item === TEXT_DECORATION.UNDERLINE) {
                  ctx.strokeRect(
                    textBox.x,
                    (textBox.y + textBox.contentArea - 1.5) * scale + dy,
                    textBox.w * scale,
                    3 * scale,
                  );
                }
                else if (item === TEXT_DECORATION.LINE_THROUGH) {
                  ctx.strokeRect(
                    textBox.x,
                    (textBox.y + textBox.lineHeight * 0.5 - 1.5) * scale + dy,
                    textBox.w * scale,
                    3 * scale,
                  );
                }
              });
            }
          }
        }
      }
    }

    for (let i = 0, len = list.length; i < len; i++) {
      const { x, y, os: { ctx } } = list[i];
      // fill就用普通颜色绘制，每个fill都需绘制一遍
      if (hasFill) {
        for (let i = 0, len = fill.length; i < len; i++) {
          if (!fillEnable[i] || !fillOpacity[i]) {
            continue;
          }
          let f = fill[i];
          // 椭圆的径向渐变无法直接完成，用mask来模拟，即原本用纯色填充，然后离屏绘制渐变并用matrix模拟椭圆，再合并
          let ellipse: OffScreen | undefined;
          const mode = fillMode[i];
          ctx.globalAlpha = fillOpacity[i];
          if (Array.isArray(f)) {
            if (!f[3]) {
              continue;
            }
            ctx.fillStyle = color2rgbaStr(f);
          }
          // 非纯色
          else {
            // 图像填充
            if ((f as ComputedPattern).url !== undefined) {
              f = f as ComputedPattern;
              const url = f.url;
              if (url) {
                let loader = this.loaders[i];
                const cache = inject.IMG[url];
                // 已有的图像同步直接用
                if (!loader && cache) {
                  loader = this.loaders[i] = {
                    error: false,
                    loading: false,
                    width: cache.width,
                    height: cache.height,
                    source: cache.source,
                  };
                }
                if (loader) {
                  if (!loader.error && !loader.loading) {
                    const width = this.width;
                    const height = this.height;
                    const wc = width * scale;
                    const hc = height * scale;
                    // 裁剪到范围内，text没有points概念，使用混合模拟mask来代替
                    const os = inject.getOffscreenCanvas(w, h);
                    const ctx2 = os.ctx;
                    if (f.type === PATTERN_FILL_TYPE.TILE) {
                      const ratio = f.scale ?? 1;
                      for (let i = 0, len = Math.ceil(width / ratio / loader.width); i < len; i++) {
                        for (let j = 0, len = Math.ceil(height / ratio / loader.height); j < len; j++) {
                          ctx2.drawImage(
                            loader.source!,
                            dx + i * loader.width * scale * ratio,
                            dy + j * loader.height * scale * ratio,
                            loader.width * scale * ratio,
                            loader.height * scale * ratio,
                          );
                        }
                      }
                    }
                    else if (f.type === PATTERN_FILL_TYPE.FILL) {
                      const sx = wc / loader.width;
                      const sy = hc / loader.height;
                      const sc = Math.max(sx, sy);
                      const x = (loader.width * sc - wc) * -0.5;
                      const y = (loader.height * sc - hc) * -0.5;
                      ctx2.drawImage(loader.source!, 0, 0, loader.width, loader.height,
                        x + dx, y + dy, loader.width * sc, loader.height * sc);
                    }
                    else if (f.type === PATTERN_FILL_TYPE.STRETCH) {
                      ctx2.drawImage(loader.source!, dx, dy, wc, hc);
                    }
                    else if (f.type === PATTERN_FILL_TYPE.FIT) {
                      const sx = wc / loader.width;
                      const sy = hc / loader.height;
                      const sc = Math.min(sx, sy);
                      const x = (loader.width * sc - wc) * -0.5;
                      const y = (loader.height * sc - hc) * -0.5;
                      ctx2.drawImage(loader.source!, 0, 0, loader.width, loader.height,
                        x + dx, y + dy, loader.width * sc, loader.height * sc);
                    }
                    // 先离屏混合只展示text部分
                    ctx2.fillStyle = '#FFF';
                    ctx2.globalCompositeOperation = 'destination-in';
                    draw(ctx2, true);
                    ctx2.globalCompositeOperation = 'source-over';
                    if (mode !== MIX_BLEND_MODE.NORMAL) {
                      ctx.globalCompositeOperation = getCanvasGCO(mode);
                    }
                    ctx.drawImage(os.canvas, 0, 0);
                    if (mode !== MIX_BLEND_MODE.NORMAL) {
                      ctx.globalCompositeOperation = 'source-over';
                    }
                    os.release();
                  }
                }
                else {
                  loader = this.loaders[i] = this.loaders[i] || {
                    error: false,
                    loading: true,
                    width: 0,
                    height: 0,
                    source: undefined,
                  };
                  inject.measureImg(url, (data: any) => {
                    // 可能会变更，所以加载完后对比下是不是当前最新的
                    if (url === (fill[i] as ComputedPattern)?.url) {
                      loader.loading = false;
                      if (data.success) {
                        loader.error = false;
                        loader.source = data.source;
                        loader.width = data.width;
                        loader.height = data.height;
                        if (!this.isDestroyed) {
                          this.root!.addUpdate(
                            this,
                            [],
                            RefreshLevel.REPAINT,
                            false,
                            false,
                            undefined,
                          );
                        }
                      }
                      else {
                        loader.error = true;
                      }
                    }
                  });
                }
              }
              continue;
            }
            // 渐变
            else {
              f = f as ComputedGradient;
              if (f.t === GRADIENT.LINEAR) {
                const gd = getLinear(f.stops, f.d, dx, dy, w - dx * 2, h - dy * 2);
                const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
                gd.stop.forEach((item) => {
                  lg.addColorStop(item.offset!, color2rgbaStr(item.color));
                });
                ctx.fillStyle = lg;
              }
              else if (f.t === GRADIENT.RADIAL) {
                const gd = getRadial(f.stops, f.d, dx, dy, w - dx * 2, h - dy * 2);
                const rg = ctx.createRadialGradient(
                  gd.cx,
                  gd.cy,
                  0,
                  gd.cx,
                  gd.cy,
                  gd.total,
                );
                gd.stop.forEach((item) => {
                  rg.addColorStop(item.offset!, color2rgbaStr(item.color));
                });
                // 椭圆渐变，由于有缩放，用混合模式确定绘制范围，然后缩放长短轴绘制椭圆
                const m = gd.matrix;
                if (m) {
                  ellipse = inject.getOffscreenCanvas(w, h);
                  const ctx2 = ellipse.ctx;
                  ctx2.fillStyle = '#FFF';
                  draw(ctx2, true);
                  ctx2.globalCompositeOperation = 'source-in';
                  ctx2.fillStyle = rg;
                  ctx2.setTransform(m[0], m[1], m[4], m[5], m[12], m[13]);
                  ctx2.fillRect(0, 0, w, h);
                }
                else {
                  ctx.fillStyle = rg;
                }
              }
              else if (f.t === GRADIENT.CONIC) {
                const gd = getConic(f.stops, f.d, dx, dy, w - dx * 2, h - dy * 2);
                const cg = ctx.createConicGradient(gd.angle, gd.cx, gd.cy);
                gd.stop.forEach((item) => {
                  cg.addColorStop(item.offset!, color2rgbaStr(item.color));
                });
                ctx.fillStyle = cg;
              }
            }
          }
          if (mode !== MIX_BLEND_MODE.NORMAL) {
            ctx.globalCompositeOperation = getCanvasGCO(mode);
          }
          if (ellipse) {
            ctx.drawImage(ellipse.canvas, 0, 0);
            ellipse.release();
          }
          else {
            draw(ctx, true);
          }
          if (mode !== MIX_BLEND_MODE.NORMAL) {
            ctx.globalCompositeOperation = 'source-over';
          }
        }
      }
      // 普通颜色
      else {
        // 富文本记录索引开始对应的颜色
        if (rich.length) {
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
          ctx.fillStyle = color;
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
            const textDecoration = textBox.textDecoration;
            // textBox的分隔一定是按rich的，用字符索引来获取颜色
            const index = textBox.index;
            if (SET_COLOR_INDEX.length && index >= SET_COLOR_INDEX[0].index) {
              const cur = SET_COLOR_INDEX.shift()!;
              color = color2rgbaStr(cur.color);
              ctx.fillStyle = color;
            }
            setFontAndLetterSpacing(ctx, textBox, scale);
            ctx.fillText(
              textBox.str,
              textBox.x * scale + dx,
              (textBox.y + textBox.baseline) * scale + dy,
            );
            if (textDecoration.length) {
              textDecoration.forEach(item => {
                if (item === TEXT_DECORATION.UNDERLINE) {
                  ctx.fillRect(
                    textBox.x * scale + dx,
                    (textBox.y + textBox.contentArea - 1.5) * scale + dy,
                    textBox.w * scale,
                    3 * scale,
                  );
                }
                else if (item === TEXT_DECORATION.LINE_THROUGH) {
                  ctx.fillRect(
                    textBox.x * scale + dx,
                    (textBox.y + textBox.lineHeight * 0.5 - 1.5) * scale + dy,
                    textBox.w * scale,
                    3 * scale,
                  );
                }
              });
            }
          }
        }
      }
      // fill有opacity和mode，设置记得还原
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // 利用canvas的能力绘制shadow
      const { innerShadow, innerShadowEnable } = this.computedStyle;
      if (innerShadow && innerShadow.length) {
        let hasInnerShadow = false;
        const os2 = inject.getOffscreenCanvas(w, h);
        const ctx2 = os2.ctx;
        ctx2.fillStyle = '#FFF';
        let n = 0;
        innerShadow.forEach((item, i) => {
          if (!innerShadowEnable[i]) {
            return;
          }
          hasInnerShadow = true;
          const m =
            (Math.max(Math.abs(item.x), Math.abs(item.y)) + item.spread) * scale;
          n = Math.max(n, m + item.blur * scale);
        });
        if (hasInnerShadow) {
          // 类似普通绘制文字的循环，只是颜色统一
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
              setFontAndLetterSpacing(ctx2, textBox, scale);
              ctx2.fillText(
                textBox.str,
                textBox.x * scale + dx,
                (textBox.y + textBox.baseline) * scale + dy,
              );
            }
          }
          // 反向，即文字部分才是透明，形成一张位图
          ctx2.globalCompositeOperation = 'source-out';
          ctx2.fillRect(-n, -n, w + n, h + n);
          // 将这个位图设置shadow绘制到另外一个位图上
          const os3 = inject.getOffscreenCanvas(w, h);
          const ctx3 = os3.ctx;
          innerShadow.forEach((item, i) => {
            if (!innerShadowEnable[i]) {
              return;
            }
            ctx3.shadowOffsetX = item.x * scale;
            ctx3.shadowOffsetY = item.y * scale;
            ctx3.shadowColor = color2rgbaStr(item.color);
            ctx3.shadowBlur = item.blur * scale;
            ctx3.drawImage(os2.canvas, 0, 0);
          });
          // 再次利用混合模式把shadow返回，注意只保留文字重合部分
          ctx.globalCompositeOperation = 'source-atop';
          ctx.drawImage(os3.canvas, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
          os2.release();
          os3.release();
        }
      }
      // stroke文字，fill设置透明即可，但位置需要用到裁剪
      if (scale !== 1) {
        ctx.setLineDash(strokeDasharray.map((i) => i * scale));
      }
      else {
        ctx.setLineDash(strokeDasharray);
      }
      if (strokeLinecap === STROKE_LINE_CAP.ROUND) {
        ctx.lineCap = 'round';
      }
      else if (strokeLinecap === STROKE_LINE_CAP.SQUARE) {
        ctx.lineCap = 'square';
      }
      else {
        ctx.lineCap = 'butt';
      }
      if (strokeLinejoin === STROKE_LINE_JOIN.ROUND) {
        ctx.lineJoin = 'round';
      }
      else if (strokeLinejoin === STROKE_LINE_JOIN.BEVEL) {
        ctx.lineJoin = 'bevel';
      }
      else {
        ctx.lineJoin = 'miter';
      }
      // 强制1
      ctx.miterLimit = 1;
      ctx.fillStyle = 'transparent';
      for (let i = 0, len = stroke.length; i < len; i++) {
        if (!strokeEnable[i] || !strokeWidth[i]) {
          continue;
        }
        const s = stroke[i];
        const p = strokePosition[i];
        ctx.globalCompositeOperation = getCanvasGCO(strokeMode[i]);
        // 颜色
        if (Array.isArray(s)) {
          ctx.strokeStyle = color2rgbaStr(s);
        }
        // 或者渐变
        else {
          if (s.t === GRADIENT.LINEAR) {
            const gd = getLinear(s.stops, s.d, dx, dy, w - dx * 2, h - dy * 2);
            const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
            gd.stop.forEach((item) => {
              lg.addColorStop(item.offset!, color2rgbaStr(item.color));
            });
            ctx.strokeStyle = lg;
          }
          else if (s.t === GRADIENT.RADIAL) {
            const gd = getRadial(s.stops, s.d, dx, dy, w - dx * 2, h - dy * 2);
            const rg = ctx.createRadialGradient(
              gd.cx,
              gd.cy,
              0,
              gd.cx,
              gd.cy,
              gd.total,
            );
            gd.stop.forEach((item) => {
              rg.addColorStop(item.offset!, color2rgbaStr(item.color));
            });
            const m = gd.matrix;
            if (m) {
              const ellipse = inject.getOffscreenCanvas(w, h);
              const ctx2 = ellipse.ctx;
              ctx2.setLineDash(ctx.getLineDash());
              ctx2.lineCap = ctx.lineCap;
              ctx2.lineJoin = ctx.lineJoin;
              ctx2.miterLimit = ctx.miterLimit * scale;
              ctx2.lineWidth = strokeWidth[i] * scale;
              if (p === STROKE_POSITION.INSIDE || p === STROKE_POSITION.OUTSIDE) {
                ctx2.fillStyle = '#FFF';
                draw(ctx2, true);
                ctx2.lineWidth = strokeWidth[i] * 2 * scale;
                ctx2.strokeStyle = '#FFF';
                if (p === STROKE_POSITION.INSIDE) {
                  ctx2.globalCompositeOperation = 'source-in';
                }
                else {
                  ctx2.globalCompositeOperation = 'source-out';
                }
                draw(ctx2, false);
              }
              else {
                ctx2.lineWidth = strokeWidth[i] * scale;
                ctx2.strokeStyle = '#FFF';
                draw(ctx2, false);
              }
              ctx2.globalCompositeOperation = 'source-in';
              ctx2.setTransform(m[0], m[1], m[4], m[5], m[12], m[13]);
              ctx2.fillStyle = rg;
              ctx2.fillRect(0, 0, w, h);
              ctx.drawImage(ellipse.canvas, 0, 0);
              ellipse.release();
              continue;
            }
            else {
              ctx.strokeStyle = rg;
            }
          }
          else if (s.t === GRADIENT.CONIC) {
            const gd = getConic(s.stops, s.d, dx, dy, w - dx * 2, h - dy * 2);
            const cg = ctx.createConicGradient(gd.angle, gd.cx, gd.cy);
            gd.stop.forEach((item) => {
              cg.addColorStop(item.offset!, color2rgbaStr(item.color));
            });
            ctx.strokeStyle = cg;
          }
        }
        // 注意canvas只有居中描边，内部外部需离屏擦除
        let os: OffScreen | undefined, ctx2: CanvasRenderingContext2D | undefined;
        if (p === STROKE_POSITION.INSIDE || p === STROKE_POSITION.OUTSIDE) {
          os = inject.getOffscreenCanvas(w, h);
          ctx2 = os.ctx;
          ctx2.setLineDash(ctx.getLineDash());
          ctx2.lineCap = ctx.lineCap;
          ctx2.lineJoin = ctx.lineJoin;
          ctx2.miterLimit = ctx.miterLimit * scale;
          ctx2.strokeStyle = ctx.strokeStyle;
          ctx2.lineWidth = strokeWidth[i] * 2 * scale;
          ctx2.lineWidth = strokeWidth[i] * 2 * scale;
          ctx2.fillStyle = '#FFF';
          draw(ctx2, false);
          const os3 = inject.getOffscreenCanvas(w, h);
          const ctx3 = os3.ctx;
          ctx3.fillStyle = '#FFF';
          draw(ctx3, true);
          if (p === STROKE_POSITION.INSIDE) {
            ctx2.globalCompositeOperation = 'destination-in';
          }
          else {
            ctx2.globalCompositeOperation = 'destination-out';
          }
          ctx2.drawImage(os3.canvas, 0, 0);
          os3.release();
        }
        else {
          ctx.lineWidth = strokeWidth[i] * scale;
          draw(ctx, false);
        }
        if (os) {
          ctx.drawImage(os.canvas, 0, 0);
          os.release();
        }
        // 还原
        ctx.globalCompositeOperation = 'source-over';
      }

      list[i].os.canvas.toBlob(blob => {
        if (blob) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(blob);
          document.body.appendChild(img);
        }
      });
    }
  }

  // 根据绝对坐标获取光标位置，同时设置开始光标位置
  setCursorStartByAbsCoord(x: number, y: number) {
    const m = this.matrixWorld;
    const im = inverse4(m);
    const local = calPoint({ x, y }, im);
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
        this.tempCursorX = this.currentCursorX = res.x;
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
    this.tempCursorX = this.currentCursorX = res.x;
    const p = calPoint({ x: res.x, y: res.y }, m);
    return {
      x: p.x,
      y: p.y,
      h: res.h * m[0],
    };
  }

  // 设置结束光标位置
  setCursorEndByAbsCoord(x: number, y: number) {
    const m = this.matrixWorld;
    const im = inverse4(m);
    const local = calPoint({ x: x, y: y }, im);
    const lineBoxList = this.lineBoxList;
    const cursor = this.cursor;
    const { endLineBox: i, endTextBox: j, endString: k } = cursor;
    cursor.isMulti = true;
    const len = lineBoxList.length;
    for (let m = 0; m < len; m++) {
      const lineBox = lineBoxList[m];
      // 确定y在哪一行后
      if (local.y >= lineBox.y && local.y < lineBox.y + lineBox.h) {
        cursor.endLineBox = m;
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
    if (this.showSelectArea) {
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
  }

  /**
   * 改变内容影响定位尺寸前防止中心对齐导致位移，一般情况是left%+translateX:-50%（水平方向，垂直同理），
   * 先记录此时style，再将left换算成translateX为0的值，为了兼容translateX是任意非零%值。
   * 一般状态下左对齐，将left变为px绝对值，这样内容改变重新排版的时候x坐标就不变，结束后还原回来。
   * 首要考虑textAlign，它的优先级高于对应方位的布局信息（比如居右对齐即便left是px都忽略，强制右侧对齐，视觉不懂css布局）。
   */
  private beforeEdit() {
    const {
      style,
      computedStyle,
      parent,
      isDestroyed,
      // textBehaviour,
      width: w,
      height: h,
    } = this;
    if (isDestroyed || !parent) {
      throw new Error('Can not edit a destroyed Text');
    }
    const prev = this.getStyle();
    const {
      left,
      right,
      top,
      bottom,
      width,
      height,
      translateX,
      translateY,
      textAlign,
      textVerticalAlign,
    } = style;
    // 非固定尺寸时，需还原tx到left/right上
    const isFixedWidth = left.u !== StyleUnit.AUTO && right.u !== StyleUnit.AUTO
      || width.u !== StyleUnit.AUTO;
    const isLeft = textAlign.v === TEXT_ALIGN.LEFT
      // && textBehaviour === TEXT_BEHAVIOUR.FLEXIBLE
      && !isFixedWidth
      && (
        left.u !== StyleUnit.AUTO
          && translateX.v
          && translateX.u === StyleUnit.PERCENT // 一般情况
        || right.u !== StyleUnit.AUTO // 特殊情况，虽然right定位了，但是左对齐，视觉只会认为应该右边不变
      );
    // 类似left，但考虑translate是否-50%，一般都是，除非人工脏数据
    const isCenter = textAlign.v === TEXT_ALIGN.CENTER
      // && textBehaviour === TEXT_BEHAVIOUR.FLEXIBLE
      && !isFixedWidth
      && (translateX.v !== -50 || translateX.u !== StyleUnit.PERCENT);
    // right比较绕，定宽或者右定位都无效，提取规则发现需要right为auto
    const isRight = textAlign.v === TEXT_ALIGN.RIGHT
      // && textBehaviour === TEXT_BEHAVIOUR.FLEXIBLE
      && right.u === StyleUnit.AUTO;
    // 同水平
    const isFixedHeight = top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO
      || height.u !== StyleUnit.AUTO;
    const isTop = textVerticalAlign.v === TEXT_VERTICAL_ALIGN.TOP
      // && textBehaviour !== TEXT_BEHAVIOUR.FIXED_SIZE
      && !isFixedHeight
      && (
        top.u !== StyleUnit.AUTO
        && translateY.v
        && translateY.u === StyleUnit.PERCENT
        || bottom.u !== StyleUnit.AUTO
      );
    const isMiddle = textVerticalAlign.v === TEXT_VERTICAL_ALIGN.MIDDLE
      // && textBehaviour !== TEXT_BEHAVIOUR.FIXED_SIZE
      && !isFixedHeight
      && (translateY.v !== -50 || translateY.u !== StyleUnit.PERCENT);
    const isBottom = textVerticalAlign.v === TEXT_VERTICAL_ALIGN.BOTTOM
      // && textBehaviour !== TEXT_BEHAVIOUR.FIXED_SIZE
      && !isFixedHeight
      && bottom.u === StyleUnit.AUTO;
    const { width: pw, height: ph } = parent;
    let impact = false;
    // translateX%且左对齐，如果内容变化影响width会干扰布局
    let tx = 0;
    if (translateX.u === StyleUnit.PX) {
      tx = translateX.v;
    }
    else if (translateX.u === StyleUnit.PERCENT) {
      tx = translateX.v * 0.01 * w;
    }
    if (isLeft) {
      if (left.u !== StyleUnit.AUTO
        && !!translateX.v
        && translateX.u === StyleUnit.PERCENT) {
        impact = true;
        if (left.u === StyleUnit.PX) {
          left.v += tx;
        }
        else if (left.u === StyleUnit.PERCENT) {
          left.v += tx * 100 / pw;
        }
        // 可能是auto，自动宽度，也可能人工数据
        if (right.u === StyleUnit.PX) {
          right.v -= tx;
        }
        else if (right.u === StyleUnit.PERCENT) {
          right.v -= tx * 100 / pw;
        }
      }
      else if (right.u !== StyleUnit.AUTO) {
        impact = true;
        left.v = computedStyle.left + tx;
        left.u = StyleUnit.PX;
        right.v = 0;
        right.u = StyleUnit.AUTO;
      }
      translateX.v = 0;
    }
    else if (isCenter) {
      // auto就是0，除非人工脏数据会px，将不是-50%的变为-50%
      if (translateX.u === StyleUnit.AUTO || translateX.u === StyleUnit.PX) {
        impact = true;
        const dx = w * 0.5 - translateX.v;
        // 左右互斥出现，否则是定宽了
        if (left.u === StyleUnit.PX) {
          left.v += dx;
          translateX.v = -50;
        }
        else if (left.u === StyleUnit.PERCENT) {
          left.v += dx * 100 / pw;
          translateX.v = -50;
        }
        else if (right.u === StyleUnit.PX) {
          right.v += dx;
          translateX.v = 50;
        }
        else if (right.u === StyleUnit.PERCENT) {
          right.v += dx * 100 / pw;
          translateX.v = 50;
        }
        translateX.u = StyleUnit.PERCENT;
      }
      // 一般都是translate:-50%，人工脏数据转换
      else if (translateX.u === StyleUnit.PERCENT) {
        if (translateX.v !== -50) {
          impact = true;
          const tx = w * 0.5 - translateX.v * w;
          if (left.u === StyleUnit.PX) {
            left.v += tx;
            translateX.v = -50;
          }
          else if (left.u === StyleUnit.PERCENT) {
            left.v += tx * 100 / pw;
            translateX.v = -50;
          }
          else if (right.u === StyleUnit.PX) {
            right.v += tx;
            translateX.v = 50;
          }
          else if (right.u === StyleUnit.PERCENT) {
            right.v += tx * 100 / pw;
            translateX.v = 50;
          }
        }
      }
    }
    else if (isRight) {
      impact = true;
      // 有left时right一定是auto，改成left是auto且right是固定
      if (left.u !== StyleUnit.AUTO) {
        left.v = 0;
        left.u = StyleUnit.AUTO;
      }
      // right变为固定值+translate归零，虽然tx是px时无需关心，但统一逻辑最后还原
      right.v = computedStyle.right - tx;
      right.u = StyleUnit.PX;
      translateX.v = 0;
    }
    // 垂直同理水平
    let ty = 0;
    if (translateY.u === StyleUnit.PX) {
      ty = translateY.v;
    }
    else if (translateY.u === StyleUnit.PERCENT) {
      ty = translateY.v * 0.01 * h;
    }
    if (isTop) {
      if (top.u !== StyleUnit.AUTO
        && !!translateY.v
        && translateY.u === StyleUnit.PERCENT) {
        impact = true;
        if (top.u === StyleUnit.PX) {
          top.v += ty;
        }
        else if (top.u === StyleUnit.PERCENT) {
          top.v += ty * 100 / ph;
        }
        // 可能是auto，自动宽度，也可能人工数据
        if (bottom.u === StyleUnit.PX) {
          bottom.v -= ty;
        }
        else if (bottom.u === StyleUnit.PERCENT) {
          bottom.v -= ty * 100 / ph;
        }
      }
      else if (bottom.u !== StyleUnit.AUTO) {
        impact = true;
        top.v = computedStyle.top + ty;
        top.u = StyleUnit.PX;
        bottom.v = 0;
        bottom.u = StyleUnit.AUTO;
      }
      translateY.v = 0;
    }
    else if (isMiddle) {
      if (translateY.u === StyleUnit.AUTO || translateY.u === StyleUnit.PX) {
        impact = true;
        const dy = h * 0.5 - translateY.v;
        if (top.u === StyleUnit.PX) {
          top.v += dy;
          translateY.v = -50;
        }
        else if (top.u === StyleUnit.PERCENT) {
          top.v += dy * 100 / ph;
          translateY.v = -50;
        }
        else if (bottom.u === StyleUnit.PX) {
          bottom.v += dy;
          translateY.v = 50;
        }
        else if (bottom.u === StyleUnit.PERCENT) {
          bottom.v += dy * 100 / ph;
          translateY.v = 50;
        }
        translateY.u = StyleUnit.PERCENT;
      }
      else if (translateY.u === StyleUnit.PERCENT) {
        if (translateY.v !== -50) {
          impact = true;
          const dy = h * 0.5 - translateY.v * h;
          if (top.u === StyleUnit.PX) {
            top.v += dy;
            translateY.v = -50;
          }
          else if (top.u === StyleUnit.PERCENT) {
            top.v += dy * 100 / ph;
            translateY.v = -50;
          }
          else if (bottom.u === StyleUnit.PX) {
            bottom.v -= dy;
            translateY.v = 50;
          }
          else if (bottom.u === StyleUnit.PERCENT) {
            bottom.v -= dy * 100 / ph;
            translateY.v = 50;
          }
          translateY.v = -50;
        }
      }
    }
    else if (isBottom) {
      impact = true;
      if (top.u !== StyleUnit.AUTO) {
        top.v = 0;
        top.u = StyleUnit.AUTO;
      }
      bottom.v = computedStyle.bottom - ty;
      bottom.u = StyleUnit.PX;
      translateY.v = 0;
    }
    // 无影响则返回空，结束无需还原
    if (!impact) {
      return;
    }
    return {
      isLeft,
      isCenter,
      isRight,
      isTop,
      isMiddle,
      isBottom,
      prev,
    };
  }

  // 和beforeEdit()对应，可能prev为空即无需关心样式还原问题。
  private afterEdit(payload?: {
    isLeft: boolean,
    isCenter: boolean,
    isRight: boolean,
    isTop: boolean,
    isMiddle: boolean,
    isBottom: boolean,
    prev: Style,
  }) {
    if (!payload) {
      return;
    }
    const {
      isLeft,
      isCenter,
      isRight,
      isTop,
      isMiddle,
      isBottom,
      prev,
    } = payload;
    const {
      style,
      computedStyle,
      parent,
      width: w,
      height: h,
    } = this;
    const {
      left,
      right,
      top,
      bottom,
      translateX,
      translateY,
    } = prev;
    // parent的尺寸没变，自适应要等这个结束之后才会调用
    const { width: pw, height: ph } = parent!;
    let tx = 0;
    if (translateX.u === StyleUnit.PX) {
      tx = translateX.v;
    }
    else if (translateX.u === StyleUnit.PERCENT) {
      tx = translateX.v * 0.01 * w;
    }
    if (isLeft) {
      if (left.u !== StyleUnit.AUTO
        && translateX.v
        && translateX.u === StyleUnit.PERCENT) {
        if (left.u === StyleUnit.PX) {
          style.left.v -= tx;
          computedStyle.left -= tx;
        }
        else if (left.u === StyleUnit.PERCENT) {
          const v = tx * 100 / pw;
          style.left.v -= v;
          computedStyle.left -= tx;
        }
        if (right.u === StyleUnit.PX) {
          style.right.v += tx;
          computedStyle.right += tx;
        }
        else if (right.u === StyleUnit.PERCENT) {
          const v = tx * 100 / pw;
          style.right.v += v;
          computedStyle.right += tx;
        }
        computedStyle.translateX += tx;
      }
      else if (right.u !== StyleUnit.AUTO) {
        style.left.v = 0;
        style.left.u = StyleUnit.AUTO;
        computedStyle.left -= tx;
        style.right.v = right.v;
        style.right.u = right.u;
        computedStyle.right += tx;
      }
      style.translateX.v = translateX.v;
    }
    else if (isCenter) {
      if (translateX.u === StyleUnit.AUTO || translateX.u === StyleUnit.PX) {
        const dx = w * 0.5 - translateX.v;
        if (left.u === StyleUnit.PX) {
          style.left.v -= dx;
        }
        else if (left.u === StyleUnit.PERCENT) {
          style.left.v -= dx * 100 / pw;
        }
        else if (right.u === StyleUnit.PX) {
          style.right.v -= dx;
        }
        else if (right.u === StyleUnit.PERCENT) {
          style.right.v -= dx * 100 / pw;
        }
        style.translateX.v = translateX.v;
        style.translateX.u = translateX.u;
      }
      else if (translateX.u === StyleUnit.PERCENT) {
        if (translateX.v !== -50) {
          const dx = w * 0.5 - translateX.v * w;
          if (left.u === StyleUnit.PX) {
            style.left.v -= dx;
          }
          else if (left.u === StyleUnit.PERCENT) {
            style.left.v -= dx * 100 / pw;
          }
          if (right.u === StyleUnit.PX) {
            style.right.v -= dx;
          }
          else if (right.u === StyleUnit.PERCENT) {
            style.right.v -= dx * 100 / pw;
          }
          style.translateX.v = translateX.v;
        }
      }
    }
    else if (isRight) {
      computedStyle.left -= tx;
      if (left.u === StyleUnit.PX) {
        style.left.v = computedStyle.left;
      }
      else if (left.u === StyleUnit.PERCENT) {
        style.left.v = computedStyle.left * 100 / pw;
      }
      computedStyle.right += tx;
      if (right.u === StyleUnit.AUTO) {
        style.right.v = 0;
        style.right.u = StyleUnit.AUTO;
      }
      style.translateX.v = translateX.v;
      style.translateX.u = translateX.u;
    }
    let ty = 0;
    if (translateY.u === StyleUnit.PX) {
      ty = translateY.v;
    }
    else if (translateY.u === StyleUnit.PERCENT) {
      ty = translateY.v * 0.01 * h;
    }
    if (isTop) {
      if (top.u !== StyleUnit.AUTO
        && translateY.v
        && translateY.u === StyleUnit.PERCENT) {
        if (top.u === StyleUnit.PX) {
          style.top.v -= ty;
          computedStyle.top -= ty;
        }
        else if (top.u === StyleUnit.PERCENT) {
          const v = ty * 100 / ph;
          style.top.v -= v;
          computedStyle.top -= ty;
        }
        if (bottom.u === StyleUnit.PX) {
          style.bottom.v += ty;
          computedStyle.bottom += ty;
        }
        else if (bottom.u === StyleUnit.PERCENT) {
          const v = ty * 100 / ph;
          style.bottom.v += v;
          computedStyle.bottom += ty;
        }
      }
      else if (bottom.u !== StyleUnit.AUTO) {
        style.top.v = 0;
        style.top.u = StyleUnit.AUTO;
        computedStyle.top -= ty;
        style.bottom.v = bottom.v;
        style.bottom.u = bottom.u;
        computedStyle.bottom += ty;
      }
      style.translateY.v = translateY.v;
      computedStyle.translateY += ty;
    }
    else if (isMiddle) {
      if (translateY.u === StyleUnit.AUTO || translateY.u === StyleUnit.PX) {
        const dy = h * 0.5 - translateY.v;
        if (top.u === StyleUnit.PX) {
          style.top.v -= dy;
        }
        else if (top.u === StyleUnit.PERCENT) {
          style.top.v -= dy * 100 / ph;
        }
        else if (bottom.u === StyleUnit.PX) {
          style.bottom.v -= dy;
        }
        else if (bottom.u === StyleUnit.PERCENT) {
          style.bottom.v -= dy * 100 / ph;
        }
        style.translateY.v = translateY.v;
        style.translateY.u = StyleUnit.PX;
      }
      else if (translateY.u === StyleUnit.PERCENT) {
        if (translateY.v !== -50) {
          const dy = h * 0.5 - translateY.v * h;
          if (top.u === StyleUnit.PX) {
            style.top.v -= dy;
          }
          else if (top.u === StyleUnit.PERCENT) {
            style.top.v -= dy * 100 / ph;
          }
          else if (bottom.u === StyleUnit.PX) {
            style.bottom.v -= dy;
          }
          else if (bottom.u === StyleUnit.PERCENT) {
            style.bottom.v -= dy * 100 / ph;
          }
          style.translateY.v = translateY.v;
        }
      }
    }
    else if (isBottom) {
      computedStyle.top -= ty;
      if (top.u === StyleUnit.PX) {
        style.top.v = computedStyle.top;
      }
      else if (top.u === StyleUnit.PERCENT) {
        style.top.v = computedStyle.top * 100 / ph;
      }
      computedStyle.bottom += ty;
      if (bottom.u === StyleUnit.AUTO) {
        style.bottom.v = 0;
        style.bottom.u = StyleUnit.AUTO;
      }
      style.translateY.v = translateY.v;
      style.translateY.u = translateY.u;
    }
  }

  // 根据字符串索引更新光标
  private updateCursorByIndex(index: number) {
    const { lineBox, textBox } = this.setCursorByIndex(index, false);
    const { cursor, matrixWorld } = this;
    // 是否空行
    if (textBox) {
      const ctx = inject.getFontCanvas().ctx;
      ctx.font = textBox.font;
      // @ts-ignore
      ctx.letterSpacing = textBox.letterSpacing;
      const str = textBox.str;
      const w = ctx.measureText(str.slice(0, cursor.startString)).width;
      this.tempCursorX = this.currentCursorX = textBox.x + w;
    }
    else {
      const textAlign = this.computedStyle.textAlign;
      if (textAlign === TEXT_ALIGN.CENTER) {
        this.tempCursorX = this.currentCursorX = this.width * 0.5;
      }
      else if (textAlign === TEXT_ALIGN.RIGHT) {
        this.tempCursorX = this.currentCursorX = this.width;
      }
      else {
        this.tempCursorX = this.currentCursorX = 0;
      }
    }
    const p = calPoint({ x: this.tempCursorX, y: lineBox.y }, matrixWorld);
    this.root?.emit(
      Event.UPDATE_CURSOR,
      p.x,
      p.y,
      lineBox.lineHeight * matrixWorld[0],
    );
  }

  private setCursorByIndex(index: number, isEnd = false) {
    const lineBoxList = this.lineBoxList;
    const cursor = this.cursor;
    for (let i = 0, len = lineBoxList.length; i < len; i++) {
      const lineBox = lineBoxList[i];
      const list = lineBox.list;
      if (!list.length && lineBox.index === index) {
        cursor.startLineBox = i;
        cursor.startTextBox = 0;
        cursor.startString = 0;
        return { lineBox, textBox: undefined };
      }
      for (let j = 0, len = list.length; j < len; j++) {
        const textBox = list[j];
        if (
          index >= textBox.index &&
          (index < textBox.index + textBox.str.length ||
            (j === len - 1 &&
              lineBox.endEnter &&
              index <= textBox.index + textBox.str.length))
        ) {
          if (isEnd) {
            cursor.endLineBox = i;
            cursor.endTextBox = j;
            cursor.endString = index - textBox.index;
          }
          else {
            cursor.startLineBox = i;
            cursor.startTextBox = j;
            cursor.startString = index - textBox.index;
          }
          return { lineBox, textBox };
        }
      }
    }
    // 找不到强制末尾
    const i = lineBoxList.length - 1;
    const lineBox = lineBoxList[i];
    const list = lineBox.list;
    if (isEnd) {
      cursor.endLineBox = i;
    }
    else {
      cursor.startLineBox = i;
    }
    if (!list || !list.length) {
      if (isEnd) {
        cursor.endTextBox = 0;
        cursor.endString = 0;
      }
      else {
        cursor.startTextBox = 0;
        cursor.startString = 0;
      }
      return { lineBox, textBox: undefined };
    }
    const j = list.length - 1;
    const textBox = list[j];
    if (isEnd) {
      cursor.endTextBox = j;
      cursor.endString = textBox.str.length;
    }
    else {
      cursor.startTextBox = j;
      cursor.startString = textBox.str.length;
    }
    return { lineBox, textBox };
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
      const textAlign = this.computedStyle.textAlign;
      let x = 0;
      if (textAlign === TEXT_ALIGN.CENTER) {
        x = this.width * 0.5;
      }
      else if (textAlign === TEXT_ALIGN.RIGHT) {
        x = this.width;
      }
      return calPoint({ x, y: lineBox.y }, m);
    }
    return calPoint({ x: this.currentCursorX, y: lineBox.y }, m);
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
        this.showSelectArea = false;
        this.refresh();
        this.updateCursorByIndex(pos);
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
          }
          else {
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
      if (pos === 0) {
        if (cursor.isMulti) {
          cursor.isMulti = false;
          this.showSelectArea = false;
          this.refresh();
          this.updateCursorByIndex(pos);
        }
        return;
      }
      if (cursor.isMulti) {
        cursor.isMulti = false;
        this.showSelectArea = false;
        this.refresh();
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
        const res = this.getCursorByLocalX(this.tempCursorX, lineBox, false);
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
        this.showSelectArea = false;
        cursor.startLineBox = cursor.endLineBox;
        cursor.startTextBox = cursor.endTextBox;
        cursor.startString = cursor.endString;
        this.refresh();
        lineBox = lineBoxList[cursor.startLineBox];
        list = lineBox.list;
        textBox = list[cursor.startTextBox];
        const p = textBox
          ? textBox.index + cursor.startString
          : lineBox.index + cursor.startString;
        this.updateCursorByIndex(p);
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
          }
          else {
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
      if (pos === this._content.length) {
        if (cursor.isMulti) {
          cursor.isMulti = false;
          this.showSelectArea = false;
          this.refresh();
          this.updateCursorByIndex(pos);
        }
        return;
      }
      if (cursor.isMulti) {
        cursor.isMulti = false;
        this.showSelectArea = false;
        this.refresh();
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
        const res = this.getCursorByLocalX(this.tempCursorX, lineBox, false);
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
      this.tempCursorX = this.currentCursorX = textBox.x + w;
    }
    else {
      const textAlign = this.computedStyle.textAlign;
      if (textAlign === TEXT_ALIGN.CENTER) {
        this.tempCursorX = this.currentCursorX = this.width * 0.5;
      }
      else if (textAlign === TEXT_ALIGN.RIGHT) {
        this.tempCursorX = this.currentCursorX = this.width;
      }
      else {
        this.tempCursorX = this.currentCursorX = 0;
      }
    }
    const p = calPoint({ x: this.tempCursorX, y: lineBox.y }, m);
    this.root?.emit(Event.UPDATE_CURSOR, p.x, p.y, lineBox.lineHeight * m[0]);
  }

  /**
   * 在左百分比+宽度自动的情况，输入后要保持原本的位置，因为是中心点百分比对齐父级，
   * 其它几种都不需要：左右百分比定宽、左固定、右固定、左百分比+定宽，
   * 不会出现仅右百分比的情况，所有改变处理都一样
   */
  input(s: string, style?: Partial<Rich>) {
    const payload = this.beforeEdit();
    const { isMulti, start, end } = this.getSortedCursor();
    // 选择区域特殊情况，先删除掉这一段文字
    if (isMulti) {
      this.cursor.isMulti = false;
      this.showSelectArea = false;
      // 肯定小于，多加一层防守
      if (start < end) {
        this.cutRich(start, end);
        const c = this._content;
        this._content = c.slice(0, start) + c.slice(end);
      }
    }
    // 传入style说明是插入一段新Rich
    if (style) {
      this.insertRich(style, start, s.length);
    }
    // 否则是在当前Rich上增加内容
    else {
      this.expandRich(start, s.length);
    }
    const c = this._content;
    this._content = c.slice(0, start) + s + c.slice(start);
    this.root?.addUpdate(
      this,
      [],
      RefreshLevel.REFLOW,
      false,
      false,
      undefined,
    );
    this.afterEdit(payload);
    this.updateCursorByIndex(start + s.length);
  }

  enter() {
    const payload = this.beforeEdit();
    const { isMulti, start, end } = this.getSortedCursor();
    // 选择区域特殊情况，先删除掉这一段文字
    if (isMulti) {
      this.cursor.isMulti = false;
      this.showSelectArea = false;
      // 肯定小于，多加一层防守
      if (start < end) {
        this.cutRich(start, end);
        const c = this._content;
        this._content = c.slice(0, start) + c.slice(end);
      }
    }
    this.expandRich(start, 1);
    const c = this._content;
    this._content = c.slice(0, start) + '\n' + c.slice(start);
    this.root?.addUpdate(
      this,
      [],
      RefreshLevel.REFLOW,
      false,
      false,
      undefined,
    );
    this.afterEdit(payload);
    this.updateCursorByIndex(start + 1);
  }

  // 按下delete键触发
  delete() {
    const c = this._content;
    // 没内容没法删
    if (!c) {
      return;
    }
    const { isMulti, start, end } = this.getSortedCursor();
    // 开头也没法删
    if (!start) {
      return;
    }
    this.showSelectArea = false;
    const payload = this.beforeEdit();
    if (isMulti) {
      this.cursor.isMulti = false;
      // 肯定小于，多加一层防守
      if (start < end) {
        this.cutRich(start, end);
        this._content = c.slice(0, start) + c.slice(end);
        this.updateCursorByIndex(start);
      }
    }
    else {
      this.cutRich(start - 1, start);
      this._content = c.slice(0, start - 1) + c.slice(start);
      this.updateCursorByIndex(start - 1);
    }
    this.root?.addUpdate(
      this,
      [],
      RefreshLevel.REFLOW,
      false,
      false,
      undefined,
    );
    this.afterEdit(payload);
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
    }
    else {
      cursor.startString = 0;
    }
    outer: for (let i = 0, len = list.length; i < len; i++) {
      const { x, w, str, font, letterSpacing } = list[i];
      // x位于哪个textBox上，注意开头结尾
      if (
        (!i && localX <= x + w) ||
        (localX >= x && localX <= x + w) ||
        i === len - 1
      ) {
        if (isEnd) {
          cursor.endTextBox = i;
        }
        else {
          cursor.startTextBox = i;
        }
        const ctx = inject.getFontCanvas().ctx;
        ctx.font = font;
        // @ts-ignore
        ctx.letterSpacing = letterSpacing;
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
              }
              else {
                cursor.startString = end;
              }
            }
            else {
              rx = x + w1;
              if (isEnd) {
                cursor.endString = start;
              }
              else {
                cursor.startString = start;
              }
            }
            break outer;
          }
          const mid = start + ((end - start) >> 1);
          const w = ctx.measureText(str.slice(0, mid)).width;
          if (localX > x + w) {
            start = mid;
          }
          else if (localX < x + w) {
            end = mid;
          }
          else {
            if (isEnd) {
              cursor.endString = mid;
            }
            else {
              cursor.startString = mid;
            }
            rx = x + w;
            break outer;
          }
        }
      }
    }
    // 空行特殊判断对齐方式
    if (!list.length) {
      const textAlign = this.computedStyle.textAlign;
      if (textAlign === TEXT_ALIGN.CENTER) {
        rx = this.width * 0.5;
      }
      else if (textAlign === TEXT_ALIGN.RIGHT) {
        rx = this.width;
      }
    }
    return { x: rx, y: ry, h: rh };
  }

  updateTextStyle(style: any, cb?: (sync: boolean) => void) {
    const payload = this.beforeEdit();
    const rich = this.rich;
    // 转成rich的
    const style2: any = {};
    if (style.hasOwnProperty('textAlign')) {
      if (style.textAlign === 'center') {
        style2.textAlign = TEXT_ALIGN.CENTER;
      }
      else if (style.textAlign === 'right') {
        style2.textAlign = TEXT_ALIGN.RIGHT;
      }
      else if (style.textAlign === 'justify') {
        style2.textAlign = TEXT_ALIGN.JUSTIFY;
      }
      else {
        style2.textAlign = TEXT_ALIGN.LEFT;
      }
    }
    if (style.hasOwnProperty('color')) {
      style2.color = color2rgbaInt(style.color);
    }
    if (style.hasOwnProperty('fontFamily')) {
      style2.fontFamily = style.fontFamily;
    }
    if (style.hasOwnProperty('fontSize')) {
      style2.fontSize = style.fontSize;
    }
    if (style.hasOwnProperty('letterSpacing')) {
      style2.letterSpacing = style.letterSpacing;
    }
    if (style.hasOwnProperty('textDecoration')) {
      style2.textDecoration = style.textDecoration;
    }
    if (style.hasOwnProperty('lineHeight')) {
      style2.lineHeight = style.lineHeight;
    }
    if (style.hasOwnProperty('paragraphSpacing')) {
      style2.paragraphSpacing = style.paragraphSpacing;
    }
    let hasChange = false;
    if (rich.length) {
      rich.forEach((item) => {
        hasChange = this.updateRich(item, style2) || hasChange;
      });
    }
    this.mergeRich();
    // 防止rich变更但整体没有变更结果不刷新
    const keys = this.updateStyleData(style);
    if (keys.length) {
      this.root?.addUpdate(this, keys, undefined, false, false, cb);
    }
    else if (hasChange) {
      this.refresh(RefreshLevel.REFLOW, cb);
    }
    this.afterEdit(payload);
  }

  updateTextRangeStyle(style: any, cb?: (sync: boolean) => void) {
    const { cursor, rich } = this;
    // 正常情况不会出现光标单选
    if (!cursor.isMulti || !rich.length) {
      return false;
    }
    const payload = this.beforeEdit();
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
    this.afterEdit(payload);
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
    if (style.hasOwnProperty('textAlign') &&
      style.textAlign !== item.textAlign) {
      item.textAlign = style.textAlign;
      hasChange = true;
    }
    return hasChange;
  }

  // 删除一段文字内容并修改移除对应的rich，一般是选区删除时引发的
  private cutRich(start: number, end: number) {
    const rich = this.rich;
    if (!rich.length) {
      return;
    }
    const count = end - start;
    for (let i = 0, len = rich.length; i < len; i++) {
      const item = rich[i];
      if (item.location <= start && item.location + item.length > start) {
        // 可能选区就在这个rich范围内
        if (item.location + item.length >= end) {
          item.length -= count;
          // 后续的偏移
          for (let k = i + 1; k < len; k++) {
            rich[k].location -= count;
          }
          if (!item.length) {
            rich.splice(i, 1);
          }
        }
        // 跨多个选区
        else {
          item.length = start - item.location;
          for (let j = i + 1; j < len; j++) {
            const item2 = rich[j];
            if (item2.location <= end && item2.location + item2.length > end) {
              item2.length = end - item2.location;
              item2.location = item.location + item.length;
              // 开始和结束的rich中间有的话删除
              if (i < j - 1) {
                rich.splice(i + 1, j - i + 1);
              }
              // 后续的偏移
              for (let k = j + 1; k < len; k++) {
                rich[k].location -= count;
              }
              break;
            }
          }
        }
        break;
      }
    }
    this.mergeRich();
  }

  // 输入文字后扩展所在位置的rich
  private expandRich(start: number, length: number) {
    const rich = this.rich;
    if (!rich.length) {
      return;
    }
    for (let i = 0, len = rich.length; i < len; i++) {
      const item = rich[i];
      if (item.location <= start && item.location + item.length > start) {
        item.length += length;
        for (let j = i + 1; j < len; j++) {
          rich[j].location += length;
        }
        break;
      }
    }
  }

  private insertRich(style: Partial<Rich>, start: number, length: number) {
    const st = Object.assign(
      {
        location: start,
        length,
        fontFamily: 'arial',
        fontSize: 16,
        fontWeight: 400,
        fontStyle: 'normal',
        letterSpacing: 0,
        textAlign: TEXT_ALIGN.LEFT,
        textDecoration: [],
        lineHeight: 0,
        paragraphSpacing: 0,
        color: [0, 0, 0, 1],
      },
      style,
    );
    st.color = color2rgbaInt(st.color);
    // 防止被style中脏数据覆盖
    st.location = start;
    st.length = length;
    const rich = this.rich;
    if (!rich.length) {
      rich.push(st);
      return;
    }
    for (let i = 0, len = rich.length; i < len; i++) {
      const item = rich[i];
      if (item.location <= start && item.location + item.length > start) {
        // 后续偏移
        for (let j = i + 1; j < len; j++) {
          rich[j].location += length;
        }
        // 看是否处在一个Rich的中间，决定是否切割这个Rich
        if (item.location === start) {
          rich.splice(i, 0, st);
          item.location += length;
        }
        else {
          const copy = clone(item);
          item.length = start - item.location;
          copy.location = start + length;
          copy.length -= item.length;
          rich.splice(i + 1, 0, st);
          rich.splice(i + 2, 0, copy);
        }
        this.mergeRich();
        return;
      }
    }
    // 结束也没找到，只有可能是在末尾输入
    rich.push(st);
    this.mergeRich();
  }

  // 合并相同的rich
  private mergeRich() {
    const rich = this.rich;
    if (!rich.length) {
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
  private getSortedCursor() {
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
      }
      else if (startLineBox === endLineBox && startTextBox > endTextBox) {
        [startTextBox, startString, endTextBox, endString] = [
          endTextBox,
          endString,
          startTextBox,
          startString,
        ];
        isReversed = true;
      }
      else if (
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
    }
    else {
      const textBox = list[startTextBox];
      start = textBox.index + startString;
    }
    let end = 0;
    lineBox = lineBoxList[endLineBox];
    list = lineBox.list;
    if (!list.length) {
      end = lineBox.index;
    }
    else {
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
    if (!rich.length) {
      return [];
    }
    if (rich.length === 1) {
      return [rich[0]];
    }
    const res: Rich[] = [];
    // 字符索引对应的rich快速查找
    const RICH_INDEX: Rich[] = [];
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
      }
      else {
        const textBox = list[startTextBox];
        start = textBox.index + startString;
      }
      lineBox = lineBoxList[endLineBox];
      list = lineBox.list;
      if (!list) {
        end = lineBox.index;
      }
      else {
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
      }
      else {
        // 如果光标在textBox的开头，要取前一个的，除非当前textBox是行首
        const i =
          startString === 0 && startTextBox > 0
            ? startTextBox - 1
            : startTextBox;
        const textBox = list[i];
        const r = RICH_INDEX[textBox.index];
        if (r && res.indexOf(r) === -1) {
          res.push(r);
        }
      }
    }
    return res;
  }

  override clone(override?: Record<string, Override>) {
    const props = clone(this.props);
    const oldUUid = props.uuid;
    if (override && override.hasOwnProperty(oldUUid)) {
      const { property, value } = override[oldUUid];
      if (property === 'stringValue') {
        this._content = value;
      }
    }
    props.uuid = uuid.v4();
    props.sourceUuid = this.props.uuid;
    props.rich = clone(this.rich);
    props.content = this._content;
    const res = new Text(props);
    res.style = clone(this.style);
    res.computedStyle = clone(this.computedStyle);
    return res;
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.TEXT;
    return res;
  }

  override async toSketchJson(zip: JSZip): Promise<SketchFormat.Text> {
    const json = await super.toSketchJson(zip) as SketchFormat.Text;
    json._class = SketchFormat.ClassValue.Text;
    json.attributedString = {
      _class: 'attributedString',
      string: this._content,
      attributes: this.rich.map(item => {
        return {
          _class: 'stringAttribute',
          location: item.location,
          length: item.length,
          attributes: {
            kerning: item.letterSpacing,
            MSAttributedStringFontAttribute: {
              _class: 'fontDescriptor',
              attributes: {
                name: item.fontFamily,
                size: item.fontSize,
              },
            },
            MSAttributedStringColorAttribute: {
              _class: 'color',
              alpha: item.color[3],
              red: item.color[0] / 255,
              green: item.color[1] / 255,
              blue: item.color[2] / 255,
            },
            paragraphStyle: {
              _class: 'paragraphStyle',
              alignment: [
                SketchFormat.TextHorizontalAlignment.Left,
                SketchFormat.TextHorizontalAlignment.Right,
                SketchFormat.TextHorizontalAlignment.Centered,
                SketchFormat.TextHorizontalAlignment.Justified,
              ][item.textAlign || 0],
            },
            underlineStyle: item.textDecoration.indexOf(TEXT_DECORATION.UNDERLINE) > -1 ?
              SketchFormat.UnderlineStyle.Underlined :
              SketchFormat.UnderlineStyle.None,
            strikethroughStyle: item.textDecoration.indexOf(TEXT_DECORATION.LINE_THROUGH) > -1 ?
              SketchFormat.StrikethroughStyle.Strikethrough :
              SketchFormat.StrikethroughStyle.None,
          },
        };
      }),
    };
    const {
      left,
      right,
      top,
      bottom,
      width,
      height,
    } = this.style;
    const autoW = width.u === StyleUnit.AUTO
      && (left.u === StyleUnit.AUTO || right.u === StyleUnit.AUTO);
    const autoH = height.u === StyleUnit.AUTO
      && (top.u === StyleUnit.AUTO || bottom.u === StyleUnit.AUTO);
    if (autoW && autoH) {
      json.textBehaviour = SketchFormat.TextBehaviour.Flexible;
    }
    else if (autoW) {
      json.textBehaviour = SketchFormat.TextBehaviour.Flexible;
    }
    else if (autoH) {
      json.textBehaviour = SketchFormat.TextBehaviour.Fixed;
    }
    else {
      json.textBehaviour = SketchFormat.TextBehaviour.FixedWidthAndHeight;
    }
    // json.textBehaviour = [
    //   SketchFormat.TextBehaviour.Flexible,
    //   SketchFormat.TextBehaviour.Fixed,
    //   SketchFormat.TextBehaviour.FixedWidthAndHeight,
    // ][this.textBehaviour || 0];
    return json;
  }

  get content() {
    return this._content;
  }

  set content(v: string) {
    if (v !== this._content) {
      const payload = this.beforeEdit();
      this._content = v;
      this.root?.addUpdate(
        this,
        [],
        RefreshLevel.REFLOW,
        false,
        false,
        undefined,
      );
      this.afterEdit(payload);
    }
  }

  override get bbox(): Float64Array {
    let res = this._bbox;
    if (!res) {
      const rect = this._rect || this.rect;
      res = this._bbox = rect.slice(0);
      const lineBoxList = this.lineBoxList;
      lineBoxList.forEach(lineBox => {
        lineBox.list.forEach(textBox => {
          const { fontFamily, fontSize, lineHeight, str, font: f } = textBox;
          let normal = lineHeight;
          if (font.hasRegister(fontFamily.toLowerCase())) {
            const fontData = font.data[fontFamily.toLowerCase()];
            normal = fontData.lhr * fontSize;
          }
          else {
            const ctx = inject.getFontCanvas().ctx;
            ctx.font = f;
            const r = ctx.measureText(str);
            normal = r.actualBoundingBoxAscent + r.actualBoundingBoxDescent;
          }
          const dy = normal - lineHeight;
          if (dy > 0) {
            const half = dy * 0.5;
            const y1 = textBox.y - half;
            const y2 = textBox.lineHeight + half;
            if (y1 < 0) {
              res![1] = Math.min(res![1], y1);
            }
            res![3] = Math.max(res![3], y2);
          }
        });
      });
      const { strokeWidth, strokeEnable, strokePosition } = this.computedStyle;
      // 所有描边最大值，影响bbox，text强制miterLimit是1
      let border = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          if (strokePosition[i] === STROKE_POSITION.INSIDE) {
            // 0
          }
          else if (strokePosition[i] === STROKE_POSITION.OUTSIDE) {
            border = Math.max(border, item * 2);
          }
          else {
            // 默认中间
            border = Math.max(border, item * 0.5 * 2);
          }
        }
      });
      res[0] -= border;
      res[1] -= border;
      res[2] += border;
      res[3] += border;
    }
    return res;
  }

  static setFontAndLetterSpacing = setFontAndLetterSpacing;
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
    }
    else {
      if (oa !== ob) {
        return false;
      }
    }
  }
  return true;
}

function setFontAndLetterSpacing(ctx: CanvasRenderingContext2D, textBox: TextBox, scale: number) {
  // 缩放影响字号
  if (scale !== 1) {
    ctx.font = textBox.font.replace(
      /([\d.e+-]+)px/gi,
      ($0, $1) => $1 * scale + 'px',
    );
    // @ts-ignore
    ctx.letterSpacing = textBox.letterSpacing * scale + 'px';
  }
  else {
    ctx.font = textBox.font;
    // @ts-ignore
    ctx.letterSpacing = textBox.letterSpacing + 'px';
  }
}

export default Text;
