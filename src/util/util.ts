import { isDate, isNil, isPlainObject } from './type';

export function clone(obj: any) {
  if(isNil(obj) || typeof obj !== 'object') {
    return obj;
  }
  if(isDate(obj)) {
    return new Date(obj);
  }
  if(!isPlainObject(obj) && !Array.isArray(obj)) {
    return obj;
  }
  let n: any = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(i => {
    n[i] = clone(obj[i]);
  });
  return n;
}

export function mergeBbox(bbox: Float64Array, a: number, b: number, c: number, d: number) {
  bbox[0] = Math.min(bbox[0], a);
  bbox[1] = Math.min(bbox[1], b);
  bbox[2] = Math.max(bbox[2], c);
  bbox[3] = Math.max(bbox[3], d);
}
