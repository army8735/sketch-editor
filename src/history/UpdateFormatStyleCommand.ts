import Command from './Command';
import Node from '../node/Node';
import { Style } from '../style/define';

class UpdateFormatStyleCommand extends Command {
  nodes: Node[];
  prevs: Partial<Style>[];
  nexts: Partial<Style>[];

  constructor(nodes: Node[], prevs: Partial<Style>[], nexts: Partial<Style>[]) {
    super();
    this.nodes = nodes;
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
