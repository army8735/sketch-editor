import isec from '../isec';
import Point from './Point';

const EPS = 0.001;
const EPS2 = 1;

export function getIntersectionLineLine(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
) {
  const res = isec.intersectLineLine(
    ax1,
    ay1,
    ax2,
    ay2,
    bx1,
    by1,
    bx2,
    by2,
    true,
  );
  if (res) {
    return [
      {
        point: new Point(Math.round(res.x), Math.round(res.y)),
        toSource: res.toSource,
        toClip: res.toClip,
      },
    ];
  }
}

export function getIntersectionBezier2Line(
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
    EPS,
    EPS2,
  );
  if (res.length) {
    return filterIsec(res);
  }
}

export function getIntersectionBezier2Bezier2(
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
    EPS,
    EPS2,
  );
  if (res.length) {
    return filterIsec(res);
  }
}

export function getIntersectionBezier2Bezier3(
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
    EPS,
    EPS2,
  );
  if (res.length) {
    return filterIsec(res);
  }
}

export function getIntersectionBezier3Line(
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
    EPS,
    EPS2,
  );
  if (res.length) {
    return filterIsec(res);
  }
}

export function getIntersectionBezier3Bezier3(
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
    EPS,
    EPS2,
  );
  if (res.length) {
    return filterIsec(res);
  }
}

export function filterIsec(res: Array<{ x: number; y: number; t1: number; t2: number }>) {
  res.sort((a, b) => {
    if (a.x === b.x) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });
  for (let i = res.length - 1; i >= 1; i--) {
    const curr = res[i], next = res[i - 1];
    curr.x = Math.round(curr.x);
    curr.y = Math.round(curr.y);
    next.x = Math.round(next.x);
    next.y = Math.round(next.y);
    if (curr.x === next.x && curr.y === next.y) {
      res.splice(i, 1);
    }
  }
  return res.map(item => {
    return {
      point: new Point(Math.round(item.x), Math.round(item.y)),
      toSource: item.t1,
      toClip: item.t2,
    };
  });
}

// 两条线可能多个交点，将交点按原本线段的方向顺序排序
export function sortIntersection(
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
    });
}

export default {
  getIntersectionLineLine,
  getIntersectionBezier2Line,
  getIntersectionBezier2Bezier2,
  getIntersectionBezier2Bezier3,
  getIntersectionBezier3Line,
  getIntersectionBezier3Bezier3,
  sortIntersection,
};
