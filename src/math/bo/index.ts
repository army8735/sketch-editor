import Polygon from './Polygon';
import chains from './chains';
import Segment from './Segment';

// 多边形都是多个区域，重载支持外部传入1个区域则数组化
function prefix(polygon: any): Array<Array<Array<number>>> {
  if (!polygon || !Array.isArray(polygon) || !Array.isArray(polygon[0])) {
    return [];
  }
  if (Array.isArray(polygon[0][0])) {
    return polygon;
  }
  return [polygon];
}

function trivial(polygonA: any, polygonB: any) {
  const isIntermediateA = polygonA instanceof Polygon;
  const isIntermediateB = polygonB instanceof Polygon;
  // 生成多边形对象，相交线段拆分开来，曲线x单调性裁剪，重合线段标记
  let source;
  if (isIntermediateA) {
    source = polygonA.reset(0);
  }
  else {
    source = new Polygon(prefix(polygonA), 0);
    source.selfIntersect();
  }
  // console.log(source.toString());
  let clip;
  if (isIntermediateB) {
    clip = polygonB.reset(1);
  }
  else {
    clip = new Polygon(prefix(polygonB), 1);
    clip.selfIntersect();
  }
  // 两个多边形之间再次互相判断相交
  Polygon.intersect2(source, clip, isIntermediateA, isIntermediateB);
  Polygon.annotate2(source, clip, isIntermediateA, isIntermediateB);
  return [source, clip];
}

const INTERSECT = [
  0, 0, 0, 1,
  0, 0, 0, 1,
  0, 0, 0, 1,
  1, 1, 1, 0,
], UNION = [
  0, 1, 1, 1,
  1, 0, 0, 0,
  1, 0, 0, 0,
  1, 0, 0, 0,
], SUBTRACT = [
  0, 0, 1, 0,
  0, 0, 1, 0,
  1, 1, 0, 1,
  0, 0, 1, 0,
], SUBTRACT_REV = [
  0, 1, 0, 0,
  1, 0, 1, 1,
  0, 1, 0, 0,
  0, 1, 0, 0,
], XOR = [
  0, 1, 1, 0,
  1, 0, 0, 1,
  1, 0, 0, 1,
  0, 1, 1, 0,
];

function filter(segments: Array<Segment>, matrix: Array<number>) {
  const res: Array<Segment> = [], hash: any = {};
  segments.forEach(seg => {
    const { belong, myFill, otherFill, otherCoincide } = seg;
    if (otherCoincide) {
      // 对方重合线只出现一次
      const hc = seg.toHash();
      if (hash.hasOwnProperty(hc)) {
        return;
      }
      hash[hc] = true;
    }
    let i;
    if (belong) {
      i = (otherFill[0] ? 8 : 0)
        + (myFill[0] ? 4 : 0)
        + (otherFill[1] ? 2 : 0)
        + (myFill[1] ? 1 : 0);
    }
    else {
      i = (myFill[0] ? 8 : 0)
        + (otherFill[0] ? 4 : 0)
        + (myFill[1] ? 2 : 0)
        + (otherFill[1] ? 1 : 0);
    }
    if (matrix[i]) {
      res.push(seg);
    }
  });
  return res;
}

export function intersect(polygonA: any, polygonB: any, intermediate = false) {
  const [source, clip] = trivial(polygonA, polygonB);
  const list = filter(source.segments.concat(clip.segments), INTERSECT);
  if (intermediate) {
    source.segments = list;
    return source;
  }
  return chains(list);
}

export function union(polygonA: any, polygonB: any, intermediate = false) {
  const [source, clip] = trivial(polygonA, polygonB);
  const list = filter(source.segments.concat(clip.segments), UNION);
  if (intermediate) {
    source.segments = list;
    return source;
  }
  return chains(list);
}

export function subtract(polygonA: any, polygonB: any, intermediate = false) {
  const [source, clip] = trivial(polygonA, polygonB);
  let list = filter(source.segments.concat(clip.segments), SUBTRACT);
  // 暂时这样解决反向的问题
  if (!list.length) {
    // list = filter(source.segments.concat(clip.segments), SUBTRACT_REV);
  }
  if (intermediate) {
    source.segments = list;
    return source;
  }
  return chains(list);
}

export function subtractRev(polygonA: any, polygonB: any, intermediate = false) {
  const [source, clip] = trivial(polygonA, polygonB);
  const list = filter(source.segments.concat(clip.segments), SUBTRACT_REV);
  if (intermediate) {
    source.segments = list;
    return source;
  }
  return chains(list);
}

export function xor(polygonA: any, polygonB: any, intermediate = false) {
  const [source, clip] = trivial(polygonA, polygonB);
  const list = filter(source.segments.concat(clip.segments), XOR);
  if (intermediate) {
    source.segments = list;
    return source;
  }
  return chains(list);
}

export function chain(polygon: Polygon | Array<Segment>) {
  if (polygon instanceof Polygon) {
    return chains(polygon.segments);
  }
  return prefix(polygon);
}

export default {
  intersect,
  union,
  subtract,
  subtractRev,
  xor,
  chain,
  chains,
};
