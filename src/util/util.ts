import { isDate, isNil, isObject, isPlainObject } from './type';
import inject from './inject';

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
export function equal(a: any, b: any) {
  if (a === b) {
    return true;
  }
  if (isObject(a) && isObject(b)) {
    const hash: any = {};
    for (let i = 0, arr = Object.keys(a), len = arr.length; i < len; i++) {
      const k = arr[i];
      if (!b.hasOwnProperty(k) || !equal(a[k], b[k])) {
        return false;
      }
      hash[k] = true;
    }
    // a没有b有则false
    for (let i = 0, arr = Object.keys(b), len = arr.length; i < len; i++) {
      const k = arr[i];
      if (!hash.hasOwnProperty(k)) {
        return false;
      }
    }
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
  }
  return a === b;
}

export function renderTemplate(t: string, vars: Record<string, any>) {
  return t.replace(/\${([\w$-]+)}/g, function($0, $1) {
    if (vars.hasOwnProperty($1)) {
      return vars[$1];
    }
    return '';
  });
}

export async function loadLocalFonts() {
  try {
    const status = await navigator.permissions.query({
      // @ts-ignore
      name: 'local-fonts',
    });
    if(status.state === 'denied') {
      inject.error('No Permission.');
      return [];
    }
    // @ts-ignore
    return await window.queryLocalFonts();
  } catch(err) {
    inject.error(err);
    return [];
  }
}

export default {
  equal,
  clone,
  renderTemplate,
  loadLocalFonts,
};
