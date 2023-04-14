import Node from '../Node';
import { Props } from '../../format';

class Geom extends Node {
  points?: Array<Array<number>>;
  constructor(props: Props) {
    super(props);
  }

  buildPoints() {
    this.points = [];
  }

  override calContent(): boolean {
    return this.hasContent = true;
  }
}

export default Geom;
