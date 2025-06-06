import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { JNode, ModifyRichStyle, Override, Rich, TAG_NAME, TextProps } from '../format';
import { calPoint, inverse4 } from '../math/matrix';
import CanvasCache from '../refresh/CanvasCache';
import { RefreshLevel } from '../refresh/level';
import {
  calNormalLineHeight,
  color2rgbaInt,
  color2rgbaStr,
  getBaseline,
  getContentArea,
  normalizeRich,
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
import inject, { OffScreen } from '../util/inject';
import { clone, equal } from '../util/type';
import { LayoutData } from './layout';
import LineBox from './LineBox';
import Node from './Node';
import TextBox from './TextBox';
import { getConic, getLinear, getRadial } from '../style/gradient';
import { getCanvasGCO } from '../style/mbm';

export type EditStyle = {
  isLeft: boolean;
  isCenter: boolean;
  isRight: boolean;
  isTop: boolean;
  isMiddle: boolean;
  isBottom: boolean;
  isFixedHeight: boolean;
  prev: Style;
};

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
      return { hypotheticalNum, rw, newLine };
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
        return { hypotheticalNum, rw, newLine };
      }
    }
  }
  // 下一个字符是回车，强制忽略换行，外层循环识别
  if (content.charAt(start + hypotheticalNum) === '\n') {
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
  start: number; // 整个字符串的索引
  end: number;
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
  asyncRefresh: boolean;
  loaders: Loader[];
  inputStyle?: ModifyRichStyle; // 编辑状态时未选择文字，改变样式临时存储，在输入时使用此样式
  editStyle?: EditStyle; // 进入编辑时改变布局置空translate防止位置变化，固定宽高也要显示全文本

  constructor(props: TextProps) {
    super(props);
    this.isText = true;
    this._content = props.content || '';
    this.rich = (props.rich?.slice(0) || []).map(item => normalizeRich(item));
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
      start: 0,
      end: 0,
    };
    this.asyncRefresh = false;
    this.loaders = [];
  }

  override didMount() {
    const isMounted = this.isMounted;
    super.didMount();
    // 首次布局特殊逻辑，由于字体的不确定性，自动尺寸的文本框在其它环境下中心点对齐可能会偏差，因此最初先按自动布局，
    // 完成后这里和css的width/height对比进行差值计算偏移，并还原对应的w/h为auto。
    if (!isMounted) {
      const textBehaviour = (this.props as TextProps).textBehaviour;
      const { style, computedStyle, parent } = this;
      const {
        left,
        right,
        top,
        bottom,
        width,
        height,
        transformOrigin,
      } = style;
      let reset = false;
      if (textBehaviour === 'auto'
        && width.u !== StyleUnit.AUTO
        && (left.u === StyleUnit.AUTO || right.u === StyleUnit.AUTO)) {
        this.style.width = { v: 0, u: StyleUnit.AUTO };
        let d = 0;
        if (width.u === StyleUnit.PX) {
          d = this.width - width.v;
        }
        else if (width.u === StyleUnit.PERCENT) {
          d = this.width - width.v * 0.01 * parent!.width;
        }
        if (d && transformOrigin[0].u === StyleUnit.PERCENT) {
          if (computedStyle.textAlign === TEXT_ALIGN.LEFT) {
            const v = d * transformOrigin[0].v * 0.01;
            this.adjustPosAndSizeSelf(v, 0, v, 0);
            reset = true;
          }
          else if (computedStyle.textAlign === TEXT_ALIGN.RIGHT) {
            const v = d * transformOrigin[0].v * 0.01;
            this.adjustPosAndSizeSelf(-v, 0, -v, 0);
            reset = true;
          }
        }
      }
      if ((textBehaviour === 'auto' || textBehaviour === 'autoH')
        && height.u !== StyleUnit.AUTO
        && (top.u === StyleUnit.AUTO || bottom.u === StyleUnit.AUTO)) {
        this.style.height = { v: 0, u: StyleUnit.AUTO };
        let d = 0;
        if (height.u === StyleUnit.PX) {
          d = this.height - height.v;
        }
        else if (height.u === StyleUnit.PERCENT) {
          d = this.height - height.v * 0.01 * parent!.height;
        }
        if (d && transformOrigin[1].u === StyleUnit.PERCENT) {
          if (computedStyle.textVerticalAlign === TEXT_VERTICAL_ALIGN.TOP) {
            const v = d * transformOrigin[1].v * 0.01;
            this.adjustPosAndSizeSelf(0, v, 0, v);
            reset = true;
          }
          else if (computedStyle.textVerticalAlign === TEXT_VERTICAL_ALIGN.BOTTOM) {
            const v = d * transformOrigin[1].v * 0.01;
            this.adjustPosAndSizeSelf(0, -v, 0, -v);
            reset = true;
          }
        }
      }
      if (reset) {
        this.checkPosSizeUpward();
      }
    }
  }

  override lay(data: LayoutData) {
    super.lay(data);
    const { rich, style, computedStyle, _content: content, lineBoxList } = this;
    const {
      left,
      right,
      top,
      bottom,
      width,
      height,
    } = style;
    let autoW = width.u === StyleUnit.AUTO
      && (left.u === StyleUnit.AUTO || right.u === StyleUnit.AUTO);
    let autoH = height.u === StyleUnit.AUTO
      && (top.u === StyleUnit.AUTO || bottom.u === StyleUnit.AUTO);
    /**
     * 首次布局需考虑由于字体的不确定性，导致自动尺寸的文本框在其它环境下中心点对齐可能会偏差，
     * 此时数据width是固定尺寸，视为非固定即autoW/autoH，在didMount()时机再做调整（向上影响尺寸位置）。
     */
    if (!this.isMounted) {
      const textBehaviour = (this.props as TextProps).textBehaviour;
      if (textBehaviour === 'auto'
        && width.u !== StyleUnit.AUTO
        && (left.u === StyleUnit.AUTO || right.u === StyleUnit.AUTO)) {
        autoW = true;
      }
      if ((textBehaviour === 'auto' || textBehaviour === 'autoH')
        && height.u !== StyleUnit.AUTO
        && (top.u === StyleUnit.AUTO || bottom.u === StyleUnit.AUTO)) {
        autoH = true;
      }
    }
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
    // 初始数据合并校验
    this.mergeRich();
    // 富文本每串不同的需要设置字体测量，这个索引记录每个rich块首字符的start索引，在遍历时到这个字符则重设
    const SET_FONT_INDEX: Record<number, number> = {};
    if (rich.length) {
      for (let i = 0, len = rich.length; i < len; i++) {
        const item = rich[i];
        SET_FONT_INDEX[item.location] = i;
        const family = item.fontFamily;
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
                    rich[i].fontFamily === family
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
                        rich[i].fontFamily === family
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
      const family = computedStyle.fontFamily;
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
                  computedStyle.fontFamily === family
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
      letterSpacing = first.letterSpacing || 0;
      paragraphSpacing = first.paragraphSpacing || 0;
      perW = first.fontSize * 0.8 + letterSpacing;
      lineHeight = first.lineHeight || calNormalLineHeight(first);
      baseline = getBaseline(first, lineHeight);
      contentArea = getContentArea(first, lineHeight);
      fontFamily = first.fontFamily;
      fontSize = first.fontSize;
      color = color2rgbaStr(first.color);
      textDecoration = first.textDecoration || [];
      ctx.font = setFontStyle(first);
      // @ts-ignore
      ctx.letterSpacing = letterSpacing + 'px';
    }
    // 无富文本则通用
    else {
      letterSpacing = computedStyle.letterSpacing;
      paragraphSpacing = computedStyle.paragraphSpacing;
      perW = computedStyle.fontWeight * 0.8 + letterSpacing;
      lineHeight = computedStyle.lineHeight || calNormalLineHeight(computedStyle);
      baseline = getBaseline(computedStyle, lineHeight);
      contentArea = getContentArea(computedStyle, lineHeight);
      fontFamily = computedStyle.fontFamily;
      fontSize = computedStyle.fontSize;
      color = color2rgbaStr(this.style.color.v);
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
    // const H = autoH ? Number.MAX_SAFE_INTEGER : this.height;
    while (i < length) {
      const setFontIndex = SET_FONT_INDEX[i];
      // 每串富文本重置font测量
      if (i && setFontIndex) {
        const cur = rich[setFontIndex];
        letterSpacing = cur.letterSpacing || 0;
        paragraphSpacing = cur.paragraphSpacing || 0;
        perW = cur.fontSize * 0.8 + letterSpacing;
        lineHeight = cur.lineHeight || calNormalLineHeight(cur);
        baseline = getBaseline(cur, lineHeight);
        contentArea = getContentArea(cur, lineHeight);
        fontFamily = cur.fontFamily;
        fontSize = cur.fontSize;
        color = color2rgbaStr(cur.color);
        textDecoration = cur.textDecoration || [];
        ctx.font = setFontStyle(cur);
        // @ts-ignore
        ctx.letterSpacing = letterSpacing + 'px';
      }
      // \n，行开头会遇到，需跳过
      if (content.charAt(i) === '\n') {
        i++;
        x = 0;
        y += lineBox.height + paragraphSpacing;
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
        y += lineBox.height + paragraphSpacing;
        if (i < length) {
          lineBox.verticalAlign();
          lineBox = new LineBox(y, lineHeight, i, false);
          lineBoxList.push(lineBox);
        }
        continue;
      }
      // 预估法获取测量结果
      let {
        hypotheticalNum: num,
        rw,
        newLine,
      } = measure(ctx, i, len, content, W - x, perW, letterSpacing);
      // if (content === '意外保障金') {
      //   if (W - x === 139) {
      //     if (i) {
      //       rw = 30;
      //     }
      //     else {
      //       num = 4;
      //       rw = 120;
      //       newLine = true;
      //     }
      //   }
      //   else {
      //     rw = 150;
      //   }
      // }
      // console.log(i, len, content, W - x, perW, letterSpacing, ';', num, rw, newLine);
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
      // console.log(i, num, content.slice(i, i + num), letterSpacing, rw, textBox);
      lineBox.add(textBox);
      i += num;
      maxW = Math.max(maxW, Math.ceil(rw + x));
      // 换行则x重置、y增加、新建LineBox，否则继续水平增加x
      if (newLine) {
        x = 0;
        y += lineBox.height + paragraphSpacing;
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
    maxW = Math.max(maxW, lineBox.width);
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
        if (left.u !== StyleUnit.AUTO && right.u !== StyleUnit.AUTO) {
        }
        else if (left.u !== StyleUnit.AUTO) {
          computedStyle.right -= d;
        }
        else if (right.u !== StyleUnit.AUTO) {
          computedStyle.left -= d;
        }
      }
    }
    if (autoH) {
      const h = lineBox.y + lineBox.height;
      const d = h - this.height;
      if (d) {
        this.height = computedStyle.height = h;
        const { top, bottom } = style;
        if (top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO) {
        }
        else if (top.u !== StyleUnit.AUTO) {
          computedStyle.bottom -= d;
        }
        else if (bottom.u !== StyleUnit.AUTO) {
          computedStyle.top -= d;
        }
      }
    }
    // 水平非左对齐偏移
    if (rich && rich.length) {
      const hash: Record<number, Rich> = {};
      rich.forEach(item => {
        hash[item.location] = item;
      });
      let textAlign = rich[0].textAlign;
      for (let i = 0, len = lineBoxList.length; i < len; i++) {
        const lineBox = lineBoxList[i];
        // sketch中每个\n换行且不同对齐都会产生新的rich，行首就是index
        if (lineBox.startEnter || !lineBox.index) {
          const r = hash[lineBox.index];
          if (r) {
            textAlign = r.textAlign;
          }
        }
        // 非\n而是布局宽度造成的换行，自动沿用之前的
        if (textAlign === TEXT_ALIGN.CENTER) {
          const d = this.width - lineBox.width;
          if (d) {
            lineBox.offsetX(d * 0.5);
          }
        }
        else if (textAlign === TEXT_ALIGN.RIGHT) {
          const d = this.width - lineBox.width;
          if (d) {
            lineBox.offsetX(d);
          }
        }
      }
    }
    else if (content && computedStyle.textAlign !== TEXT_ALIGN.LEFT) {
      for (let i = 0, len = lineBoxList.length; i < len; i++) {
        const lineBox = lineBoxList[i];
        // 非\n而是布局宽度造成的换行，自动沿用之前的
        if (computedStyle.textAlign === TEXT_ALIGN.CENTER) {
          const d = this.width - lineBox.width;
          if (d) {
            lineBox.offsetX(d * 0.5);
          }
        }
        else if (computedStyle.textAlign === TEXT_ALIGN.RIGHT) {
          const d = this.width - lineBox.width;
          if (d) {
            lineBox.offsetX(d);
          }
        }
      }
    }
    // 垂直对齐偏移
    const dh = this.height - lineBox.y - lineBox.height;
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
    const { computedStyle, lineBoxList } = this;
    const canvasCache = (this.canvasCache = CanvasCache.getInstance(w, h, dx, dy));
    canvasCache.available = true;
    const list = canvasCache.list;
    const {
      isMulti,
      startLineBox,
      startTextBox,
      startString,
      endLineBox,
      endTextBox,
      endString,
      start,
      end,
    } = this.getSortedCursor();
    // 如果处于选择范围状态，渲染背景
    if (isMulti && start !== end) {
      for (let i = 0, len = list.length; i < len; i++) {
        const { x, y, os: { ctx } } = list[i];
        const dx2 = -x;
        const dy2 = -y;
        ctx.fillStyle = '#f4d3c1';
        // 单行多行区分开
        if (startLineBox === endLineBox) {
          const lineBox = lineBoxList[startLineBox];
          const list = lineBox.list;
          let textBox = list[startTextBox];
          let x1 = textBox.x * scale + dx2;
          ctx.font = textBox.font;
          ctx.letterSpacing = textBox.letterSpacing + 'px';
          x1 += ctx.measureText(textBox.str.slice(0, startString)).width * scale;
          textBox = list[endTextBox];
          let x2 = textBox.x * scale + dx2;
          ctx.font = textBox.font;
          x2 += ctx.measureText(textBox.str.slice(0, endString)).width * scale;
          ctx.fillRect(
            x1,
            lineBox.y * scale + dy2,
            x2 - x1,
            lineBox.lineHeight * scale,
          );
        }
        else {
          // 先首行
          let lineBox = lineBoxList[startLineBox];
          let list = lineBox.list;
          let textBox = list[startTextBox];
          if (textBox) {
            let x1 = textBox.x * scale + dx2;
            ctx.font = textBox.font;
            ctx.letterSpacing = textBox.letterSpacing + 'px';
            x1 += ctx.measureText(textBox.str.slice(0, startString)).width * scale;
            ctx.fillRect(
              x1,
              lineBox.y * scale + dy2,
              lineBox.w * scale + dx2 - x1,
              lineBox.lineHeight * scale,
            );
          }
          // 中间循环
          for (let i = startLineBox + 1, len = endLineBox; i < len; i++) {
            const lineBox = lineBoxList[i];
            if (lineBox.list.length) {
              ctx.fillRect(
                lineBox.list[0].x * scale + dx2,
                lineBox.y * scale + dy2,
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
            let x1 = textBox.x * scale + dx2;
            ctx.font = textBox.font;
            ctx.letterSpacing = textBox.letterSpacing + 'px';
            x1 += ctx.measureText(textBox.str.slice(0, endString)).width * scale;
            ctx.fillRect(lineBox.x * scale + dx2, lineBox.y * scale + dy2, x1 - (lineBox.x + dx2) * scale, lineBox.lineHeight * scale);
          }
        }
      }
    }
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
          }
          else {
            ctx.strokeText(
              textBox.str,
              textBox.x * scale + dx,
              (textBox.y + textBox.baseline) * scale + dy,
            );
          }
          if (textDecoration.length) {
            textDecoration.forEach(item => {
              if (item === TEXT_DECORATION.UNDERLINE) {
                const h = Math.min(3 * scale, textBox.lineHeight * 0.05 * scale);
                ctx.strokeRect(
                  textBox.x * scale + dx,
                  (textBox.y + textBox.contentArea) * scale + dy - h * 0.5,
                  textBox.w * scale,
                  h,
                );
              }
              else if (item === TEXT_DECORATION.LINE_THROUGH) {
                const h = Math.min(3 * scale, textBox.lineHeight * 0.05 * scale);
                ctx.strokeRect(
                  textBox.x * scale + dx,
                  (textBox.y + textBox.lineHeight * 0.5) * scale + dy - h * 0.5,
                  textBox.w * scale,
                  h,
                );
              }
            });
          }
        }
      }
    }

    for (let i = 0, len = list.length; i < len; i++) {
      const { x, y, os: { ctx } } = list[i];
      const dx2 = -x;
      const dy2 = -y;
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
            if (f[3] <= 0) {
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
                            dx2 + i * loader.width * scale * ratio,
                            dy2 + j * loader.height * scale * ratio,
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
                        x + dx2, y + dy2, loader.width * sc, loader.height * sc);
                    }
                    else if (f.type === PATTERN_FILL_TYPE.STRETCH) {
                      ctx2.drawImage(loader.source!, dx2, dy2, wc, hc);
                    }
                    else if (f.type === PATTERN_FILL_TYPE.FIT) {
                      const sx = wc / loader.width;
                      const sy = hc / loader.height;
                      const sc = Math.min(sx, sy);
                      const x = (loader.width * sc - wc) * -0.5;
                      const y = (loader.height * sc - hc) * -0.5;
                      ctx2.drawImage(loader.source!, 0, 0, loader.width, loader.height,
                        x + dx2, y + dy2, loader.width * sc, loader.height * sc);
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
                  inject.loadImg(url, (data: any) => {
                    // 可能会变更，所以加载完后对比下是不是当前最新的
                    if (url === (fill[i] as ComputedPattern)?.url) {
                      loader.loading = false;
                      if (data.success) {
                        loader.error = false;
                        loader.source = data.source;
                        loader.width = data.width;
                        loader.height = data.height;
                        if (!this.isDestroyed) {
                          this.refresh();
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
                const gd = getLinear(f.stops, f.d, dx2, dy2, w - dx * 2, h - dy * 2);
                const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
                gd.stop.forEach((item) => {
                  lg.addColorStop(item.offset, color2rgbaStr(item.color));
                });
                ctx.fillStyle = lg;
              }
              else if (f.t === GRADIENT.RADIAL) {
                const gd = getRadial(f.stops, f.d, dx2, dy2, w - dx * 2, h - dy * 2);
                const rg = ctx.createRadialGradient(
                  gd.cx,
                  gd.cy,
                  0,
                  gd.cx,
                  gd.cy,
                  gd.total,
                );
                gd.stop.forEach((item) => {
                  rg.addColorStop(item.offset, color2rgbaStr(item.color));
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
                const gd = getConic(f.stops, f.d, dx2, dy2, w - dx * 2, h - dy * 2);
                const cg = ctx.createConicGradient(gd.angle, gd.cx + dx2, gd.cy + dy2);
                gd.stop.forEach((item) => {
                  cg.addColorStop(item.offset, color2rgbaStr(item.color));
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
            ctx.fillStyle = textBox.color;
            ctx.fillText(
              textBox.str,
              textBox.x * scale + dx2,
              (textBox.y + textBox.baseline) * scale + dy2,
            );
            if (textDecoration.length) {
              textDecoration.forEach(item => {
                if (item === TEXT_DECORATION.UNDERLINE) {
                  const h = Math.min(3 * scale, textBox.lineHeight * 0.05 * scale);
                  ctx.fillRect(
                    textBox.x * scale + dx2,
                    (textBox.y + textBox.contentArea) * scale + dy2 - h * 0.5,
                    textBox.w * scale,
                    h,
                  );
                }
                else if (item === TEXT_DECORATION.LINE_THROUGH) {
                  const h = Math.min(3 * scale, textBox.lineHeight * 0.05 * scale);
                  ctx.fillRect(
                    textBox.x * scale + dx2,
                    (textBox.y + textBox.lineHeight * 0.5) * scale + dy2 - h * 0.5,
                    textBox.w * scale,
                    h,
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
                textBox.x * scale + dx2,
                (textBox.y + textBox.baseline) * scale + dy2,
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
            const gd = getLinear(s.stops, s.d, dx2, dy2, w - dx * 2, h - dy * 2);
            const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
            gd.stop.forEach((item) => {
              lg.addColorStop(item.offset, color2rgbaStr(item.color));
            });
            ctx.strokeStyle = lg;
          }
          else if (s.t === GRADIENT.RADIAL) {
            const gd = getRadial(s.stops, s.d, dx2, dy2, w - dx * 2, h - dy * 2);
            const rg = ctx.createRadialGradient(
              gd.cx,
              gd.cy,
              0,
              gd.cx,
              gd.cy,
              gd.total,
            );
            gd.stop.forEach((item) => {
              rg.addColorStop(item.offset, color2rgbaStr(item.color));
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
            const gd = getConic(s.stops, s.d, dx2, dy2, w - dx * 2, h - dy * 2);
            const cg = ctx.createConicGradient(gd.angle, gd.cx + dx2, gd.cy + dy2);
            gd.stop.forEach((item) => {
              cg.addColorStop(item.offset, color2rgbaStr(item.color));
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
          ctx.drawImage(os.canvas, dx2 - dx, dy2 - dy);
          os.release();
        }
        // 还原
        ctx.globalCompositeOperation = 'source-over';
      }

      // list[i].os.canvas.toBlob(blob => {
      //   if (blob) {
      //     const img = document.createElement('img');
      //     img.style.position = 'absolute';
      //     img.src = URL.createObjectURL(blob);
      //     document.body.appendChild(img);
      //   }
      // });
    }
  }

  // 根据绝对坐标获取光标位置，同时设置开始光标位置，单个光标复用，end被同步为start
  setCursorStartByAbsCoords(x: number, y: number) {
    const m = this.matrixWorld;
    const im = inverse4(m);
    const local = calPoint({ x, y }, im);
    const lineBoxList = this.lineBoxList;
    const cursor = this.cursor;
    const start = cursor.start;
    cursor.isMulti = false;
    const len = lineBoxList.length;
    for (let i = 0; i < len; i++) {
      const lineBox = lineBoxList[i];
      // 确定y在哪一行后
      if (local.y >= lineBox.y && local.y < lineBox.y + lineBox.lineHeight) {
        cursor.startLineBox = cursor.endLineBox = i;
        const res = this.getCursorByLocalX(local.x, lineBox, false);
        cursor.endTextBox = cursor.startTextBox;
        cursor.endString = cursor.startString;
        cursor.end = cursor.start;
        this.tempCursorX = this.currentCursorX = res.x;
        // 点在老的地方不清空，防止连续点击同一位置
        if (cursor.start !== start) {
          this.inputStyle = undefined;
        }
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
    cursor.startLineBox = cursor.endLineBox = len - 1;
    const res = this.getCursorByLocalX(this.width, lineBox, false);
    cursor.endTextBox = cursor.startTextBox;
    cursor.endString = cursor.startString;
    cursor.end = cursor.start;
    this.tempCursorX = this.currentCursorX = res.x;
    // 点在老的地方不清空，防止连续点击同一位置
    if (cursor.start !== start) {
      this.inputStyle = undefined;
    }
    const p = calPoint({ x: res.x, y: res.y }, m);
    return {
      x: p.x,
      y: p.y,
      h: res.h * m[0],
    };
  }

  // 设置结束光标位置，多选时用
  setCursorEndByAbsCoords(x: number, y: number) {
    const m = this.matrixWorld;
    const im = inverse4(m);
    const local = calPoint({ x: x, y: y }, im);
    const lineBoxList = this.lineBoxList;
    const cursor = this.cursor;
    const end = cursor.end;
    cursor.isMulti = true;
    const len = lineBoxList.length;
    for (let i = 0; i < len; i++) {
      const lineBox = lineBoxList[i];
      // 确定y在哪一行后
      if (local.y >= lineBox.y && local.y < lineBox.y + lineBox.lineHeight) {
        cursor.endLineBox = i;
        const res = this.getCursorByLocalX(local.x, lineBox, true);
        // 变化需要更新渲染
        if (cursor.end !== end) {
          this.refresh();
        }
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
    cursor.endLineBox = len - 1;
    const res = this.getCursorByLocalX(this.width, lineBox, true);
    // 变化需要更新渲染
    if (cursor.end !== end) {
      this.refresh();
    }
    // 多选区清空输入的新样式，如果在原地轻微移动不改变end则保持panel设置的新样式，防止手抖
    if (cursor.end !== cursor.start) {
      this.inputStyle = undefined;
    }
    const p = calPoint({ x: res.x, y: res.y }, m);
    return {
      x: p.x,
      y: p.y,
      h: res.h * m[0],
    };
  }

  // 重置为非multi，如有需要刷新取消选区
  resetCursor() {
    const cursor = this.cursor;
    if (cursor.isMulti) {
      cursor.isMulti = false;
      if (cursor.start !== cursor.end) {
        this.refresh();
        cursor.endLineBox = cursor.startLineBox;
        cursor.endTextBox = cursor.startTextBox;
        cursor.endString = cursor.startString;
        cursor.end = cursor.start;
      }
    }
  }

  /**
   * 改变内容影响定位尺寸前防止中心对齐导致位移，一般情况是left%+translateX:-50%（水平方向，垂直同理），
   * 先记录此时style，再将left换算成translateX为0的值，为了兼容translateX的任意非零%值。
   * 一般状态下左对齐，将left变为px绝对值，这样内容改变重新排版的时候x坐标就不变，结束后还原回来。
   * 首要考虑textAlign，它的优先级高于对应方位的布局信息（比如居右对齐即便left是px都忽略，强制右侧对齐，视觉不懂css布局）。
   */
  beforeEdit() {
    const {
      style,
      computedStyle,
      parent,
      isDestroyed,
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
      && !isFixedWidth
      && (
        left.u !== StyleUnit.AUTO
        && translateX.v
        && translateX.u === StyleUnit.PERCENT // 一般情况
        || right.u !== StyleUnit.AUTO // 特殊情况，虽然right定位了，但是左对齐，视觉只会认为应该右边变
      );
    // 类似left，但考虑translate是否-50%，一般都是，除非人工脏数据
    const isCenter = textAlign.v === TEXT_ALIGN.CENTER
      && !isFixedWidth
      && (translateX.v !== -50 || translateX.u !== StyleUnit.PERCENT);
    // right比较绕，定宽或者右定位都无效，提取规则发现需要right为auto
    const isRight = textAlign.v === TEXT_ALIGN.RIGHT
      && right.u === StyleUnit.AUTO;
    // 同水平
    const isFixedHeight = top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO
      || height.u !== StyleUnit.AUTO;
    const isTop = textVerticalAlign.v === TEXT_VERTICAL_ALIGN.TOP
      && !isFixedHeight
      && (
        top.u !== StyleUnit.AUTO
        && translateY.v
        && translateY.u === StyleUnit.PERCENT
        || bottom.u !== StyleUnit.AUTO
      );
    const isMiddle = textVerticalAlign.v === TEXT_VERTICAL_ALIGN.MIDDLE
      && !isFixedHeight
      && (translateY.v !== -50 || translateY.u !== StyleUnit.PERCENT);
    const isBottom = textVerticalAlign.v === TEXT_VERTICAL_ALIGN.BOTTOM
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
        computedStyle.left += tx;
        if (left.u === StyleUnit.PX) {
          left.v += tx;
        }
        else if (left.u === StyleUnit.PERCENT) {
          left.v += tx * 100 / pw;
        }
        // 可能是auto，自动宽度，也可能人工数据
        computedStyle.right -= tx;
        if (right.u === StyleUnit.PX) {
          right.v -= tx;
        }
        else if (right.u === StyleUnit.PERCENT) {
          right.v -= tx * 100 / pw;
        }
      }
      else if (right.u !== StyleUnit.AUTO) {
        impact = true;
        computedStyle.left += tx;
        left.v = computedStyle.left;
        left.u = StyleUnit.PX;
        computedStyle.right -= tx;
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
        computedStyle.left += dx;
        computedStyle.right -= dx;
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
          const dx = w * 0.5 - translateX.v * w;
          computedStyle.left += dx;
          computedStyle.right -= dx;
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
        }
      }
    }
    else if (isRight) {
      impact = true;
      computedStyle.left += tx;
      // 有left时right一定是auto，改成left是auto且right是固定
      if (left.u !== StyleUnit.AUTO) {
        left.v = 0;
        left.u = StyleUnit.AUTO;
      }
      // right变为固定值+translate归零，虽然tx是px时无需关心，但统一逻辑最后还原
      computedStyle.right -= tx;
      right.v = computedStyle.right;
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
        computedStyle.top += ty;
        if (top.u === StyleUnit.PX) {
          top.v += ty;
        }
        else if (top.u === StyleUnit.PERCENT) {
          top.v += ty * 100 / ph;
        }
        // 可能是auto，自动宽度，也可能人工数据
        computedStyle.bottom -= ty;
        if (bottom.u === StyleUnit.PX) {
          bottom.v -= ty;
        }
        else if (bottom.u === StyleUnit.PERCENT) {
          bottom.v -= ty * 100 / ph;
        }
      }
      else if (bottom.u !== StyleUnit.AUTO) {
        impact = true;
        computedStyle.top += ty;
        top.v = computedStyle.top;
        top.u = StyleUnit.PX;
        computedStyle.bottom -= ty;
        bottom.v = 0;
        bottom.u = StyleUnit.AUTO;
      }
      translateY.v = 0;
    }
    else if (isMiddle) {
      if (translateY.u === StyleUnit.AUTO || translateY.u === StyleUnit.PX) {
        impact = true;
        const dy = h * 0.5 - translateY.v;
        computedStyle.top += dy;
        computedStyle.bottom -= dy;
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
          computedStyle.top += dy;
          computedStyle.bottom -= dy;
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
      computedStyle.top += ty;
      if (top.u !== StyleUnit.AUTO) {
        top.v = 0;
        top.u = StyleUnit.AUTO;
      }
      computedStyle.bottom -= ty;
      bottom.v = computedStyle.bottom;
      bottom.u = StyleUnit.PX;
      translateY.v = 0;
    }
    if (isFixedHeight) {
      // impact = true;
      // if (top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO) {
      //   if (isBottom) {
      //     this.updateStyle({
      //       top: 'auto',
      //     });
      //   }
      //   else {
      //     this.updateStyle({
      //       bottom: 'auto',
      //     });
      //   }
      // }
      // else if (height.u !== StyleUnit.AUTO) {
      //   this.updateStyle({
      //     height: 'auto',
      //   });
      // }
    }
    // 无影响则返回空，结束无需还原
    if (!impact) {
      return;
    }
    return this.editStyle = {
      isLeft,
      isCenter,
      isRight,
      isTop,
      isMiddle,
      isBottom,
      isFixedHeight,
      prev,
    };
  }

  // 和beforeEdit()对应，可能prev为空即无需关心样式还原问题。
  afterEdit() {
    if (!this.editStyle) {
      return;
    }
    const {
      isLeft,
      isCenter,
      isRight,
      isTop,
      isMiddle,
      isBottom,
      isFixedHeight,
      prev,
    } = this.editStyle;
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
      height,
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
      style.left.u = left.u;
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
    if (isFixedHeight) {
      // if (prev.top.u !== StyleUnit.AUTO && prev.bottom.u !== StyleUnit.AUTO) {
      //   if (isBottom) {
      //     if (prev.top.u === StyleUnit.PERCENT) {
      //       this.updateStyle({
      //         top: prev.top.v + '%',
      //       });
      //     }
      //     else {
      //       this.updateStyle({
      //         top: prev.top.v,
      //       });
      //     }
      //   }
      //   else {
      //     if (prev.bottom.u === StyleUnit.PERCENT) {
      //       this.updateStyle({
      //         bottom: prev.bottom.v + '%',
      //       });
      //     }
      //     else {
      //       this.updateStyle({
      //         bottom: prev.bottom.v,
      //       });
      //     }
      //   }
      // }
      // else if (prev.height.u !== StyleUnit.AUTO) {
      //   if (prev.height.u === StyleUnit.PERCENT) {
      //     this.updateStyle({
      //       height: prev.height.v + '%',
      //     });
      //   }
      //   else {
      //     this.updateStyle({
      //       height: prev.height.v + '%',
      //     });
      //   }
      // }
    }
  }

  // 根据字符串索引更新光标
  updateCursorByIndex(index: number) {
    const { lineBox, textBox } = this.setCursorByIndex(index, false);
    const { cursor, matrixWorld } = this;
    // 是否空行
    if (textBox) {
      const ctx = inject.getFontCanvas().ctx;
      ctx.font = textBox.font;
      // @ts-ignore
      ctx.letterSpacing = textBox.letterSpacing + 'px';
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
    return {
      x: p.x,
      y: p.y,
      h: lineBox.lineHeight * matrixWorld[0],
    };
  }

  setCursorByIndex(index: number, isEnd = false) {
    const lineBoxList = this.lineBoxList;
    const cursor = this.cursor;
    if (isEnd) {
      cursor.end = index;
    }
    else {
      cursor.start = index;
    }
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
      if (cursor.start === cursor.end) {
        cursor.isMulti = false;
      }
    }
    return cursor.isMulti;
  }

  // 获取光标当前坐标，无视multi，只取开头，一般在滚动画布时更新获取新位置
  getCursorAbsCoords() {
    const m = this.matrixWorld;
    const lineBoxList = this.lineBoxList;
    const cursor = this.cursor;
    if (cursor.isMulti) {
      return;
    }
    const lineBox = lineBoxList[cursor.startLineBox];
    const list = lineBox.list;
    const rh = lineBox.lineHeight;
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
      const p = calPoint({ x, y: lineBox.y }, m);
      return {
        x: p.x,
        y: p.y,
        h: rh * m[0],
      };
    }
    const p = calPoint({ x: this.currentCursorX, y: lineBox.y }, m);
    return {
      x: p.x,
      y: p.y,
      h: rh * m[0],
    };
  }

  // 上下左右按键移动光标，上下保持当前x（tempCursorX），左右则更新
  moveCursor(code: number, isEnd = false) {
    const matrix = this.matrixWorld;
    // 先求得当前光标位置在字符串的索引
    const cursor = this.cursor;
    const sorted = this.getSortedCursor();
    let i = isEnd ? sorted.endLineBox : sorted.startLineBox;
    let j = isEnd ? sorted.endTextBox : sorted.startTextBox;
    let k = isEnd ? sorted.endString : sorted.startString;
    let lineBoxList = this.lineBoxList;
    let lineBox = lineBoxList[i];
    let list = lineBox.list;
    let textBox = list[j];
    let pos = isEnd ? sorted.end : sorted.start;
    // multi移动光标原地取消多选
    if (cursor.isMulti && !isEnd) {
      cursor.isMulti = false;
      if (cursor.start !== cursor.end) {
        this.refresh();
      }
      // 左上光标到开头，右下到结尾
      if (code === 39 || code === 40) {
        const { endLineBox: l, endTextBox: m, endString: n } = sorted;
        lineBox = lineBoxList[l];
        list = lineBox.list;
        textBox = list[m];
        pos = textBox ? (textBox.index + n) : (lineBox.index + n);
      }
      this.inputStyle = undefined;
      // 更新会把当前值赋给start
      return this.updateCursorByIndex(pos);
    }
    else if (isEnd) {
      cursor.isMulti = true;
    }
    // 左
    if (code === 37) {
      if (pos === 0) {
        return;
      }
      // textBox开头
      if (k === 0) {
        // 行开头要到上行末尾
        if (j === 0) {
          if (isEnd) {
            cursor.endLineBox = --i;
          }
          else {
            cursor.startLineBox = --i;
          }
          lineBox = lineBoxList[i];
          list = lineBox.list;
          // 防止上一行是空行
          if (!list.length) {
            if (isEnd) {
              cursor.endTextBox = 0;
              cursor.endString = 0;
              cursor.end = lineBox.index;
            }
            else {
              cursor.startTextBox = 0;
              cursor.startString = 0;
              cursor.start = lineBox.index;
            }
          }
          else {
            if (isEnd) {
              cursor.endTextBox = j = list.length - 1;
            }
            else {
              cursor.startTextBox = j = list.length - 1;
            }
            // 看是否是enter，决定是否到末尾
            textBox = list[j];
            if (isEnd) {
              cursor.endString = textBox.str.length - (lineBox.endEnter ? 0 : 1);
              cursor.end = textBox.index + cursor.endString;
            }
            else {
              cursor.startString = textBox.str.length - (lineBox.endEnter ? 0 : 1);
              cursor.start = textBox.index + cursor.startString;
            }
          }
        }
        // 非行开头到上个textBox末尾
        else {
          if (isEnd) {
            cursor.endTextBox = --j;
          }
          else {
            cursor.startTextBox = --j;
          }
          textBox = list[j];
          if (isEnd) {
            cursor.endString = textBox.str.length - 1;
            cursor.end = textBox.index + cursor.endString;
          }
          else {
            cursor.startString = textBox.str.length - 1;
            cursor.start = textBox.index + cursor.startString;
          }
        }
      }
      // textBox内容中
      else {
        if (isEnd) {
          cursor.endString = --k;
          cursor.end = textBox.index + cursor.endString;
        }
        else {
          cursor.startString = --k;
          cursor.start = textBox.index + cursor.startString;
        }
      }
    }
    // 上
    else if (code === 38) {
      if (pos === 0) {
        return;
      }
      // 第一行到开头
      if (i === 0) {
        if (isEnd) {
          cursor.endTextBox = 0;
        }
        else {
          cursor.startTextBox = 0;
        }
        textBox = list[0];
        if (isEnd) {
          cursor.endString = 0;
          cursor.end = 0;
        }
        else {
          cursor.startString = 0;
          cursor.start = 0;
        }
      }
      // 向上一行找最接近的，保持当前的x，直接返回结果
      else {
        lineBox = lineBoxList[--i];
        if (isEnd) {
          cursor.endLineBox = i;
        }
        else {
          cursor.startLineBox = i;
        }
        const res = this.getCursorByLocalX(this.tempCursorX, lineBox, isEnd);
        if (isEnd) {
          this.refresh();
        }
        this.inputStyle = undefined;
        const p = calPoint({ x: res.x, y: res.y }, matrix);
        return {
          x: p.x,
          y: p.y,
          h: lineBox.lineHeight * matrix[0],
        };
      }
    }
    // 右
    else if (code === 39) {
      if (pos === this._content.length) {
        return;
      }
      // 本行空行，或者已经到行末尾且是enter换行
      if (
        !textBox ||
        (j === list.length - 1 && k === textBox.str.length && lineBox.endEnter)
      ) {
        if (isEnd) {
          cursor.endLineBox = ++i;
          cursor.endTextBox = 0;
          cursor.endString = 0;
        }
        else {
          cursor.startLineBox = ++i;
          cursor.startTextBox = 0;
          cursor.startString = 0;
        }
        lineBox = lineBoxList[i];
        list = lineBox.list;
        textBox = list[0];
        if (isEnd) {
          cursor.end = textBox.index;
        }
        else {
          cursor.start = textBox.index;
        }
      }
      // 已经到行末尾，自动换行用鼠标也能点到末尾但按键统一下行，下行一定不是空行
      else if (j === list.length - 1 && k === textBox.str.length) {
        if (isEnd) {
          cursor.endLineBox = ++i;
          cursor.endTextBox = 0;
          cursor.endString = 1;
        }
        else {
          cursor.startLineBox = ++i;
          cursor.startTextBox = 0;
          cursor.startString = 1;
        }
        lineBox = lineBoxList[i];
        list = lineBox.list;
        textBox = list[0];
        if (isEnd) {
          cursor.end = textBox.index + 1;
        }
        else {
          cursor.start = textBox.index + 1;
        }
      }
      // 已经到textBox末尾（行中非行尾），等同于next的开头
      else if (k === textBox.str.length) {
        if (isEnd) {
          cursor.endTextBox = ++j;
        }
        else {
          cursor.startTextBox = ++j;
        }
        textBox = list[j];
        if (isEnd) {
          cursor.endString = 1;
          cursor.end = textBox.index + 1;
        }
        else {
          cursor.startString = 1;
          cursor.start = textBox.index + 1;
        }
        // 歧义的原因，可能此时已经到了行尾（最后一个textBox只有1个字符，光标算作prev的末尾时右移），如果不是enter要视作下行开头
        if (j === list.length - 1 && textBox.str.length === 1) {
          if (!lineBox.endEnter && i < lineBoxList.length - 1) {
            if (isEnd) {
              cursor.endLineBox = ++i;
            }
            else {
              cursor.startLineBox = ++i;
            }
            lineBox = lineBoxList[i];
            list = lineBox.list;
            if (isEnd) {
              cursor.endTextBox = j = 0;
            }
            else {
              cursor.startTextBox = j = 0;
            }
            textBox = list[j];
            if (isEnd) {
              cursor.endString = 0;
              cursor.end = textBox.index;
            }
            else {
              cursor.startString = 0;
              cursor.start = textBox.index;
            }
          }
        }
      }
      // textBox即将到末尾（差一个）
      else if (k === textBox.str.length - 1) {
        // 行末尾特殊检查是否是回车导致的换行，回车停留在末尾，否则到下行开头，最后一行也停留
        if (j === list.length - 1) {
          if (lineBox.endEnter || i === lineBoxList.length - 1) {
            if (isEnd) {
              cursor.endString++;
              cursor.end = textBox.index + cursor.endString;
            }
            else {
              cursor.startString++;
              cursor.start = textBox.index + cursor.startString;
            }
          }
          else {
            if (isEnd) {
              cursor.endLineBox = ++i;
            }
            else {
              cursor.startLineBox = ++i;
            }
            lineBox = lineBoxList[i];
            list = lineBox.list;
            if (isEnd) {
              cursor.endTextBox = j = 0;
            }
            else {
              cursor.startTextBox = j = 0;
            }
            textBox = list[j];
            if (isEnd) {
              cursor.endString = 0;
              cursor.end = textBox.index;
            }
            else {
              cursor.startString = 0;
              cursor.start = textBox.index;
            }
          }
        }
        // 非行末尾到下个textBox开头
        else {
          if (isEnd) {
            cursor.endTextBox = ++j;
          }
          else {
            cursor.startTextBox = ++j;
          }
          textBox = list[j];
          if (isEnd) {
            cursor.endString = 0;
            cursor.end = textBox.index;
          }
          else {
            cursor.startString = 0;
            cursor.start = textBox.index;
          }
        }
      }
      // textBox非末尾
      else {
        if (isEnd) {
          cursor.endString = ++k;
          cursor.end = textBox.index + cursor.endString;
        }
        else {
          cursor.startString = ++k;
          cursor.start = textBox.index + cursor.startString;
        }
      }
    }
    // 下
    else if (code === 40) {
      if (pos === this._content.length) {
        return;
      }
      // 最后一行到末尾
      if (i === lineBoxList.length - 1) {
        if (isEnd) {
          cursor.endTextBox = j = list.length - 1;
        }
        else {
          cursor.startTextBox = j = list.length - 1;
        }
        textBox = list[j];
        if (isEnd) {
          cursor.endString = textBox ? textBox.str.length : 0;
          cursor.end = textBox.index + cursor.endString;
        }
        else {
          cursor.startString = textBox ? textBox.str.length : 0;
          cursor.start = textBox.index + cursor.startString;
        }
      }
      // 向下一行找最接近的，保持当前的x，直接返回结果
      else {
        lineBox = lineBoxList[++i];
        if (isEnd) {
          cursor.endLineBox = i;
        }
        else {
          cursor.startLineBox = i;
        }
        const res = this.getCursorByLocalX(this.tempCursorX, lineBox, isEnd);
        if (isEnd) {
          this.refresh();
        }
        this.inputStyle = undefined;
        const p = calPoint({ x: res.x, y: res.y }, matrix);
        return {
          x: p.x,
          y: p.y,
          h: lineBox.lineHeight * matrix[0],
        };
      }
    }
    // 左右和特殊情况的上下（到行首行尾），前面计算了cursorIndex的位置，据此获取光标位置，并记录x
    if (textBox) {
      const ctx = inject.getFontCanvas().ctx;
      ctx.font = textBox.font;
      // @ts-ignore
      ctx.letterSpacing = textBox.letterSpacing + 'px';
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
    if (isEnd) {
      this.refresh();
    }
    this.inputStyle = undefined;
    const p = calPoint({ x: this.currentCursorX, y: lineBox.y }, matrix);
    return {
      x: p.x,
      y: p.y,
      h: lineBox.lineHeight * matrix[0],
    };
  }

  selectAll() {
    const lineBoxList = this.lineBoxList;
    const len = lineBoxList.length;
    const lastTextBox = lineBoxList[len - 1];
    const list = lastTextBox?.list;
    const last = list ? list[list.length - 1] : undefined;
    Object.assign(this.cursor, {
      isMulti: true,
      startLineBox: 0,
      startTextBox: 0,
      startString: 0,
      start: 0,
      endLineBox: len - 1,
      endTextBox: list ? list.length - 1 : 0,
      endString: last ? last.str.length : 0,
      end: this._content.length,
    });
    this.refresh();
  }

  /**
   * 在左百分比+宽度自动的情况，输入后要保持原本的位置，因为是中心点百分比对齐父级，
   * 其它几种都不需要：左右百分比定宽、左固定、右固定、左百分比+定宽，
   * 不会出现仅右百分比的情况，所有改变处理都一样
   */
  input(s: string) {
    const { isMulti, start, end } = this.getSortedCursor();
    let c = this._content;
    // 选择区域特殊情况，先删除掉这一段文字，还要使用选区开头的样式
    if (isMulti) {
      const r = this.getCursorRich();
      this.cursor.isMulti = false;
      this._content = c.slice(0, start) + c.slice(end);
      this.cutRich(start, end);
      c = this._content;
      this._content = c.slice(0, start) + s + c.slice(start);
      this.insertRich(r[0], start, s.length);
    }
    // 有新增的输入样式
    else if (this.inputStyle) {
      const r = this.getCursorRich();
      this._content = c.slice(0, start) + s + c.slice(start);
      this.insertRich(Object.assign({}, r[0], this.inputStyle), start, s.length);
      this.inputStyle = undefined;
    }
    // 否则是在当前Rich上增加内容
    else {
      this._content = c.slice(0, start) + s + c.slice(start);
      this.expandRich(start, s.length);
    }
    this.refresh(RefreshLevel.REFLOW);
    this.updateCursorByIndex(start + s.length);
  }

  // 按下回车触发
  enter() {
    this.inputStyle = undefined;
    const { isMulti, start, end } = this.getSortedCursor();
    // 选择区域特殊情况，先删除掉这一段文字
    if (isMulti) {
      this.cursor.isMulti = false;
      this.cutRich(start, end);
      const c = this._content;
      this._content = c.slice(0, start) + c.slice(end);
    }
    this.expandRich(start, 1);
    const c = this._content;
    this._content = c.slice(0, start) + '\n' + c.slice(start);
    this.refresh(RefreshLevel.REFLOW);
    this.updateCursorByIndex(start + 1);
  }

  // 按下delete键触发
  delete(isDeleteKey = false) {
    this.inputStyle = undefined;
    const c = this._content;
    // 没内容没法删
    if (!c) {
      return;
    }
    const { isMulti, start, end } = this.getSortedCursor();
    // 开头backspace没法删
    if (start < 1 && !isMulti && !isDeleteKey) {
      return;
    }
    // 结尾delete键没法删
    else if (start === c.length && isDeleteKey) {
      return;
    }
    if (isMulti) {
      this.cursor.isMulti = false;
      this._content = c.slice(0, start) + c.slice(end);
      this.cutRich(start, end);
    }
    else if (isDeleteKey) {
      this._content = c.slice(0, start) + c.slice(start + 1);
      this.cutRich(start, start + 1);
    }
    else {
      this._content = c.slice(0, start - 1) + c.slice(start);
      this.cutRich(start - 1, start);
    }
    this.refresh(RefreshLevel.REFLOW);
    if (isMulti || isDeleteKey) {
      this.updateCursorByIndex(start);
    }
    else {
      this.updateCursorByIndex(start - 1);
    }
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
      cursor.endString = cursor.end = 0;
    }
    else {
      cursor.startString = cursor.start = 0;
    }
    outer:
    for (let i = 0, len = list.length; i < len; i++) {
      const textBox = list[i];
      const { x, w, str, font, letterSpacing } = textBox;
      // x位于哪个textBox上，注意开头结尾
      if (
        (!i && localX < x) ||
        (localX >= x && localX < x + w) ||
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
        ctx.letterSpacing = letterSpacing + 'px';
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
                cursor.end = textBox.index + end;
              }
              else {
                cursor.startString = end;
                cursor.start = textBox.index + end;
              }
            }
            else {
              rx = x + w1;
              if (isEnd) {
                cursor.endString = start;
                cursor.end = textBox.index + start;
              }
              else {
                cursor.startString = start;
                cursor.start = textBox.index + start;
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
              cursor.end = textBox.index + mid;;
            }
            else {
              cursor.startString = mid;
              cursor.start = textBox.index + mid;
            }
            rx = x + w;
            break outer;
          }
        }
      }
    }
    // 如果处在相邻的2个textBox，都设置到后面那个
    const ti = isEnd ? cursor.endTextBox : cursor.startTextBox;
    if (ti < list.length - 1) {
      const textBox = list[ti];
      const si = isEnd ? cursor.endString : cursor.startString;
      if (si === textBox.str.length) {
        if (isEnd) {
          cursor.endTextBox++;
          cursor.endString = 0;
          cursor.end = list[ti + 1].index;
        }
        else {
          cursor.startTextBox++;
          cursor.startString = 0;
          cursor.start = list[ti + 1].index;
        }
      }
    }
    // 空行特殊判断对齐方式
    if (!list.length) {
      if (isEnd) {
        cursor.endString = 0;
        cursor.end = lineBox.index;
      }
      else {
        cursor.startString = 0;
        cursor.start = lineBox.index;
      }
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

  getRich() {
    return this.rich.map(item => {
      return Object.assign({}, item);
    });
  }

  setRich(rich: Rich[]) {
    this.rich = rich;
    this.refresh(RefreshLevel.REFLOW);
  }

  getCursor() {
    return Object.assign({}, this.cursor);
  }

  updateRangeStyle(location: number, length: number, st: ModifyRichStyle) {
    const lv = this.updateRangeStyleData(location, length, st);
    if (lv) {
      this.refresh(lv);
    }
    return lv;
  }

  // 传入location/length，修改范围内的Rich的样式，一般来源是TextPanel中改如颜色
  updateRangeStyleData(location: number, length: number, st: ModifyRichStyle) {
    let lv = RefreshLevel.NONE;
    // 开头同时更新节点本身默认样式
    if (location === 0) {
      const { style, computedStyle } = this;
      if (st.fontFamily !== undefined) {
        style.fontFamily.v = computedStyle.fontFamily = st.fontFamily;
      }
      if (st.fontSize !== undefined) {
        style.fontSize.v = computedStyle.fontSize = st.fontSize;
      }
      if (st.color !== undefined) {
        style.color.v = computedStyle.color = color2rgbaInt(st.color);
      }
      if (st.letterSpacing !== undefined) {
        style.letterSpacing.v = computedStyle.letterSpacing = st.letterSpacing;
      }
      if (st.lineHeight !== undefined) {
        if (st.lineHeight === 0) {
          style.lineHeight.v = 0;
          style.lineHeight.u = StyleUnit.AUTO;
          computedStyle.lineHeight = calNormalLineHeight(computedStyle);
        }
        else {
          style.lineHeight.v = computedStyle.lineHeight = st.lineHeight;
          style.lineHeight.u = StyleUnit.PX;
        }
      }
      if (st.paragraphSpacing !== undefined) {
        style.paragraphSpacing.v = computedStyle.paragraphSpacing = st.paragraphSpacing;
      }
      if (st.textAlign !== undefined) {
        style.textAlign.v = computedStyle.textAlign = st.textAlign;
      }
      if (st.textDecoration !== undefined) {
        style.textDecoration = st.textDecoration.map(item => ({
          v: item,
          u: StyleUnit.NUMBER,
        }));
        computedStyle.textDecoration = st.textDecoration.slice(0);
      }
    }
    const rich = this.rich;
    for (let i = 0, len = rich.length; i < len; i++) {
      if (length < 1) {
        break;
      }
      const item = rich[i];
      // 修改的location在Rich的范围内命中
      if (location >= item.location && location < item.location + item.length) {
        // 不是此Rich的开头，则将前面一部分拆分出去
        if (location > item.location) {
          const prev = {
            ...item,
            length: location - item.location,
          };
          rich.splice(i, 0, prev);
          i++;
          len++;
          item.location += prev.length;
          item.length -= prev.length;
        }
        // 不到此Rich的结尾，则将后面一部分拆分出去，并且标识本次结束循环
        let shouldBreak = false;
        if (location + length < item.location + item.length) {
          const next = {
            ...item,
            location: location + length,
            length: item.location + item.length - location - length,
          };
          rich.splice(i + 1, 0, next);
          item.length -= next.length;
          shouldBreak = true;
        }
        // 可能存在的prev/next操作后（也可能没有），此Rich本身更新
        lv |= this.updateRichItem(item, st);
        if (shouldBreak) {
          break;
        }
        // 如果蔓延到后面的Rich，修改索引继续循环
        location += item.length;
        length -= item.length;
      }
    }
    this.mergeRich();
    return lv;
  }

  updateRichItem(item: Rich, style: ModifyRichStyle) {
    let lv = RefreshLevel.NONE;
    if (style.fontFamily !== undefined && style.fontFamily !== item.fontFamily) {
      item.fontFamily = style.fontFamily;
      lv |= RefreshLevel.REFLOW;
    }
    if (style.fontSize !== undefined && style.fontSize !== item.fontSize) {
      item.fontSize = style.fontSize;
      lv |= RefreshLevel.REFLOW;
    }
    if (style.color !== undefined) {
      const c = color2rgbaInt(style.color);
      if (
        item.color[0] !== c[0]
        || item.color[1] !== c[1]
        || item.color[2] !== c[2]
        || item.color[3] !== c[3]
      ) {
        item.color = c;
        lv |= RefreshLevel.REFLOW;
      }
    }
    if (style.letterSpacing !== undefined && style.letterSpacing !== item.letterSpacing) {
      item.letterSpacing = style.letterSpacing;
      lv |= RefreshLevel.REFLOW;
    }
    if (style.lineHeight !== undefined && style.lineHeight !== item.lineHeight) {
      item.lineHeight = style.lineHeight;
      lv |= RefreshLevel.REFLOW;
    }
    if (style.paragraphSpacing !== undefined && style.paragraphSpacing !== item.paragraphSpacing) {
      item.paragraphSpacing = style.paragraphSpacing;
      lv |= RefreshLevel.REFLOW;
    }
    if (style.textAlign !== undefined && style.textAlign !== item.textAlign) {
      item.textAlign = style.textAlign;
      lv |= RefreshLevel.REFLOW;
    }
    if (style.textDecoration !== undefined && style.textDecoration !== item.textDecoration) {
      item.textDecoration = style.textDecoration;
      lv |= RefreshLevel.REFLOW;
    }
    return lv;
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
          for (let j = i + 1, len = rich.length; j < len; j++) {
            const item2 = rich[j];
            if (item2.location <= end && (item2.location + item2.length > end || j === len - 1)) {
              item2.length -= end - item2.location;
              item2.location -= count;
              // 后续的偏移
              for (let k = j + 1, len = rich.length; k < len; k++) {
                rich[k].location -= count;
              }
              // 开始和结束的rich中间有的话删除
              if (i < j - 1) {
                rich.splice(i + 1, j - i - 1);
              }
              // end是末尾时会遇到
              if (!item2.length) {
                rich.splice(j, 1);
              }
              break;
            }
          }
          if (!item.length) {
            rich.splice(i, 1);
          }
        }
        break;
      }
    }
    this.mergeRich();
  }

  // 输入文字后扩展所在位置的rich
  private expandRich(start: number, length: number) {
    const { rich, _content: content } = this;
    // 空内容下，start会是0
    if (!rich.length) {
      const computedStyle = this.computedStyle;
      rich.push({
        location: start,
        length,
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        fontWeight: 400,
        fontStyle: 'normal',
        letterSpacing: computedStyle.letterSpacing,
        textAlign: [TEXT_ALIGN.LEFT, TEXT_ALIGN.RIGHT, TEXT_ALIGN.CENTER, TEXT_ALIGN.JUSTIFY][computedStyle.textAlign],
        textDecoration: computedStyle.textDecoration,
        lineHeight: computedStyle.lineHeight,
        paragraphSpacing: computedStyle.paragraphSpacing,
        color: computedStyle.color,
      });
      return;
    }
    start = Math.max(0, start);
    // 处在两个location之间的，以前一个样式为准，\n分割的话点击首尾的start不同需特殊处理行头，只考虑行首即可因为点不到\n后面（lineBox不包含\n）
    for (let i = 0, len = rich.length; i < len; i++) {
      const item = rich[i];
      // 用<=start防止开头0时无法命中，另外\n换行点行首也会命中；>=start则命中交界处的前一个
      if (item.location <= start && item.location + item.length >= start) {
        if (start === item.location + item.length && content.charAt(start - 1) === '\n') {
          continue;
        }
        item.length += length;
        for (let j = i + 1; j < len; j++) {
          rich[j].location += length;
        }
        return;
      }
    }
    // 兜底末尾
    rich[rich.length - 1].length += length;
  }

  private insertRich(style: ModifyRichStyle, start: number, length: number) {
    const computedStyle = this.computedStyle;
    const st = Object.assign(
      {
        location: start,
        length,
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        fontWeight: 400,
        fontStyle: 'normal',
        letterSpacing: computedStyle.letterSpacing,
        textAlign: computedStyle.textAlign,
        textDecoration: computedStyle.textDecoration,
        lineHeight: computedStyle.lineHeight,
        paragraphSpacing: computedStyle.paragraphSpacing,
        color: computedStyle.color,
      },
      style,
    );
    st.color = color2rgbaInt(st.color);
    st.location = start;
    st.length = length;
    const rich = this.rich;
    if (!rich.length) {
      rich.push(st);
      return;
    }
    for (let i = 0, len = rich.length; i < len; i++) {
      const item = rich[i];
      if (item.location <= start && item.location + item.length >= start) {
        // 后续偏移
        for (let j = i + 1; j < len; j++) {
          rich[j].location += length;
        }
        // 看是否处在一个Rich的中间，决定是否切割这个Rich
        if (item.location === start) {
          rich.splice(i, 0, st);
          item.location += length;
        }
        else if (item.location + item.length === start) {
          rich.splice(i + 1, 0, st);
        }
        else if (item.location + item.length > start) {
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

  // 合并相邻相同的rich，排序以及校验，防止脏数据
  private mergeRich() {
    let { rich, _content: content, style } = this;
    if (!rich.length) {
      return;
    }
    this.rich = rich = rich.filter(item => item.location > -1 && item.length > 0);
    rich.sort((a, b) => {
      if (a.location === b.location) {
        return a.length - b.length;
      }
      return a.location - b.location;
    });
    let hasMerge = false;
    const dft = {
      fontFamily: style.fontFamily.v,
      fontSize: style.fontSize.v,
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacing: style.letterSpacing.v,
      textAlign: style.textAlign.v,
      textDecoration: style.textDecoration.map(item => item.v),
      lineHeight: style.lineHeight.v,
      paragraphSpacing: style.paragraphSpacing.v,
      color: style.color.v.slice(0),
    };
    // 首尾索引不合法
    if (content.length) {
      let last = rich[rich.length - 1];
      if (!rich.length || last.location + last.length < content.length) {
        rich.push({
          location: last ? last.location + last.length : 0,
          length: last ? content.length - last.location - last.length : content.length,
          ...dft,
        });
        hasMerge = true;
      }
      last = rich[rich.length - 1];
      if (last.location + last.length > content.length) {
        last.length = content.length - last.location;
        hasMerge = true;
      }
      const first = rich[0];
      if (first.location > 0) {
        rich.unshift({
          location: 0,
          length: first.location,
          ...dft,
        });
        hasMerge = true;
      }
    }
    for (let i = rich.length - 2; i >= 0; i--) {
      const a = rich[i];
      const b = rich[i + 1];
      if (!b.length) {
        rich.splice(i + 1, 1);
        continue;
      }
      if (!a.length) {
        rich.splice(i, 1);
        i++;
        continue;
      }
      const pn = a.location + a.length;
      // 索引不连续的脏数据处理，分断开和重合2种情况
      if (pn !== b.location) {
        if (pn < b.location) {
          rich.splice(i + 1, 0, {
            location: pn,
            length: b.location - pn,
            ...dft,
          });
          i += 2;
        }
        else {
          const d = a.location + a.length - b.location;
          b.location -= d;
          b.length -= d;
          i++;
        }
        hasMerge = true;
        continue;
      }
      // textAlign是个特殊对比，如果不是\n换行导致的不一样需修正一致
      if (equal(a, b, [
        'color',
        'fontFamily',
        'fontSize',
        'letterSpacing',
        'lineHeight',
        // 'textAlign',
        'textDecoration',
        'paragraphSpacing',
      ])) {
        if (a.textAlign === b.textAlign || content.charAt(b.location - 1) !== '\n') {
          a.length += b.length;
          rich.splice(i + 1, 1);
          hasMerge = true;
        }
      }
      // 如果\n单独形成样式，合并它（操作\n前后字符情况下会出现），因为它无意义
      else if (b.length === 1 && content.charAt(b.location) === '\n') {
        a.length += b.length;
        rich.splice(i + 1, 1);
        hasMerge = true;
      }
    }
    return hasMerge;
  }

  setInputStyle(style?: ModifyRichStyle) {
    if (!style) {
      this.inputStyle = undefined;
    }
    else {
      this.inputStyle = { ...this.inputStyle, ...style };
    }
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
      start,
      end,
    } = this.cursor;
    let isReversed = false;
    if (isMulti) {
      if (start > end) {
        [
          startLineBox,
          startTextBox,
          startString,
          start,
          endLineBox,
          endTextBox,
          endString,
          end,
        ] = [
          endLineBox,
          endTextBox,
          endString,
          end,
          startLineBox,
          startTextBox,
          startString,
          start,
        ];
        isReversed = true;
      }
    }
    else {
      endLineBox = startLineBox;
      endTextBox = startTextBox;
      endString = startString;
      end = start;
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
    const res: Rich[] = [];
    if (!rich.length) {
      return res;
    }
    function get2(t: number, i = 0, j = rich.length - 1) {
      while (i < j) {
        const m = Math.floor((i + j) * 0.5);
        const r = rich[m];
        if (r.location < t && r.location + r.length >= t) {
          return r;
        }
        if (r.location >= t) {
          j = Math.min(m, j - 1);
        }
        else {
          i = Math.max(m, i + 1);
        }
      }
      return rich[i];
    }
    let {
      isMulti,
      startLineBox,
      startTextBox,
      startString,
      start,
      end,
    } = this.getSortedCursor();
    // 多选区域
    if (isMulti) {
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
    // 单光标位置，以光标之前的字符为准，另外多选可能选取为空，也视为单选情况
    if (!isMulti || !res.length) {
      const lineBox = lineBoxList[startLineBox];
      const list = lineBox.list;
      // 空行
      if (!list.length) {
        const r = get2(lineBox.index);
        if (r && res.indexOf(r) === -1) {
          res.push(r);
        }
      }
      else {
        // 如果光标在textBox的开头，要取前一个的，除非当前textBox是行首取当前的
        const textBox = list[startTextBox];
        const r = get2(textBox.index + (startTextBox + startString === 0 ? 1 : startString));
        if (r && res.indexOf(r) === -1) {
          res.push(r);
        }
      }
    }
    return res;
  }

  override clone(override?: Record<string, Override[]>) {
    const props = clone(this.props);
    const oldUUid = this.uuid;
    if (override && override.hasOwnProperty(oldUUid)) {
      override[oldUUid].forEach(item => {
        const { key, value } = item;
        if (key[0] === 'content') {
          this._content = value;
        }
      });
    }
    props.uuid = uuid.v4();
    props.sourceUuid = oldUUid;
    if (this.rich) {
      props.rich = this.rich.map(item => {
        return {
          ...item,
          textAlign: ['left', 'right', 'center', 'justify'][item.textAlign] || 'left',
          textDecoration: item.textDecoration.map(o => {
            return ['none', 'underline', 'lineThrough'][o] || 'none';
          }),
          color: color2rgbaStr(item.color),
        };
      });
    }
    props.content = this._content;
    const res = new Text(props);
    res.style = clone(this.style);
    res.computedStyle = clone(this.computedStyle);
    // if (props.textBehaviour === 'auto') {
    //   res.style.width = {
    //     v: this.width,
    //     u: StyleUnit.PX,
    //   };
    //   res.style.height = {
    //     v: this.height,
    //     u: StyleUnit.PX,
    //   };
    // }
    // else if (props.textBehaviour === 'autoH') {
    //   res.style.height = {
    //     v: this.height,
    //     u: StyleUnit.PX,
    //   };
    // }
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
    const rich = this.rich.length ? this.rich : (this._content ? [{
      location: 0,
      length: this._content.length,
      fontFamily: this.computedStyle.fontFamily,
      fontSize: this.computedStyle.fontSize,
      fontWeight: this.computedStyle.fontWeight,
      letterSpacing: this.computedStyle.letterSpacing,
      textAlign: this.computedStyle.textAlign,
      textDecoration: this.computedStyle.textDecoration,
      lineHeight: this.style.lineHeight.u === StyleUnit.AUTO ? 0 : this.computedStyle.lineHeight,
      paragraphSpacing: this.computedStyle.paragraphSpacing,
      color: this.computedStyle.color,
    }] : []);
    json.attributedString = {
      _class: 'attributedString',
      string: this._content,
      attributes: rich.map(item => {
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
              minimumLineHeight: item.lineHeight,
              maximumLineHeight: item.lineHeight,
              paragraphSpacing: item.paragraphSpacing,
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
    const computedStyle = this.computedStyle;
    json.style!.textStyle = {
      _class: 'textStyle',
      verticalAlignment: [
        SketchFormat.TextVerticalAlignment.Top,
        SketchFormat.TextVerticalAlignment.Middle,
        SketchFormat.TextVerticalAlignment.Bottom,
      ][computedStyle.textVerticalAlign],
      encodedAttributes: {
        paragraphStyle: {
          _class: 'paragraphStyle',
          alignment: [
            SketchFormat.TextHorizontalAlignment.Left,
            SketchFormat.TextHorizontalAlignment.Right,
            SketchFormat.TextHorizontalAlignment.Centered,
            SketchFormat.TextHorizontalAlignment.Justified,
            SketchFormat.TextHorizontalAlignment.Natural,
          ][computedStyle.textAlign],
        },
        underlineStyle: computedStyle.textDecoration.includes(TEXT_DECORATION.UNDERLINE) ? SketchFormat.UnderlineStyle.Underlined : SketchFormat.UnderlineStyle.None,
        strikethroughStyle: computedStyle.textDecoration.includes(TEXT_DECORATION.LINE_THROUGH) ? SketchFormat.StrikethroughStyle.Strikethrough : SketchFormat.StrikethroughStyle.None,
        kerning: computedStyle.letterSpacing,
        MSAttributedStringFontAttribute: {
          _class: 'fontDescriptor',
          attributes: {
            name: computedStyle.fontFamily,
            size: computedStyle.fontSize,
          },
        },
      },
    };
    return json;
  }

  get content() {
    return this._content;
  }

  set content(v: string) {
    if (v !== this._content) {
      this._content = v;
      this.refresh(RefreshLevel.REFLOW);
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
          if (font.hasRegister(fontFamily)) {
            const fontData = font.data[fontFamily];
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
