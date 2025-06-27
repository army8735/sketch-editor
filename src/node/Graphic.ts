import AbstractFrame from './AbstractFrame';
import { Props } from '../format';
import Node from './Node';

class Graphic extends AbstractFrame {
  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isGraphic = true;
  }
}

export default Graphic;
