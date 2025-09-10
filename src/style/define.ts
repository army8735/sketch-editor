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
  MATRIX = 12,
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
  }
  else if (/px$/i.test(v as string)) {
    return {
      v: n,
      u: StyleUnit.PX,
    };
  }
  else if (/deg$/i.test(v as string)) {
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

export type StyleVisibilityValue = {
  v: VISIBILITY;
  u: StyleUnit.NUMBER;
};

export type StyleColorValue = {
  v: number[];
  u: StyleUnit.RGBA;
};

export type StyleFontStyleValue = {
  v: FONT_STYLE;
  u: StyleUnit.STRING;
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

export type StyleTvaValue = {
  v: TEXT_VERTICAL_ALIGN;
  u: StyleUnit.NUMBER;
};

export type StyleTdValue = {
  v: TEXT_DECORATION;
  u: StyleUnit.NUMBER;
};

export type ColorStop = {
  color: StyleColorValue;
  offset: StyleNumValue;
};

export type ComputedColorStop = {
  color: number[];
  offset: number;
};

export type Gradient = {
  t: GRADIENT;
  d: number[];
  stops: ColorStop[];
};

export type Pattern = {
  url: string;
  type: PATTERN_FILL_TYPE;
  scale?: StyleNumValue;
};

export type ComputedPattern = {
  url: string;
  type: PATTERN_FILL_TYPE;
  scale: number;
};

export type ComputedGradient = {
  t: GRADIENT;
  d: number[];
  stops: ComputedColorStop[];
};

export type StyleGradientValue = {
  v: Gradient;
  u: StyleUnit.GRADIENT;
};

export type StylePatternValue = {
  v: Pattern;
  u: StyleUnit.PATTERN;
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
  radius: StyleNumValue;
  center?: [StyleNumValue, StyleNumValue];
  saturation?: StyleNumValue;
  angle?: StyleNumValue;
};

export type ComputedBlur = {
  t: BLUR;
  radius: number;
  center?: [number, number];
  saturation?: number;
  angle?: number;
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

export type StyleMatrixValue = {
  v: Float64Array;
  u: StyleUnit.MATRIX;
};

export type ComputedMatrix = Float64Array;

export type Style = {
  display: StyleDisplayValue;
  flexDirection: StyleFlexDirectionValue;
  justifyContent: StyleJustifyContentValue;
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
  visibility: StyleVisibilityValue;
  backgroundColor: StyleColorValue;
  color: StyleColorValue;
  opacity: StyleNumValue;
  fill: Array<StyleColorValue | StyleGradientValue | StylePatternValue>;
  fillEnable: StyleBoolValue[];
  fillOpacity: StyleNumValue[];
  fillMode: StyleMbmValue[];
  fillRule: StyleFillRuleValue;
  stroke: Array<StyleColorValue | StyleGradientValue>;
  strokeEnable: StyleBoolValue[];
  strokeWidth: StyleNumValue[];
  strokePosition: StyleStrokePositionValue[];
  strokeMode: StyleMbmValue[];
  strokeDasharray: StyleNumValue[];
  strokeLinecap: StyleStrokeLinecapValue;
  strokeLinejoin: StyleStrokeLinejoinValue;
  strokeMiterlimit: StyleNumValue;
  letterSpacing: StyleNumValue;
  paragraphSpacing: StyleNumValue;
  textAlign: StyleTaValue;
  textVerticalAlign: StyleTvaValue;
  textDecoration: StyleTdValue[];
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
  shadow: StyleShadowValue[];
  shadowEnable: StyleBoolValue[];
  innerShadow: StyleShadowValue[];
  innerShadowEnable: StyleBoolValue[];
  hueRotate: StyleNumValue;
  saturate: StyleNumValue;
  brightness: StyleNumValue;
  contrast: StyleNumValue;
  matrix?: StyleMatrixValue;
  overflow: StyleOverflowValue;
  borderTopLeftRadius: StyleNumValue;
  borderTopRightRadius: StyleNumValue;
  borderBottomLeftRadius: StyleNumValue;
  borderBottomRightRadius: StyleNumValue;
};

export type ComputedStyle = {
  display: DISPLAY;
  flexDirection: FLEX_DIRECTION;
  justifyContent: JUSTIFY_CONTENT;
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
  visibility: VISIBILITY;
  backgroundColor: number[];
  color: number[];
  opacity: number;
  fill: Array<number[] | ComputedGradient | ComputedPattern>;
  fillEnable: boolean[];
  fillOpacity: number[];
  fillMode: MIX_BLEND_MODE[];
  fillRule: FILL_RULE;
  stroke: Array<number[] | ComputedGradient>;
  strokeEnable: boolean[];
  strokeWidth: number[];
  strokePosition: STROKE_POSITION[];
  strokeMode: MIX_BLEND_MODE[];
  strokeDasharray: number[];
  strokeLinecap: STROKE_LINE_CAP;
  strokeLinejoin: STROKE_LINE_JOIN;
  strokeMiterlimit: number;
  letterSpacing: number;
  paragraphSpacing: number;
  textAlign: TEXT_ALIGN;
  textVerticalAlign: TEXT_VERTICAL_ALIGN;
  textDecoration: TEXT_DECORATION[];
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
  shadow: ComputedShadow[];
  shadowEnable: boolean[];
  innerShadow: ComputedShadow[];
  innerShadowEnable: boolean[];
  hueRotate: number;
  saturate: number;
  brightness: number;
  contrast: number;
  matrix?: ComputedMatrix;
  overflow: OVERFLOW;
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomLeftRadius: number;
  borderBottomRightRadius: number;
};

export enum TEXT_ALIGN {
  LEFT = 0,
  RIGHT = 1,
  CENTER = 2,
  JUSTIFY = 3,
}

export enum TEXT_VERTICAL_ALIGN {
  TOP = 0,
  MIDDLE = 1,
  BOTTOM = 2,
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
  RADIAL = 3,
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

export enum FILL_RULE {
  NON_ZERO = 0,
  EVEN_ODD = 1,
}

export enum MASK {
  NONE = 0,
  OUTLINE = 1,
  ALPHA = 2,
  GRAY = 3,
  ALPHA_WITH = 4,
  GRAY_WITH = 5,
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

export enum VISIBILITY {
  VISIBLE = 0,
  HIDDEN = 1,
}

export enum TEXT_DECORATION {
  NONE = 0,
  UNDERLINE = 1,
  LINE_THROUGH = 2,
}

export enum OVERFLOW {
  VISIBLE = 0,
  HIDDEN = 1,
}

export type StyleOverflowValue = {
  v: OVERFLOW;
  u: number;
}

export enum DISPLAY {
  BLOCK = 0,
  BOX = 1,
  FLEX = 2,
}

export type StyleDisplayValue = {
  v: DISPLAY;
  u: number;
}

export enum FLEX_DIRECTION {
  ROW = 0,
  COLUMN = 1,
}

export type StyleFlexDirectionValue = {
  v: FLEX_DIRECTION;
  u: number;
}

export enum JUSTIFY_CONTENT {
  FLEX_START = 0,
  CENTER = 1,
  FLEX_END = 2,
}

export type StyleJustifyContentValue = {
  v: JUSTIFY_CONTENT,
  u: number,
}

export default {
  StyleUnit,
  calUnit,
  TEXT_ALIGN,
  TEXT_VERTICAL_ALIGN,
  MIX_BLEND_MODE,
  FONT_STYLE,
  GRADIENT,
  BLUR,
  BOOLEAN_OPERATION,
  CURVE_MODE,
  FILL_RULE,
  MASK,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
  PATTERN_FILL_TYPE,
  VISIBILITY,
  TEXT_DECORATION,
  OVERFLOW,
  DISPLAY,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
};
