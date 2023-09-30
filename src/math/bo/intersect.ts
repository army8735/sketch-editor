import bezier from '../bezier';
import isec from '../isec';
import Point from './Point';

const EPS = 1e-4;
const EPS2 = 1 - 1e-4;

// function isParallel(k1: number, k2: number) {
//   if (k1 === Infinity && k2 === Infinity) {
//     return true;
//   } else if (k1 === Infinity && k2 === -Infinity) {
//     return true;
//   } else if (k1 === -Infinity && k2 === -Infinity) {
//     return true;
//   } else if (k1 === -Infinity && k2 === Infinity) {
//     return true;
//   } else {
//     return Math.abs(k1 - k2) < EPS;
//   }
// }

function getIntersectionLineLine(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
  d: number,
) {
  const toSource = ((bx2 - bx1) * (ay1 - by1) - (by2 - by1) * (ax1 - bx1)) / d;
  const toClip = ((ax2 - ax1) * (ay1 - by1) - (ay2 - ay1) * (ax1 - bx1)) / d;
  // 非顶点相交才是真相交，先判断在范围内防止超过[0, 1]，再考虑精度
  if (
    toSource >= 0 &&
    toSource <= 1 &&
    toClip >= 0 &&
    toClip <= 1 &&
    ((toSource > EPS && toSource < EPS2) || (toClip > EPS && toClip < EPS2))
  ) {
    const ox = ax1 + toSource * (ax2 - ax1);
    const oy = ay1 + toSource * (ay2 - ay1);
    return [
      {
        point: new Point(ox, oy),
        toSource,
        toClip,
      },
    ];
  }
}

function getIntersectionBezier2Line(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  ax3: number,
  ay3: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
) {
  const res = isec.intersectBezier2Line(
    ax1,
    ay1,
    ax2,
    ay2,
    ax3,
    ay3,
    bx1,
    by1,
    bx2,
    by2,
  );
  if (res.length) {
    const t: Array<{ point: Point; toSource: number; toClip: number }> = [];
    res.forEach((item) => {
      let toClip;
      // toClip是直线上的距离，可以简化为只看x或y，选择差值比较大的防止精度问题
      if (Math.abs(bx2 - bx1) >= Math.abs(by2 - by1)) {
        toClip = Math.abs((item.x - bx1) / (bx2 - bx1));
      } else {
        toClip = Math.abs((item.y - by1) / (by2 - by1));
      }
      if ((item.t > EPS && item.t < EPS2) || (toClip > EPS && toClip < EPS2)) {
        // 还要判断斜率，相等也忽略（小于一定误差）
        // let k1 = bezier.bezierSlope(
        //   [
        //     { x: ax1, y: ay1 },
        //     { x: ax2, y: ay2 },
        //     { x: ax3, y: ay3 },
        //   ],
        //   item.t,
        // );
        // let k2 = bezier.bezierSlope([
        //   { x: bx1, y: by1 },
        //   { x: bx2, y: by2 },
        // ]);
        // // 忽略方向，180°也是平行，Infinity相减为NaN
        // if (isParallel(k1, k2)) {
        //   return;
        // }
        t.push({
          point: new Point(item.x, item.y),
          toSource: item.t, // source是曲线直接用t
          toClip,
        });
      }
    });
    if (t.length) {
      return t;
    }
  }
}

