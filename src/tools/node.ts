import {
  calPoint,
  calRectPoints,
  identity,
  multiply,
  multiplyRotateZ,
  multiplyScaleX,
  multiplyScaleY
} from '../math/matrix';
import Container from '../node/Container';
import Group from '../node/Group';
import Node from '../node/Node';
import Root from '../node/Root';
import { ComputedStyle, StyleUnit } from '../style/define';
import { PageProps, Point, ResizeStyle } from '../format';
import Geom from '../node/geom/Geom';
import { d2r, r2d } from '../math/geom';
import Page from '../node/Page';
import { calMatrixByOrigin } from '../style/transform';
import { includedAngle, length, projection } from '../math/vector';
import inject from '../util/inject';
import { Rect } from '../control/Select';

enum POSITION {
  APPEND = 0,
  PREPEND = 1,
  BEFORE = 2,
  AFTER = 3,
}

function moveTo(nodes: Node[], target: Node, position = POSITION.APPEND) {
  if (!nodes.length) {
    return;
  }
  if (nodes.indexOf(target) > -1) {
    inject.error('Can not moveTo self');
    return;
  }
  const parent = target.parent;
  const artBoard = target.artBoard;
  // 可能移动的parent就是本来的parent，只是children顺序变更，防止迁移后remove造成尺寸变化，计算失效
  if (parent instanceof Group) {
    parent.fixedPosAndSize = true;
  }
  for (let i = 0, len = nodes.length; i < len; i++) {
    const item = nodes[i];
    if (position === POSITION.BEFORE) {
      if (parent) {
        migrate(parent, item);
      }
      target.insertBefore(item);
      const prev = target.prev;
      item.props.index = ((prev?.props.index || 0) + target.props.index) * 0.5;
    }
    else if (position === POSITION.AFTER) {
      if (parent) {
        migrate(parent, item);
      }
      target.insertAfter(item);
      const next = target.next;
      item.props.index = ((next?.props.index || 1) + target.props.index) * 0.5;
    }
    // 默认under
    else if (target instanceof Container) {
      migrate(target, item);
      if (position === POSITION.PREPEND) {
        target.prependChild(item);
        const next = item.next;
        item.props.index = (next?.props.index || 1) * 0.5;
      }
      else {
        target.appendChild(item);
        const prev = item.prev;
        item.props.index = ((prev?.props.index || 0) + 1) * 0.5;
      }
    }
    item.artBoard = artBoard;
  }
  if (parent instanceof Group) {
    parent.fixedPosAndSize = false;
    // 手动检查尺寸变化
    parent.checkPosSizeSelf();
  }
}

export function moveAppend(nodes: Node[], target: Node) {
  moveTo(nodes, target, POSITION.APPEND);
}

export function movePrepend(nodes: Node[], target: Node) {
  moveTo(nodes, target, POSITION.PREPEND);
}

export function moveAfter(nodes: Node[], target: Node) {
  moveTo(nodes, target, POSITION.AFTER);
}

export function moveBefore(nodes: Node[], target: Node) {
  moveTo(nodes, target, POSITION.BEFORE);
}

function getMatrixNoFlip(node: Node) {
  const { scaleX, scaleY, rotateZ, transformOrigin: tfo } = node.computedStyle;
  if (scaleX >= 0 || scaleY >= 0) {
    return node.matrix;
  }
  const m = identity();
  const transform = node.transform;
  m[12] = transform[12];
  m[13] = transform[13];
  if (rotateZ) {
    multiplyRotateZ(m, d2r(rotateZ));
  }
  return calMatrixByOrigin(m, tfo[0], tfo[1]);
}

// 获取节点相对于其所在Page的matrix，Page本身返回E，注意忽略镜像
export function getMatrixOnPage(node: Node, ignoreFlip = false) {
  if (!node.page) {
    throw new Error('Node not on a Page');
  }
  if (node.isPage && node instanceof Page) {
    return identity();
  }
  // 从自己开始向上到page，累计matrix
  const page = node.page;
  let p = node.parent;
  const list: Node[] = [];
  while (p && p !== page) {
    list.push(p);
    p = p.parent;
  }
  let m = identity();
  while (list.length) {
    const n = list.pop()!;
    m = multiply(m, ignoreFlip ? getMatrixNoFlip(n) : n.matrix);
  }
  m = multiply(m, ignoreFlip ? getMatrixNoFlip(node) : node.matrix);
  return m;
}

// 获取节点相对于其所在Page的x/y镜像，Page本身返回1
export function getFlipOnPage(node: Node) {
  if (!node.page) {
    throw new Error('Node not on a Page');
  }
  if (node.isPage && node instanceof Page) {
    return { x: 1, y: 1 };
  }
  let x = node.computedStyle.scaleX, y = node.computedStyle.scaleY;
  // 从自己开始向上到page，累计matrix
  const page = node.page;
  let p = node.parent;
  while (p && p !== page) {
    x *= p.computedStyle.scaleX;
    y *= p.computedStyle.scaleY;
    p = p.parent;
  }
  return { x, y };
}

/**
 * 将node迁移到parent下的尺寸和位置，并不是真正移动dom，移动权和最终位置交给外部控制
 * 记录下node和parent相对于page的坐标旋转镜像，然后转换style到以parent为新父元素下并保持单位不变
 * 1. parent需要保留旋转镜像，并记录下来相对于page的旋转rp，和自身的镜像scaleX/scaleY（非相对于page）
 * 2. node移动前需算出相对于page的旋转和镜像，记录为rn和flipN
 * 3. node要移动到parent下，旋转是相对于parent的旋转，因此本身旋转角度是r=rn-rp，先转至相对于parent无旋转即-r
 * 4. 如果parent自身有镜像scaleX/scaleY，node移动后等于跟随其镜像，移动前node需要反向下否则会计算显示错误
 * 5. 计算node原点相对于parent原点的left/top，用向量投影算，再用向量夹角算正负号
 */
