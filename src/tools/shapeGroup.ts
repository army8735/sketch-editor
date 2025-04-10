import * as uuid from 'uuid';
import Node from '../node/Node';
import ShapeGroup from '../node/geom/ShapeGroup';
import { sortTempIndex } from './node';
import { group, unGroup } from './group';
import Polyline from '../node/geom/Polyline';
import { JStyle } from '../format';

// 和group操作类似，但多了设置bool样式步骤
export function boolGroup(nodes: Node[], booleanOperation: JStyle['booleanOperation'], shapeGroup?: ShapeGroup) {
  if (!nodes.length) {
    return;
  }
  const nodes2 = nodes.slice(0);
  sortTempIndex(nodes2);
  const first = nodes2[0];
  const parent = first.parent!;
  if (!shapeGroup) {
    shapeGroup = new ShapeGroup({
      uuid: uuid.v4(),
      name: '编组',
      index: parent.props.index,
      style: {
        left: '0%',
        top: '0%',
        right: '0%',
        bottom: '0%',
        fillEnable: [true],
        fillOpacity: [1],
      },
    }, []);
  }
  group(nodes2, shapeGroup);
  let isFirst = true;
  for (let i = 0, len = nodes2.length; i < len; i++) {
    const node = nodes2[i];
    if (isFirst && (node instanceof Polyline || node instanceof ShapeGroup)) {
      isFirst = false;
      shapeGroup.updateStyle({
        fill: [node.getCssStyle().fill[0]],
      });
    }
    if (i) {
      node.updateStyle({
        booleanOperation,
      });
    }
  }
  shapeGroup.clearPointsUpward();
  return shapeGroup;
}

export function unBoolGroup(shapeGroup: ShapeGroup) {
  return unGroup(shapeGroup);
}

export default {
  boolGroup,
  unBoolGroup,
};
