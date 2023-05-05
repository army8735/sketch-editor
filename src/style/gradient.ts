import { clone } from '../util';
import { color2rgbaInt } from './css';
import { calUnit, ColorStop, GRADIENT, StyleUnit } from './define';
import reg from './reg';

// 获取color-stop区间范围，去除无用值
function getColorStop(stops: Array<ColorStop>, length: number) {
  const list: Array<[Array<number>, number?]> = [];
  const firstColor = stops[0].color.v;
  // 先把已经声明距离的换算成[0,1]以数组形式存入，未声明的原样存入
  for (let i = 0, len = stops.length; i < len; i++) {
    const item = stops[i];
    const offset = item.offset;
    // 考虑是否声明了位置
    if (offset) {
      if (offset.u === StyleUnit.PERCENT) {
        list.push([item.color.v, offset.v * 0.01]);
      } else {
        list.push([item.color.v, offset.v / length]);
      }
    } else {
      list.push([item.color.v]);
    }
  }
  if (list.length === 1) {
    list.push(clone(list[0]));
  }
  // 首尾不声明默认为[0, 1]
  if (list[0].length === 1) {
    list[0].push(0);
  }
  if (list.length > 1) {
    const i = list.length - 1;
    if (list[i].length === 1) {
      list[i].push(1);
    }
  }
  // 找到未声明位置的，需区间计算，找到连续的未声明的，前后的区间平分
  let start = list[0][1];
  for (let i = 1, len = list.length; i < len - 1; i++) {
    const item = list[i];
    if (item.length > 1) {
      start = item[1];
    } else {
      let j = i + 1;
      let end = list[list.length - 1][1];
      for (; j < len - 1; j++) {
        const item = list[j];
        if (item.length > 1) {
          end = item[1];
          break;
        }
      }
      const num = j - i + 1;
      const per = (end! - start!) / num;
      for (let k = i; k < j; k++) {
        const item = list[k];
        item.push(start! + per * (k + 1 - i));
      }
      i = j;
    }
  }
  // 每个不能小于前面的，canvas/svg不能兼容这种情况，需处理
  for (let i = 1, len = list.length; i < len; i++) {
    const item = list[i];
    const prev = list[i - 1];
    if (item[1]! < prev[1]!) {
      item[1] = prev[1];
    }
  }
  // 0之前的和1之后的要过滤掉
  for (let i = 0, len = list.length; i < len; i++) {
    const item = list[i];
    if (item[1]! > 1) {
      list.splice(i);
      const prev = list[i - 1];
      if (prev && prev[1]! < 1) {
        const dr = item[0][0] - prev[0][0];
        const dg = item[0][1] - prev[0][1];
        const db = item[0][2] - prev[0][2];
        const da = item[0][3] - prev[0][3];
        const p = (1 - prev[1]!) / (item[1]! - prev[1]!);
        list.push([
          [
            item[0][0] + dr * p,
            item[0][1] + dg * p,
            item[0][2] + db * p,
            item[0][3] + da * p,
          ],
          1,
        ]);
      }
      break;
    }
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const item = list[i];
    if (item[1]! < 0) {
      list.splice(0, i + 1);
      const next = list[i];
      if (next && next[1]! > 0) {
        const dr = next[0][0] - item[0][0];
        const dg = next[0][1] - item[0][1];
        const db = next[0][2] - item[0][2];
        const da = next[0][3] - item[0][3];
        const p = -item[1]! / (next[1]! - item[1]!);
        list.unshift([
          [
            item[0][0] + dr * p,
            item[0][1] + dg * p,
            item[0][2] + db * p,
            item[0][3] + da * p,
          ],
          0,
        ]);
      }
      break;
    }
  }
  // 可能存在超限情况，如在使用px单位超过len或<len时，canvas会报错超过[0,1]区间，需手动换算至区间内
  list.forEach((item) => {
    if (item[1]! < 0) {
      item[1] = 0;
    } else if (item[1]! > 1) {
      item[1] = 1;
    }
  });
  // 都超限时，第一个颜色兜底
  if (!list.length) {
    list.push([firstColor, 0]);
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
) {
  const x1 = ox + d[0] * w;
  const y1 = oy + d[1] * h;
  const x2 = ox + d[2] * w;
  const y2 = oy + d[3] * h;
  const total = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const stop = getColorStop(stops, total);
  return {
    x1,
    y1,
    x2,
    y2,
    stop,
  };
}

export function getRadial(
  stops: Array<ColorStop>,
  d: Array<number>,
  ox: number,
  oy: number,
  w: number,
  h: number,
) {
  const x1 = ox + d[0] * w;
  const y1 = oy + d[1] * h;
  const x2 = ox + d[2] * w;
  const y2 = oy + d[3] * h;
  const ellipseLength = d[4];
  const total = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const stop = getColorStop(stops, total);
  return {
    cx: x1,
    cy: y1,
    tx: x2,
    ty: y2,
    ellipseLength,
    total,
    stop,
  };
}
