import Container from './Container';
import { Props } from '../format';
import Node from './Node';

class Frame extends Container {
  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isFrame = true;
  }
}

export default Frame;
