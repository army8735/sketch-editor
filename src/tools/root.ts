import Root from '../node/Root';
import Node from '../node/Node';
import Group from '../node/Group';
import ArtBoard from '../node/ArtBoard';
import Geom from '../node/geom/Geom';
import ShapeGroup from '../node/geom/ShapeGroup';
import Container from '../node/Container';

export function getNodeByPoint(root: Root, x: number, y: number, metaKey = false, selected: Node[] = [], isChild = false) {
  if (root.isDestroyed) {
    return;
  }
  const page = root.lastPage;
  if (page) {
    const res = page.getNodeByPoint(x, y);
    if (res) {
      // 按下metaKey，需返回最深的叶子节点，但不返回组，返回画板，同时如果是ShapeGroup的子节点需返回ShapeGroup
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
        else if (res instanceof Geom) {
          let p = res.parent;
          while (p && p !== root) {
            if (p instanceof ShapeGroup) {
              return p;
            }
            p = p.parent;
          }
        }
        return res;
      }
      // 没按metaKey选不了组和画板，shapeGroup除外
      if (res instanceof Container && !(res instanceof ShapeGroup)) {
        return;
      }
      // 点击前没有已选节点时，是page下直接子节点，但如果是画板则还是下钻一级，除非空画板
      if (!selected.length) {
        let n = res;
        while (n.struct && n.struct.lv > 3) {
          const p = n.parent!;
          if (p instanceof ArtBoard) {
            break;
          }
          n = p;
        }
        return n;
      }
      // 双击下钻已选，一定有已选，遍历所有已选看激活的是哪个的儿子
      else if (isChild) {
        let n = res;
        while (n.struct && n.struct.lv > 3) {
          for (let i = 0; i < selected.length; i++) {
            const o = selected[i];
            if (n.parent === o) {
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
        while (n.struct.lv > 3) {
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
        return n;
      }
    }
    // 没有节点还要检查artBoard的文字标题，在overlay上单独渲染
    const text = root.overlay.getNodeByPoint(x, y);
    if (text && text.isText) {
      const artBoardList = root.overlay.artBoardList;
      for (let i = 0, len = artBoardList.length; i < len; i++) {
        const item = artBoardList[i];
        if (item.text === text) {
          return item.artBoard;
        }
      }
    }
  }
}

export default {
  getNodeByPoint,
};
