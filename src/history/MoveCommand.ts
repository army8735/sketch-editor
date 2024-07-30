import Command from './Command';
import Node from '../node/Node';

export type MoveData = { dx: number, dy: number };

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
      const { dx, dy } = data[i];
      const originStyle = node.getStyle();
      const computedStyle = node.computedStyle;
      node.updateStyle({
        translateX: computedStyle.translateX + dx,
        translateY: computedStyle.translateY + dy,
      });
      // 结束后特殊检查，translate换算布局，Group约束
      node.endPosChange(originStyle, dx, dy);
      node.checkPosSizeUpward();
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      const { dx, dy } = data[i];
      const originStyle = node.getStyle();
      const computedStyle = node.computedStyle;
      node.updateStyle({
        translateX: computedStyle.translateX - dx,
        translateY: computedStyle.translateY - dy,
      });
      // 结束后特殊检查，translate换算布局，Group约束
      node.endPosChange(originStyle, -dx, -dy);
      node.checkPosSizeUpward();
    });
  }
}

export default MoveCommand;
