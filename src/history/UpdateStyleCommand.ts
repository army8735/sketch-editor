import Command from './Command';
import Node from '../node/Node';
import { JStyle } from '../format';

class UpdateStyleCommand extends Command {
  prevs: Partial<JStyle>[];
  nexts: Partial<JStyle>[];

  constructor(nodes: Node[], prevs: Partial<JStyle>[], nexts: Partial<JStyle>[]) {
    super(nodes);
    this.prevs = prevs;
    this.nexts = nexts;
  }

  execute() {
    const { nodes, nexts } = this;
    nodes.forEach((node, i) => {
      node.updateStyle(nexts[i]);
    });
  }

  undo() {
    const { nodes, prevs } = this;
    nodes.forEach((node, i) => {
      node.updateStyle(prevs[i]);
    });
  }
}

export default UpdateStyleCommand;
