export function identity() {
  return new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

// 16位单位矩阵判断，空也认为是
export function isE(m: Float64Array | undefined) {
  if(!m || !m.length) {
    return true;
  }
  return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 0
    && m[4] === 0 && m[5] === 1 && m[6] === 0 && m[7] === 0
    && m[8] === 0 && m[9] === 0 && m[10] === 1 && m[11] === 0
    && m[12] === 0 && m[13] === 0 && m[14] === 0 && m[15] === 1;
}

// 矩阵a*b，固定两个matrix都是长度16
export function multiply(a: Float64Array, b: Float64Array): Float64Array {
  if(isE(a)) {
    return new Float64Array(b);
  }
  if(isE(b)) {
    return new Float64Array(a);
  }
  let c = identity();
  for(let i = 0; i < 4; i++) {
    let a0 = a[i];
    let a1 = a[i + 4];
    let a2 = a[i + 8];
    let a3 = a[i + 12];
    c[i] = a0 * b[0] + a1 * b[1] + a2 * b[2] + a3 * b[3];
    c[i + 4] = a0 * b[4] + a1 * b[5] + a2 * b[6] + a3 * b[7];
    c[i + 8] = a0 * b[8] + a1 * b[9] + a2 * b[10] + a3 * b[11];
    c[i + 12] = a0 * b[12] + a1 * b[13] + a2 * b[14] + a3 * b[15];
  }
  return c;
}

// 同引用更改b数据
export function multiplyRef(a: Float64Array, b: Float64Array): Float64Array {
  if(isE(a)) {
    return b;
  }
  if(isE(b)) {
    assignMatrix(b, a);
    return b;
  }
  const b0 = b[0];
  const b1 = b[1];
  const b2 = b[2];
  const b3 = b[3];
  const b4 = b[4];
  const b5 = b[5];
  const b6 = b[6];
  const b7 = b[7];
  const b8 = b[8];
  const b9 = b[9];
  const b10 = b[10];
  const b11 = b[11];
  const b12 = b[12];
  const b13 = b[13];
  const b14 = b[14];
  const b15 = b[15];
  for(let i = 0; i < 4; i++) {
    let a0 = a[i];
    let a1 = a[i + 4];
    let a2 = a[i + 8];
    let a3 = a[i + 12];
    b[i] = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
    b[i + 4] = a0 * b4 + a1 * b5 + a2 * b6 + a3 * b7;
    b[i + 8] = a0 * b8 + a1 * b9 + a2 * b10 + a3 * b11;
    b[i + 12] = a0 * b12 + a1 * b13 + a2 * b14 + a3 * b15;
  }
  return b;
}

export function toE(m: Float64Array) {
  m[0] = 1;
  m[1] = 0;
  m[2] = 0;
  m[3] = 0;
  m[4] = 0;
  m[5] = 1;
  m[6] = 0;
  m[7] = 0;
  m[8] = 0;
  m[9] = 0;
  m[10] = 1;
  m[11] = 0;
  m[12] = 0;
  m[13] = 0;
  m[14] = 0;
  m[15] = 1;
  return m;
}


/**
 * 求任意4*4矩阵的逆矩阵，行列式为 0 则返回单位矩阵兜底
 * 格式：matrix3d(a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, a4, b4, c4, d4)
 * 参见: https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix3d()
 * 对应：
 * [
 *   a1,a2,a3,a4,
 *   b1,b2,b3,b4,
 *   c1,c2,c3,c4,
 *   d1,d2,d3,d4,
 * ]
 *
 * 根据公式 A* = |A|A^-1 来计算
 * A* 表示矩阵 A 的伴随矩阵，A^-1 表示矩阵 A 的逆矩阵，|A| 表示行列式的值
 *
 * @returns {number[]}
 */

export function inverse4(m: Float64Array) {
  if (isE(m)) {
    return identity();
  }
  const inv = new Float64Array(16);

  inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15]
    + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
  inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15]
    - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
  inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15]
    + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
  inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14]
    - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];

  inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15]
    - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
  inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15]
    + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
  inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15]
    - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
  inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14]
    + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];

  inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15]
    + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
  inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15]
    - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
  inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15]
    + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
  inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14]
    - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];

  inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11]
    - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
  inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11]
    + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
  inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11]
    - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
  inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10]
    + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];

  let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
  if (det === 0) {
    return identity();
  }

  det = 1 / det;
  const d = new Float64Array(16);
  for (let i = 0; i < 16; i++) {
    d[i] = inv[i] * det;
  }
  return d;
}

export function assignMatrix(t: Float64Array, v: Float64Array) {
  if(t && v) {
    t[0] = v[0];
    t[1] = v[1];
    t[2] = v[2];
    t[3] = v[3];
    t[4] = v[4];
    t[5] = v[5];
    t[6] = v[6];
    t[7] = v[7];
    t[8] = v[8];
    t[9] = v[9];
    t[10] = v[10];
    t[11] = v[11];
    t[12] = v[12];
    t[13] = v[13];
    t[14] = v[14];
    t[15] = v[15];
  }
  return t;
}

