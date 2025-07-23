import { JPoint, JRich, JStyle, Rich } from '../format';
import inject from '../util/inject';
import { isNil, isString } from '../util/type';
import {
  BLUR,
  BOOLEAN_OPERATION,
  calUnit,
  ComputedGradient,
  ComputedPattern,
  ComputedShadow,
  ComputedStyle,
  CURVE_MODE,
  FILL_RULE,
  FONT_STYLE,
  MASK,
  MIX_BLEND_MODE, OVERFLOW,
  PATTERN_FILL_TYPE,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
  Style,
  StyleNumValue,
  StyleUnit,
  TEXT_ALIGN,
  TEXT_DECORATION,
  TEXT_VERTICAL_ALIGN,
  VISIBILITY,
} from './define';
import font from './font';
import { convert2Css, isGradient, parseGradient } from './gradient';
import reg from './reg';

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

export function normalize(style: any): Style {
  const res: any = {};
  [
    'left', 'top', 'right', 'bottom', 'width', 'height',
    'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  ].forEach((k) => {
    if (!style.hasOwnProperty(k)) {
      return;
    }
    let v = style[k as keyof JStyle];
    const n = calUnit((v as string | number) || 0, true);
    // 限定正数
    if (k === 'width' || k === 'height') {
      if (n.v < 0) {
        n.v = 0;
      }
    }
    res[k] = n;
  });
  if (style.hasOwnProperty('lineHeight')) {
    const lineHeight = style.lineHeight;
    if (isNil(lineHeight) || lineHeight === 'normal') {
      res.lineHeight = {
        v: 0,
        u: StyleUnit.AUTO,
      };
    }
    else {
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
  if (style.hasOwnProperty('visibility')) {
    res.visibility = {
      v: /hidden/i.test(style.visibility) ? VISIBILITY.HIDDEN : VISIBILITY.VISIBLE,
      u: StyleUnit.NUMBER,
    };
  }
  if (style.hasOwnProperty('fontFamily')) {
    res.fontFamily = {
      v: (style.fontFamily || '')
        .toString()
        .trim()
        .replace(/['"]/g, '')
        .replace(/\s*,\s*/g, ','),
      u: StyleUnit.STRING,
    };
  }
  if (style.hasOwnProperty('fontSize')) {
    let n = calUnit(style.fontSize || inject.defaultFontSize, true);
    if (n.v <= 0) {
      n.v = inject.defaultFontSize;
    }
    res.fontSize = n;
  }
  if (style.hasOwnProperty('fontWeight')) {
    const fontWeight = style.fontWeight;
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
  if (style.hasOwnProperty('fontStyle')) {
    const fontStyle = style.fontStyle;
    let v = FONT_STYLE.NORMAL;
    if (/italic/i.test(fontStyle)) {
      v = FONT_STYLE.ITALIC;
    }
    else if (/oblique/i.test(fontStyle)) {
      v = FONT_STYLE.OBLIQUE;
    }
    res.fontStyle = { v, u: StyleUnit.NUMBER };
  }
  if (style.hasOwnProperty('color')) {
    res.color = { v: color2rgbaInt(style.color), u: StyleUnit.RGBA };
  }
  if (style.hasOwnProperty('backgroundColor')) {
    const backgroundColor = style.backgroundColor;
    res.backgroundColor = {
      v: color2rgbaInt(backgroundColor),
      u: StyleUnit.RGBA,
    };
  }
  if (style.hasOwnProperty('opacity')) {
    let opacity = parseFloat(style.opacity);
    if (isNaN(opacity)) {
      opacity = 1;
    }
    res.opacity = { v: Math.max(0, Math.min(1, opacity)), u: StyleUnit.NUMBER };
  }
  if (style.hasOwnProperty('fill')) {
    const fill = style.fill;
    if (Array.isArray(fill)) {
      res.fill = fill.map((item: string | number[]) => {
        if (isString(item)) {
          if (isGradient(item as string)) {
            const v = parseGradient(item as string);
            if (v) {
              return { v, u: StyleUnit.GRADIENT };
            }
          }
          else if (reg.img.test(item as string)) {
            const v = reg.img.exec(item as string);
            if (v) {
              let type = PATTERN_FILL_TYPE.TILE;
              const s = (item as string).replace(v[0], '');
              if (s.indexOf('fill') > -1) {
                type = PATTERN_FILL_TYPE.FILL;
              }
              else if (s.indexOf('stretch') > -1) {
                type = PATTERN_FILL_TYPE.STRETCH;
              }
              else if (s.indexOf('fit') > -1) {
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
    else {
      res.fill = [];
    }
  }
  if (style.hasOwnProperty('fillEnable')) {
    const fillEnable = style.fillEnable;
    if (Array.isArray(fillEnable)) {
      res.fillEnable = fillEnable.map((item: boolean) => {
        return { v: item, u: StyleUnit.BOOLEAN };
      });
    }
    else {
      res.fillEnable = res.fill.map(() => ({ v: true, u: StyleUnit.BOOLEAN }));
    }
  }
  if (style.hasOwnProperty('fillOpacity')) {
    const fillOpacity = style.fillOpacity;
    if (Array.isArray(fillOpacity)) {
      res.fillOpacity = fillOpacity.map((item: number) => {
        return { v: Math.max(0, Math.min(1, item)), u: StyleUnit.NUMBER };
      });
    }
    else {
      res.fillOpacity = res.fill.map(() => ({ v: 1, u: StyleUnit.NUMBER }));
    }
  }
  if (style.hasOwnProperty('fillMode')) {
    const fillMode = style.fillMode;
    if (Array.isArray(fillMode)) {
      res.fillMode = fillMode.map((item: string) => {
        return { v: getBlendMode(item), u: StyleUnit.NUMBER };
      });
    }
    else {
      res.fillMode = res.fill.map(() => ({ v: MIX_BLEND_MODE.NORMAL, u : StyleUnit.NUMBER }));
    }
  }
  if (style.hasOwnProperty('fillRule')) {
    const fillRule = style.fillRule;
    res.fillRule = {
      v: fillRule === 'evenodd' ? FILL_RULE.EVEN_ODD : FILL_RULE.NON_ZERO,
      u: StyleUnit.NUMBER,
    };
  }
  if (style.hasOwnProperty('stroke')) {
    const stroke = style.stroke;
    if (Array.isArray(stroke)) {
      res.stroke = stroke.map((item: string | number[]) => {
        if (isString(item)) {
          if (isGradient(item as string)) {
            const v = parseGradient(item as string);
            if (v) {
              return { v, u: StyleUnit.GRADIENT };
            }
          }
          else if (reg.img.test(item as string)) {
            const v = reg.img.exec(item as string);
            if (v) {
              let type = PATTERN_FILL_TYPE.TILE;
              const s = (item as string).replace(v[0], '');
              if (s.indexOf('fill') > -1) {
                type = PATTERN_FILL_TYPE.FILL;
              }
              else if (s.indexOf('stretch') > -1) {
                type = PATTERN_FILL_TYPE.STRETCH;
              }
              else if (s.indexOf('fit') > -1) {
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
    else {
      res.stroke = [];
    }
  }
  if (style.hasOwnProperty('strokeEnable')) {
    const strokeEnable = style.strokeEnable;
    if (Array.isArray(strokeEnable)) {
      res.strokeEnable = strokeEnable.map((item: boolean) => {
        return { v: item, u: StyleUnit.BOOLEAN };
      });
    }
    else {
      res.strokeEnable = res.stroke.map(() => ({ v: true, u: StyleUnit.BOOLEAN }));
    }
  }
  if (style.hasOwnProperty('strokeWidth')) {
    const strokeWidth = style.strokeWidth;
    if (Array.isArray(strokeWidth)) {
      res.strokeWidth = strokeWidth.map((item: number) => {
        return { v: Math.max(0, item), u: StyleUnit.PX };
      });
    }
    else {
      res.strokeWidth = res.stroke.map(() => ({ v: 1, u: StyleUnit.NUMBER }));
    }
  }
  if (style.hasOwnProperty('strokePosition')) {
    const strokePosition = style.strokePosition;
    if (Array.isArray(strokePosition)) {
      res.strokePosition = strokePosition.map((item: string) => {
        let v = STROKE_POSITION.CENTER;
        if (item === 'inside') {
          v = STROKE_POSITION.INSIDE;
        }
        else if (item === 'outside') {
          v = STROKE_POSITION.OUTSIDE;
        }
        return { v, u: StyleUnit.NUMBER };
      });
    }
    else {
      res.strokePosition = res.stroke.map(() => ({ v: STROKE_POSITION.CENTER, u: StyleUnit.NUMBER }));
    }
  }
  if (style.hasOwnProperty('strokeMode')) {
    const strokeMode = style.strokeMode;
    if (Array.isArray(strokeMode)) {
      res.strokeMode = strokeMode.map((item: string) => {
        return { v: getBlendMode(item), u: StyleUnit.NUMBER };
      });
    }
    else {
      res.strokeMode = res.stroke.map(() => ({ v: MIX_BLEND_MODE.NORMAL, u: StyleUnit.NUMBER }));
    }
  }
  if (style.hasOwnProperty('strokeDasharray')) {
    const strokeDasharray = style.strokeDasharray;
    if (Array.isArray(strokeDasharray)) {
      res.strokeDasharray = strokeDasharray.map((item: number) => {
        return { v: Math.max(0, item), u: StyleUnit.PX };
      });
    }
    else {
      res.strokeDasharray = [];
    }
  }
  if (style.hasOwnProperty('strokeLinecap')) {
    const strokeLinecap = style.strokeLinecap;
    let v = STROKE_LINE_CAP.BUTT;
    if (strokeLinecap === 'round') {
      v = STROKE_LINE_CAP.ROUND;
    }
    else if (strokeLinecap === 'square') {
      v = STROKE_LINE_CAP.SQUARE;
    }
    res.strokeLinecap = { v, u: StyleUnit.NUMBER };
  }
  if (style.hasOwnProperty('strokeLinejoin')) {
    const strokeLinejoin = style.strokeLinejoin;
    let v = STROKE_LINE_JOIN.MITER;
    if (strokeLinejoin === 'round') {
      v = STROKE_LINE_JOIN.ROUND;
    }
    else if (strokeLinejoin === 'bevel') {
      v = STROKE_LINE_JOIN.BEVEL;
    }
    res.strokeLinejoin = { v, u: StyleUnit.NUMBER };
  }
  if (style.hasOwnProperty('strokeMiterlimit')) {
    res.strokeMiterlimit = { v: parseFloat(style.strokeMiterlimit) || 0, u: StyleUnit.NUMBER };
  }
  // 只有这几个，3d没有
  ['translateX', 'translateY', 'scaleX', 'scaleY', 'rotateZ'].forEach((k) => {
    if (!style.hasOwnProperty(k)) {
      return;
    }
    let v = style[k as keyof JStyle];
    const n = calUnit(v as string | number, false);
    // 没有单位或默认值处理单位
    compatibleTransform(k, n);
    res[k] = n;
  });
  if (style.hasOwnProperty('letterSpacing')) {
    res.letterSpacing = calUnit(style.letterSpacing || 0, true);
  }
  if (style.hasOwnProperty('paragraphSpacing')) {
    res.paragraphSpacing = calUnit(style.paragraphSpacing || 0, true);
  }
  if (style.hasOwnProperty('textAlign')) {
    const textAlign = style.textAlign;
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
    res.textAlign = { v, u: StyleUnit.NUMBER };
  }
  if (style.hasOwnProperty('textVerticalAlign')) {
    const textVerticalAlign = style.textVerticalAlign;
    let v = TEXT_VERTICAL_ALIGN.TOP;
    if (textVerticalAlign === 'middle') {
      v = TEXT_VERTICAL_ALIGN.MIDDLE;
    }
    else if (textVerticalAlign === 'bottom') {
      v = TEXT_VERTICAL_ALIGN.BOTTOM;
    }
    res.textVerticalAlign = { v, u: StyleUnit.NUMBER };
  }
  if (style.hasOwnProperty('textDecoration')) {
    const textDecoration = style.textDecoration;
    if (Array.isArray(textDecoration)) {
      res.textDecoration = textDecoration.map(item => {
        let v = TEXT_DECORATION.NONE;
        if (item === 'underline') {
          v = TEXT_DECORATION.UNDERLINE;
        }
        else if (item === 'line-through' || item === 'lineThrough') {
          v = TEXT_DECORATION.LINE_THROUGH;
        }
        return { v, u: StyleUnit.NUMBER };
      });
    }
    else {
      res.textDecoration = [];
    }
  }
  if (style.hasOwnProperty('transformOrigin')) {
    const transformOrigin = style.transformOrigin;
    let o: Array<number | string>;
    if (Array.isArray(transformOrigin)) {
      o = transformOrigin;
    }
    else {
      o = (transformOrigin || '').toString().match(reg.position) as Array<string>;
    }
    if (!o || !o.length) {
      o = [50, 50];
    }
    else if (o.length === 1) {
      o[1] = o[0];
    }
    const arr: Array<StyleNumValue> = [];
    for (let i = 0; i < 2; i++) {
      let item = o[i];
      if (/^[-+]?[\d.]/.test(item as string)) {
        let n = calUnit(item, true);
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
  if (style.hasOwnProperty('booleanOperation')) {
    const booleanOperation = style.booleanOperation;
    let v = BOOLEAN_OPERATION.NONE;
    if (booleanOperation === 'union') {
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
  if (style.hasOwnProperty('mixBlendMode')) {
    res.mixBlendMode = { v: getBlendMode(style.mixBlendMode), u: StyleUnit.NUMBER };
  }
  if (style.hasOwnProperty('pointerEvents')) {
    res.pointerEvents = { v: !!style.pointerEvents, u: StyleUnit.BOOLEAN };
  }
  if (style.hasOwnProperty('maskMode')) {
    const maskMode = style.maskMode;
    let v = MASK.NONE;
    if (maskMode === 'outline') {
      v = MASK.OUTLINE;
    }
    else if (maskMode === 'alpha') {
      v = MASK.ALPHA;
    }
    else if (maskMode === 'gray') {
      v = MASK.GRAY;
    }
    else if (maskMode === 'alpha-with') {
      v = MASK.ALPHA_WITH;
    }
    else if (maskMode === 'gray-with') {
      v = MASK.GRAY_WITH;
    }
    res.maskMode = { v, u: StyleUnit.NUMBER };
  }
  if (style.hasOwnProperty('breakMask')) {
    res.breakMask = { v: !!style.breakMask, u: StyleUnit.BOOLEAN };
  }
  if (style.hasOwnProperty('blur')) {
    const blur = style.blur;
    const v = reg.blur.exec(blur);
    if (v) {
      const t = v[1].toLowerCase();
      if (t === 'gauss') {
        res.blur = {
          v: { t: BLUR.GAUSSIAN, radius: { v: parseFloat(v[2]) || 0, u: StyleUnit.PX } },
          u: StyleUnit.BLUR,
        };
      }
      else if (t === 'background') {
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
      }
      else if (t === 'radial') {
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
        res.blur = {
          v: { t: BLUR.RADIAL, radius: { v: parseFloat(v[2]) || 0, u: StyleUnit.PX }, center },
          u: StyleUnit.BLUR
        };
      }
      else if (t === 'motion') {
        const match = /angle\s*\((.+)\)/i.exec(blur);
        let angle = {
          v: 0,
          u: StyleUnit.DEG,
        };
        if (match) {
          angle.v = parseFloat(match[1]);
        }
        res.blur = {
          v: { t: BLUR.MOTION, radius: { v: parseFloat(v[2]) || 0, u: StyleUnit.PX }, angle },
          u: StyleUnit.BLUR
        };
      }
      else {
        res.blur = { v: { t: BLUR.NONE }, u: StyleUnit.BLUR };
      }
    }
    else {
      res.blur = { v: { t: BLUR.NONE }, u: StyleUnit.BLUR };
    }
  }
  if (style.hasOwnProperty('shadow')) {
    const shadow = style.shadow;
    if (Array.isArray(shadow)) {
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
    else {
      res.shadow = [];
    }
  }
  if (style.hasOwnProperty('shadowEnable')) {
    const shadowEnable = style.shadowEnable;
    if (Array.isArray(shadowEnable)) {
      res.shadowEnable = shadowEnable.map((item: boolean) => {
        return { v: item, u: StyleUnit.BOOLEAN };
      });
    }
    else {
      res.shadowEnable = res.shadow.map(() => ({ v: true, u: StyleUnit.BOOLEAN }));
    }
  }
  if (style.hasOwnProperty('innerShadow')) {
    const innerShadow = style.innerShadow;
    if (Array.isArray(innerShadow)) {
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
    else {
      res.innerShadow = [];
    }
  }
  if (style.hasOwnProperty('innerShadowEnable')) {
    const innerShadowEnable = style.innerShadowEnable;
    if (Array.isArray(innerShadowEnable)) {
      res.innerShadowEnable = innerShadowEnable.map((item: boolean) => {
        return { v: item, u: StyleUnit.BOOLEAN };
      });
    }
    else {
      res.innerShadowEnable = res.innerShadow.map(() => ({ v: true, u: StyleUnit.BOOLEAN }));
    }
  }
  ['hueRotate', 'saturate', 'brightness', 'contrast'].forEach(k => {
    if (!style.hasOwnProperty(k)) {
      return;
    }
    const n = calUnit(style[k]);
    // hue是角度，其它都是百分比
    if (k === 'hueRotate') {
      if (n.u !== StyleUnit.DEG) {
        n.u = StyleUnit.DEG;
      }
    }
    else {
      if (n.u !== StyleUnit.PERCENT) {
        n.v *= 100;
        n.u = StyleUnit.PERCENT;
      }
    }
    res[k] = n;
  });
  if (style.hasOwnProperty('matrix')) {
    const matrix = style.matrix;
    if (Array.isArray(matrix)) {
      res.matrix = { v: matrix, u: StyleUnit.MATRIX };
    }
  }
  if (style.hasOwnProperty('overflow')) {
    const overflow = style.overflow;
    let v = OVERFLOW.HIDDEN;
    if (overflow === 'visible') {
      v = OVERFLOW.VISIBLE;
    }
    res.overflow = {
      v,
      u: StyleUnit.NUMBER,
    };
  }
  return res;
}

export function normalizeRich(rich: JRich): Rich {
  return {
    ...rich,
    color: color2rgbaInt(rich.color),
    textAlign: {
      left: TEXT_ALIGN.LEFT,
      center: TEXT_ALIGN.CENTER,
      right: TEXT_ALIGN.RIGHT,
      justify: TEXT_ALIGN.JUSTIFY,
    }[rich.textAlign],
    textDecoration: rich.textDecoration.map(item => {
      return {
        'none': TEXT_DECORATION.NONE,
        'underline': TEXT_DECORATION.UNDERLINE,
        'lineThrough': TEXT_DECORATION.LINE_THROUGH,
        'line-through': TEXT_DECORATION.LINE_THROUGH,
      }[item];
    }),
  };
}

function getBlendMode(blend: string) {
  let v = MIX_BLEND_MODE.NORMAL;
  if (/multiply/i.test(blend)) {
    v = MIX_BLEND_MODE.MULTIPLY;
  }
  else if (/screen/i.test(blend)) {
    v = MIX_BLEND_MODE.SCREEN;
  }
  else if (/overlay/i.test(blend)) {
    v = MIX_BLEND_MODE.OVERLAY;
  }
  else if (/darken/i.test(blend)) {
    v = MIX_BLEND_MODE.DARKEN;
  }
  else if (/lighten/i.test(blend)) {
    v = MIX_BLEND_MODE.LIGHTEN;
  }
  else if (/color[\-\s]dodge/i.test(blend) || /colorDodge/.test(blend)) {
    v = MIX_BLEND_MODE.COLOR_DODGE;
  }
  else if (/color[\-\s]burn/i.test(blend) || /colorBurn/.test(blend)) {
    v = MIX_BLEND_MODE.COLOR_BURN;
  }
  else if (/hard[\-\s]light/i.test(blend) || /hardLight/.test(blend)) {
    v = MIX_BLEND_MODE.HARD_LIGHT;
  }
  else if (/soft[\-\s]light/i.test(blend) || /softLight/.test(blend)) {
    v = MIX_BLEND_MODE.SOFT_LIGHT;
  }
  else if (/difference/i.test(blend)) {
    v = MIX_BLEND_MODE.DIFFERENCE;
  }
  else if (/exclusion/i.test(blend)) {
    v = MIX_BLEND_MODE.EXCLUSION;
  }
  else if (/hue/i.test(blend)) {
    v = MIX_BLEND_MODE.HUE;
  }
  else if (/saturation/i.test(blend)) {
    v = MIX_BLEND_MODE.SATURATION;
  }
  else if (/color/i.test(blend)) {
    v = MIX_BLEND_MODE.COLOR;
  }
  else if (/luminosity/i.test(blend)) {
    v = MIX_BLEND_MODE.LUMINOSITY;
  }
  return v;
}

export function equalStyle(k: string, a: Partial<Style>, b: Partial<Style>) {
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
      }
      else if (ai.u === StyleUnit.GRADIENT) {
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
    k === 'strokeDasharray' ||
    k === 'shadowEnable' ||
    k === 'innerShadowEnable'
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
  if (k === 'shadow' || k === 'innerShadow') {
    if (av.length !== bv.length) {
      return false;
    }
    for (let i = 0, len = av.length; i < len; i++) {
      const ai = av[i].v;
      const bi = bv[i].v;
      if (ai.x.v !== bi.x.v || ai.x.u !== bi.x.u ||
        ai.y.v !== bi.y.v || ai.y.u !== bi.y.u ||
        ai.blur.v !== bi.blur.v || ai.blur.u !== bi.blur.u ||
        ai.spread.v !== bi.spread.v || ai.spread.u !== bi.spread.u) {
        return false;
      }
      const ac = ai.color.v;
      const bc = bi.color.v;
      if (ac[0] !== bc[0] || ac[1] !== bc[1] || ac[2] !== bc[2] || ac[3] !== bc[3]) {
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
  let r = n.toString(16).toUpperCase();
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
  const fontSize = style.fontSize || inject.defaultFontSize;
  let fontFamily = style.fontFamily || inject.defaultFontFamily;
  // fontFamily += ',' + 'pingfangsc-regular';
  if (/[\s.,/\\]/.test(fontFamily)) {
    fontFamily = '"' + fontFamily.replace(/"/g, '\\"') + '"';
  }
  let fontStyle = '';
  if (style.fontStyle === FONT_STYLE.ITALIC) {
    fontStyle = 'italic ';
  }
  let fontWeight = '';
  if (style.fontWeight !== 400) {
    fontWeight = style.fontWeight + ' ';
  }
  return (
    fontStyle +
    fontWeight +
    fontSize + 'px ' +
    fontFamily
  );
}

export function calFontFamily(fontFamily: string) {
  const ff = fontFamily.split(/\s*,\s*/);
  for (let i = 0, len = ff.length; i < len; i++) {
    let item = ff[i].replace(/^['"]/, '').replace(/['"]$/, '');
    if (font.hasRegister(item) || inject.checkSupportFontFamily(item)) {
      return item;
    }
  }
  return inject.defaultFontFamily;
}

export function calNormalLineHeight(style: Pick<ComputedStyle | Rich, 'fontFamily' | 'fontSize'>, ff?: string) {
  if (!ff) {
    ff = calFontFamily(style.fontFamily);
  }
  const lhr =
    (font.data[ff] || font.data[inject.defaultFontFamily] || font.data.Arial || {})
      .lhr;
  return style.fontSize * lhr;
}

/**
 * https://zhuanlan.zhihu.com/p/25808995
 * 根据字形信息计算baseline的正确值，差值上下均分
 */
export function getBaseline(style: Pick<ComputedStyle | Rich, 'fontSize' | 'fontFamily' | 'lineHeight'>, lineHeight?: number) {
  const fontSize = style.fontSize;
  const ff = calFontFamily(style.fontFamily);
  const normal = calNormalLineHeight(style, ff);
  const blr =
    (font.data[ff] || font.data[inject.defaultFontFamily] || font.data.Arial || {})
      .blr || 1;
  return ((lineHeight ?? style.lineHeight) - normal) * 0.5 + fontSize * blr;
}

export function getContentArea(style: Pick<ComputedStyle | Rich, 'fontSize' | 'fontFamily' | 'lineHeight'>, lineHeight?: number) {
  const fontSize = style.fontSize;
  const ff = calFontFamily(style.fontFamily);
  const normal = calNormalLineHeight(style, ff);
  const car =
    (font.data[ff] || font.data[inject.defaultFontFamily] || font.data.Arial || {})
      .car || 1;
  return ((lineHeight ?? style.lineHeight) - normal) * 0.5 + fontSize * car;
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

export function getCssBlur(t: BLUR, radius: number, angle?: number, center?: [number, number], saturation?: number) {
  if (t === BLUR.NONE) {
    return 'none';
  }
  let s = ['none', 'gauss', 'motion', 'radial', 'background'][t] + `(${radius})`;
  if (t === BLUR.MOTION) {
    s += ` angle(${angle || 0})`;
  }
  else if (t === BLUR.RADIAL) {
    const p = (center || []).map(item => {
      return item * 100 + '%';
    });
    while (p.length < 2) {
      p.push('50%');
    }
    s += ` center(${p.join(', ')})`;
  }
  else if (t === BLUR.BACKGROUND) {
    s += ` saturation(${(saturation === undefined ? 1 : saturation) * 100}%)`;
  }
  return s;
}

export function getCssShadow(item: ComputedShadow) {
  return `${color2rgbaStr(item.color)} ${item.x} ${item.y} ${item.blur} ${item.spread}`;
}

export function getCssFillStroke(item: number[] | ComputedPattern | ComputedGradient, width?: number, height?: number, standard = false) {
  if (Array.isArray(item)) {
    return color2rgbaStr(item);
  }
  const p = item as ComputedPattern;
  if (p.url !== undefined) {
    const type = ['tile', 'fill', 'stretch', 'fit'][p.type];
    return `url(${p.url}) ${type} ${p.scale}`;
  }
  return convert2Css(item as ComputedGradient, width, height, standard);
}

export function getCssStrokePosition(o: STROKE_POSITION) {
  return (['center', 'inside', 'outside'][o] || 'inside') as 'center' | 'inside' | 'outside';
}

export function normalizeColor(color: number[]) {
  color[0] = Math.min(255, Math.max(0, Math.round(color[0])));
  color[1] = Math.min(255, Math.max(0, Math.round(color[1])));
  color[2] = Math.min(255, Math.max(0, Math.round(color[2])));
  if (color.length > 3) {
    color[3] = Math.min(1, Math.max(0, color[3]));
  }
  return color;
}

export function normalizePoints(points: JPoint[]) {
  return points.map(item => {
    return {
      ...item,
      curveMode: {
        'none': CURVE_MODE.NONE,
        'straight': CURVE_MODE.STRAIGHT,
        'mirrored': CURVE_MODE.MIRRORED,
        'asymmetric': CURVE_MODE.ASYMMETRIC,
        'disconnected': CURVE_MODE.DISCONNECTED,
      }[item.curveMode] || CURVE_MODE.NONE,
      absX: 0,
      absY: 0,
      absFx: 0,
      absFy: 0,
      absTx: 0,
      absTy: 0,
      dspX: 0,
      dspY: 0,
      dspFx: 0,
      dspFy: 0,
      dspTx: 0,
      dspTy: 0,
    };
  });
}

export default {
  normalize,
  normalizeRich,
  normalizePoints,
  normalizeColor,
  equalStyle,
  color2rgbaInt,
  color2rgbaStr,
  color2hexStr,
  color2gl,
  calFontFamily,
  calNormalLineHeight,
  getBaseline,
  getContentArea,
  calSize,
  getCssBlur,
  getCssShadow,
  getCssFillStroke,
  getCssStrokePosition,
};
