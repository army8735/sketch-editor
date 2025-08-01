import { isNil } from '../util/type';

export function color2rgbaInt(color: string | number[]): number[] {
  if (Array.isArray(color)) {
    return color;
  }
  let res = [];
  if (!color || /transparent/i.test(color)) {
    res = [0, 0, 0, 0];
  }
  else if (/^#?[a-f\d]{3,8}$/i.test(color)) {
    color = color.replace('#', '');
    if (color.length === 3 || color.length === 4) {
      res.push(parseInt(color.charAt(0) + color.charAt(0), 16));
      res.push(parseInt(color.charAt(1) + color.charAt(1), 16));
      res.push(parseInt(color.charAt(2) + color.charAt(2), 16));
      if (color.length === 4) {
        res[3] = parseInt(color.charAt(3) + color.charAt(3), 16);
      }
      else {
        res[3] = 1;
      }
    }
    else if (color.length === 6) {
      res.push(parseInt(color.slice(0, 2), 16));
      res.push(parseInt(color.slice(2, 4), 16));
      res.push(parseInt(color.slice(4), 16));
      res[3] = 1;
    }
    else if (color.length === 8) {
      res.push(parseInt(color.slice(0, 2), 16));
      res.push(parseInt(color.slice(2, 4), 16));
      res.push(parseInt(color.slice(4, 6), 16));
      res.push(parseInt(color.slice(6), 16) / 255);
    }
    else {
      res[0] = res[1] = res[2] = 0;
      res[3] = 1;
    }
  }
  else {
    let c = color.match(
      /rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i,
    );
    if (c) {
      res = [parseInt(c[1]), parseInt(c[2]), parseInt(c[3])];
      if (!isNil(c[4])) {
        res[3] = parseFloat(c[4]);
      }
      else {
        res[3] = 1;
      }
    }
    else {
      res = [0, 0, 0, 0];
    }
  }
  return res;
}

export function color2rgbaStr(color: string | number[]): string {
  const c = color2rgbaInt(color);
  if (Array.isArray(c)) {
    const r = Math.floor(Math.min(255, Math.max(c[0], 0)));
    const g = Math.floor(Math.min(255, Math.max(c[1], 0)));
    const b = Math.floor(Math.min(255, Math.max(c[2], 0)));
    if (c.length === 3 || c.length === 4) {
      if (c.length === 4) {
        const a = Math.min(1, Math.max(c[3], 0));
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
      }
      return 'rgba(' + r + ',' + g + ',' + b + ',1)';
    }
  }
  return (color as string) || 'rgba(0,0,0,0)';
}

function toHex(n: number) {
  let r = n.toString(16).toUpperCase();
  if (r.length === 1) {
    r = '0' + r;
  }
  return r;
}

export function color2hexStr(color: string | number[]): string {
  const c = color2rgbaInt(color);
  if (Array.isArray(c)) {
    const r = Math.floor(Math.min(255, Math.max(c[0], 0)));
    const g = Math.floor(Math.min(255, Math.max(c[1], 0)));
    const b = Math.floor(Math.min(255, Math.max(c[2], 0)));
    if (c.length === 3 || c.length === 4) {
      if (c.length === 4) {
        const a = Math.min(1, Math.max(c[3], 0));
        return (
          '#' +
          toHex(r) +
          toHex(g) +
          toHex(b) +
          toHex(Math.floor(a * 255))
        );
      }
      return '#' + toHex(r) + toHex(g) + toHex(b);
    }
  }
  return (color as string) || '#000';
}

export function color2gl(color: string | number[]): number[] {
  if (!Array.isArray(color)) {
    color = color2rgbaInt(color);
  }
  return [
    color[0] / 255,
    color[1] / 255,
    color[2] / 255,
    color.length === 3 ? 1 : color[3],
  ];
}

export function clampColor(c: number[]) {
  const r = Math.floor(Math.min(255, Math.max(c[0], 0)));
  const g = Math.floor(Math.min(255, Math.max(c[1], 0)));
  const b = Math.floor(Math.min(255, Math.max(c[2], 0)));
  if (c.length > 3) {
    const a = Math.min(1, Math.max(0, c[3]));
    return [r, g, b, a];
  }
  return [r, g, b];
}

export default {
  color2rgbaInt,
  color2rgbaStr,
  color2hexStr,
  color2gl,
  clampColor,
};
