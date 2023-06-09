import Container from '../node/Container';
import Node from '../node/Node';
import { StyleUnit } from '../style/define';
import { calPoint, identity, multiply } from '../math/matrix';

export enum POSITION {
  UNDER = 0,
  BEFORE = 1,
  AFTER = 2,
}

export function moveTo(nodes: Node[], target: Node, position = POSITION.UNDER) {
  if (!nodes.length) {
    return;
  }
  if (target.isDestroyed) {
    throw new Error('Can not moveTo a destroyed Node');
  }
  if (nodes.indexOf(target) > -1) {
    throw new Error('Can not moveTo self');
  }
  const parent = target.parent!;
  for (let i = 0, len = nodes.length; i < len; i++) {
    const item = nodes[i];
    migrate(parent, item);
    if (position === POSITION.BEFORE) {
      target.insertBefore(item);
    } else if (position === POSITION.AFTER) {
      target.insertAfter(item);
    }
    // 默认under
    else if (target instanceof Container) {
      (target as Container).appendChild(item);
    }
  }
}

// 获取节点相对于其所在Page的坐标，左上角原点不考虑旋转，Page本身返回0,0
export function getPosOnPage(node: Node) {
  if (!node.page) {
    throw new Error('Node not on a Page');
  }
  if (node.isPage) {
    return { x: 0, y: 0 };
  }
  const page = node.page;
  let p = node.parent;
  const list: Node[] = [];
  while (p && p !== page) {
    list.push(p);
    p = p.parent;
  }
  let m = identity();
  while (list.length) {
    m = multiply(m, list.pop()!.matrix);
  }
  const matrix = node.matrix;
  const i = identity();
  i[12] = matrix[12];
  i[13] = matrix[13];
  m = multiply(m, i);
  return calPoint({ x: 0, y: 0 }, m);
}

/**
 * 将node迁移到parent下的尺寸和位置，并不是真正移动dom，移动权和最终位置交给外部控制
 * 先记录下node当前的绝对坐标和尺寸和旋转，然后转换style到以parent为新父元素下并保持单位不变
 */
export function migrate(parent: Node, node: Node) {
  const width = parent.width;
  const height = parent.height;
  const { x, y } = getPosOnPage(parent);
  const { x: x1, y: y1 } = getPosOnPage(node);
  const style = node.style;
  // 节点的尺寸约束模式保持不变，反向计算出当前的值应该是多少，根据first的父节点当前状态，和转化那里有点像
  const leftConstraint = style.left.u === StyleUnit.PX;
  const rightConstraint = style.right.u === StyleUnit.PX;
  const topConstraint = style.top.u === StyleUnit.PX;
  const bottomConstraint = style.bottom.u === StyleUnit.PX;
  const widthConstraint = style.width.u === StyleUnit.PX;
  const heightConstraint = style.height.u === StyleUnit.PX;
  // left
  if (leftConstraint) {
    const left = x1 - x;
    style.left.v = left;
    // left+right忽略width
    if (rightConstraint) {
      style.right.v = width - left - node.width;
    }
    // left+width
    else if (widthConstraint) {
      // 默认right就是auto啥也不做
    }
    // 仅left，right是百分比忽略width
    else {
      style.right.v = ((width - left - node.width) * 100) / width;
    }
  }
  // right
  else if (rightConstraint) {
    // right+width
    if (widthConstraint) {
      // 默认left就是auto啥也不做
    }
    // 仅right，left是百分比忽略width
    else {
      style.left.v = ((width - style.right.v - node.width) * 100) / width;
    }
  }
  // 左右都不固定
  else {
    const left = x1 - x;
    // 仅固定宽度，以中心点占left的百分比
    if (widthConstraint) {
      style.left.v = ((left + style.width.v * 0.5) * 100) / width;
    }
    // 左右皆为百分比
    else {
      style.left.v = (left * 100) / width;
      style.right.v = ((width - left - node.width) * 100) / width;
    }
  }
  // top
  if (topConstraint) {
    const top = y1 - y;
    style.top.v = top;
    // top+bottom忽略height
    if (bottomConstraint) {
      style.bottom.v = height - top - node.height;
    }
    // top+height
    else if (heightConstraint) {
      // 默认bottom就是auto啥也不做
    }
    // 仅top，bottom是百分比忽略height
    else {
      style.bottom.v = ((height - top - node.height) * 100) / height;
    }
  }
  // bottom
  else if (bottomConstraint) {
    // bottom+height
    if (heightConstraint) {
      // 默认top就是auto啥也不做
    }
    // 仅bottom，top是百分比忽略height
    else {
      style.top.v = ((height - style.bottom.v - node.height) * 100) / height;
    }
  }
  // 上下都不固定
  else {
    const top = y1 - y;
    // 仅固定宽度，以中心点占top的百分比
    if (heightConstraint) {
      style.top.v = ((top + style.height.v * 0.5) * 100) / height;
    }
    // 左右皆为百分比
    else {
      style.top.v = (top * 100) / height;
      style.bottom.v = ((height - top - node.height) * 100) / height;
    }
  }
}

export function sortTempIndex(nodes: Node[]) {
  if (!nodes.length) {
    return;
  }
  const structs = nodes[0].root!.structs;
  // 按照先根遍历顺序排列这些节点，最先的是编组位置参照
  for (let i = 0, len = nodes.length; i < len; i++) {
    const item = nodes[i];
    if (item.isDestroyed) {
      throw new Error('Can not group a destroyed Node');
    }
    item.tempIndex = structs.indexOf(item.struct);
  }
  nodes.sort((a, b) => {
    return a.tempIndex - b.tempIndex;
  });
}

export function getWholeBoundingClientRect(
  nodes: Node[],
  includeBbox = false,
  excludeRotate = false,
) {
  if (!nodes.length) {
    return;
  }
  const rect = nodes[0].getBoundingClientRect(includeBbox, excludeRotate);
  for (let i = 1, len = nodes.length; i < len; i++) {
    const r = nodes[i].getBoundingClientRect(includeBbox, excludeRotate);
    rect.left = Math.min(rect.left, r.left);
    rect.right = Math.max(rect.right, r.right);
    rect.top = Math.min(rect.top, r.top);
    rect.bottom = Math.max(rect.bottom, r.bottom);
    // points无意义
  }
  return rect;
}

export default {
  moveTo,
  POSITION,
  migrate,
  sortTempIndex,
  getWholeBoundingClientRect,
};