function getIntersectionBezier2Bezier2(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  ax3: number,
  ay3: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
  bx3: number,
  by3: number,
) {
  const res = isec.intersectBezier2Bezier2(
    ax1,
    ay1,
    ax2,
    ay2,
    ax3,
    ay3,
    bx1,
    by1,
    bx2,
    by2,
    bx3,
    by3,
  );
  if (res.length) {
    const t: Array<{ point: Point; toSource: number; toClip: number }> = [];
    res.forEach((item) => {
      // toClip是另一条曲线的距离，需根据交点和曲线方程求t
      const toClip = bezier.getPointT(
        [
          { x: ax1, y: ay1 },
          { x: ax2, y: ay2 },
          { x: ax3, y: ay3 },
        ],
        item.x,
        item.y,
      );
      // 防止误差无值
      if (toClip.length) {
        const tc = toClip[0];
        if ((item.t > EPS && item.t < EPS2) || (tc > EPS && tc < EPS2)) {
          // 还要判断斜率，相等也忽略（小于一定误差）
          // let k1 = bezier.bezierSlope(
          //   [
          //     { x: ax1, y: ay1 },
          //     { x: ax2, y: ay2 },
          //     { x: ax3, y: ay3 },
          //   ],
          //   item.t,
          // );
          // let k2 = bezier.bezierSlope(
          //   [
          //     { x: bx1, y: by1 },
          //     { x: bx2, y: by2 },
          //     { x: bx3, y: by3 },
          //   ],
          //   tc,
          // );
          // // 忽略方向，180°也是平行，Infinity相减为NaN
          // if (isParallel(k1, k2)) {
          //   return;
          // }
          t.push({
            point: new Point(item.x, item.y),
            toSource: item.t, // source是曲线直接用t
            toClip: tc,
          });
        }
      }
    });
    if (t.length) {
      return t;
    }
  }
}

function getIntersectionBezier2Bezier3(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  ax3: number,
  ay3: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
  bx3: number,
  by3: number,
  bx4: number,
  by4: number,
) {
  const res = isec.intersectBezier2Bezier3(
    ax1,
    ay1,
    ax2,
    ay2,
    ax3,
    ay3,
    bx1,
    by1,
    bx2,
    by2,
    bx3,
    by3,
    bx4,
    by4,
  );
  if (res.length) {
    const t: Array<{ point: Point; toSource: number; toClip: number }> = [];
    res.forEach((item) => {
      // toClip是另一条曲线的距离，需根据交点和曲线方程求t
      let toClip = bezier.getPointT(
        [
          { x: bx1, y: by1 },
          { x: bx2, y: by2 },
          { x: bx3, y: by3 },
          { x: bx4, y: by4 },
        ],
        item.x,
        item.y,
      );
      // 防止误差无值
      if (toClip.length) {
        const tc = toClip[0];
        if ((item.t > EPS && item.t < EPS2) || (tc > EPS && tc < EPS2)) {
          // 还要判断斜率，相等也忽略（小于一定误差）
          // let k1 = bezier.bezierSlope(
          //   [
          //     { x: ax1, y: ay1 },
          //     { x: ax2, y: ay2 },
          //     { x: ax3, y: ay3 },
          //   ],
          //   item.t,
          // );
          // let k2 = bezier.bezierSlope(
          //   [
          //     { x: bx1, y: by1 },
          //     { x: bx2, y: by2 },
          //     { x: bx3, y: by3 },
          //     { x: bx4, y: by4 },
          //   ],
          //   tc,
          // );
          // // 忽略方向，180°也是平行，Infinity相减为NaN
          // if (isParallel(k1, k2)) {
          //   return;
          // }
          t.push({
            point: new Point(item.x, item.y),
            toSource: item.t, // source是曲线直接用t
            toClip: tc,
          });
        }
      }
    });
    if (t.length) {
      return t;
    }
  }
}