export function migrate(parent: Node, node: Node) {
  if (node.parent === parent) {
    return;
  }
  const width = parent.width;
  const height = parent.height;
  // 先求得parent的matrix，旋转和左上顶点的2条边的矢量，要特殊忽略掉parent的镜像，用模拟反向镜像做
  const mp = getMatrixOnPage(parent);
  const { scaleX, scaleY } = parent.computedStyle;
  let rp = 0;
  // parent自身有镜像的话，旋转角度计算还得排除掉
  if (scaleX === -1) {
    const i = identity();
    multiplyScaleX(i, scaleX);
    const tfo = parent.computedStyle.transformOrigin;
    const t = calMatrixByOrigin(i, tfo[0], tfo[1]);
    const m = multiply(mp, t);
    rp = Math.acos(m[0]);
  }
  else {
    rp = Math.acos(mp[0]);
  }
  const p0 = calPoint({ x: 0, y: 0 }, mp);
  const p1 = calPoint({ x: parent.width, y: 0 }, mp);
  const p2 = calPoint({ x: 0, y: parent.height }, mp);
  const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
  const v2 = { x: p2.x - p0.x, y: p2.y - p0.y };
  // console.log('v1', v1, v2);
  // 再求得node的matrix，并相对于parent取消旋转和镜像
  const i = identity();
  const flipN = getFlipOnPage(node);
  if (flipN.x !== 1) {
    multiplyScaleX(i, flipN.x);
  }
  if (flipN.y !== 1) {
    multiplyScaleX(i, flipN.y);
  }
  const mn = getMatrixOnPage(node, true);
  const rn = Math.acos(mn[0]);
  const r = rn - rp;
  // console.log(r2d(rp), r2d(rn), r2d(r))
  multiplyRotateZ(i, -r);
  // 如果parent有镜像，node要先跟随它，否则迁移后会显示反了
  if (scaleX === -1) {
    multiplyScaleX(i, scaleX);
  }
  if (scaleY === -1) {
    multiplyScaleY(i, scaleY);
  }
  const tfo = node.computedStyle.transformOrigin;
  const t = calMatrixByOrigin(i, tfo[0], tfo[1]);
  const m = multiply(mn, t);
  // node顶点和parent的顶点组成的向量，在2条矢量上的投影距离就是left和top，要考虑去除如Text自身的translate
  const p = calPoint({ x: -node.computedStyle.translateX, y: -node.computedStyle.translateY }, m);
  // console.log(p);
  const v = { x: p.x - p0.x, y: p.y - p0.y };
  const v3 = projection(v.x, v.y, v1.x, v1.y);
  const v4 = projection(v.x, v.y, v2.x, v2.y);
  // console.log('v3', v3, v4);
  // 看这个向量和那2条矢量之间的夹角，判断x/y的正负号
  let x = length(v3.x, v3.y);
  let y = length(v4.x, v4.y);
  // console.log(x, y);
  const angle1 = includedAngle(v.x, v.y, v1.x, v1.y);
  const angle2 = includedAngle(v.x, v.y, v2.x, v2.y);
  const rt = Math.PI * 0.5;
  if (angle1 <= rt && angle2 <= rt) {}
  else if (angle1 <= rt) {
    y = -y;
  }
  else if (angle2 <= rt) {
    x = -x;
  }
  else {
    x = -x;
    y = -y;
  }
  // console.log(x, y);
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
    style.left.v = x;
    // left+right忽略width
    if (rightConstraint) {
      style.right.v = width - x - node.width;
    }
    // left+width
    else if (widthConstraint) {
      // 默认right就是auto啥也不做
    }
    // 仅left，right是百分比忽略width
    else {
      style.right.v = ((width - x - node.width) * 100) / width;
    }
  }
  // right
  else if (rightConstraint) {
    style.right.v = width - x - node.width;
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
    // 仅固定宽度，以中心点占left的百分比，或者文字只有left百分比无right
    if (
      widthConstraint ||
      (style.left.u === StyleUnit.PERCENT && style.right.u === StyleUnit.AUTO)
    ) {
      style.left.v = x * 100 / width;
    }
    // 左右皆为百分比
    else {
      style.left.v = x * 100 / width;
      style.right.v = ((width - x - node.width) * 100) / width;
    }
  }
  // top
  if (topConstraint) {
    style.top.v = y;
    // top+bottom忽略height
    if (bottomConstraint) {
      style.bottom.v = height - y - node.height;
    }
    // top+height
    else if (heightConstraint) {
      // 默认bottom就是auto啥也不做
    }
    // 仅top，bottom是百分比忽略height
    else {
      style.bottom.v = ((height - y - node.height) * 100) / height;
    }
  }
  // bottom
  else if (bottomConstraint) {
    style.bottom.v = height - y - node.height;
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
    // 仅固定宽度，以中心点占top的百分比，或者文字只有top百分比无bottom
    if (
      heightConstraint ||
      (style.top.u === StyleUnit.PERCENT && style.bottom.u === StyleUnit.AUTO)
    ) {
      style.top.v = y * 100 / height;
    }
    // 左右皆为百分比
    else {
      style.top.v = y * 100 / height;
      style.bottom.v = ((height - y - node.height) * 100) / height;
    }
  }
  style.rotateZ.v = r2d(r);
  style.scaleX.v = flipN.x * (scaleX === -1 ? -1 : 1);
  style.scaleY.v = flipN.y * (scaleY === -1 ? -1 : 1);
}

