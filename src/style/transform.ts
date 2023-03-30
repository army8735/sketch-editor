import { d2r } from '../math/geom';
import {
  identity,
  isE,
  multiplyRotateZ,
  multiplyScaleX,
  multiplyScaleY,
  multiplyTfo,
  tfoMultiply
} from '../math/matrix';
import { StyleArray, StyleKey } from './define';
import { calSize, normalize } from './css';

export function calRotateZ(t: Float64Array, v: number) {
  v = d2r(v);
  let sin = Math.sin(v);
  let cos = Math.cos(v);
  t[0] = t[5] = cos;
  t[1] = sin;
  t[4] = -sin;
  return t;
}

// 已有计算好的变换矩阵，根据tfo原点计算最终的matrix
export function calMatrixByOrigin(m: Float64Array, ox: number, oy: number) {
  let res = m.slice(0);
  if(ox === 0 && oy === 0 || isE(m)) {
    return res;
  }
  res = tfoMultiply(ox, oy, res);
  res = multiplyTfo(res, -ox, -oy);
  return res;
}

export function calStyleMatrix(style: StyleArray, x = 0, y = 0, width = 0, height = 0, computedStyle?: Array<any>) {
  const transform = identity();
  transform[12] = style[StyleKey.TRANSLATE_X] ? calSize(style[StyleKey.TRANSLATE_X], width) : 0;
  transform[13] = style[StyleKey.TRANSLATE_Y] ? calSize(style[StyleKey.TRANSLATE_Y], height) : 0;
  const rotateZ = style[StyleKey.ROTATE_Z] ? (style[StyleKey.ROTATE_Z].v as number) : 0;
  const scaleX = style[StyleKey.SCALE_X] ? (style[StyleKey.SCALE_X].v as number) : 1;
  const scaleY = style[StyleKey.SCALE_Y] ? (style[StyleKey.SCALE_Y].v as number) : 1;
  if (computedStyle) {
    computedStyle[StyleKey.TRANSLATE_X] = transform[12];
    computedStyle[StyleKey.TRANSLATE_Y] = transform[13];
    computedStyle[StyleKey.ROTATE_Z] = rotateZ;
    computedStyle[StyleKey.SCALE_X] = scaleX;
    computedStyle[StyleKey.SCALE_Y] = scaleY;
  }
  if (isE(transform)) {
    calRotateZ(transform, rotateZ);
  }
  else if (rotateZ) {
    multiplyRotateZ(transform, d2r(rotateZ));
  }
  if (scaleX !== 1) {
    if (isE(transform)) {
      transform[0] = scaleX;
    }
    else {
      multiplyScaleX(transform, scaleX);
    }
  }
  if (scaleY !== 1) {
    if (isE(transform)) {
      transform[5] = scaleY;
    }
    else {
      multiplyScaleY(transform, scaleY);
    }
  }
  if (style[StyleKey.TRANSFORM_ORIGIN]) {
    const tfo = style[StyleKey.TRANSFORM_ORIGIN].map((item, i) => {
      return calSize(item, i ? height : width);
    });
    if (computedStyle) {
      computedStyle[StyleKey.TRANSFORM_ORIGIN] = tfo;
    }
    return calMatrixByOrigin(transform, tfo[0] + x, tfo[1] + y);
  }
  return transform;
}

export function calMatrix(style: any, x = 0, y = 0, width = 0, height = 0, computedStyle?: Array<any>) {
  return calStyleMatrix(normalize(style), x, y, width, height, computedStyle);
}

export default {
  calRotateZ,
  calMatrix,
  calStyleMatrix,
  calMatrixByOrigin,
};
