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
import { ComputedStyle, Style } from './define';
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

export function calStyleMatrix(style: Style, x = 0, y = 0, width = 0, height = 0, computedStyle?: ComputedStyle) {
  const transform = identity();
  transform[12] = style.translateX ? calSize(style.translateX, width) : 0;
  transform[13] = style.translateY ? calSize(style.translateY, height) : 0;
  const rotateZ = style.rotateZ ? (style.rotateZ.v as number) : 0;
  const scaleX = style.scaleX ? (style.scaleX.v as number) : 1;
  const scaleY = style.scaleY ? (style.scaleY.v as number) : 1;
  if (computedStyle) {
    computedStyle.translateX = transform[12];
    computedStyle.translateY = transform[13];
    computedStyle.rotateZ = rotateZ;
    computedStyle.scaleX = scaleX;
    computedStyle.scaleY = scaleY;
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
  if (style.transformOrigin) {
    const tfo = style.transformOrigin.map((item, i) => {
      return calSize(item, i ? height : width);
    });
    if (computedStyle) {
      computedStyle.transformOrigin = tfo as [number, number];
    }
    return calMatrixByOrigin(transform, tfo[0] + x, tfo[1] + y);
  }
  return transform;
}

export function calMatrix(style: any, x = 0, y = 0, width = 0, height = 0, computedStyle?: ComputedStyle) {
  return calStyleMatrix(normalize(style), x, y, width, height, computedStyle);
}

export default {
  calRotateZ,
  calMatrix,
  calStyleMatrix,
  calMatrixByOrigin,
};
