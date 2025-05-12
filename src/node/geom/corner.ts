import { ComputedPoint } from '../../format';
import { CURVE_MODE } from '../../style/define';
import { bezierLength, bezierSlope, getPointByT, getPointT } from '../../math/bezier';
import { getRoots } from '../../math/equation';
import { crossProduct, unitize } from '../../math/vector';
import { angleBySides, isRectsOverlap, pointsDistance } from '../../math/geom';
import isec from '../../math/isec';

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

export function isCornerPoint(point: ComputedPoint) {
  return (point.curveMode === CURVE_MODE.STRAIGHT || point.curveMode === CURVE_MODE.NONE)
    && point.cornerRadius > 0;
}

export function getStraight(prevPoint: ComputedPoint, point: ComputedPoint, nextPoint: ComputedPoint,
                            isPrevCorner: boolean, isNextCorner: boolean, radius: number) {
  // 2直线边长，ABC3个点，A是prev，B是curr，C是next
  const lenAB = pointsDistance(
    prevPoint.absX,
    prevPoint.absY,
    point.absX,
    point.absY,
  );
  const lenBC = pointsDistance(
    point.absX,
    point.absY,
    nextPoint.absX,
    nextPoint.absY,
  );
  const lenAC = pointsDistance(
    prevPoint.absX,
    prevPoint.absY,
    nextPoint.absX,
    nextPoint.absY,
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
  const px = prevPoint.absX - point.absX,
    py = prevPoint.absY - point.absY;
  const pv = unitize(px, py);
  const nx = nextPoint.absX - point.absX,
    ny = nextPoint.absY - point.absY;
  const nv = unitize(nx, ny);
  // 相切的点
  const prevTangent = { x: pv.x * dist, y: pv.y * dist };
  prevTangent.x += point.absX;
  prevTangent.y += point.absY;
  const nextTangent = { x: nv.x * dist, y: nv.y * dist };
  nextTangent.x += point.absX;
  nextTangent.y += point.absY;
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

export function getCurve(prevPoint: ComputedPoint, point: ComputedPoint, nextPoint: ComputedPoint,
                         isPrevCorner: boolean, isNextCorner: boolean, radius: number) {
  // 半径限制，如果相邻也是圆角，则最大为两点距离的一半
  if (isPrevCorner) {
    const d = Math.sqrt(Math.pow(point.absX - prevPoint.absX, 2) + Math.pow(point.absY - prevPoint.absY, 2));
    radius = Math.min(radius, d * 0.5);
  }
  if (isNextCorner) {
    const d = Math.sqrt(Math.pow(point.absX - nextPoint.absX, 2) + Math.pow(point.absY - nextPoint.absY, 2));
    radius = Math.min(radius, d * 0.5);
  }
  /**
   * 前顶点-当前顶点-后顶点，组成的夹角或时钟序，先记下clockVert，后续法线上求点有2个解需用到择取正确的。
   * 一般情况下，假设前在左后在右中在上，这个向量会是个逆时针，其它情况可能会不一样，后续都以此为假设解说。
   * 除此之外，前控制点-当前顶点-后控制点的时钟序也需记录clockCtrl，一般情况下会和clockVert一致，
   * 但是当2个控制点连线超过中顶点上方时，会变成反向，这种情况也需记录识别记录。
   * 然后再记录前控制点-当前顶点-前顶点的时钟序clockPrev，后控制点相同，辨别控制点是否越过自身边线。
   */
  const x1 = prevPoint.absFx - point.absX;
  const y1 = prevPoint.absFy - point.absY;
  const x2 = nextPoint.absTx - point.absX;
  const y2 = nextPoint.absTy - point.absY;
  const x3 = prevPoint.absX - point.absX;
  const y3 = prevPoint.absY - point.absY;
  const x4 = nextPoint.absX - point.absX;
  const y4 = nextPoint.absY - point.absY;
  const clockCtrl = crossProduct(x1, y1, x2, y2);
  const clockVert = crossProduct(x3, y3, x4, y4);
  const clockPrev = crossProduct(x1, y1, x3, y3);
  const clockNext = crossProduct(x2, y2, x4, y4);
  // 控制点和顶点几乎是一条线，无法形成圆角
  if (Math.abs(clockCtrl) < 1e-6) {
    return;
  }
  const prev = [
    { x: prevPoint.absX, y: prevPoint.absY },
    { x: prevPoint.absFx ?? prevPoint.absX, y: prevPoint.absFy ?? prevPoint.absY },
    { x: point.absX, y: point.absY },
  ];
  const next = [
    { x: point.absX, y: point.absY },
    { x: nextPoint.absTx ?? nextPoint.absX, y: nextPoint.absTy ?? nextPoint.absY },
    { x: nextPoint.absX, y: nextPoint.absY },
  ];
  // 2曲线交点数，需排除顶点
  const its = isec.intersectBezier2Bezier2(
    prev[0].x, prev[0].y, prev[1].x, prev[1].y, prev[2].x, prev[2].y,
    next[0].x, next[0].y, next[1].x, next[1].y, next[2].x, next[2].y,
  ).filter(item => {
    return item.x !== next[0].x && item.y !== next[0].y;
  }).sort((a, b) => {
    if (a.t1 === b.t1) {
      return b.t2 - a.t2;
    }
    return b.t1 - a.t1;
  });
  const count = its.length;
  // 无交点直接求
  if (!count) {
    return getNormalLineIsec(prev, next, point,
      count, false,
      clockCtrl, clockVert, clockPrev, clockNext,
      radius, 0, 1, 0, 1);
  }
  // 有交点求相对于2曲线的t值，防止精度计算问题找不到
  const prevTs = its.map(item => item.t1);
  const nextTs = its.map(item => getPointT(next, item.x, item.y)[0]);
  if (nextTs.find((item) => item === undefined)) {
    return;
  }
  // 曲线有交点则需先从最近的区域开始查找，每经过一个交点区域将查表结果反向重置
  let isReversed = false;
  prevTs.unshift(1);
  prevTs.push(0);
  nextTs.unshift(0);
  nextTs.push(1);
  for (let i = 0; i <= count; i++) {
    const res = getNormalLineIsec(prev, next, point,
      count, isReversed,
      clockCtrl, clockVert, clockPrev, clockNext,
      radius, prevTs[i + 1], prevTs[i], nextTs[i], nextTs[i + 1]);
    if (res) {
      return res;
    }
    isReversed = !isReversed;
  }
}

// 限定(t1, t2]范围内，求出法线交点为圆心，切点为曲线拟合端点
function getNormalLineIsec(
  prev: XY[], next: XY[], point: ComputedPoint,
  count: number, isReversed: boolean,
  clockCtrl: number, clockVert: number, clockPrev: number, clockNext: number,
  radius: number, t1: number, t2: number, t3: number, t4: number,
) {
  // 离散求得2条法线的端点轨迹，很多细小的线段组成
  const prevPts = getDispersedSegs(prev, count, isReversed,
    clockCtrl, clockVert, clockPrev,
    radius, true, t1, t2);
  const nextPts = getDispersedSegs(next, count, isReversed,
    clockCtrl, clockVert, clockNext,
    radius, false, t3, t4);
  // 无解或半径不满足等忽略
  if (!prevPts || prevPts.length < 2 || !nextPts || nextPts.length < 2) {
    return;
  }
  const res = intersectPolylinePolyline(prevPts, nextPts);
  // 可能有多个解，取离当前顶点最近的那个
  if (res.length) {
    let center = res[0];
    if (res.length > 1) {
      let d = Math.pow(point.absX - center.x, 2) + Math.pow(point.absY - center.y, 2);
      for (let i = 1, len = res.length; i < len; i++) {
        const item = res[i];
        const di = Math.pow(point.absX - item.x, 2) + Math.pow(point.absY - item.y, 2);
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
    let x = (nextB - prevB) / (prevK - nextK);
    let y = prevK * x + prevB;
    if (Math.abs(prevK) < 1e-9) {
      y = prevTangent.y;
      if (nextK === Infinity || nextK === -Infinity) {
        x = nextTangent.x;
      }
    }
    else if (Math.abs(nextK) < 1e-9) {
      y = nextTangent.y;
      if (prevK === Infinity || prevK === -Infinity) {
        x = prevTangent.x;
      }
    }
    else if (prevK === Infinity || prevK === -Infinity) {
      x = prevTangent.x;
      y = nextTangent.y;
    }
    else if (nextK === Infinity || nextK === -Infinity) {
      x = nextTangent.x;
      y = prevTangent.y;
    }
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

/**
 * 查表，顶点时钟序（顺0逆1）、控制点时钟序、前/后（0/1)，边线时钟序，交点个数（0-3）
 */
const TABLE: Record<string, 0 | 1> = {
  '11010': 1,
  '11000': 1,
  '11110': 1,
  '11100': 1,
  '11001': 1,
  '11111': 1,
  '11012': 1,
  '11002': 1,
  '11112': 1,
  '11102': 1,
  '11013': 1,
  '11103': 1,
  '10010': 0,
  '10100': 0,
  '10011': 0,
  '10001': 0,
  '10111': 0,
  '10101': 0,
  '00010': 0,
  '00000': 0,
  '00110': 0,
  '00100': 0,
  '00011': 0,
  '00101': 0,
  '00002': 0,
  '00012': 0,
  '00102': 0,
  '00112': 0,
  '00003': 0,
  '00103': 0,
  '01000': 1,
  '01110': 1,
  '01001': 1,
  '01011': 1,
  '01101': 1,
  '01111': 1,
};

// 已知2阶曲线，法线半径长度，求出法线拟合点轨迹
function getDispersedSegs(
  points: { x: number, y: number }[], count: number, isReversed: boolean,
  clockCtrl: number, clockVert: number, clockEdge: number,
  r: number, isPrev: boolean, t1: number, t2: number) {
  const key = (clockVert >= 0 ? '0' : '1') +
    (clockCtrl >= 0 ? '0' : '1') +
    (isPrev ? '0' : '1') +
    (clockEdge >= 0 ? '0' : '1') + count;
  // 有的情况无解查不到
  if (!TABLE.hasOwnProperty(key)) {
    return;
  }
  const len = Math.ceil(bezierLength(points));
  const pts: XY[] = [];
  // 约为每1px的线段
  for (let i = 0; i <= len; i++) {
    const t = i / len;
    // 有交点多区域时限定
    if (t <= t1 || t > t2) {
      continue;
    }
    // 求切点和切线方向
    const tangentX = 2 * (points[0].x - 2 * points[1].x + points[2].x) * t + 2 * points[1].x - 2 * points[0].x;
    const tangentY = 2 * (points[0].y - 2 * points[1].y + points[2].y) * t + 2 * points[1].y - 2 * points[0].y;
    const tg = getPointByT(points, t);
    const slop = bezierSlope(points, t);
    let k = 0;
    if (Math.abs(slop) < 1e-12) {
      k = Infinity;
    }
    else if (slop === Infinity || slop === -Infinity) {
      k = 0;
    }
    else {
      k = -1 / slop;
    }
    let b: number;
    // 特殊的竖线，原本则是水平线k为0，记录原本的b
    if (k === Infinity) {
      b = tg.y;
    }
    else {
      b = tg.y - k * tg.x;
    }
    // 点斜式求法线上距离r的解，一定仅有2个解
    let xs: number[], ys: number[];
    if (k === Infinity) {
      xs = [tg.x, tg.x];
      ys = [tg.y - r, tg.y + r];
    }
    else {
      xs = getRoots([
        Math.pow(tg.x, 2) + Math.pow(b, 2) - 2 * tg.y * b + Math.pow(tg.y, 2) - Math.pow(r, 2),
        2 * (b * k - tg.x - tg.y * k),
        Math.pow(k, 2) + 1,
      ]);
      ys = xs.map(x => k * x + b);
    }
    // 判断2个解中哪个在图形内部，即随便找一个解，用这个点和曲线上的点形成的直线，和切线做时钟序，查表对比
    const x1 = xs[0] - tg.x;
    const y1 = ys[0] - tg.y;
    let clock = crossProduct(x1, y1, tangentX, tangentY) >= 0 ? 0 : 1;
    // 2曲线有节点时每经过一个交点区域设置反向
    if (isReversed) {
      clock = (clock + 1) % 2;
    }
    if (TABLE[key] === clock) {
      pts.push({ x: xs[0], y: ys[0], t });
    }
    else {
      pts.push({ x: xs[1], y: ys[1], t });
    }
  }
  // console.table(pts.map(item => [item.t, item.x, item.y]))
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
  }
  else {
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
      x1,
      y1,
      x2,
      y2,
      bbox,
      belong,
      isVisited: false,
      isDeleted: false,
      t: (t1! + t2!) * 0.5,
    });
  }
  return res;
}
