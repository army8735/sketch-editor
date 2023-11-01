import { JStyle, Rich } from '../format';
import inject from '../util/inject';
import { isNil, isString } from '../util/type';
import {
  BLUR,
  BOOLEAN_OPERATION,
  calUnit,
  ComputedStyle,
  FILL_RULE,
  FONT_STYLE,
  MASK,
  MIX_BLEND_MODE,
  PATTERN_FILL_TYPE,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
  Style,
  StyleNumValue,
  StyleUnit,
  TEXT_ALIGN,
  TEXT_VERTICAL_ALIGN,
} from './define';
import font from './font';
import { parseGradient } from './gradient';
import reg from './reg';

function compatibleTransform(k: string, v: StyleNumValue) {
  if (k === 'scaleX' || k === 'scaleY') {
    v.u = StyleUnit.NUMBER;
  } else if (k === 'translateX' || k === 'translateY') {
    if (v.u === StyleUnit.NUMBER) {
      v.u = StyleUnit.PX;
    }
  } else {
    if (v.u === StyleUnit.NUMBER) {
      v.u = StyleUnit.DEG;
    }
  }
}

export function isGradient(s: string) {
  if (reg.gradient.test(s)) {
    let gradient = reg.gradient.exec(s);
    if (
      gradient &&
      ['linear', 'radial', 'conic'].indexOf(gradient[1].toLowerCase()) > -1
    ) {
      return true;
    }
  }
  return false;
}

