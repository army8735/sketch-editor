import { JStyle } from '../format';
import {
  calUnit,
  FONT_STYLE,
  MIX_BLEND_MODE,
  StyleArray,
  StyleKey,
  styleKey2Upper,
  StyleNumValue,
  StyleUnit,
  StyleValue,
} from './';
import { isNil } from '../util/type';

const TRANSFORM_HASH: any = {
  translateX: StyleKey.TRANSLATE_X,
  translateY: StyleKey.TRANSLATE_Y,
  scaleX: StyleKey.SCALE_X,
  scaleY: StyleKey.SCALE_Y,
  rotateZ: StyleKey.ROTATE_Z,
  rotate: StyleKey.ROTATE_Z,
};

function compatibleTransform(k: StyleKey, v: StyleValue) {
  if (k === StyleKey.SCALE_X || k === StyleKey.SCALE_Y) {
    v.u = StyleUnit.NUMBER;
  }
  else if (k === StyleKey.TRANSLATE_X || k === StyleKey.TRANSLATE_Y) {
    if (v.u === StyleUnit.NUMBER) {
      v.u = StyleUnit.PX;
    }
  }
  else {
    if (v.u === StyleUnit.NUMBER) {
      v.u = StyleUnit.DEG;
    }
  }
}

export function normalizeStyle(style: JStyle): any {
  const res: any = {};
  [
    'left',
    'top',
    'right',
    'bottom',
    'width',
    'height',
  ].forEach(k => {
    let v = style[k as keyof JStyle];
    if (isNil(v)) {
      return;
    }
    const n = calUnit(v as string | number || 0);
    // 无单位视为px
    if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
      n.u = StyleUnit.PX;
    }
    // 限定正数
    if (k === 'width' || k === 'height') {
      if (n.v < 0) {
        n.v = 0;
      }
    }
    const k2 = StyleKey[styleKey2Upper(k)];
    res[k2] = n;
  });
  const lineHeight = style.lineHeight;
  if (!isNil(lineHeight)) {
    if (lineHeight === 'normal') {
      res[StyleKey.LINE_HEIGHT] = {
        v: 0,
        u: StyleUnit.AUTO,
      };
    }
    else {
      let n = calUnit(lineHeight || 0);
      if (n.v <= 0) {
        n = {
          v: 0,
          u: StyleUnit.AUTO,
        };
      }
      else if ([StyleUnit.DEG, StyleUnit.NUMBER].indexOf(n.u) > -1) {
        n.u = StyleUnit.PX;
      }
      res[StyleKey.LINE_HEIGHT] = n;
    }
  }
  const visible = style.visible;
  if (!isNil(visible)) {
    res[StyleKey.VISIBLE] = {
      v: visible,
      u: StyleUnit.BOOLEAN,
    };
  }
  const fontFamily = style.fontFamily;
  if (!isNil(fontFamily)) {
    res[StyleKey.FONT_FAMILY] = {
      v: fontFamily.toString().trim().toLowerCase()
        .replace(/['"]/g, '')
        .replace(/\s*,\s*/g, ','),
      u: StyleUnit.STRING,
    }
  }
  const fontSize = style.fontSize;
  if (!isNil(fontSize)) {
    let n = calUnit(fontSize || 16);
    if (n.v <= 0) {
      n.v = 16;
    }
    // 防止小数
    n.v = Math.floor(n.v as number);
    if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
      n.u = StyleUnit.PX;
    }
    res[StyleKey.FONT_SIZE] = n;
  }
  const fontWeight = style.fontWeight;
  if (!isNil(fontWeight)) {
    if (/normal/i.test(fontWeight as string)) {
      res[StyleKey.FONT_WEIGHT] = { v: 400, u: StyleUnit.NUMBER };
    }
    else if (/bold/i.test(fontWeight as string)) {
      res[StyleKey.FONT_WEIGHT] = { v: 700, u: StyleUnit.NUMBER };
    }
    else if (/bolder/i.test(fontWeight as string)) {
      res[StyleKey.FONT_WEIGHT] = { v: 900, u: StyleUnit.NUMBER };
    }
    else if (/lighter/i.test(fontWeight as string)) {
      res[StyleKey.FONT_WEIGHT] = { v: 300, u: StyleUnit.NUMBER };
    }
    else {
      res[StyleKey.FONT_WEIGHT] = {
        v: Math.min(900, Math.max(100, parseInt(fontWeight as string) || 400)),
        u: StyleUnit.NUMBER,
      };
    }
  }
  const fontStyle = style.fontStyle;
  if (!isNil(fontStyle)) {
    let v = FONT_STYLE.NORMAL;
    if (/italic/i.test(fontStyle)) {
      v = FONT_STYLE.ITALIC;
    }
    else if (/oblique/i.test(fontStyle)) {
      v = FONT_STYLE.OBLIQUE;
    }
    res[StyleKey.FONT_STYLE] = { v, u: StyleUnit.NUMBER };
  }
  const color = style.color;
  if (!isNil(color)) {
    res[StyleKey.COLOR] = { v: color2rgbaInt(color), u: StyleUnit.RGBA };
  }
  const overflow = style.overflow;
  if (!isNil(overflow)) {
    res[StyleKey.OVERFLOW] = { v: overflow, u: StyleUnit.STRING };
  }
  const opacity = style.opacity;
  if (!isNil(opacity)) {
    res[StyleKey.OPACITY] = { v: Math.max(0, Math.min(1, opacity)), u: StyleUnit.NUMBER };
  }
  [
    'translateX',
    'translateY',
    'scaleX',
    'scaleY',
    'rotateZ',
  ].forEach(k => {
    let v = style[k as keyof JStyle];
    if (isNil(v)) {
      return;
    }
    const k2 = TRANSFORM_HASH[k];
    const n = calUnit(v as string | number);
    // 没有单位或默认值处理单位
    compatibleTransform(k2, n);
    res[k2] = n;
  });
  const transformOrigin = style.transformOrigin;
  if (!isNil(transformOrigin)) {
    let o: Array<number | string>;
    if (Array.isArray(transformOrigin)) {
      o = transformOrigin;
    }
    else {
      o = transformOrigin.match(/(([-+]?[\d.]+[pxremvwhina%]*)|(left|top|right|bottom|center)){1,2}/ig) as Array<string>;
    }
    if (o.length === 1) {
      o[1] = o[0];
    }
    const arr: Array<StyleNumValue> = [
      { v: 50, u: StyleUnit.PERCENT },
      { v: 50, u: StyleUnit.PERCENT },
    ];
    for (let i = 0; i < 2; i++) {
      let item = o[i];
      if (/^[-+]?[\d.]/.test(item as string)) {
        let n = calUnit(item);
        if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
          n.u = StyleUnit.PX;
        }
        arr.push(n);
      }
      else {
        arr.push({
          v: {
            top: 0,
            left: 0,
            center: 50,
            right: 100,
            bottom: 100,
          }[item] as number,
          u: StyleUnit.PERCENT,
        });
        // 不规范的写法变默认值50%
        if (isNil(arr[i].v)) {
          arr[i].v = 50;
        }
      }
    }
    res[StyleKey.TRANSFORM_ORIGIN] = arr;
  }
  const mixBlendMode = style.mixBlendMode;
  if (!isNil(mixBlendMode)) {
    let v = MIX_BLEND_MODE.NORMAL;
    if (/multiply/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.MULTIPLY;
    }
    else if (/screen/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.SCREEN;
    }
    else if (/overlay/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.OVERLAY;
    }
    else if (/darken/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.DARKEN;
    }
    else if (/lighten/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.LIGHTEN;
    }
    else if (/color-dodge/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.COLOR_DODGE;
    }
    else if (/color-burn/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.COLOR_BURN;
    }
    else if (/hard-light/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.HARD_LIGHT;
    }
    else if (/soft-light/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.SOFT_LIGHT;
    }
    else if (/difference/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.DIFFERENCE;
    }
    else if (/exclusion/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.EXCLUSION;
    }
    else if (/hue/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.HUE;
    }
    else if (/saturation/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.SATURATION;
    }
    else if (/color/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.COLOR;
    }
    else if (/luminosity/i.test(fontStyle)) {
      v = MIX_BLEND_MODE.LUMINOSITY;
    }
    res[StyleKey.MIX_BLEND_MODE] = { v, u: StyleUnit.NUMBER };
  }
  return res;
}

