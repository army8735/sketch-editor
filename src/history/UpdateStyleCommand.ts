import Command from './Command';
import Node from '../node/Node';
import { ModifyData } from './type';

class UpdateStyleCommand extends Command {
  data: ModifyData[];

  constructor(nodes: Node[], data: ModifyData[]) {
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

export default UpdateStyleCommand;
