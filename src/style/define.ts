export enum StyleUnit {
  AUTO = 0,
  PX = 1,
  PERCENT = 2,
  NUMBER = 3,
  DEG = 4,
  RGBA = 5,
  BOOLEAN = 6,
  STRING = 7,
  GRADIENT = 8,
}

export function calUnit(v: string | number): StyleNumValue {
  if(v === 'auto') {
    return {
      v: 0,
      u: StyleUnit.AUTO,
    };
  }
  let n = parseFloat(v as string) || 0;
  if(/%$/.test(v as string)) {
    return {
      v: n,
      u: StyleUnit.PERCENT,
    };
  }
  else if(/px$/i.test(v as string)) {
    return {
      v: n,
      u: StyleUnit.PX,
    };
  }
  else if(/deg$/i.test(v as string)) {
    return {
      v: n,
      u: StyleUnit.DEG,
    };
  }
  return {
    v: n,
    u: StyleUnit.NUMBER,
  };
}

export type StyleStrValue = {
  v: string,
  u: StyleUnit.STRING,
};

export type StyleNumValue = {
  v: number,
  u: StyleUnit.AUTO | StyleUnit.PX | StyleUnit.PERCENT | StyleUnit.NUMBER | StyleUnit.DEG,
};

export type StyleBoolValue = {
  v: boolean,
  u: StyleUnit.BOOLEAN,
};

export type StyleColorValue = {
  v: Array<number>,
  u: StyleUnit.RGBA,
};

export type StyleFontStyleValue = {
  v: FONT_STYLE,
  u: StyleUnit.STRING,
};

export type StyleOverflowValue = {
  v: OVERFLOW,
  u: StyleUnit.NUMBER,
};

export type StyleBooleanOperationValue = {
  v: BOOLEAN_OPERATION,
  u: StyleUnit.NUMBER,
};

export type StyleMbmValue = {
  v: MIX_BLEND_MODE,
  u: StyleUnit.NUMBER,
};

export type StyleTaValue = {
  v: TEXT_ALIGN,
  u: StyleUnit.NUMBER,
};

export type ColorStop = {
  color: StyleColorValue,
  offset?: StyleNumValue,
};

export type LinearGradient = {
  t: GRADIENT,
  d: number | Array<number>,
  stops: Array<ColorStop>,
};

export type Gradient = LinearGradient;

export type StyleGradientValue = {
  v: Gradient,
  u: StyleUnit.GRADIENT,
};

export type StyleFillRuleValue = {
  v: FILL_RULE,
  u: StyleUnit.NUMBER,
};

export type StyleMaskValue = {
  v: MASK,
  u: StyleUnit.NUMBER,
};

export type Style = {
  top: StyleNumValue,
  right: StyleNumValue,
  bottom: StyleNumValue,
  left: StyleNumValue,
  width: StyleNumValue,
  height: StyleNumValue,
  lineHeight: StyleNumValue,
  fontFamily: StyleStrValue,
  fontSize: StyleNumValue,
  fontWeight: StyleNumValue,
  fontStyle: StyleFontStyleValue,
  visible: StyleBoolValue,
  overflow: StyleOverflowValue,
  backgroundColor: StyleColorValue,
  color: StyleColorValue,
  opacity: StyleNumValue,
  fill: Array<StyleColorValue | StyleGradientValue>,
  fillEnable: Array<StyleBoolValue>,
  fillRule: StyleFillRuleValue,
  stroke: Array<StyleColorValue | StyleGradientValue>,
  strokeEnable: Array<StyleBoolValue>,
  strokeWidth: Array<StyleNumValue>,
  strokeDasharray: Array<StyleNumValue>,
  letterSpacing: StyleNumValue,
  textAlign: StyleTaValue,
  translateX: StyleNumValue,
  translateY: StyleNumValue,
  scaleX: StyleNumValue,
  scaleY: StyleNumValue,
  rotateZ: StyleNumValue,
  transformOrigin: [StyleNumValue, StyleNumValue],
  booleanOperation: StyleBooleanOperationValue,
  mixBlendMode: StyleMbmValue,
  pointerEvents: StyleBoolValue,
  maskMode: StyleMaskValue,
  breakMask: StyleBoolValue,
};

export type ComputedStyle = {
  top: number,
  right: number,
  bottom: number,
  left: number,
  width: number,
  height: number,
  minWidth: number,
  minHeight: number,
  lineHeight: number,
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  fontStyle: FONT_STYLE,
  visible: boolean,
  overflow: OVERFLOW,
  backgroundColor: Array<number>,
  color: Array<number>,
  opacity: number,
  fill: Array<Array<number> | Gradient>,
  fillEnable: Array<boolean>,
  fillRule: FILL_RULE,
  stroke: Array<Array<number> | Gradient>,
  strokeEnable: Array<boolean>,
  strokeWidth: Array<number>,
  strokeDasharray: Array<number>,
  letterSpacing: number,
  textAlign: TEXT_ALIGN,
  translateX: number,
  translateY: number,
  scaleX: number,
  scaleY: number,
  rotateZ: number,
  transformOrigin: Array<number>,
  booleanOperation: BOOLEAN_OPERATION,
  mixBlendMode: MIX_BLEND_MODE,
  pointerEvents: boolean,
  maskMode: MASK,
  breakMask: boolean,
};

export enum TEXT_ALIGN {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
  JUSTIFY = 3,
}

export enum MIX_BLEND_MODE {
  NORMAL = 0,
  MULTIPLY = 1,
  SCREEN = 2,
  OVERLAY = 3,
  DARKEN = 4,
  LIGHTEN = 5,
  COLOR_DODGE = 6,
  COLOR_BURN = 7,
  HARD_LIGHT = 8,
  SOFT_LIGHT = 9,
  DIFFERENCE = 10,
  EXCLUSION = 11,
  HUE = 12,
  SATURATION = 13,
  COLOR = 14,
  LUMINOSITY = 15,
}

export enum OVERFLOW {
  VISIBLE = 0,
  HIDDEN = 1,
}

export enum FONT_STYLE {
  NORMAL = 0,
  ITALIC = 1,
  OBLIQUE = 2,
}

export enum MASK_TYPE {
  NONE = 0,
  MASK = 1,
  CLIP = 2,
}

export enum GRADIENT {
  LINEAR = 0,
  RADIAL = 1,
  CONIC = 2,
}

export enum BOOLEAN_OPERATION {
  NONE = 0,
  UNION = 1,
  SUBTRACT = 2,
  INTERSECT = 3,
  XOR = 4,
}

export enum CurveMode {
  None = 0,
  Straight = 1,
  Mirrored = 2,
  Asymmetric = 3,
  Disconnected = 4,
}

export enum FILL_RULE {
  NON_ZERO = 0,
  EVEN_ODD = 1,
}

export enum MASK {
  NONE =    0,
  OUTLINE = 1,
  ALPHA =   2,
}

export default {
  StyleUnit,
  calUnit,
};
