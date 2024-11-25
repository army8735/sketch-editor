import Root from '../node/Root';
import Node from '../node/Node';
import Listener from './Listener';
import picker from './picker';
import { ComputedGradient, ComputedPattern, GRADIENT } from '../style/define';
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
    let originX = 0;
    let originY = 0;
    let idx = 0;
    let w = 1;
    let h = 1;
    let len = 1;
    let target: HTMLElement;
    let list: NodeListOf<HTMLSpanElement>;
    panel.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      target = e.target as HTMLElement;
      list = panel.querySelectorAll('span');
      const tagName = target.tagName.toUpperCase();
      const o = panel.getBoundingClientRect();
      originX = o.left;
      originY = o.top;
      w = panel.clientWidth;
      h = panel.clientHeight;
      const d = this.data!.d;
      len = Math.sqrt(Math.pow((d[2] - d[0]), 2) + Math.pow((d[3] - d[1]), 2));
      if (tagName === 'SPAN') {
        isDrag = true;
        idx = parseInt(target.title);
        this.setLinearCur(idx, true);
      }
      else if (tagName === 'DIV') {
        const data = this.data;
        if (data) {
          const { d, stops } = data;
          const x0 = originX + d[0] * w;
          const y0 = originY + d[1] * h;
          const len = Math.sqrt(Math.pow(e.pageX - x0, 2) + Math.pow(e.pageY - y0, 2));
          const offset = len / target.clientWidth;
          // 一定不会是首尾，因为点不到
          for (let i = 0, len = stops.length; i < len; i++) {
            const item = stops[i];
            if (offset < item.offset) {
              const prev = stops[i - 1];
              const p = (offset - prev.offset) / (item.offset - prev.offset);
              stops.splice(i, 0, {
                color: normalizeColor([
                  prev.color[0] + (item.color[0] - prev.color[0]) * p,
                  prev.color[1] + (item.color[1] - prev.color[1]) * p,
                  prev.color[2] + (item.color[2] - prev.color[2]) * p,
                  (prev.color[3] ?? 1) + ((item.color[3] ?? 1) - (prev.color[3] ?? 1)) * p,
                ]),
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
          this.setLinearCur(idx, true);
          this.onChange!(data, true);
          isDrag = true;
          // @ts-ignore
          data.id = 'b';
          console.log(data);
        }
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (isDrag) {
        const x = (e.pageX - originX) / w;
        const y = (e.pageY - originY) / h;
        const data = this.data;
        if (data) {
          const { d, stops } = data;
          // 首尾影响渐变起始点，即长度，然后其它点都随之变化
          if (idx === 0 || idx === stops.length - 1) {
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
            len = Math.sqrt(Math.pow((d[2] - d[0]), 2) + Math.pow((d[3] - d[1]), 2));
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
            const dx = x - d[0];
            const dy = y - d[1];
            const sum = Math.pow(dx, 2) * (dx < 0 ? -1 : 1) + Math.pow(dy, 2) * (dy < 0 ? -1 : 1);
            let offset = Math.sqrt(Math.max(0, sum)) / len;
            offset = Math.max(0, Math.min(1, offset));
            stops[idx].offset = offset;
            const left = (d[0] + (d[2] - d[0]) * offset) * 100 + '%';
            const top = (d[1] + (d[3] - d[1]) * offset) * 100 + '%';
            target.style.left = left;
            target.style.top = top;
            picker.updateLinePos(idx, offset, data);
            this.onChange!(data, true);
          }
        }
      }
    });
    document.addEventListener('mouseup', () => {
      if (isDrag) {
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
    // 阻止冒泡，listener侦听document点击取消选择
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
    else if (data.t === GRADIENT.CONIC) {}
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
    else if (data.t === GRADIENT.CONIC) {}
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
    this.setLinearCur(0); // 初始0
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
        div.style.transform = `translateY(-50%) rotateZ(90deg)`;
      }
      else {
        div.style.transform = `translateY(-50%) rotateZ(-90deg)`;
      }
    }
    else if (d[1] === d[3]) {
      if (d[2] >= d[0]) {
        div.style.transform = `translateY(-50%)`;
      }
      else {
        div.style.transform = `translateY(-50%) rotateZ(180deg)`;
      }
    }
    else {
      const r = Math.atan((d[3] - d[1]) * clientHeight / (d[2] - d[0]) / clientWidth);
      const deg = toPrecision(r2d(r)) + 'deg';
      div.style.transform = `translateY(-50%) rotateZ(${deg})`;
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
    console.log(data);
    const panel = this.panel;
    const { stops } = data;
    panel.innerHTML = '';
    let html = '<div class="l"></div><div class="c"></div>';
    stops.forEach((item, i) => {
      html += `<span title="${i}"></span>`;
    });
    panel.innerHTML = html;
    this.updateRadialD(data);
    this.updateLinearStops(data);
  }

  updateRadialD(data: ComputedGradient) {
    const panel = this.panel;
    const line = panel.querySelector('.l') as HTMLElement;
    const circle = panel.querySelector('.c') as HTMLElement;
    const { clientWidth, clientHeight } = panel;
    const { d } = data;
    const left = d[0] * 100 + '%';
    const top = d[1] * 100 + '%';
    const len = Math.sqrt(Math.pow((d[2] - d[0]) * clientWidth, 2) + Math.pow((d[3] - d[1]) * clientHeight, 2));
    line.style.left = left;
    line.style.top = top;
    line.style.width = len + 'px';
    circle.style.left = left;
    circle.style.top = top;
    circle.style.width = circle.style.height = len * 2 + 'px';
    if (d[0] === d[2]) {
      if (d[3] >= d[1]) {
        line.style.transform = `translateY(-50%) rotateZ(90deg)`;
      }
      else {
        line.style.transform = `translateY(-50%) rotateZ(-90deg)`;
      }
    }
    else if (d[1] === d[3]) {
      if (d[2] >= d[0]) {
        line.style.transform = `translateY(-50%)`;
      }
      else {
        line.style.transform = `translateY(-50%) rotateZ(180deg)`;
      }
    }
    else {
      const r = Math.atan((d[3] - d[1]) * clientHeight / (d[2] - d[0]) / clientWidth);
      const deg = toPrecision(r2d(r)) + 'deg';
      line.style.transform = `translateY(-50%) rotateZ(${deg})`;
    }
  }

  updateRadialStops(data: ComputedGradient) {
    const panel = this.panel;
    const spans = panel.querySelectorAll('span');
  }

  setLinearCur(i: number, notify = false) {
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
