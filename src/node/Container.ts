import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { JContainer, JNode, Override, Props } from '../format';
import Node from '../node/Node';
import { RefreshLevel } from '../refresh/level';
import Tile from '../refresh/Tile';
import inject from '../util/inject';
import { isNil } from '../util/type';
import { LayoutData } from './layout';
import { calRectPoints } from '../math/matrix';
import { DISPLAY, FLEX_DIRECTION, StyleUnit } from '../style/define';

class Container<T extends Node = Node> extends Node {
  children: T[];

  constructor(props: Props, children: T[] = []) {
    super(props);
    this.children = children;
    const len = children.length;
    if (len) {
      const first = children[0];
      first.parent = this;
      let last = first;
      for (let i = 1; i < len; i++) {
        const child = children[i];
        child.parent = this;
        last.next = child;
        child.prev = last;
        last = child;
      }
    }
    this.isContainer = true;
  }

  // 添加到dom后isDestroyed状态以及设置父子兄弟关系，有点重复设置，一口气创建/移动一颗子树时需要
  override willMount() {
    super.willMount();
    const { children } = this;
    const len = children.length;
    if (len) {
      let setIndex = false;
      const first = children[0];
      first.parent = this;
      first.willMount();
      // 手写错误情况
      if (first.index <= 0 || first.index >= 1 || isNil(first.index)) {
        setIndex = true;
      }
      let last = first;
      for (let i = 1; i < len; i++) {
        const child = children[i];
        child.parent = this;
        // 手写情况可能会出现无index或错误index，需重设，转换的sketch/psd转换过程保证，一定是(0,1)之间
        if (child.index <= 0 || child.index <= last.index || child.index >= 1 || isNil(child.index)) {
          setIndex = true;
        }
        child.willMount();
        last.next = child;
        child.prev = last;
        last = child;
      }
      // 重设错误的index，全部重来
      if (setIndex) {
        for (let i = 0; i < len; i++) {
          const child = children[i];
          child.index = (i + 1) / (len + 1);
        }
      }
    }
  }

  // 冒泡的didMount，因为group尺寸、矢量点归一化都需要冒泡进行
  override didMount() {
    const { children } = this;
    const len = children.length;
    for (let i = 0; i < len; i++) {
      children[i].didMount();
    }
    super.didMount();
  }

  override willUnmount() {
    super.willUnmount();
    const { children } = this;
    const len = children.length;
    for (let i = 0; i < len; i++) {
      children[i].willUnmount();
    }
  }

  hasChildBox() {
    const { children } = this;
    const len = children.length;
    for (let i = 0; i < len; i++) {
      const child = children[i];
      if (child.style.display.v === DISPLAY.BOX) {
        return true;
      }
      if (child instanceof Container && child.hasChildBox()) {
        return true;
      }
    }
    return false;
  }

  protected resetLayH(data: LayoutData, w: number) {
    const { left, right, width, top, bottom, height } = this.style;
    if (left.u !== StyleUnit.AUTO) {
      let l = left.v;
      if (left.u === StyleUnit.PERCENT) {
        l = left.v * data.w * 0.01;
      }
      if (right.u === StyleUnit.PX) {
        right.v = data.w - w - l;
      }
      else if (right.u === StyleUnit.PERCENT) {
        right.v = (data.w - w - l) * 100 / data.w;
      }
      else if (width.u === StyleUnit.PX) {
        width.v = w;
      }
      else if (width.u === StyleUnit.PERCENT) {
        width.v = w * 100 / data.w;
      }
    }
    else if (right.u !== StyleUnit.AUTO) {
      if (width.u === StyleUnit.PX) {
        width.v = w;
      }
      else if (width.u === StyleUnit.PERCENT) {
        width.v = w * 100 / data.w;
      }
    }
  }

  protected resetLayV(data: LayoutData, h: number) {
    const { top, bottom, height } = this.style;
    if (top.u !== StyleUnit.AUTO) {
      let t = top.v;
      if (top.u === StyleUnit.PERCENT) {
        t = top.v * data.h * 0.01;
      }
      if (bottom.u === StyleUnit.PX) {
        bottom.v = data.h - h - t;
      }
      else if (bottom.u === StyleUnit.PERCENT) {
        bottom.v = (data.h - h - t) * 100 / data.h;
      }
      else if (height.u === StyleUnit.PX) {
        height.v = h;
      }
      else if (height.u === StyleUnit.PERCENT) {
        height.v = h * 100 / data.h;
      }
    }
    else if (bottom.u !== StyleUnit.AUTO) {
      if (height.u === StyleUnit.PX) {
        height.v = h;
      }
      else if (height.u === StyleUnit.PERCENT) {
        height.v = h * 100 / data.h;
      }
    }
  }

  override lay(data: LayoutData) {
    const { style, source } = this;
    if (source) {
      const { display, flexDirection } = style;
      if (!this.isMounted && display.v === DISPLAY.BOX) {
        const { width: w, height: h } = source;
        if (display.v === DISPLAY.BOX) {
          // 使用原有单位换算
          if (flexDirection.v === FLEX_DIRECTION.ROW) {
            this.resetLayH(data, w);
          }
          else if (flexDirection.v === FLEX_DIRECTION.COLUMN) {
            this.resetLayV(data, h);
          }
        }
      }
    }
    super.lay(data);
  }

