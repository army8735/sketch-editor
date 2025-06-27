import AbstractFrame from './AbstractFrame';
import { Props } from '../format';
import Node from './Node';

class Frame extends AbstractFrame {
  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isFrame = true;
  }
}

export default Frame;