export function equalStyle(k: StyleKey, a: StyleArray, b: StyleArray) {
  if (k === StyleKey.TRANSFORM_ORIGIN) {
    return a[k][0].v === b[k][0].v && a[k][0].u === b[k][0].u
      && a[k][1].v === b[k][1].v && a[k][1].u === b[k][1].u;
  }
  if (k === StyleKey.COLOR) {
    return a[k].v[0] === b[k].v[0]
      && a[k].v[1] === b[k].v[1]
      && a[k].v[2] === b[k].v[2]
      && a[k].v[3] === b[k].v[3];
  }
  return a[k].v === b[k].v && a[k].u === b[k].u;
}

export function color2rgbaInt(color: string | Array<number>): Array<number> {
  if(Array.isArray(color)) {
    return color;
  }
  let res = [];
  if(!color || color === 'transparent') {
    res = [0, 0, 0, 0];
  }
  else if(color.charAt(0) === '#') {
    color = color.slice(1);
    if(color.length === 3) {
      res.push(parseInt(color.charAt(0) + color.charAt(0), 16));
      res.push(parseInt(color.charAt(1) + color.charAt(1), 16));
      res.push(parseInt(color.charAt(2) + color.charAt(2), 16));
      res[3] = 1;
    }
    else if(color.length === 6) {
      res.push(parseInt(color.slice(0, 2), 16));
      res.push(parseInt(color.slice(2, 4), 16));
      res.push(parseInt(color.slice(4), 16));
      res[3] = 1;
    }
    else if(color.length === 8) {
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
    let c = color.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if(c) {
      res = [parseInt(c[1]), parseInt(c[2]), parseInt(c[3])];
      if(!isNil(c[4])) {
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

export function color2rgbaStr(color: string | Array<number>): string {
  if(Array.isArray(color)) {
    if(color.length === 3 || color.length === 4) {
      color[0] = Math.floor(Math.max(color[0], 0));
      color[1] = Math.floor(Math.max(color[1], 0));
      color[2] = Math.floor(Math.max(color[2], 0));
      if(color.length === 4) {
        color[3] = Math.max(color[3], 0);
        return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + color[3] + ')';
      }
      return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',1)';
    }
  }
  return (color as string) || 'rgba(0,0,0,0)';
}
