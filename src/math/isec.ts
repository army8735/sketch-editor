import vector from './vector';
import { bboxBezier, getPointByT, sliceBezier } from './bezier';
import { isRectsOverlap } from './geom';

type Point3 = {
  x: number,
  y: number,
  z: number,
};

const { unitize3, crossProduct3, dotProduct3, isParallel3, length3 } = vector;

/**
 * 2分逼近法求曲线交点，递归改用循环实现，当分割后的曲线的bbox和宽高小于阈值时认为找到结果
 * 当出现几乎重叠但不重叠的情况，2分后会出现和对方一半几乎重叠另一半相邻的情况，造成大量组合浪费
 * 需要判断这种情况避免，即bbox相邻但端点都在边上且不相交
 */
function intersectFn(
  a: { x: number, y: number }[], b: { x: number, y: number }[],
  eps: number, res: { x: number, y: number, t1: number, t2: number }[],
) {
  const list = [{
    a,
    b,
    t1: 0,
    t2: 1,
    t3: 0,
    t4: 1,
  }];
  while (list.length) {
    const { a, b, t1, t2, t3, t4 } = list.pop()!;
    const bbox1 = bboxBezier(a[0].x, a[0].y, a[1].x, a[1].y, a[2]?.x, a[2]?.y, a[3]?.x, a[3]?.y);
    const bbox2 = bboxBezier(b[0].x, b[0].y, b[1].x, b[1].y, b[2]?.x, b[2]?.y, b[3]?.x, b[3]?.y);
    if (isRectsOverlap(bbox1[0], bbox1[1], bbox1[2], bbox1[3], bbox2[0], bbox2[1], bbox2[2], bbox2[3], true)) {
      // 直线可能宽高为0，防止非法运算取min值
      const l1 = (bbox1[2] - bbox1[0]) || Number.EPSILON;
      const l2 = (bbox1[3] - bbox1[1]) || Number.EPSILON;
      const l3 = (bbox2[2] - bbox2[0]) || Number.EPSILON;
      const l4 = (bbox2[3] - bbox2[1]) || Number.EPSILON;
      const area1 = l1 * l2;
      const area2 = l3 * l4;
      // 精度到一定程度认为找到了解
      if (l1 <= eps && l2 <= eps && area1 <= eps &&
        l3 <= eps && l4 <= eps && area2 <= eps) {
        let ta = (t1 + t2) * 0.5;
        let tb = (t3 + t4) * 0.5;
        // 特殊判断，可能在开头/末尾相交，此时t不取中值
        if (t1 === 0) {
          const p1 = a[0];
          if (p1.x === b[0].x && p1.y === b[0].y ||
            p1.x === b[b.length - 1].x && p1.y === b[b.length - 1].y) {
            ta = 0;
          }
        }
        else if (t2 === 1) {
          const p1 = a[a.length - 1];
          if (p1.x === b[0].x && p1.y === b[0].y ||
            p1.x === b[b.length - 1].x && p1.y === b[b.length - 1].y) {
            ta = 1;
          }
        }
        if (t3 === 0) {
          const p1 = b[0];
          if (p1.x === a[0].x && p1.y === a[0].y ||
            p1.x === a[a.length - 1].x && p1.y === a[a.length - 1].y) {
            tb = 0;
          }
        }
        else if (t4 === 1) {
          const p1 = b[b.length - 1];
          if (p1.x === a[0].x && p1.y === a[0].y ||
            p1.x === a[a.length - 1].x && p1.y === a[a.length - 1].y) {
            tb = 1;
          }
        }
        const ap = getPointByT(a, ta);
        const bp = getPointByT(b, tb);
        res.push({
          x: (ap.x + bp.x) * 0.5,
          y: (ap.y + bp.y) * 0.5,
          t1: ta,
          t2: tb,
        });
      }
      // 双方继续2分
      else {
        if ((l1 > eps || l2 > eps || area1 > eps) &&
          (l3 > eps || l4 > eps || area2 > eps)) {
          const a1 = sliceBezier(a, 0, 0.5);
          const a2 = sliceBezier(a, 0.5, 1);
          const b1 = sliceBezier(b, 0, 0.5);
          const b2 = sliceBezier(b, 0.5, 1);
          list.push({
            a: a1,
            b: b1,
            t1,
            t2: t1 + (t2 - t1) * 0.5,
            t3,
            t4: t3 + (t4 - t3) * 0.5,
          });
          list.push({
            a: a1,
            b: b2,
            t1,
            t2: t1 + (t2 - t1) * 0.5,
            t3: t3 + (t4 - t3) * 0.5,
            t4,
          });
          list.push({
            a: a2,
            b: b1,
            t1: t1 + (t2 - t1) * 0.5,
            t2,
            t3,
            t4: t3 + (t4 - t3) * 0.5,
          });
          list.push({
            a: a2,
            b: b2,
            t1: t1 + (t2 - t1) * 0.5,
            t2,
            t3: t3 + (t4 - t3) * 0.5,
            t4,
          });
          // intersectFn(a1, b1, eps, t1, t1 + (t2 - t1) * 0.5, t3, t3 + (t4 - t3) * 0.5, res);
          // intersectFn(a1, b2, eps, t1, t1 + (t2 - t1) * 0.5, t3 + (t4 - t3) * 0.5, t4, res);
          // intersectFn(a2, b1, eps, t1 + (t2 - t1) * 0.5, t2, t3, t3 + (t4 - t3) * 0.5, res);
          // intersectFn(a2, b2, eps, t1 + (t2 - t1) * 0.5, t2, t3 + (t4 - t3) * 0.5, t4, res);
        }
        // 只有一方的2分
        else if (l1 > eps || l2 > eps || area1 > eps) {
          const a1 = sliceBezier(a, 0, 0.5);
          const a2 = sliceBezier(a, 0.5, 1);
          list.push({
            a: a1,
            b: b,
            t1,
            t2: t1 + (t2 - t1) * 0.5,
            t3,
            t4,
          });
          list.push({
            a: a2,
            b: b,
            t1: t1 + (t2 - t1) * 0.5,
            t2,
            t3,
            t4,
          });
          // intersectFn(a1, b, eps, t1, t1 + (t2 - t1) * 0.5, t3, t4, res);
          // intersectFn(a2, b, eps, t1 + (t2 - t1) * 0.5, t2, t3, t4, res);
        }
        // 另一方的2分
        else if (l3 > eps || l4 > eps || area2 > eps) {
          const b1 = sliceBezier(b, 0, 0.5);
          const b2 = sliceBezier(b, 0.5, 1);
          list.push({
            a: a,
            b: b1,
            t1,
            t2,
            t3,
            t4: t3 + (t4 - t3) * 0.5,
          });
          list.push({
            a: a,
            b: b2,
            t1,
            t2,
            t3: t3 + (t4 - t3) * 0.5,
            t4,
          });
          // intersectFn(a, b1, eps, t1, t2, t3, t3 + (t4 - t3) * 0.5, res);
          // intersectFn(a, b2, eps, t1, t2, t3 + (t4 - t3) * 0.5, t4, res);
        }
      }
    }
  }
  res.sort((a, b) => {
    if (a.t1 === b.t1) {
      return a.t2 - b.t2;
    }
    return a.t1 - b.t1;
  });
  // 可能因为精度出现一个交点连续多个解的情况，也可能出现一段曲线重合的情况
  for (let i = res.length - 1; i > 0; i--) {
    const curr = res[i];
    const prev = res[i - 1];
    // 前一个点十分接近当前点，尝试循环看有多少个连续的点很接近
    if (Math.abs(curr.x - prev.x) <= eps && Math.abs(curr.y - prev.y) <= eps) {
      if (i === 1) {
        if (curr.t1 === 0 || curr.t1 === 1 || curr.t2 === 0 || curr.t2 === 1) {
          res.shift();
        }
        else {
          res.splice(1, 1);
        }
      }
      else {
        for (let j = i - 1; j > 0; j--) {
          const curr2 = res[j];
          const prev2 = res[j - 1];
          const tooFar = Math.abs(curr2.x - prev2.x) > eps && Math.abs(curr2.y - prev2.y) > eps;
          // 不连续则中断，开始分析；一个交点则首尾点十分靠近，一段曲线则首尾点隔开有距离
          if (tooFar || j === 1) {
            const index = tooFar ? j : j + 1;
            const pt = res[index];
            // 根据几何特性可知相邻的bbox误差最大为eps * 2，误差内认为是一个点
            if (Math.abs(curr.x - pt.x) <= eps * 2 && Math.abs(curr.y - pt.y) <= eps * 2) {
              // 有t=0/1优选首尾，否则取中值
              if (curr.t1 === 0 || curr.t1 === 1 || curr.t2 === 0 || curr.t2 === 1) {
                res.splice(index, i - index);
              }
              else if (pt.t1 === 0 || pt.t1 === 1 || pt.t2 === 0 || pt.t2 === 1) {
                res.splice(index + 1, i - index);
              }
              else {
                const mid = res[(index + i) >> 1];
                res.splice(index, i - index + 1, mid);
              }
            }
            // 否则认为是一段曲线重合，取首尾2点
            else {
              res.splice(index, i - index - 1);
            }
            i = index;
            break;
          }
        }
      }
    }
  }
  return res;
}

