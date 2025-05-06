import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';

export type RenameData = {
  prev: string;
  next: string;
};

class RenameCommand extends AbstractCommand {
  data: RenameData[];

  constructor(nodes: Node[], data: RenameData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.name = data[i].next;
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.name = data[i].prev;
    });
  }
}

export default RenameCommand;
