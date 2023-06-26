import inject from '../util/inject';

export function genConicGradientImageData(
  originX: number,
  originY: number,
  width: number,
  height: number,
  stop: Array<{ color: number[], offset: number }>,
  data: Uint8ClampedArray,
) {
  if (stop.length < 2) {
    throw new Error(
      'Conic gradient should receive at least 2 gradient statements (start and end).'
    );
  }
  width = Math.ceil(width);
  height = Math.ceil(height);

  /**
   * 根据坐标获取角度
   * @param {number} x - x坐标，左上角为原点
   * @param {number} y - y坐标，左上角为原点
   * @returns {number} angle - 角度，0～2 * Math.PI，(originX, originY) 为原点，垂直向上为0
   */
  const getAngle = (x: number, y: number) => {
    // 此函数注释内的x、y轴基于 (originX, originY)
    // 计算相对 (originX, originY) 的坐标(dx, dy)
    const dx = x - originX;
    const dy = originY - y;
    // 在y轴上
    if (dx === 0) {
      return dy < 0
        ? // y轴负半轴，
        Math.PI
        : // y轴正半轴，因此，(originX, originY) 的angle视作0
        0;
    }
    // 在x轴上
    if (dy === 0) {
      return dx < 0
        ? // x轴负半轴
        1.5 * Math.PI
        : // x轴正半轴
        0.5 * Math.PI;
    }
    const atan = Math.atan(dy / dx);
    /**
     *  2   |  1
     * -----|-----
     *  3   |  4
     */
    // 第一象限，atan > 0
    // 第四象限，atan < 0
    if (dx > 0) {
      return 0.5 * Math.PI - atan;
    }
    // 第二象限，atan < 0
    // 第三象限，atan > 0
    if (dx < 0) {
      return 1.5 * Math.PI - atan;
    }

    return 0;
  };

  const increasingList = stop.map(item => ({
    color: item.color,
    angle: item.offset * Math.PI * 2,
  }));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // step 1. 找到当前点坐标相对 (originX, originY) 的角度
      let angle = getAngle(x, y);
      // 转换为向右为0°
      angle -= Math.PI * 0.5;
      if (angle < 0) {
        angle += Math.PI * 2;
      }
      // step 2. 找到当前点坐标对应的渐变区间
      let j;
      for (j = 0; j < increasingList.length && increasingList[j].angle <= angle; j++) {
      }
      const start = increasingList[j - 1];
      const end = increasingList[j];
      if (!(start && end)) {
        // step 2-1. 不在渐变区间里
        continue;
      }
      // step 3. 计算色值并填充
      const factor = (angle - start.angle) / (end.angle - start.angle);
      const color = end.color.map(
        (v, idx) => factor * (v - start.color[idx]) + start.color[idx]
      );
      const i = (x + y * width) * 4;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = Math.min(255, color[3] * 255);
    }
  }
  return data;
}

export function drawConicGradient(
  originX: number,
  originY: number,
  width: number,
  height: number,
  stop: Array<{ color: number[], offset: number }>,
) {
  width = Math.ceil(width);
  height = Math.ceil(height);
  const offscreen = inject.getOffscreenCanvas(width, height);
  const imageData = offscreen.ctx.getImageData(0, 0, width, height);
  genConicGradientImageData(originX, originY, width, height, stop, imageData.data);
  offscreen.ctx.putImageData(imageData, 0, 0);
  return offscreen;
}

export default {
  genConicGradientImageData,
  drawConicGradient,
};
