import Node from './Node';
import Container from './Container';
import { Props } from '../format';

class Group extends Container {
  constructor(name: string, props: Props, children: Array<Node>) {
    super(name, props, children);
    this.isGroup = true;
  }
}

export default Group;
