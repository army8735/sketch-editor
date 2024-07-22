import Command from './Command';
import Node from '../node/Node';

class RotateCommand extends Command {
  data: { prev: number, next: number }[];

  constructor(nodes: Node[], data: { prev: number, next: number }[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.updateStyle({
        rotateZ: data[i].next % 360,
      });
      node.checkPosSizeUpward();
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.updateStyle({
        rotateZ: data[i].prev % 360,
      });
      node.checkPosSizeUpward();
    });
  }
}

export default RotateCommand;
