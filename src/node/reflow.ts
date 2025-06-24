import Node from './Node';
import ShapeGroup from './geom/ShapeGroup';

export function checkReflow(node: Node, addDom: boolean, removeDom: boolean) {
  const parent = node.parent;
  // 向上清除ShapeGroup的coords/bbox
  let p = parent;
  while (p && p instanceof ShapeGroup) {
    p.clearCache(true);
    p.coords = undefined;
    p._rect = undefined;
    p._bbox = undefined;
    p._bbox2 = undefined;
    p._filterBbox = undefined;
    p._filterBbox2 = undefined;
    p = p.parent;
  }
  if (removeDom) {
    const mask = node.mask;
    node.checkPosSizeUpward();
    node.clearCacheUpward(false);
    node.destroy();
    // destroy后mask就没了，先拿到引用再清除
    if (mask) {
      mask.clearCache();
    }
  }
  // add和普通修改共用
  else {
    node.layout({
      w: parent!.width,
      h: parent!.height,
    });
    if (addDom) {
      node.didMount();
    }
    node.checkPosSizeUpward();
    node.clearCacheUpward(false);
  }
}

export default {
  checkReflow,
};
