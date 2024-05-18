import { calPoint, calRectPoints, identity, multiply } from '../math/matrix';
import Container from '../node/Container';
import Group from '../node/Group';
import Node from '../node/Node';
import { ComputedStyle, Style, StyleUnit } from '../style/define';
import { clone } from '../util/util';
import { JStyle, PageProps, Point } from '../format';
import ShapeGroup from '../node/geom/ShapeGroup';
import { mergeBbox } from '../math/bbox';
import Geom from '../node/geom/Geom';
import { r2d } from '../math/geom';

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

export function resizeTL(node: Node, style: Style, computedStyle: ComputedStyle, cssStyle: JStyle, dx: number, dy: number) {
  const next: Partial<JStyle> = {};
  // left为确定值则修改它，还要看width是否是确定值也一并修改
  if (dx) {
    if (
      style.left.u === StyleUnit.PX ||
      style.left.u === StyleUnit.PERCENT
    ) {
      if (style.left.u === StyleUnit.PX) {
        next.left = computedStyle.left + dx;
      }
      else {
        next.left =
          ((computedStyle.left + dx) * 100) / node.parent!.width + '%';
      }
      if (style.width.u === StyleUnit.PX ||
        // 只有left定位的自动宽度文本
        style.width.u === StyleUnit.AUTO && style.right.u === StyleUnit.AUTO) {
        next.width = computedStyle.width - dx;
      }
      else if (style.width.u === StyleUnit.PERCENT) {
        next.width =
          ((computedStyle.width - dx) * 100) / node.parent!.width + '%';
      }
    }
    // left为自动，宽度则为确定值修改，根据right定位
    else if (
      style.width.u === StyleUnit.PX ||
      style.width.u === StyleUnit.PERCENT ||
      // left和width均为auto，只有人工right定位文本
      style.width.u === StyleUnit.AUTO
    ) {
      if (style.width.u === StyleUnit.PX || style.width.u === StyleUnit.AUTO) {
        next.width = computedStyle.width - dx;
      }
      else {
        next.width =
          ((computedStyle.width - dx) * 100) / node.parent!.width + '%';
      }
    }
  }
  // top为确定值则修改它，还要看height是否是确定值也一并修改
  if (dy) {
    if (
      style.top.u === StyleUnit.PX ||
      style.top.u === StyleUnit.PERCENT
    ) {
      if (style.top.u === StyleUnit.PX) {
        next.top = computedStyle.top + dy;
      }
      else {
        next.top =
          ((computedStyle.top + dy) * 100) / node.parent!.height + '%';
      }
      if (style.height.u === StyleUnit.PX ||
        // 只有top定位的自动高度文本
        style.height.u === StyleUnit.AUTO && style.bottom.u === StyleUnit.AUTO) {
        next.height = computedStyle.height - dy;
      }
      else if (style.height.u === StyleUnit.PERCENT) {
        next.height =
          ((computedStyle.height - dy) * 100) / node.parent!.height + '%';
      }
    }
    // top为自动，高度则为确定值修改，根据bottom定位
    else if (
      style.height.u === StyleUnit.PX ||
      style.height.u === StyleUnit.PERCENT ||
      // top和height均为auto，只有人工bottom定位文本
      style.height.u === StyleUnit.AUTO
    ) {
      if (style.height.u === StyleUnit.PX || style.height.u === StyleUnit.AUTO) {
        next.height = computedStyle.height - dy;
      }
      else {
        next.height =
          ((computedStyle.height - dy) * 100) / node.parent!.height + '%';
      }
    }
  }
  return next;
}

