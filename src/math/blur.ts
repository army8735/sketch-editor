/**
 * https://www.w3.org/TR/2018/WD-filter-effects-1-20181218/#feGaussianBlurElement
 * 根据模糊参数sigma求卷积核尺寸
 */
export function kernelSize(sigma: number) {
  if (sigma <= 0) {
    return 0;
  }
  let d = Math.floor(sigma * 3 * Math.sqrt(2 * Math.PI) / 4 + 0.5);
  if (d < 2) {
    d = 2;
  }
  if (d % 2 === 0) {
    d++;
  }
  return d;
}

/**
 * 根据sigma求模糊扩展尺寸，卷积核求得后为d，再求半径/2，然后因为算法要执行3次，所以*3
 * 比如本来d为5，半径2.5算上自身像素点则各方向扩展2，*3则扩展6
 * @param sigma
 * @returns {number}
 */
export function outerSize(sigma: number) {
  const d = kernelSize(sigma);
  return outerSizeByD(d);
}

export function outerSizeByD(d: number) {
  return Math.floor(d * 0.5) * 3;
}

/**
 * 一维高斯正态分布，根据标准差和卷积核尺寸返回一维权重数组
 * @param sigma
 * @param d
 */
export function gaussianWeight(sigma: number, d: number) {
  if (sigma <= 0 || d <= 0) {
    return [1];
  }
  const list: number[] = [];
  const len = Math.floor(d * 0.5);
  let total = 0;
  for (let i = len; i >= 0; i--) {
    const n = Math.pow(Math.E, -Math.pow(i, 2) / (2 * Math.pow(sigma, 2)))
      / (sigma * Math.sqrt(2 * Math.PI));
    list.push(n);
    total += n;
  }
  for (let i = 1; i <= len; i++) {
    const n = list[len - i];
    list.push(n);
    total += n;
  }
  if (total !== 1) {
    for (let i = 0; i < d; i++) {
      list[i] /= total;
    }
  }
  return list;
}

// https://blog.ivank.net/fastest-gaussian-blur.html
export function boxesForGauss(sigma: number, n = 3) {
  const wIdeal = Math.sqrt((12 * sigma * sigma / n) + 1);  // Ideal averaging filter width
  let wl = Math.floor(wIdeal);
  if (wl % 2 == 0) {
    wl--;
  }
  const wu = wl + 2;

  const mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
  const m = Math.round(mIdeal);
  // var sigmaActual = Math.sqrt( (m*wl*wl + (n-m)*wu*wu - n)/12 );

  const sizes = [];
  for (let i = 0; i < n; i++) sizes.push(i < m ? wl : wu);
  return sizes;
}

// https://github.com/servo/webrender/issues/2821#issuecomment-413756425
export function dualKawase(sigma: number) {
  const passes = Math.max(1, Math.round(4 / 3 * Math.log(sigma)));
  const distance = Math.pow(0.4538, passes) * sigma;
  return { passes, distance };
}

export default {
  kernelSize,
  outerSize,
  outerSizeByD,
  gaussianWeight,
  boxesForGauss,
  dualKawase,
};
