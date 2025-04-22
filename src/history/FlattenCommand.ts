import AbstractCommand from './AbstractCommand';
// import Container from '../node/Container';
import ShapeGroup from '../node/geom/ShapeGroup';
import { flatten } from '../tools/shapeGroup';
import Polyline from '../node/geom/Polyline';

export type FlattenData = {
  // parent: Container;
  // shapeGroup?: ShapeGroup;
  node: Polyline | ShapeGroup;
  index: number; // 冗余
};

class FlattenCommand extends AbstractCommand {
  data: FlattenData[];

  constructor(nodes: ShapeGroup[], data: FlattenData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    FlattenCommand.operate(this.nodes as ShapeGroup[], this.data.map(item => item.node));
  }

  undo() {
    this.data.forEach((item, i) => {
      const { node, index } = item;
      const res = this.nodes[i];
      res.props.index = index; // 理论不变，冗余
      node.insertAfter(res);
      node.remove();
    });
  }

  static operate(nodes: ShapeGroup[], ps?: (Polyline | ShapeGroup)[]) {
    const data: FlattenData[] = nodes.map((item, i) => {
      const node = ps ? flatten(item, ps[i])! : flatten(item)!;
      return {
        // parent: item.parent!,
        // shapeGroup: item,
        node,
        index: item.props.index,
      };
    });
    return { data };
  }
}

export default FlattenCommand;