export function resizeBR(node: Node, style: Style, computedStyle: ComputedStyle, cssStyle: JStyle, dx: number, dy: number) {
  const next: Partial<JStyle> = {};
  // right为确定值则修改它，还要看width是否是确定值也一并修改
  if (dx) {
    if (
      style.right.u === StyleUnit.PX ||
      style.right.u === StyleUnit.PERCENT
    ) {
      if (style.right.u === StyleUnit.PX) {
        next.right = computedStyle.right - dx;
      }
      else {
        next.right =
          ((computedStyle.right - dx) * 100) / node.parent!.width + '%';
      }
      if (style.width.u === StyleUnit.PX ||
        // 只有right定位的自动宽度文本
        style.width.u === StyleUnit.AUTO && style.left.u === StyleUnit.AUTO) {
        next.width = computedStyle.width + dx;
      }
      else if (style.width.u === StyleUnit.PERCENT) {
        next.width =
          ((computedStyle.width + dx) * 100) / node.parent!.width + '%';
      }
    }
    // right为自动，宽度则为确定值修改，根据left定位
    else if (
      style.width.u === StyleUnit.PX ||
      style.width.u === StyleUnit.PERCENT ||
      // right和width均auto，只有自动宽度文本，修改为定宽
      style.width.u === StyleUnit.AUTO
    ) {
      if (style.width.u === StyleUnit.PX || style.width.u === StyleUnit.AUTO) {
        next.width = computedStyle.width + dx;
      }
      else {
        next.width =
          ((computedStyle.width + dx) * 100) / node.parent!.width + '%';
      }
    }
  }
  // bottom为确定值则修改它，还要看height是否是确定值也一并修改
  if (dy) {
    if (
      style.bottom.u === StyleUnit.PX ||
      style.bottom.u === StyleUnit.PERCENT
    ) {
      if (style.bottom.u === StyleUnit.PX) {
        next.bottom = computedStyle.bottom - dy;
      }
      else {
        next.bottom =
          ((computedStyle.bottom - dy) * 100) / node.parent!.height + '%';
      }
      if (style.height.u === StyleUnit.PX ||
        // 只有bottom定位的自动高度文本
        style.height.u === StyleUnit.AUTO && style.top.u === StyleUnit.AUTO) {
        next.height = computedStyle.height + dy;
      }
      else if (style.height.u === StyleUnit.PERCENT) {
        next.height =
          ((computedStyle.height + dy) * 100) / node.parent!.height + '%';
      }
    }
    // bottom为自动，高度则为确定值修改，根据top定位
    else if (
      style.height.u === StyleUnit.PX ||
      style.height.u === StyleUnit.PERCENT ||
      style.height.u === StyleUnit.AUTO
    ) {
      if (style.height.u === StyleUnit.PX || style.height.u === StyleUnit.AUTO) {
        next.height = computedStyle.height + dy;
      }
      else {
        next.height =
          ((computedStyle.height + dy) * 100) / node.parent!.height + '%';
      }
    }
  }
  return next;
}

// 当group的children有mask时，可能部分节点展示不完全，使得实际看到的rect比group本身尺寸小，sketch显示的即这个小rect
export function getGroupActualRect(group: Group) {
  if (group.displayRect) {
    return group.displayRect;
  }
  const res = new Float64Array(4);
  const root = group.root;
  if (!root) {
    return res;
  }
  const structs = root.structs;
  const struct = group.struct;
  let i = structs.indexOf(struct);
  if (i < 0) {
    return res;
  }
  group.tempMatrix = identity();
  i++;
  let first = true;
  for (let len = i + struct.total; i < len; i++) {
    const { node, total } = structs[i];
    const m = node.tempMatrix = multiply(node.parent!.tempMatrix, node.matrix);
    let r: Float64Array;
    if (node.isGroup && node instanceof Group && !(node instanceof ShapeGroup)) {
      r = getGroupActualRect(node);
      i += total;
    }
    else {
      r = node._rect || node.rect;
    }
    // 首次赋值，否则merge
    if (first) {
      let [x1, y1, x2, y2] = r;
      const t1 = calPoint({ x: x1, y: y1 }, m);
      const t2 = calPoint({ x: x1, y: y2 }, m);
      const t3 = calPoint({ x: x2, y: y1 }, m);
      const t4 = calPoint({ x: x2, y: y2 }, m);
      x1 = Math.min(t1.x, t2.x, t3.x, t4.x);
      y1 = Math.min(t1.y, t2.y, t3.y, t4.y);
      x2 = Math.max(t1.x, t2.x, t3.x, t4.x);
      y2 = Math.max(t1.y, t2.y, t3.y, t4.y);
      res[0] = x1;
      res[1] = y1;
      res[2] = x2;
      res[3] = y2;
    }
    else {
      mergeBbox(res, r, m);
    }
    first = false;
    // 遮罩跳过被遮罩节点
    if (node.computedStyle.maskMode) {
      let count = 0;
      let next = node.next;
      while (next && !next.computedStyle.breakMask) {
        count++;
        next = next.next;
      }
      i += count;
    }
  }
  return group.displayRect = res;
}

