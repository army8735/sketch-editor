import Command from './Command';
import Node from '../node/Node';
import { JStyle } from '../format';

class ResizeCommand extends Command {
  styles: { prev: Partial<JStyle>, next: Partial<JStyle> }[];

  constructor(nodes: Node[], styles: { prev: Partial<JStyle>, next: Partial<JStyle> }[]) {
    super(nodes);
    this.styles = styles;
  }

  execute() {
    const { nodes, styles } = this;
    nodes.forEach((node, i) => {
      const originStyle = node.getStyle();
      node.startSizeChange();
      node.updateStyle(styles[i].next);
      node.endSizeChange(originStyle);
      node.checkPosSizeUpward();
    });
  }

  undo() {
    const { nodes, styles } = this;
    nodes.forEach((node, i) => {
      const originStyle = node.getStyle();
      node.startSizeChange();
      node.updateStyle(styles[i].prev);
      node.endSizeChange(originStyle);
      node.checkPosSizeUpward();
    });
  }
}

export default ResizeCommand;
