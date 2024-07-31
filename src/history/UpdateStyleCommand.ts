import Command from './Command';
import Node from '../node/Node';
import { JStyle } from '../format';

export type UpdateStyleData = {
  prev: Partial<JStyle>;
  next: Partial<JStyle>;
};

class UpdateStyleCommand extends Command {
  data: UpdateStyleData[];

  constructor(nodes: Node[], data: UpdateStyleData[]) {
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
