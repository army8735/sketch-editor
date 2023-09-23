import { JNode, SymbolMasterProps, TAG_NAME } from '../format';
import ArtBoard from './ArtBoard';
import Node from './Node';
import SymbolInstance from './SymbolInstance';

class SymbolMaster extends ArtBoard {
  symbolInstances: SymbolInstance[];
  constructor(props: SymbolMasterProps, children: Array<Node>) {
    super(props, children);
    this.isSymbolMaster = true;
    this.symbolMaster = this;
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

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.SYMBOL_MASTER;
    return res;
  }
}

export default SymbolMaster;