export function intersectBezier2Bezier2(
  ax1: number, ay1: number, ax2: number, ay2: number, ax3: number, ay3: number,
  bx1: number, by1: number, bx2: number, by2: number, bx3: number, by3: number,
  eps = 1e-4,
) {
  const res: { x: number, y: number, t1: number, t2: number }[] = [];
  intersectFn(
    [
      { x: ax1, y: ay1 },
      { x: ax2, y: ay2 },
      { x: ax3, y: ay3 },
    ], [
      { x: bx1, y: by1 },
      { x: bx2, y: by2 },
      { x: bx3, y: by3 },
    ],
    eps, res,
  );
  return res;
}

export function intersectBezier3Bezier3(
  ax1: number, ay1: number, ax2: number, ay2: number, ax3: number, ay3: number, ax4: number, ay4: number,
  bx1: number, by1: number, bx2: number, by2: number, bx3: number, by3: number, bx4: number, by4: number,
  eps = 1e-4) {
  const res: { x: number, y: number, t1: number, t2: number }[] = [];
  intersectFn(
    [
      { x: ax1, y: ay1 },
      { x: ax2, y: ay2 },
      { x: ax3, y: ay3 },
      { x: ax4, y: ay4 },
    ], [
      { x: bx1, y: by1 },
      { x: bx2, y: by2 },
      { x: bx3, y: by3 },
      { x: bx4, y: by4 },
    ],
    eps, res,
  );
  return res;
}

