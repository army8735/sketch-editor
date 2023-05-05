import * as uuid from 'uuid';
import { Props } from '../format';
import { calRectPoint } from '../math/matrix';
import { RefreshLevel } from '../refresh/level';
import { Struct } from '../refresh/struct';
import { calSize } from '../style/css';
import { StyleUnit } from '../style/define';
import Container from './Container';
import Node from './Node';

class Group extends Container {
  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.isGroup = true;
  }

  // 覆盖实现，有最小尺寸约束，更新要预防
  override updateStyle(style: any, cb?: (sync: boolean) => void) {
    const { keys, formatStyle } = this.updateStyleData(style);
    // 最小尺寸约束
    const parent = this.parent!;
    const computedStyle = this.computedStyle;
    // 组只能调左/右，不能同时左右
    if (style.hasOwnProperty('left')) {
      const left = calSize(formatStyle.left, parent.width);
      const w = parent.width - computedStyle.right - left;
      if (w < this.minWidth) {
        if (formatStyle.left.u === StyleUnit.PX) {
        } else if (formatStyle.left.u === StyleUnit.PERCENT) {
          const max =
            ((parent.width - computedStyle.right - this.minWidth) * 100) /
            parent.width;
          // 限制导致的无效更新去除
          if (formatStyle.left.v === max) {
            let i = keys.indexOf('left');
            keys.splice(i, 1);
          } else {
            formatStyle.left.v = this.style.left.v = max;
          }
        }
      }
    } else if (style.hasOwnProperty('right')) {
      const right = calSize(formatStyle.right, parent.width);
      const w = parent.width - computedStyle.left - right;
      if (w < this.minWidth) {
        if (formatStyle.right.u === StyleUnit.PX) {
        } else if (formatStyle.right.u === StyleUnit.PERCENT) {
          const max =
            ((parent.width - computedStyle.left - this.minWidth) * 100) /
            parent.width;
          // 限制导致的无效更新去除
          if (formatStyle.right.v === max) {
            let i = keys.indexOf('right');
            keys.splice(i, 1);
          } else {
            formatStyle.right.v = this.style.right.v = max;
          }
        }
      }
    }
    if (style.hasOwnProperty('top')) {
      const top = calSize(formatStyle.top, parent.height);
      const h = parent.height - computedStyle.bottom - top;
      if (h < this.minHeight) {
        if (formatStyle.top.u === StyleUnit.PX) {
        } else if (formatStyle.top.u === StyleUnit.PERCENT) {
          const max =
            ((parent.height - computedStyle.bottom - this.minHeight) * 100) /
            parent.height;
          // 限制导致的无效更新去除
          if (formatStyle.top.v === max) {
            let i = keys.indexOf('top');
            keys.splice(i, 1);
          } else {
            formatStyle.top.v = this.style.top.v = max;
          }
        }
      }
    } else if (style.hasOwnProperty('bottom')) {
      const bottom = calSize(formatStyle.bottom, parent.height);
      const h = parent.height - computedStyle.top - bottom;
      if (h < this.minHeight) {
        if (formatStyle.bottom.u === StyleUnit.PX) {
        } else if (formatStyle.bottom.u === StyleUnit.PERCENT) {
          const max =
            ((parent.height - computedStyle.top - this.minHeight) * 100) /
            parent.height;
          // 限制导致的无效更新去除
          if (formatStyle.bottom.v === max) {
            let i = keys.indexOf('bottom');
            keys.splice(i, 1);
          } else {
            formatStyle.bottom.v = this.style.bottom.v = max;
          }
        }
      }
    }
    // 再次检测可能因为尺寸限制造成的style更新无效，即限制后和当前一样
    if (this.updateStyleCheck(keys)) {
      cb && cb(true);
      return;
    }
    this.root!.addUpdate(this, keys, undefined, false, false, cb);
  }

  // 获取单个孩子相对于本父元素的盒子尺寸
  private getChildRect(child: Node) {
    const { width, height, matrix } = child;
    let { x1, y1, x2, y2, x3, y3, x4, y4 } = calRectPoint(
      0,
      0,
      width,
      height,
      matrix,
    );
    return {
      minX: Math.min(x1, x2, x3, x4),
      minY: Math.min(y1, y2, y3, y4),
      maxX: Math.max(x1, x2, x3, x4),
      maxY: Math.max(y1, y2, y3, y4),
    };
  }

  // 获取所有孩子相对于本父元素的盒子尺寸，再全集的极值
  private getChildrenRect() {
    const { width: gw, height: gh, children } = this;
    let rect = children.length
      ? this.getChildRect(children[0])
      : {
        minX: 0,
        minY: 0,
        maxX: gw,
        maxY: gh,
      };
    for (let i = 1, len = children.length; i < len; i++) {
      const child = children[i];
      const { minX, minY, maxX, maxY } = this.getChildRect(child);
      rect.minX = Math.min(rect.minX, minX);
      rect.minY = Math.min(rect.minY, minY);
      rect.maxX = Math.max(rect.maxX, maxX);
      rect.maxY = Math.max(rect.maxY, maxY);
    }
    return rect;
  }

  // 子节点变更导致的父组适配，无视固定尺寸设置调整，调整后的数据才是新固定尺寸
  private adjustPosAndSizeSelf(dx: number, dy: number, dw: number, dh: number) {
    const { style, computedStyle, parent, root } = this;
    if (!parent || !root) {
      return;
    }
    const { width: pw, height: ph } = parent;
    const { top, right, bottom, left, width, height, translateX, translateY } =
      style;
    // 水平调整统一处理，固定此时无效
    if (dx) {
      if (left.u === StyleUnit.PX) {
        left.v += dx;
      } else if (left.u === StyleUnit.PERCENT) {
        left.v += (dx * 100) / pw;
      }
      computedStyle.left += dx;
    }
    if (dw) {
      if (right.u === StyleUnit.PX) {
        right.v -= dw;
      } else if (right.u === StyleUnit.PERCENT) {
        right.v -= (dw * 100) / pw;
      }
      computedStyle.right -= dw;
    }
    this.width = computedStyle.width =
      parent.width - computedStyle.left - computedStyle.right;
    // translateX调整根据是否固定尺寸，不会有%尺寸目前
    this.resetTranslateX(left, width, translateX);
    // 垂直和水平一样
    if (dy) {
      if (top.u === StyleUnit.PX) {
        top.v += dy;
      } else if (top.u === StyleUnit.PERCENT) {
        top.v += (dy * 100) / ph;
      }
      computedStyle.top += dy;
    }
    if (dh) {
      if (bottom.u === StyleUnit.PX) {
        bottom.v -= dh;
      } else if (bottom.u === StyleUnit.PERCENT) {
        bottom.v -= (dh * 100) / ph;
      }
      computedStyle.bottom -= dh;
    }
    this.height = computedStyle.height =
      parent.height - computedStyle.top - computedStyle.bottom;
    this.resetTranslateY(top, height, translateY);
    // 影响matrix，这里不能用优化optimize计算，必须重新计算，因为最终值是left+translateX
    this.refreshLevel |= RefreshLevel.TRANSFORM;
    root.rl |= RefreshLevel.TRANSFORM;
    this.calMatrix(RefreshLevel.TRANSFORM);
    // 记得重置
    this._rect = undefined;
    this._bbox = undefined;
    this.tempBbox = undefined;
  }

  // 父级组调整完后，直接子节点需跟着变更调整，之前数据都是相对于没调之前组的老的，位置和尺寸可能会同时发生变更
  private adjustPosAndSizeChild(
    child: Node,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    gw: number,
    gh: number,
  ) {
    const { style, computedStyle, root } = child;
    if (!root) {
      return;
    }
    const { top, right, bottom, left, width, height, translateX, translateY } =
      style;
    // 如果向左拖发生了group的x变更，则dx为负数，子节点的left值增加，
    // 如果向右拖发生了group的width变更，则maxX比原本的width大，子节点的right值增加
    // 2个只要有发生，都会影响左右，因为干扰尺寸
    if (dx || dw) {
      computedStyle.left -= dx;
      if (left.u === StyleUnit.PX) {
        left.v = computedStyle.left;
      } else if (left.u === StyleUnit.PERCENT) {
        left.v = (computedStyle.left * 100) / gw;
      }
      computedStyle.right += dw;
      if (right.u === StyleUnit.PX) {
        right.v = computedStyle.right;
      } else if (right.u === StyleUnit.PERCENT) {
        right.v = (computedStyle.right * 100) / gw;
      }
    }
    this.resetTranslateX(left, width, translateX);
    // 类似水平情况
    if (dy || dh) {
      computedStyle.top -= dy;
      if (top.u === StyleUnit.PX) {
        top.v = computedStyle.top;
      } else if (top.u === StyleUnit.PERCENT) {
        top.v = (computedStyle.top * 100) / gh;
      }
      computedStyle.bottom += dh;
      if (bottom.u === StyleUnit.PX) {
        bottom.v = computedStyle.bottom;
      } else if (bottom.u === StyleUnit.PERCENT) {
        bottom.v = (computedStyle.bottom * 100) / gh;
      }
    }
    this.resetTranslateY(top, height, translateY);
    // 影响matrix，这里不能用优化optimize计算，必须重新计算，因为最终值是left+translateX
    child.refreshLevel |= RefreshLevel.TRANSFORM;
    root.rl |= RefreshLevel.TRANSFORM;
    child.calMatrix(RefreshLevel.TRANSFORM);
    // 记得重置
    child._rect = undefined;
    child._bbox = undefined;
    child.tempBbox = undefined;
  }

  // 根据新的盒子尺寸调整自己和直接孩子的定位尺寸，有调整返回true
  override adjustPosAndSize() {
    const { children, width: gw, height: gh } = this;
    const rect = this.getChildrenRect();
    const dx = rect.minX,
      dy = rect.minY,
      dw = rect.maxX - gw,
      dh = rect.maxY - gh;
    // 检查真正有变化，位置相对于自己原本位置为原点
    if (dx || dy || dw || dh) {
      // 先调整自己，之后尺寸更新用新wh
      this.adjustPosAndSizeSelf(dx, dy, dw, dh);
      const { width: gw, height: gh } = this;
      // 再改孩子的，后面孩子计算要根据新的值，无需递归向下
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        this.adjustPosAndSizeChild(child, dx, dy, dw, dh, gw, gh);
      }
      return true;
    }
    return false;
  }

  /**
   * 组调整尺寸reflow后，先递归看子节点，可能会变更如left百分比等数据，需重新计算更新，
   * 这个递归是深度递归回溯，先叶子节点的变化及对其父元素的影响，然后慢慢向上到引发检测的组，
   * 然后再向上看，和位置变化一样，自身的改变向上递归影响父级组的尺寸位置。
   */
  override checkSizeChange() {
    super.checkSizeChange();
    this.checkPosSizeDownward();
    this.checkPosSizeUpward();
  }

  private checkPosSizeDownward() {
    const { children } = this;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      if (child instanceof Group) {
        child.checkPosSizeDownward();
      }
    }
    return this.adjustPosAndSize();
  }

  unGroup() {
    if (this.isDestroyed) {
      throw new Error('Can not unGroup a destroyed Node');
    }
    const prev = this.prev;
    const next = this.next;
    const zoom = this.getZoom();
    const parent = this.parent!;
    const width = parent.width;
    const height = parent.height;
    const rect = parent.getBoundingClientRect();
    const x = rect.left / zoom;
    const y = rect.top / zoom;
    const children = this.children.slice(0);
    for (let i = 0, len = children.length; i < len; i++) {
      const item = children[i];
      checkGroup(x, y, width, height, zoom, item);
      // 插入到group的原本位置，有prev/next优先使用定位
      if (prev) {
        prev.insertAfter(item);
      } else if (next) {
        next.insertBefore(item);
      }
      // 没有prev/next则parent原本只有一个节点
      else {
        parent.appendChild(item);
      }
    }
    this.remove();
  }

  // 至少1个node进行编组，以第0个位置为基准
  static group(nodes: Array<Node>, props?: Props) {
    if (!nodes.length) {
      return;
    }
    let structs: Array<Struct>;
    // 按照先根遍历顺序排列这些节点，最先的是编组位置参照
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      if (item.isDestroyed) {
        throw new Error('Can not group a destroyed Node');
      }
      if (!i) {
        structs = item.root!.structs;
      }
      item.tempIndex = structs!.indexOf(item.struct);
    }
    nodes.sort((a, b) => {
      return a.tempIndex - b.tempIndex;
    });
    const first = nodes[0];
    const prev = first.prev;
    const next = first.next;
    const zoom = first.getZoom();
    const parent = first.parent!;
    const width = parent.width;
    const height = parent.height;
    const rect = parent.getBoundingClientRect();
    const x = rect.left / zoom;
    const y = rect.top / zoom;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      checkGroup(x, y, width, height, zoom, item);
    }
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
      props,
    );
    const group = new Group(p, nodes);
    // 插入到first的原本位置，有prev/next优先使用定位
    if (prev) {
      prev.insertAfter(group);
    } else if (next) {
      next.insertBefore(group);
    }
    // 没有prev/next则parent原本只有一个节点
    else {
      parent.appendChild(group);
    }
    group.checkSizeChange();
  }
}

function checkGroup(
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  node: Node,
) {
  const r = node.getBoundingClientRect();
  const x1 = r.left / zoom;
  const y1 = r.top / zoom;
  node.remove();
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

export default Group;
