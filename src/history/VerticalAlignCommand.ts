import Command from './Command';
import Node from '../node/Node';
import { VerticalAlignData } from '../format';

class VerticalAlignCommand extends Command {
  data: VerticalAlignData[];

  constructor(nodes: Node[], data: VerticalAlignData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.updateStyle(data[i].next);
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.updateStyle(data[i].prev);
    });
  }
}

export default VerticalAlignCommand;
