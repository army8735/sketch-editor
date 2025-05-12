import Node from './Node';

export function checkReflow(node: Node, addDom: boolean, removeDom: boolean) {
  const parent = node.parent!;
  if (removeDom) {
    node.checkPosSizeUpward();
    node.clearCacheUpward(false);
    node.destroy();
  }
  // add和普通修改共用
  else {
    node.layout({
      w: parent.width,
      h: parent.height,
    });
    node.checkPosSizeUpward();
    node.clearCacheUpward(false);
  }
}

export default {
  checkReflow,
};
