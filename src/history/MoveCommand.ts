import Command from './Command';
import Node from '../node/Node';
import { RefreshLevel } from '../refresh/level';
import { MoveComputedStyle, MoveData } from './type';

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
      MoveCommand.setComputedStyle(node, md.nextComputedStyle);
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
      MoveCommand.setComputedStyle(node, md.prevComputedStyle);
      node.checkPosSizeUpward();
      // 刷新用TRANSFORM强制重新计算calMatrix()
      node.root?.addUpdate(node, [], RefreshLevel.TRANSFORM);
    });
  }

  static setComputedStyle(node: Node, mc: MoveComputedStyle) {
    node.computedStyle.left = mc.left!;
    node.computedStyle.right = mc.right!;
    node.computedStyle.top = mc.top!;
    node.computedStyle.bottom = mc.bottom!;
  }
}

export default MoveCommand;
