import { d2r } from '../math/geom';
import { isE, multiplyTfo, tfoMultiply } from '../math/matrix';

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
