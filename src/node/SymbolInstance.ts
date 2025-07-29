import * as uuid from 'uuid';
import { Override, SymbolInstanceProps, TAG_NAME } from '../format';
import SymbolMaster from './SymbolMaster';
import Group from './Group';
import { clone } from '../util/type';

class SymbolInstance extends Group {
  symbolMaster: SymbolMaster;
  scale: number;

  constructor(props: SymbolInstanceProps, symbolMaster: SymbolMaster) {
    const overrideValues = props.overrideValues || {};
    const children = symbolMaster.children.map(item => item.clone(overrideValues));
    super(props, children);
    this.isSymbolInstance = true;
    this.symbolMaster = symbolMaster;
    this.scale = props.scale || 1;
    symbolMaster.addSymbolInstance(this);
  }

  override willMount() {
    this.symbolInstance = this;
    super.willMount();
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
