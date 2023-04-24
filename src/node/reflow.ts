import Root from './Root';
import Node from './Node';

export function checkReflow(root: Root, node: Node, addDom: boolean, removeDom: boolean) {
  const parent = node.parent!;
  if(removeDom) {
    node.destroy();
  }
  // add和普通修改共用
  else {
    node.layout({
      x: 0,
      y: 0,
      w: parent.width,
      h: parent.height,
    });
    node.clearCacheUpward(false);
  }
}
