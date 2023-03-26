import Node from './Node';
import { Props } from '../format';
import Container from './Container';

class ArtBoard extends Container {
  constructor(name: string, props: Props, children: Array<Node>) {
    super(name, props, children);
  }
}

export default ArtBoard;
