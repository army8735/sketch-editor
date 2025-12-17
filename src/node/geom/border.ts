import { STROKE_LINE_CAP, STROKE_LINE_JOIN } from '../../style/define';
import { crossProduct } from '../../math/vector';
import { intersectLineLine } from '../../math/isec';
import { bezierSlope } from '../../math/bezier';

export function lineCap(bbox: Float32Array, width: number, points: number[][], cap: STROKE_LINE_CAP) {
  const res = bbox.slice(0);
  // 圆角最简单，已知圆心和半径，直接取范围
  if (cap === STROKE_LINE_CAP.ROUND) {
    res[0] -= width;
    res[1] -= width;
    res[2] += width;
    res[3] += width;
  }
  if (!points.length) {
    return res;
  }
  // 仅首尾端点生效，一条线
  const first = points[0];
  const last = points[points.length - 1];
  const ll = last.length;
  const pts: { x: number, y: number }[] = [];
  for (let i = 0; i < ll; i += 2) {
    pts.push({
      x: last[i],
      y: last[i + 1],
    });
  }
  let slop1 = 0, slop2 = 0;
  // 求端点斜率，可能是曲线或直线，这里统一用正数，因为就2个点，三角函数算出偏移值后min/max各取正负即可
  if (ll > 2) {
    slop1 = Math.abs(bezierSlope(pts, 0));
    slop2 = Math.abs(bezierSlope(pts, 1));
  }
  else {
    slop1 = slop2 = Math.abs(last[ll - 1] - first[1]) / Math.abs(last[ll - 2] - first[0]);
  }
  const deg1 = Math.atan(slop1);
  const deg2 = Math.atan(slop2);
  const sin1 = Math.sin(deg1);
  const cos1 = Math.cos(deg1);
  const sin2 = Math.sin(deg2);
  const cos2 = Math.cos(deg2);
  const dx1 = (sin1 === Infinity) ? width : Math.abs(sin1 * width);
  const dy1 = (cos1 === Infinity) ? width : Math.abs(cos1 * width);
  const dx2 = (sin2 === Infinity) ? width : Math.abs(sin2 * width);
  const dy2 = (cos2 === Infinity) ? width : Math.abs(cos2 * width);
  if (cap === STROKE_LINE_CAP.BUTT) {
    res[0] = Math.min(res[0], first[0] - dx1, last[ll - 2] - dx2);
    res[1] = Math.min(res[1], first[1] - dy1, last[ll - 1] - dy2);
    res[2] = Math.max(res[2], first[0] + dx1, last[ll - 2] + dx2);
    res[3] = Math.max(res[3], first[1] + dy1, last[ll - 1] + dy2);
  }
  else if (cap === STROKE_LINE_CAP.SQUARE) {
    res[0] = Math.min(res[0], first[0] - dx1 - dy1, last[ll - 2] - dx2 - dy2);
    res[1] = Math.min(res[1], first[1] - dx1 - dy1, last[ll - 1] - dx2 - dy2);
    res[2] = Math.max(res[2], first[0] + dx1 + dy1, last[ll - 2] + dx2 + dy2);
    res[3] = Math.max(res[3], first[1] + dx1 + dy1, last[ll - 1] + dx2 + dy2);
  }
  return res;
}

