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
    const dx2 = computedStyle.translateX + dx;
    const dy2 = computedStyle.translateY + dy;
    node.updateStyle({
      translateX: dx2,
      translateY: dy2,
    });
    node.endPosChange(originStyle, dx2, dy2);
    node.checkPosSizeUpward();
  }

  undo() {
    const { node, dx, dy } = this;
    const originStyle = node.getStyle();
    const computedStyle = node.computedStyle;
    const dx2 = computedStyle.translateX - dx;
    const dy2 = computedStyle.translateY - dy;
    node.updateStyle({
      translateX: dx2,
      translateY: dy2,
    });
    node.endPosChange(originStyle, dx2, dy2);
    node.checkPosSizeUpward();
  }
}

export default MoveCommand;
