import { calPoint, identity, multiply } from '../math/matrix';
import Container from '../node/Container';
import Group from '../node/Group';
import Node from '../node/Node';
import { StyleUnit } from '../style/define';
import { clone } from '../util/util';

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
  // 可能移动的parent就是本来的parent，只是children顺序变更，防止迁移后remove造成尺寸变化，计算失效
  if (parent instanceof Group) {
    parent.fixedPosAndSize = true;
  }
  for (let i = 0, len = nodes.length; i < len; i++) {
    const item = nodes[i];
    migrate(parent, item);
    if (position === POSITION.BEFORE) {
      target.insertBefore(item);
    }
    else if (position === POSITION.AFTER) {
      target.insertAfter(item);
    }
    // 默认under
    else if (target instanceof Container) {
      (target as Container).appendChild(item);
    }
  }
  if (parent instanceof Group) {
    parent.fixedPosAndSize = false;
    // 手动检查尺寸变化
    parent.checkPosSizeSelf();
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
  // 自己节点只考虑translate影响，忽略rotate，而本身又没有scale，迁移到别的父节点只需关注x/y变化
  const i = identity();
  i[12] = node.computedStyle.translateX;
  i[13] = node.computedStyle.translateY;
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
    // 仅固定宽度，以中心点占left的百分比，或者文字只有left百分比无right
    if (
      widthConstraint ||
      (style.left.u === StyleUnit.PERCENT && style.right.u === StyleUnit.AUTO)
    ) {
      style.left.v = ((left + node.width * 0.5) * 100) / width;
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
    // 仅固定宽度，以中心点占top的百分比，或者文字只有top百分比无bottom
    if (
      heightConstraint ||
      (style.top.u === StyleUnit.PERCENT && style.bottom.u === StyleUnit.AUTO)
    ) {
      style.top.v = ((top + node.height * 0.5) * 100) / height;
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

/**
 * 将child移动到parent内，并且保持原本的尺寸位置（相对于老parent的绝对计算值），
 * 用已有计算的computedStyle来赋值style定位新的parent，完成后根据style的原有单位换算style的新值。
 * 布局逻辑见Node的lay()方法。
 */
export function appendWithState(child: Node, parent: Container, cb?: () => void) {
  const { style, computedStyle } = child;
  // 原始单位记录下来
  const top = clone(style.top);
  const right = clone(style.right);
  const bottom = clone(style.bottom);
  const left = clone(style.left);
  // 统一用左右+上下来新定位
  style.left = {
    v: computedStyle.left,
    u: StyleUnit.PX,
  };
  style.right = {
    v: parent.width - computedStyle.left - computedStyle.width,
    u: StyleUnit.PX,
  };
  style.top = {
    v: computedStyle.top,
    u: StyleUnit.PX,
  };
  style.bottom = {
    v: parent.height - computedStyle.top - computedStyle.height,
    u: StyleUnit.PX,
  };
  parent.appendChild(child, cb);
  // 还原style原本的单位，倒推值，和lay()类似但反过来
  let fixedLeft = false;
  let fixedTop = false;
  let fixedRight = false;
  let fixedBottom = false;
  if (left.u !== StyleUnit.AUTO) {
    fixedLeft = true;
  }
  if (right.u !== StyleUnit.AUTO) {
    fixedRight = true;
  }
  if (top.u !== StyleUnit.AUTO) {
    fixedTop = true;
  }
  if (bottom.u !== StyleUnit.AUTO) {
    fixedBottom = true;
  }
  // 左右决定width
  if (fixedLeft && fixedRight) {
    if (left.u === StyleUnit.PERCENT) {
      style.left = {
        v: computedStyle.left * 100 / parent.width,
        u: StyleUnit.PERCENT,
      };
    }
    if (right.u === StyleUnit.PERCENT) {
      style.right = {
        v: computedStyle.right * 100 / parent.width,
        u: StyleUnit.PERCENT,
      };
    }
    style.width = {
      v: 0,
      u: StyleUnit.AUTO,
    };
  }
  else if (fixedLeft) {
    if (left.u === StyleUnit.PERCENT) {
      style.left = {
        v: computedStyle.left * 100 / parent.width,
        u: StyleUnit.PERCENT,
      };
    }
    style.right = {
      v: 0,
      u: StyleUnit.AUTO,
    };
    style.width = {
      v: computedStyle.width * 100 / parent.width,
      u: StyleUnit.PERCENT,
    };
  }
  else if (fixedRight) {
    if (right.u === StyleUnit.PERCENT) {
      style.right = {
        v: computedStyle.right * 100 / parent.width,
        u: StyleUnit.PERCENT,
      };
    }
    style.left = {
      v: 0,
      u: StyleUnit.AUTO,
    };
    style.width = {
      v: computedStyle.width * 100 / parent.width,
      u: StyleUnit.PERCENT,
    };
  }
  else {
    style.left = {
      v: (computedStyle.left + computedStyle.width * 0.5) * 100 / parent.width,
      u: StyleUnit.PERCENT,
    };
    style.right = {
      v: 0,
      u: StyleUnit.AUTO,
    };
    style.width = {
      v: computedStyle.width,
      u: StyleUnit.PX,
    };
  }
  // 上下决定height
  if (fixedTop && fixedBottom) {
    if (top.u === StyleUnit.PERCENT) {
      style.top = {
        v: computedStyle.top * 100 / parent.height,
        u: StyleUnit.PERCENT,
      };
    }
    if (bottom.u === StyleUnit.PERCENT) {
      style.bottom = {
        v: computedStyle.bottom * 100 / parent.height,
        u: StyleUnit.PERCENT,
      };
    }
    style.height = {
      v: 0,
      u: StyleUnit.AUTO,
    };
  }
  else if (fixedTop) {
    if (top.u === StyleUnit.PERCENT) {
      style.top = {
        v: computedStyle.top * 100 / parent.height,
        u: StyleUnit.PERCENT,
      };
    }
    style.bottom = {
      v: 0,
      u: StyleUnit.AUTO,
    };
    style.height = {
      v: computedStyle.height * 100 / parent.height,
      u: StyleUnit.PERCENT,
    };
  }
  else if (fixedBottom) {
    if (bottom.u === StyleUnit.PERCENT) {
      style.bottom = {
        v: computedStyle.bottom * 100 / parent.height,
        u: StyleUnit.PERCENT,
      };
    }
    style.top = {
      v: 0,
      u: StyleUnit.AUTO,
    };
    style.height = {
      v: computedStyle.height * 100 / parent.height,
      u: StyleUnit.PERCENT,
    };
  }
  else {
    style.top = {
      v: (computedStyle.top + child.height * 0.5) * 100 / parent.height,
      u: StyleUnit.PERCENT,
    };
    style.bottom = {
      v: 0,
      u: StyleUnit.AUTO,
    };
    style.height = {
      v: computedStyle.height,
      u: StyleUnit.PX,
    };
  }
}

export default {
  moveTo,
  POSITION,
  migrate,
  sortTempIndex,
  getWholeBoundingClientRect,
};
