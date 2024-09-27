import Node from '../node/Node';
import { Props } from '../format';
import group from './group';

export function useAsMask(nodes: Node[], isOutline = false) {
  if (!nodes.length) {
    return;
  }
  let res;
  if (nodes.length > 1) {
    res = group.group(nodes);
  }
  nodes[0].updateStyle({
    maskMode: isOutline ? 'outline' : 'alpha',
  });
  return res;
}

export default {
  useAsMask,
};
