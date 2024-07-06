import Command from './Command';
import Node from '../node/Node';

class MoveCommand extends Command {
  dxs: number[];
  dys: number[];

  constructor(nodes: Node[], dxs: number[], dys: number[]) {
    super(nodes);
    this.nodes = nodes;
    this.dxs = dxs;
    this.dys = dys;
  }

  execute() {
    const { nodes, dxs, dys } = this;
    nodes.forEach((node, i) => {
      const dx = dxs[i];
      const dy = dys[i];
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
    const { nodes, dxs, dys } = this;
    nodes.forEach((node, i) => {
      const dx = dxs[i];
      const dy = dys[i];
      const originStyle = node.getStyle();
      const computedStyle = node.computedStyle;
      node.updateStyle({
        translateX: computedStyle.translateX - dx,
        translateY: computedStyle.translateY - dy,
      });
      node.endPosChange(originStyle, -dx, -dy);
      node.checkPosSizeUpward();
    });
  }
}

export default MoveCommand;
