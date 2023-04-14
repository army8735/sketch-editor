import Node from '../Node';
import { Props } from '../../format';

export interface Shape {
  points?: Array<Array<number>>,
  buildPoints: Function,
}

class Geom extends Node implements Shape {
  points?: Array<Array<number>>;
  constructor(props: Props) {
    super(props);
  }

  buildPoints(): Array<Array<number>> {
    return [];
  }

  override calContent(): boolean {
    return this.hasContent = true;
  }
}

export default Geom;
