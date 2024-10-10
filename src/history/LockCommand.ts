import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';

export type LockData = {
  prev: boolean;
  next: boolean;
};

class LockCommand extends AbstractCommand {
  data: LockData[];

  constructor(nodes: Node[], data: LockData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.props.isLocked = data[i].next;
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.props.isLocked = data[i].prev;
    });
  }
}

export default LockCommand;
