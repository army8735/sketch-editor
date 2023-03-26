import Root from './Root';
import Node from './Node';
import Group from './Group';

export function checkReflow(root: Root, node: Node, addDom: boolean, removeDom: boolean) {
  let parent = node.parent!;
  if (addDom) {
    node.layout(parent, parent.layoutData!);
  }
  else if(removeDom) {
    node.destroy();
  }
  // 最上层的group检查影响
  if (parent instanceof Group) {
    while (parent && parent !== root && (parent instanceof Group)) {
      parent = parent.parent!;
    }
  }
}
