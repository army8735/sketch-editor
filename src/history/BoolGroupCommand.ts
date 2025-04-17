import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import Container from '../node/Container';
import ShapeGroup from '../node/geom/ShapeGroup';
import { boolGroup } from '../tools/shapeGroup';
import { JStyle } from '../format';
import Group from '../node/Group';
import { migrate } from '../tools/node';
import { appendWithIndex } from '../tools/container';

export type BoolGroupData = {
  parent: Container;
  index: number;
  booleanOperation: JStyle['booleanOperation']; // 记录原先的样式undo恢复
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

  execute() {
    BoolGroupCommand.operate(this.nodes, this.booleanOperation, this.shapeGroup);
  }

  undo() {
    // 先迁移，再恢复尺寸并删除组，和UnGroup不同子节点有原本自身的位置
    this.nodes.forEach((node, i) => {
      const { parent, index, booleanOperation } = this.data[i];
      if (parent instanceof Group) {
        parent.fixedPosAndSize = true;
      }
      migrate(parent, node);
      node.props.index = index;
      appendWithIndex(parent, node);
      node.updateStyle({
        booleanOperation,
      });
    });
    this.data.forEach((item) => {
      const { parent } = item;
      // 可能都是一个parent下的，防止重复
      if (parent instanceof Group && parent.fixedPosAndSize) {
        parent.fixedPosAndSize = false;
        parent.checkPosSizeSelf();
      }
    });
    this.shapeGroup.remove();
  }

  static operate(nodes: Node[], booleanOperation: JStyle['booleanOperation'], sg?: ShapeGroup) {
    const data: BoolGroupData[] = nodes.map(item => {
      return {
        parent: item.parent!,
        index: item.props.index,
        booleanOperation: (['none', 'union', 'subtract', 'intersect', 'xor'][item.computedStyle.booleanOperation] || 'none') as JStyle['booleanOperation'],
      };
    });
    return {
      data,
      shapeGroup: boolGroup(nodes, booleanOperation, sg),
    };
  }
}

export default BoolGroupCommand;
