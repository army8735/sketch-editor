import * as uuid from 'uuid';
import { Point } from '../format';
import Polyline from '../node/geom/Polyline';
import { calPoint, inverse4 } from '../math/matrix';
import { isConvexPolygonOverlapRect, pointInRect } from '../math/geom';
import { getBaseCoords, getBasicMatrix } from './node';

export function createRect() {
  return new Polyline({
    uuid: uuid.v4(),
    name: '矩形',
    index: 0,
    style: {
      fill: ['#D8D8D8'],
      fillEnable: [true],
      fillOpacity: [1],
      stroke: ['#979797'],
      strokeEnable: [true],
      strokeWidth: [1],
      strokePosition: ['center'],
      strokeMode: ['normal'],
    },
    points: [
      { x: 0, y: 0, cornerRadius: 0, curveMode: 'straight', hasCurveFrom: false, hasCurveTo: false, fx: 0, fy: 0, tx: 0, ty: 0 },
      { x: 1, y: 0, cornerRadius: 0, curveMode: 'straight', hasCurveFrom: false, hasCurveTo: false, fx: 1, fy: 0, tx: 1, ty: 0 },
      { x: 1, y: 1, cornerRadius: 0, curveMode: 'straight', hasCurveFrom: false, hasCurveTo: false, fx: 1, fy: 1, tx: 1, ty: 1 },
      { x: 0, y: 1, cornerRadius: 0, curveMode: 'straight', hasCurveFrom: false, hasCurveTo: false, fx: 0, fy: 1, tx: 0, ty: 1 },
    ],
    isClosed: true,
    isRectangle: true,
    fixedRadius: 0,
  });
}

export function createOval() {
  const t = 0.2238576251;
  const f = 0.7761423749;
  return new Polyline({
    uuid: uuid.v4(),
    name: '椭圆形',
    index: 0,
    style: {
      fill: ['#D8D8D8'],
      fillEnable: [true],
      fillOpacity: [1],
      stroke: ['#979797'],
      strokeEnable: [true],
      strokeWidth: [1],
      strokePosition: ['center'],
      strokeMode: ['normal'],
    },
    points: [
      { x: 0.5, y: 0, cornerRadius: 0, curveMode: 'mirrored', hasCurveFrom: true, hasCurveTo: true, fx: t, fy: 0, tx: f, ty: 0 },
      { x: 0, y: 0.5, cornerRadius: 0, curveMode: 'mirrored', hasCurveFrom: true, hasCurveTo: true, fx: 0, fy: f, tx: 0, ty: t },
      { x: 0.5, y: 1, cornerRadius: 0, curveMode: 'mirrored', hasCurveFrom: true, hasCurveTo: true, fx: f, fy: 1, tx: t, ty: 1 },
      { x: 1, y: 0.5, cornerRadius: 0, curveMode: 'mirrored', hasCurveFrom: true, hasCurveTo: true, fx: 1, fy: t, tx: 1, ty: f },
    ],
    isClosed: true,
    isOval: true,
    fixedRadius: 0,
  });
}

// 框选范围内的顶点
export function getFrameVertexes(node: Polyline, x1: number, y1: number, x2: number, y2: number) {
  const list: number[] = [];
  // 鼠标轻微移动没有宽或高
  if (x1 === x2 || y1 === y2) {
    return list;
  }
  node.buildPoints();
  const m = node.matrixWorld;
  // 先判断是否和世界bbox相交
  const r = node._rect || node.rect;
  const pts = [
    { x: r[0], y: r[1] },
    { x: r[2], y: r[1] },
    { x: r[2], y: r[3] },
    { x: r[0], y: r[3] },
  ].map(item => {
    return calPoint(item, m);
  });
  if (!isConvexPolygonOverlapRect(x1, y1, x2, y2, pts)) {
    return list;
  }
  // 所有点依次判断
  const points = node.points;
  points.forEach((item: Point, i) => {
    const p = calPoint({
      x: item.absX,
      y: item.absY,
    }, m);
    if (pointInRect(p.x, p.y, x1, y1, x2, y2)) {
      list.push(i);
    }
  });
  return list;
}

// 类似node的basicInfo，顶点abs坐标相对于AP的展示坐标
export function getPointsDspByAbs(node: Polyline, points?: Point | Point[]) {
  const m = getBasicMatrix(node);
  if (!points) {
    points = node.points;
  }
  const { baseX, baseY } = getBaseCoords(node);
  const pts = Array.isArray(points) ? points : [points];
  pts.forEach(item => {
    const p = calPoint({
      x: item.absX - baseX,
      y: item.absY - baseY,
    }, m);
    const f = calPoint({
      x: item.absFx - baseX,
      y: item.absFy - baseY,
    }, m);
    const t = calPoint({
      x: item.absTx - baseX,
      y: item.absTy - baseY,
    }, m);
    item.dspX = p.x;
    item.dspY = p.y;
    item.dspFx = f.x;
    item.dspFy = f.y;
    item.dspTx = t.x;
    item.dspTy = t.y;
  });
}

export function getPointsAbsByDsp(node: Polyline, points?: Point | Point[]) {
  const m = getBasicMatrix(node);
  if (!points) {
    points = node.points;
  }
  const i = inverse4(m);
  const { baseX, baseY } = getBaseCoords(node);
  const pts = Array.isArray(points) ? points : [points];
  pts.forEach(item => {
    const p = calPoint({
      x: item.dspX + baseX,
      y: item.dspY + baseY,
    }, i);
    const f = calPoint({
      x: item.dspFx + baseX,
      y: item.dspFy + baseY,
    }, i);
    const t = calPoint({
      x: item.dspTx + baseX,
      y: item.dspTy + baseY,
    }, i);
    item.absX = p.x;
    item.absY = p.y;
    item.absFx = f.x;
    item.absFy = f.y;
    item.absTx = t.x;
    item.absTy = t.y;
  });
}

export default {
  getFrameVertexes,
  getPointsDspByAbs,
  getPointsAbsByDsp,
  createRect,
  createOval,
};
