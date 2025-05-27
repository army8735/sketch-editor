import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';

class NextCommand extends AbstractCommand {
  data: (Node | undefined)[];

  constructor(nodes: Node[], data: (Node | undefined)[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    NextCommand.operate(this.nodes);
  }

  undo() {
    this.nodes.forEach((item, i) => {
      if (this.data[i]) {
        this.data[i].insertBefore(item);
      }
    });
  }

  static operate(nodes: Node[]) {
    return nodes.map(item => {
      const next = item.next;
      if (next) {
        next.insertAfter(item);
      }
      return next;
    });
  }
}

export default NextCommand;
