import { Point } from '../../format';
import { CURVE_MODE } from '../../style/define';
import { bezierLength, bezierSlope, getPointByT } from '../../math/bezier';
import { getRoots } from '../../math/equation';
import { crossProduct, unitize } from '../../math/vector';
import { angleBySides, pointsDistance, isRectsOverlap } from '../../math/geom';

export type XY = {
  x: number;
  y: number;
  t?: number;
};

type CENTER = XY & {
  t1: number;
  t2: number;
};

type Seg = {
  id: number;
  t: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  bbox: number[],
  belong: number;
  isVisited: boolean;
  isDeleted: boolean;
};

export function isCornerPoint(point: Point) {
  return point.curveMode === CURVE_MODE.STRAIGHT && point.cornerRadius > 0;
}

export function getStraight(prevPoint: Point, point: Point, nextPoint: Point,
                            isPrevCorner: boolean, isNextCorner: boolean, radius: number) {
  // 2直线边长，ABC3个点，A是prev，B是curr，C是next
  const lenAB = pointsDistance(
    prevPoint.absX!,
    prevPoint.absY!,
    point.absX!,
    point.absY!,
  );
  const lenBC = pointsDistance(
    point.absX!,
    point.absY!,
    nextPoint.absX!,
    nextPoint.absY!,
  );
  const lenAC = pointsDistance(
    prevPoint.absX!,
    prevPoint.absY!,
    nextPoint.absX!,
    nextPoint.absY!,
  );
  // 三点之间的夹角
  const radian = angleBySides(lenAC, lenAB, lenBC);
  // 计算切点距离
  const tangent = Math.tan(radian * 0.5);
  let dist = radius / tangent;
  // 校准 dist，用户设置的 cornerRadius 可能太大，而实际显示 cornerRadius 受到 AB BC 两边长度限制。
  // 如果 B C 端点设置了 cornerRadius，可用长度减半
  const minDist = Math.min(
    isPrevCorner ? lenAB * 0.5 : lenAB,
    isNextCorner ? lenBC * 0.5 : lenBC,
  );
  if (dist > minDist) {
    dist = minDist;
    radius = dist * tangent;
  }
  // 方向向量
  const px = prevPoint.absX! - point.absX!,
    py = prevPoint.absY! - point.absY!;
  const pv = unitize(px, py);
  const nx = nextPoint.absX! - point.absX!,
    ny = nextPoint.absY! - point.absY!;
  const nv = unitize(nx, ny);
  // 相切的点
  const prevTangent = { x: pv.x * dist, y: pv.y * dist };
  prevTangent.x += point.absX!;
  prevTangent.y += point.absY!;
  const nextTangent = { x: nv.x * dist, y: nv.y * dist };
  nextTangent.x += point.absX!;
  nextTangent.y += point.absY!;
  // 计算 cubic handler 位置
  const kappa = (4 / 3) * Math.tan((Math.PI - radian) / 4);
  const prevHandle = {
    x: pv.x * -radius * kappa,
    y: pv.y * -radius * kappa,
  };
  prevHandle.x += prevTangent.x;
  prevHandle.y += prevTangent.y;
  const nextHandle = {
    x: nv.x * -radius * kappa,
    y: nv.y * -radius * kappa,
  };
  nextHandle.x += nextTangent.x;
  nextHandle.y += nextTangent.y;
  return {
    prevTangent,
    prevHandle,
    nextTangent,
    nextHandle,
  };
}

