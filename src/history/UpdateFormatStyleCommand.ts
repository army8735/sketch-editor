import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import { Style } from '../style/define';

class UpdateFormatStyleCommand extends AbstractCommand {
  prevs: Partial<Style>[];
  nexts: Partial<Style>[];

  constructor(nodes: Node[], prevs: Partial<Style>[], nexts: Partial<Style>[]) {
    super(nodes);
    this.prevs = prevs;
    this.nexts = nexts;
  }

  execute() {
    const { nodes, nexts } = this;
    nodes.forEach((node, i) => {
      node.updateFormatStyle(nexts[i]);
    });
  }

  undo() {
    const { nodes, prevs } = this;
    nodes.forEach((node, i) => {
      node.updateFormatStyle(prevs[i]);
    });
  }
}

export default UpdateFormatStyleCommand;
