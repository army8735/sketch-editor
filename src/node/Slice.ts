import Node from './Node';
import { Props } from '../format';

class Slice extends Node {
  constructor(props: Props) {
    super(props);
    this.isSlice = true;
  }

  override calContent(): boolean {
    return this.hasContent = false;
  }
}

export default Slice;
