import * as uuid from 'uuid';
import { JNode, Override, SymbolInstanceProps, TAG_NAME } from '../format';
import SymbolMaster from './SymbolMaster';
import Group from './Group';
import { clone } from '../util/type';

class SymbolInstance extends Group {
  symbolMaster: SymbolMaster;

  constructor(props: SymbolInstanceProps, symbolMaster: SymbolMaster) {
    const overrideValues = props.overrideValues || {};
    super(props, symbolMaster.children.map(item => item.clone(overrideValues)));
    this.isSymbolInstance = true;
    this.symbolMaster = symbolMaster;
    this.symbolInstance = this;
    symbolMaster.addSymbolInstance(this);
  }

  override clone(override?: Record<string, Override[]>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    props.sourceUuid = this.uuid;
    const sm = this.symbolMaster.clone(override);
    const res = new SymbolInstance(props, sm);
    sm.addSymbolInstance(res);
    res.style = clone(this.style);
    res.computedStyle = clone(this.computedStyle);
    return res;
  }

  override toJson() {
    const res = super.toJson();
    res.tagName = TAG_NAME.SYMBOL_INSTANCE;
    return res;
  }
}

export default SymbolInstance;
