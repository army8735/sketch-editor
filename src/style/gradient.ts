import { d2r } from '../math/geom';
import { identity, multiplyRotateZ, multiplyScaleY } from '../math/matrix';
import { clone } from '../util';
import { color2rgbaInt } from './css';
import { calUnit, ColorStop, GRADIENT, StyleUnit } from './define';
import reg from './reg';
import { calMatrixByOrigin } from './transform';

// 获取color-stop区间范围，去除无用值
export function getColorStop(
  stops: Array<ColorStop>,
  length: number,
  isConic = false,
) {
  const list: Array<{ color: Array<number>; offset?: number }> = [];
  const firstColor = stops[0].color.v;
  // 先把已经声明距离的换算成[0,1]以数组形式存入，未声明的原样存入
  for (let i = 0, len = stops.length; i < len; i++) {
    const item = stops[i];
    const offset = item.offset;
    // 考虑是否声明了位置
    if (offset) {
      if (offset.u === StyleUnit.PERCENT) {
        list.push({
          color: item.color.v,
          offset: offset.v * 0.01,
        });
      } else {
        list.push({
          color: item.color.v,
          offset: offset.v / length,
        });
      }
    } else {
      list.push({
        color: item.color.v,
      });
    }
  }
  if (list.length === 1) {
    list.push(clone(list[0]));
  }
  // 首尾不声明默认为[0, 1]
  if (list[0].offset === undefined) {
    list[0].offset = 0;
  }
  if (list.length > 1) {
    const i = list.length - 1;
    if (list[i].offset === undefined) {
      list[i].offset = 1;
    }
  }
  // 找到未声明位置的，需区间计算，找到连续的未声明的，前后的区间平分
  let start = list[0].offset;
  for (let i = 1, len = list.length; i < len - 1; i++) {
    const item = list[i];
    if (item.offset !== undefined) {
      start = item.offset;
    } else {
      let j = i + 1;
      let end = list[list.length - 1].offset;
      for (; j < len - 1; j++) {
        const item = list[j];
        if (item.offset !== undefined) {
          end = item.offset;
          break;
        }
      }
      const num = j - i + 1;
      const per = (end! - start!) / num;
      for (let k = i; k < j; k++) {
        const item = list[k];
        item.offset = start! + per * (k + 1 - i);
      }
      i = j;
    }
  }
  // 每个不能小于前面的，按大小排序，canvas/svg兼容这种情况，但还是排序下
  list.sort((a, b) => {
    return a.offset! - b.offset!;
  });
  // 0之前的和1之后的要过滤掉
  for (let i = 0, len = list.length; i < len; i++) {
    const item = list[i];
    if (item.offset! > 1) {
      list.splice(i);
      const prev = list[i - 1];
      if (prev && prev.offset! < 1) {
        const dr = item.color[0] - prev.color[0];
        const dg = item.color[1] - prev.color[1];
        const db = item.color[2] - prev.color[2];
        const da = item.color[3] - prev.color[3];
        const p = (1 - prev.offset!) / (item.offset! - prev.offset!);
        list.push({
          color: [
            item.color[0] + dr * p,
            item.color[1] + dg * p,
            item.color[2] + db * p,
            item.color[3] + da * p,
          ],
          offset: 1,
        });
      }
      break;
    }
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const item = list[i];
    if (item.offset! < 0) {
      list.splice(0, i + 1);
      const next = list[i];
      if (next && next.offset! > 0) {
        const dr = next.color[0] - item.color[0];
        const dg = next.color[1] - item.color[1];
        const db = next.color[2] - item.color[2];
        const da = next.color[3] - item.color[3];
        const p = -item.offset! / (next.offset! - item.offset!);
        list.unshift({
          color: [
            item.color[0] + dr * p,
            item.color[1] + dg * p,
            item.color[2] + db * p,
            item.color[3] + da * p,
          ],
          offset: 0,
        });
      }
      break;
    }
  }
  // 可能存在超限情况，如在使用px单位超过len或<len时，canvas会报错超过[0,1]区间，需手动换算至区间内
  list.forEach((item) => {
    if (item.offset! < 0) {
      item.offset = 0;
    } else if (item.offset! > 1) {
      item.offset = 1;
    }
  });
  // 都超限时，第一个颜色兜底
  if (!list.length) {
    list.push(
      {
        color: firstColor,
        offset: 0,
      },
      {
        color: firstColor,
        offset: 1,
      },
    );
  }
  // 首尾可以省略，即不是[0,1]区间，对于conic来说会错误，首尾需线性相接成为一个环
  if (isConic) {
    const first = list[0];
    const last = list[list.length - 1];
    if (first.offset! > 0 || last.offset! < 1) {
      const dr = last.color[0] - first.color[0];
      const dg = last.color[1] - first.color[1];
      const db = last.color[2] - first.color[2];
      const da = last.color[3] - first.color[3];
      const dp = first.offset! + (1 - last.offset!);
      if (first.offset! > 0) {
        const p = first.offset! / dp;
        list.unshift({
          color: [
            first.color[0] + dr * p,
            first.color[1] + dg * p,
            first.color[2] + db * p,
            first.color[3] + da * p,
          ],
          offset: 0,
        });
      }
      if (last.offset! < 1) {
        const p = (1 - last.offset!) / dp;
        list.push({
          color: [
            last.color[0] - dr * p,
            last.color[1] - dg * p,
            last.color[2] - db * p,
            last.color[3] - da * p,
          ],
          offset: 1,
        });
      }
    }
  }
  return list;
}

