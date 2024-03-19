import Command from './Command';
import Node from '../node/Node';
import { JStyle } from '../format';

class UpdateStyleCommand extends Command {
  node: Node;
  style: { prev: Partial<JStyle>, next: Partial<JStyle> };

  constructor(node: Node, style: { prev: Partial<JStyle>, next: Partial<JStyle> }) {
    super();
    this.node = node;
    this.style = style;
  }

  execute() {
    this.node.updateStyle(this.style.next);
  }

  undo() {
    this.node.updateStyle(this.style.prev);
  }
}

export default UpdateStyleCommand;
