import Node from './Node';
import { Props } from '../format';
import { LayoutData } from './layout';
import { StyleUnit } from '../style/define';
import inject from '../util/inject';
import { color2rgbaStr, getBaseline, setFontStyle } from '../style/css';
import CanvasCache from '../refresh/CanvasCache';

class Text extends Node {
  content: string;
  constructor(props: Props, content: string) {
    super(props);
    this.content = content;
  }

  override layout(data: LayoutData) {
    super.layout(data);
    if (this.isDestroyed) {
      return;
    }
    const { style, computedStyle, content } = this;
    const autoW = style.width.u === StyleUnit.AUTO;
    const autoH = style.height.u === StyleUnit.AUTO;
    const ctx = inject.getFontCanvas().ctx;
    ctx.font = setFontStyle(computedStyle);
    if (autoW && autoH) {
      this.width = computedStyle.width = ctx.measureText(content).width;
      this.height = computedStyle.height = computedStyle.lineHeight;
    }
    else if (autoW) {
      this.width = computedStyle.width = ctx.measureText(content).width;
    }
    else if (autoH) {}
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
    const canvasCache = this.canvasCache = CanvasCache.getInstance(this.width, this.height, -this.x, -this.y);
    const ctx = canvasCache.offscreen.ctx;
    ctx.font = setFontStyle(computedStyle);
    ctx.fillStyle = color2rgbaStr(computedStyle.color);
    ctx.fillText(this.content, 0, getBaseline(computedStyle));
  }
}

export default Text;
