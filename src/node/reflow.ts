import Root from './Root';
import Node from './Node';

export function checkReflow(root: Root, node: Node, addDom: boolean, removeDom: boolean) {
  const parent = node.parent!;
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
}
