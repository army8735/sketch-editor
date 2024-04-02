import Command from './Command';
import Node from '../node/Node';

class MoveCommand extends Command {
  node: Node;
  dx: number;
  dy: number;

  constructor(node: Node, dx: number, dy: number) {
    super();
    this.node = node;
    this.dx = dx;
    this.dy = dy;
  }

  execute() {
    const { node, dx, dy } = this;
    const originStyle = node.getStyle();
    const computedStyle = node.computedStyle;
    node.updateStyle({
      translateX: computedStyle.translateX + dx,
      translateY: computedStyle.translateY + dy,
    });
    node.endPosChange(originStyle, dx, dy);
    node.checkPosSizeUpward();
  }

  undo() {
    const { node, dx, dy } = this;
    const originStyle = node.getStyle();
    const computedStyle = node.computedStyle;
    node.updateStyle({
      translateX: computedStyle.translateX - dx,
      translateY: computedStyle.translateY - dy,
    });
    node.endPosChange(originStyle, -dx, -dy);
    node.checkPosSizeUpward();
  }
}

export default MoveCommand;
