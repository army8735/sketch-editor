import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import Polyline from '../node/geom/Polyline';

export type ClosedData = {
  prev: boolean;
  next: boolean;
};

class ClosedCommand extends AbstractCommand {
  data: ClosedData[];

  constructor(nodes: Node[], data: ClosedData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      if (node instanceof Polyline) {
        node.isClosed = data[i].next;
        node.refresh();
      }
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      if (node instanceof Polyline) {
        node.isClosed = data[i].prev;
        node.refresh();
      }
    });
  }
}

export default ClosedCommand;
