import { SymbolMasterProps, TAG_NAME } from '../format';
import AbstractFrame from './AbstractFrame';
import Node from './Node';
import SymbolInstance from './SymbolInstance';

class SymbolMaster extends AbstractFrame {
  includeBackgroundColorInInstance: boolean;
  symbolInstances: SymbolInstance[];

  constructor(props: SymbolMasterProps, children: Array<Node>) {
    super(props, children);
    this.includeBackgroundColorInInstance = !!props.includeBackgroundColorInInstance;
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

  override cloneProps() {
    const props = super.cloneProps() as SymbolMasterProps;
    props.includeBackgroundColorInInstance = this.includeBackgroundColorInInstance;
    return props;
  }

  override clone(filter?: (node: Node) => boolean) {
    const props = this.cloneProps();
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
