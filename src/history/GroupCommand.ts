import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import Container from '../node/Container';
import Group from '../node/Group';
import { group } from '../tools/group';
import { migrate } from '../tools/node';
import { appendWithIndex } from '../tools/container';

export type GroupData = {
  parent: Container;
  index: number;
};

class GroupCommand extends AbstractCommand {
  data: GroupData[];
  group: Group;

  constructor(nodes: Node[], data: GroupData[], group: Group) {
    super(nodes);
    this.data = data;
    this.group = group;
  }

  execute() {
    GroupCommand.operate(this.nodes, this.group);
  }

  undo() {
    this.group.fixedPosAndSize = true;
    // 先迁移，再恢复尺寸并删除组，和UnGroup不同子节点有原本自身的位置
    this.nodes.forEach((node, i) => {
      const { parent, index } = this.data[i];
      if (parent instanceof Group) {
        parent.fixedPosAndSize = true;
      }
      migrate(parent, node);
      node.props.index = index;
      appendWithIndex(parent, node);
    });
    this.data.forEach((item) => {
      const { parent } = item;
      // 可能都是一个parent下的，防止重复
      if (parent instanceof Group && parent.fixedPosAndSize) {
        parent.fixedPosAndSize = false;
        parent.checkPosSizeSelf();
      }
    });
    this.group.fixedPosAndSize = false;
    this.group.remove();
  }

  static operate(nodes: Node[], g?: Group) {
    const data: GroupData[] = nodes.map(item => {
      return {
        parent: item.parent!,
        index: item.props.index,
      };
    });
    return {
      data,
      group: group(nodes, g),
    };
  }
}

export default GroupCommand;
