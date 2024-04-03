import Command from './Command';
import Node from '../node/Node';
import { JStyle } from '../format';

class ResizeCommand extends Command {
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
    node.startSizeChange();
    node.updateStyle(style.next);
    node.endSizeChange(originStyle);
    node.checkPosSizeUpward();
  }

  undo() {
    const { node, style } = this;
    const originStyle = node.getStyle();
    node.startSizeChange();
    node.updateStyle(style.prev);
    node.endSizeChange(originStyle);
    node.checkPosSizeUpward();
  }
}

export default ResizeCommand;
