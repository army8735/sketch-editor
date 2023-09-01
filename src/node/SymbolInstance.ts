import Node from './Node';
import { SymbolInstanceProps } from '../format';
import SymbolMaster from './SymbolMaster';

class SymbolInstance extends Node {
  symbolMaster?: SymbolMaster;
  constructor(props: SymbolInstanceProps) {
    super(props);
    this.isSymbolInstance = true;
  }

  override didMount() {
    super.didMount();
    const symbolMaster = this.symbolMaster = this.root?.symbolMasters[(this.props as SymbolInstanceProps).symbolId];
    if (symbolMaster) {
      symbolMaster.addSymbolInstance(this);
    }
  }
}

export default SymbolInstance;
