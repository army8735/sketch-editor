import Node from './Node';
import { JNode, Props, TAG_NAME } from '../format';

class Slice extends Node {
  constructor(props: Props) {
    super(props);
    this.isSlice = true;
  }

  override calContent(): boolean {
    return this.hasContent = false;
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.SLICE;
    return res;
  }
}

export default Slice;
