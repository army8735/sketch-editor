import { crossProduct } from './vector';
import { calPoint, isE } from './matrix';
import { intersectLineLine } from './isec';

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
 * @param includeIntersect 是否包含刚好相交，点在边上
 * @returns {boolean}
 */
export function pointInConvexPolygon(x: number, y: number, vertexes: Array<{ x: number, y: number }>,
                                     includeIntersect = false) {
  // 先取最大最小值得一个外围矩形，在外边可快速判断false
  let { x: xmax, y: ymax } = vertexes[0];
  let { x: xmin, y: ymin } = vertexes[0];
  let len = vertexes.length;
  for (let i = 1; i < len; i++) {
    let { x, y } = vertexes[i];
    xmax = Math.max(xmax, x);
    ymax = Math.max(ymax, y);
    xmin = Math.min(xmin, x);
    ymin = Math.min(ymin, y);
  }
  if (x < xmin || y < ymin || x > xmax || y > ymax) {
    return false;
  }
  if (x <= xmin || y <= ymin || x >= xmax || y >= ymax) {
    if (!includeIntersect) {
      return false;
    }
  }
  let first;
  // 所有向量积均为非负数（逆时针，反过来顺时针是非正）说明在多边形内或边上
  for (let i = 0, len = vertexes.length; i < len; i++) {
    let { x: x1, y: y1 } = vertexes[i];
    let { x: x2, y: y2 } = vertexes[(i + 1) % len];
    let n = crossProduct(x2 - x1, y2 - y1, x - x1, y - y1);
    if (n !== 0) {
      n = n > 0 ? 1 : 0;
      // 第一个赋值，后面检查是否正负一致性，不一致是反例就跳出
      if (first === undefined) {
        first = n;
      }
      else if (first ^ n) {
        return false;
      }
    }
    // 正好在边延长线上，判断顶点重合或者顶点在边上
    else if (includeIntersect) {
      if (x === x1 && y === y1 || x === x2 && y === y2) {
        return true;
      }
      // 两点之间的边上则坐标差正负刚好相反，但要考虑水平垂直情况下为0
      const dx1 = x - x1;
      const dx2 = x2 - x;
      const dy1 = y - y1;
      const dy2 = y2 - y;
      if (dx1 === 0 || dx2 === 0) {
        if (dy1 ^ dy2) {
          return true;
        }
      }
      else if (dy1 === 0 || dy2 === 0) {
        if (dx1 ^ dx2) {
          return true;
        }
      }
      else if (dx1 ^ dx2 && dy1 ^ dy2) {
        return true;
      }
    }
  }
  return true;
}

// 判断点是否在一个矩形，比如事件发生是否在节点上
export function pointInRect(x: number, y: number, x1: number, y1: number, x2: number, y2: number,
                            matrix?: Float64Array, includeIntersect = false) {
  if (x1 >= x2) {
    [x1, x2] = [x2, x1];
  }
  if (y1 >= y2) {
    [y1, y2] = [y2, y1];
  }
  if (matrix && !isE(matrix)) {
    const t1 = calPoint({ x: x1, y: y1 }, matrix);
    const t2 = calPoint({ x: x2, y: y1 }, matrix);
    const t3 = calPoint({ x: x2, y: y2 }, matrix);
    const t4 = calPoint({ x: x1, y: y2 }, matrix);
    return pointInConvexPolygon(x, y, [
      { x: t1.x, y: t1.y },
      { x: t2.x, y: t2.y },
      { x: t3.x, y: t3.y },
      { x: t4.x, y: t4.y },
    ]);
  }
  else if (includeIntersect) {
    return x >= x1 && y >= y1 && x <= x2 && y <= y2;
  }
  else {
    return x > x1 && y > y1 && x < x2 && y < y2;
  }
}

