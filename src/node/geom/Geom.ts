import Node from '../Node';
import { Props } from '../../format';

class Geom extends Node {
  constructor(props: Props) {
    super(props);
  }

  override calContent(): boolean {
    return true;
  }
}

export default Geom;
