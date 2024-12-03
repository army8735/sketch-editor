import Root from '../node/Root';
import Node from '../node/Node';
import Listener from './Listener';
import picker from './picker';
import { ComputedColorStop, ComputedGradient, ComputedPattern, GRADIENT } from '../style/define';
import { color2rgbaStr, normalizeColor } from '../style/css';
import { r2d } from '../math/geom';
import { toPrecision } from '../math';

export default class Gradient {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  panel: HTMLElement;
  data?: ComputedGradient;
  onChange?: (data: ComputedGradient, fromGradient?: boolean) => void;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    const panel = this.panel = document.createElement('div');
    panel.className = 'gradient';
    panel.style.display = 'none';
    dom.appendChild(panel);

    let isDrag = false;
    let isEllipse = false;
    let ox = 0; // panel
    let oy = 0;
    let idx = 0;
    let w = 1;
    let h = 1;
    let len = 1;
    let ox2 = 0; // line
    let oy2 = 0;
    let target: HTMLElement;
    let list: NodeListOf<HTMLSpanElement>;
    panel.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const data = this.data;
      if (!data) {
        return;
      }
      const { d } = data;
      target = e.target as HTMLElement;
      const classList = target.classList;
      list = panel.querySelectorAll('span');
      const tagName = target.tagName.toUpperCase();
      const o = panel.getBoundingClientRect();
      ox = o.left;
      oy = o.top;
      w = panel.clientWidth;
      h = panel.clientHeight;
      const span = panel.querySelector('span[title="0"]') as HTMLElement;
      const o2 = span.getBoundingClientRect();
      ox2 = o2.left + span.clientWidth * 0.5;
      oy2 = o2.top + span.clientHeight * 0.5;
      // conic的环点击需要特殊判断在圆边上，用dom完成了
      if (classList.contains('c2')) {
        const { offsetX, offsetY } = e;
        const c = Math.max(w, h) * 0.5;
        let offset = getConicOffset(c, c, offsetX, offsetY);
        const stops = data.stops;
        // 和line不同可能点到首尾，因为是个环首尾会变或不存在
        let prev: ComputedColorStop | undefined, next: ComputedColorStop | undefined;
        for (let i = 0, len = stops.length; i < len; i++) {
          const item = stops[i];
          if (offset < item.offset) {
            next = item;
            idx = i;
            break;
          }
          prev = item;
        }
        // 点在尾首间会造成特殊情况
        if (!prev || !next) {
          prev = prev || stops[0];
          next = next || stops[stops.length - 1];
          const p = Math.abs(offset - prev.offset) / Math.abs(prev.offset - next.offset);
          const o = {
            color: genNewStop(next, prev, p),
            offset,
          };
          if (offset < prev.offset) {
            stops.unshift(o);
            idx = 0;
          }
          else {
            stops.push(o);
            idx = stops.length - 1;
          }
        }
        else {
          const p = (offset - prev.offset) / (next.offset - prev.offset);
          stops.splice(idx, 0, {
            color: genNewStop(prev, next, p),
            offset,
          });
          panel.innerHTML += '<span></span>';
          panel.querySelectorAll('span').forEach((item, i) => {
            item.title = i.toString();
            if (i === idx) {
              target = item;
            }
          });
        }
        this.updateConicStops(data);
        picker.addLineItem(idx, offset);
        this.setCur(idx, true);
        this.onChange!(data, true);
        isDrag = true;
      }
      // radial的椭圆控制
      else if (classList.contains('e')) {
        len = (panel.querySelector('.l') as HTMLElement).clientWidth;
        isEllipse = true;
      }
      // stops
      else if (tagName === 'SPAN') {
        idx = parseInt(target.title);
        this.setCur(idx, true);
        isDrag = true;
      }
      // linear和radial才有的line渐变条
      else if (tagName === 'DIV') {
        const { stops } = data;
        const len2 = Math.sqrt(Math.pow(e.pageX - ox2, 2) + Math.pow(e.pageY - oy2, 2));
        const offset = len2 / target.clientWidth;
        // 一定不会是首尾，因为点不到，首尾决定了长度
        for (let i = 0, len = stops.length; i < len; i++) {
          const item = stops[i];
          if (offset < item.offset) {
            const prev = stops[i - 1];
            const p = (offset - prev.offset) / (item.offset - prev.offset);
            stops.splice(i, 0, {
              color: genNewStop(prev, item, p),
              offset,
            });
            idx = i;
            break;
          }
        }
        panel.innerHTML += '<span></span>';
        panel.querySelectorAll('span').forEach((item, i) => {
          item.title = i.toString();
          if (i === idx) {
            target = item;
          }
        });
        this.updateLinearStops(data);
        picker.addLineItem(idx, offset);
        this.setCur(idx, true);
        this.onChange!(data, true);
        isDrag = true;
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (isEllipse) {
        const data = this.data;
        if (data) {
          const d = data.d;
          const len2 = Math.sqrt(Math.pow(e.pageX - ox2, 2) + Math.pow(e.pageY - oy2, 2));
          d[4] = len2 / len;
          this.updateRadialD(data);
          this.updateRadialStops(data);
          this.onChange!(data, true);
        }
      }
      else if (isDrag) {
        const x = (e.pageX - ox) / w;
        const y = (e.pageY - oy) / h;
        const data = this.data;
        if (data) {
          const { d, stops } = data;
          // 首尾影响渐变起始点，即长度，然后其它点都随之变化，conic不影响不进这里
          if ((idx === 0 || idx === stops.length - 1) && data.t !== GRADIENT.CONIC) {
            if (idx === 0) {
              // linear改变两端点之一不影响另外一个，但radial和conic是半径统一影响
              if ([GRADIENT.RADIAL, GRADIENT.CONIC].includes(data.t)) {
                d[2] += x - d[0];
                d[3] += y - d[1];
              }
              d[0] = x;
              d[1] = y;
            }
            else {
              d[2] = x;
              d[3] = y;
            }
            if (data.t === GRADIENT.LINEAR) {
              this.updateLinearD(data);
            }
            else if (data.t === GRADIENT.RADIAL) {
              this.updateRadialD(data);
            }
            // len = Math.sqrt(Math.pow(d[2] - d[0], 2) + Math.pow(d[3] - d[1], 2));
            stops.forEach((item, i) => {
              const left = (d[0] + (d[2] - d[0]) * item.offset) * 100 + '%';
              const top = (d[1] + (d[3] - d[1]) * item.offset) * 100 + '%';
              list[i].style.left = left;
              list[i].style.top = top;
            });
            this.onChange!(data, true);
          }
          // 中间的不调整长度并限制范围
          else {
            if (data.t === GRADIENT.CONIC) {
              const offset = getConicOffset(ox + w * 0.5, oy + h * 0.5, e.pageX, e.pageY);
              const r = offset * 2 * Math.PI;
              let left = 1;
              let top = 0.5;
              const c2 = panel.querySelector('.c2') as HTMLElement;
              if (offset === 0.25) {
                left = 0;
                top = 1;
              }
              else if (offset === 0.5) {
                left = 0;
                top = 0.5;
              }
              else if (offset === 0.75) {
                left = 0.5;
                top = 0;
              }
              // 自动带符号了无需考虑象限
              else {
                const ax = c2.clientWidth / panel.clientWidth;
                const ay = c2.clientHeight / panel.clientHeight;
                left = 0.5 + Math.cos(r) * 0.5 * ax;
                top = 0.5 + Math.sin(r) * 0.5 * ay;
              }
              stops[idx].offset = offset;
              target.style.left = left * 100 + '%';
              target.style.top = top * 100 + '%';
              picker.updateLinePos(idx, offset, data);
            }
            else {
              /**
               * 特殊的交互，在首尾两点之间移动，采用距离和首点的百分比作为offset；
               * 在首尾范围外时（dx/dy为负），运算过程的d要*-1来计算，同时要考虑方向，
               * 即dx/dy的负是指和渐变矢量方向相反。
               */
              const dx = x - d[0];
              const dy = y - d[1];
              const sx = (dx < 0 ? -1 : 1) * (d[2] < d[0] ? -1 : 1);
              const sy = (dy < 0 ? -1 : 1) * (d[3] < d[1] ? -1 : 1);
              const sum = Math.pow(dx, 2) * sx + Math.pow(dy, 2) * sy;
              let offset = Math.sqrt(Math.max(0, sum)) / Math.sqrt(Math.pow(d[2] - d[0], 2) + Math.pow(d[3] - d[1], 2));
              offset = Math.max(0, Math.min(1, offset));
              stops[idx].offset = offset;
              const left = (d[0] + (d[2] - d[0]) * offset) * 100 + '%';
              const top = (d[1] + (d[3] - d[1]) * offset) * 100 + '%';
              target.style.left = left;
              target.style.top = top;
              picker.updateLinePos(idx, offset, data);
            }
            this.onChange!(data, true);
          }
        }
      }
    });
    document.addEventListener('mouseup', () => {
      if (isEllipse) {
        isEllipse = false;
      }
      else if (isDrag) {
        // 为防止拖拽乱序重新设置
        if (this.data) {
          (this.data as ComputedGradient).stops.sort((a, b) => a.offset - b.offset);
          panel.querySelectorAll('span').forEach((item, i) => {
            item.title = i.toString();
          })
        }
        isDrag = false;
      }
    });
    // 阻止冒泡，listener侦听document点击会取消选择
    panel.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  show(node: Node, data: number[] | ComputedGradient | ComputedPattern, onChange: (data: ComputedGradient) => void) {
    if (Array.isArray(data)) {
      return;
    }
    if ((data as ComputedPattern).url) {
      return;
    }
    this.onChange = onChange;
    data = data as ComputedGradient;
    this.data = data;
    this.updateSize(node);
    if (data.t === GRADIENT.LINEAR) {
      this.genLinear(data);
    }
    else if (data.t === GRADIENT.RADIAL) {
      this.genRadial(data);
    }
    else if (data.t === GRADIENT.CONIC) {
      this.genConic(data);
    }
  }

  update(node: Node, data: number[] | ComputedGradient | ComputedPattern) {
    if (Array.isArray(data)) {
      return;
    }
    if ((data as ComputedPattern).url) {
      return;
    }
    this.updateSize(node);
    data = data as ComputedGradient;
    // 新增一个渐变stop的时候会长度不一致，需重新生成，一般都是更新
    if (data.t === GRADIENT.LINEAR) {
      if (data.stops.length !== this.data?.stops.length) {
        this.genLinear(data);
      }
      else {
        this.updateLinearStops(data);
      }
    }
    else if (data.t === GRADIENT.RADIAL) {
      if (data.stops.length !== this.data?.stops.length) {
        this.genRadial(data);
      }
      else {
        this.updateLinearStops(data);
      }
    }
    else if (data.t === GRADIENT.CONIC) {
      if (data.stops.length !== this.data?.stops.length) {
        this.genConic(data);
      }
      else {
        this.updateConicStops(data);
      }
    }
  }

  updateSize(node: Node) {
    const panel = this.panel;
    const res = this.listener.select.calRect(node);
    panel.style.left = res.left + 'px';
    panel.style.top = res.top + 'px';
    panel.style.width = res.width + 'px';
    panel.style.height = res.height + 'px';
    panel.style.transform = res.transform;
    panel.style.display = 'block';
  }

  genLinear(data: ComputedGradient) {
    const panel = this.panel;
    const { stops } = data;
    panel.innerHTML = '';
    let html = '<div class="l"></div>';
    stops.forEach((item, i) => {
      html += `<span title="${i}"></span>`;
    });
    panel.innerHTML = html;
    this.updateLinearD(data);
    this.updateLinearStops(data);
    this.setCur(0); // 初始0
  }

  updateLinearD(data: ComputedGradient) {
    const panel = this.panel;
    const div = panel.querySelector('.l') as HTMLElement;
    const { clientWidth, clientHeight } = panel;
    const { d } = data;
    const left = d[0] * 100 + '%';
    const top = d[1] * 100 + '%';
    const len = Math.sqrt(Math.pow((d[2] - d[0]) * clientWidth, 2) + Math.pow((d[3] - d[1]) * clientHeight, 2)) + 'px';
    div.style.left = left;
    div.style.top = top;
    div.style.width = len;
    if (d[0] === d[2]) {
      if (d[3] >= d[1]) {
        div.style.transform = 'translateY(-50%) rotateZ(90deg)';
      }
      else {
        div.style.transform = 'translateY(-50%) rotateZ(-90deg)';
      }
    }
    else if (d[1] === d[3]) {
      if (d[2] >= d[0]) {
        div.style.transform = 'translateY(-50%)';
      }
      else {
        div.style.transform = 'translateY(-50%) rotateZ(180deg)';
      }
    }
    else {
      const dx = d[2] - d[0];
      const dy = d[3] - d[1];
      const r = Math.atan(dy * clientHeight / dx / clientWidth);
      const deg = toPrecision(r2d(r));
      if (dx >= 0) {
        div.style.transform = `translateY(-50%) rotateZ(${deg}deg)`;
      }
      else {
        div.style.transform = `translateY(-50%) rotateZ(${deg + 180}deg)`;
      }
    }
  }

  updateLinearStops(data: ComputedGradient) {
    const panel = this.panel;
    const spans = panel.querySelectorAll('span');
    const { d, stops } = data;
    // stops的范围不等于dom的宽高范围[0, 1]，因此offset不能简单算作定位的百分比，需*个系数
    const xl = d[2] - d[0];
    const yl = d[3] - d[1];
    stops.forEach((item, i) => {
      const { color, offset } = item;
      const left = d[0] * 100 + offset * xl * 100 + '%';
      const top = d[1] * 100 + offset * yl * 100 + '%';
      const bgc = color2rgbaStr(color);
      const span = spans[i];
      if (span) {
        span.style.left = left;
        span.style.top = top;
        span.style.background = bgc;
      }
    });
  }

  genRadial(data: ComputedGradient) {
    const panel = this.panel;
    const { stops } = data;
    panel.innerHTML = '';
    let html = '<div class="l"></div><div class="c"></div><div class="e"></div>';
    stops.forEach((item, i) => {
      html += `<span title="${i}"></span>`;
    });
    panel.innerHTML = html;
    this.updateRadialD(data);
    // 复用linear的stops，自己则是控制椭圆的逻辑
    this.updateLinearStops(data);
    this.updateRadialStops(data);
    this.setCur(0); // 初始0
  }

  updateRadialD(data: ComputedGradient) {
    const panel = this.panel;
    const line = panel.querySelector('.l') as HTMLElement;
    const circle = panel.querySelector('.c') as HTMLElement;
    const { clientWidth, clientHeight } = panel;
    const { d } = data;
    const left = d[0] * 100 + '%';
    const top = d[1] * 100 + '%';
    const w = d[2] - d[0];
    const h = d[3] - d[1];
    const len = Math.sqrt(Math.pow(w * clientWidth, 2) + Math.pow(h * clientHeight, 2));
    line.style.left = left;
    line.style.top = top;
    line.style.width = len + 'px';
    circle.style.left = left;
    circle.style.top = top;
    circle.style.width = circle.style.height = len * 2 + 'px';
    // 除了特殊的垂直x/y轴，其余求角度确定坐标
    if (d[0] === d[2]) {
      if (d[3] >= d[1]) {
        line.style.transform = `translateY(-50%) rotateZ(90deg)`;
        circle.style.transform = `translate(-50%, -50%) rotateZ(90deg) scaleY(${d[4] || 1})`;
      }
      else {
        line.style.transform = `translateY(-50%) rotateZ(-90deg)`;
        circle.style.transform = `translate(-50%, -50%) rotateZ(-90deg) scaleY(${d[4] || 1})`;
      }
    }
    else if (d[1] === d[3]) {
      if (d[2] >= d[0]) {
        line.style.transform = `translateY(-50%) scaleY(${d[4] || 1}`;
        circle.style.transform = `translate(-50%, -50%) scaleY(${d[4] || 1})`;
      }
      else {
        line.style.transform = `translateY(-50%) rotateZ(180deg)`;
        circle.style.transform = `translate(-50%, -50%) rotateZ(180deg) scaleY(${d[4] || 1})`;
      }
    }
    else {
      const r = Math.atan(h * clientHeight / w / clientWidth);
      const deg = toPrecision(r2d(r)) + 'deg';
      line.style.transform = `translateY(-50%) rotateZ(${deg})`;
      circle.style.transform = `translate(-50%, -50%) rotateZ(${deg}) scaleY(${d[4] || 1})`;
    }
  }

  updateRadialStops(data: ComputedGradient) {
    // 额外的椭圆控制
    const panel = this.panel;
    const { clientWidth, clientHeight } = panel;
    // const l = panel.querySelector('.l') as HTMLElement;
    const e = panel.querySelector('.e') as HTMLElement;
    const { d } = data;
    const w = d[2] - d[0];
    const h = d[3] - d[1];
    const len = Math.sqrt(Math.pow(w * clientWidth, 2) + Math.pow(h * clientHeight, 2));
    const ax = len / clientWidth * (d[4] || 1);
    const ay = len / clientHeight * (d[4] || 1);
    // console.log(d[4])
    // 类似外圈的位置，但要顺时针转90deg
    if (d[0] === d[2]) {
      e.style.left = d[0] * 100 + '%';
      if (d[3] >= d[1]) {
        e.style.top = (d[1] + 0.5) * 100 + '%';
      }
      else {
        e.style.top = (d[1] - 0.5) * 100 + '%';
      }
    }
    else if (d[1] === d[3]) {
      e.style.top = d[1] * 100 + '%';
      if (d[2] >= d[0]) {
        e.style.left = (d[0] + 0.5) * 100 + '%';
      }
      else {
        e.style.left = (d[0] - 0.5) * 100 + '%';
      }
    }
    else {
      const r = Math.atan(h * clientHeight / w / clientWidth) + Math.PI * 0.5;
      const sin = Math.sin(r);
      const cos = Math.cos(r);
      e.style.left = (cos * ax + d[0]) * 100 + '%';
      e.style.top = (sin * ay + d[1]) * 100 + '%';
    }
  }

  genConic(data: ComputedGradient) {
    const panel = this.panel;
    const { stops } = data;
    panel.innerHTML = '';
    let html = '<div class="c2"><b></b></div>';
    stops.forEach((item, i) => {
      html += `<span title="${i}"></span>`;
    });
    panel.innerHTML = html;
    this.updateConicD(data);
    this.updateConicStops(data);
    this.setCur(0); // 初始0
  }

  updateConicD(data: ComputedGradient) {
    const panel = this.panel;
    const circle = panel.querySelector('.c2') as HTMLElement;
    const { clientWidth, clientHeight } = panel;
    const { d } = data;
    // conic可能默认没有就是中心
    const left = (d[0] ?? 0.5) * 100 + '%';
    const top = (d[1] ?? 0.5) * 100 + '%';
    circle.style.left = left;
    circle.style.top = top;
    circle.style.width = circle.style.height = Math.max(clientWidth, clientHeight) + 'px';
  }

  updateConicStops(data: ComputedGradient) {
    const panel = this.panel;
    const { clientWidth, clientHeight } = panel;
    const R = Math.max(clientWidth, clientHeight) * 0.5;
    const spans = panel.querySelectorAll('span');
    const { d, stops } = data;
    const cx = (d[0] ?? 0.5) * 100;
    const cy = (d[1] ?? 0.5) * 100;
    stops.forEach((item, i) => {
      const { color, offset } = item;
      const bgc = color2rgbaStr(color);
      const span = spans[i];
      if (span) {
        span.style.background = bgc;
        if (offset === 0 || offset === 1) {
          span.style.left = cx + 50 + '%';
          span.style.top = cy + '%';
        }
        else if (offset === 0.25) {
          span.style.left = cx + '%';
          span.style.top = cy + 50 + '%';
        }
        else if (offset === 0.5) {
          span.style.left = cx - 50 + '%';
          span.style.top = cy + '%';
        }
        else if (offset === 0.75) {
          span.style.left = cx + '%';
          span.style.top = cy - 50 + '%';
        }
        else {
          const r = offset * Math.PI * 2;
          const sin = Math.sin(r);
          const cos = Math.cos(r);
          const x = R * cos;
          const y = R * sin;
          span.style.left = cx + x * 100 / clientWidth + '%';
          span.style.top = cy + y * 100 / clientHeight + '%';
        }
      }
    });
  }

  setCur(i: number, notify = false) {
    const panel = this.panel;
    panel.querySelector('.cur')?.classList.remove('cur');
    panel.querySelector(`span[title="${i}"]`)?.classList.add('cur');
    if (notify) {
      picker.setLineCur(i);
    }
  }

  hide() {
    this.panel.style.display = 'none';
    this.data = undefined;
  }
}

