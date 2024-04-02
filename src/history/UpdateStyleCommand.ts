import Command from './Command';
import Node from '../node/Node';
import { JStyle } from '../format';
import { isReflow, RefreshLevel } from '../refresh/level';

class UpdateStyleCommand extends Command {
  node: Node;
  style: { prev: Partial<JStyle>, next: Partial<JStyle> };

  constructor(node: Node, style: { prev: Partial<JStyle>, next: Partial<JStyle> }) {
    super();
    this.node = node;
    this.style = style;
  }

  execute() {
    const { node, style } = this;
    const originStyle = node.getStyle();
    const cs1 = node.getComputedStyle();
    const { lv } = node.updateStyle(style.next);
    const cs2 = node.getComputedStyle();
    if (isReflow(lv!)) {
      node.endSizeChange(originStyle);
      node.checkPosSizeUpward();
    }
    else {
      if (lv! & RefreshLevel.TRANSLATE) {
        node.endPosChange(originStyle, cs2.translateX - cs1.translateX, cs2.translateY - cs1.translateY);
        node.checkPosSizeUpward();
      }
    }
  }

  undo() {
    const { node, style } = this;
    const originStyle = node.getStyle();
    const cs1 = node.getComputedStyle();
    const { lv } = node.updateStyle(style.prev);
    const cs2 = node.getComputedStyle();
    if (isReflow(lv!)) {
      node.endSizeChange(originStyle);
      node.checkPosSizeUpward();
    }
    else {
      if (lv! & RefreshLevel.TRANSLATE) {
        node.endPosChange(originStyle, cs2.translateX - cs1.translateX, cs2.translateY - cs1.translateY);
        node.checkPosSizeUpward();
      }
    }
  }
}

export default UpdateStyleCommand;
