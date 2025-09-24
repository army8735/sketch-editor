// prettier-ignore
export enum RefreshLevel {
  NONE =             0b0000000000000000, // 0
  CACHE =            0b0000000000000001, // 1
  TRANSLATE_X =      0b0000000000000010, // 2
  TRANSLATE_Y =      0b0000000000000100, // 4
  TRANSLATE =        0b0000000000000110, // 6
  ROTATE_Z =         0b0000000000001000, // 8
  SCALE_X =          0b0000000000010000, // 16
  SCALE_Y =          0b0000000000100000, // 32
  SCALE =            0b0000000000110000, // 48
  TRANSFORM =        0b0000000001000000, // 64
  TRANSFORM_ALL =    0b0000000001111110, // 126
  OPACITY =          0b0000000010000000, // 128
  FILTER =           0b0000000100000000, // 256
  MIX_BLEND_MODE =   0b0000001000000000, // 512
  MASK =             0b0000010000000000, // 1024
  BREAK_MASK =       0b0000100000000000, // 2048
  TINT =             0b0001000000000000, // 4096
  REPAINT =          0b0010000000000000, // 8192
  REFLOW =           0b0100000000000000, // 16384
  REFLOW_REPAINT =   0b0110000000000000, // 24576
  REFLOW_TRANSFORM = 0b0100000011111110, // 16638
  REFLOW_OPACITY =   0b0100000010000000, // 16512
  REFLOW_FILTER =    0b0100000100000000, // 16640
  REBUILD =          0b1000000000000000, // 32768
  FULL =             0b1111111111111111, // 65535
}

export function isReflow(lv: number) {
  return lv >= RefreshLevel.REFLOW;
}

export function isRepaint(lv: number) {
  return lv < RefreshLevel.REFLOW && lv >= RefreshLevel.REPAINT;
}

export function isReflowKey(k: string) {
  return (
    k === 'width' ||
    k === 'height' ||
    k === 'letterSpacing' ||
    k === 'paragraphSpacing' ||
    k === 'textAlign' ||
    k === 'textVerticalAlign' ||
    k === 'fontFamily' ||
    k === 'fontSize' ||
    k === 'fontWeight' ||
    k === 'fontStyle' ||
    k === 'lineHeight' ||
    k === 'left' ||
    k === 'top' ||
    k === 'right' ||
    k === 'bottom'
  );
}

export function getLevel(k: string) {
  if (k === 'pointerEvents' ||
    k === 'constrainProportions' ||
    k === 'isLocked' ||
    k === 'isSelected' ||
    k === 'resizesContent' ||
    k === 'isRectangle') {
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
  if (k === 'transformOrigin' || k === 'matrix') {
    return RefreshLevel.TRANSFORM;
  }
  if (k === 'opacity') {
    return RefreshLevel.OPACITY;
  }
  if (k === 'blur' ||
    k === 'shadow' ||
    k === 'shadowEnable' ||
    k === 'hueRotate' ||
    k === 'saturate' ||
    k === 'brightness' ||
    k === 'contrast') {
    return RefreshLevel.FILTER;
  }
  if (k === 'mixBlendMode') {
    return RefreshLevel.MIX_BLEND_MODE;
  }
  if (k === 'maskMode') {
    return RefreshLevel.MASK;
  }
  if (k === 'breakMask') {
    return RefreshLevel.BREAK_MASK;
  }
  if (isReflowKey(k)) {
    return RefreshLevel.REFLOW;
  }
  return RefreshLevel.REPAINT;
}

export default {
  RefreshLevel,
  isRepaint,
  isReflow,
  isReflowKey,
};
