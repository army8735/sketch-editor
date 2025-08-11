import AbstractCommand from './AbstractCommand';
import { unBind } from '../tool/symbolInstance';
import Node from '../node/Node';
import SymbolInstance from '../node/SymbolInstance';
import AbstractGroup from '../node/AbstractGroup';

export type UnBindData = {
  node: Node;
};

class UnBindCommand extends AbstractCommand {
  data: UnBindData[];

  constructor(nodes: SymbolInstance[], data: UnBindData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    // 首次操作产生新的节点，后续复用
    if (this.data.length) {
      this.data.forEach((item, i) => {
        const node = item.node;
        const parent = this.nodes[i].parent;
        if (parent) {
          if (parent instanceof AbstractGroup) {
            parent.fixedPosAndSize = true;
          }
          this.nodes[i].insertAfter(node);
          this.nodes[i].remove();
          if (parent instanceof AbstractGroup) {
            parent.fixedPosAndSize = false;
            // 尺寸无变化无需checkPosAndSize()
          }
        }
        else {
          throw new Error('Unknown parent in UnBindCommand redo');
        }
      });
    }
    else {
      this.data = UnBindCommand.operate(this.nodes as SymbolInstance[]).map(item => {
        return {
          node: item,
        };
      });
    }
  }

  undo() {
    this.data.forEach((item, i) => {
      const node = item.node;
      const parent = node.parent;
      if (parent) {
        if (parent instanceof AbstractGroup) {
          parent.fixedPosAndSize = true;
        }
        node.insertAfter(this.nodes[i]);
        node.remove();
        if (parent instanceof AbstractGroup) {
          parent.fixedPosAndSize = false;
          // 尺寸无变化无需checkPosAndSize()
        }
      }
      else {
        throw new Error('Unknown parent in UnBindCommand undo');
      }
    });
  }

  static operate(nodes: SymbolInstance[]) {
    return nodes.map(item => {
      return unBind(item);
    });
  }
}

export default UnBindCommand;
