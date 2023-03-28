import { crossProduct } from './vector';
import { calPoint, isE } from './matrix';

export function d2r(n: number) {
  return n * Math.PI / 180;
}

export function r2d(n: number) {
  return n * 180 / Math.PI;
}

/**
 * 判断点是否在多边形内
 * @param x 点坐标
 * @param y
 * @param vertexes 多边形顶点坐标
 * @returns {boolean}
 */
export function pointInConvexPolygon(x: number, y: number, vertexes: Array<{ x: number, y: number }>) {
  // 先取最大最小值得一个外围矩形，在外边可快速判断false
  let { x: xmax, y: ymax } = vertexes[0];
  let { x: xmin, y: ymin } = vertexes[0];
  let len = vertexes.length;
  for(let i = 1; i < len; i++) {
    let { x, y } = vertexes[i];
    xmax = Math.max(xmax, x);
    ymax = Math.max(ymax, y);
    xmin = Math.min(xmin, x);
    ymin = Math.min(ymin, y);
  }
  if(x < xmin || y < ymin || x > xmax || y > ymax) {
    return false;
  }
  let first;
  // 所有向量积均为非负数（逆时针，反过来顺时针是非正）说明在多边形内或边上
  for(let i = 0, len = vertexes.length; i < len; i++) {
    let { x: x1, y: y1 } = vertexes[i];
    let { x: x2, y: y2 } = vertexes[(i + 1) % len];
    let n = crossProduct(x2 - x1, y2 - y1, x - x1, y - y1);
    if(n !== 0) {
      n = n > 0 ? 1 : 0;
      // 第一个赋值，后面检查是否正负一致性，不一致是反例就跳出
      if(first === undefined) {
        first = n;
      }
      else if(first ^ n) {
        return false;
      }
    }
  }
  return true;
}

// 判断点是否在一个矩形，比如事件发生是否在节点上
export function pointInRect(x: number, y: number, x1: number, y1: number, x2: number, y2: number, matrix: Float64Array) {
  if(matrix && !isE(matrix)) {
    let t1 = calPoint({ x: x1, y: y1 }, matrix);
    let xa = t1.x, ya = t1.y;
    let t2 = calPoint({ x: x2, y: y2 }, matrix);
    let xb = t2.x, yb = t2.y;
    return pointInConvexPolygon(x, y, [
      { x: xa, y: ya },
      { x: xb, y: ya },
      { x: xb, y: yb },
      { x: xa, y: yb },
    ]);
  }
  else {
    return x >= x1 && y >= y1 && x <= x2 && y <= y2;
  }
}

export default {
  d2r,
  r2d,
  pointInConvexPolygon,
  pointInRect,
};
