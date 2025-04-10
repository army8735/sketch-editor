import * as uuid from 'uuid';
import Node from '../node/Node';
import ShapeGroup from '../node/geom/ShapeGroup';
import { sortTempIndex } from './node';
import { group, unGroup } from './group';
import Polyline from '../node/geom/Polyline';
import { JStyle } from '../format';

// 和group操作类似，但多了设置bool样式步骤
export function boolGroup(nodes: Node[], booleanOperation: JStyle['booleanOperation'], shapeGroup?: ShapeGroup) {
  const geoms = nodes.filter(item => item instanceof Polyline || item instanceof ShapeGroup);
  if (geoms.length < 2) {
    return;
  }
  sortTempIndex(geoms);
  const first = geoms[0];
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
      },
    }, []);
  }
  group(geoms, shapeGroup);
  for (let i = 1, len = geoms.length; i < len; i++) {
    const node = geoms[i];
    node.updateStyle({
      booleanOperation,
    });
  }
  return shapeGroup;
}

export function unBoolGroup(shapeGroup: ShapeGroup) {
  return unGroup(shapeGroup);
}

export default {
  boolGroup,
  unBoolGroup,
};
