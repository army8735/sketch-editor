import * as uuid from 'uuid';
import { Props } from '../format';
import { calRectPoint } from '../math/matrix';
import { RefreshLevel } from '../refresh/level';
import { StyleUnit } from '../style/define';
import { migrate, sortTempIndex } from '../tools/node';
import Container from './Container';
import Node from './Node';

class Group extends Container {
  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.isGroup = true;
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
    this.resetTranslateX(left, right, width, translateX);
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
    this.resetTranslateY(top, bottom, height, translateY);
    // 影响matrix，这里不能用优化optimize计算，必须重新计算，因为最终值是left+translateX
    child.refreshLevel |= RefreshLevel.TRANSFORM;
    root.rl |= RefreshLevel.TRANSFORM;
    child.calMatrix(RefreshLevel.TRANSFORM);
    // 记得重置
    child._rect = undefined;
    child._bbox = undefined;
    child._filterBbox = undefined;
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
    this.checkTranslateHalf();
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
    const children = this.children.slice(0);
    for (let i = 0, len = children.length; i < len; i++) {
      const item = children[i];
      migrate(parent, zoom, item);
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
    sortTempIndex(nodes);
    const first = nodes[0];
    let prev = first.prev;
    while (prev && nodes.indexOf(prev) > -1) {
      prev = prev.prev;
    }
    let next = first.next;
    while (next && nodes.indexOf(next) > -1) {
      next = next.next;
    }
    const zoom = first.getZoom();
    const parent = first.parent!;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      migrate(parent, zoom, item);
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
    return group;
  }
}

export default Group;
