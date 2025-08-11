import * as uuid from 'uuid';
import Frame from '../node/Frame';
import SymbolInstance from '../node/SymbolInstance';
import AbstractGroup from '../node/AbstractGroup';

export function unBind(node: SymbolInstance) {
  const children = node.children.map(item => item.clone());
  const frame = new Frame({
    name: node.name,
    uuid: uuid.v4(),
    sourceUuid: node.uuid,
    nameIsFixed: node.nameIsFixed,
    constrainProportions: node.constrainProportions,
    isLocked: node.isLocked,
    isExpanded: node.isExpanded,
    index: node.index,
    style: node.getCssStyle(),
  }, children);
  const parent = node.parent;
  // 默认就是替换，支持没有parent的手动调用情况
  if (parent) {
    if (parent instanceof AbstractGroup) {
      parent.fixedPosAndSize = true;
    }
    node.insertAfter(frame);
    node.remove();
    if (parent instanceof AbstractGroup) {
      parent.fixedPosAndSize = false;
      // 尺寸无变化无需checkPosAndSize()
    }
  }
  return frame;
}

export default {
  unBind,
};
