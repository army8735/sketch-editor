// 向量点乘积
export function dotProduct(x1: number, y1: number, x2: number, y2: number) {
  return x1 * x2 + y1 * y2;
}

// 向量叉乘积
export function crossProduct(x1: number, y1: number, x2: number, y2: number) {
  return x1 * y2 - x2 * y1;
}

// 向量长度
export function length(x: number, y: number) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

// 归一化
export function unitize(x: number, y: number) {
  let n = length(x, y);
  return {
    x: x / n,
    y: y / n,
  };
}

export default {
  dotProduct,
  crossProduct,
  length,
  unitize,
};
