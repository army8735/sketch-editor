import AbstractCommand from './AbstractCommand';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';
import { Point } from '../format';
import { clone } from '../util/type';
import { getPointsAbsByDsp } from '../tools/polyline';

export type PointData = {
  prev: Point[],
  next: Point[],
} | undefined; // 没变化就是undefined

class PointCommand extends AbstractCommand {
  data: PointData[];

  constructor(nodes: Polyline[], data: PointData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      if (!data[i]) {
        return;
      }
      (node as Polyline).points = clone(data[i].next);
      getPointsAbsByDsp(node as Polyline);
      // 可能会牵扯到尺寸变更，先用abs值反向计算相对值
      (node as Polyline).reflectPoints();
      (node as Polyline).refresh();
      let parent = node.parent;
      if (parent instanceof ShapeGroup) {
        parent.clearPointsUpward(); // ShapeGroup的子节点会递归向上检查
      }
      (node as Polyline).checkPointsChange();
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      if (!data[i]) {
        return;
      }
      (node as Polyline).points = clone(data[i].prev);
      getPointsAbsByDsp(node as Polyline);
      (node as Polyline).reflectPoints();
      (node as Polyline).refresh();
      let parent = node.parent;
      if (parent instanceof ShapeGroup) {
        parent.clearPointsUpward(); // ShapeGroup的子节点会递归向上检查
      }
      (node as Polyline).checkPointsChange();
    });
  }
}

export default PointCommand;
