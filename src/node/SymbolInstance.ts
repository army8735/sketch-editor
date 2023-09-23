import { JNode, Override, SymbolInstanceProps, TAG_NAME } from '../format';
import SymbolMaster from './SymbolMaster';
import Group from './Group';

class SymbolInstance extends Group {
  symbolMaster: SymbolMaster;
  constructor(props: SymbolInstanceProps, symbolMaster: SymbolMaster) {
    const hash: Record<string, Override> = {};
    const overrideValues = props.overrideValues;
    overrideValues.forEach(item => {
      const [uuid, property] = item.name.split('_');
      hash[uuid] = {
        property,
        value: item.value,
      };
    });
    super(props, symbolMaster.children.map(item => item.clone(hash)));
    this.isSymbolInstance = true;
    this.symbolMaster = symbolMaster;
    this.symbolInstance = this;
    symbolMaster.addSymbolInstance(this);
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.SYMBOL_INSTANCE;
    return res;
  }
}

export default SymbolInstance;
