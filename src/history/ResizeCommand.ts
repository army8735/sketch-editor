import Command from './Command';
import Node from '../node/Node';
import { JStyle } from '../format';
import { ResizeData, ResizeStyle } from './type';

class ResizeCommand extends Command {
  data: ResizeData[];

  constructor(nodes: Node[], data: ResizeData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.updateStyle(data[i].nextStyle);
      node.checkPosSizeUpward();
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.updateStyle(data[i].prevStyle);
      node.checkPosSizeUpward();
    });
  }
}

export default ResizeCommand;
