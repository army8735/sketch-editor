import Node from './Node';
import { Props } from '../format';

class Text extends Node {
  constructor(name: string, props: Props) {
    super(name, props);
  }
}

export default Text;
