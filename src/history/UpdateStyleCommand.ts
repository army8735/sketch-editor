import Command from './Command';
import Node from '../node/Node';
import { JStyle } from '../format';

class UpdateStyleCommand extends Command {
  node: Node;
  style: Partial<JStyle>;
  oldStyle: Partial<JStyle>;

  constructor(node: Node, style: Partial<JStyle>) {
    super();
    this.node = node;
    this.style = style;
    this.oldStyle = {};
    Object.keys(style).forEach((k) => {
      // @ts-ignore
      this.oldStyle[k] = node.style[k];
    });
  }

  execute() {
    this.node.updateStyle(this.style);
  }

  undo() {
    this.node.updateStyle(this.oldStyle);
  }
}

export default UpdateStyleCommand;
