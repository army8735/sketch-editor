import Command from './Command';
import Node from '../node/Node';
import Container from '../node/Container';
import { appendWithPosAndSize} from '../tools/container';

export type RemoveData = {
  x: number; // 位置即computedStyle的left/top，但删除节点会使得parent组的尺寸变化，left/top会不准确，记录时需修正
  y: number;
  parent: Container;
};

class RemoveCommand extends Command {
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
    // 可能造成了parent尺寸变化，需修正
    const rect = parent.getChildrenRect(node);
    o.x -= rect.minX;
    o.y -= rect.minY;
    node.remove();
    return o;
  }
}

export default RemoveCommand;
