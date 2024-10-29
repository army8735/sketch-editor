import Root from '../node/Root';
import Node from '../node/Node';
import Group from '../node/Group';
import ArtBoard from '../node/ArtBoard';
import Geom from '../node/geom/Geom';
import ShapeGroup from '../node/geom/ShapeGroup';
import Container from '../node/Container';
import Text from '../node/Text';
import { isPolygonOverlapRect, pointInRect } from '../math/geom';
import { calRectPoints } from '../math/matrix';
import { VISIBILITY } from '../style/define';
import config from '../util/config';

function getTopShapeGroup(node: Geom | ShapeGroup) {
  const root = node.root;
  let res: ShapeGroup | undefined;
  let p = node.parent;
  while (p && p !== root) {
    if (p instanceof ShapeGroup) {
      res = p;
    }
    // 除了叶子节点可能是Geom，ShapeGroup嵌套时上层只可能是ShapeGroup，如果不是说明到Group了
    else {
      break;
    }
    p = p.parent;
  }
  return res;
}

function isArtBoardInFrame(x1: number, y1: number, x2: number, y2: number, n: Node) {
  const rect = n.getBoundingClientRect();
  if (x1 > x2) {
    [x1, x2] = [x2, x1];
  }
  if (y1 > y2) {
    [y1, y2] = [y2, y1];
  }
  return rect.left > x1 && rect.top > y1 && rect.right < x2 && rect.bottom < y2;
}

function getChildByPoint(parent: Container, x: number, y: number): Node | undefined {
  const children = parent.children;
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (child.props.isLocked || child.computedStyle.visibility === VISIBILITY.HIDDEN) {
      continue;
    }
    const { computedStyle, matrixWorld } = child;
    const rect = child._rect || child.rect;
    if (pointInRect(x, y, rect[0], rect[1], rect[2], rect[3], matrixWorld, true)) {
      if (child instanceof Container) {
        const res = getChildByPoint(child, x, y);
        if (res) {
          return res;
        }
        if (child instanceof ArtBoard) {
          return child;
        }
      }
      else if (computedStyle.pointerEvents) {
        return child;
      }
    }
  }
}

function getChildrenByFrame(parent: Container, x1: number, y1: number, x2: number, y2: number) {
  const children = parent.children;
  const res: Node[] = [];
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (child.props.isLocked || child.computedStyle.visibility === VISIBILITY.HIDDEN) {
      continue;
    }
    const { matrixWorld } = child;
    const rect = child._rect || child.rect;
    const box = calRectPoints(rect[0], rect[1], rect[2], rect[3], matrixWorld);
    if (isPolygonOverlapRect(x1, y1, x2, y2, [
      { x: box.x1, y: box.y1 },
      { x: box.x2, y: box.y2 },
      { x: box.x3, y: box.y3 },
      { x: box.x4, y: box.y4 },
    ])) {
      if (child instanceof Container) {
        const t = getChildrenByFrame(child, x1, y1, x2, y2);
        if (t.length) {
          res.push(...t);
        }
        else if (child.computedStyle.pointerEvents) {
          res.push(child);
        }
      }
      else if (child.computedStyle.pointerEvents) {
        res.push(child);
      }
    }
  }
  return res;
}

