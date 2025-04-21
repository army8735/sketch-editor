import AbstractCommand from './AbstractCommand';
// import Container from '../node/Container';
import ShapeGroup from '../node/geom/ShapeGroup';
import { flatten } from '../tools/shapeGroup';
import Polyline from '../node/geom/Polyline';

export type FlattenData = {
  // parent: Container;
  // shapeGroup?: ShapeGroup;
  node: Polyline | ShapeGroup;
};

class FlattenCommand extends AbstractCommand {
  data: FlattenData[];

  constructor(nodes: ShapeGroup[], data: FlattenData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    FlattenCommand.operate(this.nodes as ShapeGroup[]);
  }

  undo() {}

  static operate(nodes: ShapeGroup[]) {
    const data: FlattenData[] = nodes.map(item => {
      const node = flatten(item)!;
      return {
        // parent: item.parent!,
        // shapeGroup: item,
        node,
      };
    });
    return data;
  }
}

export default FlattenCommand;