export function intersectBezier2Bezier3(
  ax1: number, ay1: number, ax2: number, ay2: number, ax3: number, ay3: number,
  bx1: number, by1: number, bx2: number, by2: number, bx3: number, by3: number, bx4: number, by4: number,
  eps = 1e-4) {
  const res: { x: number, y: number, t1: number, t2: number }[] = [];
  intersectFn(
    [
      { x: ax1, y: ay1 },
      { x: ax2, y: ay2 },
      { x: ax3, y: ay3 },
    ], [
      { x: bx1, y: by1 },
      { x: bx2, y: by2 },
      { x: bx3, y: by3 },
      { x: bx4, y: by4 },
    ],
    eps, res,
  );
  return res;
}

export function intersectLineLine(
  ax1: number, ay1: number, ax2: number, ay2: number,
  bx1: number, by1: number, bx2: number, by2: number,
  limit = true, eps = 0) {
  const d = (by2 - by1) * (ax2 - ax1) - (bx2 - bx1) * (ay2 - ay1);
  if (d !== 0) {
    const toSource = (
      (bx2 - bx1) * (ay1 - by1) - (by2 - by1) * (ax1 - bx1)
    ) / d;
    const toClip = (
      (ax2 - ax1) * (ay1 - by1) - (ay2 - ay1) * (ax1 - bx1)
    ) / d;
    const eps2 = 1 - eps
    if (limit && (toSource < eps || toSource > eps2 || toClip < eps || toClip > eps2)) {
      return;
    }
    const ox = ax1 + toSource * (ax2 - ax1);
    const oy = ay1 + toSource * (ay2 - ay1);
    return {
      x: ox,
      y: oy,
      toSource,
      toClip,
    };
  }
}

export function intersectBezier2Line(
  ax1: number, ay1: number, ax2: number, ay2: number, ax3: number, ay3: number,
  bx1: number, by1: number, bx2: number, by2: number,
  eps = 1e-4) {
  const res: { x: number, y: number, t1: number, t2: number }[] = [];
  intersectFn(
    [
      { x: ax1, y: ay1 },
      { x: ax2, y: ay2 },
      { x: ax3, y: ay3 },
    ], [
      { x: bx1, y: by1 },
      { x: bx2, y: by2 },
    ],
    eps, res,
  );
  return res;
}

