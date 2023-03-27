import Node from './Node';
import Container from './Container';
import { Props } from '../format';

class Group extends Container {
  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.isGroup = true;
  }
}

export default Group;