export function normalize(style: any): Style {
  const res: any = {};
  ['left', 'top', 'right', 'bottom', 'width', 'height'].forEach((k) => {
    let v = style[k as keyof JStyle];
    if (isNil(v)) {
      return;
    }
    const n = calUnit((v as string | number) || 0, true);
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
    } else {
      let n = calUnit(lineHeight || 0, true);
      if (n.v <= 0) {
        n = {
          v: 0,
          u: StyleUnit.AUTO,
        };
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
      v: fontFamily
        .toString()
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/\s*,\s*/g, ','),
      u: StyleUnit.STRING,
    };
  }
  const fontSize = style.fontSize;
  if (!isNil(fontSize)) {
    let n = calUnit(fontSize || 16, true);
    if (n.v <= 0) {
      n.v = 16;
    }
    res.fontSize = n;
  }
  const fontWeight = style.fontWeight;
  if (!isNil(fontWeight)) {
    if (isString(fontWeight)) {
      if (/thin/i.test(fontWeight as string)) {
        res.fontWeight = { v: 100, u: StyleUnit.NUMBER };
      } else if (/lighter/i.test(fontWeight as string)) {
        res.fontWeight = { v: 200, u: StyleUnit.NUMBER };
      } else if (/light/i.test(fontWeight as string)) {
        res.fontWeight = { v: 300, u: StyleUnit.NUMBER };
      } else if (/medium/i.test(fontWeight as string)) {
        res.fontWeight = { v: 500, u: StyleUnit.NUMBER };
      } else if (/semiBold/i.test(fontWeight as string)) {
        res.fontWeight = { v: 600, u: StyleUnit.NUMBER };
      } else if (/bold/i.test(fontWeight as string)) {
        res.fontWeight = { v: 700, u: StyleUnit.NUMBER };
      } else if (/extraBold/i.test(fontWeight as string)) {
        res.fontWeight = { v: 800, u: StyleUnit.NUMBER };
      } else if (/black/i.test(fontWeight as string)) {
        res.fontWeight = { v: 900, u: StyleUnit.NUMBER };
      } else {
        res.fontWeight = { v: 400, u: StyleUnit.NUMBER };
      }
    } else {
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
    } else if (/oblique/i.test(fontStyle)) {
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
    res.backgroundColor = {
      v: color2rgbaInt(backgroundColor),
      u: StyleUnit.RGBA,
    };
  }
  const opacity = style.opacity;
  if (!isNil(opacity)) {
    res.opacity = { v: Math.max(0, Math.min(1, opacity)), u: StyleUnit.NUMBER };
  }
  const fill = style.fill;
  if (!isNil(fill)) {
    res.fill = fill.map((item: any) => {
      if (isString(item)) {
        if (isGradient(item as string)) {
          const v = parseGradient(item as string);
          if (v) {
            return { v, u: StyleUnit.GRADIENT };
          }
        } else if (reg.img.test(item as string)) {
          const v = reg.img.exec(item as string);
          if (v) {
            let type = PATTERN_FILL_TYPE.TILE;
            const s = item.replace(v[0], '');
            if (s.indexOf('fill') > -1) {
              type = PATTERN_FILL_TYPE.FILL;
            } else if (s.indexOf('stretch') > -1) {
              type = PATTERN_FILL_TYPE.STRETCH;
            } else if (s.indexOf('fit') > -1) {
              type = PATTERN_FILL_TYPE.FIT;
            }
            let scale;
            const v2 = /([\d.]+)%/.exec(s);
            if (v2) {
              scale = {
                v: parseFloat(v2[1]),
                u: StyleUnit.PERCENT,
              };
            }
            return { v: { url: v[2], type, scale }, u: StyleUnit.PATTERN };
          }
        }
      }
      return { v: color2rgbaInt(item), u: StyleUnit.RGBA };
    });
  }
  const fillEnable = style.fillEnable;
  if (!isNil(fillEnable)) {
    res.fillEnable = fillEnable.map((item: boolean) => {
      return { v: item, u: StyleUnit.BOOLEAN };
    });
  }
  const fillOpacity = style.fillOpacity;
  if (!isNil(fillOpacity)) {
    res.fillOpacity = fillOpacity.map((item: number) => {
      return { v: Math.max(0, Math.min(1, item)), u: StyleUnit.NUMBER };
    });
  }
  const fillMode = style.fillMode;
  if (!isNil(fillMode)) {
    res.fillMode = fillMode.map((item: string) => {
      return { v: getBlendMode(item), u: StyleUnit.NUMBER };
    });
  }
  const fillRule = style.fillRule;
  if (!isNil(fillRule)) {
    res.fillRule = {
      v: fillRule === 'evenodd' ? FILL_RULE.EVEN_ODD : FILL_RULE.NON_ZERO,
      u: StyleUnit.NUMBER,
    };
  }
  const stroke = style.stroke;
  if (!isNil(stroke)) {
    res.stroke = stroke.map((item: any) => {
      if (isString(item) && isGradient(item as string)) {
        return { v: parseGradient(item as string), u: StyleUnit.GRADIENT };
      } else {
        return { v: color2rgbaInt(item), u: StyleUnit.RGBA };
      }
    });
  }
  const strokeEnable = style.strokeEnable;
  if (!isNil(strokeEnable)) {
    res.strokeEnable = strokeEnable.map((item: boolean) => {
      return { v: item, u: StyleUnit.BOOLEAN };
    });
  }
  const strokeWidth = style.strokeWidth;
  if (!isNil(strokeWidth)) {
    res.strokeWidth = strokeWidth.map((item: number) => {
      return { v: Math.max(0, item), u: StyleUnit.PX };
    });
  }
  const strokePosition = style.strokePosition;
  if (!isNil(strokePosition)) {
    res.strokePosition = strokePosition.map((item: string) => {
      let v = STROKE_POSITION.CENTER;
      if (item === 'inside') {
        v = STROKE_POSITION.INSIDE;
      } else if (item === 'outside') {
        v = STROKE_POSITION.OUTSIDE;
      }
      return { v, u: StyleUnit.NUMBER };
    });
  }
  const strokeMode = style.strokeMode;
  if (!isNil(strokeMode)) {
    res.strokeMode = strokeMode.map((item: string) => {
      return { v: getBlendMode(item), u: StyleUnit.NUMBER };
    });
  }
  const strokeDasharray = style.strokeDasharray;
  if (!isNil(strokeDasharray)) {
    res.strokeDasharray = strokeDasharray.map((item: number) => {
      return { v: Math.max(0, item), u: StyleUnit.PX };
    });
  }
  const strokeLinecap = style.strokeLinecap;
  if (!isNil(strokeLinecap)) {
    let v = STROKE_LINE_CAP.BUTT;
    if (strokeLinecap === 'round') {
      v = STROKE_LINE_CAP.ROUND;
    } else if (strokeLinecap === 'square') {
      v = STROKE_LINE_CAP.SQUARE;
    }
    res.strokeLinecap = { v, u: StyleUnit.NUMBER };
  }
  const strokeLinejoin = style.strokeLinejoin;
  if (!isNil(strokeLinejoin)) {
    let v = STROKE_LINE_JOIN.MITER;
    if (strokeLinejoin === 'round') {
      v = STROKE_LINE_JOIN.ROUND;
    } else if (strokeLinejoin === 'bevel') {
      v = STROKE_LINE_JOIN.BEVEL;
    }
    res.strokeLinejoin = { v, u: StyleUnit.NUMBER };
  }
  const strokeMiterlimit = style.strokeMiterlimit;
  if (!isNil(strokeMiterlimit)) {
    res.strokeMiterlimit = { v: strokeMiterlimit, u: StyleUnit.NUMBER };
  }
  // 只有这几个，3d没有
  ['translateX', 'translateY', 'scaleX', 'scaleY', 'rotateZ'].forEach((k) => {
    let v = style[k as keyof JStyle];
    if (isNil(v)) {
      return;
    }
    const n = calUnit(v as string | number, false);
    // 没有单位或默认值处理单位
    compatibleTransform(k, n);
    res[k] = n;
  });
  const letterSpacing = style.letterSpacing;
  if (!isNil(letterSpacing)) {
    let n = calUnit(letterSpacing || 0, true);
    res.letterSpacing = n;
  }
  const paragraphSpacing = style.paragraphSpacing;
  if (!isNil(paragraphSpacing)) {
    let n = calUnit(paragraphSpacing || 0, true);
    res.paragraphSpacing = n;
  }
  const textAlign = style.textAlign;
  if (!isNil(textAlign)) {
    let v = TEXT_ALIGN.LEFT;
    if (textAlign === 'center') {
      v = TEXT_ALIGN.CENTER;
    } else if (textAlign === 'right') {
      v = TEXT_ALIGN.RIGHT;
    } else if (textAlign === 'justify') {
      v = TEXT_ALIGN.JUSTIFY;
    }
    res.textAlign = { v, u: StyleUnit.NUMBER };
  }
  const textVerticalAlign = style.textVerticalAlign;
  if (!isNil(textVerticalAlign)) {
    let v = TEXT_VERTICAL_ALIGN.TOP;
    if (textVerticalAlign === 'middle') {
      v = TEXT_VERTICAL_ALIGN.MIDDLE;
    }
    else if (textVerticalAlign === 'bottom') {
      v = TEXT_VERTICAL_ALIGN.BOTTOM;
    }
    res.textVerticalAlign = { v, u: StyleUnit.NUMBER };
  }
  const transformOrigin = style.transformOrigin;
  if (!isNil(transformOrigin)) {
    let o: Array<number | string>;
    if (Array.isArray(transformOrigin)) {
      o = transformOrigin;
    } else {
      o = transformOrigin.match(reg.position) as Array<string>;
    }
    if (o.length === 1) {
      o[1] = o[0];
    }
    const arr: Array<StyleNumValue> = [];
    for (let i = 0; i < 2; i++) {
      let item = o[i];
      if (/^[-+]?[\d.]/.test(item as string)) {
        let n = calUnit(item, true);
        arr.push(n);
      } else {
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
    if (booleanOperation === 'union') {
      v = BOOLEAN_OPERATION.UNION;
    } else if (booleanOperation === 'subtract') {
      v = BOOLEAN_OPERATION.SUBTRACT;
    } else if (booleanOperation === 'intersect') {
      v = BOOLEAN_OPERATION.INTERSECT;
    } else if (booleanOperation === 'xor') {
      v = BOOLEAN_OPERATION.XOR;
    }
    res.booleanOperation = { v, u: StyleUnit.NUMBER };
  }
  const mixBlendMode = style.mixBlendMode;
  if (!isNil(mixBlendMode)) {
    res.mixBlendMode = { v: getBlendMode(mixBlendMode), u: StyleUnit.NUMBER };
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
    } else if (maskMode === 'alpha') {
      v = MASK.ALPHA;
    }
    res.maskMode = { v, u: StyleUnit.NUMBER };
  }
  const breakMask = style.breakMask;
  if (!isNil(breakMask)) {
    res.breakMask = { v: breakMask, u: StyleUnit.BOOLEAN };
  }
  const blur = style.blur;
  if (!isNil(blur)) {
    const v = reg.blur.exec(blur);
    if (v) {
      const t = v[1].toLowerCase();
      if (t === 'gauss') {
        res.blur = {
          v: { t: BLUR.GAUSSIAN, radius: { v: parseFloat(v[2]) || 0, u: StyleUnit.PX } },
          u: StyleUnit.BLUR,
        };
      } else if (t === 'background') {
        const match = /saturation\s*\((.+)\)/i.exec(blur);
        let saturation = 0;
        if (match) {
          saturation = parseInt(match[1]) || 0;
        }
        res.blur = {
          v: {
            t: BLUR.BACKGROUND,
            radius: { v: parseInt(v[2]) || 0, u: StyleUnit.PX },
            saturation: { v: saturation, u: StyleUnit.PERCENT },
          },
          u: StyleUnit.BLUR,
        };
      } else if (t === 'radial') {
        const match = /center\s*\((.+)\)/i.exec(blur);
        let center = [{ v: 50, u: StyleUnit.PERCENT }, { v: 50, u: StyleUnit.PERCENT }];
        if (match) {
          const m = match[1].match(reg.number);
          if (m) {
            center[0] = {
              v: parseFloat(m[0]),
              u: StyleUnit.PERCENT,
            };
            center[1] = {
              v: parseFloat(m[1]),
              u: StyleUnit.PERCENT,
            };
          }
        }
        res.blur = { v: { t: BLUR.RADIAL, radius: { v: parseFloat(v[2]) || 0, u: StyleUnit.PX }, center }, u: StyleUnit.BLUR };
      } else if (t === 'motion') {
        const match = /angle\s*\((.+)\)/i.exec(blur);
        let angle = {
          v: 0,
          u: StyleUnit.DEG,
        };
        if (match) {
          angle.v = parseFloat(match[1]);
        }
        res.blur = { v: { t: BLUR.MOTION, radius: { v: parseFloat(v[2]) || 0, u: StyleUnit.PX }, angle }, u: StyleUnit.BLUR };
      } else {
        res.blur = { v: { t: BLUR.NONE }, u: StyleUnit.BLUR };
      }
    } else {
      res.blur = { v: { t: BLUR.NONE }, u: StyleUnit.BLUR };
    }
  }
  const shadow = style.shadow;
  if (!isNil(shadow)) {
    res.shadow = shadow.map((item: string) => {
      const color = reg.color.exec(item);
      let s = item;
      if (color) {
        s = s.slice(0, color.index) + s.slice(color.index + color[0].length);
      }
      const d = s.match(reg.number);
      const x = calUnit(d ? d[0] : '0px', true);
      const y = calUnit(d ? d[1] : '0px', true);
      const blur = calUnit(d ? d[2] : '0px', true);
      // blur一定非负
      blur.v = Math.max(0, blur.v);
      const spread = calUnit(d ? d[3] : '0px', true);
      // spread.v = Math.max(0, spread.v);
      return {
        v: {
          x,
          y,
          blur,
          spread,
          color: {
            v: color2rgbaInt(color ? color[0] : '#000'),
            u: StyleUnit.RGBA,
          },
        },
        u: StyleUnit.SHADOW,
      };
    });
  }
  const shadowEnable = style.shadowEnable;
  if (!isNil(shadowEnable)) {
    res.shadowEnable = shadowEnable.map((item: boolean) => {
      return { v: item, u: StyleUnit.BOOLEAN };
    });
  }
  const innerShadow = style.innerShadow;
  if (!isNil(innerShadow)) {
    res.innerShadow = innerShadow.map((item: string) => {
      const color = reg.color.exec(item);
      let s = item;
      if (color) {
        s = s.slice(0, color.index) + s.slice(color.index + color[0].length);
      }
      const d = s.match(reg.number);
      const x = calUnit(d ? d[0] : '0px', true);
      const y = calUnit(d ? d[1] : '0px', true);
      const blur = calUnit(d ? d[2] : '0px', true);
      // blur和spread一定非负
      blur.v = Math.max(0, blur.v);
      const spread = calUnit(d ? d[3] : '0px', true);
      spread.v = Math.max(0, spread.v);
      return {
        v: {
          x,
          y,
          blur,
          spread,
          color: {
            v: color2rgbaInt(color ? color[0] : '#000'),
            u: StyleUnit.RGBA,
          },
        },
        u: StyleUnit.SHADOW,
      };
    });
  }
  const innerShadowEnable = style.innerShadowEnable;
  if (!isNil(innerShadowEnable)) {
    res.innerShadowEnable = innerShadowEnable.map((item: boolean) => {
      return { v: item, u: StyleUnit.BOOLEAN };
    });
  }
  ['hueRotate', 'saturate', 'brightness', 'contrast'].forEach(k => {
    const v = style[k];
    if (!isNil(v)) {
      const n = calUnit(v);
      // hue是角度，其它都是百分比
      if (k === 'hueRotate') {
        if (n.u !== StyleUnit.DEG) {
          n.u = StyleUnit.DEG;
        }
      }
      if (k !== 'hueRotate') {
        if (n.u !== StyleUnit.PERCENT) {
          n.v *= 100;
          n.u = StyleUnit.PERCENT;
        }
      }
      res[k] = n;
    }
  });
  const matrix = style.matrix;
  if (!isNil(matrix)) {
    res.matrix = { v: style.matrix, u: StyleUnit.MATRIX };
  }
  return res;
}

function getBlendMode(blend: string) {
  let v = MIX_BLEND_MODE.NORMAL;
  if (/multiply/i.test(blend)) {
    v = MIX_BLEND_MODE.MULTIPLY;
  } else if (/screen/i.test(blend)) {
    v = MIX_BLEND_MODE.SCREEN;
  } else if (/overlay/i.test(blend)) {
    v = MIX_BLEND_MODE.OVERLAY;
  } else if (/darken/i.test(blend)) {
    v = MIX_BLEND_MODE.DARKEN;
  } else if (/lighten/i.test(blend)) {
    v = MIX_BLEND_MODE.LIGHTEN;
  } else if (/color-dodge/i.test(blend)) {
    v = MIX_BLEND_MODE.COLOR_DODGE;
  } else if (/color-burn/i.test(blend)) {
    v = MIX_BLEND_MODE.COLOR_BURN;
  } else if (/hard-light/i.test(blend)) {
    v = MIX_BLEND_MODE.HARD_LIGHT;
  } else if (/soft-light/i.test(blend)) {
    v = MIX_BLEND_MODE.SOFT_LIGHT;
  } else if (/difference/i.test(blend)) {
    v = MIX_BLEND_MODE.DIFFERENCE;
  } else if (/exclusion/i.test(blend)) {
    v = MIX_BLEND_MODE.EXCLUSION;
  } else if (/hue/i.test(blend)) {
    v = MIX_BLEND_MODE.HUE;
  } else if (/saturation/i.test(blend)) {
    v = MIX_BLEND_MODE.SATURATION;
  } else if (/color/i.test(blend)) {
    v = MIX_BLEND_MODE.COLOR;
  } else if (/luminosity/i.test(blend)) {
    v = MIX_BLEND_MODE.LUMINOSITY;
  }
  return v;
}

export function equalStyle(k: string, a: Style, b: Style) {
  // @ts-ignore
  const av = a[k];
  // @ts-ignore
  const bv = b[k];
  if (k === 'transformOrigin') {
    return (
      av[0].v === bv[0].v &&
      av[0].u === bv[0].u &&
      av[1].v === bv[1].v &&
      av[1].u === bv[1].u
    );
  }
  if (k === 'color' || k === 'backgroundColor') {
    return (
      av.v[0] === bv.v[0] &&
      av.v[1] === bv.v[1] &&
      av.v[2] === bv.v[2] &&
      av.v[3] === bv.v[3]
    );
  }
  if (k === 'fill' || k === 'stroke') {
    if (av.length !== bv.length) {
      return false;
    }
    for (let i = 0, len = av.length; i < len; i++) {
      const ai = av[i],
        bi = bv[i];
      if (ai.u !== bi.u) {
        return false;
      }
      if (ai.u === StyleUnit.RGBA) {
        if (
          ai.v[0] !== bi.v[0] ||
          ai.v[1] !== bi.v[1] ||
          ai.v[2] !== bi.v[2] ||
          ai.v[3] !== bi.v[3]
        ) {
          return false;
        }
      } else if (ai.u === StyleUnit.GRADIENT) {
        if (ai.v.t !== bi.v.t) {
          return false;
        }
        if (ai.v.d.length !== bi.v.d.length) {
          return false;
        }
        for (let i = 0, len = ai.v.d.length; i < len; i++) {
          if (ai.v.d[i] !== bi.v.d[i]) {
            return false;
          }
        }
        if (ai.v.stops.length !== bi.v.stops.length) {
          return false;
        }
        for (let i = 0, len = ai.v.stops.length; i < len; i++) {
          const as = ai.v.stops[i],
            bs = bi.v.stops[i];
          if (
            as.color.v[0] !== bs.color.v[0] ||
            as.color.v[1] !== bs.color.v[1] ||
            as.color.v[2] !== bs.color.v[2] ||
            as.color.v[3] !== bs.color.v[3]
          ) {
            return false;
          }
          if ((as.offset && !bs.offset) || (!as.offset && bs.offset)) {
            return false;
          }
          if (as.offset.u !== bs.offset.u || as.offset.v !== bs.offset.v) {
            return false;
          }
        }
      }
    }
    return true;
  }
  if (
    k === 'fillEnable' ||
    k === 'fillRule' ||
    k === 'fillOpacity' ||
    k === 'strokeEnable' ||
    k === 'strokeWidth' ||
    k === 'strokePosition' ||
    k === 'strokeDasharray'
  ) {
    if (av.length !== bv.length) {
      return false;
    }
    for (let i = 0, len = av.length; i < len; i++) {
      const ai = av[i],
        bi = bv[i];
      if (ai.u !== bi.u || ai.v !== bi.v) {
        return false;
      }
    }
    return true;
  }
  if (k === 'matrix') {
    if (av && !bv || !av && bv) {
      return false;
    }
    const v1 = av.v, v2 = bv.v;
    if (v1.length !== v2.length) {
      return false;
    }
    for (let i = 0, len = v1.length; i < len; i++) {
      if (v1[i] !== v2[i]) {
        return false;
      }
    }
    return true;
  }
  return av.v === bv.v && av.u === bv.u;
}

export function color2rgbaInt(color: string | number[]): number[] {
  if (Array.isArray(color)) {
    return color;
  }
  let res = [];
  if (!color || /transparent/i.test(color)) {
    res = [0, 0, 0, 0];
  } else if (/^#?[a-f\d]{3,8}$/i.test(color)) {
    color = color.replace('#', '');
    if (color.length === 3 || color.length === 4) {
      res.push(parseInt(color.charAt(0) + color.charAt(0), 16));
      res.push(parseInt(color.charAt(1) + color.charAt(1), 16));
      res.push(parseInt(color.charAt(2) + color.charAt(2), 16));
      if (color.length === 4) {
        res[3] = parseInt(color.charAt(3) + color.charAt(3), 16);
      } else {
        res[3] = 1;
      }
    } else if (color.length === 6) {
      res.push(parseInt(color.slice(0, 2), 16));
      res.push(parseInt(color.slice(2, 4), 16));
      res.push(parseInt(color.slice(4), 16));
      res[3] = 1;
    } else if (color.length === 8) {
      res.push(parseInt(color.slice(0, 2), 16));
      res.push(parseInt(color.slice(2, 4), 16));
      res.push(parseInt(color.slice(4, 6), 16));
      res.push(parseInt(color.slice(6), 16) / 255);
    } else {
      res[0] = res[1] = res[2] = 0;
      res[3] = 1;
    }
  } else {
    let c = color.match(
      /rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i,
    );
    if (c) {
      res = [parseInt(c[1]), parseInt(c[2]), parseInt(c[3])];
      if (!isNil(c[4])) {
        res[3] = parseFloat(c[4]);
      } else {
        res[3] = 1;
      }
    } else {
      res = [0, 0, 0, 0];
    }
  }
  return res;
}

export function color2rgbaStr(color: string | number[]): string {
  const c = color2rgbaInt(color);
  if (Array.isArray(c)) {
    c[0] = Math.floor(Math.max(c[0], 0));
    c[1] = Math.floor(Math.max(c[1], 0));
    c[2] = Math.floor(Math.max(c[2], 0));
    if (c.length === 3 || c.length === 4) {
      if (c.length === 4) {
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

export function color2hexStr(color: string | number[]): string {
  const c = color2rgbaInt(color);
  if (Array.isArray(c)) {
    if (c.length === 3 || c.length === 4) {
      c[0] = Math.floor(Math.max(c[0], 0));
      c[1] = Math.floor(Math.max(c[1], 0));
      c[2] = Math.floor(Math.max(c[2], 0));
      if (c.length === 4 && c[3] < 1) {
        c[3] = Math.max(c[3], 0);
        return (
          '#' +
          toHex(c[0]) +
          toHex(c[1]) +
          toHex(c[2]) +
          toHex(Math.floor(c[3] * 255))
        );
      }
      return '#' + toHex(c[0]) + toHex(c[1]) + toHex(c[2]);
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

export function setFontStyle(style: ComputedStyle | Rich) {
  const fontSize = style.fontSize || 0;
  let fontFamily = style.fontFamily || inject.defaultFontFamily;
  fontFamily += ',' + 'pingfangsc-regular';
  if (/\s/.test(fontFamily)) {
    fontFamily = '"' + fontFamily.replace(/"/g, '\\"') + '"';
  }
  return (
    (style.fontStyle || '') +
    ' ' +
    (style.fontWeight || '400') +
    ' ' +
    fontSize +
    'px/' +
    fontSize +
    'px ' +
    fontFamily
  );
}

export function calFontFamily(fontFamily: string) {
  const ff = fontFamily.split(/\s*,\s*/);
  for (let i = 0, len = ff.length; i < len; i++) {
    let item = ff[i].replace(/^['"]/, '').replace(/['"]$/, '').toLowerCase();
    if (font.hasRegister(item) || inject.checkSupportFontFamily(item)) {
      return item;
    }
  }
  return inject.defaultFontFamily;
}

export function calNormalLineHeight(style: ComputedStyle | Rich, ff?: string) {
  if (!ff) {
    ff = calFontFamily(style.fontFamily);
  }
  const lhr =
    (font.data[ff] || font.data[inject.defaultFontFamily] || font.data.arial)
      .lhr || 1.2;
  return style.fontSize * lhr;
}

/**
 * https://zhuanlan.zhihu.com/p/25808995
 * 根据字形信息计算baseline的正确值，差值上下均分
 */
export function getBaseline(style: ComputedStyle | Rich, lineHeight?: number) {
  let fontSize = style.fontSize;
  let ff = calFontFamily(style.fontFamily);
  let normal = calNormalLineHeight(style, ff);
  const blr =
    (font.data[ff] || font.data[inject.defaultFontFamily] || font.data.arial)
      .blr || 1;
  return ((lineHeight ?? style.lineHeight) - normal) * 0.5 + fontSize * blr;
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
  color2hexStr,
  color2gl,
  calFontFamily,
  calNormalLineHeight,
  getBaseline,
  calSize,
};