export function intersectBezier3Line(
  ax1: number, ay1: number, ax2: number, ay2: number, ax3: number, ay3: number, ax4: number, ay4: number,
  bx1: number, by1: number, bx2: number, by2: number,
  eps = 1e-4) {
  const res: { x: number, y: number, t1: number, t2: number }[] = [];
  intersectFn(
    [
      { x: ax1, y: ay1 },
      { x: ax2, y: ay2 },
      { x: ax3, y: ay3 },
      { x: ax4, y: ay4 },
    ], [
      { x: bx1, y: by1 },
      { x: bx2, y: by2 },
    ],
    eps, res,
  );
  return res;
}

/**
 * 3d直线交点，允许误差，传入4个顶点坐标
 * limitToFiniteSegment可传0、1、2、3，默认0是不考虑点是否在传入的顶点组成的线段上
 * 1为限制在p1/p2线段，2为限制在p3/p4线段，3为都限制
 */
export function intersectLineLine3(p1: Point3, p2: Point3, p3: Point3, p4: Point3, limitToFiniteSegment = 0, tolerance = 1e-9) {
  const p13 = subtractPoint(p1, p3);
  const p43 = subtractPoint(p4, p3);
  const p21 = subtractPoint(p2, p1);
  const d1343 = p13.x * p43.x + p13.y * p43.y + p13.z * p43.z;
  const d4321 = p43.x * p21.x + p43.y * p21.y + p43.z * p21.z;
  const d1321 = p13.x * p21.x + p13.y * p21.y + p13.z * p21.z;
  const d4343 = p43.x * p43.x + p43.y * p43.y + p43.z * p43.z;
  const d2121 = p21.x * p21.x + p21.y * p21.y + p21.z * p21.z;
  const denom = d2121 * d4343 - d4321 * d4321;
  if (Math.abs(denom) < tolerance) {
    return;
  }
  const numer = d1343 * d4321 - d1321 * d4343;
  const mua = numer / denom;
  const mub = (d1343 + d4321 * mua) / d4343;
  const pa = {
    x: p1.x + mua * p21.x,
    y: p1.y + mua * p21.y,
    z: p1.z + mua * p21.z,
  };
  const pb = {
    x: p3.x + mub * p43.x,
    y: p3.y + mub * p43.y,
    z: p3.z + mub * p43.z,
  };
  const distance = distanceTo(pa, pb);
  if (distance > tolerance) {
    return;
  }
  const intersectPt: any = divide(addPoint(pa, pb), 2);
  if (!limitToFiniteSegment) {
    return intersectPt;
  }
  let paramA = closestParam(intersectPt, p1, p2);
  let paramB = closestParam(intersectPt, p3, p4);
  if (paramA < 0 && Math.abs(paramA) < 1e-9) {
    paramA = 0;
  }
  else if (paramA > 1 && paramA - 1 < 1e-9) {
    paramA = 1;
  }
  if (paramB < 0 && Math.abs(paramB) < 1e-9) {
    paramB = 0;
  }
  else if (paramB > 1 && paramB - 1 < 1e-9) {
    paramB = 1;
  }
  intersectPt.pa = paramA;
  intersectPt.pb = paramB;
  if (limitToFiniteSegment === 1 && paramA >= 0 && paramA <= 1) {
    return intersectPt;
  }
  if (limitToFiniteSegment === 2 && paramB >= 0 && paramB <= 1) {
    return intersectPt;
  }
  if (limitToFiniteSegment === 3 && paramA >= 0 && paramA <= 1 && paramB >= 0 && paramB <= 1) {
    return intersectPt;
  }
}

function subtractPoint(p1: Point3, p2: Point3) {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z,
  };
}

function distanceTo(a: Point3, b: Point3) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
}

function addPoint(a: Point3, b: Point3) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

function divide(p: Point3, t: number) {
  const n = 1 / t;
  return {
    x: p.x * n,
    y: p.y * n,
    z: p.z * n,
  };
}

function closestParam(p: Point3, from: Point3, to: Point3) {
  const startToP = subtractPoint(p, from);
  const startToEnd = subtractPoint(to, from);
  const startEnd2 = dotProduct3(startToEnd.x, startToEnd.y, startToEnd.z, startToEnd.x, startToEnd.y, startToEnd.z);
  const startEnd_startP = dotProduct3(startToEnd.x, startToEnd.y, startToEnd.z, startToP.x, startToP.y, startToP.z);
  return startEnd_startP / startEnd2;
}

