import * as uuid from 'uuid';
import Node from '../node/Node';
import Group from '../node/Group';
import { migrate, sortTempIndex } from './node';
import inject from '../util/inject';
import AbstractGroup from '../node/AbstractGroup';

// 至少1个node进行编组，以第0个位置为基准
export function group(nodes: Node[], group?: AbstractGroup) {
  if (!nodes.length) {
    return;
  }
  const nodes2 = nodes.slice(0);
  sortTempIndex(nodes2);
  const first = nodes2[0];
  const parent = first.parent!;
  // 先锁定各自节点的老parent，防止同一个parent下的2个节点先后迁移时干扰计算
  const parents = nodes2.map(item => item.parent!);
  parents.forEach(parent => {
    if (parent instanceof AbstractGroup) {
      parent.fixedPosAndSize = true;
    }
  });
  // 首次命令没有生成，后续redo时就有了
  if (!group) {
    // 先添加空组并撑满，这样确保多个节点添加过程中，目标位置的parent尺寸不会变化（节点remove会触发校正逻辑）
    group = new Group({
      uuid: uuid.v4(),
      name: '编组',
      index: parent.index,
      style: {
        left: '0%',
        top: '0%',
        right: '0%',
        bottom: '0%',
      },
    }, []);
  }
  group.fixedPosAndSize = true;
  // 插入到first的后面
  first.insertAfter(group);
  for (let i = 0, len = nodes2.length; i < len; i++) {
    const item = nodes2[i];
    migrate(group, item);
    group.appendChild(item);
  }
  group.fixedPosAndSize = false;
  parents.forEach(parent => {
    if (parent instanceof AbstractGroup) {
      parent.fixedPosAndSize = false;
      parent.checkPosSizeSelf();
    }
  });
  group.checkPosSizeSelf();
  return group;
}

export function unGroup(group: AbstractGroup) {
  if (group.isDestroyed || !group.parent) {
    inject.error('Can not unGroup a destroyed Node');
    return;
  }
  group.fixedPosAndSize = true;
  const parent = group.parent;
  if (parent instanceof AbstractGroup) {
    parent.fixedPosAndSize = true;
  }
  let target = group as Node;
  const children = group.children.slice(0);
  for (let i = 0, len = children.length; i < len; i++) {
    const item = children[i];
    migrate(parent, item);
    // 依次插入到group的后面
    target.insertAfter(item);
    target = item;
  }
  // 尺寸无变化无需checkPosAndSize()
  if (parent instanceof AbstractGroup) {
    parent.fixedPosAndSize = false;
  }
  group.fixedPosAndSize = false;
  group.remove();
  return {
    children,
    parent,
  };
}

export default {
  group,
  unGroup,
};
