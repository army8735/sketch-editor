import Root from './Root';
import Node from './Node';
import Group from './Group';

export function checkReflow(root: Root, node: Node, addDom: boolean, removeDom: boolean) {
  let parent = node.parent!;
  if (addDom) {
    node.layout({
      x: parent.x,
      y: parent.y,
      w: parent.width,
      h: parent.height,
    });
  }
  else if(removeDom) {
    node.destroy();
  }
  else {
    node.layout({
      x: parent.x,
      y: parent.y,
      w: parent.width,
      h: parent.height,
    });
  }
  // 向上检查group的影响，group一定是自适应尺寸需要调整的
  while (parent && parent !== root) {
    if (parent instanceof Group) {
      parent.checkFitPS();
      break; // TODO 是否递归
    }
    parent = parent.parent!;
  }
}
