import Container from './Container';
import { Props } from '../format';
import Node from './Node';
import { H } from '../math/geom';

abstract class AbstractFrame extends Container {
  constructor(props: Props, children: Node[]) {
    super(props, children);
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

  override renderCanvas(scale: number, computedStyle = this.computedStyle) {
    const { borderTopLeftRadius, borderTopRightRadius, borderBottomLeftRadius, borderBottomRightRadius } = this.computedStyle;
    // 限制圆角半径，不能超过宽高一半
    const min = Math.min(this.width * 0.5, this.height * 0.5);
    const tl = Math.min(min, borderTopLeftRadius);
    const tr = Math.min(min, borderTopRightRadius);
    const bl = Math.min(min, borderBottomLeftRadius);
    const br = Math.min(min, borderBottomRightRadius);
    let coords: number[][];
    if (tl === 0 && tr === 0 && bl === 0 && br === 0) {
      coords = [
        [0, 0],
        [this.width, 0],
        [this.width, this.height],
        [0, this.height],
        [0, 0],
      ];
    }
    else {
      coords = [
        [tl, 0],
        [this.width - tr, 0],
        [this.width - tr + tr * H, 0, this.width, tr * H, this.width, tr],
        [this.width, this.height - br],
        [this.width, this.height - br + br * H, this.width - br + br * H, this.height, this.width - br, this.height],
        [bl, this.height],
        [bl * H, this.height, 0, this.height - bl + bl * H, 0, this.height - bl],
        [0, tl],
        [0, tl - tl * H, tl - tl * H, 0, tl, 0],
      ];
    }
    this.renderFillStroke(scale, [coords], true, computedStyle);
  }
}

export default AbstractFrame;
