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
