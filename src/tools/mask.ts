import Node from '../node/Node';
import Group from '../node/Group';
import { Props } from '../format';

export function useAsMask(nodes: Node[], isOutline = false, props?: Props) {
  if (!nodes.length) {
    return;
  }
  let res;
  if (nodes.length > 1) {
    res = Group.group(nodes, props);
  }
  nodes[0].updateStyle({
    maskMode: isOutline ? 'outline' : 'alpha',
  });
  return res;
}

export default {
  useAsMask,
};
