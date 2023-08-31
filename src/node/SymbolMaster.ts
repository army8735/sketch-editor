import { ArtBoardProps } from '../format';
import ArtBoard from './ArtBoard';
import Node from './Node';

class SymbolMaster extends ArtBoard {
  constructor(props: ArtBoardProps, children: Array<Node>) {
    super(props, children);
    this.isSymbolMaster = true;
  }
}

export default SymbolMaster;
