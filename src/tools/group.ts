import * as uuid from 'uuid';
import Node from '../node/Node';
import Group from '../node/Group';
import { migrate, sortTempIndex } from './node';
import inject from '../util/inject';

// 至少1个node进行编组，以第0个位置为基准
export function group(nodes: Node[], group?: Group) {
  if (!nodes.length) {
    return;
  }
  sortTempIndex(nodes);
  const first = nodes[0];
  const parent = first.parent!;
  // 锁定parent，如果first和nodes[1]为兄弟，first在remove后触发调整会使nodes[1]的style发生变化，migrate的操作无效
  if (parent instanceof Group) {
    parent.fixedPosAndSize = true;
  }
  // 先添加空组并撑满，这样确保多个节点添加过程中，目标位置的parent尺寸不会变化（节点remove会触发校正逻辑）
  const p = Object.assign(
    {
      uuid: uuid.v4(),
      name: '编组',
      style: {
        left: '0%',
        top: '0%',
        right: '0%',
        bottom: '0%',
      },
    },
  );
  if (group) {
    group.updateStyle({
      left: '0%',
      top: '0%',
      right: '0%',
      bottom: '0%',
    });
  }
  else {
    group = new Group(p, []);
  }
  group.fixedPosAndSize = true;
  // 插入到first的后面
  first.insertAfter(group);
  for (let i = 0, len = nodes.length; i < len; i++) {
    const item = nodes[i];
    migrate(group, item);
  }
  // 迁移后再remove&add，因为过程会导致parent尺寸位置变化，干扰其它节点migrate
  for (let i = 0, len = nodes.length; i < len; i++) {
    group.appendChild(nodes[i]);
  }
  group.fixedPosAndSize = false;
  if (parent instanceof Group) {
    parent.fixedPosAndSize = false;
  }
  group.checkPosSizeSelf();
  return group;
}

export function unGroup(group: Group) {
  if (group.isDestroyed || !group.parent) {
    inject.error('Can not unGroup a destroyed Node');
    return;
  }
  group.fixedPosAndSize = true;
  const parent = group.parent;
  if (parent instanceof Group) {
    parent.fixedPosAndSize = true;
  }
  let target = group as Node;
  const children = group.children.slice(0);
  for (let i = 0, len = children.length; i < len; i++) {
    const item = children[i];
    migrate(parent, item);
    // 插入到group的后面
    target.insertAfter(item);
    target = item;
  }
  if (parent instanceof Group) {
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
