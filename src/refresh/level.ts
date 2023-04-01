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

export function isRepaintKey(k: string): boolean {
  return k === 'visible' || k === 'color' || k === 'backgroundColor'
    || k === 'mixBlendMode';
}

export function getLevel(k: string): RefreshLevel {
  if (k === 'pointerEvents') {
    return RefreshLevel.NONE;
  }
  if (k === 'translateX') {
    return RefreshLevel.TRANSLATE_X;
  }
  if (k === 'translateY') {
    return RefreshLevel.TRANSLATE_Y;
  }
  if (k === 'rotateZ') {
    return RefreshLevel.ROTATE_Z;
  }
  if (k === 'scaleX') {
    return RefreshLevel.SCALE_X;
  }
  if (k === 'scaleY') {
    return RefreshLevel.SCALE_Y;
  }
  if (k === 'transformOrigin') {
    return RefreshLevel.TRANSFORM;
  }
  if (k === 'opacity') {
    return RefreshLevel.OPACITY;
  }
  if (k === 'mixBlendMode') {
    return RefreshLevel.MIX_BLEND_MODE;
  }
  if (isRepaintKey(k)) {
    return RefreshLevel.REPAINT;
  }
  return RefreshLevel.REFLOW;
}

export default {
  RefreshLevel,
  isRepaint,
  isReflow,
  isRepaintKey,
};
