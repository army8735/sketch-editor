import Container from '../Container';
import { Props } from '../../format';
import Geom, { Shape } from './Geom';

class ShapeGroup extends Container implements Shape {
  points: Array<Array<number>>;
  constructor(props: Props, children: Array<Geom | ShapeGroup>) {
    super(props, children);
    this.isShapeGroup = true;
    this.points = [];
  }
}

export default ShapeGroup;