  override layout(data: LayoutData) {
    super.layout(data);
    const { children } = this;
    // 递归下去布局
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layout({
        w: this.width,
        h: this.height,
      });
    }
    // 回溯收集minWidth/minHeight
    // for (let i = 0, len = children.length; i < len; i++) {
    //   const child = children[i];
    //   computedStyle.minWidth = this.minWidth = Math.max(
    //     this.minWidth,
    //     child.minWidth,
    //   );
    //   computedStyle.minHeight = this.minHeight = Math.max(
    //     this.minHeight,
    //     child.minHeight,
    //   );
    // }
  }

  // 父级组调整完后，直接子节点需跟着变更调整，之前数据都是相对于没调之前组的老的，位置和尺寸可能会同时发生变更
  adjustPosAndSizeChild(
    dx1: number,
    dy1: number,
    dx2: number,
    dy2: number,
  ) {
    const { children, root } = this;
    if (!root || (!dx1 && !dy1 && !dx2 && !dy2)) {
      return;
    }
    const gw = this.width;
    const gh = this.height;
    children.forEach(child => {
      const {
        style: {
          top,
          right,
          bottom,
          left,
        },
        computedStyle,
      } = child;
      // 如果向左拖发生了group的x变更，则dx为负数，子节点的left值增加，
      // 如果向右拖发生了group的width变更，则maxX比原本的width大，子节点的right值增加
      // 2个只要有发生，都会影响左右，因为干扰尺寸
      if (dx1 || dx2) {
        computedStyle.left += dx1;
        if (left.u === StyleUnit.PX) {
          left.v = computedStyle.left;
        }
        else if (left.u === StyleUnit.PERCENT && gw) {
          left.v = (computedStyle.left * 100) / gw;
        }
        computedStyle.right -= dx2;
        if (right.u === StyleUnit.PX) {
          right.v = computedStyle.right;
        }
        else if (right.u === StyleUnit.PERCENT && gw) {
          right.v = (computedStyle.right * 100) / gw;
        }
      }
      // 类似水平情况
      if (dy1 || dy2) {
        computedStyle.top += dy1;
        if (top.u === StyleUnit.PX) {
          top.v = computedStyle.top;
        }
        else if (top.u === StyleUnit.PERCENT && gh) {
          top.v = (computedStyle.top * 100) / gh;
        }
        computedStyle.bottom -= dy2;
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
      child._bbox2 = undefined;
      child._filterBbox = undefined;
      child._filterBbox2 = undefined;
      child.tempBbox = undefined;
    });
  }

  // 获取所有孩子相对于本父元素的盒子尺寸，再全集的极值
  getChildrenRect(ignore?: Node) {
    const { children } = this;
    const rect = {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    };
    let isMask = false;
    let first = true;
    // 注意要考虑mask和breakMask，被遮罩的都忽略
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const computedStyle = child.computedStyle;
      if (isMask && !computedStyle.breakMask) {
        continue;
      }
      if (computedStyle.maskMode) {
        isMask = true;
        // 遮罩跳过被遮罩节点
        let next = child.next;
        while (next && !next.computedStyle.breakMask) {
          i++;
          next = next.next;
        }
      }
      else if (computedStyle.breakMask) {
        isMask = false;
      }
      if (ignore === child) {
        continue;
      }
      const r = child._rect || child.rect;
      const { x1, y1, x2, y2, x3, y3, x4, y4 } = calRectPoints(r[0], r[1], r[2], r[3], child.matrix);
      const minX = Math.min(x1, x2, x3, x4);
      const minY = Math.min(y1, y2, y3, y4);
      const maxX = Math.max(x1, x2, x3, x4);
      const maxY = Math.max(y1, y2, y3, y4);
      if (first) {
        first = false;
        rect.minX = minX;
        rect.minY = minY;
        rect.maxX = maxX;
        rect.maxY = maxY;
      }
      else {
        rect.minX = Math.min(rect.minX, minX);
        rect.minY = Math.min(rect.minY, minY);
        rect.maxX = Math.max(rect.maxX, maxX);
        rect.maxY = Math.max(rect.maxY, maxY);
      }
    }
    return rect;
  }

  appendChild(node: T, cb?: (sync: boolean) => void) {
    node.remove();
    const { root, children } = this;
    const len = children.length;
    if (len) {
      const last = children[children.length - 1];
      last.next = node;
      node.prev = last;
      node.index = (last.index + 1) * 0.5;
    }
    else {
      node.index = 0.5;
    }
    node.parent = this;
    node.root = root;
    children.push(node);
    // 离屏情况，尚未添加到dom等
    if (!root || this.isDestroyed) {
      cb && cb(true);
      return;
    }
    node.willMount();
    this.insertStruct(node, len);
    root.addUpdate(node, [], RefreshLevel.REFLOW, true, false, cb);
  }

  prependChild(node: T, cb?: (sync: boolean) => void) {
    node.remove();
    const { root, children } = this;
    const len = children.length;
    if (len) {
      const first = children[0];
      first.next = node;
      node.prev = first;
      node.index = first.index * 0.5;
    }
    else {
      node.index = 0.5;
    }
    node.parent = this;
    node.root = root;
    children.push(node);
    // 离屏情况，尚未添加到dom等
    if (!root || this.isDestroyed) {
      cb && cb(true);
      return;
    }
    node.willMount();
    this.insertStruct(node, 0);
    root.addUpdate(node, [], RefreshLevel.REFLOW, true, false, cb);
  }

  removeChild(node: Node, cb?: (sync: boolean) => void) {
    if (node.parent === this) {
      node.remove(cb);
    }
    else {
      inject.error('Invalid parameter of removeChild()');
    }
  }

  clearChildren(cb?: (sync: boolean) => void) {
    const { root, children } = this;
    if (children.length) {
      if (this.isDestroyed) {
        children.splice(0);
        cb && cb(true);
        return;
      }
      // 特殊优化，不去一个个调用remove，整体删除后
      while (children.length) {
        const child = children.pop()!;
        this.deleteStruct(child);
        child.destroy();
      }
      root!.addUpdate(this, [], RefreshLevel.REFLOW, false, false, cb);
    }
  }

  // 这个无需覆盖，渲染时只有在tile内的有内容节点/merge节点会被加入
  // override addTile(tile: Tile) {
  //   super.addTile(tile);
  //   this.children.forEach(item => {
  //     item.addTile(tile);
  //   });
  // }

  override removeTile(tile: Tile) {
    super.removeTile(tile);
    this.children.forEach(item => {
      item.removeTile(tile);
    });
  }

  override cleanTile() {
    super.cleanTile();
    this.children.forEach(item => {
      item.cleanTile();
    });
  }

  override destroy() {
    const { isDestroyed, children } = this;
    if (isDestroyed) {
      return;
    }
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].destroy();
    }
    super.destroy();
  }

  override structure(lv: number) {
    let res = super.structure(lv);
    this.children.forEach((child) => {
      res = res.concat(child.structure(lv + 1));
    });
    res[0].num = this.children.length;
    res[0].total = res.length - 1;
    return res;
  }

  insertStruct(child: Node, childIndex: number) {
    const { struct, root } = this;
    const cs = child.structure(struct.lv + 1);
    const structs = root!.structs;
    let i;
    if (childIndex) {
      const s = this.children[childIndex - 1].struct;
      const total = s.total;
      i = structs.indexOf(s) + total + 1;
    }
    else {
      i = structs.indexOf(struct) + 1;
    }
    structs.splice(i, 0, ...cs);
    const total = cs[0].total + 1;
    struct.num++;
    struct.total += total;
    let p = this.parent;
    while (p) {
      p.struct.total += total;
      p = p.parent;
    }
  }

  deleteStruct(child: Node) {
    const cs = child.struct;
    const total = cs.total + 1;
    const root = this.root!,
      structs = root.structs;
    const i = structs.indexOf(cs);
    structs.splice(i, total);
    const struct = this.struct;
    struct.num--;
    struct.total -= total;
    let p = this.parent;
    while (p) {
      p.struct.total -= total;
      p = p.parent;
    }
  }

  override getStructs() {
    if (!this.root) {
      return [];
    }
    const structs = this.root.structs;
    const struct = this.struct;
    const i = structs.indexOf(struct);
    return structs.slice(i, i + struct.total + 1);
  }

  override clone(filter?: (node: Node) => boolean) {
    const props = this.cloneProps();
    const children = filter ? this.children.filter(filter) : this.children;
    const res = new Container(props, children.map(item => item.clone(filter)));
    return res;
  }

  override cloneAndLink(overrides?: Record<string, Override[]>) {
    const props = this.cloneProps();
    const res = new Container(props, this.children.map(item => item.cloneAndLink(overrides)));
    res.source = this;
    if (overrides) {}
    return res;
  }

  override toJson(): JNode {
    const res = super.toJson() as JContainer;
    res.children = this.children.map(item => item.toJson());
    return res;
  }

  override async toSketchJson(zip: JSZip, blobHash?: Record<string, string>) {
    const res = await super.toSketchJson(zip, blobHash);
    const { display, justifyContent, flexDirection } = this.computedStyle;
    if (display === DISPLAY.BOX) {
      // @ts-ignore
      res.groupLayout = {
        _class: SketchFormat.ClassValue.MSImmutableInferredGroupLayout,
        axis: flexDirection === FLEX_DIRECTION.COLUMN
          ? SketchFormat.InferredLayoutAxis.Vertical
          : SketchFormat.InferredLayoutAxis.Horizontal,
        layoutAnchor: [
          SketchFormat.InferredLayoutAnchor.Min,
          SketchFormat.InferredLayoutAnchor.Middle,
          SketchFormat.InferredLayoutAnchor.Max,
        ][justifyContent],
      };
    }
    return res;
  }
}

export default Container;
