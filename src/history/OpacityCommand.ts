import Command from './Command';
import Node from '../node/Node';

class OpacityCommand extends Command {
  ds: { prev: number, next: number }[];

  constructor(nodes: Node[], ds: { prev: number, next: number }[]) {
    super(nodes);
    this.ds = ds;
  }

  execute() {
    const { nodes, ds } = this;
    nodes.forEach((node, i) => {
      node.updateStyle({
        opacity: ds[i].next,
      });
    });
  }

  undo() {
    const { nodes, ds } = this;
    nodes.forEach((node, i) => {
      node.updateStyle({
        opacity: ds[i].prev,
      });
    });
  }
}

export default OpacityCommand;
