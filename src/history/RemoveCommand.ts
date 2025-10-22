import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import Container from '../node/Container';
import Group from '../node/Group';
import { appendWithPosAndSize } from '../tool/container';

export type RemoveData = {
  x: number; // 位置即computedStyle的left/top，但删除节点会使得parent组的尺寸变化，left/top会不准确，记录时需修正
  y: number;
  parent: Container; // undo时添加需要父元素
  selected?: Node; // 删除组下唯一元素时视为删除组，undo时需要select此元素而不是组
};

class RemoveCommand extends AbstractCommand {
  data: RemoveData[];

  constructor(nodes: Node[], data: RemoveData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes } = this;
    nodes.forEach(node => {
      node.remove();
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      appendWithPosAndSize(node, data[i]);
    });
  }

  static operate(node: Node) {
    const parent = node.parent!;
    const o: RemoveData = {
      x: node.computedStyle.left,
      y: node.computedStyle.top,
      parent,
    };
    // 可能造成了parent尺寸变化，需修正，比如被删除节点删除后使得父Group的左上原点变化，删除记录的绝对x/y要考虑
    if (parent.isGroup && parent instanceof Group) {
      const rect = parent.getChildrenRect(node);
      o.x -= rect.minX;
      o.y -= rect.minY;
    }
    node.remove();
    return o;
  }
}

export default RemoveCommand;
