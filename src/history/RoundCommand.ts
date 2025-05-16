import AbstractCommand from './AbstractCommand';
import ShapeGroup from '../node/geom/ShapeGroup';
import { Point } from '../format';
import Polyline from '../node/geom/Polyline';

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

  execute() {}

  undo() {}
}

export default RoundCommand;