// 两点距离
export function pointsDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// 余弦定理3边长求夹角，返回a边对应的角
export function angleBySides(a: number, b: number, c: number) {
  // Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB))
  const theta = (Math.pow(b, 2) + Math.pow(c, 2) - Math.pow(a, 2)) / (2 * b * c);
  return Math.acos(theta) || 0;
}

export const H = 4 * (Math.sqrt(2) - 1) / 3;

// 圆弧拟合公式，根据角度求得3阶贝塞尔控制点比例长度，一般<=90，超过拆分
export function h(deg: number) {
  deg *= 0.5;
  return 4 * ((1 - Math.cos(deg)) / Math.sin(deg)) / 3;
}

// 两个矩形是否相交重叠，无旋转，因此各自只需2个坐标：左上和右下
export function isRectsOverlap(ax1: number, ay1: number, ax2: number, ay2: number,
                               bx1: number, by1: number, bx2: number, by2: number,
                               includeIntersect = false) {
  if (includeIntersect) {
    if (ax1 > bx2 || ay1 > by2 || bx1 > ax2 || by1 > ay2) {
      return false;
    }
    // 边重合情况，另一侧不重合快速判断
    if (ax2 === bx1 || ax1 === bx2) {
      if (ay2 < by1 || ay1 > by2) {
        return false;
      }
    }
    if (ay2 === ay1 || ay1 === ay2) {
      if (ax2 < bx1 || ax1 > bx2) {
        return false;
      }
    }
  }
  else if (ax1 >= bx2 || ay1 >= by2 || bx1 >= ax2 || by1 >= ay2) {
    return false;
  }
  return true;
}

// 2个矩形是否包含，a包含b
export function isRectsInside(ax1: number, ay1: number, ax2: number, ay2: number,
                              bx1: number, by1: number, bx2: number, by2: number,
                              includeIntersect = false) {
  if (includeIntersect) {
    if (ax1 <= bx1 && ay1 <= by1 && ax2 >= bx2 && ay2 >= by2) {
      return true;
    }
  }
  else if (ax1 < bx1 && ay1 < by1 && ax2 > bx2 && ay2 > by2) {
    return true;
  }
  return false;
}

// 两个凸直线多边形是否重叠，不能简单地互相判断顶点在对方内部，因为有特殊的重合状态，比如2个矩形仅中间一部分重叠顶点都在对方外
export function isConvexPolygonsOverlap(
  a: { x: number, y: number }[], b: { x: number, y: number }[], includeIntersect = false,
) {
  let xa = 0, ya = 0, xb = 0, yb = 0;
  for (let i = 0, len = a.length; i < len; i++) {
    const { x, y } = a[i];
    if (i) {
      xa = Math.min(xa, x);
      ya = Math.min(ya, y);
      xb = Math.max(xb, x);
      yb = Math.max(yb, y);
    }
    else {
      xa = x;
      ya = y;
      xb = x;
      yb = y;
    }
  }
  let xc = 0, yc = 0, xd = 0, yd = 0;
  for (let i = 0, len = b.length; i < len; i++) {
    const { x, y } = b[i];
    if (i) {
      xc = Math.min(xc, x);
      yc = Math.min(yc, y);
      xd = Math.max(xd, x);
      yd = Math.max(yd, y);
    }
    else {
      xc = x;
      yc = y;
      xd = x;
      yd = y;
    }
  }
  // 最大最小值不重合提前跳出
  if (includeIntersect) {
    if (xa > xd || ya > yd || xb < xc || yb < yc) {
      return false;
    }
  }
  else {
    if (xa >= xd || ya >= yd || xb <= xc || yb <= yc) {
      return false;
    }
  }
  // 点在对方内部
  for (let i = 0, len = a.length; i < len; i++) {
    if (pointInConvexPolygon(a[i].x, a[i].y, b, includeIntersect)) {
      return true;
    }
  }
  for (let i = 0, len = b.length; i < len; i++) {
    if (pointInConvexPolygon(b[i].x, b[i].y, a, includeIntersect)) {
      return true;
    }
  }
  // 最后判断两多边形是否有边相交，特殊情况比如2矩形只有中间部分重叠，顶点都在外部
  for (let i = 0, len = a.length; i < len; i++) {
    const line1 = [a[i].x, a[i].y, a[(i + 1) % len].x, a[(i + 1) % len].y];
    for (let j = 0, len2 = b.length; j < len2; j++) {
      const line2 = [b[j].x, b[j].y, b[(j + 1) % len2].x, b[(j + 1) % len2].y];
      const res = intersectLineLine(
        line1[0], line1[1], line1[2], line1[3],
        line2[0], line2[1], line2[2], line2[3],
      );
      if (res) {
        if (includeIntersect) {
          return true;
        }
        if (res.toSource || res.toClip) {
          return true;
        }
      }
    }
  }
  return false;
}

