import Command from './Command';
import Node from '../node/Node';
import { JStyle } from '../format';

class BehaviourCommand extends Command {
  nodes: Node[];
  prevs: Partial<JStyle>[];
  nexts: Partial<JStyle>[];

  constructor(nodes: Node[], prevs: Partial<JStyle>[], nexts: Partial<JStyle>[]) {
    super();
    this.nodes = nodes;
    this.prevs = prevs;
    this.nexts = nexts;
  }

  execute() {
    const { nodes, nexts } = this;
    nodes.forEach((node, i) => {
      node.startSizeChange();
      node.updateStyle(nexts[i]);
      node.endSizeChange(node.style);
      node.checkPosSizeUpward();
    });
  }

  undo() {
    const { nodes, prevs } = this;
    nodes.forEach((node, i) => {
      node.startSizeChange();
      node.updateStyle(prevs[i]);
      node.endSizeChange(node.style);
      node.checkPosSizeUpward();
    });
  }
}

export default BehaviourCommand;
