import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import Container from '../node/Container';
import { appendWithPosAndSize } from '../tool/container';

// 和remove很相似，但没有selected
export type AddData = {
  x: number;
  y: number;
  parent: Container;
};

class AddCommand extends AbstractCommand {
  data: AddData[];

  constructor(nodes: Node[], data: AddData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      appendWithPosAndSize(node, data[i]);
    });
  }

  undo() {
    const { nodes } = this;
    nodes.forEach(node => {
      node.remove();
    });
  }
}

export default AddCommand;
