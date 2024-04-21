import inject from '../util/inject';
import bezier from './bezier';

export function mergeBbox(
  bbox: Float64Array,
  a: number,
  b: number,
  c: number,
  d: number,
) {
  bbox[0] = Math.min(bbox[0], a);
  bbox[1] = Math.min(bbox[1], b);
  bbox[2] = Math.max(bbox[2], c);
  bbox[3] = Math.max(bbox[3], d);
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

export default {
  mergeBbox,
  getPointsRect,
  getShapeGroupRect,
};
