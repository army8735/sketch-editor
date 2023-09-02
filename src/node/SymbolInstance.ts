import { SymbolInstanceProps } from '../format';
import SymbolMaster from './SymbolMaster';
import Group from './Group';

class SymbolInstance extends Group {
  symbolMaster: SymbolMaster;
  constructor(props: SymbolInstanceProps, symbolMaster: SymbolMaster) {
    super(props, symbolMaster.children.map(item => item.clone()));
    this.isSymbolInstance = true;
    this.symbolMaster = symbolMaster;
    this.symbolInstance = this;
    symbolMaster.addSymbolInstance(this);
  }
}

export default SymbolInstance;
