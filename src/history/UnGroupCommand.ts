import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import Container from '../node/Container';
import AbstractGroup from '../node/AbstractGroup';
import { unGroup } from '../tools/group';
import { migrate } from '../tools/node';
import { appendWithIndex } from '../tools/container';
import ShapeGroup from '../node/geom/ShapeGroup';

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
