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
  BLUR = 9,
  PATTERN = 10,
  SHADOW = 11,
}

export function calUnit(v: string | number, degOrNumber2Px = false): StyleNumValue {
  if (v === 'auto') {
    return {
      v: 0,
      u: StyleUnit.AUTO,
    };
  }
  let n = parseFloat(v as string) || 0;
  if (/%$/.test(v as string)) {
    return {
      v: n,
      u: StyleUnit.PERCENT,
    };
  } else if (/px$/i.test(v as string)) {
    return {
      v: n,
      u: StyleUnit.PX,
    };
  } else if (/deg$/i.test(v as string)) {
    return {
      v: n,
      u: degOrNumber2Px ? StyleUnit.PX : StyleUnit.DEG,
    };
  }
  return {
    v: n,
    u: degOrNumber2Px ? StyleUnit.PX : StyleUnit.NUMBER,
  };
}

export type StyleStrValue = {
  v: string;
  u: StyleUnit.STRING;
};

export type StyleNumValue = {
  v: number;
  u:
    | StyleUnit.AUTO
    | StyleUnit.PX
    | StyleUnit.PERCENT
    | StyleUnit.NUMBER
    | StyleUnit.DEG;
};

export type StyleBoolValue = {
  v: boolean;
  u: StyleUnit.BOOLEAN;
};

export type StyleColorValue = {
  v: Array<number>;
  u: StyleUnit.RGBA;
};

export type StyleFontStyleValue = {
  v: FONT_STYLE;
  u: StyleUnit.STRING;
};

export type StyleOverflowValue = {
  v: OVERFLOW;
  u: StyleUnit.NUMBER;
};

export type StyleBooleanOperationValue = {
  v: BOOLEAN_OPERATION;
  u: StyleUnit.NUMBER;
};

export type StyleMbmValue = {
  v: MIX_BLEND_MODE;
  u: StyleUnit.NUMBER;
};

export type StyleTaValue = {
  v: TEXT_ALIGN;
  u: StyleUnit.NUMBER;
};

export type ColorStop = {
  color: StyleColorValue;
  offset?: StyleNumValue;
};

export type ComputedColorStop = {
  color: number[];
  offset?: number;
};

export type Gradient = {
  t: GRADIENT;
  d: number[];
  stops: Array<ColorStop>;
};

export type ComputedGradient = {
  t: GRADIENT;
  d: number[];
  stops: Array<ComputedColorStop>;
};

export type StyleGradientValue = {
  v: Gradient;
  u: StyleUnit.GRADIENT;
};

export type StyleFillRuleValue = {
  v: FILL_RULE;
  u: StyleUnit.NUMBER;
};

export type StyleMaskValue = {
  v: MASK;
  u: StyleUnit.NUMBER;
};

export type StyleStrokeLinecapValue = {
  v: STROKE_LINE_CAP;
  u: StyleUnit.NUMBER;
};

export type StyleStrokeLinejoinValue = {
  v: STROKE_LINE_JOIN;
  u: StyleUnit.NUMBER;
};

export type StyleStrokePositionValue = {
  v: STROKE_POSITION;
  u: StyleUnit.NUMBER;
};

export type Blur = {
  t: BLUR;
  // center?: [number, number];
  // saturation?: number;
  // angle?: number;
  radius?: StyleNumValue;
};

export type ComputedBlur = {
  t: BLUR;
  radius?: number;
};

export type StyleBlurValue = {
  v: Blur;
  u: StyleUnit.BLUR;
};

export type Shadow = {
  x: StyleNumValue;
  y: StyleNumValue;
  blur: StyleNumValue;
  spread: StyleNumValue;
  color: StyleColorValue;
};

export type StyleShadowValue = {
  v: Shadow;
  u: StyleUnit.SHADOW;
};

export type ComputedShadow = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: number[];
};

