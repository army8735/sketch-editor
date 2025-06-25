import Container from './Container';
import { Props } from '../format';
import Node from './Node';

class Graphic extends Container {
  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isGraphic = true;
  }
}

export default Graphic;
