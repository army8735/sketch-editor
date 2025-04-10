import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import Container from '../node/Container';
import ShapeGroup from '../node/geom/ShapeGroup';
import { boolGroup } from '../tools/shapeGroup';
import { JStyle } from '../format';

export type BoolGroupData = {
  parent: Container;
  index: number;
};

class BoolGroupCommand extends AbstractCommand {
  data: BoolGroupData[];
  shapeGroup: ShapeGroup;
  booleanOperation: JStyle['booleanOperation'];

  constructor(nodes: Node[], data: BoolGroupData[], shapeGroup: ShapeGroup, booleanOperation: JStyle['booleanOperation']) {
    super(nodes);
    this.data = data;
    this.shapeGroup = shapeGroup;
    this.booleanOperation = booleanOperation;
  }

  execute() {}

  undo() {}

  static operate(nodes: Node[], booleanOperation: JStyle['booleanOperation'], sg?: ShapeGroup) {
    const data: BoolGroupData[] = nodes.map(item => {
      return {
        parent: item.parent!,
        index: item.props.index,
      };
    });
    return {
      data,
      shapeGroup: boolGroup(nodes, booleanOperation, sg),
    };
  }
}

export default BoolGroupCommand;