export function getCurve(prevPoint: Point, point: Point, nextPoint: Point,
                         isPrevCorner: boolean, isNextCorner: boolean, radius: number) {
  // 前控制点-当前顶点-后控制点，组成的夹角或时钟序，先记下，后续法线上求点有2个解需用到择取正确的
  const x1 = point.absX! - prevPoint.absFx!;
  const y1 = point.absY! - prevPoint.absFy!;
  const x2 = nextPoint.absTx! - point.absX!;
  const y2 = nextPoint.absTy! - point.absY!;
  const clock = crossProduct(x1, y1, x2, y2);
  const prev = [
    { x: prevPoint.absX!, y: prevPoint.absY! },
    { x: prevPoint.absFx!, y: prevPoint.absFy! },
    { x: point.absX!, y: point.absY! },
  ];
  const prevPts = getDispersedSegs(prev, x1, y1, x2, y2, clock, radius, false);
  const next = [
    { x: point.absX!, y: point.absY! },
    { x: nextPoint.absTx!, y: nextPoint.absTy! },
    { x: nextPoint.absX!, y: nextPoint.absY! },
  ];
  const nextPts = getDispersedSegs(next, x1, y1, x2, y2, clock, radius, true);
  const res = intersectPolylinePolyline(prevPts, nextPts);
  // 可能有多个解，取离当前顶点最近的那个
  if (res.length) {
    let center = res[0];
    if (res.length > 1) {
      let d = Math.pow(point.absX! - center.x, 2) + Math.pow(point.absY! - center.y, 2);
      for (let i = 1, len = res.length; i < len; i++) {
        const item = res[i];
        const di = Math.pow(point.absX! - item.x, 2) + Math.pow(point.absY! - item.y, 2);
        if (di < d) {
          center = item;
          d = di;
        }
      }
    }
    // 相切的点，以及切线，点斜式，再求切线交点
    const prevTangent = getPointByT(prev, center.t1);
    const nextTangent = getPointByT(next, center.t2);
    const prevK = bezierSlope(prev, center.t1);
    const nextK = bezierSlope(next, center.t2);
    const prevB = prevTangent.y - prevK * prevTangent.x;
    const nextB = nextTangent.y - nextK * nextTangent.x;
    const x = (nextB - prevB) / (prevK - nextK);
    const y = prevK * x + prevB;
    // 剩下的和直线圆角一样，只是顶点变成了新的
    const lenAB = pointsDistance(
      prevTangent.x,
      prevTangent.y,
      x,
      y,
    );
    const lenBC = pointsDistance(
      x,
      y,
      nextTangent.x,
      nextTangent.y,
    );
    const lenAC = pointsDistance(
      prevTangent.x,
      prevTangent.y,
      nextTangent.x,
      nextTangent.y,
    );
    const radian = angleBySides(lenAC, lenAB, lenBC);
    const kappa = (4 / 3) * Math.tan((Math.PI - radian) / 4);
    // 方向向量
    const px = prevTangent.x - x,
      py = prevTangent.y - y;
    const pv = unitize(px, py);
    const nx = nextTangent.x - x,
      ny = nextTangent.y - y;
    const nv = unitize(nx, ny);
    const prevHandle = {
      x: pv.x * -radius * kappa,
      y: pv.y * -radius * kappa,
    };
    prevHandle.x += prevTangent.x;
    prevHandle.y += prevTangent.y;
    const nextHandle = {
      x: nv.x * -radius * kappa,
      y: nv.y * -radius * kappa,
    };
    nextHandle.x += nextTangent.x;
    nextHandle.y += nextTangent.y;
    return {
      prevTangent,
      prevHandle,
      nextTangent,
      nextHandle,
      t1: center.t1,
      t2: center.t2,
    };
  }
}

// 已知2阶曲线，法线半径长度，求出法线拟合点轨迹
function getDispersedSegs(
  points: { x: number, y: number }[],
  x1: number, y1: number, x2: number, y2: number, clock: number,
  r: number, isReversed: boolean) {
  const len = Math.ceil(bezierLength(points));
  // 注意方向
  const point = isReversed ? points[0] : points[2];
  const pts: XY[] = [];
  // 约为每1px的线段
  for (let i = 0; i <= len; i++) {
    const t = i / len;
    const tg = getPointByT(points, t);
    const slop = bezierSlope(points, t);
    let k = 0;
    if (Math.abs(slop) < 1e-12) {
      k = Infinity;
    } else if (slop === Infinity || slop === -Infinity) {
      k = 0;
    } else {
      k = -1 / slop;
    }
    let b: number;
    // 特殊的竖线，原本则是水平线k为0，记录原本的b
    if (k === Infinity) {
      b = tg.y;
    } else {
      b = tg.y - k * tg.x;
    }
    // 点斜式求法线上距离r的解
    let xs: number[], ys: number[];
    if (k === Infinity) {
      xs = [0, 0];
      ys = [tg.y - r, tg.y + r];
    } else {
      xs = getRoots([
        Math.pow(tg.x, 2) + Math.pow(b, 2) - 2 * tg.y * b + Math.pow(tg.y, 2) - Math.pow(r, 2),
        2 * (b * k - tg.x - tg.y * k),
        Math.pow(k, 2) + 1,
      ]);
      ys = xs.map(x => k * x + b);
    }
    for (let j = 0; j < xs.length; j++) {
      const x = xs[j];
      const y = ys[j];
      // 前控制点-当前顶点-圆心点的时钟序和前面夹角时钟序一致（反向圆形点-当前顶点-后控制点）
      const x3 = (x - point.x) * (isReversed ? -1 : 1);
      const y3 = (y - point.y) * (isReversed ? -1 : 1);
      const c1 = isReversed ? crossProduct(x3, y3, x2, y2) : crossProduct(x1, y1, x3, y3);
      if (clock > 0 && c1 > 0 || clock < 0 && c1 < 0) {
        // 有可能2个解都一致（半径很小的情况），再加上切点-当前顶点-圆心点的时钟序判断（反向圆心点-当前顶点-切点），注意顶点特殊叉乘为0
        const x4 = (point.x - tg.x) * (isReversed ? -1 : 1);
        const y4 = (point.y - tg.y) * (isReversed ? -1 : 1);
        const c2 = isReversed ? crossProduct(x3, y3, x4, y4) : crossProduct(x4, y4, x3, y3);
        if (clock > 0 && c2 > 0 || clock < 0 && c2 < 0 || !c2 && t === (isReversed ? 0 : 1)) {
          pts.push({ x, y, t });
          break;
        }
      }
    }
  }
  return pts;
}

