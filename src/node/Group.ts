import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { JNode, Override, Props, TAG_NAME } from '../format';
import { calRectPoints } from '../math/matrix';
import { RefreshLevel } from '../refresh/level';
import { StyleUnit } from '../style/define';
import { migrate, sortTempIndex } from '../tools/node';
import Container from './Container';
import Node from './Node';
import { clone } from '../util/util';

const EPS = 1e-2;

class Group extends Container {
  fixedPosAndSize: boolean;
  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isGroup = true;
    this.fixedPosAndSize = false;
  }

  override didMountBubble() {
    super.didMountBubble();
    const rect = this.rect;
    const r = this.getChildrenRect(true);
    const w = r.maxX - r.minX, h = r.maxY - r.minY;
    if (Math.abs(r.minX) > EPS || Math.abs(r.minY) > EPS || Math.abs(w - rect[2]) > EPS || Math.abs(h - rect[3]) > EPS) {
      this.checkSizeChange();
    }
  }

  // 获取单个孩子相对于本父元素的盒子尺寸
  private getChildRect(child: Node) {
    const { width, height, matrix } = child;
    let { x1, y1, x2, y2, x3, y3, x4, y4 } = calRectPoints(
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
  private getChildrenRect(excludeMask = false) {
    const { children } = this;
    const rect = {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    };
    let isMask = false;
    // 注意要考虑mask和breakMask，被遮罩的都忽略
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const computedStyle = child.computedStyle;
      const { minX, minY, maxX, maxY } = this.getChildRect(child);
      if (isMask && !computedStyle.breakMask && excludeMask) {
        continue;
      }
      if (computedStyle.maskMode) {
        isMask = true;
      } else if (computedStyle.breakMask) {
        isMask = false;
      }
      if (i) {
        rect.minX = Math.min(rect.minX, minX);
        rect.minY = Math.min(rect.minY, minY);
        rect.maxX = Math.max(rect.maxX, maxX);
        rect.maxY = Math.max(rect.maxY, maxY);
      } else {
        rect.minX = minX;
        rect.minY = minY;
        rect.maxX = maxX;
        rect.maxY = maxY;
      }
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
      } else if (left.u === StyleUnit.PERCENT && gw) {
        left.v = (computedStyle.left * 100) / gw;
      }
      computedStyle.right += dw;
      if (right.u === StyleUnit.PX) {
        right.v = computedStyle.right;
      } else if (right.u === StyleUnit.PERCENT && gw) {
        right.v = (computedStyle.right * 100) / gw;
      }
    }
    this.resetTranslateX(left, right, width, translateX);
    // 类似水平情况
    if (dy || dh) {
      computedStyle.top -= dy;
      if (top.u === StyleUnit.PX) {
        top.v = computedStyle.top;
      } else if (top.u === StyleUnit.PERCENT && gh) {
        top.v = (computedStyle.top * 100) / gh;
      }
      computedStyle.bottom += dh;
      if (bottom.u === StyleUnit.PX) {
        bottom.v = computedStyle.bottom;
      } else if (bottom.u === StyleUnit.PERCENT && gh) {
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
    if (this.fixedPosAndSize) {
      return false;
    }
    const { children, width: gw, height: gh } = this;
    const rect = this.getChildrenRect(false);
    const dx = rect.minX,
      dy = rect.minY,
      dw = rect.maxX - gw,
      dh = rect.maxY - gh;
    // 检查真正有变化，位置相对于自己原本位置为原点
    if (Math.abs(dx) > EPS || Math.abs(dy) > EPS || Math.abs(dw) > EPS || Math.abs(dh) > EPS) {
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
    if (this.checkPosSizeDownward()) {
      this.checkPosSizeUpward();
    }
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
    const parent = this.parent!;
    if (parent instanceof Group) {
      parent.fixedPosAndSize = true;
    }
    let target = this as Node;
    const children = this.children.slice(0);
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
    this.remove();
  }

  override clone(override?: Record<string, Override>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    props.sourceUuid = this.props.uuid;
    const res = new Group(props, this.children.map(item => item.clone(override)));
    res.style = clone(this.style);
    res.computedStyle = clone(this.computedStyle);
    return res;
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.GROUP;
    return res;
  }

  override async toSketchJson(zip: JSZip, filter?: (node: Node) => boolean): Promise<SketchFormat.Group> {
    const json = await super.toSketchJson(zip) as SketchFormat.Group;
    json._class = SketchFormat.ClassValue.Group;
    json.hasClickThrough = false;
    const list = await Promise.all(this.children.filter(item => {
      if (filter) {
        return filter(item);
      }
      return true;
    }).map(item => {
      return item.toSketchJson(zip);
    }));
    json.layers = list.map(item => {
      return item as SketchFormat.Group |
        SketchFormat.Oval |
        SketchFormat.Polygon |
        SketchFormat.Rectangle |
        SketchFormat.ShapePath |
        SketchFormat.Star |
        SketchFormat.Triangle |
        SketchFormat.ShapeGroup |
        SketchFormat.Text |
        SketchFormat.SymbolInstance |
        SketchFormat.Slice |
        SketchFormat.Hotspot |
        SketchFormat.Bitmap;
    });
    return json;
  }

  // 至少1个node进行编组，以第0个位置为基准
  static group(nodes: Array<Node>, props?: Props) {
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
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      migrate(parent, item);
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
      props,
    );
    const group = new Group(p, []);
    group.fixedPosAndSize = true;
    // 插入到first的后面
    first.insertAfter(group);
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
}

export default Group;
