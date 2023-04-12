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
    let t2 = calPoint({ x: x2, y: y1 }, matrix);
    let xb = t2.x, yb = t2.y;
    let t3 = calPoint({ x: x2, y: y2 }, matrix);
    let xc = t3.x, yc = t3.y;
    let t4 = calPoint({ x: x1, y: y2 }, matrix);
    let xd = t4.x, yd = t4.y;
    return pointInConvexPolygon(x, y, [
      { x: xa, y: ya },
      { x: xb, y: yb },
      { x: xc, y: yc },
      { x: xd, y: yd },
    ]);
  }
  else {
    return x >= x1 && y >= y1 && x <= x2 && y <= y2;
  }
}

// 两点距离
export function pointsDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// 余弦定理3边长求夹角，返回a边对应的角
export function angleBySides(a: number, b: number, c: number) {
  // Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB))
  let theta = (Math.pow(b, 2) + Math.pow(c, 2) - Math.pow(a, 2)) / (2 * b * c);
  return Math.acos(theta);
}

export const H = 4 * (Math.sqrt(2) - 1) / 3;

// 圆弧拟合公式，根据角度求得3阶贝塞尔控制点比例长度，一般<=90，超过拆分
export function h(deg: number) {
  deg *= 0.5;
  return 4 * ((1 - Math.cos(deg)) / Math.sin(deg)) / 3;
}

export default {
  d2r,
  r2d,
  // 贝塞尔曲线模拟1/4圆弧比例
  H,
  // <90任意角度贝塞尔曲线拟合圆弧的比例公式
  h,
  pointInConvexPolygon,
  pointInRect,
  pointsDistance,
  angleBySides,
};