export function getNodeByPoint(root: Root, x: number, y: number, metaKey = false, selected: Node[] = [], isDbl = false) {
  if (root.isDestroyed) {
    return;
  }
  const page = root.lastPage;
  if (page) {
    const res = getChildByPoint(page, x, y);
    if (res) {
      // 按下metaKey，需返回最深的叶子节点，但不返回组，返回画板，同时如果是ShapeGroup的子节点需返回最上层ShapeGroup
      if (metaKey) {
        if (res instanceof Group) {
          let p = res.parent;
          while (p && p !== root) {
            if (p instanceof ArtBoard) {
              return p;
            }
            p = p.parent;
          }
          return;
        }
        // ShapeGroup可能嵌套ShapeGroup，需找到最上层的ShapeGroup返回
        else if (res instanceof Geom || res instanceof ShapeGroup) {
          let t = getTopShapeGroup(res);
          if (t) {
            return t;
          }
        }
        return res;
      }
      // 选不了组（组本身没内容，选中时肯定是组的空白区域），shapeGroup除外
      if (res instanceof Group && !(res instanceof ShapeGroup)) {
        return;
      }
      // 点击前没有已选节点时，是page下直接子节点，但如果是画板则还是下钻一级，除非空画板
      if (!selected.length) {
        let n = res;
        while (n && n.struct.lv > 3) {
          const p = n.parent!;
          if (p instanceof ArtBoard) {
            break;
          }
          n = p;
        }
        // 非空画板不能选
        // if (n instanceof ArtBoard && n.children.length) {
        //   return;
        // }
        return n;
      }
      // 双击下钻已选，一定有已选，遍历所有已选看激活的是哪个的儿子
      else if (isDbl) {
        let n = res;
        while (n.struct && n.struct.lv > 3) {
          for (let i = 0; i < selected.length; i++) {
            const o = selected[i];
            if (n.parent === o) {
              return n;
            }
            // 点的是已选叶子结点情况
            if (n === o && !(o instanceof Container)) {
              return n;
            }
          }
          const p = n.parent!;
          if (p instanceof ArtBoard) {
            break;
          }
          n = p;
        }
        return n;
      }
      /**
       * 当前激活的lv和已选的最大lv对比，不一致的话，将大的那个向上取parent，直到一致，
       * 此时如果2个互为兄弟，则成功返回，否则继续将2个同时向上取parent，继续循环判断兄弟关系，
       * 直到最上层page下直接子节点，但如果是画板则还是下钻一级，除非空画板
       * 先看已选自己或者它的兄弟，激活的是已选自己活兄弟最优先，
       * 没有则向上递归，看已选的父亲和其的兄弟，如此循环，
       * 没有则是page下直接子节点，但如果是画板则还是下钻一级，除非空画板
       */
      else {
        let n = res as Node;
        let sel = selected.slice(0);
        let lv = n.struct.lv;
        let max = lv;
        sel.forEach((item, i) => {
          // 如果已选比当前的深，向上调整已选为其parent直到lv平级
          if (item.struct.lv > lv) {
            while (item.struct.lv > lv) {
              item = item.parent as Node;
              sel[i] = item;
            }
          }
          // 否则记录下已选中最深的lv（一定比lv小或等于）
          else {
            max = Math.max(max, item.struct.lv);
          }
        });
        // 如果已选的都比lv大，说明当前的最深，调整到持平
        if (max < lv) {
          while (n.struct.lv > max) {
            n = n.parent as Node;
          }
        }
        while (n && n.struct.lv > 3) {
          for (let i = 0; i < sel.length; i++) {
            const o = sel[i];
            if (n.isSibling(o) || n === o) {
              return n;
            }
          }
          const p = n.parent!;
          if (p instanceof ArtBoard) {
            break;
          }
          n = p;
          sel.forEach((item, i) => {
            // 可能有多个已选，有的层级开始就比较小，需判断一下必须比当前的大才向上调整为parent
            if (item.struct.lv > n.struct.lv) {
              sel[i] = item.parent as Node;
            }
          });
        }
        // 非空画板不能选
        // if (n instanceof ArtBoard && n.children.length) {
        //   return;
        // }
        return n;
      }
    }
  }
}

export function getOverlayNodeByPoint(root: Root, x: number, y: number) {
  return getChildByPoint(root.overlay, x, y);
}

export function getOverlayArtBoardByPoint(root: Root, x: number, y: number) {
  const n = getOverlayNodeByPoint(root, x, y);
  if (n && n instanceof Text) {
    const artBoardList = root.overlay.artBoardList;
    for (let i = 0, len = artBoardList.length; i < len; i++) {
      const item = artBoardList[i];
      if (item.text === n) {
        return item.artBoard;
      }
    }
  }
}

export function getFrameNodes(root: Root, x1: number, y1: number, x2: number, y2: number, metaKey = false) {
  if (root.isDestroyed) {
    return [];
  }
  const page = root.lastPage;
  if (page) {
    const nodes = getChildrenByFrame(page, x1, y1, x2, y2);
    if (nodes.length) {
      const res: Node[] = [];
      // 先把矢量过滤成它属于的最上层的ShapeGroup
      for (let i = 0, len = nodes.length; i < len; i++) {
        const item = nodes[i];
        if (item instanceof Geom || item instanceof ShapeGroup) {
          let t = getTopShapeGroup(item);
          if (t) {
            if (res.indexOf(t) === -1) {
              res.push(t);
            }
          }
          else {
            res.push(item);
          }
        }
        else {
          res.push(item);
        }
      }
      // 按下metaKey，需返回最深的叶子节点，但不返回组、画板
      if (metaKey) {
        return res.filter(item => {
          if (item instanceof Group && !(item instanceof ShapeGroup)) {
            return false;
          }
          if (item instanceof ArtBoard) {
            return false;
          }
          return true;
        });
      }
      // 不按下metaKey，是page下直接子节点，忽略Group，如果是画板需要选取完全包含
      const res2: Node[] = [];
      outer:
      for (let i = 0, len = res.length; i < len; i++) {
        const item = res[i];
        if (item instanceof Group && !(item instanceof ShapeGroup)) {
          continue;
        }
        if (item instanceof ArtBoard) {
          if (isArtBoardInFrame(x1, y1, x2, y2, item)) {
            if (res2.indexOf(item) === -1) {
              res2.push(item);
            }
          }
          continue;
        }
        let n = item;
        while (n && n.struct.lv > 3) {
          const p = n.parent!;
          if (p instanceof ArtBoard) {
            if (isArtBoardInFrame(x1, y1, x2, y2, p)) {
              if (res2.indexOf(p) === -1) {
                res2.push(p);
              }
              continue outer;
            }
            else {
              break;
            }
          }
          n = p;
        }
        if (res2.indexOf(n) === -1) {
          res2.push(n);
        }
      }
      return res2;
    }
  }
  return [];
}

