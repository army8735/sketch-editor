import { JStyle, Rich } from '../format';
import {
  BOOLEAN_OPERATION,
  calUnit,
  ComputedStyle,
  FILL_RULE,
  FONT_STYLE,
  MASK,
  MIX_BLEND_MODE,
  Style,
  StyleNumValue,
  StyleUnit,
  TEXT_ALIGN,
} from './define';
import { isNil, isString } from '../util/type';
import inject from '../util/inject';
import font from './font';
import reg from './reg';
import { parseGradient } from './gradient';

function compatibleTransform(k: string, v: StyleNumValue) {
  if (k === 'scaleX' || k === 'scaleY') {
    v.u = StyleUnit.NUMBER;
  }
  else if (k === 'translateX' || k === 'translateY') {
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

export function isGradient(s: string) {
  if(reg.gradient.test(s)) {
    let gradient = reg.gradient.exec(s);
    if(gradient && ['linear', 'radial', 'conic'].indexOf(gradient[1]) > -1) {
      return true;
    }
  }
  return false;
}

export function normalize(style: JStyle): Style {
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
    res[k] = n;
  });
  const lineHeight = style.lineHeight;
  if (!isNil(lineHeight)) {
    if (lineHeight === 'normal') {
      res.lineHeight = {
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
      res.lineHeight = n;
    }
  }
  const visible = style.visible;
  if (!isNil(visible)) {
    res.visible = {
      v: visible,
      u: StyleUnit.BOOLEAN,
    };
  }
  const fontFamily = style.fontFamily;
  if (!isNil(fontFamily)) {
    res.fontFamily = {
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
    // n.v = Math.floor(n.v);
    if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
      n.u = StyleUnit.PX;
    }
    res.fontSize = n;
  }
  const fontWeight = style.fontWeight;
  if (!isNil(fontWeight)) {
    if (isString(fontWeight)) {
      if (/thin/i.test(fontWeight as string)) {
        res.fontWeight = { v: 100, u: StyleUnit.NUMBER };
      }
      else if (/lighter/i.test(fontWeight as string)) {
        res.fontWeight = { v: 200, u: StyleUnit.NUMBER };
      }
      else if (/light/i.test(fontWeight as string)) {
        res.fontWeight = { v: 300, u: StyleUnit.NUMBER };
      }
      else if (/medium/i.test(fontWeight as string)) {
        res.fontWeight = { v: 500, u: StyleUnit.NUMBER };
      }
      else if (/semiBold/i.test(fontWeight as string)) {
        res.fontWeight = { v: 600, u: StyleUnit.NUMBER };
      }
      else if (/bold/i.test(fontWeight as string)) {
        res.fontWeight = { v: 700, u: StyleUnit.NUMBER };
      }
      else if (/extraBold/i.test(fontWeight as string)) {
        res.fontWeight = { v: 800, u: StyleUnit.NUMBER };
      }
      else if (/black/i.test(fontWeight as string)) {
        res.fontWeight = { v: 900, u: StyleUnit.NUMBER };
      }
      else {
        res.fontWeight = { v: 400, u: StyleUnit.NUMBER };
      }
    }
    else {
      res.fontWeight = {
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
    res.fontStyle = { v, u: StyleUnit.NUMBER };
  }
  const color = style.color;
  if (!isNil(color)) {
    res.color = { v: color2rgbaInt(color), u: StyleUnit.RGBA };
  }
  const backgroundColor = style.backgroundColor;
  if (!isNil(backgroundColor)) {
    res.backgroundColor = { v: color2rgbaInt(backgroundColor), u: StyleUnit.RGBA };
  }
  const overflow = style.overflow;
  if (!isNil(overflow)) {
    res.overflow = { v: overflow, u: StyleUnit.STRING };
  }
  const opacity = style.opacity;
  if (!isNil(opacity)) {
    res.opacity = { v: Math.max(0, Math.min(1, opacity)), u: StyleUnit.NUMBER };
  }
  const fill = style.fill;
  if (!isNil(fill)) {
    res.fill = fill.map(item => {
      if (isString(item) && isGradient(item as string)) {
        return { v: parseGradient(item as string), u: StyleUnit.GRADIENT };
      }
      else {
        return { v: color2rgbaInt(item), u: StyleUnit.RGBA };
      }
    });
  }
  const fillEnable = style.fillEnable;
  if (!isNil(fillEnable)) {
    res.fillEnable = fillEnable.map(item => {
      return { v: item, u: StyleUnit.BOOLEAN };
    });
  }
  const fillRule = style.fillRule;
  if (!isNil(fillRule)) {
    res.fillRule = { v: fillRule === 1 ? FILL_RULE.EVEN_ODD : FILL_RULE.NON_ZERO, u: StyleUnit.NUMBER };
  }
  const stroke = style.stroke;
  if (!isNil(stroke)) {
    res.stroke = stroke.map(item => {
      if (isString(item) && isGradient(item as string)) {
        return { v: parseGradient(item as string), u: StyleUnit.GRADIENT };
      }
      else {
        return { v: color2rgbaInt(item), u: StyleUnit.RGBA };
      }
    });
  }
  const strokeEnable = style.strokeEnable;
  if (!isNil(strokeEnable)) {
    res.strokeEnable = strokeEnable.map(item => {
      return { v: item, u: StyleUnit.BOOLEAN };
    });
  }
  const strokeWidth = style.strokeWidth;
  if (!isNil(strokeWidth)) {
    res.strokeWidth = strokeWidth.map(item => {
      return { v: Math.max(0, item), u: StyleUnit.PX };
    });
  }
  const strokeDasharray = style.strokeDasharray;
  if (!isNil(strokeDasharray)) {
    res.strokeDasharray = strokeDasharray.map(item => {
      return { v: Math.max(0, item), u: StyleUnit.PX };
    });
  }
  // 只有这几个，3d没有
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
    const n = calUnit(v as string | number);
    // 没有单位或默认值处理单位
    compatibleTransform(k, n);
    res[k] = n;
  });
  const letterSpacing = style.letterSpacing;
  if (!isNil(letterSpacing)) {
    let n = calUnit(letterSpacing || 0);
    if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(n.u) > -1) {
      n.u = StyleUnit.PX;
    }
    res.letterSpacing = n;
  }
  const textAlign = style.textAlign;
  if (!isNil(textAlign)) {
    let v = TEXT_ALIGN.LEFT;
    if (textAlign === 'center') {
      v = TEXT_ALIGN.CENTER;
    }
    else if (textAlign === 'right') {
      v = TEXT_ALIGN.RIGHT;
    }
    else if (textAlign === 'justify') {
      v = TEXT_ALIGN.JUSTIFY;
    }
    res.textAlign = { v, u: StyleUnit.STRING };
  }
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
    const arr: Array<StyleNumValue> = [];
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
    res.transformOrigin = arr;
  }
  const booleanOperation = style.booleanOperation;
  if (!isNil(booleanOperation)) {
    let v = BOOLEAN_OPERATION.NONE;
    if (booleanOperation  === 'union') {
      v = BOOLEAN_OPERATION.UNION;
    }
    else if (booleanOperation === 'subtract') {
      v = BOOLEAN_OPERATION.SUBTRACT;
    }
    else if (booleanOperation === 'intersect') {
      v = BOOLEAN_OPERATION.INTERSECT;
    }
    else if (booleanOperation === 'xor') {
      v = BOOLEAN_OPERATION.XOR;
    }
    res.booleanOperation = { v, u: StyleUnit.NUMBER };
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
    res.mixBlendMode = { v, u: StyleUnit.NUMBER };
  }
  const pointerEvents = style.pointerEvents;
  if (!isNil(pointerEvents)) {
    res.pointerEvents = { v: pointerEvents, u: StyleUnit.BOOLEAN };
  }
  const maskMode = style.maskMode;
  if (!isNil(maskMode)) {
    let v = MASK.NONE;
    if (maskMode === 'outline') {
      v = MASK.OUTLINE;
    }
    else if (maskMode === 'alpha') {
      v = MASK.ALPHA;
    }
    res.maskMode = { v, u: StyleUnit.NUMBER };
  }
  const breakMask = style.breakMask;
  if (!isNil(breakMask)) {
    res.breakMask = { v: breakMask, u: StyleUnit.BOOLEAN };
  }
  return res;
}