/**
 * 平面相交线，传入2个平面的各3个顶点，返回2点式
 */
function intersectPlanePlane(p1: Point3, p2: Point3, p3: Point3, p4: Point3, p5: Point3, p6: Point3) {
  const v1 = unitize3(
    p2.x - p1.x,
    p2.y - p1.y,
    p2.z - p1.z,
  ), v2 = unitize3(
    p3.x - p1.x,
    p3.y - p1.y,
    p3.z - p1.z,
  ), v4 = unitize3(
    p5.x - p4.x,
    p5.y - p4.y,
    p5.z - p4.z,
  ), v5 = unitize3(
    p6.x - p4.x,
    p6.y - p4.y,
    p6.z - p4.z,
  );
  const t1 = crossProduct3(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
  const v3 = unitize3(t1.x, t1.y, t1.z);
  const t2 = crossProduct3(v4.x, v4.y, v4.z, v5.x, v5.y, v5.z);
  const v6 = unitize3(t2.x, t2.y, t2.z);
  if (isParallel3(v3.x, v3.y, v3.z, v6.x, v6.y, v6.z)) {
    return null;
  }
  const normal = crossProduct3(v6.x, v6.y, v6.z, v3.x, v3.y, v3.z);
  const p7 = addPoint(v1, v4);
  // planeC
  const v9 = unitize3(normal.x, normal.y, normal.z);
  // 3平面相交
  const a1 = v3.x, b1 = v3.y, c1 = v3.z, d1 = -a1 * p1.x - b1 * p1.y - c1 * p1.z;
  const a2 = v6.x, b2 = v6.y, c2 = v6.z, d2 = -a2 * p4.x - b2 * p4.y - c2 * p4.z;
  const a3 = v9.x, b3 = v9.y, c3 = v9.z, d3 = -a3 * p7.x - b3 * p7.y - c3 * p7.z;
  const mb = [-d1, -d2, -d3];
  const det = a1 * (b2 * c3 - c2 * b3) - b1 * (a2 * c3 - c2 * a3) + c1 * (a2 * b3 - b2 * a3);
  if (Math.abs(det) < 1e-9) {
    return null;
  }
  const invDet = 1 / det;
  const v11 = invDet * (b2 * c3 - c2 * b3);
  const v12 = invDet * (c1 * b3 - b1 * c3);
  const v13 = invDet * (b1 * c2 - c1 * b2);
  const v21 = invDet * (c2 * a3 - a2 * c3);
  const v22 = invDet * (a1 * c3 - c1 * a3);
  const v23 = invDet * (c1 * a2 - a1 * c2);
  const v31 = invDet * (a2 * b3 - b2 * a3);
  const v32 = invDet * (b1 * a3 - a1 * b3);
  const v33 = invDet * (a1 * b2 - b1 * a2);
  const x = v11 * mb[0] + v12 * mb[1] + v13 * mb[2];
  const y = v21 * mb[0] + v22 * mb[1] + v23 * mb[2];
  const z = v31 * mb[0] + v32 * mb[1] + v33 * mb[2];
  const point = { x, y, z };
  return [
    point,
    addPoint(point, v9),
  ];
}

// 点是否在线段上，注意误差
function pointOnLine3(p: Point3, p1: Point3, p2: Point3) {
  const v1x = p1.x - p.x, v1y = p1.y - p.y, v1z = p1.z - p.z;
  const v2x = p2.x - p.x, v2y = p2.y - p.y, v2z = p2.z - p.z;
  const c = crossProduct3(v1x, v1y, v1z, v2x, v2y, v2z);
  return length3(c.x, c.y, c.z) < 1e-9;
}

export default {
  intersectLineLine,
  intersectBezier2Line, // 二阶贝塞尔曲线 与 直线
  intersectBezier3Line, // 三阶贝塞尔曲线 与 直线
  intersectBezier2Bezier2, // 二阶贝塞尔曲线 与 二阶贝塞尔曲线
  intersectBezier3Bezier3, // 三阶贝塞尔曲线 与 三阶贝塞尔曲线
  intersectBezier2Bezier3, // 二阶贝塞尔曲线 与 三阶贝塞尔曲线
  intersectLineLine3,
  intersectPlanePlane,
  pointOnLine3,
}
