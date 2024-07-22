import Command from './Command';
import Node from '../node/Node';
import { RefreshLevel } from '../refresh/level';
import { MoveData } from './type';

class MoveCommand extends Command {
  data: MoveData[];

  constructor(nodes: Node[], data: MoveData[]) {
    super(nodes);
    this.nodes = nodes;
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      const md = data[i];
      node.updateStyleData(md.nextStyle);
      MoveCommand.setComputedStyle(node, md);
      node.checkPosSizeUpward();
      // 刷新用TRANSFORM强制重新计算calMatrix()
      node.root?.addUpdate(node, [], RefreshLevel.TRANSFORM);
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      const md = data[i];
      node.updateStyleData(md.prevStyle);
      MoveCommand.setComputedStyle(node, md);
      node.checkPosSizeUpward();
      // 刷新用TRANSFORM强制重新计算calMatrix()
      node.root?.addUpdate(node, [], RefreshLevel.TRANSFORM);
    });
  }

  static setComputedStyle(node: Node, md: MoveData) {
    if (md.dx) {
      node.computedStyle.left = md.prevComputedStyle.left!;
      node.computedStyle.right = md.prevComputedStyle.right!;
    }
    if (md.dy) {
      node.computedStyle.top = md.prevComputedStyle.top!;
      node.computedStyle.bottom = md.prevComputedStyle.bottom!;
    }
  }
}

export default MoveCommand;
