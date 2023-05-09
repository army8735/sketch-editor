import Node from '../node/Node';
import Group from '../node/Group';
import { Props } from '../format';

export function useAsMask(nodes: Node[], props?: Props) {
  if (!nodes.length) {
    return;
  }
  let res;
  if (nodes.length > 1) {
    res = Group.group(nodes, props);
  }
  nodes[0].updateStyle({
    mask: true,
  });
  return res;
}

export default {
  useAsMask,
};