function getConicOffset(cx: number, cy: number, x: number, y: number) {
  let offset = 0;
  // 4个象限区别
  if (x === cx) {
    if (y >= cy) {
      offset = 0.75;
    }
    else {
      offset = 0.25;
    }
  }
  else if (x > cx) {
    if (y >= cy) {
      const tan = (y - cy) / (x - cx);
      const r = Math.atan(tan);
      offset = r * 0.5 / Math.PI;
    }
    else {
      const tan = (cy - y) / (x - cx);
      const r = Math.atan(tan);
      offset = 1 - r * 0.5 / Math.PI;
    }
  }
  else {
    if (y >= cy) {
      const tan = (y - cy) / (cx - x);
      const r = Math.atan(tan);
      offset = 0.5 - r * 0.5 / Math.PI;
    }
    else {
      const tan = (cy - y) / (cx - x);
      const r = Math.atan(tan);
      offset = 0.5 + r * 0.5 / Math.PI;
    }
  }
  return offset;
}

function genNewStop(prev: ComputedColorStop, next: ComputedColorStop, p: number) {
  return normalizeColor([
    prev.color[0] + (next.color[0] - prev.color[0]) * p,
    prev.color[1] + (next.color[1] - prev.color[1]) * p,
    prev.color[2] + (next.color[2] - prev.color[2]) * p,
    (prev.color[3] ?? 1) + ((next.color[3] ?? 1) - (prev.color[3] ?? 1)) * p,
  ]);
}
