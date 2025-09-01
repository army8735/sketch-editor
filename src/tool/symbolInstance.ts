import * as uuid from 'uuid';
import Frame from '../node/Frame';
import Node from '../node/Node';
import SymbolInstance from '../node/SymbolInstance';
import AbstractGroup from '../node/AbstractGroup';
import Container from '../node/Container';

export function unBind(node: SymbolInstance) {
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
  }, node.children); // 复用children
  const { parent, prev, next } = node;
  // 默认就是替换，支持没有parent的手动调用情况
  if (parent) {
    if (parent instanceof AbstractGroup) {
      parent.fixedPosAndSize = true;
    }
    // 必须先移除，因为复用children
    node.remove();
    if (prev) {
      prev.insertAfter(frame);
    }
    else if (next) {
      next.insertBefore(frame);
    }
    else {
      parent.appendChild(frame);
    }
    if (parent instanceof AbstractGroup) {
      parent.fixedPosAndSize = false;
      // 尺寸无变化无需checkPosAndSize()
    }
  }
  return frame;
}

function recursion(node: Node) {
  if (node instanceof Container) {
    node.children.forEach(item => {
      recursion(item);
      if (item instanceof SymbolInstance) {
        unBind(item);
      }
    });
  }
}

export function unBindAll(node: SymbolInstance) {
  const frame = unBind(node);
  recursion(node);
  return frame;
}

export default {
  unBind,
  unBindAll,
};
