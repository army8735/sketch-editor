import Command from './Command';
import Node from '../node/Node';

class RotateCommand extends Command {
  ds: number[];

  constructor(nodes: Node[], ds: number[]) {
    super(nodes);
    this.ds = ds;
  }

  execute() {
    const { nodes, ds } = this;
    nodes.forEach((node, i) => {
      node.updateStyle({
        rotateZ: node.computedStyle.rotateZ + ds[i],
      });
      node.checkPosSizeUpward();
    });
  }

  undo() {
    const { nodes, ds } = this;
    nodes.forEach((node, i) => {
      node.updateStyle({
        rotateZ: node.computedStyle.rotateZ - ds[i],
      });
      node.checkPosSizeUpward();
    });
  }
}

export default RotateCommand;
