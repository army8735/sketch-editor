import Container from './Container';
import { Props } from '../format';
import Node from './Node';

abstract class AbstractFrame extends Container {
  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isFrame = true;
  }

  override calContent() {
    const { fill, fillEnable, fillOpacity, stroke, strokeEnable } = this.computedStyle;
    for (let i = 0, len = Math.min(fill.length, fillEnable.length, fillOpacity.length); i < len; i++) {
      if (fillOpacity[i] && fillEnable[i]) {
        return this.hasContent = true;
      }
    }
    for (let i = 0, len = Math.min(stroke.length, strokeEnable.length); i < len; i++) {
      if (strokeEnable[i]) {
        return this.hasContent = true;
      }
    }
    return this.hasContent = false;
  }

  override renderCanvas(scale: number) {
    const coords = [
      [0, 0],
      [this.width, 0],
      [this.width, this.height],
      [0, this.height],
      [0, 0],
    ];
    this.renderFillStroke(scale, [coords], true);
  }
}

export default AbstractFrame;