export function getBasicInfo(node: Node) {
  const list: Node[] = [node];
  const top = node.artBoard || node.page;
  let parent = node.parent;
  while (parent && parent !== top) {
    list.unshift(parent);
    parent = parent.parent;
  }
  let m = identity();
  for (let i = 0, len = list.length; i < len; i++) {
    m = multiply(m, list[i].matrix);
  }
  const rect = node._rect || node.rect;
  const t = calRectPoints(rect[0], rect[1], rect[2], rect[3], m);
  const x1 = t.x1;
  const y1 = t.y1;
  const x2 = t.x2;
  const y2 = t.y2;
  const x3 = t.x3;
  const y3 = t.y3;
  const x4 = t.x4;
  const y4 = t.y4;
  const { computedStyle } = node;
  let baseX = 0,
    baseY = 0;
  if (!node.artBoard) {
    baseX = (node.page?.props as PageProps).rule?.baseX || 0;
    baseY = (node.page?.props as PageProps).rule?.baseY || 0;
  }
  const res = {
    baseX,
    baseY,
    x: Math.min(x1, x2, x3, x4) - baseX,
    y: Math.min(y1, y2, y3, y4) - baseY,
    w: rect[2] - rect[0],
    h: rect[3] - rect[1],
    dx: 0,
    dy: 0,
    dw: 0,
    dh: 0,
    isFlippedHorizontal: computedStyle.scaleX === -1,
    isFlippedVertical: computedStyle.scaleY === -1,
    rotation: computedStyle.rotateZ,
    opacity: computedStyle.opacity,
    mixBlendMode: computedStyle.mixBlendMode,
    constrainProportions: node.props.constrainProportions,
    matrix: m,
    displayRect: rect.slice(0),
    isLine: false,
    length: 0,
    angle: 0,
    points: [] as Point[],
  };
  if (node instanceof Group && !(node instanceof ShapeGroup)) {
    const r = getGroupActualRect(node);
    res.displayRect[0] = r[0];
    res.displayRect[1] = r[1];
    res.displayRect[2] = r[2];
    res.displayRect[3] = r[3];
    const t = calRectPoints(r[0], r[1], r[2], r[3], m);
    const x1 = t.x1;
    const y1 = t.y1;
    const x2 = t.x2;
    const y2 = t.y2;
    const x3 = t.x3;
    const y3 = t.y3;
    const x4 = t.x4;
    const y4 = t.y4;
    const x = Math.min(x1, x2, x3, x4) - baseX;
    const y = Math.min(y1, y2, y3, y4) - baseY;
    res.dx = x - res.x;
    res.dy = y - res.y;
    const w = r[2] - r[0];
    const h = r[3] - r[1];
    res.dw = w - res.w;
    res.dh = h - res.h;
  }
  else if (node instanceof Geom) {
    res.isLine = node.isLine();
    const points = node.points;
    if (res.isLine) {
      res.length = Math.sqrt(
        Math.pow(points[1].absX! - points[0].absX!, 2) +
        Math.pow(points[1].absY! - points[0].absY!, 2),
      );
      const dx = points[1].absX! - points[0].absX!;
      if (dx === 0) {
        if (points[1].absY! >= points[0].absY!) {
          res.angle = 90;
        }
        else {
          res.angle = -90;
        }
      }
      else {
        const tan = (points[1].absY! - points[0].absY!) / dx;
        res.angle = r2d(Math.atan(tan));
      }
    }
    points.forEach(item => {
      const p = calPoint({
        x: item.absX! - res.baseX,
        y: item.absY! - res.baseY,
      }, m);
      item.dspX = p.x;
      item.dspY = p.y;
      if (item.hasCurveFrom) {
        const p = calPoint({
          x: item.absFx! - res.baseX,
          y: item.absFy! - res.baseY,
        }, m);
        item.dspFx = p.x;
        item.dspFy = p.y;
      }
      if (item.hasCurveTo) {
        const p = calPoint({
          x: item.absTx! - res.baseX,
          y: item.absTy! - res.baseY,
        }, m,);
        item.dspTx = p.x;
        item.dspTy = p.y;
      }
    });
    res.points = points;
  }
  return res;
}

export default {
  moveTo,
  POSITION,
  migrate,
  sortTempIndex,
  getWholeBoundingClientRect,
  resizeTL,
  resizeBR,
  getGroupActualRect,
  getBasicInfo,
};
