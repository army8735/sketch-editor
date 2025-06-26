import Container from './Container';
import { Props } from '../format';
import Node from './Node';
import CanvasCache from '../refresh/CanvasCache';

class Frame extends Container {
  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isFrame = true;
  }

  override calContent(): boolean {
    const { fill, fillEnable, fillOpacity, stroke, strokeEnable } = this.computedStyle;
    for (let i = 0, len = Math.min(fill.length, fillEnable.length, fillOpacity.length); i < len; i++) {
      if (fillOpacity[i] && fillEnable[i]) {
        return true;
      }
    }
    for (let i = 0, len = Math.min(stroke.length, strokeEnable.length); i < len; i++) {
      if (strokeEnable[i]) {
        return true;
      }
    }
    return false;
  }
}

export default Frame;
