import Node from './Node';
import TextBox from './TextBox';
import LineBox from './LineBox';
import { LayoutData } from './layout';
import { Rich, TextProps } from '../format';
import { StyleUnit, TEXT_ALIGN } from '../style/define';
import inject from '../util/inject';
import { color2rgbaStr, getBaseline, setFontStyle } from '../style/css';
import CanvasCache from '../refresh/CanvasCache';

/**
 * 在给定宽度w的情况下，测量文字content多少个满足塞下，只支持水平书写，从start的索引开始，content长length
 * 尽可能地少的次数调用canvas的measureText或svg的html节点的width，因为比较消耗性能
 * 这就需要一种算法，不能逐字遍历看总长度是否超过，也不能单字宽度相加因为有文本整形某些字体多个字宽度不等于每个之和
 * 简单的2分法实现简单，但是次数稍多，对于性能不是最佳，因为内容的slice裁剪和传递给canvas测量都随尺寸增加而加大
 * 由于知道w和fontSize，因此能推测出平均值为fontSize/w，即字的个数，
 * 进行测量后得出w2，和真实w对比，产生误差d，再看d和fontSize推测差距个数，如此反复
 * 返回内容和end索引和长度，最少也要1个字符
 */
function measure(ctx: CanvasRenderingContext2D, start: number, length: number, content: string,
                 w: number, perW: number, letterSpacing: number) {
  let i = start, j = length, rw = 0, newLine = false;
  // 没有letterSpacing或者是svg模式可以完美获取TextMetrics
  let hypotheticalNum = Math.round(w / perW);
  // 不能增长0个字符，至少也要1个
  if(hypotheticalNum <= 0) {
    hypotheticalNum = 1;
  }
  // 超过内容长度范围也不行
  else if(hypotheticalNum > length - start) {
    hypotheticalNum = length - start;
  }
  // 类似2分的一个循环
  while(i < j) {
    let mw = ctx.measureText(content.slice(start, start + hypotheticalNum)).width;
    if(letterSpacing) {
      mw += hypotheticalNum * letterSpacing;
    }
    if(mw === w) {
      rw = w;
      newLine = true;
      break;
    }
    // 超出，设置右边界，并根据余量推测减少个数，
    // 因为精度问题，固定宽度或者累加的剩余空间，不用相等判断，而是为原本w宽度加一点点冗余1e-10
    if(mw > w + (1e-10)) {
      newLine = true;
      // 限制至少1个
      if(hypotheticalNum === 1) {
        rw = mw;
        break;
      }
      // 注意特殊判断i和j就差1个可直接得出结果，因为现在超了而-1不超肯定是-1的结果
      if(i === j - 1 || i - start === hypotheticalNum - 1) {
        hypotheticalNum = i - start;
        break;
      }
      j = hypotheticalNum + start - 1;
      let reduce = Math.round((mw - w) / perW);
      if(reduce <= 0) {
        reduce = 1;
      }
      hypotheticalNum -= reduce;
      if(hypotheticalNum < i - start) {
        hypotheticalNum = i - start;
      }
    }
    // 还有空余，设置左边界，并根据余量推测增加的个数
    else {
      rw = mw;
      if(hypotheticalNum === length - start) {
        break;
      }
      i = hypotheticalNum + start;
      let add = Math.round((w - mw) / perW);
      if(add <= 0) {
        add = 1;
      }
      hypotheticalNum += add;
      if(hypotheticalNum > j - start) {
        hypotheticalNum = j - start;
      }
    }
  }
  // 查看是否有空格，防止字符串过长indexOf无效查找
  for (let i = start, len = start + hypotheticalNum; i < len; i++) {
    if (content.charAt(i) === '\n') {
      hypotheticalNum = i - start + 1; // 遇到换行数量变化，包含换行，但宽度测量忽略
      rw = ctx.measureText(content.slice(start, start + hypotheticalNum - 1)).width;
      if (letterSpacing) {
        rw += hypotheticalNum * letterSpacing;
      }
      newLine = true;
      break;
    }
  }
  return { hypotheticalNum, rw, newLine };
}

class Text extends Node {
  content: string;
  rich?: Array<Rich>;
  lineBoxList: Array<LineBox>;
  constructor(props: TextProps) {
    super(props);
    this.content = props.content;
    this.rich = props.rich;
    this.lineBoxList = [];
  }

  override lay(data: LayoutData) {
    super.lay(data);
    const { rich, style, computedStyle, content, lineBoxList } = this;
    const autoW = style.width.u === StyleUnit.AUTO
      && (style.left.u === StyleUnit.AUTO || style.right.u === StyleUnit.AUTO);
    const autoH = style.height.u === StyleUnit.AUTO
      && (style.top.u !== StyleUnit.AUTO || style.bottom.u !== StyleUnit.AUTO);
    let i = 0;
    let length = content.length;
    let perW: number;
    let letterSpacing: number;
    let lineHeight;
    let baseline;
    let maxW = 0;
    let x = 0, y = 0;
    lineBoxList.splice(0);
    let lineBox = new LineBox(y);
    lineBoxList.push(lineBox);
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
      // 连续\n，开头会遇到，需跳过
      if (content.charAt(i) === '\n') {
        i++;
        y += lineHeight;
        if (lineBox.size) {
          lineBox.verticalAlign();
          lineBox = new LineBox(y);
          lineBoxList.push(lineBox);
        }
        else {
          lineBox.y = y;
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
      if (min > W - x + (1e-10) && x) {
        x = 0;
        y += lineBox.lineHeight;
        if (i < length) {
          lineBox.verticalAlign();
          lineBox = new LineBox(y);
          lineBoxList.push(lineBox);
        }
        continue;
      }
      // 预估法获取测量结果
      const { hypotheticalNum: num, rw, newLine } =
        measure(ctx, i, len, content, W - x, perW, letterSpacing);
      const textBox = new TextBox(x, y, rw, lineHeight, baseline,
        content.slice(i, i + num), ctx.font);
      lineBox.add(textBox);
      i += num;
      // 换行则x重置、y增加、新建LineBox，否则继续水平增加x
      if (newLine) {
        x = 0;
        y += lineBox.lineHeight;
        maxW = Math.max(maxW, lineBox.w);
        // 最后一个对齐外面做
        if (i < length) {
          lineBox.verticalAlign();
          lineBox = new LineBox(y);
          lineBoxList.push(lineBox);
        }
      }
      else {
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
  }

  override calContent(): boolean {
    return this.hasContent = !!this.content;
  }

  override renderCanvas() {
    super.renderCanvas();
    const { height, rich, computedStyle, lineBoxList } = this;
    const canvasCache = this.canvasCache = CanvasCache.getInstance(this.width, height);
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
      if (lineBox.y >= height) {
        break;
      }
      const list = lineBox.list;
      for (let i = 0, len = list.length; i < len; i++) {
        // textBox的分隔一定是按rich的，用字符统计数量作索引来获取颜色
        const setFontIndex = SET_FONT_INDEX[count];
        if (rich && rich.length && count && setFontIndex) {
          const cur = rich[setFontIndex];
          color = color2rgbaStr(cur.color);
        }
        const textBox = list[i];
        ctx.font = textBox.font;
        ctx.fillStyle = color;
        ctx.fillText(textBox.str, textBox.x, textBox.y + textBox.baseline);
        count += textBox.str.length;
      }
    }
  }
}

export default Text;
