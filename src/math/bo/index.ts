import Polygon from './Polygon';
import chains from './chains';
import Segment from './Segment';

// 多边形都是多个区域，重载支持外部传入1个区域则数组化
function prefix(polygon: Polygon | number[][] | number[][][]): number[][][] {
  if (!polygon || !Array.isArray(polygon) || !Array.isArray(polygon[0])) {
    return [];
  }
  if (Array.isArray(polygon[0][0])) {
    return polygon as number[][][];
  }
  return [polygon] as number[][][];
}

function trivial(polygonA: Polygon | number[][][], polygonB: Polygon | number[][][]) {
  const isIntermediateA = polygonA instanceof Polygon;
  const isIntermediateB = polygonB instanceof Polygon;
  // 生成多边形对象，相交线段拆分开来，曲线x单调性裁剪，重合线段标记
  let source;
  if (isIntermediateA) {
    source = polygonA.reset(0);
  }
  else {
    source = new Polygon(prefix(polygonA), 0);
  }
  source.selfIntersect();
  // console.table(source.toString());
  let clip;
  if (isIntermediateB) {
    clip = polygonB.reset(1);
  }
  else {
    clip = new Polygon(prefix(polygonB), 1);
  }
  clip.selfIntersect();
  // console.table(clip.toString());
  // 两个多边形之间再次互相判断相交
  Polygon.intersect2(source, clip);
  Polygon.annotate2(source, clip);
  // console.table(source.toString());
  // console.table(clip.toString());
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

function filter(polygonA: Polygon, polygonB: Polygon, matrix: number[]) {
  const segments = polygonA.segments.concat(polygonB.segments);
  const hashXY = polygonA.hashXY;
  // console.log(segments.map(item => item.toString()))
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
    // 中间结果优化去除无效seg
    else if (hashXY) {
      const coords = seg.coords,
        l = coords.length;
      const start = coords[0],
        end = coords[l - 1];
      const hash1 = hashXY[start.x];
      if (hash1) {
        const list = hash1[start.y];
        if (list) {
          for (let i = 0, len = list.length; i < len; ++i) {
            if (list[i].seg === seg) {
              list.splice(i, 1);
              break;
            }
          }
        }
      }
      const hash2 = hashXY[end.x];
      if (hash2) {
        const list = hash2[end.y];
        if (list) {
          for (let i = 0, len = list.length; i < len; ++i) {
            if (list[i].seg === seg) {
              list.splice(i, 1);
              break;
            }
          }
        }
      }
    }
  });
  return res;
}

export function intersect(polygonA: Polygon | number[][][], polygonB: Polygon | number[][][], intermediate = false) {
  const [source, clip] = trivial(polygonA, polygonB);
  const list = filter(source, clip, INTERSECT);
  if (intermediate) {
    source.segments = list;
    return source;
  }
  return chains(list);
}

export function union(polygonA: Polygon | number[][][], polygonB: Polygon | number[][][], intermediate = false) {
  const [source, clip] = trivial(polygonA, polygonB);
  const list = filter(source, clip, UNION);
  if (intermediate) {
    source.segments = list;
    return source;
  }
  // console.warn(list.map(item => item.toString()))
  return chains(list);
}

export function subtract(polygonA: Polygon | number[][][], polygonB: Polygon | number[][][], intermediate = false) {
  const [source, clip] = trivial(polygonA, polygonB);
  let list = filter(source, clip, SUBTRACT);
  // 暂时这样解决反向的问题
  if (!list.length) {
    // list = filter(source.segments.concat(clip.segments), SUBTRACT_REV);
  }
  // console.warn(list.map(item => item.toString()))
  if (intermediate) {
    source.segments = list;
    return source;
  }
  return chains(list);
}

export function subtractRev(polygonA: Polygon | number[][][], polygonB: Polygon | number[][][], intermediate = false) {
  const [source, clip] = trivial(polygonA, polygonB);
  const list = filter(source, clip, SUBTRACT_REV);
  if (intermediate) {
    source.segments = list;
    return source;
  }
  return chains(list);
}

export function xor(polygonA: Polygon | number[][][], polygonB: Polygon | number[][][], intermediate = false) {
  const [source, clip] = trivial(polygonA, polygonB);
  const list = filter(source, clip, XOR);
  if (intermediate) {
    source.segments = list;
    return source;
  }
  return chains(list);
}

export default {
  intersect,
  union,
  subtract,
  subtractRev,
  xor,
  chains,
};
