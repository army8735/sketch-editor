import Geom from './Geom';
import { Point, PolylineProps } from '../../format';
import { LayoutData } from '../layout';
import CanvasCache from '../../refresh/CanvasCache';

class Polyline extends Geom {
  points: Array<Array<number>>;
  constructor(props: PolylineProps) {
    super(props);
    this.points = props.points.map((item: Point) => {
      return [];
    });
  }

  override lay(data: LayoutData) {
    super.lay(data);
    console.log(this.props);
  }

  override renderCanvas() {
    super.renderCanvas();
    const canvasCache = this.canvasCache = CanvasCache.getInstance(this.width, this.height);
    canvasCache.available = true;
  }
}

export default Polyline;