export function sortTempIndex(nodes: Node[]) {
  if (!nodes.length || !nodes[0].root) {
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

// 多个节点的BoundingClientRect合集极值
export function getWholeBoundingClientRect(
  nodes: Node[],
  opt?: {
    includeBbox?: boolean,
    excludeRotate?: boolean,
  },
) {
  if (!nodes.length) {
    return;
  }
  const rect = nodes[0].getBoundingClientRect(opt);
  for (let i = 1, len = nodes.length; i < len; i++) {
    const r = nodes[i].getBoundingClientRect(opt);
    rect.left = Math.min(rect.left, r.left);
    rect.right = Math.max(rect.right, r.right);
    rect.top = Math.min(rect.top, r.top);
    rect.bottom = Math.max(rect.bottom, r.bottom);
    // points无意义
  }
  return rect;
}

export function resizeTopOperate(node: Node, originComputedStyle: ComputedStyle, d: number, fromCenter = false) {
  const style = node.style;
  const next: ResizeStyle = {};
  // 超过原本的底侧，需垂直翻转，然后top定位到原本bottom的坐标，bottom根据新差值计算
  if (d > originComputedStyle.height) {
    d -= originComputedStyle.height;
    d = Math.max(d, 1);
    if (style.top.u === StyleUnit.PX) {
      next.top = originComputedStyle.top + originComputedStyle.height;
    }
    else if (style.left.u === StyleUnit.PERCENT) {
      next.top = (originComputedStyle.top + originComputedStyle.height) * 100 / node.parent!.height + '%';
    }
    const cs = Object.assign({}, originComputedStyle);
    cs.height = 0;
    Object.assign(next, resizeBottomOperate(node, cs, d));
    next.scaleY = originComputedStyle.scaleY * -1;
  }
  else {
    d = Math.min(d, originComputedStyle.height - 1);
    next.scaleY = originComputedStyle.scaleY;
    // top为确定值则修改它，还要看height是否是确定值也一并修改
    if (style.top.u === StyleUnit.PX || style.top.u === StyleUnit.PERCENT) {
      if (style.top.u === StyleUnit.PX) {
        next.top = originComputedStyle.top + d;
      }
      else {
        next.top = (originComputedStyle.top + d) * 100 / node.parent!.height + '%';
      }
      if (style.height.u === StyleUnit.PX ||
        // 只有top定位的自动高度文本
        style.height.u === StyleUnit.AUTO && style.bottom.u === StyleUnit.AUTO) {
        next.height = originComputedStyle.height - d;
      }
      else if (style.height.u === StyleUnit.PERCENT) {
        next.height = (originComputedStyle.height - d) * 100 / node.parent!.height + '%';
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
        next.height = originComputedStyle.height - d;
      }
      else {
        next.height = (originComputedStyle.height - d) * 100 / node.parent!.height + '%';
      }
    }
  }
  if (fromCenter) {
    const t = resizeBottomOperate(node, originComputedStyle, -d);
    if (t.height) {
      if (typeof t.height === 'number') {
        t.height = originComputedStyle.height - d * 2;
      }
      else {
        t.height = (originComputedStyle.height - d * 2) * 100 / node.parent!.height + '%';
      }
    }
    Object.assign(next, t);
  }
  return next;
}

export function resizeBottomOperate(node: Node, originComputedStyle: ComputedStyle, d: number, fromCenter = false) {
  const style = node.style;
  const next: ResizeStyle = {};
  if (d < -originComputedStyle.height) {
    d += originComputedStyle.height;
    d = Math.min(d, -1);
    if (style.bottom.u === StyleUnit.PX) {
      next.bottom = originComputedStyle.bottom + originComputedStyle.height;
    }
    else if (style.bottom.u === StyleUnit.PERCENT) {
      next.bottom = (originComputedStyle.bottom + originComputedStyle.height) * 100 / node.parent!.height + '%';
    }
    const cs = Object.assign({}, originComputedStyle);
    cs.height = 0;
    Object.assign(next, resizeTopOperate(node, cs, d));
    next.scaleY = originComputedStyle.scaleY * -1;
  }
  else {
    d = Math.max(d, -originComputedStyle.height + 1);
    next.scaleY = originComputedStyle.scaleY;
    // bottom为确定值则修改它，还要看height是否是确定值也一并修改
    if (style.bottom.u === StyleUnit.PX || style.bottom.u === StyleUnit.PERCENT) {
      if (style.bottom.u === StyleUnit.PX) {
        next.bottom = originComputedStyle.bottom - d;
      }
      else {
        next.bottom = (originComputedStyle.bottom - d) * 100 / node.parent!.height + '%';
      }
      if (style.height.u === StyleUnit.PX ||
        // 只有bottom定位的自动高度文本
        style.height.u === StyleUnit.AUTO && style.top.u === StyleUnit.AUTO) {
        next.height = originComputedStyle.height + d;
      }
      else if (style.height.u === StyleUnit.PERCENT) {
        next.height = (originComputedStyle.height + d) * 100 / node.parent!.height + '%';
      }
    }
    // bottom为自动，高度则为确定值修改，根据top定位
    else if (
      style.height.u === StyleUnit.PX ||
      style.height.u === StyleUnit.PERCENT ||
      style.height.u === StyleUnit.AUTO
    ) {
      if (style.height.u === StyleUnit.PX || style.height.u === StyleUnit.AUTO) {
        next.height = originComputedStyle.height + d;
      }
      else {
        next.height = (originComputedStyle.height + d) * 100 / node.parent!.height + '%';
      }
    }
  }
  if (fromCenter) {
    const t = resizeTopOperate(node, originComputedStyle, -d);
    if (t.height) {
      if (typeof t.height === 'number') {
        t.height = originComputedStyle.height + d * 2;
      }
      else {
        t.height = (originComputedStyle.height + d * 2) * 100 / node.parent!.height + '%';
      }
    }
    Object.assign(next, t);
  }
  return next;
}

export function resizeLeftOperate(node: Node, originComputedStyle: ComputedStyle, d: number, fromCenter = false) {
  const style = node.style;
  const next: ResizeStyle = {};
  // 超过原本的右侧，需水平翻转，然后left定位到原本right的坐标，right根据新差值计算
  if (d > originComputedStyle.width) {
    d -= originComputedStyle.width;
    d = Math.max(d, 1);
    if (style.left.u === StyleUnit.PX) {
      next.left = originComputedStyle.left + originComputedStyle.width;
    }
    else if (style.left.u === StyleUnit.PERCENT) {
      next.left = (originComputedStyle.left + originComputedStyle.width) * 100 / node.parent!.width + '%';
    }
    const cs = Object.assign({}, originComputedStyle);
    cs.width = 0;
    Object.assign(next, resizeRightOperate(node, cs, d));
    next.scaleX = originComputedStyle.scaleX * -1;
  }
  else {
    d = Math.min(d, originComputedStyle.width - 1);
    next.scaleX = originComputedStyle.scaleX;
    // left为确定值则修改它，还要看width是否是确定值也一并修改
    if (style.left.u === StyleUnit.PX || style.left.u === StyleUnit.PERCENT) {
      if (style.left.u === StyleUnit.PX) {
        next.left = originComputedStyle.left + d;
      }
      else {
        next.left = (originComputedStyle.left + d) * 100 / node.parent!.width + '%';
      }
      if (style.width.u === StyleUnit.PX ||
        // 只有left定位的自动宽度文本
        style.width.u === StyleUnit.AUTO && style.right.u === StyleUnit.AUTO) {
        next.width = originComputedStyle.width - d;
      }
      else if (style.width.u === StyleUnit.PERCENT) {
        next.width = (originComputedStyle.width - d) * 100 / node.parent!.width + '%';
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
        next.width = originComputedStyle.width - d;
      }
      else {
        next.width = (originComputedStyle.width - d) * 100 / node.parent!.width + '%';
      }
    }
  }
  if (fromCenter) {
    const t = resizeRightOperate(node, originComputedStyle, -d);
    if (t.width) {
      if (typeof t.width === 'number') {
        t.width = originComputedStyle.width - d * 2;
      }
      else {
        t.width = (originComputedStyle.width - d * 2) * 100 / node.parent!.width + '%';
      }
    }
    Object.assign(next, t);
  }
  return next;
}

export function resizeRightOperate(node: Node, originComputedStyle: ComputedStyle, d: number, fromCenter = false) {
  const style = node.style;
  const next: ResizeStyle = {};
  // 超过原本的左侧，需水平翻转，然后right定位到原本left的坐标，left根据新差值计算
  if (d < -originComputedStyle.width) {
    d += originComputedStyle.width;
    d = Math.min(d, -1);
    if (style.right.u === StyleUnit.PX) {
      next.right = originComputedStyle.right + originComputedStyle.width;
    }
    else if (style.right.u === StyleUnit.PERCENT) {
      next.right = (originComputedStyle.right + originComputedStyle.width) * 100 / node.parent!.width + '%';
    }
    const cs = Object.assign({}, originComputedStyle);
    cs.width = 0;
    Object.assign(next, resizeLeftOperate(node, cs, d));
    next.scaleX = originComputedStyle.scaleX * -1;
  }
  else {
    d = Math.max(d, -originComputedStyle.width + 1);
    next.scaleX = originComputedStyle.scaleX;
    // right为确定值则修改它，还要看width是否是确定值也一并修改，比如右固定宽度
    if (style.right.u === StyleUnit.PX || style.right.u === StyleUnit.PERCENT) {
      if (style.right.u === StyleUnit.PX) {
        next.right = originComputedStyle.right - d;
      }
      else {
        next.right = (originComputedStyle.right - d) * 100 / node.parent!.width + '%';
      }
      if (style.width.u === StyleUnit.PX ||
        // 只有right定位的自动宽度文本
        style.width.u === StyleUnit.AUTO && style.left.u === StyleUnit.AUTO) {
        next.width = originComputedStyle.width + d;
      }
      else if (style.width.u === StyleUnit.PERCENT) {
        next.width = (originComputedStyle.width + d) * 100 / node.parent!.width + '%';
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
        next.width = originComputedStyle.width + d;
      }
      else {
        next.width = (originComputedStyle.width + d) * 100 / node.parent!.width + '%';
      }
    }
  }
  if (fromCenter) {
    const t = resizeLeftOperate(node, originComputedStyle, -d);
    if (t.width) {
      if (typeof t.width === 'number') {
        t.width = originComputedStyle.width + d * 2;
      }
      else {
        t.width = (originComputedStyle.width + d * 2) * 100 / node.parent!.width + '%';
      }
    }
    Object.assign(next, t);
  }
  return next;
}

// 这4个方向的操作的封装API，不像拖拽或Input输入有中间过程需要优化，封装是一步到位没有中间过程
export function resizeTop(node: Node, d: number) {
  if (d) {
    const originStyle = node.getStyle();
    node.startSizeChange();
    const t = resizeTopOperate(node, node.computedStyle, d);
    node.updateStyle(t);
    node.endSizeChange(originStyle);
    node.checkPosSizeUpward();
  }
}

// 这4个方向的操作的封装API，不像拖拽或Input输入有中间过程需要优化，封装是一步到位没有中间过程
export function resizeBottom(node: Node, d: number) {
  if (d) {
    const originStyle = node.getStyle();
    node.startSizeChange();
    const t = resizeBottomOperate(node, node.computedStyle, d);
    node.updateStyle(t);
    node.endSizeChange(originStyle);
    node.checkPosSizeUpward();
  }
}

// 这4个方向的操作的封装API，不像拖拽或Input输入有中间过程需要优化，封装是一步到位没有中间过程
export function resizeLeft(node: Node, d: number) {
  if (d) {
    const originStyle = node.getStyle();
    node.startSizeChange();
    const t = resizeLeftOperate(node, node.computedStyle, d);
    node.updateStyle(t);
    node.endSizeChange(originStyle);
    node.checkPosSizeUpward();
  }
}

// 这4个方向的操作的封装API，不像拖拽或Input输入有中间过程需要优化，封装是一步到位没有中间过程
export function resizeRight(node: Node, d: number) {
  if (d) {
    const originStyle = node.getStyle();
    node.startSizeChange();
    const t = resizeRightOperate(node, node.computedStyle, d);
    node.updateStyle(t);
    node.endSizeChange(originStyle);
    node.checkPosSizeUpward();
  }
}

function resizeVerticalAspectRatio(node: Node, originComputedStyle: ComputedStyle, d: number) {
  // 根据差值d均分至相邻2侧方向，如果是left+right定位则互不干扰，如果是left+width/right+width则width会冲突需要处理
  const aspectRatio = originComputedStyle.width / originComputedStyle.height;
  const dx = d * aspectRatio;
  const nl = resizeLeftOperate(node, originComputedStyle, -dx * 0.5);
  const nr = resizeRightOperate(node, originComputedStyle, dx * 0.5);
  const next = Object.assign({}, nl, nr);
  // 修正width冲突，根据差值计算*2，sketch只有px
  if (next.width) {
    if (typeof next.width === 'number') {
      const dw = next.width - originComputedStyle.width;
      next.width = originComputedStyle.width + dw * 2;
    }
    else {
      const pw = node.parent!.width;
      const w = parseFloat(next.width) * pw * 0.01;
      const dw = w - originComputedStyle.width;
      next.width = (originComputedStyle.width + dw * 2) * 100 / pw + '%';
    }
  }
  return next;
}

export function resizeTopAspectRatioOperate(node: Node, originComputedStyle: ComputedStyle, d: number, fromCenter = false) {
  // 先获得无宽高比的更新，再修正
  const next = resizeTopOperate(node, originComputedStyle, d);
  // 中心拉伸对面
  if (fromCenter) {
    const b = resizeBottomOperate(node, originComputedStyle, -d);
    if (b.height) {
      if (typeof b.height === 'number') {
        b.height = originComputedStyle.height - d * 2;
      }
      else {
        b.height = (originComputedStyle.height - d * 2) * 100 / node.parent!.height + '%';
      }
    }
    Object.assign(next, b);
  }
  const t = resizeVerticalAspectRatio(node, originComputedStyle, fromCenter ? -d * 2 : -d);
  return Object.assign(next, t);
}

export function resizeBottomAspectRatioOperate(node: Node, originComputedStyle: ComputedStyle, d: number, fromCenter = false) {
  // 先获得无宽高比的更新，再修正
  const next = resizeBottomOperate(node, originComputedStyle, d);
  // 中心拉伸对面
  if (fromCenter) {
    const t = resizeTopOperate(node, originComputedStyle, -d);
    if (t.height) {
      if (typeof t.height === 'number') {
        t.height = originComputedStyle.height + d * 2;
      }
      else {
        t.height = (originComputedStyle.height + d * 2) * 100 / node.parent!.height + '%';
      }
    }
    Object.assign(next, t);
  }
  const t = resizeVerticalAspectRatio(node, originComputedStyle, fromCenter ? d * 2 : d);
  return Object.assign(next, t);
}

function resizeHorizontalAspectRatio(node: Node, originComputedStyle: ComputedStyle, d: number) {
  // 根据差值d均分至相邻2侧方向，如果是left+right定位则互不干扰，如果是left+width/right+width则width会冲突需要处理
  const aspectRatio = originComputedStyle.width / originComputedStyle.height;
  const dy = d / aspectRatio;
  const nt = resizeTopOperate(node, originComputedStyle, -dy * 0.5);
  const nb = resizeBottomOperate(node, originComputedStyle, dy * 0.5);
  const next = Object.assign({}, nt, nb);
  // 修正width冲突，根据差值计算*2，sketch只有px
  if (next.height) {
    if (typeof next.height === 'number') {
      const dh = next.height - originComputedStyle.height;
      next.height = originComputedStyle.height + dh * 2;
    }
    else {
      const ph = node.parent!.height;
      const h = parseFloat(next.height) * ph * 0.01;
      const dh = h - originComputedStyle.height;
      next.height = (originComputedStyle.height + dh * 2) * 100 / ph + '%';
    }
  }
  return next;
}

export function resizeLeftAspectRatioOperate(node: Node, originComputedStyle: ComputedStyle, d: number, fromCenter = false) {
  // 先获得无宽高比的更新，再修正
  const next = resizeLeftOperate(node, originComputedStyle, d);
  // 中心拉伸对面
  if (fromCenter) {
    const r = resizeRightOperate(node, originComputedStyle, -d);
    if (r.width) {
      if (typeof r.width === 'number') {
        r.width = originComputedStyle.width - d * 2;
      }
      else {
        r.width = (originComputedStyle.width - d * 2) * 100 / node.parent!.width + '%';
      }
    }
    Object.assign(next, r);
  }
  const t = resizeHorizontalAspectRatio(node, originComputedStyle, fromCenter ? -d * 2: -d);
  return Object.assign(next, t);
}

export function resizeRightAspectRatioOperate(node: Node, originComputedStyle: ComputedStyle, d: number, fromCenter = false) {
  // 先获得无宽高比的更新，再修正
  const next = resizeRightOperate(node, originComputedStyle, d);
  // 中心拉伸对面
  if (fromCenter) {
    const l = resizeLeftOperate(node, originComputedStyle, -d);
    if (l.width) {
      if (typeof l.width === 'number') {
        l.width = originComputedStyle.width + d * 2;
      }
      else {
        l.width = (originComputedStyle.width + d * 2) * 100 / node.parent!.width + '%';
      }
    }
    Object.assign(next, l);
  }
  const t = resizeHorizontalAspectRatio(node, originComputedStyle, fromCenter ? d * 2 : d);
  return Object.assign(next, t);
}

export function getDiagonalAspectRatioIsec(data: { width: number, height: number }, dx: number, dy: number, isACOrBD = true) {
  // 视左上角为原点，求对角线的斜率，一定不是特殊垂线或水平线，过原点的为AC，另外一条是BD
  const { width: x1, height: y1 } = data;
  let k1 = y1 / x1;
  if (!isACOrBD) {
    k1 *= -1;
  }
  const k2 = -1 / k1;
  // 鼠标当前点，求出和对角线的交点
  const x2 = x1 + dx;
  const y2 = y1 + dy;
  const x = (y2 - y1 + k1 * x1 - k2 * x2) / (k1 - k2);
  const y = k2 * x - k2 * x2 + y2;
  return { x, y };
}

export function resizeTopLeftAspectRatioOperate(node: Node, originComputedStyle: ComputedStyle, dx: number, dy: number, fromCenter = false) {
  const { x, y } = getDiagonalAspectRatioIsec(originComputedStyle, dx, dy, true);
  // 交点和宽高的差值就是要调整改变的值
  const next = resizeLeftOperate(node, originComputedStyle, x - originComputedStyle.width, fromCenter);
  Object.assign(next, resizeTopOperate(node, originComputedStyle, y - originComputedStyle.height, fromCenter));
  return next;
}

export function resizeTopRightAspectRatioOperate(node: Node, originComputedStyle: ComputedStyle, dx: number, dy: number, fromCenter = false) {
  const { x, y } = getDiagonalAspectRatioIsec(originComputedStyle, dx, dy, false);
  // 交点和宽高的差值就是要调整改变的值
  const next = resizeRightOperate(node, originComputedStyle, x - originComputedStyle.width, fromCenter);
  Object.assign(next, resizeTopOperate(node, originComputedStyle, y - originComputedStyle.height, fromCenter));
  return next;
}

export function resizeBottomLeftAspectRatioOperate(node: Node, originComputedStyle: ComputedStyle, dx: number, dy: number, fromCenter = false) {
  const { x, y } = getDiagonalAspectRatioIsec(originComputedStyle, dx, dy, false);
  // 交点和宽高的差值就是要调整改变的值
  const next = resizeLeftOperate(node, originComputedStyle, x - originComputedStyle.width, fromCenter);
  Object.assign(next, resizeBottomOperate(node, originComputedStyle, y - originComputedStyle.height, fromCenter));
  return next;
}

export function resizeBottomRightAspectRatioOperate(node: Node, originComputedStyle: ComputedStyle, dx: number, dy: number, fromCenter = false) {
  const { x, y } = getDiagonalAspectRatioIsec(originComputedStyle, dx, dy, true);
  // 交点和宽高的差值就是要调整改变的值
  const next = resizeRightOperate(node, originComputedStyle, x - originComputedStyle.width, fromCenter);
  Object.assign(next, resizeBottomOperate(node, originComputedStyle, y - originComputedStyle.height, fromCenter));
  return next;
}

function resizeHorizontalAspectRatioMultiAr(next: ResizeStyle, node: Node, originComputedStyle: ComputedStyle, d: number) {
  if (d) {
    if (next.left) {
      if (typeof next.left === 'number') {
        next.left += d;
      }
      else {
        next.left = parseFloat(next.left) + (d / node.parent!.width) * 100 + '%';
      }
    }
    // 只有left/right中一个且没有width时，一定是left+right，偏移时增加
    else if (!next.width) {
      if (node.style.left.u === StyleUnit.PERCENT) {
        next.left = (originComputedStyle.left + d) * 100 / node.parent!.width + '%';
      }
      else if (node.style.left.u === StyleUnit.PX) {
        next.left = originComputedStyle.left + d;
      }
    }
    if (next.right) {
      if (typeof next.right === 'number') {
        next.right -= d;
      }
      else {
        next.right = parseFloat(next.right) - (d / node.parent!.width) * 100 + '%';
      }
    }
    // 同上
    else if (!next.width) {
      if (node.style.right.u === StyleUnit.PERCENT) {
        next.right = (originComputedStyle.right - d) * 100 / node.parent!.width + '%';
      }
      else if (node.style.right.u === StyleUnit.PX) {
        next.right = originComputedStyle.right - d;
      }
    }
  }
}

function resizeVerticalAspectRatioMultiAr(next: ResizeStyle, node: Node, originComputedStyle: ComputedStyle, d: number) {
  if (d) {
    if (next.top) {
      if (typeof next.top === 'number') {
        next.top += d;
      }
      else {
        next.top = parseFloat(next.top) + (d / node.parent!.height) * 100 + '%';
      }
    }
    // 只有top/bottom中一个且没有height时，一定是top+bottom，偏移时增加
    else if (!next.height) {
      if (node.style.top.u === StyleUnit.PERCENT) {
        next.top = (originComputedStyle.top + d) * 100 / node.parent!.height + '%';
      }
      else if (node.style.top.u === StyleUnit.PX) {
        next.top = originComputedStyle.top + d;
      }
    }
    if (next.bottom) {
      if (typeof next.bottom === 'number') {
        next.bottom -= d;
      }
      else {
        next.bottom = parseFloat(next.bottom) - (d / node.parent!.height) * 100 + '%';
      }
    }
    // 同上
    else if (!next.height) {
      if (node.style.bottom.u === StyleUnit.PERCENT) {
        next.bottom = (originComputedStyle.bottom - d) * 100 / node.parent!.height + '%';
      }
      else if (node.style.bottom.u === StyleUnit.PX) {
        next.bottom = originComputedStyle.bottom - d;
      }
    }
  }
}

function getVerticalDistanceAspectRatioMultiAr(d: number, clientRect: Rect, selectRect: Rect) {
  const d2 = d * selectRect.h / selectRect.w;
  const sc = selectRect.y + selectRect.h * 0.5;
  const nc = clientRect.y + clientRect.h * 0.5;
  return (nc - sc) * d2 / selectRect.h;
}

function getHorizontalDistanceAspectRatioMultiAr(d: number, clientRect: Rect, selectRect: Rect) {
  const d2 = d * selectRect.w / selectRect.h;
  const sc = selectRect.x + selectRect.w * 0.5;
  const nc = clientRect.x + clientRect.w * 0.5;
  return (nc - sc) * d2 / selectRect.w;
}

export function resizeTopMultiArOperate(node: Node, originComputedStyle: ComputedStyle, d: number, clientRect: Rect, selectRect: Rect, aspectRatio = false, fromCenter = false) {
  // 复用单个的比例拉伸，值和尺寸比例相关
  const next = aspectRatio
    ? resizeTopAspectRatioOperate(node, originComputedStyle, d * clientRect.h / selectRect.h, fromCenter)
    : resizeTopOperate(node, originComputedStyle, d * clientRect.h / selectRect.h, fromCenter);
  // 再计算副轴变化的尺寸进行偏移，按中心点对齐保持等比
  let dx = getHorizontalDistanceAspectRatioMultiAr(d, clientRect, selectRect);
  if (fromCenter) {
    dx *= 2;
  }
  resizeHorizontalAspectRatioMultiAr(next, node, originComputedStyle, -dx);
  // 主轴的偏移和所在位置比例相关
  let dy = 0;
  if (fromCenter) {
    dy = -d * (clientRect.y + clientRect.h * 0.5 - selectRect.y - selectRect.h * 0.5) * 2 / selectRect.h;
  }
  else {
    dy = d * (selectRect.y + selectRect.h - clientRect.y - clientRect.h) / selectRect.h;
  }
  resizeVerticalAspectRatioMultiAr(next, node, originComputedStyle, dy);
  return next;
}

export function resizeBottomMultiArOperate(node: Node, originComputedStyle: ComputedStyle, d: number, clientRect: Rect, selectRect: Rect, aspectRatio = false, fromCenter = false) {
  // 复用单个的比例拉伸，值和尺寸比例相关
  const next = aspectRatio
    ? resizeBottomAspectRatioOperate(node, originComputedStyle, d * clientRect.h / selectRect.h, fromCenter)
    : resizeBottomOperate(node, originComputedStyle, d * clientRect.h / selectRect.h, fromCenter);
  // 再计算副轴变化的尺寸进行偏移，按中心点对齐保持等比
  if (aspectRatio) {
    let dx = getHorizontalDistanceAspectRatioMultiAr(d, clientRect, selectRect);
    if (fromCenter) {
      dx *= 2;
    }
    resizeHorizontalAspectRatioMultiAr(next, node, originComputedStyle, dx);
  }
  let dy = 0;
  if (fromCenter) {
    dy = d * (clientRect.y + clientRect.h * 0.5 - selectRect.y - selectRect.h * 0.5) * 2 / selectRect.h;
  }
  else {
    dy = d * (clientRect.y - selectRect.y) / selectRect.h;
  }
  // 主轴的偏移和位置比例相关
  const p = (clientRect.y - selectRect.y) / selectRect.h;
  resizeVerticalAspectRatioMultiAr(next, node, originComputedStyle, dy);
  return next;
}

export function resizeLeftMultiArOperate(node: Node, originComputedStyle: ComputedStyle, d: number, clientRect: Rect, selectRect: Rect, aspectRatio = false, fromCenter = false) {
  // 复用单个的比例拉伸，值和尺寸比例相关
  const next = aspectRatio
    ? resizeLeftAspectRatioOperate(node, originComputedStyle, d * clientRect.w / selectRect.w, fromCenter)
    : resizeLeftOperate(node, originComputedStyle, d * clientRect.w / selectRect.w, fromCenter);
  // 再计算副轴变化的尺寸进行偏移，按中心点对齐保持等比
  if (aspectRatio) {
    let dy = getVerticalDistanceAspectRatioMultiAr(d, clientRect, selectRect);
    if (fromCenter) {
      dy *= 2;
    }
    resizeVerticalAspectRatioMultiAr(next, node, originComputedStyle, -dy);
  }
  // 主轴的偏移和所在位置比例相关
  let dx = 0;
  if (fromCenter) {
    dx = -d * (clientRect.x + clientRect.w * 0.5 - selectRect.x - selectRect.w * 0.5) * 2 / selectRect.w;
  }
  else {
    dx = d * (selectRect.x + selectRect.w - clientRect.x - clientRect.w) / selectRect.w;
  }
  resizeHorizontalAspectRatioMultiAr(next, node, originComputedStyle, dx);
  return next;
}

export function resizeRightMultiArOperate(node: Node, originComputedStyle: ComputedStyle, d: number, clientRect: Rect, selectRect: Rect, aspectRatio = false, fromCenter = false) {
  // 复用单个的比例拉伸，值和尺寸比例相关
  const next = aspectRatio
    ? resizeRightAspectRatioOperate(node, originComputedStyle, d * clientRect.w / selectRect.w, fromCenter)
    : resizeRightOperate(node, originComputedStyle, d * clientRect.w / selectRect.w, fromCenter);
  // 再计算副轴变化的尺寸进行偏移，按中心点对齐保持等比
  if (aspectRatio) {
    let dy = getVerticalDistanceAspectRatioMultiAr(d, clientRect, selectRect);
    if (fromCenter) {
      dy *= 2;
    }
    resizeVerticalAspectRatioMultiAr(next, node, originComputedStyle, dy);
  }
  // 主轴的偏移和所在位置比例相关
  let dx = 0;
  if (fromCenter) {
    dx = d * (clientRect.x + clientRect.w * 0.5 - selectRect.x - selectRect.w * 0.5) * 2 / selectRect.w;
  }
  else {
    dx = d * (clientRect.x - selectRect.x) / selectRect.w;
  }
  resizeHorizontalAspectRatioMultiAr(next, node, originComputedStyle, dx);
  return next;
}

function resetTopMultiAr(node: Node, originComputedStyle: ComputedStyle, dy: number, clientRect: Rect, selectRect: Rect, next1: ResizeStyle) {
  const next2 = resizeTopMultiArOperate(node, originComputedStyle, dy, clientRect, selectRect);
  delete next1.top;
  delete next1.height;
  delete next1.bottom;
  if (next2.top !== undefined) {
    next1.top = next2.top;
  }
  if (next2.height !== undefined) {
    next1.height = next2.height;
  }
  if (next2.bottom !== undefined) {
    next1.bottom = next2.bottom;
  }
}

export function resizeTopLeftMultiArOperate(node: Node, originComputedStyle: ComputedStyle, dx: number, dy: number, clientRect: Rect, selectRect: Rect, aspectRatio = false, fromCenter = false) {
  // 中心反而简单了，就是选框中心点，选择任意一侧拉伸都可以
  const next1 = resizeLeftMultiArOperate(node, originComputedStyle, dx, clientRect, selectRect, aspectRatio, fromCenter);
  if (fromCenter) {
    return next1;
  }
  // 非中心用2侧数据合并
  if (aspectRatio) {
    resetTopMultiAr(node, originComputedStyle, dy, clientRect, selectRect, next1);
  }
  else {
    const next2 = resizeTopMultiArOperate(node, originComputedStyle, dy, clientRect, selectRect, aspectRatio, fromCenter);
    Object.assign(next1, next2);
  }
  return next1;
}

export function resizeTopRightMultiArOperate(node: Node, originComputedStyle: ComputedStyle, dx: number, dy: number, clientRect: Rect, selectRect: Rect, aspectRatio = false, fromCenter = false) {
  // 中心反而简单了，就是选框中心点，选择任意一侧拉伸都可以
  const next1 = resizeRightMultiArOperate(node, originComputedStyle, dx, clientRect, selectRect, aspectRatio, fromCenter);
  if (fromCenter) {
    return next1;
  }
  // 非中心用2侧数据合并
  if (aspectRatio) {
    resetTopMultiAr(node, originComputedStyle, dy, clientRect, selectRect, next1);
  }
  else {
    const next2 = resizeTopMultiArOperate(node, originComputedStyle, dy, clientRect, selectRect, aspectRatio, fromCenter);
    Object.assign(next1, next2);
  }
  return next1;
}

function resetBottomMultiAr(node: Node, originComputedStyle: ComputedStyle, dy: number, clientRect: Rect, selectRect: Rect, next1: ResizeStyle) {
  const next2 = resizeBottomMultiArOperate(node, originComputedStyle, dy, clientRect, selectRect);
  delete next1.top;
  delete next1.height;
  delete next1.bottom;
  if (next2.top !== undefined) {
    next1.top = next2.top;
  }
  if (next2.height !== undefined) {
    next1.height = next2.height;
  }
  if (next2.bottom !== undefined) {
    next1.bottom = next2.bottom;
  }
}

export function resizeBottomLeftMultiArOperate(node: Node, originComputedStyle: ComputedStyle, dx: number, dy: number, clientRect: Rect, selectRect: Rect, aspectRatio = false, fromCenter = false) {
  // 中心反而简单了，就是选框中心点，选择任意一侧拉伸都可以
  const next1 = resizeLeftMultiArOperate(node, originComputedStyle, dx, clientRect, selectRect, aspectRatio, fromCenter);
  if (fromCenter) {
    return next1;
  }
  // 非中心用2侧数据合并
  if (aspectRatio) {
    resetBottomMultiAr(node, originComputedStyle, dy, clientRect, selectRect, next1);
  }
  else {
    const next2 = resizeBottomMultiArOperate(node, originComputedStyle, dy, clientRect, selectRect, aspectRatio, fromCenter);
    Object.assign(next1, next2);
  }
  return next1;
}

export function resizeBottomRightMultiArOperate(node: Node, originComputedStyle: ComputedStyle, dx: number, dy: number, clientRect: Rect, selectRect: Rect, aspectRatio = false, fromCenter = false) {
  // 中心反而简单了，就是选框中心点，选择任意一侧拉伸都可以
  const next1 = resizeRightMultiArOperate(node, originComputedStyle, dx, clientRect, selectRect, aspectRatio, fromCenter);
  if (fromCenter) {
    return next1;
  }
  // 非中心用2侧数据合并
  if (aspectRatio) {
    resetBottomMultiAr(node, originComputedStyle, dy, clientRect, selectRect, next1);
  }
  else {
    const next2 = resizeBottomMultiArOperate(node, originComputedStyle, dy, clientRect, selectRect, aspectRatio, fromCenter);
    Object.assign(next1, next2);
  }
  return next1;
}

export function move(node: Node, dx: number, dy: number) {
  const originStyle = node.getStyle();
  if (dx || dy) {
    node.updateStyle({
      translateX: node.computedStyle.translateX + dx,
      translateY: node.computedStyle.translateY + dy,
    });
    node.endPosChange(originStyle, dx, dy);
    node.checkPosSizeUpward();
  }
}

export function getBasicInfo(node: Node) {
  const list: Node[] = [node];
  const top = node.artBoard || node.page;
  if (node !== top) {
    let parent = node.parent;
    while (parent && parent !== top) {
      list.unshift(parent);
      parent = parent.parent;
    }
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
    isFlippedHorizontal: computedStyle.scaleX === -1,
    isFlippedVertical: computedStyle.scaleY === -1,
    rotation: computedStyle.rotateZ,
    opacity: computedStyle.opacity,
    mixBlendMode: computedStyle.mixBlendMode,
    constrainProportions: !!node.props.constrainProportions,
    matrix: m,
    isLine: false,
    length: 0,
    angle: 0,
    points: [] as Point[],
  };
  if (node instanceof Geom) {
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

export async function toPngBlob(node: Node) {
  if (node.isDestroyed) {
    return;
  }
  const root = node.root;
  if (node === root) {
    return new Promise((resolve, reject) => {
      if (!root.canvas) {
        return;
      }
      root.canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
        }
        else {
          reject();
        }
      });
    });
  }
  const bbox = node._filterBbox2 || node.filterBbox2;
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  const canvas2 = document.createElement('canvas');
  canvas2.width = width;
  canvas2.height = height;
  canvas2.style.position = 'fixed';
  canvas2.style.left = '100%';
  canvas2.style.top = '100%';
  document.body.appendChild(canvas2);
  const root2 = new Root({
    dpi: 1,
    uuid: '',
    index: 0,
    style: {
      width,
      height,
    },
  });
  root2.appendTo(canvas2);
  const clone = node.clone();
  clone.updateStyle({
    left: -bbox[0],
    top: -bbox[1],
    right: 'auto',
    bottom: 'auto',
    width: node.width,
    height: node.height,
    translateX: 0,
    translateY: 0,
  });
  root2.getCurPageWithCreate().appendChild(clone);
  return new Promise((resolve, reject) => {
    root2.on('REFRESH_COMPLETE', () => {
      canvas2.toBlob(blob => {
        if (blob) {
          resolve(blob);
        }
        else {
          reject();
        }
      });
    });
  });
}

export default {
  moveAppend,
  movePrepend,
  moveAfter,
  moveBefore,
  move,
  migrate,
  sortTempIndex,
  getWholeBoundingClientRect,
  resizeTopOperate,
  resizeBottomOperate,
  resizeLeftOperate,
  resizeRightOperate,
  resizeTop,
  resizeBottom,
  resizeLeft,
  resizeRight,
  resizeTopAspectRatioOperate,
  resizeBottomAspectRatioOperate,
  resizeLeftAspectRatioOperate,
  resizeRightAspectRatioOperate,
  resizeTopLeftAspectRatioOperate,
  resizeTopRightAspectRatioOperate,
  resizeBottomLeftAspectRatioOperate,
  resizeBottomRightAspectRatioOperate,
  resizeTopMultiArOperate,
  resizeBottomMultiArOperate,
  resizeRightMultiArOperate,
  resizeLeftMultiArOperate,
  resizeTopLeftMultiArOperate,
  resizeTopRightMultiArOperate,
  resizeBottomLeftMultiArOperate,
  resizeBottomRightMultiArOperate,
  getBasicInfo,
  toPngBlob,
};
