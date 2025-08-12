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
        const { parent, prev, next } = this.nodes[i];
        if (parent) {
          if (parent instanceof AbstractGroup) {
            parent.fixedPosAndSize = true;
          }
          // 必须先移除，因为复用children
          this.nodes[i].remove();
          if (prev) {
            prev.insertAfter(node);
          }
          else if (next) {
            next.insertBefore(node);
          }
          else {
            parent.appendChild(node);
          }
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
      const { parent, prev, next } = node;
      if (parent) {
        if (parent instanceof AbstractGroup) {
          parent.fixedPosAndSize = true;
        }
        // 必须先移除，因为复用children
        node.remove();
        if (prev) {
          prev.insertAfter(this.nodes[i]);
        }
        else if (next) {
          next.insertBefore(this.nodes[i]);
        }
        else {
          parent.appendChild(this.nodes[i]);
        }
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
