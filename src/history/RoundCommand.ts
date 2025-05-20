import AbstractCommand from './AbstractCommand';
import ShapeGroup from '../node/geom/ShapeGroup';
import { Point } from '../format';
import Polyline from '../node/geom/Polyline';
import { clone } from '../util/type';

export type RoundData = {
  nodes: Polyline[];
  prev: Point[][];
  next: Point[][];
};

class RoundCommand extends AbstractCommand {
  data: RoundData[];

  constructor(nodes: (Polyline | ShapeGroup)[], data: RoundData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      if (!data[i]) {
        return;
      }
      const { nodes, next } = data[i];
      nodes.forEach((item, i) => {
        item.points = clone(next[i]);
        item.refresh();
        let parent = node.parent;
        if (parent instanceof ShapeGroup) {
          parent.clearPointsUpward(); // ShapeGroup的子节点会递归向上检查
        }
      });
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      if (!data[i]) {
        return;
      }
      const { nodes, prev } = data[i];
      nodes.forEach((item, i) => {
        item.points = clone(prev[i]);
        item.refresh();
        let parent = node.parent;
        if (parent instanceof ShapeGroup) {
          parent.clearPointsUpward(); // ShapeGroup的子节点会递归向上检查
        }
      });
    });
  }
}

export default RoundCommand;
