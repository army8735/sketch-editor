import reg from './reg';
import { calUnit, ColorStop, GRADIENT, StyleUnit } from './define';
import { d2r } from '../math/geom';
import { isNil } from '../util/type';
import { color2rgbaInt } from './css';
import { dotProduct } from '../math/vector';
import { clone } from '../util';

function getLinearDeg(v: string) {
  let deg = 180;
  if(v === 'to top') {
    deg = 0;
  }
  else if(v === 'to top right') {
    deg = 45;
  }
  else if(v === 'to right') {
    deg = 90;
  }
  else if(v === 'to bottom right') {
    deg = 135;
  }
  else if(v === 'to bottom') {
  }
  else if(v === 'to bottom left') {
    deg = 225;
  }
  else if(v === 'to left') {
    deg = 270;
  }
  else if(v === 'to top left') {
    deg = 315;
  }
  // 数字角度，没有的话取默认角度
  else {
    let match = /([-+]?[\d.]+)deg/.exec(v);
    if(match) {
      deg = parseFloat(match[1]);
    }
  }
  return deg % 360;
}

function getRadialPosition(data: string) {
  if(/^[-+]?[\d.]/.test(data)) {
    let v = calUnit(data);
    if([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(v.u) > -1) {
      v.u = StyleUnit.PX;
    }
    return v;
  }
  else {
    return {
      v: {
        top: 0,
        left: 0,
        center: 50,
        right: 100,
        bottom: 100,
      }[data] || 50,
      u: StyleUnit.PERCENT,
    };
  }
}

// 获取color-stop区间范围，去除无用值
function getColorStop(v: any, length: number) {
  let list = [];
  let firstColor = v[0][0];
  // 先把已经声明距离的换算成[0,1]以数组形式存入，未声明的原样存入
  for(let i = 0, len = v.length; i < len; i++) {
    let item = v[i];
    // 考虑是否声明了位置
    if(item.length > 1) {
      let p = item[1];
      if(p.u === StyleUnit.PERCENT) {
        list.push([item[0], p.v * 0.01]);
      }
      else {
        list.push([item[0], p.v / length]);
      }
    }
    else {
      list.push([item[0]]);
    }
  }
  if(list.length === 1) {
    list.push(clone(list[0]));
  }
  // 首尾不声明默认为[0, 1]
  if(list[0].length === 1) {
    list[0].push(0);
  }
  if(list.length > 1) {
    let i = list.length - 1;
    if(list[i].length === 1) {
      list[i].push(1);
    }
  }
  // 找到未声明位置的，需区间计算，找到连续的未声明的，前后的区间平分
  let start = list[0][1];
  for(let i = 1, len = list.length; i < len - 1; i++) {
    let item = list[i];
    if(item.length > 1) {
      start = item[1];
    }
    else {
      let j = i + 1;
      let end = list[list.length - 1][1];
      for(; j < len - 1; j++) {
        let item = list[j];
        if(item.length > 1) {
          end = item[1];
          break;
        }
      }
      let num = j - i + 1;
      let per = (end - start) / num;
      for(let k = i; k < j; k++) {
        let item = list[k];
        item.push(start + per * (k + 1 - i));
      }
      i = j;
    }
  }
  // 每个不能小于前面的，canvas/svg不能兼容这种情况，需处理
  for(let i = 1, len = list.length; i < len; i++) {
    let item = list[i];
    let prev = list[i - 1];
    if(item[1] < prev[1]) {
      item[1] = prev[1];
    }
  }
  // 0之前的和1之后的要过滤掉
  for(let i = 0, len = list.length; i < len; i++) {
    let item = list[i];
    if(item[1] > 1) {
      list.splice(i);
      let prev = list[i - 1];
      if(prev && prev[1] < 1) {
        let dr = item[0][0] - prev[0][0];
        let dg = item[0][1] - prev[0][1];
        let db = item[0][2] - prev[0][2];
        let da = item[0][3] - prev[0][3];
        let p = (1 - prev[1]) / (item[1] - prev[1]);
        list.push([
          [
            item[0][0] + dr * p,
            item[0][1] + dg * p,
            item[0][2] + db * p,
            item[0][3] + da * p,
          ],
          1],
        );
      }
      break;
    }
  }
  for(let i = list.length - 1; i >= 0; i--) {
    let item = list[i];
    if(item[1] < 0) {
      list.splice(0, i + 1);
      let next = list[i];
      if(next && next[1] > 0) {
        let dr = next[0][0] - item[0][0];
        let dg = next[0][1] - item[0][1];
        let db = next[0][2] - item[0][2];
        let da = next[0][3] - item[0][3];
        let p = (-item[1]) / (next[1] - item[1]);
        list.unshift([
          [
            item[0][0] + dr * p,
            item[0][1] + dg * p,
            item[0][2] + db * p,
            item[0][3] + da * p,
          ],
          0],
        );
      }
      break;
    }
  }
  // 可能存在超限情况，如在使用px单位超过len或<len时，canvas会报错超过[0,1]区间，需手动换算至区间内
  list.forEach(item => {
    // item[0] = int2rgba(item[0]);
    if(item[1] < 0) {
      item[1] = 0;
    }
    else if(item[1] > 1) {
      item[1] = 1;
    }
  });
  // 都超限时，第一个颜色兜底
  if(!list.length) {
    list.push([firstColor, 0]);
  }
  return list;
}

// 根据角度和圆心获取渐变的4个点坐标
function calLinearCoords(deg: number, length: number, cx: number, cy: number) {
  let x0;
  let y0;
  let x1;
  let y1;
  if(deg >= 270) {
    let r = d2r(360 - deg);
    x0 = cx + Math.sin(r) * length;
    y0 = cy + Math.cos(r) * length;
    x1 = cx - Math.sin(r) * length;
    y1 = cy - Math.cos(r) * length;
  }
  else if(deg >= 180) {
    let r = d2r(deg - 180);
    x0 = cx + Math.sin(r) * length;
    y0 = cy - Math.cos(r) * length;
    x1 = cx - Math.sin(r) * length;
    y1 = cy + Math.cos(r) * length;
  }
  else if(deg >= 90) {
    let r = d2r(180 - deg);
    x0 = cx - Math.sin(r) * length;
    y0 = cy - Math.cos(r) * length;
    x1 = cx + Math.sin(r) * length;
    y1 = cy + Math.cos(r) * length;
  }
  else {
    let r = d2r(deg);
    x0 = cx - Math.sin(r) * length;
    y0 = cy + Math.cos(r) * length;
    x1 = cx + Math.sin(r) * length;
    y1 = cy - Math.cos(r) * length;
  }
  return [x0, y0, x1, y1];
}

export function parseGradient(s: string) {
  const gradient = reg.gradient.exec(s);
  if(gradient) {
    const o: any = {};
    const t = {
      linear: GRADIENT.LINEAR,
      radial: GRADIENT.RADIAL,
      conic: GRADIENT.CONIC,
    }[gradient[1].toLowerCase()];
    let d: number | Array<number>;
    if(t === GRADIENT.LINEAR) {
      const deg = /([-+]?[\d.]+deg)|(to\s+[toprighbml]+)/i.exec(gradient[2]);
      if(deg) {
        d = getLinearDeg(deg[0].toLowerCase());
      }
      // 扩展支持从a点到b点相对坐标，而不是css角度，sketch等ui软件中用此格式
      else {
        const points = /([-+]?[\d.]+)\s+([-+]?[\d.]+)\s+([-+]?[\d.]+)\s+([-+]?[\d.]+)/.exec(gradient[2]);
        if(points) {
          d = [parseFloat(points[1]), parseFloat(points[2]), parseFloat(points[3]), parseFloat(points[4])];
        }
        else {
          d = 180;
        }
      }
    }
    else if(t === GRADIENT.RADIAL) {
      o.s = gradient[2].indexOf('circle') > -1 ? 'circle' : 'ellipse';
      const size = /(closest|farthest)-(side|corner)/i.exec(gradient[2]);
      if(size) {
        o.z = size[0].toLowerCase();
      }
      // 扩展支持从a点到b点相对坐标，而不是size，sketch等ui软件中用此格式
      else {
        const points = /([-+]?[\d.]+)\s+([-+]?[\d.]+)\s+([-+]?[\d.]+)\s+([-+]?[\d.]+)(?:\s+([-+]?[\d.]+))?(?:\s+([-+]?[\d.]+))?(?:\s+([-+]?[\d.]+))?/.exec(gradient[2]);
        if(points) {
          o.z = [parseFloat(points[1]), parseFloat(points[2]), parseFloat(points[3]), parseFloat(points[4])];
          const i5 = !isNil(points[5]), i6 = !isNil(points[6]), i7 = !isNil(points[7]);
          // 重载，567是偏移x/y和ratio，都可省略即不偏移和半径1，只有5是ratio，只有56是x/y
          if(i5 && i6 && i7) {
            o.z.push(parseFloat(points[5]));
            o.z.push(parseFloat(points[6]));
            o.z.push(parseFloat(points[7]));
          }
          else if(i5 && i6) {
            o.z.push(parseFloat(points[5]));
            o.z.push(parseFloat(points[6]));
            o.z.push(1);
          }
          else if(i5) {
            o.z.push(o.z[0]);
            o.z.push(o.z[1]);
            o.z.push(parseFloat(points[5]));
          }
          else {
            o.z.push(o.z[0]);
            o.z.push(o.z[1])
            o.z.push(1);
          }
        }
        else {
          o.z = 'farthest-corner';
        }
      }
      const position = /at\s+((?:[-+]?[\d.]+[pxremvwhina%]*)|(?:left|top|right|bottom|center))(?:\s+((?:[-+]?[\d.]+[pxremvwhina%]*)|(?:left|top|right|bottom|center)))?/i.exec(gradient[2]);
      if(position) {
        const x = getRadialPosition(position[1]);
        const y = position[2] ? getRadialPosition(position[2]) : x;
        o.p = [x, y];
      }
      else {
        o.p = [{ v: 50, u: StyleUnit.PERCENT }, { v: 50, u: StyleUnit.PERCENT }];
      }
    }
    else if(t === GRADIENT.CONIC) {
      const deg = /([-+]?[\d.]+deg)/i.exec(gradient[2]);
      if(deg) {
        d = parseFloat(deg[0]) % 360;
      }
      else {
        d = 0;
      }
      const position = /at\s+((?:[-+]?[\d.]+[pxremvwhina%]*)|(?:left|top|right|bottom|center))(?:\s+((?:[-+]?[\d.]+[pxremvwhina%]*)|(?:left|top|right|bottom|center)))?/i.exec(gradient[2]);
      if(position) {
        const x = getRadialPosition(position[1]);
        const y = position[2] ? getRadialPosition(position[2]) : x;
        o.p = [x, y];
      }
      else {
        o.p = [{ v: 50, u: StyleUnit.PERCENT }, { v: 50, u: StyleUnit.PERCENT }];
      }
    }
    const v = gradient[2].match(/(([-+]?[\d.]+[pxremvwhina%]+)?\s*((#[0-9a-f]{3,8})|(rgba?\s*\(.+?\)))\s*([-+]?[\d.]+[pxremvwhina%]+)?)|(transparent)/ig) || [];
    const stops: Array<ColorStop> = v.map(item => {
      const color = /(?:#[0-9a-f]{3,8})|(?:rgba?\s*\(.+?\))|(?:transparent)/i.exec(item);
      const percent = /[-+]?[\d.]+[pxremvwhina%]+/.exec(item);
      let offset;
      if(percent) {
        const v = calUnit(percent[0]);
        if([StyleUnit.NUMBER, StyleUnit.DEG].indexOf(v.u) > -1) {
          v.u = StyleUnit.PX;
        }
        offset = v;
      }
      return {
        color: { v: color ? color2rgbaInt(color[0]) : [0, 0, 0, 1], u: StyleUnit.RGBA },
        offset,
      };
    });
    return {
      t,
      d: d!,
      stops,
    };
  }
  else {
    throw new Error('Unknown parse gradient');
  }
}

export function getLinear(v: any, d: number | Array<number>, ox: number, oy: number, cx: number, cy: number, w: number, h: number, dx = 0, dy = 0) {
  ox += dx;
  oy += dy;
  cx += dx;
  cy += dy;
  // d为数组是2个坐标点，数字是css标准角度
  let x1, y1, x2, y2, stop;
  if(Array.isArray(d)) {
    x1 = ox + d[0] * w;
    y1 = oy + d[1] * h;
    x2 = ox + d[2] * w;
    y2 = oy + d[3] * h;
    let total = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    stop = getColorStop(v, total);
  }
  else {
    while(d >= 360) {
      d -= 360;
    }
    while(d < 0) {
      d += 360;
    }
    // 根据角度求直线上2点，设置半径为长宽最大值，这样一定在矩形外，看做一个向量A
    let len = Math.max(w, h);
    let coords = calLinearCoords(d, len, cx, cy);
    len *= 2;
    // start和4个顶点的向量在A上的投影长度
    let l1 = dotProduct(ox - coords[0], oy - coords[1], coords[2] - coords[0], coords[3] - coords[1]) / len;
    let l2 = dotProduct(ox + w - coords[0], oy - coords[1], coords[2] - coords[0], coords[3] - coords[1]) / len;
    let l3 = dotProduct(ox + w - coords[0], oy + h - coords[1], coords[2] - coords[0], coords[3] - coords[1]) / len;
    let l4 = dotProduct(ox - coords[0], oy + h - coords[1], coords[2] - coords[0], coords[3] - coords[1]) / len;
    // 最小和最大值为0~100%
    let min = l1, max = l1;
    min = Math.min(min, Math.min(l2, Math.min(l3, l4)));
    max = Math.max(max, Math.max(l2, Math.max(l3, l4)));
    // 求得0和100%的长度和坐标
    let total = max - min;
    let r1 = min / len;
    let dx = coords[2] - coords[0];
    let dy = coords[3] - coords[1];
    x1 = coords[0] + dx * r1;
    y1 = coords[1] + dy * r1;
    x2 = coords[2] - dx * r1;
    y2 = coords[3] - dy * r1;
    stop = getColorStop(v, total);
  }
  return {
    x1,
    y1,
    x2,
    y2,
    stop,
  };
}
