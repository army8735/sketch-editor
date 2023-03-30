export enum StyleKey {
  TOP = 0,
  RIGHT = 1,
  BOTTOM = 2,
  LEFT = 3,
  WIDTH = 4,
  HEIGHT = 5,
  LINE_HEIGHT = 6,
  FONT_FAMILY = 7,
  FONT_SIZE = 8,
  FONT_WEIGHT = 9,
  FONT_STYLE = 10,
  VISIBLE = 11,
  OVERFLOW = 12,
  BACKGROUND_COLOR = 13,
  COLOR = 14,
  OPACITY = 15,
  TRANSLATE_X = 16,
  TRANSLATE_Y = 17,
  SCALE_X = 18,
  SCALE_Y = 19,
  ROTATE_Z = 20,
  TRANSFORM_ORIGIN = 21,
  MIX_BLEND_MODE = 22,
  POINTER_EVENTS = 23,
  // FILTER = 14,
  // FILL = 15,
  // STROKE = 16,
  // STROKE_WIDTH = 17,
  // STROKE_DASHARRAY = 18,
  // STROKE_DASHARRAY_STR = 19,
  // STROKE_LINECAP = 20,
  // STROKE_LINEJOIN = 21,
  // STROKE_MITERLIMIT = 22,
  // FILL_RULE = 23,
}

const STYLE2LOWER_MAP: any = {};
export function styleKey2Lower(s: string) {
  let res = STYLE2LOWER_MAP[s];
  if(!res) {
    res = STYLE2LOWER_MAP[s] = s.toLowerCase().replace(/_([a-z])/g, function($0, $1) {
      return $1.toUpperCase();
    });
  }
  return res;
}

const STYLE2UPPER_MAP: any = {};
export function styleKey2Upper(s: string) {
  let res = STYLE2UPPER_MAP[s];
  if(!res) {
    res = STYLE2UPPER_MAP[s] = s.replace(/([a-z\d_])([A-Z])/g, function($0, $1, $2) {
      return $1 + '_' + $2;
    }).toUpperCase();
  }
  return res;
}

export const StyleKeyHash: any = {};

for (let i in StyleKey) {
  if (!/^\d+$/.test(i)) {
    StyleKeyHash[styleKey2Lower(i)] = StyleKey[i];
  }
}

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

export type StyleNumStrValue = StyleValue & {
  v: number | string,
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

export type StyleArray = [
  StyleNumStrValue,
  StyleNumStrValue,
  StyleNumStrValue,
  StyleNumStrValue,
  StyleNumStrValue,
  StyleNumStrValue,
  StyleNumValue,
  StyleStrValue,
  StyleNumValue,
  StyleNumValue,
  StyleStrValue,
  StyleBoolValue,
  StyleStrValue,
  StyleColorValue,
  StyleColorValue,
  StyleNumValue,
  StyleNumStrValue,
  StyleNumStrValue,
  StyleNumValue,
  StyleNumValue,
  StyleNumValue,
  [StyleNumStrValue, StyleNumStrValue],
  StyleStrValue,
  StyleBoolValue,
];

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
  StyleKey,
  StyleUnit,
  calUnit,
};
