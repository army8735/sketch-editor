import * as uuid from 'uuid';
import Node from '../node/Node';
import ShapeGroup from '../node/geom/ShapeGroup';
import { sortTempIndex } from './node';
import { group } from './group';
import Polyline from '../node/geom/Polyline';
import { JStyle, Point } from '../format';
import { CORNER_STYLE, CURVE_MODE, POINTS_RADIUS_BEHAVIOUR } from '../style/define';
import inject from '../util/inject';

// 和group操作类似，但多了设置bool样式步骤
export function boolGroup(nodes: Node[], booleanOperation: JStyle['booleanOperation'], shapeGroup?: ShapeGroup) {
  if (!nodes.length) {
    return;
  }
  const nodes2 = nodes.slice(0);
  sortTempIndex(nodes2);
  const first = nodes2[0];
  const parent = first.parent!;
  // 首次命令没有生成，后续redo时就有了
  if (!shapeGroup) {
    shapeGroup = new ShapeGroup({
      uuid: uuid.v4(),
      name: '编组',
      index: parent.index,
      style: {
        left: '0%',
        top: '0%',
        right: '0%',
        bottom: '0%',
      },
    }, []);
  }
  // 复用group，后续改booleanOperation样式
  group(nodes2, shapeGroup);
  for (let i = 0, len = nodes2.length; i < len; i++) {
    const node = nodes2[i];
    if (i) {
      node.updateStyle({
        booleanOperation,
      });
    }
    else {
      // 应用首个的fill等样式
      const cssStyle = node.getCssStyle();
      shapeGroup.updateStyle({
        fill: cssStyle.fill,
        fillEnable: cssStyle.fillEnable,
        fillOpacity: cssStyle.fillOpacity,
        fillMode: cssStyle.fillMode,
        fillRule: cssStyle.fillRule,
        stroke: cssStyle.stroke,
        strokeEnable: cssStyle.strokeEnable,
        strokeWidth: cssStyle.strokeWidth,
        strokePosition: cssStyle.strokePosition,
        strokeMode: cssStyle.strokeMode,
        strokeDasharray: cssStyle.strokeDasharray,
        strokeLinecap: cssStyle.strokeLinecap,
        strokeLinejoin: cssStyle.strokeLinejoin,
        strokeMiterlimit: cssStyle.strokeMiterlimit,
        shadow: cssStyle.shadow,
        shadowEnable: cssStyle.shadowEnable,
        innerShadow: cssStyle.innerShadow,
        innerShadowEnable: cssStyle.innerShadowEnable,
        blur: cssStyle.blur,
        mixBlendMode: cssStyle.mixBlendMode,
      });
    }
  }
  shapeGroup.clearPointsUpward();
  return shapeGroup;
}

export function flatten(shapeGroup: ShapeGroup, ps?: Polyline | ShapeGroup) {
  const { parent, width, height, coords, computedStyle } = shapeGroup;
  if (shapeGroup.isDestroyed) {
    inject.error('ShapeGroup is destroyed');
    return;
  }
  if (!coords) {
    inject.error('Unsupported flatten data');
    return;
  }
  const cssStyle = shapeGroup.getCssStyle();
  const style = {
    left: computedStyle.left * 100 / parent!.width + '%',
    top: computedStyle.top * 100 / parent!.height + '%',
    right: computedStyle.right * 100 / parent!.width + '%',
    bottom: computedStyle.bottom * 100 / parent!.height + '%',
    fill: cssStyle.fill,
    fillEnable: cssStyle.fillEnable,
    fillOpacity: cssStyle.fillOpacity,
    fillMode: cssStyle.fillMode,
    fillRule: cssStyle.fillRule,
    stroke: cssStyle.stroke,
    strokeEnable: cssStyle.strokeEnable,
    strokeWidth: cssStyle.strokeWidth,
    strokePosition: cssStyle.strokePosition,
    strokeMode: cssStyle.strokeMode,
    strokeDasharray: cssStyle.strokeDasharray,
    strokeLinecap: cssStyle.strokeLinecap,
    strokeLinejoin: cssStyle.strokeLinejoin,
    strokeMiterlimit: cssStyle.strokeMiterlimit,
    shadow: cssStyle.shadow,
    shadowEnable: cssStyle.shadowEnable,
    innerShadow: cssStyle.innerShadow,
    innerShadowEnable: cssStyle.innerShadowEnable,
    blur: cssStyle.blur,
    mixBlendMode: cssStyle.mixBlendMode,
  };
  let node: Polyline | ShapeGroup;
  // 多区域还是shapeGroup但无布尔运算
  if (coords.length > 1) {
    const children = coords.map((cs, i) => {
      const points = coords2Points(cs, width, height);
      return new Polyline({
        uuid: uuid.v4(),
        name: '路径 ' + (i + 1),
        index: shapeGroup.index,
        isClosed: true,
        points,
        fixedRadius: 0,
        pointRadiusBehaviour: POINTS_RADIUS_BEHAVIOUR.DISABLED,
        // 初始化相对于shapeGroup满尺寸（和coords一致），didMount()后自适应计算
        style: Object.assign({}, style, {
          left: '0%',
          right: '0%',
          top: '0%',
          bottom: '0%',
        }),
      });
    });
    node = ps || new ShapeGroup({
      uuid: uuid.v4(),
      name: '形状',
      index: shapeGroup.index,
      style,
    }, children);
  }
  else {
    const points = coords2Points(coords[0], width, height);
    node = ps || new Polyline({
      uuid: uuid.v4(),
      name: '矢量',
      index: shapeGroup.index,
      isClosed: true,
      points,
      fixedRadius: 0,
      pointRadiusBehaviour: POINTS_RADIUS_BEHAVIOUR.DISABLED,
      style,
    });
  }
  shapeGroup.insertAfter(node);
  shapeGroup.remove();
  node.coords = undefined;
  return node;
}

function coords2Points(cs: number[][], width: number, height: number) {
  return cs.slice(0, cs.length - 1).map((item, i) => {
    const o = item.slice(-2);
    const x = o[0] / width;
    const y = o[1] / height;
    const next = cs[i + 1];
    const hasCurveFrom = next.length > 2;
    const prev = i ? item : cs[cs.length - 1];
    const hasCurveTo = prev.length > 4;
    return {
      x,
      y,
      cornerRadius: 0,
      cornerStyle: CORNER_STYLE.ROUNDED,
      curveMode: CURVE_MODE.STRAIGHT,
      fx: hasCurveFrom ? next[0] / width : x,
      fy: hasCurveFrom ? next[1] / height : y,
      tx: hasCurveTo ? prev[2] / width : x,
      ty: hasCurveTo ? prev[3] / height : y,
      hasCurveFrom,
      hasCurveTo,
    } as Point;
  });
}

export default {
  boolGroup,
  flatten,
};
