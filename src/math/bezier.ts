import { getRoots, lineSlope, pointSlope2General, twoPoint2General } from './equation';
import { includedAngle } from './vector';

/**
 * 二阶贝塞尔曲线范围框
 * @param x0
 * @param y0
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @returns {number[]}
 * https://www.iquilezles.org/www/articles/bezierbbox/bezierbbox.htm
 */
export function bboxBezier2(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
  let minX = Math.min(x0, x2);
  let minY = Math.min(y0, y2);
  let maxX = Math.max(x0, x2);
  let maxY = Math.max(y0, y2);
  // 控制点位于边界内部时，边界就是范围框，否则计算导数获取极值
  if (x1 < minX || y1 < minY || x1 > maxX || y1 > maxY) {
    let tx = (x0 - x1) / (x0 - 2 * x1 + x2);
    if (isNaN(tx) || tx < 0) {
      tx = 0;
    }
    else if (tx > 1) {
      tx = 1;
    }
    let ty = (y0 - y1) / (y0 - 2 * y1 + y2);
    if (isNaN(ty) || ty < 0) {
      ty = 0;
    }
    else if (ty > 1) {
      ty = 1;
    }
    const sx = 1 - tx;
    const sy = 1 - ty;
    const qx = sx * sx * x0 + 2 * sx * tx * x1 + tx * tx * x2;
    const qy = sy * sy * y0 + 2 * sy * ty * y1 + ty * ty * y2;
    minX = Math.min(minX, qx);
    minY = Math.min(minY, qy);
    maxX = Math.max(maxX, qx);
    maxY = Math.max(maxY, qy);
  }
  return [minX, minY, maxX, maxY];
}

/**
 * 同上三阶的
 */
