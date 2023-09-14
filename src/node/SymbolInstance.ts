import { Override, SymbolInstanceProps } from '../format';
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
}

export default SymbolInstance;
