import inject from '../util/inject';
import bezier from './bezier';
import { calPoint, identity, isE, multiply } from './matrix';
import Node from '../node/Node';

export function mergeBbox(
  bbox: Float64Array,
  a: number | Float64Array, // target
  b: number | Float64Array, // matrix
  c?: number,
  d?: number,
) {
  if (arguments.length === 3) {
    let [x1, y1, x2, y2] = a as Float64Array;
    if (!isE(b as Float64Array)) {
      const t1 = calPoint({ x: x1, y: y1 }, b as Float64Array);
      const t2 = calPoint({ x: x1, y: y2 }, b as Float64Array);
      const t3 = calPoint({ x: x2, y: y1 }, b as Float64Array);
      const t4 = calPoint({ x: x2, y: y2 }, b as Float64Array);
      x1 = Math.min(t1.x, t2.x, t3.x, t4.x);
      y1 = Math.min(t1.y, t2.y, t3.y, t4.y);
      x2 = Math.max(t1.x, t2.x, t3.x, t4.x);
      y2 = Math.max(t1.y, t2.y, t3.y, t4.y);
    }
    bbox[0] = Math.min(bbox[0], x1);
    bbox[1] = Math.min(bbox[1], y1);
    bbox[2] = Math.max(bbox[2], x2);
    bbox[3] = Math.max(bbox[3], y2);
  }
  else if (arguments.length === 2) {
    bbox[0] = Math.min(bbox[0], (a as Float64Array)[0]);
    bbox[1] = Math.min(bbox[1], (a as Float64Array)[1]);
    bbox[2] = Math.max(bbox[2], (a as Float64Array)[2]);
    bbox[3] = Math.max(bbox[3], (a as Float64Array)[3]);
  }
  else if (arguments.length === 5) {
    bbox[0] = Math.min(bbox[0], a as number);
    bbox[1] = Math.min(bbox[1], b as number);
    bbox[2] = Math.max(bbox[2], c!);
    bbox[3] = Math.max(bbox[3], d!);
  }
}

function mergeFirst(item: number[], res: Float64Array) {
  let x: number, y: number;
  if (item.length === 6) {
    x = item[4];
    y = item[5];
  }
  else if (item.length === 4) {
    x = item[2];
    y = item[3];
  }
  else if (item.length === 2) {
    x = item[0];
    y = item[1];
  }
  else {
    return;
  }
  res[0] = x;
  res[1] = y;
  res[2] = x;
  res[3] = y;
  return { x, y };
}

function mergeNotFirst(item: number[], x2: number, y2: number, res: Float64Array) {
  let x: number, y: number;
  if (item.length === 4) {
    x = item[2];
    y = item[3];
    const b = bezier.bboxBezier(x2, y2, item[0], item[1], x, y);
    mergeBbox(res, b[0], b[1], b[2], b[3]);
  }
  else if (item.length === 6) {
    x = item[4];
    y = item[5];
    const b = bezier.bboxBezier(
      x2,
      y2,
      item[0],
      item[1],
      item[2],
      item[3],
      x,
      y,
    );
    mergeBbox(res, b[0], b[1], b[2], b[3]);
  }
  else if (item.length === 2) {
    x = item[0];
    y = item[1];
    mergeBbox(res, x, y, x, y);
  }
  else {
    return;
  }
  return { x, y };
}

export function getPointsRect(points: number[][], res?: Float64Array) {
  let isFirst = true;
  res = res || new Float64Array(4);
  let x = 0, y = 0;
  for (let i = 0, len = points.length; i < len; i++) {
    const item = points[i];
    if (isFirst) {
      const t = mergeFirst(item, res);
      if (!t) {
        inject.error('Unsupported point data: ' + i + ' - ' + item.join(','));
        continue;
      }
      x = t.x;
      y = t.y;
      isFirst = false;
    }
    else {
      const t = mergeNotFirst(item, x, y, res);
      if(!t) {
        inject.error('Unsupported point data: ' + i + ' - ' + item.join(','));
        continue;
      }
      x = t.x;
      y = t.y;
    }
  }
  return res;
}

export function getShapeGroupRect(points: number[][][], res?: Float64Array) {
  let isFirst = true;
  res = res || new Float64Array(4);
  let x = 0, y = 0;
  for (let i = 0, len = points.length; i < len; i++) {
    const list = points[i];
    for (let j = 0, len2 = list.length; j < len2; j++) {
      const item = list[j];
      if (isFirst) {
        const t = mergeFirst(item, res);
        if (!t) {
          inject.error('Unsupported point data: ' + i + ':' + j + ' - ' + item.join(','));
          continue;
        }
        x = t.x;
        y = t.y;
        isFirst = false;
      }
      else {
        const t = mergeNotFirst(item, x, y, res);
        if(!t) {
          inject.error('Unsupported point data: ' + i + ':' + j + ' - ' + item.join(','));
          continue;
        }
        x = t.x;
        y = t.y;
      }
    }
  }
  return res;
}

export function getGroupRect(group: Node, res?: Float64Array) {
  res = res || new Float64Array(4);
  const root = group.root;
  if (!root) {
    return res;
  }
  const structs = root.structs;
  const struct = group.struct;
  let i = structs.indexOf(struct);
  if (i < 0) {
    return res;
  }
  group.tempMatrix = identity();
  i++;
  let first = true;
  for (let len = i + struct.total; i < len; i++) {
    const { node, total } = structs[i];
    const m = node.tempMatrix = multiply(node.parent!.tempMatrix, node.matrix);
    let r = node._rect || node.rect;
    // 首次赋值，否则merge
    if (first) {
      let [x1, y1, x2, y2] = r;
      const t1 = calPoint({ x: x1, y: y1 }, m);
      const t2 = calPoint({ x: x1, y: y2 }, m);
      const t3 = calPoint({ x: x2, y: y1 }, m);
      const t4 = calPoint({ x: x2, y: y2 }, m);
      x1 = Math.min(t1.x, t2.x, t3.x, t4.x);
      y1 = Math.min(t1.y, t2.y, t3.y, t4.y);
      x2 = Math.max(t1.x, t2.x, t3.x, t4.x);
      y2 = Math.max(t1.y, t2.y, t3.y, t4.y);
      res[0] = x1;
      res[1] = y1;
      res[2] = x2;
      res[3] = y2;
    }
    else {
      mergeBbox(res, r, m);
    }
    first = false;
    // 遮罩跳过被遮罩节点
    if (node.computedStyle.maskMode) {
      let count = 0;
      let next = node.next;
      while (next && !next.computedStyle.breakMask) {
        count++;
        next = next.next;
      }
      i += count;
    }
  }
  return res;
}

export default {
  mergeBbox,
  getPointsRect,
  getShapeGroupRect,
  getGroupRect,
};
