import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { JNode, Override, Props, TAG_NAME } from '../format';
import { RefreshLevel } from '../refresh/level';
import { StyleUnit } from '../style/define';
import { migrate, sortTempIndex } from '../tools/node';
import Container from './Container';
import Node from './Node';
import { clone } from '../util/type';

const EPS = 1e-2;

class Group extends Container {
  fixedPosAndSize: boolean;

  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isGroup = true;
    this.fixedPosAndSize = false;
  }

  override didMount() {
    super.didMount();
    // 冒泡过程无需向下检测，直接向上
    this.adjustPosAndSize();
  }

  // 父级组调整完后，直接子节点需跟着变更调整，之前数据都是相对于没调之前组的老的，位置和尺寸可能会同时发生变更
  private adjustPosAndSizeChild(
    child: Node,
    dx1: number,
    dy1: number,
    dx2: number,
    dy2: number,
    gw: number,
    gh: number,
  ) {
    const { style, computedStyle, root } = child;
    if (!root) {
      return;
    }
    const {
      top,
      right,
      bottom,
      left,
    } = style;
    // 如果向左拖发生了group的x变更，则dx为负数，子节点的left值增加，
    // 如果向右拖发生了group的width变更，则maxX比原本的width大，子节点的right值增加
    // 2个只要有发生，都会影响左右，因为干扰尺寸
    if (dx1 || dx2) {
      computedStyle.left -= dx1;
      if (left.u === StyleUnit.PX) {
        left.v = computedStyle.left;
      }
      else if (left.u === StyleUnit.PERCENT && gw) {
        left.v = (computedStyle.left * 100) / gw;
      }
      computedStyle.right += dx2;
      if (right.u === StyleUnit.PX) {
        right.v = computedStyle.right;
      }
      else if (right.u === StyleUnit.PERCENT && gw) {
        right.v = (computedStyle.right * 100) / gw;
      }
    }
    // 类似水平情况
    if (dy1 || dy2) {
      computedStyle.top -= dy1;
      if (top.u === StyleUnit.PX) {
        top.v = computedStyle.top;
      }
      else if (top.u === StyleUnit.PERCENT && gh) {
        top.v = (computedStyle.top * 100) / gh;
      }
      computedStyle.bottom += dy2;
      if (bottom.u === StyleUnit.PX) {
        bottom.v = computedStyle.bottom;
      }
      else if (bottom.u === StyleUnit.PERCENT && gh) {
        bottom.v = (computedStyle.bottom * 100) / gh;
      }
    }
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
  override adjustPosAndSize(rectC?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }) {
    if (this.fixedPosAndSize) {
      return false;
    }
    const { children } = this;
    if (!rectC) {
      rectC = this.getChildrenRect();
    }
    let { width, height } = this;
    const dx1 = rectC.minX,
      dy1 = rectC.minY,
      dx2 = rectC.maxX - width,
      dy2 = rectC.maxY - height;
    // 检查真正有变化，位置相对于自己原本位置为原点
    if (Math.abs(dx1) > EPS
      || Math.abs(dy1) > EPS
      || Math.abs(dx2) > EPS
      || Math.abs(dy2) > EPS) {
      // 先调整自己，之后尺寸更新用新wh
      this.adjustPosAndSizeSelf(dx1, dy1, dx2, dy2);
      width = this.width;
      height = this.height;
      // 再改孩子的，后面孩子计算要根据新的值，无需递归向下
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        this.adjustPosAndSizeChild(child, dx1, dy1, dx2, dy2, width, height);
      }
      return true;
    }
    return false;
  }

  // 添加一个节点后，可能新节点在原本bbox之外，组需要调整尺寸
  checkPosSizeSelf() {
    if (this.adjustPosAndSize()) {
      this.checkPosSizeUpward();
    }
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

  // override get rect() {
  //   let res = this._rect;
  //   if (!res) {
  //     res = this._rect = new Float64Array(4);
  //     getGroupRect(this, res);
  //   }
  //   return res;
  // }

  // 至少1个node进行编组，以第0个位置为基准
  static group(nodes: Node[], props?: Props) {
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

  static get EPS() {
    return EPS;
  }
}

export default Group;
