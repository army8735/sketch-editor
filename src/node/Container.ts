import Node from '../node/Node';
import { Props } from '../format';
import { RefreshLevel } from '../refresh/level';
import inject from '../util/inject';
import { Struct } from '../refresh/struct';
import { LayoutData } from './layout';
import { pointInRect } from '../math/geom';
import { StyleKey } from '../style';

class Container extends Node {
  children: Array<Node>;
  isGroup = false; // Group对象和Container基本一致，多了自适应尺寸和选择区别
  isArtBoard = false;

  constructor(props: Props, children: Array<Node>) {
    super(props);
    this.children = children;
  }

  didMount() {
    super.didMount();
    const { children } = this;
    const len = children.length;
    if (len) {
      const first = children[0];
      first.parent = this;
      first.didMount();
      let last = first;
      for (let i = 1; i < len; i++) {
        const child = children[i];
        child.parent = this;
        child.didMount();
        last.next = child;
        child.prev = last;
        last = child;
      }
    }
  }

  layout(container: Container, data: LayoutData) {
    if (this.isDestroyed) {
      return;
    }
    super.layout(container, data);
    const { children } = this;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layout(this, {
        x: this.x,
        y: this.y,
        w: this.width,
        h: this.height,
      });
    }
  }

  appendChild(node: Node, cb?: Function) {
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
    node.didMount();
    this.insertStruct(node, len);
    root!.addUpdate(node, [], RefreshLevel.REFLOW, true, false, false, undefined);
  }

  prependChild(node: Node, cb?: Function) {
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
    node.didMount();
    this.insertStruct(node, 0);
    root!.addUpdate(node, [], RefreshLevel.REFLOW, true, false, false, undefined);
  }

  removeChild(node: Node, cb?: Function) {
    if (node.parent === this) {
      node.remove(cb);
    }
    else {
      inject.error('Invalid parameter of removeChild()');
    }
  }

  destroy() {
    const { isDestroyed, children } = this;
    if (isDestroyed) {
      return;
    }
    for (let i = 0, len = children.length; i < len; i++) {
      children[i].destroy();
    }
    super.destroy();
  }

  structure(lv: number): Array<Struct> {
    let res = super.structure(lv);
    this.children.forEach(child => {
      res = res.concat(child.structure(lv + 1));
    });
    res[0].num = this.children.length;
    res[0].total = res.length - 1;
    return res;
  }

  insertStruct(child: Node, childIndex: number) {
    const { struct, root } = this;
    const cs = child.structure(struct!.lv + 1);
    const structs = root!.structs;
    let i;
    if (childIndex) {
      const s = this.children[childIndex - 1].struct!;
      const total = s.total;
      i = structs.indexOf(s) + total + 1;
    }
    else {
      i = structs.indexOf(struct!) + 1;
    }
    structs.splice(i, 0, ...cs);
    const total = cs[0].total + 1;
    struct!.num++;
    struct!.total += total;
    let p = this.parent;
    while (p) {
      p.struct!.total += total;
      p = p.parent;
    }
  }

  deleteStruct(child: Node) {
    const cs = child.struct;
    const total = cs.total + 1;
    const root = this.root!, structs = root.structs;
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

  // 获取指定位置节点，不包含Page/ArtBoard
  getNodeByPointAndLv(x: number, y: number, includeGroup: boolean, includeArtBoard: boolean,  lv?: number): Node | null {
    const children = this.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      const { struct, computedStyle, outerBbox, matrixWorld } = child;
      // 在内部且pointerEvents为true才返回
      if (pointInRect(x, y, outerBbox[0], outerBbox[1], outerBbox[2], outerBbox[3], matrixWorld)) {
        // 不指定lv则找最深处的child
        if (lv === undefined) {
          if (child instanceof Container) {
            const res = child.getNodeByPointAndLv(x, y, includeGroup, includeArtBoard, lv);
            if (res) {
              return res;
            }
          }
          if (computedStyle[StyleKey.POINTER_EVENTS]
            && (includeGroup || !(child instanceof Container && child.isGroup))
            && (includeArtBoard || !(child instanceof Container && child.isArtBoard))) {
            return child;
          }
        }
        // 指定判断lv是否相等
        else {
          if (struct.lv === lv) {
            if (computedStyle[StyleKey.POINTER_EVENTS]
              && (includeGroup || !(child instanceof Container && child.isGroup))
              && (includeArtBoard || !(child instanceof Container && child.isArtBoard))) {
              return child;
            }
          }
          // 父级且是container继续深入寻找
          else if (struct.lv < lv && child instanceof Container) {
            const res = child.getNodeByPointAndLv(x, y, includeGroup, includeArtBoard, lv);
            if (res) {
              return res;
            }
          }
        }
      }
    }
    return null;
  }
}

export default Container;
