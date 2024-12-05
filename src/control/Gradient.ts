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
  node?: Node;
  data?: ComputedGradient;
  onChange?: (data: ComputedGradient, fromGradient?: boolean) => void;
  keep?: boolean; // 保持窗口外部点击时不关闭

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
    let w2 = 1; // d
    let h2 = 1;
    let target: HTMLElement;
    let list: NodeListOf<HTMLSpanElement>;
    panel.addEventListener('mousedown', (e) => {
      const data = this.data;
      if (!data) {
        return;
      }
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
      ox2 = o2.left + o2.width * 0.5;
      oy2 = o2.top + o2.height * 0.5;
      w2 = data.d[2] - data.d[0];
      h2 = data.d[3] - data.d[1];
      const { scaleX, scaleY } = this.node!.computedStyle;
      // conic的环点击需要特殊判断在圆边上，用dom完成了
      if (classList.contains('c2')) {
        const { offsetX, offsetY } = e;
        const c = Math.max(w, h) * 0.5;
        let offset = getConicOffset(c, c, offsetX, offsetY, scaleX, scaleY);
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
          const { scaleX, scaleY } = this.node!.computedStyle;
          const l = scaleX === -1 ? (1 - d[0]) : d[0];
          const t = scaleY === -1 ? (1 - d[1]) : d[1];
          // 首尾影响渐变起始点，即长度，然后其它点都随之变化，conic不影响不进这里
          if ((idx === 0 || idx === stops.length - 1) && data.t !== GRADIENT.CONIC) {
            if (idx === 0) {
              d[0] = scaleX === -1 ? (1 - x) : x;
              d[1] = scaleY === -1 ? (1 - y) : y;
              // linear改变两端点之一不影响另外一个，但radial是半径统一影响
              if ([GRADIENT.RADIAL].includes(data.t)) {
                d[2] = d[0] + w2;
                d[3] = d[1] + h2;
              }
            }
            else {
              d[2] = scaleX === -1 ? (1 - x) : x;
              d[3] = scaleY === -1 ? (1 - y) : y;
            }
            if (data.t === GRADIENT.LINEAR) {
              this.updateLinearD(data);
              this.updateLinearStops(data);
            }
            else if (data.t === GRADIENT.RADIAL) {
              this.updateLinearD(data);
              this.updateRadialD(data);
              this.updateLinearStops(data);
              this.updateRadialStops(data);
            }
            this.onChange!(data, true);
          }
          // 中间的和conic类型不调整长度并限制范围
          else {
            if (data.t === GRADIENT.CONIC) {
              const offset = getConicOffset(ox + w * 0.5, oy + h * 0.5, e.pageX, e.pageY, scaleX, scaleY);
              stops[idx].offset = offset;
              this.updateConicStops(data);
              picker.updateLinePos(idx, offset, data);
            }
            else {
              /**
               * 特殊的交互，在首尾两点之间移动，采用距离和首点的百分比作为offset；
               * 在首尾范围外时（dx/dy为负），运算过程的d要*-1来计算，同时要考虑方向，
               * 即dx/dy的负是指和渐变矢量方向相反。
               */
              const dx = x - l;
              const dy = y - t;
              const sx = (dx < 0 ? -1 : 1) * (d[2] < d[0] ? -1 : 1) * scaleX;
              const sy = (dy < 0 ? -1 : 1) * (d[3] < d[1] ? -1 : 1) * scaleY;
              const sum = Math.pow(dx, 2) * sx + Math.pow(dy, 2) * sy;
              let offset = Math.sqrt(Math.max(0, sum)) / Math.sqrt(Math.pow(d[2] - d[0], 2) + Math.pow(d[3] - d[1], 2));
              offset = Math.max(0, Math.min(1, offset));
              stops[idx].offset = offset;
              const left = (l + (d[2] - d[0]) * offset * scaleX) * 100 + '%';
              const top = (t + (d[3] - d[1]) * offset * scaleY) * 100 + '%';
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
    // 自身点击设置keep，阻止document全局侦听关闭
    document.addEventListener('click', () => {
      if (this.keep) {
        this.keep = false;
        return;
      }
      // 直接关，state变化逻辑listener内部关心
      this.hide();
    });
    panel.addEventListener('click', () => {
      this.keep = true;
      picker.keep = true;
    });
  }

  show(node: Node, data: number[] | ComputedGradient | ComputedPattern, onChange: (data: ComputedGradient) => void) {
    if (Array.isArray(data)) {
      return;
    }
    if ((data as ComputedPattern).url) {
      return;
    }
    this.node = node;
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
    const { scaleX, scaleY } = this.node!.computedStyle;
    const { d } = data;
    const w = d[2] - d[0];
    const h = d[3] - d[1];
    const left = (scaleX === - 1 ? (1 - d[0]) : d[0]) * 100 + '%';
    const top = (scaleY === - 1 ? (1 - d[1]) : d[1]) * 100 + '%';
    const len = Math.sqrt(Math.pow(w * clientWidth, 2) + Math.pow(h * clientHeight, 2)) + 'px';
    div.style.left = left;
    div.style.top = top;
    div.style.width = len;
    if (d[0] === d[2]) {
      if (d[3] >= d[1]) {
        div.style.transform = `translateY(-50%) rotateZ(90deg) scale(${scaleX}, ${scaleY})`;
      }
      else {
        div.style.transform = `translateY(-50%) rotateZ(-90deg) scale(${scaleX}, ${scaleY})`;
      }
    }
    else if (d[1] === d[3]) {
      if (d[2] >= d[0]) {
        div.style.transform = `translateY(-50%) scale(${scaleX}, ${scaleY})`;
      }
      else {
        div.style.transform = `translateY(-50%) rotateZ(180deg) scale(${scaleX}, ${scaleY})`;
      }
    }
    else {
      const r = Math.atan(h * clientHeight / w / clientWidth);
      const deg = toPrecision(r2d(r));
      if (w >= 0) {
        div.style.transform = `translateY(-50%) rotateZ(${deg}deg) scale(${scaleX}, ${scaleY})`;
      }
      else {
        div.style.transform = `translateY(-50%) rotateZ(${deg + 180}deg) scale(${scaleX}, ${scaleY})`;
      }
    }
  }

  updateLinearStops(data: ComputedGradient) {
    const panel = this.panel;
    const spans = panel.querySelectorAll('span');
    const { scaleX, scaleY } = this.node!.computedStyle;
    const { d, stops } = data;
    // stops的范围不等于dom的宽高范围[0, 1]，因此offset不能简单算作定位的百分比，需*个系数
    const xl = d[2] - d[0];
    const yl = d[3] - d[1];
    stops.forEach((item, i) => {
      const { color, offset } = item;
      const left = (scaleX === - 1 ? (1 - d[0]) : d[0]) * 100 + offset * xl * 100 * scaleX + '%';
      const top = (scaleY === - 1 ? (1 - d[1]) : d[1]) * 100 + offset * yl * 100 * scaleY + '%';
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
    // 复用linear的d，自己则是控制椭圆的逻辑
    this.updateLinearD(data);
    this.updateRadialD(data);
    // 复用linear的stops，自己则是控制椭圆的逻辑
    this.updateLinearStops(data);
    this.updateRadialStops(data);
    this.setCur(0); // 初始0
  }

  updateRadialD(data: ComputedGradient) {
    const panel = this.panel;
    const circle = panel.querySelector('.c') as HTMLElement;
    const { clientWidth, clientHeight } = panel;
    const { scaleX, scaleY } = this.node!.computedStyle;
    const { d } = data;
    const left = (scaleX === - 1 ? (1 - d[0]) : d[0]) * 100 + '%';
    const top = (scaleY === - 1 ? (1 - d[1]) : d[1]) * 100 + '%';
    const w = d[2] - d[0];
    const h = d[3] - d[1];
    const len = Math.sqrt(Math.pow(w * clientWidth, 2) + Math.pow(h * clientHeight, 2));
    circle.style.left = left;
    circle.style.top = top;
    circle.style.width = circle.style.height = len * 2 + 'px';
    // 除了特殊的垂直x/y轴，其余求角度确定坐标
    if (d[0] === d[2]) {
      if (d[3] >= d[1]) {
        circle.style.transform = `translate(-50%, -50%) rotateZ(90deg) scale(${scaleX}, ${scaleY * (d[4] || 1)})`;
      }
      else {
        circle.style.transform = `translate(-50%, -50%) rotateZ(-90deg) scale(${scaleX}, ${scaleY * (d[4] || 1)})`;
      }
    }
    else if (d[1] === d[3]) {
      if (d[2] >= d[0]) {
        circle.style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY * (d[4] || 1)})`;
      }
      else {
        circle.style.transform = `translate(-50%, -50%) rotateZ(180deg) scale(${scaleX}, ${scaleY * (d[4] || 1)})`;
      }
    }
    else {
      const r = Math.atan(h * clientHeight / w / clientWidth);
      const deg = toPrecision(r2d(r));
      if (w >= 0) {
        circle.style.transform = `translate(-50%, -50%) rotateZ(${deg}deg) scale(${scaleX}, ${scaleY * (d[4] || 1)})`;
      }
      else {
        circle.style.transform = `translate(-50%, -50%) rotateZ(${deg + 180}deg) scale(${scaleX}, ${scaleY * (d[4] || 1)})`;
      }
    }
  }

  updateRadialStops(data: ComputedGradient) {
    // 额外的椭圆控制
    const panel = this.panel;
    const { clientWidth, clientHeight } = panel;
    const { scaleX, scaleY } = this.node!.computedStyle;
    const e = panel.querySelector('.e') as HTMLElement;
    const { d } = data;
    const left = scaleX === -1 ? (1 - d[0]) : d[0];
    const top = scaleY === -1 ? (1 - d[1]) : d[1];
    const w = d[2] - d[0];
    const h = d[3] - d[1];
    const len = Math.sqrt(Math.pow(w * clientWidth, 2) + Math.pow(h * clientHeight, 2));
    const ax = len / clientWidth * (d[4] || 1);
    const ay = len / clientHeight * (d[4] || 1);
    // 类似外圈的位置，但要顺时针转90deg
    if (d[0] === d[2]) {
      e.style.top = top * 100 + '%';
      if (d[3] >= d[1]) {
        e.style.left = (scaleX === -1 ? (d[0] + ax) : (d[0] - ax)) * 100 + '%';
      }
      else {
        e.style.left = (scaleX === -1 ? (d[0] - ax) : (d[0] + ax)) * 100 + '%';
      }
    }
    else if (d[1] === d[3]) {
      e.style.left = left * 100 + '%';
      if (d[2] >= d[0]) {
        e.style.top = (scaleY === -1 ? (d[1] - ay) : (d[1] + ay)) * 100 + '%';
      }
      else {
        e.style.top = (scaleY === -1 ? (d[1] + ay) : (d[1] - ay)) * 100 + '%';
      }
    }
    else {
      const r = Math.atan(h * clientHeight / w / clientWidth) + Math.PI * 0.5;
      const sin = Math.sin(r);
      const cos = Math.cos(r);
      if (w >= 0) {
        e.style.left = (cos * ax * scaleX + left) * 100 + '%';
        e.style.top = (sin * ay * scaleY + top) * 100 + '%';
      }
      else {
        e.style.left = (-cos * ax * scaleX + left) * 100 + '%';
        e.style.top = (-sin * ay * scaleY + top) * 100 + '%';
      }
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
    const { scaleX, scaleY } = this.node!.computedStyle;
    const { d } = data;
    // conic可能默认没有就是中心
    const left = (scaleX === - 1 ? (1 - (d[0] ?? 0.5)) : (d[0] ?? 0.5)) * 100 + '%';
    const top = (scaleY === - 1 ? (1 - (d[1] ?? 0.5)) : (d[1]) ?? 0.5) * 100 + '%';
    circle.style.left = left;
    circle.style.top = top;
    circle.style.width = circle.style.height = Math.max(clientWidth, clientHeight) + 'px';
  }

  updateConicStops(data: ComputedGradient) {
    const panel = this.panel;
    const { clientWidth, clientHeight } = panel;
    const { scaleX, scaleY } = this.node!.computedStyle;
    const R = Math.max(clientWidth, clientHeight) * 0.5;
    const spans = panel.querySelectorAll('span');
    const c2 = panel.querySelector('.c2') as HTMLElement;
    const ax = c2.clientWidth / clientWidth;
    const ay = c2.clientHeight / clientHeight;
    const { d, stops } = data;
    const cx = (scaleX === - 1 ? (1 - (d[0] ?? 0.5)) : (d[0] ?? 0.5)) * 100;
    const cy = (scaleY === - 1 ? (1 - (d[1] ?? 0.5)) : (d[1]) ?? 0.5) * 100;
    // 当stop重复一个%时，需依次向外排列，记录%下有多少个重复的，其中offset的0和1共用
    const hash: Record<string, number> = {};
    const size = 12;
    stops.forEach((item, i) => {
      const { color, offset } = item;
      const bgc = color2rgbaStr(color);
      const span = spans[i];
      if (span) {
        span.style.background = bgc;
        const offsetStr = toPrecision(offset || 1); // 精度合并
        const count = hash[offsetStr] || 0;
        // 先清空，防止上次遗留，新增后干扰
        span.style.transform = '';
        if (offset === 0 || offset === 1) {
          span.style.left = (R * 100 / c2.clientWidth) * ax * scaleX + cx + '%';
          span.style.top = cy + '%';
          if (count) {
            span.style.transform = `translate(-50%, -50%) translateX(${count * size * scaleX}px)`;
          }
        }
        else if (offset === 0.25) {
          span.style.left = cx + '%';
          span.style.top = (R * 100 / c2.clientHeight) * ay * scaleY + cy + '%';
          if (count) {
            span.style.transform = `translate(-50%, -50%) translateY(${count * size * scaleY}px)`;
          }
        }
        else if (offset === 0.5) {
          span.style.left = (-R * 100 / c2.clientWidth) * ax * scaleX + cx + '%';
          span.style.top = cy + '%';
          if (count) {
            span.style.transform = `translate(-50%, -50%) translateX(${-count * size * scaleX}px)`;
          }
        }
        else if (offset === 0.75) {
          span.style.left = cx + '%';
          span.style.top = (-R * 100 / c2.clientHeight) * ay * scaleY + cy + '%';
          if (count) {
            span.style.transform = `translate(-50%, -50%) translateY(${-count * size * scaleY}px)`;
          }
        }
        else {
          const r = offset * Math.PI * 2;
          const sin = Math.sin(r);
          const cos = Math.cos(r);
          const x = R * cos;
          const y = R * sin;
          span.style.left = cx + x * 100 * scaleX / clientWidth + '%';
          span.style.top = cy + y * 100 * scaleY / clientHeight + '%';
          if (count) {
            span.style.transform = `translate(-50%, -50%) translate(${count * size * cos}px, ${count * size * sin}px)`;
          }
        }
        hash[offsetStr] = count + 1;
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
    this.node = undefined;
  }

  updatePos() {
    if (this.node) {
      this.updateSize(this.node);
    }
  }
}

function getConicOffset(cx: number, cy: number, x: number, y: number, scaleX = 1, scaleY = 1) {
  let offset = 0;
  // 4个象限区别
  if (x === cx) {
    if (y >= cy) {
      offset = scaleY === -1 ? 0.75 : 0.25;
    }
    else {
      offset = scaleY === -1 ? 0.25 : 0.75;
    }
  }
  else if (y === cy) {
    if (x >= cx) {
      offset = scaleX === -1 ? 0.5 : 0;
    }
    else {
      offset = scaleX === -1 ? 0 : 0.5;
    }
  }
  else if (x > cx) {
    if (y >= cy) {
      const tan = (y - cy) / (x - cx);
      const r = Math.atan(tan);
      offset = r * 0.5 / Math.PI;
      if (scaleX === -1 && scaleY === -1) {
        offset += 0.5;
      }
      else if (scaleX === -1) {
        offset = 0.5 - offset;
      }
      else if (scaleY) {
        offset = 1 - offset;
      }
    }
    else {
      const tan = (cy - y) / (x - cx);
      const r = Math.atan(tan);
      offset = 1 - r * 0.5 / Math.PI;
      if (scaleX === -1 && scaleY === -1) {
        offset -= 0.5;
      }
      else if (scaleX === -1) {
        offset = 1.5 - offset;
      }
      else if (scaleY) {
        offset = 1 - offset;
      }
    }
  }
  else {
    if (y >= cy) {
      const tan = (y - cy) / (cx - x);
      const r = Math.atan(tan);
      offset = 0.5 - r * 0.5 / Math.PI;
      if (scaleX === -1 && scaleY === -1) {
        offset += 0.5;
      }
      else if (scaleX === -1) {
        offset = 0.5 - offset;
      }
      else if (scaleY) {
        offset = 1 - offset;
      }
    }
    else {
      const tan = (cy - y) / (cx - x);
      const r = Math.atan(tan);
      offset = 0.5 + r * 0.5 / Math.PI;
      if (scaleX === -1 && scaleY === -1) {
        offset -= 0.5;
      }
      else if (scaleX === -1) {
        offset = 1.5 - offset;
      }
      else if (scaleY) {
        offset = 1 - offset;
      }
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
