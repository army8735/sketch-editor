import * as uuid from 'uuid';
import { JContainer, JNode, Override, Props } from '../format';
import { isPolygonOverlapRect, pointInRect } from '../math/geom';
import Node from '../node/Node';
import { RefreshLevel } from '../refresh/level';
import { Struct } from '../refresh/struct';
import { ComputedStyle } from '../style/define';
import inject from '../util/inject';
import { clone } from '../util/util';
import { LayoutData } from './layout';
import { calRectPoints } from '../math/matrix';

class Container extends Node {
  children: Node[];

  constructor(props: Props, children: Node[] = []) {
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
      const first = children[0];
      first.parent = this;
      first.willMount();
      let last = first;
      for (let i = 1; i < len; i++) {
        const child = children[i];
        child.parent = this;
        child.willMount();
        last.next = child;
        child.prev = last;
        last = child;
      }
    }
  }

  // 冒泡的didMount
  override didMount() {
    const { children } = this;
    const len = children.length;
    for (let i = 0; i < len; i++) {
      children[i].didMount();
    }
    super.didMount();
  }

  override lay(data: LayoutData) {
    super.lay(data);
    const { children, computedStyle } = this;
    // 递归下去布局
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layout({
        x: 0,
        y: 0,
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

  appendChild(node: Node, cb?: (sync: boolean) => void) {
    node.remove();
    const { root, children } = this;
    const len = children.length;
    if (len) {
      const last = children[children.length - 1];
      last.next = node;
      node.prev = last;
    }
    node.parent = this;
    node.root = root;
    children.push(node);
    // 离屏情况，尚未添加到dom等
    if (this.isDestroyed) {
      cb && cb(true);
      return;
    }
    node.willMount();
    this.insertStruct(node, len);
    root!.addUpdate(node, [], RefreshLevel.REFLOW, true, false, (sync) => {
      if (!sync && node.page) {
        node.didMount();
      }
      cb && cb(sync);
    });
  }

  prependChild(node: Node, cb?: (sync: boolean) => void) {
    node.remove();
    const { root, children } = this;
    const len = children.length;
    if (len) {
      const first = children[0];
      first.next = node;
      node.prev = first;
    }
    node.parent = this;
    node.root = root;
    children.push(node);
    // 离屏情况，尚未添加到dom等
    if (this.isDestroyed) {
      cb && cb(true);
      return;
    }
    node.willMount();
    this.insertStruct(node, 0);
    root!.addUpdate(node, [], RefreshLevel.REFLOW, true, false, (sync) => {
      if (!sync && node.page) {
        node.didMount();
      }
      cb && cb(sync);
    });
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

  override structure(lv: number): Array<Struct> {
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

  getNodeByPoint(x: number, y: number): Node | undefined {
    const children = this.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      const { computedStyle, matrixWorld } = child;
      const rect = child._rect || child.rect;
      // 在内部且pointerEvents为true才返回
      if (pointInRect(x, y, rect[0], rect[1], rect[2], rect[3], matrixWorld, true)) {
        if (child instanceof Container) {
          const res = child.getNodeByPoint(x, y);
          if (res) {
            return res;
          }
          else if (child.isArtBoard) {
            return child;
          }
        }
        else if (computedStyle.pointerEvents) {
          return child;
        }
      }
    }
  }

  getNodesByFrame(x1: number, y1: number, x2: number, y2: number, isChild = false) {
    const children = this.children;
    const res: Node[] = [];
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const { computedStyle, matrixWorld } = child;
      const rect = child._rect || child.rect;
      const box = calRectPoints(rect[0], rect[1], rect[2], rect[3], matrixWorld);
      if (isPolygonOverlapRect(x1, y1, x2, y2, [
        { x: box.x1, y: box.y1 },
        { x: box.x2, y: box.y2 },
        { x: box.x3, y: box.y3 },
        { x: box.x4, y: box.y4 },
      ])) {
        if (isChild) {
          if (child instanceof Container) {
            const t = child.getNodesByFrame(x1, y1, x2, y2, isChild);
            if (t.length) {
            res.push(...t);
            }
          }
          else {
            res.push(child);
          }
        }
        else {
          res.push(child);
        }
      }
    }
    return res;
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

  override clone(override?: Record<string, Override>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    props.sourceUuid = this.props.uuid;
    const res = new Container(props, this.children.map(item => item.clone(override)));
    res.style = clone(this.style);
    res.computedStyle = clone(this.computedStyle);
    return res;
  }

  override toJson(): JNode {
    const res = super.toJson() as JContainer;
    res.children = this.children.map(item => item.toJson());
    return res;
  }
}

export default Container;
