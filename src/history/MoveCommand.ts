import Command from './Command';
import Node from '../node/Node';
import { RefreshLevel } from '../refresh/level';
import { MoveData } from './type';
import { StyleUnit } from '../style/define';
import { calSize } from '../style/css';

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
      MoveCommand.setComputedStyle(node);
      // 刷新用TRANSFORM强制重新计算calMatrix()
      node.root?.addUpdate(node, [], RefreshLevel.TRANSFORM);
      node.checkPosSizeUpward();
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      const md = data[i];
      node.updateStyleData(md.prevStyle);
      MoveCommand.setComputedStyle(node);
      // 刷新用TRANSFORM强制重新计算calMatrix()
      node.root?.addUpdate(node, [], RefreshLevel.TRANSFORM);
      node.checkPosSizeUpward();
    });
  }

  static setComputedStyle(node: Node) {
    const { style, computedStyle, parent } = node;
    const { left, top, right, bottom } = style;
    const { width: w, height: h } = parent!;
    let fixedLeft = false;
    let fixedTop = false;
    let fixedRight = false;
    let fixedBottom = false;
    if (left.u !== StyleUnit.AUTO) {
      fixedLeft = true;
      computedStyle.left = calSize(left, w);
    }
    if (right.u !== StyleUnit.AUTO) {
      fixedRight = true;
      computedStyle.right = calSize(right, w);
    }
    if (top.u !== StyleUnit.AUTO) {
      fixedTop = true;
      computedStyle.top = calSize(top, h);
    }
    if (bottom.u !== StyleUnit.AUTO) {
      fixedBottom = true;
      computedStyle.bottom = calSize(bottom, h);
    }
    if (fixedLeft && fixedRight) {}
    else if (fixedLeft) {
      computedStyle.right = w - computedStyle.left - node.width;
    }
    else if (fixedRight) {
      computedStyle.left = w - computedStyle.right - node.width;
    }
    if (fixedTop && fixedBottom) {}
    else if (fixedTop) {
      computedStyle.bottom = h - computedStyle.top - node.height;
    }
    else if (fixedBottom) {
      computedStyle.top = h - computedStyle.bottom - node.height;
    }
  }
}

export default MoveCommand;
