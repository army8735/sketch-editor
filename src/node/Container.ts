import Node from '../node/Node';
import { Props } from '../format';
import { RefreshLevel } from '../refresh/level';
import inject from '../util/inject';
import { Struct } from '../refresh/struct';
import { LayoutData } from './layout';
import { pointInRect } from '../math/geom';
import { StyleKey } from '../style/define';

class Container extends Node {
  children: Array<Node>;
  isGroup = false; // Group对象和Container基本一致，多了自适应尺寸和选择区别
  isArtBoard = false;
  isPage = false;

  constructor(props: Props, children: Array<Node> = []) {
    super(props);
    this.children = children;
  }

  // 添加到dom后设置父子兄弟关系
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

  override layout(data: LayoutData) {
    if (this.isDestroyed) {
      return;
    }
    super.layout(data);
    const { children } = this;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      child.layout({
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

  clearChildren() {
    const children = this.children;
    while (children.length) {
      const child = children.pop()!;
      child.remove();
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
  getNodeByPointAndLv(x: number, y: number, includeGroup = false, includeArtBoard = false, lv?: number): Node | undefined {
    const children = this.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      const { struct, computedStyle, rect, matrixWorld } = child;
      // 在内部且pointerEvents为true才返回
      if (pointInRect(x, y, rect[0], rect[1], rect[2], rect[3], matrixWorld)) {
        // 不指定lv则找最深处的child
        if (lv === undefined) {
          if (child instanceof Container) {
            const res = child.getNodeByPointAndLv(x, y, includeGroup, includeArtBoard, lv);
            if (res) {
              return res;
            }
          }
          return this.getNodeCheck(child, computedStyle, includeGroup, includeArtBoard);
        }
        // 指定lv判断lv是否相等，超过不再递归下去
        else {
          if (struct.lv === lv) {
            return this.getNodeCheck(child, computedStyle, includeGroup, includeArtBoard);
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
  }

  // 必须是pointerEvents不被忽略前提，然后看group和artBoard选项
  private getNodeCheck(child: Node, computedStyle: Array<any>, includeGroup: boolean, includeArtBoard: boolean): Node | undefined {
    if (computedStyle[StyleKey.POINTER_EVENTS]
      && (includeGroup || !(child instanceof Container && child.isGroup))
      && (includeArtBoard || !(child instanceof Container && child.isArtBoard))) {
      return child;
    }
  }
}

export default Container;
