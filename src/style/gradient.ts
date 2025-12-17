import { angleBySides, d2r, r2d } from '../math/geom';
import { identity, multiplyRotateZ, multiplyScaleY } from '../math/matrix';
import { clone } from '../util/type';
import { color2rgbaInt, color2rgbaStr } from './color';
import { calUnit, ColorStop, ComputedColorStop, ComputedGradient, GRADIENT, StyleNumValue, StyleUnit } from './define';
import reg from './reg';
import { calMatrixByOrigin } from './transform';
import { toPrecision } from '../math';

// 获取color-stop区间范围，去除无用值
export function getColorStop(
  stops: ComputedColorStop[],
  total: number,
  isConic = false,
): { color: number[], offset: number }[] {
  const list: { color: number[]; offset: number }[] = [];
  const firstColor = stops[0].color;
  // offset是[0,1]的百分比形式，可能未声明缺省
  for (let i = 0, len = stops.length; i < len; i++) {
    list.push(stops[i]);
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
    }
    else {
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
    return a.offset - b.offset;
  });
  // 0之前的和1之后的要过滤掉
  for (let i = 0, len = list.length; i < len; i++) {
    const item = list[i];
    if (item.offset > 1) {
      list.splice(i);
      const prev = list[i - 1];
      if (prev && prev.offset < 1) {
        const dr = item.color[0] - prev.color[0];
        const dg = item.color[1] - prev.color[1];
        const db = item.color[2] - prev.color[2];
        const da = item.color[3] - prev.color[3];
        const p = (1 - prev.offset) / (item.offset - prev.offset);
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
    if (item.offset < 0) {
      list.splice(0, i + 1);
      const next = list[i];
      if (next && next.offset > 0) {
        const dr = next.color[0] - item.color[0];
        const dg = next.color[1] - item.color[1];
        const db = next.color[2] - item.color[2];
        const da = next.color[3] - item.color[3];
        const p = -item.offset / (next.offset - item.offset);
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
    if (item.offset < 0) {
      item.offset = 0;
    }
    else if (item.offset > 1) {
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
    if (first.offset > 0 || last.offset < 1) {
      const dr = last.color[0] - first.color[0];
      const dg = last.color[1] - first.color[1];
      const db = last.color[2] - first.color[2];
      const da = last.color[3] - first.color[3];
      const dp = first.offset + (1 - last.offset);
      if (first.offset > 0) {
        const p = first.offset / dp;
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
      if (last.offset < 1) {
        const p = (1 - last.offset) / dp;
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
  // @ts-ignore
  return list;
}

export function isGradient(s: string) {
  if (reg.gradient.test(s)) {
    let gradient = reg.gradient.exec(s);
    if (
      gradient &&
      ['linear', 'radial', 'conic'].indexOf(gradient[1].toLowerCase()) > -1
    ) {
      return true;
    }
  }
  return false;
}

export function parseGradient(s: string) {
  const gradient = reg.gradient.exec(s);
  if (gradient) {
    const t = {
      linear: GRADIENT.LINEAR,
      radial: GRADIENT.RADIAL,
      conic: GRADIENT.CONIC,
    }[gradient[1].toLowerCase()]!;
    let d: number[];
    if (t === GRADIENT.LINEAR) {
      // sketch的2点式
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
      }
      // css的角度式，d里是弧度
      else {
        const deg = /([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)/.exec(gradient[2]);
        if (deg) {
          d = [d2r(parseFloat(deg[1]))];
        }
        else {
          d = [];
        }
      }
    }
    else if (t === GRADIENT.RADIAL) {
      const points =
        /([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)(\s+([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?))?/.exec(
          gradient[2],
        );
      if (points) {
        d = [
          parseFloat(points[1]),
          parseFloat(points[2]),
          parseFloat(points[3]),
          parseFloat(points[4]),
          parseFloat(points[5]) || 0,
        ];
      }
      // 默认css的farthest-corner
      else {
        d = [
          0.5, 0.5, 1, 1,
        ];
      }
    }
    else if (t === GRADIENT.CONIC) {
      d = [];
    }
    const v =
      gradient[2].match(
        /(([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?[pxremvwhina%]*)?\s*((#[0-9a-f]{3,8})|(rgba?\s*\(.+?\)))\s*([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?[pxremvwhina%]*)?)|(transparent)/gi,
      ) || [];
    const stops: (Pick<ColorStop, 'color'> & { offset?: StyleNumValue })[] = v.map((item, i) => {
      const color =
        /(?:#[0-9a-f]{3,8})|(?:rgba?\s*\(.+?\))|(?:transparent)/i.exec(item);
      const percent =
        /[-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?(?:(?:px)|%)?/.exec(
          item.replace(color![0], ''),
        );
      let offset: StyleNumValue | undefined;
      if (percent) {
        const v = calUnit(percent[0]);
        if (v.u !== StyleUnit.PERCENT) {
          v.v *= 100;
          v.u = StyleUnit.PERCENT;
        }
        offset = v;
      }
      else {
        if (!i) {
          offset = {
            v: 0,
            u: StyleUnit.PERCENT,
          };
        }
        else if (i === v.length - 1) {
          offset = {
            v: 100,
            u: StyleUnit.PERCENT,
          };
        }
      }
      return {
        color: {
          v: color ? color2rgbaInt(color[0]) : [0, 0, 0, 1],
          u: StyleUnit.RGBA,
        },
        offset,
      };
    });
    stops.sort((a, b) => {
      if (a.offset && b.offset) {
        return a.offset.v - b.offset.v;
      }
      return 0;
    });
    for (let i = stops.length - 2; i > 0; i--) {
      const cur = stops[i];
      if (!cur.offset) {
        const next = stops[i + 1].offset!.v;
        let prev = stops[0].offset!.v;
        const old = i;
        for (let j = i - 1; j >= 0; j--) {
          if (j === 0) {
            i = j;
            break;
          }
          else if (stops[j].offset) {
            i = j;
            prev = stops[j].offset!.v;
            break;
          }
        }
        const len = old - i + 1;
        const diff = next - prev;
        const per = diff / len;
        for (let k = i + 1; k <= old; k++) {
          stops[i].offset = {
            v: prev + (k - i) * per,
            u: StyleUnit.PERCENT,
          };
        }
      }
    }
    return {
      t,
      d: d!,
      stops: stops as ColorStop[],
    };
  }
}

export type Linear = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  total: number;
  stop: { color: number[]; offset: number }[];
};

// 根据角度和宽高偏移求出sketch的两点式linear坐标方式
export function getLinearCoords(deg: number, ox: number, oy: number, w: number, h: number) {
  let x1, y1, x2, y2;
  if (deg % (Math.PI * 2) === 0) {
    x1 = x2 = w * 0.5;
    y1 = 0;
    y2 = h;
  }
  else if (deg % Math.PI === 0) {
    x1 = x2 = w * 0.5;
    y1 = h;
    y2 = 0;
  }
  else if (deg % (Math.PI * 0.5) === 0) {
    x1 = 0;
    x2 = w;
    y1 = y2 = h * 0.5;
  }
  else if (deg % (Math.PI * 1.5) === 0) {
    x1 = w;
    x2 = 0;
    y1 = y2 = h * 0.5;
  }
  else {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const r = Math.min(cx, cy);
    const sin = Math.sin(deg % 360);
    const cos = Math.cos(deg % 360);
    x1 = cx - r * sin;
    y1 = cy - r * cos;
    x2 = cx + r * sin;
    y2 = cy + r * cos;
  }
  x1 += ox;
  y1 += oy;
  x2 += ox;
  y2 += oy;
  return { x1, y1, x2, y2 };
}

/**
 * 生成canvas的linearGradient
 * @param stops
 * @param d 控制点或角度
 * @param ox 原点，一般是0，有偏移传进来
 * @param oy
 * @param w
 * @param h
 */
export function getLinear(
  stops: ComputedColorStop[],
  d: number[],
  dx: number,
  dy: number,
  w: number,
  h: number,
): Linear {
  let x1, y1, x2, y2;
  // 特殊的css角度写法，先求出外接圆心和半径，默认css是180deg
  if (d.length <= 1) {
    const t = getLinearCoords(d[0] ?? Math.PI, dx, dy, w, h);
    x1 = t.x1;
    y1 = t.y1;
    x2 = t.x2;
    y2 = t.y2;
  }
  else {
    x1 = dx + d[0] * w;
    y1 = dy + d[1] * h;
    x2 = dx + d[2] * w;
    y2 = dy + d[3] * h;
  }
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
  matrix?: Float32Array;
  total: number;
  stop: { color: number[]; offset: number }[];
};

export function getRadial(
  stops: ComputedColorStop[],
  d: number[],
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
  let matrix: Float32Array | undefined;
  // 以目标轴为基准视作圆，缩放另一轴和旋转
  if (ellipseLength && ellipseLength !== 1) {
    matrix = identity();
    if (y2 !== y1) {
      // 90 / 720
      if (x2 === x1) {
        if (y2 >= y1) {
          multiplyRotateZ(matrix, d2r(90));
        }
        else {
          multiplyRotateZ(matrix, d2r(270));
        }
      }
      else {
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
  stop: { color: number[]; offset: number }[];
};

export function getConic(
  stops: ComputedColorStop[],
  d: number[],
  dx: number,
  dy: number,
  w: number,
  h: number,
): Conic {
  let x1 = Math.floor(dx + 0.5 * w);
  let y1 = Math.floor(dy + 0.5 * h);
  const x2 = Math.floor(dx + 0.5 * w);
  const y2 = Math.floor(dy + 0.5 * h);
  const x = x2 - x1;
  const y = y2 - y1;
  // chrome的bug，偶数会有竖线
  // if (x1 % 2 === 0) {
  //   x1++;
  // }
  // if (y1 % 2 === 0) {
  //   y1++;
  // }
  let angle = 0;
  if (x === 0) {
    if (y >= 0) {
      angle = 0;
    }
    else {
      angle = Math.PI;
    }
  }
  else {
    angle = Math.atan(y / x);
  }
  // safari的bug，不是水平右位0而是垂直上，角度需增加90，新版已修复
  // if (typeof navigator !== undefined &&/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
  //   angle += Math.PI * 0.5;
  // }
  const total = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  const stop = getColorStop(stops, total, true);
  return {
    angle,
    cx: x1,
    cy: y1,
    stop,
  };
}

export function convert2Css(g: ComputedGradient, width = 100, height = 100, standard = false) {
  const { t, d, stops } = g;
  let [x1, y1, x2, y2] = d;
  x1 *= width;
  x2 *= width;
  y1 *= height;
  y2 *= height;
  let deg = 0;
  // 允许用1个数字表达角度
  if (d.length === 1) {
    deg = d[0];
  }
  else {
    if (x1 === x2) {
      if (y1 < y2) {
        deg = 180;
      }
    }
    else {
      if (x2 > x1) {
        if (y2 >= y1) {
          deg = 90 + r2d(Math.atan((y2 - y1) / (x2 - x1)));
        }
        else {
          deg = r2d(Math.atan((x2 - x1) / (y1 - y2)));
        }
      }
      else {
        if (y2 >= y1) {
          deg = 180 + r2d(Math.atan((x1 - x2) / (y2 - y1)));
        }
        else {
          deg = 360 - r2d(Math.atan((x1 - x2) / (y1 - y2)));
        }
      }
    }
  }
  const newStops = stops.slice(0);
  // panel新增可能出现顺序不对
  newStops.sort((a, b) => a.offset - b.offset);
  if (t === GRADIENT.LINEAR) {
    let start: { x: number, y: number },
      end: { x: number, y: number };
    if (deg <= 90) {
      start = { x: 0, y: height };
      end = { x: width, y: 0 };
    }
    else if (deg <= 180) {
      start = { x: 0, y: 0 };
      end = { x: width, y: height };
    }
    else if (deg <= 270) {
      start = { x: width, y: 0 };
      end = { x: 0, y: height };
    }
    else {
      start = { x: width, y: height };
      end = { x: 0, y: 0 };
    }
    const list = (clone(newStops) as ComputedColorStop[]).sort((a, b) => a.offset - b.offset);
    // 标准需要补全首尾或截取，以保持offset强制[0, 1]
    if (standard) {
      let a = Math.sqrt(Math.pow(y2 - start.y, 2) + Math.pow(x2 - start.x, 2));
      let b = Math.sqrt(Math.pow(y1 - start.y, 2) + Math.pow(x1 - start.x, 2));
      const c = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
      let theta = angleBySides(a, b, c);
      const p1 = theta ? b * Math.cos(theta) : b;
      a = Math.sqrt(Math.pow(y1 - end.y, 2) + Math.pow(x1 - end.x, 2));
      b = Math.sqrt(Math.pow(y2 - end.y, 2) + Math.pow(x2 - end.x, 2));
      theta = angleBySides(a, b, c);
      const p2 = theta ? b * Math.cos(theta) : b;
      if (list[0].offset > 0) {
        list.unshift({
          color: list[0].color.slice(0),
          offset: 0,
        });
      }
      if (list[list.length - 1].offset < 1) {
        list.push({
          color: list[list.length - 1].color.slice(0),
          offset: 1,
        });
      }
      // start超过截取
      if (p1 > 1e-9) {
        const offset = p1 / c;
        for (let i = 0, len = list.length; i < len; i++) {
          const item = list[i];
          if (item.offset >= offset) {
            const prev = list[i - 1] || { color: item.color, offset: 0 };
            list.splice(0, i);
            if (item.offset > offset) {
              const l = c * (item.offset - prev.offset);
              const p = (p1 - prev.offset * c) / l;
              const color = prev.color.map((color, i) => {
                if (i === 3) {
                  return color + (item.color[i] - color) * p;
                }
                return color + Math.floor((item.color[i] - color) * p);
              });
              const n = {
                color,
                offset: 0,
              };
              list.unshift(n);
            }
            break;
          }
        }
      }
      // 不足计算正确的offset，原本开头是0
      else if (p1 < -1e-9) {
        list.forEach(item => {
          item.offset = (item.offset * c - p1) / (c - p1);
        });
      }
      // end一样
      if (p2 > 1e-9) {
        const offset = (c - p2) / c;
        for (let i = list.length - 1; i >= 0; i--) {
          const item = list[i];
          if (item.offset <= offset) {
            const next = list[i + 1] || { color: item.color, offset: 1 };
            list.splice(i + 1);
            if (item.offset < offset) {
              const l = c * (next.offset - item.offset);
              const p = (p2 - (1 - next.offset) * c) / l;
              const color = next.color.map((color, i) => {
                if (i === 3) {
                  return color + (item.color[i] - color) * p;
                }
                return color + Math.floor((item.color[i] - color) * p);
              });
              const n = {
                color,
                offset: 1,
              };
              list.push(n);
            }
            break;
          }
        }
      }
      else if (p2 < -1e-9) {
        list.forEach(item => {
          item.offset = (item.offset * (c - p1)) / (c - p1 - p2);
        });
      }
    }
    let s = 'linear-gradient(';
    // 标准css用deg方向等，自己用sketch的2点式
    if (standard) {
      s += toPrecision(deg) + 'deg';
    }
    else {
      s += d.join(' ');
    }
    list.forEach((item) => {
      s += ', ';
      item.color[3] = toPrecision(item.color[3]);
      s += color2rgbaStr(item.color) + ' ' + toPrecision(item.offset * 100) + '%';
    });
    return s + ')';
  }
  else if (t === GRADIENT.RADIAL) {
    // 非标准不用变
    let ratio = 1;
    // 半径，和圆心到4个角的距离取最大值即farthest-corner
    if (standard) {
      const r = Math.sqrt((Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
      const d1 = Math.sqrt((Math.pow(x1, 2) + Math.pow(y1, 2)));
      const d2 = Math.sqrt((Math.pow(x1 - width, 2) + Math.pow(y1, 2)));
      const d3 = Math.sqrt((Math.pow(x1 - width, 2) + Math.pow(y1 - height, 2)));
      const d4 = Math.sqrt((Math.pow(x1, 2) + Math.pow(y1 - height, 2)));
      const distance = Math.max(d1, d2, d3, d4);
      ratio = distance / r;
    }
    let s = 'radial-gradient(';
    // css固定类型无法还原sketch的长短点表达形式
    if (standard) {
      s += `circle at ${toPrecision(d[0]) * 100}% ${toPrecision(d[1]) * 100}%, `;
    }
    else {
      s += d.join(' ') + ', ';
    }
    newStops.forEach((item, i) => {
      if (i) {
        s += ', ';
      }
      const color = item.color.map((c, i) => {
        if (i === 3) {
          return toPrecision(c);
        }
        else {
          return Math.min(255, Math.floor(c * ratio));
        }
      });
      s += color2rgbaStr(color) + ' ' + toPrecision(item.offset * 100) + '%';
    });
    return s + ')';
  }
  else if (t === GRADIENT.CONIC) {
    let s = 'conic-gradient(';
    // css的角度和sketch不一样差90°
    if (standard) {
      s += 'from 90deg, ';
    }
    // 当首尾offset不为[0,1]时，标准尾首间会断渐变需要手动补齐
    const first = newStops[0];
    const last = newStops[newStops.length - 1];
    if (standard && (first.offset > 0 || last.offset < 1)) {
      const fa = first.color[3] ?? 1;
      const la = last.color[3] ?? 1;
      const dc = [
        first.color[0] - last.color[0],
        first.color[1] - last.color[1],
        first.color[2] - last.color[2],
        fa - la,
      ];
      const dl = 1 - last.offset + first.offset;
      if (first.offset > 0) {
        const p = first.offset / dl;
        newStops.unshift({
          color: [
            Math.min(255, Math.max(0, Math.round(first.color[0] - dc[0] * p))),
            Math.min(255, Math.max(0, Math.round(first.color[1] - dc[1] * p))),
            Math.min(255, Math.max(0, Math.round(first.color[2] - dc[2] * p))),
            Math.min(1, Math.max(0, first.color[3] ?? 1 - dc[3] * p)),
          ],
          offset: 0,
        });
      }
      if (last.offset < 1) {
        const p = (1 - last.offset) / dl;
        newStops.push({
          color: [
            Math.min(255, Math.max(0, Math.round(last.color[0] + dc[0] * p))),
            Math.min(255, Math.max(0, Math.round(last.color[1] + dc[1] * p))),
            Math.min(255, Math.max(0, Math.round(last.color[2] + dc[2] * p))),
            Math.min(1, Math.max(0, last.color[3] ?? 1 + dc[3] * p)),
          ],
          offset: 1,
        });
      }
    }
    newStops.forEach((item, i) => {
      if (i) {
        s += ', ';
      }
      item.color[3] = toPrecision(item.color[3]);
      s += color2rgbaStr(item.color) + ' ' + toPrecision(item.offset * 100) + '%';
    });
    return s + ')';
  }
  return '';
}

export default {
  isGradient,
  parseGradient,
  getColorStop,
  getLinear,
  getRadial,
  getConic,
  convert2Css,
  getLinearCoords,
};
