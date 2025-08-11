import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import Container from '../node/Container';
import AbstractGroup from '../node/AbstractGroup';
import { unGroup } from '../tool/group';
import { migrate } from '../tool/node';
import { appendWithIndex } from '../tool/container';

export type UnGroupData = {
  parent: Container;
  children: Node[];
};

class UnGroupCommand extends AbstractCommand {
  data: UnGroupData[];

  constructor(nodes: AbstractGroup[], data: UnGroupData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    UnGroupCommand.operate(this.nodes as AbstractGroup[]);
  }

  undo() {
    this.nodes.forEach((node, i) => {
      const group = node as AbstractGroup;
      group.fixedPosAndSize = true;
      const { parent, children } = this.data[i];
      if (parent instanceof AbstractGroup) {
        parent.fixedPosAndSize = true;
      }
      appendWithIndex(parent, group);
      children.filter(item => {
        migrate(group, item);
        group.appendChild(item);
      });
      group.fixedPosAndSize = false;
      group.checkPosSizeSelf();
    });
    this.data.forEach((item) => {
      const { parent } = item;
      if (parent instanceof AbstractGroup && parent.fixedPosAndSize) {
        parent.fixedPosAndSize = false;
        parent.checkPosSizeSelf();
      }
    });
  }

  static operate(nodes: AbstractGroup[]) {
    return nodes.map(item => {
      return unGroup(item)!;
    });
  }
}

export default UnGroupCommand;
