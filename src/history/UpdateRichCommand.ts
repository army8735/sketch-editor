import Command from './Command';
import Text from '../node/Text';
import { Rich, UpdateRich } from '../format';

class UpdateRichCommand extends Command {
  nodes: Text[];
  prevs: UpdateRich[][];
  nexts: UpdateRich[][];

  constructor(nodes: Text[], prevs: UpdateRich[][], nexts: UpdateRich[][]) {
    super();
    this.nodes = nodes;
    this.prevs = prevs;
    this.nexts = nexts;
  }

  execute() {
    const { nodes, nexts } = this;
    nodes.forEach((node, i) => {
      const next = nexts[i];
      next.forEach(item => {
        node.updateRichStyle(item);
      });
    });
  }

  undo() {
    const { nodes, prevs } = this;
    nodes.forEach((node, i) => {
      const prev = prevs[i];
      prev.forEach(item => {
        node.updateRichStyle(item);
      });
    });
  }
}

export default UpdateRichCommand;