// 特殊优化，凸多边形是否和无旋转矩形重叠
export function isConvexPolygonOverlapRect(
  x1: number, y1: number, x2: number, y2: number,
  points: { x: number, y: number }[], includeIntersect = false,
) {
  if (x1 > x2) {
    [x1, x2] = [x2, x1];
  }
  if (y1 > y2) {
    [y1, y2] = [y2, y1];
  }
  let xa = 0, ya = 0, xb = 0, yb = 0;
  // 看多边形顶点是否在矩形内，以及边是否有在矩形内的部分
  for (let i = 0, len = points.length; i < len; i++) {
    const { x, y } = points[i];
    if (i) {
      xa = Math.min(xa, x);
      ya = Math.min(ya, y);
      xb = Math.max(xb, x);
      yb = Math.max(yb, y);
    }
    else {
      xa = x;
      ya = y;
      xb = x;
      yb = y;
    }
    // 点在矩形内可提前跳出
    if (includeIntersect) {
      if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        return true;
      }
    }
    else {
      if (x > x1 && x < x2 && y > y1 && y < y2) {
        return true;
      }
    }
    // 点在矩形外，多边形每条边如果在矩形范围内也重叠，按先x小大（如果相等再y小大）排列边的2个点
    const { x: nx, y: ny } = points[(i + 1) % len];
    // 垂直线特殊情况，x在矩形内y两点在矩形外
    if (x === nx) {
      if (x >= x1 && x <= x2) {
        if (y >= ny) {
          if (y >= y2 && ny <= y1) {
            return true;
          }
        }
        else {
          if (y <= y1 && ny >= y2) {
            return true;
          }
        }
      }
    }
    // 水平线特殊情况同理
    else if (y === ny) {
      if (y >= y1 && y <= y2) {
        if (x >= nx) {
          if (x >= x2 && nx <= x1) {
            return true;
          }
        }
        else {
          if (x <= x1 && nx >= x2) {
            return true;
          }
        }
      }
    }
    // 斜线普通情况，求得在x1/x2的y点坐标，检查是否在矩形内
    else {
      const dx = nx - x;
      const dy = ny - y;
      const t1 = (x1 - x) / dx;
      if (t1 >= 0 && t1 <= 1) {
        const p = y + t1 * dy;
        if (includeIntersect && p >= y1 && p <= y2
          || !includeIntersect && p > y1 && p < y2) {
          return true;
        }
      }
      const t2 = (x2 - x) / dx;
      if (t2 >= 0 && t2 <= 1) {
        const p = y + t2 * dy;
        if (includeIntersect && p >= y1 && p <= y2
          || !includeIntersect && p > y1 && p < y2) {
          return true;
        }
      }
    }
  }
  // 特殊情况，矩形在多边形内
  if (xa <= x1 && ya <= y1 && xb >= x2 && yb >= y2) {
    return true;
  }
  return false;
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
  isRectsOverlap,
  isRectsInside,
  isConvexPolygonsOverlap,
  isConvexPolygonOverlapRect,
};