export type NodeGuide = {
  node: Node;
  n: number;
  r: GuideRect;
};

export type GuideRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  center: number;
  middle: number;
};

// 递归遍历，分别从x/y上看，根据config.guidesSnap距离内的不再继续下钻遍历
function scanGuides(node: Node, x: NodeGuide[], y: NodeGuide[], threshold: number, w: number, h: number, ignore?: Node[]) {
  const { left, right, top, bottom } = node.getBoundingClientRect();
  // 屏幕内才有效，否则可以忽略包含递归孩子
  if (left >= w || right <= 0 || top >= h || bottom <= 0) {
    return;
  }
  const center = (left + right) * 0.5;
  const middle = (top + bottom) * 0.5;
  const r = {
    left,
    right,
    top,
    bottom,
    center,
    middle,
  };
  // 6个值如果没有吸附冲突都加入
  const i1 = search2(left, x);
  if (i1 > -1
    && (!x[i1 - 1] || Math.abs(x[i1 - 1].n - left) >= threshold)
    && (!x[i1] || Math.abs(x[i1].n - left) >= threshold)) {
    x.splice(i1, 0, { node, n: left, r });
  }
  const i2 = search2(right, x);
  if (i2 > -1
    && (!x[i2 - 1] || Math.abs(x[i2 - 1].n - right) >= threshold)
    && (!x[i2] || Math.abs(x[i2].n - right) >= threshold)) {
    x.splice(i2, 0, { node, n: right, r });
  }
  const i3 = search2(center, x);
  if (i3 > -1
    && (!x[i3 - 1] || Math.abs(x[i3 - 1].n - center) >= threshold)
    && (!x[i3] || Math.abs(x[i3].n - center) >= threshold)) {
    x.splice(i3, 0, { node, n: center, r });
  }
  const i4 = search2(top, y);
  if (i4 > -1
    && (!y[i4 - 1] || Math.abs(y[i4 - 1].n - top) >= threshold)
    && (!y[i4] || Math.abs(y[i4].n - top) >= threshold)) {
    y.splice(i4, 0, { node, n: top, r });
  }
  const i5 = search2(bottom, y);
  if (i5 > -1
    && (!y[i5 - 1] || Math.abs(y[i5 - 1].n - bottom) >= threshold)
    && (!y[i5] || Math.abs(y[i5].n - bottom) >= threshold)) {
    y.splice(i5, 0, { node, n: bottom, r });
  }
  const i6 = search2(middle, y);
  if (i6 > -1
    && (!y[i6 - 1] || Math.abs(y[i6 - 1].n - middle) >= threshold)
    && (!y[i6] || Math.abs(y[i6].n - middle) >= threshold)) {
    y.splice(i6, 0, { node, n: middle, r });
  }
  if (node instanceof Group) {
    node.children.forEach((item) => {
      if (!ignore || !ignore.includes(item)) {
        scanGuides(item, x, y, threshold, w, h, ignore);
      }
    });
  }
}

export function search2(n: number, list: NodeGuide[]) {
  if (!list.length) {
    return 0;
  }
  if (n < list[0].n) {
    return 0;
  }
  const len = list.length;
  if (n > list[len - 1].n) {
    return len;
  }
  let i = 0;
  let j = len;
  while (i < j) {
    if (i === j - 1) {
      return j;
    }
    const mid = Math.round((i + j) * 0.5);
    if (n === list[mid].n) {
      return mid + 1;
    }
    else if (n > list[mid].n) {
      i = mid;
    }
    else {
      j = mid;
    }
  }
  return i;
}

export function getGuidesNodes(root: Root, ignore?: Node[]) {
  const res: { x: NodeGuide[], y: NodeGuide[] } = { x: [], y: [] };
  if (root.isDestroyed) {
    return res;
  }
  const page = root.lastPage;
  if (page) {
    const threshold = Math.max(0, config.guidesSnap * root.dpi);
    page.children.forEach((item) => {
      if (!ignore || !ignore.includes(item)) {
        scanGuides(item, res.x, res.y, threshold, root.width, root.height, ignore);
      }
    });
  }
  return res;
}

export default {
  getNodeByPoint,
  getOverlayNodeByPoint,
  getOverlayArtBoardByPoint,
  getFrameNodes,
  getGuidesNodes,
  search2,
};
