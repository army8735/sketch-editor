import AbstractCommand from './AbstractCommand';
import Polyline from '../node/geom/Polyline';
import { Point } from '../format';
import { clone } from '../util/type';

export type PointData = {
  prev: Point[],
  next: Point[],
};

class PointCommand extends AbstractCommand {
  data: PointData[];

  constructor(nodes: Polyline[], data: PointData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      (node as Polyline).props.points = clone(data[i].next);
      // 可能会牵扯到尺寸变更，先用abs值反向计算相对值
      (node as Polyline).reflectPoints();
      (node as Polyline).refresh();
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      (node as Polyline).props.points = clone(data[i].prev);
      (node as Polyline).reflectPoints();
      (node as Polyline).refresh();
    });
  }
}

export default PointCommand;
