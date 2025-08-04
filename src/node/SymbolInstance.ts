import { SymbolInstanceProps, TAG_NAME } from '../format';
import SymbolMaster from './SymbolMaster';
import AbstractGroup from './AbstractGroup';
import Node from './Node';

class SymbolInstance extends AbstractGroup {
  symbolMaster: SymbolMaster;
  scale: number;

  constructor(props: SymbolInstanceProps, symbolMaster: SymbolMaster) {
    const overrideValues = props.overrideValues || {};
    const children = symbolMaster.children.map(item => item.cloneAndLink(overrideValues));
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

  // 特殊，使用同一个sm，没法filter，因为禁止修改
  override clone(filter?: (node: Node) => boolean) {
    const props = this.cloneProps() as SymbolInstanceProps;
    const res = new SymbolInstance(props, this.symbolMaster);
    return res;
  }

  override toJson() {
    const res = super.toJson();
    res.tagName = TAG_NAME.SYMBOL_INSTANCE;
    return res;
  }
}

export default SymbolInstance;
