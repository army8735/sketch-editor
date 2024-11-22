import Root from '../node/Root';
import Node from '../node/Node';
import Listener from './Listener';
import picker from './picker';
import { ComputedGradient, ComputedPattern, GRADIENT } from '../style/define';
import { color2rgbaStr, getCssFillStroke } from '../style/css';
import { r2d } from '../math/geom';
import { toPrecision } from '../math';
import { clone } from '../util/type';

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
    panel.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'SPAN') {
        isDrag = true;
        idx = parseInt(target.title);
        this.setLinearCur(idx, true);
        const o = panel.getBoundingClientRect();
        originX = o.left;
        originY = o.top;
        w = panel.clientWidth;
        h = panel.clientHeight;
        const d = this.data!.d;
        len = Math.sqrt(Math.pow((d[2] - d[0]), 2) + Math.pow((d[3] - d[1]), 2));
      }
      else if (tagName === 'DIV') {}
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
              d[0] = x;
              d[1] = y;
            }
            else {
              d[2] = x;
              d[3] = y;
            }
            len = Math.sqrt(Math.pow((d[2] - d[0]), 2) + Math.pow((d[3] - d[1]), 2));
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
    this.data = clone(data);
    this.updateSize(node);
    if (data.t === GRADIENT.LINEAR) {
      this.genLinear(data);
    }
    else if (data.t === GRADIENT.RADIAL) {}
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
        this.updateLinear(data);
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
    let html = '<div></div>';
    stops.forEach((item, i) => {
      html += `<span title="${i}"></span>`;
    });
    panel.innerHTML = html;
    this.updateBg(data);
    this.updateLinear(data);
    this.setLinearCur(0); // 初始0
  }

  updateLinear(data: ComputedGradient) {
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

  updateBg(data: ComputedGradient) {
    const panel = this.panel;
    const div = panel.querySelector('div') as HTMLElement;
    const { clientWidth, clientHeight } = panel;
    const { d } = data;
    const left = d[0] * 100 + '%';
    const top = d[1] * 100 + '%';
    const len = Math.sqrt(Math.pow((d[2] - d[0]) * clientWidth, 2) + Math.pow((d[3] - d[1]) * clientHeight, 2)) + 'px';
    if (d[0] === d[2]) {
      if (d[3] >= d[1]) {}
      else {}
    }
    else {
      const r = Math.atan((d[3] - d[1]) * clientHeight / (d[2] - d[0]) / clientWidth);
      const deg = toPrecision(r2d(r)) + 'deg';
      div.style.left = left;
      div.style.top = top;
      div.style.width = len;
      div.style.transform = `translateY(-50%) rotateZ(${deg})`;
    }
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