export function lineJoin(bbox: Float32Array, width: number, points: number[][], join: STROKE_LINE_JOIN, miterLimit: number) {
  const res = bbox.slice(0);
  // 圆角最简单，已知圆心和半径，直接取范围
  if (join === STROKE_LINE_JOIN.ROUND) {
    res[0] -= width;
    res[1] -= width;
    res[2] += width;
    res[3] += width;
    return res;
  }
  if (!points.length) {
    return res;
  }
  // 先求出向量，曲线则是尾部切线，用于判断相邻2条的时钟序，同时求得向量平移画线宽度一半的2条直线解
  const vectors: number[][] = [];
  const lines: number[][] = [];
  let [x, y] = points[0];
  for (let i = 1, len = points.length; i < len; i++) {
    const p = points[i];
    let dx = 0, dy = 0;
    if (p.length === 2) {
      dx = p[0] - x;
      dy = p[1] - y;
      x = p[0];
      y = p[1];
      vectors.push([dx, dy]);
    }
    else if (p.length === 4) {
      dx = 2 * (x - 2 * p[0] + p[2]) + 2 * p[0] - 2 * x;
      dy = 2 * (y - 2 * p[1] + p[3]) + 2 * p[1] - 2 * y;
      x = p[2];
      y = p[3];
      vectors.push([dx, dy]);
    }
    else if (p.length === 6) {
      dx = 3 * (-x + 3 * p[0] - 3 * p[2] + p[4])
        + 2 * (3 * x - 6 * p[0] + 3 * p[2])
        + 3 * p[0] - 3 * x;
      dy = 3 * (-y + 3 * p[1] - 3 * p[3] + p[5])
        + 2 * (3 * y - 6 * p[1] + 3 * p[3])
        + 3 * p[1] - 3 * y;
      x = p[4];
      y = p[5];
      vectors.push([dx, dy]);
    }
    // 有向量了等于到原点的一条直线，知道平移距离求得平移x/y，注意象限，这里都求逆时针方向
    const alpha = Math.atan(Math.abs(dy / dx));
    const xd = Math.sin(alpha) * width;
    const yd = Math.cos(alpha) * width;
    if (dx >= 0) {
      if (dy >= 0) {
        lines.push([-xd, yd]);
      }
      else {
        lines.push([xd, yd]);
      }
    }
    else {
      if (dy >= 0) {
        lines.push([-xd, -yd]);
      }
      else {
        lines.push([xd, -yd]);
      }
    }
  }
  // 根据宽度求向量平移截距后的平行线，知道平移距离求得平移x/y，有2个解，看时钟序选择
  for (let i = 0, len = vectors.length; i < len; i++) {
    const p = vectors[i], n = vectors[(i + 1) % len];
    if (!p[0] || !p[1] || !n[0] || !n[1]) {
      continue;
    }
    const cp = crossProduct(p[0], p[1], n[0], n[1]);
    const dp = lines[i], dn = lines[(i + 1) % len];
    if (!dp[0] && !dp[1] && !dn[0] && !dn[1]) {
      continue;
    }
    let dxp = 0, dyp = 0;
    let dxn = 0, dyn = 0;
    // 终点-截距点的矢量和原本边矢量对比
    const pv = [p[0] + dp[0], p[1] + dp[1]];
    const cross1 = crossProduct(p[0], p[1], pv[0], pv[1]);
    if (cp >= 0 && cross1 >= 0 || cp < 0 && cross1 < 0) {
      dxp = -dp[0];
      dyp = -dp[1];
    }
    else {
      dxp = dp[0];
      dyp = dp[1];
    }
    const nv = [n[0] + dn[0], n[1] + dn[1]];
    const cross2 = crossProduct(n[0], n[1], nv[0], nv[1]);
    if (cp >= 0 && cross2 >= 0 || cp < 0 && cross2 < 0) {
      dxn = -dn[0];
      dyn = -dn[1];
    }
    else {
      dxn = dn[0];
      dyn = dn[1];
    }
    // 还原为原本的直线坐标点，由于向量比点多1个，且点首尾相同，所以取的索引要考虑偏移
    const prev = points[i], curr = points[i + 1], next = points[(i + 2) % len];
    const pl = prev.length, cl = curr.length, nl = next.length;
    const px1 = prev[pl - 2] + dxp, py1 = prev[pl - 1] + dyp;
    const px2 = curr[cl - 2] + dxp, py2 = curr[cl - 1] + dyp;
    const nx1 = curr[cl - 2] + dxn, ny1 = curr[cl - 1] + dyn;
    const nx2 = next[nl - 2] + dxn, ny2 = next[nl - 1] + dyn;
    const pt = intersectLineLine(
      px1, py1, px2, py2,
      nx1, ny1, nx2, ny2,
      false,
    )!;
    // 无延展
    if (!pt || pt.toSource === 1 || pt.toClip === 0) {
      continue;
    }
    // 不同类型的限制，bevel在交点处延2条边同时等量回退，并回退顶点形成width*2的新边
    if (join === STROKE_LINE_JOIN.BEVEL) {
      const distance = Math.sqrt(Math.pow(nx1 - px2, 2) + Math.pow(ny1 - py2, 2));
      const ratio = width * 2 / distance;
      // 链接距离不超过边框无需裁剪
      if (ratio >= 1) {
        res[0] = Math.min(res[0], px2, nx1);
        res[1] = Math.min(res[1], py2, ny1);
        res[2] = Math.max(res[2], px2, nx1);
        res[3] = Math.max(res[3], py2, ny1);
      }
      // 超过用比例计算回退距离，2个切点和pt组成的三角形a，和真正切点和pt组成的三角形b，是相似三角形，比例ratio
      else {
        const x1 = pt.x - (pt.x - px2) * ratio;
        const y1 = pt.y - (pt.y - py2) * ratio;
        const x2 = pt.x - (pt.x - nx1) * ratio;
        const y2 = pt.y - (pt.y - ny1) * ratio;
        res[0] = Math.min(res[0], x1, x2);
        res[1] = Math.min(res[1], y1, y2);
        res[2] = Math.max(res[2], x1, x2);
        res[3] = Math.max(res[3], y1, y2);
      }
    }
    // 一般就是扩展到延长线交点pt，除非被miterLimit限制
    else if (join === STROKE_LINE_JOIN.MITER) {
      const distance = Math.sqrt(Math.pow(pt.x - curr[cl - 2], 2) + Math.pow(pt.y - curr[cl - 1], 2));
      const ratio = distance / width;
      // 比例超过后，则为bevel
      if (ratio > miterLimit) {
        const distance = Math.sqrt(Math.pow(nx1 - px2, 2) + Math.pow(ny1 - py2, 2));
        const ratio = width * 2 / distance;
        // 链接距离不超过边框无需裁剪
        if (ratio >= 1) {
          res[0] = Math.min(res[0], px2, nx1);
          res[1] = Math.min(res[1], py2, ny1);
          res[2] = Math.max(res[2], px2, nx1);
          res[3] = Math.max(res[3], py2, ny1);
        }
        // 超过用比例计算回退距离，2个切点和pt组成的三角形a，和真正切点和pt组成的三角形b，是相似三角形，比例ratio
        else {
          const x1 = pt.x - (pt.x - px2) * ratio;
          const y1 = pt.y - (pt.y - py2) * ratio;
          const x2 = pt.x - (pt.x - nx1) * ratio;
          const y2 = pt.y - (pt.y - ny1) * ratio;
          res[0] = Math.min(res[0], x1, x2);
          res[1] = Math.min(res[1], y1, y2);
          res[2] = Math.max(res[2], x1, x2);
          res[3] = Math.max(res[3], y1, y2);
        }
      }
      // 否则直接使用pt
      else {
        res[0] = Math.min(res[0], pt.x);
        res[1] = Math.min(res[1], pt.y);
        res[2] = Math.max(res[2], pt.x);
        res[3] = Math.max(res[3], pt.y);
      }
    }
  }
  return res;
}

export default {
  lineCap,
  lineJoin,
};