export function parseGradient(s: string) {
  const gradient = reg.gradient.exec(s);
  if (gradient) {
    const t = {
      linear: GRADIENT.LINEAR,
      radial: GRADIENT.RADIAL,
      conic: GRADIENT.CONIC,
    }[gradient[1].toLowerCase()]!;
    let d: Array<number>;
    if (t === GRADIENT.LINEAR || t === GRADIENT.CONIC) {
      const points =
        /([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)/.exec(
          gradient[2],
        );
      if (points) {
        d = [
          parseFloat(points[1]),
          parseFloat(points[2]),
          parseFloat(points[3]),
          parseFloat(points[4]),
        ];
      } else {
        return;
      }
    } else if (t === GRADIENT.RADIAL) {
      const points =
        /([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)/.exec(
          gradient[2],
        );
      if (points) {
        d = [
          parseFloat(points[1]),
          parseFloat(points[2]),
          parseFloat(points[3]),
          parseFloat(points[4]),
          parseFloat(points[5]),
        ];
      } else {
        return;
      }
    }
    const v =
      gradient[2].match(
        /(([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?[pxremvwhina%]*)?\s*((#[0-9a-f]{3,8})|(rgba?\s*\(.+?\)))\s*([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?[pxremvwhina%]*)?)|(transparent)/gi,
      ) || [];
    const stops: Array<ColorStop> = v.map((item) => {
      const color =
        /(?:#[0-9a-f]{3,8})|(?:rgba?\s*\(.+?\))|(?:transparent)/i.exec(item);
      const percent =
        /[-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?(?:(?:px)|%)?/.exec(
          item.replace(color![0], ''),
        );
      let offset;
      if (percent) {
        const v = calUnit(percent[0]);
        if ([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(v.u) > -1) {
          v.u = StyleUnit.PX;
        }
        offset = v;
      }
      return {
        color: {
          v: color ? color2rgbaInt(color[0]) : [0, 0, 0, 1],
          u: StyleUnit.RGBA,
        },
        offset,
      };
    });
    return {
      t,
      d: d!,
      stops,
    };
  }
}

export type Linear = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  total: number;
  stop: { color: number[]; offset?: number }[];
};

/**
 * 生成canvas的linearGradient
 * @param stops
 * @param d 控制点或角度
 * @param ox 原点
 * @param oy
 * @param w
 * @param h
 */
export function getLinear(
  stops: Array<ColorStop>,
  d: Array<number>,
  ox: number,
  oy: number,
  w: number,
  h: number,
): Linear {
  const x1 = ox + d[0] * w;
  const y1 = oy + d[1] * h;
  const x2 = ox + d[2] * w;
  const y2 = oy + d[3] * h;
  const total = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const stop = getColorStop(stops, total, false);
  return {
    x1,
    y1,
    x2,
    y2,
    total,
    stop,
  };
}

export type Radial = {
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  ellipseLength: number;
  matrix?: Float64Array;
  total: number;
  stop: { color: number[]; offset?: number }[];
};

export function getRadial(
  stops: Array<ColorStop>,
  d: Array<number>,
  dx: number,
  dy: number,
  w: number,
  h: number,
): Radial {
  const x1 = dx + d[0] * w; // 中心点
  const y1 = dy + d[1] * h;
  const x2 = dx + d[2] * w; // 目标轴的端点，默认水平右方向
  const y2 = dy + d[3] * h;
  const ellipseLength = d[4]; // 缩放比，另一轴和目标轴垂直
  const total = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const stop = getColorStop(stops, total, false);
  let matrix: Float64Array | undefined;
  // 以目标轴为基准视作圆，缩放另一轴和旋转
  if (ellipseLength && ellipseLength !== 1) {
    matrix = identity();
    if (y2 !== y1) {
      // 90 / 720
      if (x2 === x1) {
        if (y2 >= y1) {
          multiplyRotateZ(matrix, d2r(90));
        } else {
          multiplyRotateZ(matrix, d2r(270));
        }
      } else {
        const tan = Math.atan((y2 - y1) / (x2 - x1));
        multiplyRotateZ(matrix, tan);
      }
    }
    multiplyScaleY(matrix, ellipseLength);
    matrix = calMatrixByOrigin(matrix, x1, y1);
  }
  return {
    cx: x1,
    cy: y1,
    tx: x2,
    ty: y2,
    ellipseLength,
    matrix,
    total,
    stop,
  };
}

export type Conic = {
  angle: number;
  cx: number;
  cy: number;
  stop: { color: number[]; offset?: number }[];
};

export function getConic(
  stops: Array<ColorStop>,
  d: Array<number>,
  ox: number,
  oy: number,
  w: number,
  h: number,
): Conic {
  const x1 = ox + d[0] * w;
  const y1 = oy + d[1] * h;
  const x2 = ox + d[2] * w;
  const y2 = oy + d[3] * h;
  const x = x2 - x1;
  const y = y2 - y1;
  let angle = 0;
  if (x === 0) {
    if (y >= 0) {
      angle = 0;
    } else {
      angle = 180;
    }
  } else {
    angle = Math.atan(y / x);
  }
  const total = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  const stop = getColorStop(stops, total, true);
  return {
    angle,
    cx: x1,
    cy: y1,
    stop,
  };
}

export default {
  getColorStop,
  getLinear,
  getRadial,
  getConic,
};
