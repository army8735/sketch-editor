import { d2r } from '../math/geom';
import {
  identity,
  isE,
  multiplyRotateZ,
  multiplyScaleX,
  multiplyScaleY,
  multiplyTfo,
  tfoMultiply,
} from '../math/matrix';
import { Style } from './define';
import { calSize } from './css';

export function calRotateZ(t: Float32Array, v: number) {
  return calRotateZRadian(t, d2r(v));
}

export function calRotateZRadian(t: Float32Array, v: number) {
  const sin = Math.sin(v);
  const cos = Math.cos(v);
  t[0] = t[5] = cos;
  t[1] = sin;
  t[4] = -sin;
  return t;
}

// 已有计算好的变换矩阵，根据tfo原点计算最终的matrix
export function calMatrixByOrigin(m: Float32Array, ox: number, oy: number) {
  let res = m.slice(0) as Float32Array;
  if (ox === 0 && oy === 0 || isE(m)) {
    return res;
  }
  res = tfoMultiply(ox, oy, res);
  res = multiplyTfo(res, -ox, -oy);
  return res;
}

export function calMatrix(style: Style, width = 0, height = 0) {
  const transform = identity();
  transform[12] = style.translateX ? calSize(style.translateX, width) : 0;
  transform[13] = style.translateY ? calSize(style.translateY, height) : 0;
  const rotateZ = style.rotateZ ? (style.rotateZ.v as number) : 0;
  const scaleX = style.scaleX ? (style.scaleX.v as number) : 1;
  const scaleY = style.scaleY ? (style.scaleY.v as number) : 1;
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
  return transform;
}

export function calTransformByMatrixAndOrigin(matrix: Float32Array, x: number, y: number) {
  let res = matrix.slice(0) as Float32Array;
  res = multiplyTfo(res, x, y);
  res = tfoMultiply(-x, -y, res);
  return res;
}

export default {
  calRotateZ,
  calRotateZRadian,
  calMatrix,
  calMatrixByOrigin,
  calTransformByMatrixAndOrigin,
};