export type Style = {
  top: StyleNumValue;
  right: StyleNumValue;
  bottom: StyleNumValue;
  left: StyleNumValue;
  width: StyleNumValue;
  height: StyleNumValue;
  lineHeight: StyleNumValue;
  fontFamily: StyleStrValue;
  fontSize: StyleNumValue;
  fontWeight: StyleNumValue;
  fontStyle: StyleFontStyleValue;
  visible: StyleBoolValue;
  overflow: StyleOverflowValue;
  backgroundColor: StyleColorValue;
  color: StyleColorValue;
  opacity: StyleNumValue;
  fill: Array<StyleColorValue | StyleGradientValue>;
  fillEnable: Array<StyleBoolValue>;
  fillOpacity: Array<StyleNumValue>;
  fillRule: StyleFillRuleValue;
  stroke: Array<StyleColorValue | StyleGradientValue>;
  strokeEnable: Array<StyleBoolValue>;
  strokeWidth: Array<StyleNumValue>;
  strokePosition: Array<StyleStrokePositionValue>;
  strokeDasharray: Array<StyleNumValue>;
  strokeLinecap: StyleStrokeLinecapValue;
  strokeLinejoin: StyleStrokeLinejoinValue;
  strokeMiterlimit: StyleNumValue;
  letterSpacing: StyleNumValue;
  paragraphSpacing: StyleNumValue;
  textAlign: StyleTaValue;
  translateX: StyleNumValue;
  translateY: StyleNumValue;
  scaleX: StyleNumValue;
  scaleY: StyleNumValue;
  rotateZ: StyleNumValue;
  transformOrigin: [StyleNumValue, StyleNumValue];
  booleanOperation: StyleBooleanOperationValue;
  mixBlendMode: StyleMbmValue;
  pointerEvents: StyleBoolValue;
  maskMode: StyleMaskValue;
  breakMask: StyleBoolValue;
  blur: StyleBlurValue;
  shadow: Array<StyleShadowValue>;
  shadowEnable: Array<StyleBoolValue>;
};

export type ComputedStyle = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  lineHeight: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: FONT_STYLE;
  visible: boolean;
  overflow: OVERFLOW;
  backgroundColor: number[];
  color: number[];
  opacity: number;
  fill: Array<number[] | Gradient>;
  fillEnable: boolean[];
  fillOpacity: number[];
  fillRule: FILL_RULE;
  stroke: Array<number[] | Gradient>;
  strokeEnable: boolean[];
  strokeWidth: number[];
  strokePosition: Array<STROKE_POSITION>;
  strokeDasharray: number[];
  strokeLinecap: STROKE_LINE_CAP;
  strokeLinejoin: STROKE_LINE_JOIN;
  strokeMiterlimit: number;
  letterSpacing: number;
  paragraphSpacing: number;
  textAlign: TEXT_ALIGN;
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotateZ: number;
  transformOrigin: number[];
  booleanOperation: BOOLEAN_OPERATION;
  mixBlendMode: MIX_BLEND_MODE;
  pointerEvents: boolean;
  maskMode: MASK;
  breakMask: boolean;
  blur: ComputedBlur;
  shadow: Array<ComputedShadow>;
  shadowEnable: boolean[];
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

export enum GRADIENT {
  LINEAR = 0,
  RADIAL = 1,
  CONIC = 2,
}

export enum BLUR {
  NONE = 0,
  GAUSSIAN = 1,
  MOTION = 2,
  ZOOM = 3,
  BACKGROUND = 4,
}

export enum BOOLEAN_OPERATION {
  NONE = 0,
  UNION = 1,
  SUBTRACT = 2,
  INTERSECT = 3,
  XOR = 4,
}

export enum CURVE_MODE {
  NONE = 0,
  STRAIGHT = 1,
  MIRRORED = 2,
  ASYMMETRIC = 3,
  DISCONNECTED = 4,
}

export enum CORNER_STYLE {
  ROUNDED = 0,
  ROUNDED_INVERTED = 1,
  ANGLED = 2,
  SQUARED = 3,
}

export enum FILL_RULE {
  NON_ZERO = 0,
  EVEN_ODD = 1,
}

export enum MASK {
  NONE = 0,
  OUTLINE = 1,
  ALPHA = 2,
}

export enum STROKE_LINE_CAP {
  BUTT = 0,
  ROUND = 1,
  SQUARE = 2,
}

export enum STROKE_LINE_JOIN {
  MITER = 0,
  ROUND = 1,
  BEVEL = 2,
}

export enum STROKE_POSITION {
  CENTER = 0,
  INSIDE = 1,
  OUTSIDE = 2,
}

export enum PATTERN_FILL_TYPE {
  TILE = 0,
  FILL = 1,
  STRETCH = 2,
  FIT = 3,
}

export default {
  StyleUnit,
  calUnit,
};
