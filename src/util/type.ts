// @ts-ignore
const toString = {}.toString;

function isType(type: string) {
  return function (obj: any) {
    return toString.call(obj) === '[object ' + type + ']';
  }
}

function isTypes(types: Array<string>) {
  return function (obj: any) {
    let s = toString.call(obj);
    for (let i = 0, len = types.length; i < len; i++) {
      if (s === '[object ' + types[i] + ']') {
        return true;
      }
    }
    return false;
  }
}

export const isObject = isType('Object');
export const isString = isType('String');
export const isFunction = isTypes(['Function', 'AsyncFunction', 'GeneratorFunction']);
export const isNumber = isType('Number');
export const isBoolean = isType('Boolean');
export const isDate = isType('Date');

const hasOwn = {}.hasOwnProperty;
const fnToString = hasOwn.toString;
const ObjectFunctionString = fnToString.call(Object);

export function isNil(v: any) {
  return v === undefined || v === null;
}

export function isPlainObject(obj: any) {
  if (!obj || toString.call(obj) !== '[object Object]') {
    return false;
  }
  let proto = Object.getPrototypeOf(obj);
  if (!proto) {
    return true;
  }
  let Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
}

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
  let n: any = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach((i) => {
    n[i] = clone(obj[i]);
  });
  return n;
}

// 深度对比对象
export function equal(a: any, b: any, keys?: string[]) {
  if (a === b) {
    return true;
  }
  if (isObject(a) && isObject(b)) {
    const hash: any = {};
    let arr = keys || Object.keys(a);
    for (let i = 0, len = arr.length; i < len; i++) {
      const k = arr[i];
      if (!b.hasOwnProperty(k) || !equal(a[k], b[k])) {
        return false;
      }
      hash[k] = true;
    }
    // a没有b有则false
    arr = keys || Object.keys(b);
    for (let i = 0, len = arr.length; i < len; i++) {
      const k = arr[i];
      if (!hash.hasOwnProperty(k)) {
        return false;
      }
    }
    return true;
  }
  else if (isDate(a) && isDate(b)) {
    return a.getTime() === b.getTime();
  }
  else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0, len = a.length; i < len; i++) {
      if (!equal(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  return a === b;
}

export default {
  isNil,
  isString,
  isNumber,
  isObject,
  isBoolean,
  isDate,
  isFunction,
  isPlainObject,
  equal,
  extend,
  clone,
};
