// @ts-ignore
const toString = {}.toString;

function isType(type: string) {
  return function(obj: any) {
    return toString.call(obj) === '[object ' + type + ']';
  }
}

function isTypes(types: Array<string>) {
  return function(obj: any) {
    let s = toString.call(obj);
    for(let i = 0, len = types.length; i < len; i++) {
      if(s === '[object ' + types[i] + ']') {
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
  if(!obj || toString.call(obj) !== '[object Object]') {
    return false;
  }
  let proto = Object.getPrototypeOf(obj);
  if(!proto) {
    return true;
  }
  let Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
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
};
