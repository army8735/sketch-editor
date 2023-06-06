import Event from './Event';
import inject from './inject';
import opentype from './opentype';
import type, { isDate, isNil, isPlainObject } from './type';
import util from './util';

export function extend(target: any, source: any, keys?: Array<string>) {
  if (source === null || typeof source !== 'object') {
    return target;
  }
  if (!keys) {
    keys = Object.keys(source);
  }
  let i = 0;
  const len = keys.length;
  while (i < len) {
    const k = keys[i];
    target[k] = source[k];
    i++;
  }
  return target;
}

export function clone(obj: any) {
  if (isNil(obj) || typeof obj !== 'object') {
    return obj;
  }
  if (isDate(obj)) {
    return new Date(obj);
  }
  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return obj;
  }
  const n: any = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach((i) => {
    n[i] = clone(obj[i]);
  });
  return n;
}

export default {
  type,
  Event,
  inject,
  opentype,
  util,
};
