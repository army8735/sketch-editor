import Node from './Node';
import { Rich, TextProps } from '../format';
import { LayoutData } from './layout';
import { StyleUnit } from '../style/define';
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
                 w: number, perW: number, letterSpacing: number = 0) {
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
    let mw, str = content.slice(start, start + hypotheticalNum);
    mw = ctx.measureText(str).width;
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
  return { hypotheticalNum, rw, newLine };
}

class Text extends Node {
  content: string;
  rich?: Array<Rich>;
  constructor(props: TextProps) {
    super(props);
    this.content = props.content;
    this.rich = props.rich;
  }

  override layout(data: LayoutData) {
    super.layout(data);
    if (this.isDestroyed) {
      return;
    }
    const { rich, style, computedStyle, content } = this;
    const autoW = style.width.u === StyleUnit.AUTO;
    const autoH = style.height.u === StyleUnit.AUTO;
    const ctx = inject.getFontCanvas().ctx;
    ctx.font = setFontStyle(computedStyle);
    if (autoW && autoH) {
      if (rich) {}
      else {
        this.width = computedStyle.width = ctx.measureText(content).width;
        this.height = computedStyle.height = computedStyle.lineHeight;
      }
    }
    else if (autoW) {
      // 暂无这种情况
    }
    else if (autoH) {}
    // 固定宽高已经计算好，只需排版即可
    else {}
  }

  override calContent(): boolean {
    const { computedStyle, content } = this;
    if (!computedStyle.visible) {
      return this.hasContent = false;
    }
    return this.hasContent = !!content;
  }

  override renderCanvas() {
    super.renderCanvas();
    const computedStyle = this.computedStyle;
    const canvasCache = this.canvasCache = CanvasCache.getInstance(this.width, this.height);
    const ctx = canvasCache.offscreen.ctx;
    ctx.font = setFontStyle(computedStyle);
    ctx.fillStyle = color2rgbaStr(computedStyle.color);
    ctx.fillText(this.content, 0, getBaseline(computedStyle));
  }
}

export default Text;
