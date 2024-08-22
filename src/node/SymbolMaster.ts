import * as uuid from 'uuid';
import { JNode, Override, SymbolMasterProps, TAG_NAME } from '../format';
import ArtBoard from './ArtBoard';
import Node from './Node';
import SymbolInstance from './SymbolInstance';
import { clone } from '../util/type';

class SymbolMaster extends ArtBoard {
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

  override clone(override?: Record<string, Override>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    props.sourceUuid = this.props.uuid;
    const res = new SymbolMaster(props, this.children.map(item => item.clone(override)));
    res.symbolInstances = [];
    res.style = clone(this.style);
    res.computedStyle = clone(this.computedStyle);
    return res;
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.SYMBOL_MASTER;
    return res;
  }
}

export default SymbolMaster;