export function bboxBezier3(
  x0: number | { x: number, y: number }[], y0?: number, x1?: number, y1?: number,
  x2?: number, y2?: number, x3?: number, y3?: number,
) {
  if (Array.isArray(x0)) {
    x3 = x0[3].x;
    y3 = x0[3].y;
    x2 = x0[2].x;
    y2 = x0[2].y;
    x1 = x0[1].x;
    y1 = x0[1].y;
    y0 = x0[0].y;
    x0 = x0[0].x;
  }
  let minX = Math.min(x0, x3!);
  let minY = Math.min(y0!, y3!);
  let maxX = Math.max(x0, x3!);
  let maxY = Math.max(y0!, y3!);
  // 控制点位于边界内部时，边界就是范围框，否则计算导数获取极值
  if (x1! < minX || y1! < minY || x1! > maxX || y1! > maxY || x2! < minX || y2! < minY || x2! > maxX || y2! > maxY) {
    const extremaT = bezierExtremaT(x0, y0!, x1!, y1!, x2!, y2!, x3!, y3!);
    extremaT.forEach(t => {
      const p = getPointByT([
        { x: x0, y: y0! },
        { x: x1!, y: y1! },
        { x: x2!, y: y2! },
        { x: x3!, y: y3! },
      ], t);
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
  }
  return [minX, minY, maxX, maxY];
}

export function bboxBezier(
  x0: number | { x: number, y: number }[], y0?: number, x1?: number, y1?: number,
  x2?: number, y2?: number, x3?: number, y3?: number,
) {
  let len = arguments.length;
  if (Array.isArray(x0)) {
    len = x0.length;
    if (len < 2 || len > 4) {
      throw new Error('Unsupported order');
    }
    if (len === 4) {
      return bboxBezier3(x0[0].x, x0[0].y, x0[1].x, x0[1].y, x0[2].x, x0[2].y, x0[3].x, x0[3].y);
    }
    else if (len === 3) {
      return bboxBezier2(x0[0].x, x0[0].y, x0[1].x, x0[1].y, x0[2].x, x0[2].y);
    }
    else {
      const a = Math.min(x0[0].x, x0[1].x);
      const b = Math.min(x0[0].y, x0[1].y);
      const c = Math.max(x0[0].x, x0[1].x);
      const d = Math.max(x0[0].y, x0[1].y);
      return [a, b, c, d];
    }
  }
  if (len === 4 || x2 === undefined || y2 === undefined) {
    const a = Math.min(x0, x1!);
    const b = Math.min(y0!, y1!);
    const c = Math.max(x0, x1!);
    const d = Math.max(y0!, y1!);
    return [a, b, c, d];
  }
  if (len === 6 || x3 === undefined || y3 === undefined) {
    return bboxBezier2(x0, y0!, x1!, y1!, x2!, y2!);
  }
  if (len === 8) {
    return bboxBezier3(x0, y0!, x1!, y1!, x2!, y2!, x3!, y3!);
  }
  throw new Error('Unsupported order');
}

// https://zhuanlan.zhihu.com/p/130247362
function simpson38(derivativeFunc: (n: number) => number, l: number, r: number) {
  const f = derivativeFunc;
  const middleL = (2 * l + r) / 3;
  const middleR = (l + 2 * r) / 3;
  return (f(l) + 3 * f(middleL) + 3 * f(middleR) + f(r)) * (r - l) / 8;
}

/**
 * bezier 曲线的长度
 * @param derivativeFunc 微分函数
 * @param l 左点
 * @param r 右点
 * @param eps 精度
 * @return {*} number
 */
function adaptiveSimpson38(derivativeFunc: (n: number) => number, l: number, r: number, eps = 1e-9): number {
  const f = derivativeFunc;
  const mid = (l + r) / 2;
  const st = simpson38(f, l, r);
  const sl = simpson38(f, l, mid);
  const sr = simpson38(f, mid, r);
  const ans = sl + sr - st;
  if (Math.abs(ans) <= 15 * eps) {
    return sl + sr + ans / 15;
  }
  return adaptiveSimpson38(f, l, mid, eps / 2) + adaptiveSimpson38(f, mid, r, eps / 2);
}

/**
 * bezier 曲线的长度
 * @param points 曲线的起止点 和 控制点
 * @param startT 计算长度的起点，满足 0 <= startT <= endT <= 1
 * @param endT 计算长度的终点
 * @return {*} number
 */
export function bezierLength(points: { x: number, y: number }[], startT = 0, endT = 1) {
  if (points.length === 2) {
    const { x: x0, y: y0 } = points[0];
    const { x: x1, y: y1 } = points[1];
    return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
  }
  if (points.length > 4) {
    throw new Error('Unsupported order');
  }
  const derivativeFunc = (t: number) => {
    const r = bezierAt(t, points);
    return Math.sqrt(Math.pow(r.x, 2) + Math.pow(r.y, 2));
  };
  return adaptiveSimpson38(derivativeFunc, startT, endT);
}

/**
 * 3 阶 bezier 曲线的 order 阶导数在 t 位置时候的 (x, y) 的值
 */
function bezierAt3(t: number, points: { x: number, y: number }[], order = 1) {
  const { x: x0, y: y0 } = points[0];
  const { x: x1, y: y1 } = points[1];
  const { x: x2, y: y2 } = points[2];
  const { x: x3, y: y3 } = points[3];
  let x = 0;
  let y = 0;
  // 3阶导数就是常数了，大于3阶的都是0
  if (order === 0) {
    x = Math.pow((1 - t), 3) * x0 + 3 * t * Math.pow((1 - t), 2) * x1 + 3 * (1 - t) * Math.pow(t, 2) * x2 + Math.pow(t, 3) * x3;
    y = Math.pow((1 - t), 3) * y0 + 3 * t * Math.pow((1 - t), 2) * y1 + 3 * (1 - t) * Math.pow(t, 2) * y2 + Math.pow(t, 3) * y3;
  }
  else if (order === 1) {
    x = 3 * ((1 - t) * (1 - t) * (x1 - x0) + 2 * (1 - t) * t * (x2 - x1) + t * t * (x3 - x2));
    y = 3 * ((1 - t) * (1 - t) * (y1 - y0) + 2 * (1 - t) * t * (y2 - y1) + t * t * (y3 - y2));
  }
  else if (order === 2) {
    x = 6 * (x2 - 2 * x1 + x0) * (1 - t) + 6 * (x3 - 2 * x2 + x1) * t;
    y = 6 * (y2 - 2 * y1 + y0) * (1 - t) + 6 * (y3 - 2 * y2 + y1) * t;
  }
  else if (order === 3) {
    x = 6 * (x3 - 3 * x2 + 3 * x1 - x0);
    y = 6 * (y3 - 3 * y2 + 3 * y1 - y0);
  }
  return { x, y };
}

/**
 * 2 阶 bezier 曲线的 order 阶导数在 t 位置时候的 (x, y) 的值
 */
function bezierAt2(t: number, points: { x: number, y: number }[], order = 1) {
  const { x: x0, y: y0 } = points[0];
  const { x: x1, y: y1 } = points[1];
  const { x: x2, y: y2 } = points[2];
  let x = 0;
  let y = 0;
  if (order === 0) {
    x = Math.pow((1 - t), 2) * x0 + 2 * t * (1 - t) * x1 + Math.pow(t, 2) * x2;
    y = Math.pow((1 - t), 2) * y0 + 2 * t * (1 - t) * y1 + Math.pow(t, 2) * y2;
  }
  else if (order === 1) {
    x = 2 * (1 - t) * (x1 - x0) + 2 * t * (x2 - x1);
    y = 2 * (1 - t) * (y1 - y0) + 2 * t * (y2 - y1);
  }
  else if (order === 2) {
    x = 2 * (x2 - 2 * x1 + x0);
    y = 2 * (y2 - 2 * y1 + y0);
  }
  return { x, y };
}

export function bezierAt(t: number, points: { x: number, y: number }[], derivativeOrder = 1) {
  if (points.length === 4) {
    return bezierAt3(t, points, derivativeOrder);
  }
  else if (points.length === 3) {
    return bezierAt2(t, points, derivativeOrder);
  }
  else {
    throw new Error('Unsupported order');
  }
}


// 求某一定点离贝塞尔曲线最近的一个点，segment越少性能越好但不准确。总计算量为segemnt的两倍。第一遍为找到最近点前后点2个时间，然后进一步差值计算求更准确点时间。
export function nearestPointFromPointToBezier(
  x: number,
  y: number,
  points: Array<{ x: number; y: number }>,
  segment = 20,
) {
  let delta = 1 / segment;
  let minP = { x: 0, y: 0 };
  let minDistance: number = Infinity;
  let minT = -1;
  for (let i = 0; i <= segment; i++) {
    const p = bezierAt(i * delta, points, 0);
    const distanceSq = (x - p.x) * (x - p.x) + (y - p.y) * (y - p.y);

    if (minDistance > distanceSq) {
      minDistance = distanceSq;
      minP = p;
      minT = i;
    }
  }

  const mintime = Math.max(0, (minT - 1) * delta);
  const maxtime = Math.min(1, (minT + 1) * delta);

  delta = (maxtime - mintime) / segment;
  for (let i = 0; i <= segment; i++) {
    const p = bezierAt(i * delta + mintime, points, 0);
    const distanceSq = (x - p.x) * (x - p.x) + (y - p.y) * (y - p.y);

    if (minDistance > distanceSq) {
      minDistance = distanceSq;
      minP = p;
      minT = i * delta + mintime; // 此处直接就是时间
    }
  }

  // 本质是精度问题
  if (minT > 1) {
    minT = 1 - 0.5 / segment / segment;
  }

  return {
    point: minP,
    distance: Math.sqrt(minDistance),
    time: minT,
    curve: points,
    index: -1,
  };
}

function sliceBezierS(points: { x: number, y: number }[], t: number) {
  const { x: x1, y: y1 } = points[0];
  const { x: x2, y: y2 } = points[1];
  const x12 = (x2 - x1) * t + x1;
  const y12 = (y2 - y1) * t + y1;
  if (points.length === 2) {
    return [
      { x: x1, y: y1 },
      { x: x12, y: y12 },
    ];
  }
  const { x: x3, y: y3 } = points[2];
  const x23 = (x3 - x2) * t + x2;
  const y23 = (y3 - y2) * t + y2;
  const x123 = (x23 - x12) * t + x12;
  const y123 = (y23 - y12) * t + y12;
  if (points.length === 4) {
    const { x: x4, y: y4 } = points[3];
    const x34 = (x4 - x3) * t + x3;
    const y34 = (y4 - y3) * t + y3;
    const x234 = (x34 - x23) * t + x23;
    const y234 = (y34 - y23) * t + y23;
    const x1234 = (x234 - x123) * t + x123;
    const y1234 = (y234 - y123) * t + y123;
    return [
      { x: x1, y: y1 },
      { x: x12, y: y12 },
      { x: x123, y: y123 },
      { x: x1234, y: y1234 },
    ];
  }
  else if (points.length === 3) {
    return [
      { x: x1, y: y1 },
      { x: x12, y: y12 },
      { x: x123, y: y123 },
    ];
  }
  else {
    throw new Error('Unsupported order');
  }
}

export function sliceBezier(points: { x: number, y: number }[], start = 0, end = 1) {
  start = Math.max(start, 0);
  start = Math.min(start, 1);
  end = Math.max(end, 0);
  end = Math.min(end, 1);
  let res = points.slice(0);
  if (start === 0 && end === 1) {
    return res;
  }
  const isReversed = end < start;
  if (isReversed) {
    [start, end] = [end, start];
  }
  if (end < 1) {
    res = sliceBezierS(points, end);
  }
  if (start > 0) {
    if (end < 1) {
      start = start / end;
    }
    res = sliceBezierS(res.reverse(), (1 - start)).reverse();
  }
  if (isReversed) {
    res.reverse();
  }
  return res;
}

export function getPointByT(points: { x: number, y: number }[], t = 0) {
  if (t === 0) {
    return points[0];
  }
  if (t === 1) {
    return points[points.length - 1];
  }
  if (points.length === 4) {
    return pointByT3(points, t);
  }
  else if (points.length === 3) {
    return pointByT2(points, t);
  }
  else if (points.length === 2) {
    return {
      x: points[0].x + (points[1].x - points[0].x) * t,
      y: points[0].y + (points[1].y - points[0].y) * t,
    };
  }
  else {
    throw new Error('Unsupported order');
  }
}

function pointByT2(points: { x: number, y: number }[], t: number) {
  const x = points[0].x * (1 - t) * (1 - t)
    + 2 * points[1].x * t * (1 - t)
    + points[2].x * t * t;
  const y = points[0].y * (1 - t) * (1 - t)
    + 2 * points[1].y * t * (1 - t)
    + points[2].y * t * t;
  return { x, y };
}

function pointByT3(points: { x: number, y: number }[], t: number) {
  const x = points[0].x * (1 - t) * (1 - t) * (1 - t)
    + 3 * points[1].x * t * (1 - t) * (1 - t)
    + 3 * points[2].x * t * t * (1 - t)
    + points[3].x * t * t * t;
  const y = points[0].y * (1 - t) * (1 - t) * (1 - t)
    + 3 * points[1].y * t * (1 - t) * (1 - t)
    + 3 * points[2].y * t * t * (1 - t)
    + points[3].y * t * t * t;
  return { x, y };
}


// 已知曲线和上面一点获得t
export function getPointT(points: { x: number, y: number }[], x: number, y: number, eps = 1e-9) {
  if (points.length === 4) {
    return getPointT3(points, x, y, eps);
  }
  else if (points.length === 3) {
    return getPointT2(points, x, y, eps);
  }
  else if (points.length === 2) {
    return getPointT1(points, x, y, eps);
  }
  else {
    throw new Error('Unsupported order');
  }
}

function getPointT1(points: { x: number, y: number }[], x: number, y: number, eps = 1e-9) {
  const tx = (x - points[0].x) / (points[1].x - points[0].x);
  const ty = (y - points[0].y) / (points[1].y - points[0].y);
  if (Math.abs(tx - ty) <= eps) {
    return [(tx + ty) * 0.5];
  }
  return [];
}

function getPointT2(points: { x: number, y: number }[], x: number, y: number, eps = 1e-9) {
  const tx = getT(points, x, true);
  const ty = getT(points, y, false);
  // 可能有多个解，x和y要匹配上，这里最多x和y各2个总共4个解
  let t = [];
  for (let i = 0, len = tx.length; i < len; i++) {
    const x = tx[i];
    for (let j = 0, len = ty.length; j < len; j++) {
      const y = ty[j];
      const diff = Math.abs(x - y);
      // 必须小于一定误差
      if (diff <= eps) {
        t.push({
          x,
          y,
          diff,
        });
      }
    }
  }
  t.sort(function (a, b) {
    return a.diff - b.diff;
  });
  if (t.length > 2) {
    t.splice(2);
  }
  // 取均数
  t = t.map(item => (item.x + item.y) * 0.5);
  const res: number[] = [];
  t.forEach(t => {
    const xt = bezierValue(points, t, true)!;
    const yt = bezierValue(points, t, false)!;
    // 计算误差忽略
    if (Math.abs(xt - x) <= eps && Math.abs(yt - y) <= eps) {
      res.push(t);
    }
  });
  return res;
}

function getPointT3(points: { x: number, y: number }[], x: number, y: number, eps = 1e-9) {
  const tx = getT(points, x, true);
  const ty = getT(points, y, false);
  // 可能有多个解，x和y要匹配上，这里最多x和y各3个总共9个解
  let t = [];
  for (let i = 0, len = tx.length; i < len; i++) {
    const x = tx[i];
    for (let j = 0, len = ty.length; j < len; j++) {
      const y = ty[j];
      const diff = Math.abs(x - y);
      // 必须小于一定误差
      if (diff <= eps) {
        t.push({
          x,
          y,
          diff,
        });
      }
    }
  }
  t.sort(function (a, b) {
    return a.diff - b.diff;
  });
  if (t.length > 3) {
    t.splice(3);
  }
  // 取均数
  t = t.map(item => (item.x + item.y) * 0.5);
  const res: number[] = [];
  t.forEach(t => {
    const xt = bezierValue(points, t, true)!;
    const yt = bezierValue(points, t, false)!;
    // 计算误差忽略
    if (Math.abs(xt - x) <= eps && Math.abs(yt - y) <= eps) {
      res.push(t);
    }
  });
  return res;
}


export function bezierSlope(points: { x: number, y: number }[], t = 0) {
  if (points.length === 2) {
    const { x: x1, y: y1 } = points[0];
    const { x: x2, y: y2 } = points[1];
    return lineSlope(x1, y1, x2, y2);
  }
  if (points.length === 3) {
    return bezier2Slope(points, t);
  }
  if (points.length === 4) {
    return bezier3Slope(points, t);
  }
  throw new Error('Unsupported order');
}

export function bezier2Slope(points: { x: number, y: number }[], t = 0) {
  const x = bezierDerivative(points, t, true)!;
  if (x === 0) {
    return Infinity;
  }
  return bezierDerivative(points, t, false)! / x;
}

export function bezier3Slope(points: { x: number, y: number }[], t: number) {
  const x = bezierDerivative(points, t, true)!;
  if (x === 0) {
    return Infinity;
  }
  return bezierDerivative(points, t, false)! / x;
}

export function bezierExtremaT2(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
  let tx = (x0 - x1) / (x0 - 2 * x1 + x2);
  if (isNaN(tx) || tx < 0) {
    tx = 0;
  }
  else if (tx > 1) {
    tx = 1;
  }
  let ty = (y0 - y1) / (y0 - 2 * y1 + y2);
  if (isNaN(ty) || ty < 0) {
    ty = 0;
  }
  else if (ty > 1) {
    ty = 1;
  }
  const res = [tx];
  if (ty !== tx) {
    res.push(ty);
  }
  res.sort((a, b) => a - b);
  if (res[0] > 0) {
    res.unshift(0);
  }
  if (res[res.length - 1] < 1) {
    res.push(1);
  }
  return res;
}

export function bezierExtremaT3(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  const cx = -3 * x0 + 3 * x1;
  const cy = -3 * y0 + 3 * y1;
  const bx = 6 * x0 - 12 * x1 + 6 * x2;
  const by = 6 * y0 - 12 * y1 + 6 * y2;
  const ax = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
  const ay = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
  const ex = getRoots([cx, bx, ax]).filter(i => i >=0 && i <= 1);
  const ey = getRoots([cy, by, ay]).filter(i => i >=0 && i <= 1);
  const res = ex.concat(ey);
  res.sort((a, b) => a - b);
  for (let i = res.length - 1; i > 0; i--) {
    if (res[i] === res[i - 1]) {
      res.splice(i, 1);
    }
  }
  // if (res[0] > 0) {
  //   res.unshift(0);
  // }
  // if (res[res.length - 1] < 1) {
  //   res.push(1);
  // }
  return res;
}

// 贝塞尔曲线的极值点的t，包含默认的0和1驻点，直线则默认就是[0, 1]
export function bezierExtremaT(x0: number, y0: number, x1: number, y1: number,
                               x2?: number, y2?: number, x3?: number, y3?: number) {
  const len = arguments.length;
  if (len === 4) {
    return [0, 1];
  }
  if (len === 6) {
    return bezierExtremaT2(x0, y0, x1, y1, x2!, y2!);
  }
  if (len === 8) {
    return bezierExtremaT3(x0, y0, x1, y1, x2!, y2!, x3!, y3!);
  }
  throw new Error('Unsupported order');
}

// 在t处的切线方程，返回一般式，直线就是本身
export function bezierTangent(points: { x: number, y: number }[], t = 0) {
  if (points.length === 2) {
    return twoPoint2General(points[0].x, points[0].y, points[1].x, points[1].y);
  }
  if (points.length === 3) {
    return bezierTangent2(points, t);
  }
  if (points.length === 4) {
    return bezierTangent3(points, t);
  }
  throw new Error('Unsupported order');
}

export function bezierTangent2(points: { x: number, y: number }[], t = 0) {
  const k = bezier2Slope(points, t);
  const p = pointByT2(points, t);
  return pointSlope2General(p.x, p.y, k);
}

export function bezierTangent3(points: { x: number, y: number }[], t = 0) {
  const k = bezier3Slope(points, t);
  const p = pointByT3(points, t);
  return pointSlope2General(p.x, p.y, k);
}

/**
 * 用点距累加近似法均分曲线为n段，获得均分后的点的t值
 * https://zhuanlan.zhihu.com/p/130247362
 * simpson38只适合单点精确计算长度，多点性能会呈倍增长，点距累加已经够了，性能也好
 */
export function splitBezierT(points: { x: number, y: number }[], n: number, maxIterTime = 5, length?: number) {
  if (n < 2) {
    return [];
  }
  if (points.length > 4 || points.length < 2) {
    throw new Error('Unsupported order');
  }
  // 初始化的t是平均分割的，包含首尾
  const start = points[0], end = points[points.length - 1];
  const res: Array<{ x: number; y: number; t: number }> = [{ x: start.x, y: start.y, t: 0 }];
  const per = 1 / n;
  for (let i = 1; i < n; i++) {
    const t = per * i;
    const p = getPointByT(points, t);
    res.push({
      x: p.x,
      y: p.y,
      t,
    });
  }
  res.push({
    x: end.x,
    y: end.y,
    t: 1,
  });
  // 直线
  if (points.length === 2) {
    return res;
  }
  length = length || bezierLength(points);
  const avg = length / n;
  for (let i = 0; i < maxIterTime; i++) {
    const dists: number[] = [0];
    // 1. 计算上一次迭代确定的 t 参数下，每一个采样点的位置
    for (let j = 1; j < n; j++) {
      dists[j] = Math.sqrt(Math.pow(res[j].x - res[j - 1].x, 2) + Math.pow(res[j].y - res[j - 1].y, 2));
    }
    let offset = 0;
    for (let j = 1; j < n; j++) {
      // 2. 累计近似弧长并计算误差
      const err = dists[j] - avg;
      offset += err;
      // 3. Newton's method
      const o = res[j];
      const first = bezierAt(o.t, points, 1);
      const firstOrder = Math.sqrt(Math.pow(first.x, 2) + Math.pow(first.y, 2));
      const second = bezierAt(o.t, points, 2);
      const secondOrder = Math.sqrt(Math.pow(second.x, 2) + Math.pow(second.y, 2));
      const numerator = offset * firstOrder;
      const denominator = offset * secondOrder + firstOrder * firstOrder;
      o.t = o.t - numerator / denominator;
      const p = getPointByT(points, o.t);
      o.x = p.x;
      o.y = p.y;
    }
  }
  return res;
}

// 获取曲线1阶单调性t值，有结果才返回，比如水平垂直线特例没有结果，求导看dt=0的t值
export function getBezierMonotonicityT(points: { x: number, y: number }[], isX = true, eps = 1e-9) {
  if (points.length < 3 || points.length > 4) {
    throw new Error('Unsupported order');
  }
  const p0 = isX ? points[0].x : points[0].y;
  const p1 = isX ? points[1].x : points[1].y;
  const p2 = isX ? points[2].x : points[2].y;
  if (points.length === 4) {
    const p3 = isX ? points[3].x : points[3].y;
    const t = getRoots([
      3 * p1 - 3 * p0,
      2 * (3 * p0 - 6 * p1 + 3 * p2),
      3 * (-p0 + 3 * p1 - 3 * p2 + p3),
    ]).filter((i) => i > eps&& i < 1 - eps);
    return t.sort(function (a, b) {
      return a - b;
    });
  }
  else if (points.length === 3) {
    const t = getRoots([
      2 * (p1 - p0),
      2 * (p0 - 2 * p1 + p2),
    ]).filter((i) => i > eps&& i < 1 - eps);
    return t;
  }
}

// 同上，获取2阶导凹凸性t值
export function getBezierMonotonicityT2(points: { x: number, y: number }[], isX = true, eps = 1e-9) {
  if (points.length < 3 || points.length > 4) {
    throw new Error('Unsupported order');
  }
  const p0 = isX ? points[0].x : points[0].y;
  const p1 = isX ? points[1].x : points[1].y;
  const p2 = isX ? points[2].x : points[2].y;
  if (points.length === 4) {
    const p3 = isX ? points[3].x : points[3].y;
    const t = getRoots([
        2 * (3 * p0 - 6 * p1 + 3 * p2),
        6 * (-p0 + 3 * p1 - 3 * p2 + p3),
      ])
      .filter((i) => i > eps&& i < 1 - eps);console.log(t);
    return t.sort(function (a, b) {
      return a - b;
    });
  }
  else if (points.length === 3) {
    const t = 2 * (p0 - 2 * p1 + p2);
    if (t > eps && t < 1 - eps) {
      return [t];
    }
    return [];
  }
}

/**
 * 2分步长逼近法求曲线上距离某个点p最近的对应点，实际上是求p距离曲线的距离问题
 * 先把曲线按x/y单调切割（一般情况都是单调的），分成若干段曲线
 * 再对每一段分别求解，取每一段t=0.5时作为初始t0，点为p0，求p和p0的距离d
 * 然后t0以step向两侧移动（t0+step/t0-step），获取新的距离d1/d2
 * 比较d0和d1/d2，如果d0最小，将step减半继续；如果有比d0小的（可能1个或者2个），将小的那个t值视作新t0继续
 * 直到移动距离非常小（此时曲线的bbox面积不足eps）时结束，近似解存入结果列表中
 * 由于开头切割，所以可能有多个近似解，排序返回距离最小的
 *
 * 另使用牛顿迭代来改进性能，无需指定步长（计算的），当本地迭代的点和上次迭代的点组成的bbox<eps时结束
 */
export function getPointWithDByApprox(points: { x: number, y: number }[], x: number, y: number, eps = 1e-9) {
  if (points.length < 2 || points.length > 4) {
    throw new Error('Unsupported order');
  }
  // 直线直接算
  if (points.length === 2) {
    const x1 = points[1].x - points[0].x;
    const y1 = points[1].y - points[0].y;
    const x2 = x - points[0].x;
    const y2 = y - points[0].y;
    const len1 = Math.sqrt(Math.pow(x1, 2) + Math.pow(y1, 2));
    const len2 = Math.sqrt(Math.pow(x2, 2) + Math.pow(y2, 2));
    let cos = includedAngle(x1, y1, x2, y2, true);
    let t;
    if (cos === 1) {
      t = -x2 / len1;
    }
    else if (cos === -1) {
      t = x2 / len1;
    }
    else if (cos === Infinity) {
      t = -y2 / len1;
    }
    else if (cos === -Infinity) {
      t = y2 / len1;
    }
    else {
      t = len2 * cos / len1;
    }
    let tx = x1 * t;
    let ty = y1 * t;
    tx += points[0].x;
    ty += points[0].y;
    const d = Math.sqrt(Math.pow(tx - x, 2) + Math.pow(ty - y, 2));
    return { x: tx, y: ty, d, t };
  }
  // console.error('曲线和点', points.map(item => item.x + ',' + item.y).join(' '), x, y);
  // 先单调凹凸切割，但要防止切割的结果使得曲线面积特别小，w/h<=eps，后面做
  const tx = getBezierMonotonicityT(points, true);
  const ty = getBezierMonotonicityT(points, false);
  const tx2 = getBezierMonotonicityT2(points, true);
  const ty2 = getBezierMonotonicityT2(points, false);
  const ts: number[] = [];
  if (tx) {
    ts.push(...tx);
  }
  if (ty) {
    ty.forEach((i) => {
      if (!ts.includes(i)) {
        ts.push(i);
      }
    });
  }
  if (tx2) {
    tx2.forEach((i) => {
      if (!ts.includes(i)) {
        ts.push(i);
      }
    });
  }
  if (ty2) {
    ty2.forEach((i) => {
      if (!ts.includes(i)) {
        ts.push(i);
      }
    });
  }
  // 切割过程，按照t顺序从小到大，不实际切割只记录t
  ts.sort((a, b) => a - b);
  // console.log('单调分割t', ts);
  // 分别对每一段进行牛顿迭代
  const temp: { x: number, y: number, t: number, d: number }[] = [];
  ts.forEach((t, i) => {
    if (!i) {
      const r = getEachPDByApprox(points, 0, t, x, y, eps);
      if (r !== undefined) {
        temp.push(r);
      }
    }
    const r = getEachPDByApprox(points, t, ts[i + 1] || 1, x, y, eps);
    if (r !== undefined) {
      temp.push(r);
    }
  });
  // 本身就是单调无切割则求整个
  if (!ts.length) {
    const r = getEachPDByApprox(points, 0, 1, x, y, eps);
    if (r !== undefined) {
      temp.push(r);
    }
  }
  temp.sort((a, b) => a.d - b.d);
  // console.error('最终结果', temp[0]);
  if (temp.length) {
    return {
      x: temp[0].x,
      y: temp[0].y,
      t: temp[0].t,
      d: temp[0].d,
    };
  }
}

/**
 * 牛顿迭代求单调性曲线和点的最短距离，提前确保x/y已经是单调的了
 * 即便如此，点距离曲线还是可能非单调（x和y的单调性相反情况），从而有非单根情况，最多双根
 * 因为x/y单调性的贝塞尔曲线和一个圆最多2个交点，反证有3个交点就不单调了
 * 此时求2次，各自从t1/t2开始，然后取最小值即可
 */
function getEachPDByApprox(points: { x: number, y: number }[], t1: number, t2: number, x: number, y: number, eps = 1e-9, min = 3, max = 30) {
  // console.warn('在此t范围内查找2次', t1, t2);
  const list: { x: number, y: number, t: number, d: number }[] = [];
  const r1 = getEachPDByApproxWithStartT(points, t1, t2, t1, x, y, eps, min, max);
  if (r1) {
    list.push(r1);
  }
  const r2 = getEachPDByApproxWithStartT(points, t1, t2, t2, x, y, eps, min, max);
  if (r2) {
    list.push(r2);
  }
  const r3 = getEachPDByApproxWithStartT(points, t1, t2, (t1 + t2) * 0.5, x, y, eps, min, max);
  if (r3) {
    list.push(r3);
  }
  if (!list.length) {
    return;
  }
  list.sort((a, b) => a.d - b.d);
  return list[0];
}

function getEachPDByApproxWithStartT(points: { x: number, y: number }[], t1: number, t2: number, t: number, x: number, y: number, eps = 1e-9, min = 5, max = 30) {
  let last = t;
  let count = 0;
  while (count++ < max) {
    const vx = (bezierValue(points, t, true)! - x); // 坐标差
    const vy = (bezierValue(points, t, false)! - y);
    const dx1 = bezierDerivative(points, t, true)!; // 一阶导数
    const dy1 = bezierDerivative(points, t, false)!;
    const dx2 = bezierDerivative2(points, t, true)!; // 二阶导数
    const dy2 = bezierDerivative2(points, t, false)!;
    const f = vx * dx1 + vy * dy1;
    const df = Math.pow(dx1, 2) + vx * dx2 + Math.pow(dy1, 2) + vy * dy2;
    if (df < 0) {
      return;
    }
    const diff = f / df;
    // console.log(count, '极值', f, '极值导', df, '差t', diff, '当前t', t,
    //   '坐标差', vx, vy, '1阶导', dx1, dy1, '2阶导', dx2, dy2);
    t -= diff;
    if (t > t2) {
      t = t2;
    }
    else if (t < t1) {
      t = t1;
    }
    // 判断是否需要继续，用本次和上次的移动距离做而不是t的差值，因为可能曲线非常大，t的变化即便很小也会有较大误差
    if (count > min) {
      const x1 = bezierValue(points, t, true)!;
      const y1 = bezierValue(points, t, false)!;
      const x2 = bezierValue(points, last, true)!;
      const y2 = bezierValue(points, last, false)!;
      const diff = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
      // console.log(count, diff);
      if (Math.abs(diff) < eps) {
        break;
      }
    }
    last = t;
  }
  const px = bezierValue(points, t, true)!;
  const py = bezierValue(points, t, false)!;
  const d = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
  // console.log('查找结束，t为', t, '点坐标为', px, py, '距离', d);
  return { x: px, y: py, t, d };
}

// 贝塞尔1阶导数
export function bezierDerivative(points: { x: number, y: number }[], t: number, isX = true) {
  if (points.length < 3 || points.length > 4) {
    throw new Error('Unsupported order');
  }
  const p0 = isX ? points[0].x : points[0].y;
  const p1 = isX ? points[1].x : points[1].y;
  const p2 = isX ? points[2].x : points[2].y;
  if (points.length === 3) {
    return 2 * (p0 - 2 * p1 + p2) * t + 2 * (p1 - p0);
  }
  if (points.length === 4) {
    const p3 = isX ? points[3].x : points[3].y;
    // return 3 * Math.pow(1 - t, 2) * (p1 - p0) + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (p3 - p2);
    return 3 * (-p0 + 3 * p1 - 3 * p2 + p3) * t * t
      + 2 * (3 * p0 - 6 * p1 + 3 * p2) * t
      + 3 * p1 - 3 * p0;
  }
}

// 贝塞尔2阶导数
export function bezierDerivative2(points: { x: number, y: number }[], t: number, isX = true) {
  if (points.length < 2 || points.length > 4) {
    throw new Error('Unsupported order');
  }
  if (points.length === 2) {
    return 0;
  }
  const p0 = isX ? points[0].x : points[0].y;
  const p1 = isX ? points[1].x : points[1].y;
  const p2 = isX ? points[2].x : points[2].y;
  if (points.length === 3) {
    return 2 * (p0 - 2 * p1 + p2);
  }
  if (points.length === 4) {
    const p3 = isX ? points[3].x : points[3].y;
    // return 6 * (1 - t) * (p2 - 2 * p1 + p0) + 6 * t * (p3 - 2 * p2 + p1);
    return 6 * (-p0 + 3 * p1 - 3 * p2 + p3) * t
      + 2 * (3 * p0 - 6 * p1 + 3 * p2);
  }
}

export function bezierValue(points: { x: number, y: number }[], t: number, isX = true) {
  if (points.length < 2 || points.length > 4) {
    throw new Error('Unsupported order');
  }
  const p0 = isX ? points[0].x : points[0].y;
  const p1 = isX ? points[1].x : points[1].y;
  if (points.length === 2) {
    return p0 + (p1 - p0) * t;
  }
  const p2 = isX ? points[2].x : points[2].y;
  if (points.length === 3) {
    return Math.pow(1 - t, 2) * p0 + 2 * t * (1 - t) * p1 + Math.pow(t, 2) * p2;
  }
  if (points.length === 4) {
    const p3 = isX ? points[3].x : points[3].y;
    return Math.pow(1 - t, 3) * p0 + 3 * Math.pow(1 - t, 2) * t * p1 + 3 * Math.pow(t, 2) * (1 - t) * p2 + Math.pow(t, 3) * p3;
  }
}

export function getT(points: { x: number, y: number }[], v: number, isX = true) {
  const p0 = isX ? points[0].x : points[0].y;
  const p1 = isX ? points[1].x : points[1].y;
  const p2 = isX ? points[2].x : points[2].y;
  if (points.length === 4) {
    const p3 = isX ? points[3].x : points[3].y;
    const t = getRoots([
      p0 - v,
      3 * (p1 - p0),
      3 * (p2 + p0 - 2 * p1),
      p3 - p0 + 3 * p1 - 3 * p2,
    ]);
    return t.filter(i => i >= 0 && i <= 1);
  }
  const t = getRoots([
    p0 - v,
    2 * (p1 - p0),
    p2 + p0 - 2 * p1,
  ]);
  return t.filter(i => i >= 0 && i <= 1);
}

export default {
  bboxBezier,
  bezierLength,
  bezierAt,
  sliceBezier,
  getPointByT,
  getT,
  getPointT,
  getPointWithDByApprox,
  bezierSlope,
  bezierExtremaT,
  bezierTangent,
  splitBezierT,
  getBezierMonotonicityT,
  getBezierMonotonicityT2,
  bezierDerivative,
  bezierDerivative2,
  bezierValue,
};
