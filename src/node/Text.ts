import { Rich, TextProps } from '../format';
import { calPoint, inverse4 } from '../math/matrix';
import CanvasCache from '../refresh/CanvasCache';
import config from '../refresh/config';
import { RefreshLevel } from '../refresh/level';
import { color2rgbaStr, getBaseline, setFontStyle } from '../style/css';
import { StyleUnit, TEXT_ALIGN } from '../style/define';
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
      mw += hypotheticalNum * letterSpacing;
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
        rw += hypotheticalNum * letterSpacing;
      }
      newLine = false;
      hasEnter = true;
      break;
    }
  }
  // 下一个字符是回车，强制忽略换行，外层循环识别
  if (!hasEnter && content.charAt(i + hypotheticalNum) === '\n') {
    newLine = false;
  }
  return { hypotheticalNum, rw, newLine };
}

class Text extends Node {
  _content: string;
  rich?: Array<Rich>;
  lineBoxList: Array<LineBox>;
  cursorIndex: Int32Array; // 0:LineBox索引，1:TextBox索引，2:字符索引
  lastCursorX: number; // 上一次手动指定的光标x相对坐标
  constructor(props: TextProps) {
    super(props);
    this.isText = true;
    this._content = props.content;
    this.rich = props.rich;
    this.lineBoxList = [];
    this.cursorIndex = new Int32Array([-1, -1, -1]);
    this.lastCursorX = 0;
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
      }
    }
    const ctx = inject.getFontCanvas().ctx;
    // 第一个肯定要设置测量font
    if (rich && rich.length) {
      const first = rich[0];
      letterSpacing = first.letterSpacing;
      perW = first.fontSize * 0.8 + letterSpacing;
      lineHeight = first.lineHeight;
      baseline = getBaseline(first);
      ctx.font = setFontStyle(first);
    }
    // 无富文本则通用
    else {
      letterSpacing = computedStyle.letterSpacing;
      perW = computedStyle.fontWeight * 0.8 + letterSpacing;
      lineHeight = computedStyle.lineHeight;
      baseline = getBaseline(computedStyle);
      ctx.font = setFontStyle(computedStyle);
    }
    let lineBox = new LineBox(y, lineHeight);
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
        perW = cur.fontSize * 0.8 + letterSpacing;
        lineHeight = cur.lineHeight;
        baseline = getBaseline(cur);
        ctx.font = setFontStyle(cur);
      }
      // \n，行开头会遇到，需跳过
      if (content.charAt(i) === '\n') {
        i++;
        x = 0;
        y += lineHeight;
        lineBox.verticalAlign();
        lineBox = new LineBox(y, lineHeight);
        lineBoxList.push(lineBox);
        // const textBox = new TextBox(
        //   x,
        //   y,
        //   0,
        //   lineHeight,
        //   baseline,
        //   i,
        //   '\n',
        //   ctx.font,
        // );
        // lineBox.add(textBox);
        // 最后一个\n特殊判断
        if (i === length) {
          lineBoxList.push(lineBox);
        }
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
        y += lineBox.lineHeight;
        if (i < length) {
          lineBox.verticalAlign();
          lineBox = new LineBox(y, lineHeight);
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
      );
      lineBox.add(textBox);
      i += num;
      maxW = Math.max(maxW, rw);
      // 换行则x重置、y增加、新建LineBox，否则继续水平增加x
      if (newLine) {
        x = 0;
        y += lineBox.lineHeight;
        // 最后一行对齐外面做
        if (i < length) {
          lineBox.verticalAlign();
          lineBox = new LineBox(y, lineHeight);
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
    // 富文本每串不同的需要设置字体颜色
    const SET_FONT_INDEX: Array<number> = [0];
    let color: string;
    if (rich && rich.length) {
      for (let i = 0, len = rich.length; i < len; i++) {
        const item = rich[i];
        SET_FONT_INDEX[item.location] = i;
      }
      const first = rich[0];
      color = color2rgbaStr(first.color);
    }
    // 非富默认颜色
    else {
      color = color2rgbaStr(computedStyle.color);
    }
    let count = 0;
    for (let i = 0, len = lineBoxList.length; i < len; i++) {
      const lineBox = lineBoxList[i];
      // 固定尺寸超过则overflow: hidden
      if (lineBox.y >= h) {
        break;
      }
      const list = lineBox.list,
        len = list.length;
      for (let i = 0; i < len; i++) {
        // textBox的分隔一定是按rich的，用字符统计数量作索引来获取颜色
        const setFontIndex = SET_FONT_INDEX[count];
        if (rich && rich.length && count && setFontIndex) {
          const cur = rich[setFontIndex];
          color = color2rgbaStr(cur.color);
        }
        const textBox = list[i];
        if (scale !== 1) {
          ctx.font = textBox.font.replace(
            /([\d.e+-]+)px/gi,
            ($0, $1) => $1 * scale + 'px',
          );
        } else {
          ctx.font = textBox.font;
        }
        ctx.fillStyle = color;
        ctx.fillText(
          textBox.str,
          textBox.x * scale + dx,
          (textBox.y + textBox.baseline) * scale + dy,
        );
        count += textBox.str.length;
      }
    }
  }

  // 根据绝对坐标获取光标位置
  getCursorPos(x: number, y: number) {
    const dpi = this.root!.dpi;
    const m = this.matrixWorld;
    const im = inverse4(m);
    const local = calPoint({ x: x * dpi, y: y * dpi }, im);
    const lineBoxList = this.lineBoxList;
    const cursorIndex = this.cursorIndex;
    for (let i = 0, len = lineBoxList.length; i < len; i++) {
      const lineBox = lineBoxList[i];
      if (local.y >= lineBox.y && local.y < lineBox.y + lineBox.h) {
        cursorIndex[0] = i;
        // let rx = 0, ry = lineBox.y, rh = lineBox.lineHeight;
        // const list = lineBox.list;
        // outer:
        //   for (let i = 0, len = list.length; i < len; i++) {
        //     const { x, w, str, font } = list[i];
        //     if (local.x >= x && local.x <= x + w) {
        //       cursorIndex[1] = i;
        //       const ctx = inject.getFontCanvas().ctx;
        //       ctx.font = font;
        //       let start = 0, end = str.length;
        //       while (start < end) {
        //         if (start === end - 1) {
        //           // 只差1个情况看更靠近哪边
        //           const w1 = ctx.measureText(str.slice(0, start)).width;
        //           const w2 = ctx.measureText(str.slice(0, end)).width;
        //           if (local.x - (x + w1) > (x + w2) - local.x) {
        //             this.lastCursorX = rx = x + w2;
        //             cursorIndex[2] = end;
        //           } else {
        //             this.lastCursorX = rx = x + w1;
        //             cursorIndex[2] = start;
        //           }
        //           break outer;
        //         }
        //         const mid = start + ((end - start) >> 1);
        //         const w = ctx.measureText(str.slice(0, mid)).width;
        //         if (local.x > x + w) {
        //           start = mid;
        //         } else if (local.x < x + w) {
        //           end = mid;
        //         } else {
        //           cursorIndex[2] = mid;
        //           this.lastCursorX = rx = x + w;
        //           break outer;
        //         }
        //       }
        //     }
        //   }
        const res = this.getCursorByLocalX(local.x, lineBox);
        this.lastCursorX = res.x;
        const p = calPoint({ x: res.x, y: res.y }, m);
        return {
          x: p.x,
          y: p.y,
          h: res.h * m[0],
        };
      }
    }
    // 找不到还原清空
    cursorIndex[0] = cursorIndex[1] = cursorIndex[2] = cursorIndex[3] = -1;
  }

  /**
   * 在左百分比+宽度自动的情况，输入后要保持原本的位置，因为是中心点百分比对齐父级，
   * 其它几种都不需要：左右百分比定宽、左固定、右固定、左百分比+定宽，
   * 不会出现仅右百分比的情况
   */
  inputContent(s: string) {
    const { style, computedStyle } = this;
    const { left, right, width, translateX } = style;
    const isLeft =
      width.u === StyleUnit.AUTO &&
      left.u === StyleUnit.PERCENT &&
      right.u === StyleUnit.AUTO;
    if (isLeft) {
      const { left: left2, width: width2 } = computedStyle;
      left.v = left2 - width2 * 0.5;
      left.u = StyleUnit.PX;
      translateX.v = 0;
      translateX.u = StyleUnit.PX;
    }
    const lineBoxList = this.lineBoxList;
    const cursorIndex = this.cursorIndex;
    // 先记录下光标对应字符的索引
    const [i, j, k] = cursorIndex;
    const lineBox = lineBoxList[i];
    const textBox = lineBox.list[j];
    const m = textBox.index + k;
    const c = this._content;
    this.content = c.slice(0, m) + s + c.slice(m);
    const n = m + s.length;
    // 位移还原，无需渲染仅数据即可
    if (isLeft) {
      const width = this.width;
      const v = computedStyle.left + width * 0.5;
      left.v = ((computedStyle.left + width * 0.5) * 100) / this.parent!.width;
      left.u = StyleUnit.PERCENT;
      translateX.v = -50;
      translateX.u = StyleUnit.PERCENT;
      computedStyle.left = v;
    }
    // 同步更新光标位置
    for (let i = 0, len = lineBoxList.length; i < len; i++) {
      const lineBox = lineBoxList[i];
      const list = lineBox.list;
      for (let j = 0, len = list.length; j < len; j++) {
        const textBox = list[j];
        if (n >= textBox.index && n < textBox.index + textBox.str.length) {
          cursorIndex[0] = i;
          cursorIndex[1] = j;
          cursorIndex[2] = n - textBox.index;
          const ctx = inject.getFontCanvas().ctx;
          ctx.font = textBox.font;
          const str = textBox.str;
          const w = ctx.measureText(str.slice(0, cursorIndex[2])).width;
          this.lastCursorX = textBox.x + w;
          const m = this.matrixWorld;
          const p = calPoint({ x : this.lastCursorX, y: textBox.y }, m);
          this.root?.emit(
            Event.UPDATE_CURSOR,
            p.x,
            p.y,
            lineBox.lineHeight * m[0],
          );
          return;
        }
      }
    }
  }

  // 上下左右按键移动光标，上下保持当前x，左右则更新
  moveCursor(code: number) {
    const m = this.matrixWorld;
    // 先求得当前光标位置在字符串的索引
    const cursorIndex = this.cursorIndex;
    let [i, j, k] = cursorIndex;
    let lineBoxList = this.lineBoxList;
    let lineBox = lineBoxList[i];
    let list = lineBox.list;
    let textBox = list[j];
    const pos = textBox.index + k;
    // 左
    if (code === 37) {
      if (pos === 0) {
        return;
      }
      // textBox开头
      if (k === 0) {
        // 行开头要到上行末尾
        if (j === 0) {
          cursorIndex[0] = --i;
          lineBox = lineBoxList[i];
          list = lineBox.list;
          cursorIndex[1] = j = list.length - 1;
        }
        // 非行开头到上个textBox末尾
        else {
          cursorIndex[1] = --j;
        }
        textBox = list[j];
        cursorIndex[2] = textBox.str.length - 1;
      } else {
        cursorIndex[2] = --k;
      }
    }
    // 上
    else if (code === 38) {
      if (pos === 0) {
        return;
      }
      // 第一行到开头
      if (i === 0) {
        cursorIndex[1] = 0;
        textBox = list[0];
        cursorIndex[2] = 0;
      }
      // 向上一行找最接近的，保持当前的x，直接返回结果
      else {
        lineBox = lineBoxList[--i];
        this.cursorIndex[0] = i;
        const res = this.getCursorByLocalX(this.lastCursorX, lineBox);
        const p = calPoint({ x: res.x, y: res.y }, m);
        this.root?.emit(Event.UPDATE_CURSOR, p.x, p.y, lineBox.lineHeight * m[0]);
        return;
      }
    }
    // 右
    else if (code === 39) {
      if (pos === this._content.length) {
        return;
      }
      // textBox末尾
      if (k === textBox.str.length) {
        // 行末尾要到下行开头
        if (j === list.length - 1) {
          cursorIndex[0] = ++i;
          lineBox = lineBoxList[i];
          list = lineBox.list;
          cursorIndex[1] = j = 0;
        }
        // 非行末尾到下个textBox开头
        else {
          cursorIndex[1] = ++j;
        }
        textBox = list[j];
        cursorIndex[2] = 0;
      } else {
        cursorIndex[2] = ++k;
      }
    }
    // 下
    else if (code === 40) {
      if (pos === this._content.length) {
        return;
      }
      // 最后一行到末尾
      if (i === lineBoxList.length - 1) {
        cursorIndex[1] = j = list.length - 1;
        textBox = list[j];
        cursorIndex[2] = textBox.str.length;
      }
      // 向下一行找最接近的，保持当前的x，直接返回结果
      else {
        lineBox = lineBoxList[++i];
        this.cursorIndex[0] = i;
        const res = this.getCursorByLocalX(this.lastCursorX, lineBox);
        const p = calPoint({ x: res.x, y: res.y }, m);
        this.root?.emit(Event.UPDATE_CURSOR, p.x, p.y, lineBox.lineHeight * m[0]);
        return;
      }
    }
    // 左右和特殊情况的上下，前面计算了cursorIndex的位置，据此获取光标位置，并记录x
    const ctx = inject.getFontCanvas().ctx;
    ctx.font = textBox.font;
    const str = textBox.str;
    const w = ctx.measureText(str.slice(0, cursorIndex[2])).width;
    this.lastCursorX = textBox.x + w;
    const p = calPoint({ x : this.lastCursorX, y: textBox.y }, m);
    this.root?.emit(Event.UPDATE_CURSOR, p.x, p.y, lineBox.lineHeight * m[0]);
  }

  enter() {
    console.log(this.cursorIndex)
  }

  private getCursorByLocalX(localX: number, lineBox: LineBox) {
    const list = lineBox.list;
    const cursorIndex = this.cursorIndex;
    let rx = 0, ry = lineBox.y, rh = lineBox.lineHeight;
    outer:
      for (let i = 0, len = list.length; i < len; i++) {
        const { x, w, str, font } = list[i];
        if (localX >= x && localX <= x + w) {
          cursorIndex[1] = i;
          const ctx = inject.getFontCanvas().ctx;
          ctx.font = font;
          let start = 0, end = str.length;
          while (start < end) {
            if (start === end - 1) {
              // 只差1个情况看更靠近哪边
              const w1 = ctx.measureText(str.slice(0, start)).width;
              const w2 = ctx.measureText(str.slice(0, end)).width;
              if (localX - (x + w1) > (x + w2) - localX) {
                rx = x + w2;
                cursorIndex[2] = end;
              } else {
                rx = x + w1;
                cursorIndex[2] = start;
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
              cursorIndex[2] = mid;
              rx = x + w;
              break outer;
            }
          }
        }
      }
    return { x: rx, y: ry, h: rh };
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

export default Text;
