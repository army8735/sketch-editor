import { SymbolMasterProps } from '../format';
import ArtBoard from './ArtBoard';
import Node from './Node';

class SymbolMaster extends ArtBoard {
  constructor(props: SymbolMasterProps, children: Array<Node>) {
    super(props, children);
    this.isSymbolMaster = true;
  }
}

export default SymbolMaster;