export function equalStyle(k: string, a: Style, b: Style) {
  if (k === 'transformOrigin') {
    return a[k][0].v === b[k][0].v && a[k][0].u === b[k][0].u
      && a[k][1].v === b[k][1].v && a[k][1].u === b[k][1].u;
  }
  if (k === 'color' || k === 'backgroundColor') {
    return a[k].v[0] === b[k].v[0]
      && a[k].v[1] === b[k].v[1]
      && a[k].v[2] === b[k].v[2]
      && a[k].v[3] === b[k].v[3];
  }
  // @ts-ignore
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
    if(color.length === 3 || color.length === 4) {
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
  const c = color2rgbaInt(color);
  if (Array.isArray(c)) {
    c[0] = Math.floor(Math.max(c[0], 0));
    c[1] = Math.floor(Math.max(c[1], 0));
    c[2] = Math.floor(Math.max(c[2], 0));
    if(c.length === 3 || c.length === 4) {
      if(c.length === 4) {
        c[3] = Math.max(c[3], 0);
        return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + c[3] + ')';
      }
      return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',1)';
    }
  }
  return (color as string) || 'rgba(0,0,0,0)';
}

function toHex(n: number) {
  let r = n.toString(16);
  if (r.length === 1) {
    r = '0' + r;
  }
  return r;
}

export function color2hexStr(color: string | Array<number>): string {
  if(Array.isArray(color)) {
    if(color.length === 3 || color.length === 4) {
      color[0] = Math.floor(Math.max(color[0], 0));
      color[1] = Math.floor(Math.max(color[1], 0));
      color[2] = Math.floor(Math.max(color[2], 0));
      if(color.length === 4 && color[3] < 1) {
        color[3] = Math.max(color[3], 0);
        return '#' + toHex(color[0]) + toHex(color[1]) + toHex(color[2])
          + toHex(Math.floor(color[3] * 255));
      }
      return '#' + toHex(color[0]) + toHex(color[1]) + toHex(color[2]);
    }
  }
  return (color as string) || '#000';
}

export function color2gl(color: string | Array<number>): Array<number> {
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

export function setFontStyle(style: ComputedStyle | Rich) {
  let fontSize = style.fontSize || 0;
  let fontFamily = style.fontFamily || inject.defaultFontFamily || 'arial';
  if(/\s/.test(fontFamily)) {
    fontFamily = '"' + fontFamily.replace(/"/g, '\\"') + '"';
  }
  return (style.fontStyle || 'normal') + ' ' + (style.fontWeight || '400') + ' '
    + fontSize + 'px/' + fontSize + 'px ' + fontFamily;
}

export function calFontFamily(fontFamily: string) {
  let ff = fontFamily.split(/\s*,\s*/);
  for(let i = 0, len = ff.length; i < len; i++) {
    let item = ff[i].replace(/^['"]/, '').replace(/['"]$/, '').toLowerCase();
    if(font.hasLoaded(item) || inject.checkSupportFontFamily(item)) {
      return item;
    }
  }
  return inject.defaultFontFamily;
}

export function calNormalLineHeight(style: ComputedStyle | Rich, ff?: string) {
  if(!ff) {
    ff = calFontFamily(style.fontFamily);
  }
  return Math.ceil(style.fontSize * (font.info[ff] || font.info[inject.defaultFontFamily] || font.info.arial).lhr);
}

/**
 * https://zhuanlan.zhihu.com/p/25808995
 * 根据字形信息计算baseline的正确值，差值上下均分
 * @param style computedStyle
 * @returns {number}
 */
export function getBaseline(style: ComputedStyle | Rich) {
  let fontSize = style.fontSize;
  let ff = calFontFamily(style.fontFamily);
  let normal = calNormalLineHeight(style, ff);
  return (style.lineHeight - normal) * 0.5 + fontSize * (font.info[ff] || font.info[inject.defaultFontFamily] || font.info.arial).blr;
}

export function calSize(v: StyleNumValue, p: number): number {
  if (v.u === StyleUnit.PX) {
    return v.v;
  }
  if (v.u === StyleUnit.PERCENT) {
    return v.v * p * 0.01;
  }
  return 0;
}

export default {
  normalize,
  equalStyle,
  color2rgbaInt,
  color2rgbaStr,
  color2gl,
  calFontFamily,
  calNormalLineHeight,
  getBaseline,
  calSize,
};
