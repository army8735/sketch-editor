import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';

class PrevCommand extends AbstractCommand {
  data: (Node | undefined)[];

  constructor(nodes: Node[], data: (Node | undefined)[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    PrevCommand.operate(this.nodes);
  }

  undo() {
    this.nodes.forEach((item, i) => {
      if (this.data[i]) {
        this.data[i].insertAfter(item);
      }
    });
  }

  static operate(nodes: Node[]) {
    return nodes.map(item => {
      const prev = item.prev;
      if (prev) {
        prev.insertBefore(item);
      }
      return prev;
    });
  }
}

export default PrevCommand;