// 2条折线交点，Bentley-Ottmann简化版，折线一定不自交、不重合，相交后不会重复再交，只需求交点无需拆分交线
function intersectPolylinePolyline(pa: XY[], pb: XY[]) {
  const segs1 = convert2Seg(pa, 0);
  const segs2 = convert2Seg(pb, 1);
  const list = genHashXList(segs1.concat(segs2));
  const ael: Seg[] = [],
    delList: Seg[] = [];
  const res: CENTER[] = [];
  while (list.length) {
    if (delList.length) {
      delList.splice(0).forEach((seg) => {
        const i = ael.indexOf(seg);
        ael.splice(i, 1);
      });
    }
    const { arr } = list.shift()!;
    while (arr.length) {
      const seg = arr.shift()!;
      // 相交过一次忽略
      if (seg.isDeleted) {
        continue;
      }
      const belong = seg.belong,
        bboxA = seg.bbox;
      // 第2次访问边是离开活动，考虑删除
      if (seg.isVisited) {
        delList.push(seg);
      }
      // 第1次访问边一定是进入活动，求交
      else {
        if (ael.length) {
          const { x1: ax1, y1: ay1, x2: ax2, y2: ay2, bbox: bboxB } = seg;
          for (let i = 0; i < ael.length; i++) {
            const item = ael[i];
            // 被切割的老线段无效，注意seg切割过程中可能变成删除
            if (item.isDeleted || seg.isDeleted) {
              continue;
            }
            // 必须来自对方才求交
            if (item.belong === belong) {
              continue;
            }
            // bbox相交才考虑真正计算，加速
            const { x1: bx1, y1: by1, x2: bx2, y2: by2 } = item;
            if (isRectsOverlap(
              bboxA[0],
              bboxA[1],
              bboxA[2],
              bboxA[3],
              bboxB[0],
              bboxB[1],
              bboxB[2],
              bboxB[3],
              true,
              )) {
              const d =
                (by2 - by1) * (ax2 - ax1) - (bx2 - bx1) * (ay2 - ay1);
              if (d !== 0) {
                const toSource = ((bx2 - bx1) * (ay1 - by1) - (by2 - by1) * (ax1 - bx1)) / d;
                const toClip = ((ax2 - ax1) * (ay1 - by1) - (ay2 - ay1) * (ax1 - bx1)) / d;
                // 非顶点相交才是真相交
                if (
                  toSource >= 0 &&
                  toSource <= 1 &&
                  toClip >= 0 &&
                  toClip <= 1
                ) {
                  const x = ax1 + toSource * (ax2 - ax1);
                  const y = ay1 + toSource * (ay2 - ay1);
                  res.push({ x, y, t1: belong === 0 ? seg.t : item.t, t2: belong === 0 ? item.t : seg.t });
                  seg.isDeleted = true;
                  break;
                }
              }
            }
          }
        }
        // 不相交切割才进入ael
        if (!seg.isDeleted) {
          ael.push(seg);
          seg.isVisited = true;
        }
      }
    }
  }
  return res;
}

function genHashXList(segs: Seg[]) {
  const hashX: any = {};
  segs.forEach(seg => {
    let { x1: min, x2: max } = seg;
    if (min > max) {
      [min, max] = [max, min];
    }
    putHashX(hashX, min, seg);
    putHashX(hashX, max, seg);
  });
  const list: { x: number; arr: Seg[] }[] = [];
  Object.keys(hashX).forEach((x) =>
    list.push({
      x: parseFloat(x),
      arr: hashX[x],
    }),
  );
  return list.sort(function (a, b) {
    return a.x - b.x;
  });
}

function putHashX(hashX: any, x: number, seg: Seg) {
  const list = (hashX[x] = hashX[x] || []);
  if (seg.isVisited) {
    list.unshift(seg);
    seg.isVisited = false;
  } else {
    list.push(seg);
    seg.isVisited = true;
  }
}

let uuid = 0;
function convert2Seg(ps: XY[], belong: number) {
  const res: Seg[] = [];
  for (let i = 1, len = ps.length; i < len; i++) {
    let { x: x1, y: y1, t: t1 } = ps[i - 1];
    let { x: x2, y: y2, t: t2 } = ps[i];
    // x/y从小到大
    if (x2 < x1 || x1 === x2 && y2 < y1) {
      [x1, x2] = [x2, x1];
      [y1, y2] = [y2, y1];
    }
    const bbox = [
      x1,
      Math.min(y1, y2),
      x2,
      Math.max(y1, y2),
    ];
    res.push({
      id: uuid++,
      t: (t1! + t2!) * 0.5,
      x1,
      y1,
      x2,
      y2,
      bbox,
      belong,
      isVisited: false,
      isDeleted: false,
    });
  }
  return res;
}
