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
    }
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

export type StyleValue = {
  u: StyleUnit,
};

export type StyleStrValue = StyleValue & {
  v: string,
};

export type StyleNumValue = StyleValue & {
  v: number,
};

export type StyleBoolValue = StyleValue & {
  v: boolean,
};

export type StyleColorValue = StyleValue & {
  v: Array<number>,
};

export type StyleFontStyleValue = StyleValue & {
  v: FONT_STYLE,
};

export type StyleOverflowValue = StyleValue & {
  v: OVERFLOW,
};

export type StyleMbmValue = StyleValue & {
  v: MIX_BLEND_MODE,
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
  translateX: StyleNumValue,
  translateY: StyleNumValue,
  scaleX: StyleNumValue,
  scaleY: StyleNumValue,
  rotateZ: StyleNumValue,
  transformOrigin: [StyleNumValue, StyleNumValue],
  mixBlendMode: StyleMbmValue,
  pointerEvents: StyleBoolValue,
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
  translateX: number,
  translateY: number,
  scaleX: number,
  scaleY: number,
  rotateZ: number,
  transformOrigin: [number, number],
  mixBlendMode: MIX_BLEND_MODE,
  pointerEvents: boolean,
};

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

export default {
  StyleUnit,
  calUnit,
};
