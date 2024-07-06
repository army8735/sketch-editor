import Command from './Command';
import Text from '../node/Text';
import { UpdateRich } from '../format';

class UpdateRichCommand extends Command {
  prevs: UpdateRich[][];
  nexts: UpdateRich[][];

  constructor(nodes: Text[], prevs: UpdateRich[][], nexts: UpdateRich[][]) {
    super(nodes);
    this.prevs = prevs;
    this.nexts = nexts;
  }

  execute() {
    const { nodes, nexts } = this;
    nodes.forEach((node, i) => {
      const next = nexts[i];
      next.forEach(item => {
        (node as Text).updateRichStyle(item);
      });
    });
  }

  undo() {
    const { nodes, prevs } = this;
    nodes.forEach((node, i) => {
      const prev = prevs[i];
      prev.forEach(item => {
        (node as Text).updateRichStyle(item);
      });
    });
  }
}

export default UpdateRichCommand;
