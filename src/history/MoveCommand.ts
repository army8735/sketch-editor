import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import { ComputedStyle } from '../style/define';
import ArtBoard from '../node/ArtBoard';
import { isConvexPolygonOverlapRect } from '../math/geom';
import { moveAppend, moveAfter } from '../tool/node';

export type MoveData = { dx: number, dy: number };

class MoveCommand extends AbstractCommand {
  data: MoveData[];

  constructor(nodes: Node[], data: MoveData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      const { dx, dy } = data[i];
      const originStyle = node.getStyle();
      const computedStyle = node.computedStyle;
      MoveCommand.update(node, computedStyle, dx, dy);
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
      MoveCommand.update(node, computedStyle, -dx, -dy);
      // 结束后特殊检查，translate换算布局，Group约束
      node.endPosChange(originStyle, -dx, -dy);
      node.checkPosSizeUpward();
    });
  }

  static update(node: Node, computedStyle: ComputedStyle, dx: number, dy: number, noRefresh = false) {
    const oldAb = node.artBoard;
    node.updateStyle({
      translateX: computedStyle.translateX + dx,
      translateY: computedStyle.translateY + dy,
    }, noRefresh);
    const rect = node.getBoundingClientRect();
    // 检查移动后是否改变画板所属，优先看是否在老画板上
    if (oldAb) {
      const r = oldAb.getBoundingClientRect();
      if (isConvexPolygonOverlapRect(r.left, r.top, r.right, r.bottom, rect.points)) {
        return oldAb;
      }
    }
    // 不在则遍历看在哪个新画板上
    const page = node.page;
    if (page) {
      const children = page.children;
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child !== oldAb && child instanceof ArtBoard) {
          const r = child.getBoundingClientRect();
          if (isConvexPolygonOverlapRect(r.left, r.top, r.right, r.bottom, rect.points)) {
            moveAppend([node], child);
            node.artBoard = child;
            return child;
          }
        }
      }
    }
    // 都不在则移出画板
    if (oldAb) {
      moveAfter([node], oldAb);
      node.artBoard = undefined;
    }
  }
}

export default MoveCommand;
