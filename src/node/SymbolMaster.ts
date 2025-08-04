import { SymbolMasterProps, TAG_NAME } from '../format';
import AbstractFrame from './AbstractFrame';
import Node from './Node';
import SymbolInstance from './SymbolInstance';

class SymbolMaster extends AbstractFrame {
  symbolInstances: SymbolInstance[];

  constructor(props: SymbolMasterProps, children: Array<Node>) {
    super(props, children);
    this.isSymbolMaster = true;
    this.symbolInstances = [];
  }

  addSymbolInstance(item: SymbolInstance) {
    if (this.symbolInstances.indexOf(item) === -1) {
      this.symbolInstances.push(item);
    }
  }

  removeSymbolInstance(item: SymbolInstance) {
    const i = this.symbolInstances.indexOf(item);
    if (i > -1) {
      this.symbolInstances.splice(i, 1);
    }
  }

  override clone(filter?: (node: Node) => boolean) {
    const props = this.cloneProps() as SymbolMasterProps;
    const children = filter ? this.children.filter(filter) : this.children;
    const res = new SymbolMaster(props, children.map(item => item.clone(filter)));
    return res;
  }

  override toJson() {
    const res = super.toJson();
    res.tagName = TAG_NAME.SYMBOL_MASTER;
    return res;
  }
}

export default SymbolMaster;
