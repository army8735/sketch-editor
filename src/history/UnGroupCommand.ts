import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import Container from '../node/Container';
import Group from '../node/Group';
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

  constructor(nodes: Group[], data: UnGroupData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    UnGroupCommand.operate(this.nodes as Group[]);
  }

  undo() {
    this.nodes.forEach((node, i) => {
      const group = node as Group;
      group.fixedPosAndSize = true;
      const { parent, children } = this.data[i];
      if (parent instanceof Group) {
        parent.fixedPosAndSize = true;
      }
      appendWithIndex(parent, group);
      children.filter(item => {
        migrate(group, item);
        group.appendChild(item);
      });
      group.fixedPosAndSize = false;
      group.checkPosSizeSelf();
      if (group instanceof ShapeGroup) {
        group.refresh();
      }
    });
    this.data.forEach((item) => {
      const { parent } = item;
      if (parent instanceof Group && parent.fixedPosAndSize) {
        parent.fixedPosAndSize = false;
        parent.checkPosSizeSelf();
      }
    });
  }

  static operate(nodes: Group[]) {
    return nodes.map(item => {
      return unGroup(item)!;
    });
  }
}

export default UnGroupCommand;
