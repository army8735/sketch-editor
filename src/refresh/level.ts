import { StyleKey } from '../style';

export enum RefreshLevel {
  NONE =             0b00000000000000,
  CACHE =            0b00000000000001,
  TRANSLATE_X =      0b00000000000010,
  TRANSLATE_Y =      0b00000000000100,
  TRANSLATE =        0b00000000000110,
  ROTATE_Z =         0b00000000001000,
  SCALE_X =          0b00000000010000,
  SCALE_Y =          0b00000000100000,
  SCALE =            0b00000000110000,
  TRANSFORM =        0b00000001000000,
  TRANSFORM_ALL =    0b00000001111110,
  OPACITY =          0b00000010000000,
  FILTER =           0b00000100000000,
  MIX_BLEND_MODE =   0b00001000000000,
  MASK =             0b00010000000000,
  REPAINT =          0b00100000000000,
  REFLOW =           0b01000000000000,
  REFLOW_TRANSFORM = 0b01000001111110,
  REBUILD =          0b10000000000000,
}

export function isReflow(lv: number): boolean {
  return lv >= RefreshLevel.REFLOW;
}

export function isRepaint(lv: number): boolean {
  return lv < RefreshLevel.REFLOW;
}

export function getLevel(k: StyleKey): RefreshLevel {
  if (k === StyleKey.TRANSLATE_X) {
    return RefreshLevel.TRANSLATE_X;
  }
  if (k === StyleKey.TRANSLATE_Y) {
    return RefreshLevel.TRANSLATE_Y;
  }
  if (k === StyleKey.ROTATE_Z) {
    return RefreshLevel.ROTATE_Z;
  }
  if (k === StyleKey.SCALE_X) {
    return RefreshLevel.SCALE_X;
  }
  if (k === StyleKey.SCALE_Y) {
    return RefreshLevel.SCALE_Y;
  }
  if (k === StyleKey.TRANSFORM_ORIGIN) {
    return RefreshLevel.TRANSFORM;
  }
  if (k === StyleKey.OPACITY) {
    return RefreshLevel.OPACITY;
  }
  if (k === StyleKey.MIX_BLEND_MODE) {
    return RefreshLevel.MIX_BLEND_MODE;
  }
  if (isRepaint(k)) {
    return RefreshLevel.REPAINT;
  }
  return RefreshLevel.REFLOW;
}
