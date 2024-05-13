import Command from './Command';
import Node from '../node/Node';

class RotateCommand extends Command {
  node: Node;
  d: number;

  constructor(node: Node, d: number) {
    super();
    this.node = node;
    this.d = d;
  }

  execute() {
    const { node, d } = this;
    node.updateStyle({
      rotateZ: d,
    });
    node.checkPosSizeUpward();
  }

  undo() {
    const { node, d } = this;
    node.updateStyle({
      rotateZ: -d,
    });
    node.checkPosSizeUpward();
  }
}

export default RotateCommand;
