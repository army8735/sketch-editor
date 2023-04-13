import Node from '../Node';
import { Props } from '../../format';

export interface Shape {
  points?: Array<Array<number>>,
}

class Geom extends Node implements Shape {
  points?: Array<Array<number>>;
  constructor(props: Props) {
    super(props);
  }

  override calContent(): boolean {
    return true;
  }
}

export default Geom;
