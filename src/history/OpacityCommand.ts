import Command from './Command';
import Node from '../node/Node';

class OpacityCommand extends Command {
  data: { prev: number, next: number }[];

  constructor(nodes: Node[], data: { prev: number, next: number }[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.updateStyle({
        opacity: data[i].next,
      });
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.updateStyle({
        opacity: data[i].prev,
      });
    });
  }
}

export default OpacityCommand;