export function multiplyTfo(m: Float64Array, x: number, y: number) {
  if(!x && !y) {
    return m;
  }
  m[12] += m[0] * x + m[4] * y;
  m[13] += m[1] * x + m[5] * y;
  m[14] += m[2] * x + m[6] * y;
  m[15] += m[3] * x + m[7] * y;
  return m;
}

export function tfoMultiply(x: number, y: number, m: Float64Array) {
  if(!x && !y) {
    return m;
  }
  let d = m[3], h = m[7], l = m[11], p = m[15];
  m[0] += d * x;
  m[1] += d * y;
  m[4] += h * x;
  m[5] += h * y;
  m[8] += l * x;
  m[9] += l * y;
  m[12] += p * x;
  m[13] += p * y;
  return m;
}

// 几种特殊的transform变换优化
export function multiplyTranslateX(m: Float64Array, v: number) {
  if(!v) {
    return m;
  }
  m[12] += m[0] * v;
  m[13] += m[1] * v;
  m[14] += m[2] * v;
  m[15] += m[3] * v;
  return m;
}

export function multiplyTranslateY(m: Float64Array, v: number) {
  if(!v) {
    return m;
  }
  m[12] += m[4] * v;
  m[13] += m[5] * v;
  m[14] += m[6] * v;
  m[15] += m[7] * v;
  return m;
}

export function multiplyRotateZ(m: Float64Array, v: number) {
  if(!v) {
    return m;
  }
  let sin = Math.sin(v);
  let cos = Math.cos(v);
  let a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5], g = m[6], h = m[7];
  m[0] = a * cos + e * sin;
  m[1] = b * cos + f * sin;
  m[2] = c * cos + g * sin;
  m[3] = d * cos + h * sin;
  m[4] = a * -sin + e * cos;
  m[5] = b * -sin + f * cos;
  m[6] = c * -sin + g * cos;
  m[7] = d * -sin + h * cos;
  return m;
}

export function multiplyScaleX(m: Float64Array, v: number) {
  if(v === 1) {
    return m;
  }
  m[0] *= v;
  m[1] *= v;
  m[2] *= v;
  m[3] *= v;
  return m;
}

export function multiplyScaleY(m: Float64Array, v: number) {
  if(v === 1) {
    return m;
  }
  m[4] *= v;
  m[5] *= v;
  m[6] *= v;
  m[7] *= v;
  return m;
}

export function multiplyScale(m: Float64Array, v: number) {
  if(v === 1) {
    return m;
  }
  m[0] *= v;
  m[1] *= v;
  m[2] *= v;
  m[3] *= v;
  m[4] *= v;
  m[5] *= v;
  m[6] *= v;
  m[7] *= v;
  return m;
}

export function calPoint(point: { x: number, y: number }, m: Float64Array) {
  if(m && !isE(m)) {
    let { x, y } = point;
    let a1 = m[0], b1 = m[1];
    let a2 = m[4], b2 = m[5];
    let a4 = m[12], b4 = m[13];
    let o = {
      x: ((a1 === 1) ? x : (x * a1)) + (a2 ? (y * a2) : 0) + a4,
      y: ((b1 === 1) ? x : (x * b1)) + (b2 ? (y * b2) : 0) + b4,
    };
    return o;
  }
  return point;
}

/**
 * 初等行变换求3*3特定css的matrix方阵，一维6长度
 * https://blog.csdn.net/iloveas2014/article/details/82930946
 */
export function inverse(m: Float64Array) {
  if(m.length === 16) {
    return inverse4(m);
  }
  let a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5];
  if(a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) {
    return m;
  }
  let divisor = a * d - b * c;
  if(divisor === 0) {
    return m;
  }
  return new Float64Array([d / divisor, -b / divisor, -c / divisor, a / divisor,
    (c * f - d * e) / divisor, (b * e - a * f) / divisor]);
}

export function calRectPoint(xa: number, ya: number, xb: number, yb: number, matrix: Float64Array) {
  let { x: x1, y: y1 } = calPoint({ x: xa, y: ya }, matrix);
  let { x: x3, y: y3 } = calPoint({ x: xb, y: yb }, matrix);
  let x2, y2, x4, y4;
  // 无旋转的时候可以少算2个点
  if(!matrix || !matrix.length
      || !matrix[1] && !matrix[2] && !matrix[4] && !matrix[6] && !matrix[7] && !matrix[8]) {
    x2 = x3;
    y2 = y1;
    x4 = x1;
    y4 = y3;
  }
  else {
    let t = calPoint({ x: xb, y: ya }, matrix);
    x2 = t.x; y2 = t.y;
    t = calPoint({ x: xa, y: yb }, matrix);
    x4 = t.x; y4 = t.y;
  }
  return { x1, y1, x2, y2, x3, y3, x4, y4 };
}

export default {
  identity,
  isE,
  toE,
  assignMatrix,
  inverse,
  calPoint,
  calRectPoint,
  tfoMultiply,
  multiplyTfo,
  multiply,
  multiplyRef,
};