function getIntersectionBezier3Line(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  ax3: number,
  ay3: number,
  ax4: number,
  ay4: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
) {
  const res = isec.intersectBezier3Line(
    ax1,
    ay1,
    ax2,
    ay2,
    ax3,
    ay3,
    ax4,
    ay4,
    bx1,
    by1,
    bx2,
    by2,
  );
  if (res.length) {
    const t: Array<{ point: Point; toSource: number; toClip: number }> = [];
    res.forEach((item) => {
      // toClip是直线上的距离，可以简化为只看x或y，选择差值比较大的防止精度问题
      let toClip;
      if (Math.abs(bx2 - bx1) >= Math.abs(by2 - by1)) {
        toClip = Math.abs((item.x - bx1) / (bx2 - bx1));
      } else {
        toClip = Math.abs((item.y - by1) / (by2 - by1));
      }
      if ((item.t > EPS && item.t < EPS2) || (toClip > EPS && toClip < EPS2)) {
        // 还要判断斜率，相等也忽略（小于一定误差）
        // let k1 = bezier.bezierSlope(
        //   [
        //     { x: ax1, y: ay1 },
        //     { x: ax2, y: ay2 },
        //     { x: ax3, y: ay3 },
        //     { x: ax4, y: ay4 },
        //   ],
        //   item.t,
        // );
        // let k2 = bezier.bezierSlope([
        //   { x: bx1, y: by1 },
        //   { x: bx2, y: by2 },
        // ]);
        // // 忽略方向，180°也是平行，Infinity相减为NaN
        // if (isParallel(k1, k2)) {
        //   return;
        // }
        t.push({
          point: new Point(item.x, item.y),
          toSource: item.t, // source是曲线直接用t
          toClip,
        });
      }
    });
    if (t.length) {
      return t;
    }
  }
}

function getIntersectionBezier3Bezier3(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  ax3: number,
  ay3: number,
  ax4: number,
  ay4: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
  bx3: number,
  by3: number,
  bx4: number,
  by4: number,
) {
  const res = isec.intersectBezier3Bezier3(
    ax1,
    ay1,
    ax2,
    ay2,
    ax3,
    ay3,
    ax4,
    ay4,
    bx1,
    by1,
    bx2,
    by2,
    bx3,
    by3,
    bx4,
    by4,
  );
  if (res.length) {
    const t: Array<{ point: Point; toSource: number; toClip: number }> = [];
    res.forEach((item) => {
      // toClip是另一条曲线的距离，需根据交点和曲线方程求t
      let toClip = bezier.getPointT(
        [
          { x: bx1, y: by1 },
          { x: bx2, y: by2 },
          { x: bx3, y: by3 },
          { x: bx4, y: by4 },
        ],
        item.x,
        item.y,
      );
      // 防止误差无值
      if (toClip.length) {
        const tc = toClip[0];
        if ((item.t > EPS && item.t < EPS2) || (tc > EPS && tc < EPS2)) {
          // 还要判断斜率，相等也忽略（小于一定误差）
          // let k1 = bezier.bezierSlope(
          //   [
          //     { x: ax1, y: ay1 },
          //     { x: ax2, y: ay2 },
          //     { x: ax3, y: ay3 },
          //     { x: ax4, y: ay4 },
          //   ],
          //   item.t,
          // );
          // let k2 = bezier.bezierSlope(
          //   [
          //     { x: bx1, y: by1 },
          //     { x: bx2, y: by2 },
          //     { x: bx3, y: by3 },
          //     { x: bx4, y: by4 },
          //   ],
          //   tc,
          // );
          // // 忽略方向，180°也是平行，Infinity相减为NaN
          // if (isParallel(k1, k2)) {
          //   return;
          // }
          t.push({
            point: new Point(item.x, item.y),
            toSource: item.t, // source是曲线直接用t
            toClip: tc,
          });
        }
      }
    });
    if (t.length) {
      return t;
    }
  }
}

// 两条线可能多个交点，将交点按原本线段的方向顺序排序
function sortIntersection(
  res: Array<{ point: Point; toSource: number; toClip: number }>,
  isSource: boolean,
) {
  return res
    .sort(function (a, b) {
      if (isSource) {
        return a.toSource - b.toSource;
      }
      return a.toClip - b.toClip;
    })
    .map((item) => {
      return {
        point: item.point,
        t: isSource ? item.toSource : item.toClip,
      };
    })
    .filter((item) => item.t > EPS && item.t < EPS2);
}

export default {
  getIntersectionLineLine,
  getIntersectionBezier2Line,
  getIntersectionBezier2Bezier2,
  getIntersectionBezier2Bezier3,
  getIntersectionBezier3Line,
  getIntersectionBezier3Bezier3,
  sortIntersection,
  EPS,
  EPS2,
};
