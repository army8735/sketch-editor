import Polyline from '../node/geom/Polyline';
import Geom from '../node/geom/Geom';
import Root from '../node/Root';
import Listener from './Listener';
import { getPointWithDByApprox } from '../math/bezier';

export default class Geometry {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  panel: HTMLElement;
  node?: Geom;
  keep?: boolean; // 保持窗口外部点击时不关闭

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    const panel = this.panel = document.createElement('div');
    panel.className = 'geometry';
    panel.style.display = 'none';
    dom.appendChild(panel);

    let isDrag = false;
    let isMove = false;
    let target: HTMLElement;
    let ox = 0; // panel
    let oy = 0;
    let idx = 0;
    let w = 1;
    let h = 1;

    panel.addEventListener('mousedown', (e) => {
      const node = this.node;
      if (!node) {
        return;
      }
      this.keep = true;
      if (e.button !== 0 || listener.spaceKey) {
        return;
      }
      target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      const o = panel.getBoundingClientRect();
      ox = o.left;
      oy = o.top;
      w = panel.clientWidth;
      h = panel.clientHeight;
      isMove = false;
      if (tagName === 'DIV') {
        panel.querySelector('div.cur')?.classList.remove('cur');
        target.classList.add('cur');
        idx = parseInt(target.title);
        isDrag = true;
      }
      else if (tagName === 'PATH') {
        idx = parseInt(target.getAttribute('title') || '0');
        const x = e.pageX - ox;
        const y = e.pageY - oy;
        const scale = root.getCurPageZoom(true);
        // console.log(1, idx, x, y, scale)
        const node = this.node;
        if (node) {
          if (node instanceof Polyline) {
            const coords = node.coords!;
            // console.log(coords);
            const prev = coords[idx].slice(-2);
            const next = coords[idx + 1] || coords[0];
            // console.log(prev, next);
            const points: { x: number; y: number }[] = [];
            points.push({ x: prev[0] * scale, y: prev[1] * scale });
            for (let i = 0, len = next.length; i < len; i += 2) {
              points.push({ x: next[i] * scale, y: next[i + 1] * scale });
            }
            // console.log(points);
            const p = getPointWithDByApprox(points, x, y);
            // console.log(p);
          }
        }
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (isDrag) {
        const x = (e.pageX - ox) / w;
        const y = (e.pageY - oy) / h;
        const node = this.node;
        if (node) {
          if (node instanceof Polyline) {
            node.props.points[idx].x = x;
            node.props.points[idx].y = y;
            node.refresh();
            this.updateVertex(node);
          }
          isMove = true;
        }
      }
    });
    document.addEventListener('mouseup', () => {
      if (isDrag) {
        isDrag = false;
        if (isMove) {
          isMove = false;
          const node = this.node;
          if (node) {
            if (node instanceof Polyline) {
              //
            }
          }
        }
      }
    });
    let pathIdx = -1;
    panel.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'PATH') {
        pathIdx = +target.getAttribute('title')!;
      }
      else {
        pathIdx = -1;
      }
    });
    panel.addEventListener('mousemove', (e) => {
      const node = this.node;
      if (pathIdx > -1 && node) {
        if (node instanceof Polyline) {
          const x = e.offsetX;
          const y = e.offsetY;
          const scale = root.getCurPageZoom(true);
          const coords = node.coords!;
          const prev = coords[pathIdx].slice(-2);
          const next = coords[pathIdx + 1] || coords[0];
          const points: { x: number; y: number }[] = [];
          points.push({ x: prev[0] * scale, y: prev[1] * scale });
          for (let i = 0, len = next.length; i < len; i += 2) {
            points.push({ x: next[i] * scale, y: next[i + 1] * scale });
          }
          const p = getPointWithDByApprox(points, x, y);
          panel.querySelector('svg.stroke .cur')?.classList.remove('cur');
          panel.querySelector('svg.interactive .cur')?.classList.remove('cur');
          if (p && p.d <= 5) {
            panel.querySelector(`svg.stroke path[title="${pathIdx}"]`)?.classList.add('cur');
            panel.querySelector(`svg.interactive path[title="${pathIdx}"]`)?.classList.add('cur');
          }
        }
      }
    });
    panel.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'PATH') {
        panel.querySelector('svg.stroke .cur')?.classList.remove('cur');
      }
      pathIdx = -1;
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
    });
  }

  show(node: Geom) {
    this.node = node;
    this.panel.innerHTML = '';
    this.updateSize(node);
    this.genVertex(node);
    this.updateVertex(node);
  }

  update() {
    if (this.node) {
      this.updateSize(this.node);
      this.updateVertex(this.node);
    }
  }

  updateSize(node: Geom) {
    const panel = this.panel;
    const res = this.listener.select.calRect(node);
    panel.style.left = res.left + 'px';
    panel.style.top = res.top + 'px';
    panel.style.width = res.width + 'px';
    panel.style.height = res.height + 'px';
    panel.style.transform = res.transform;
    panel.style.display = 'block';
  }

  genVertex(node: Geom) {
    const panel = this.panel;
    const coords = node.coords;
    panel.innerHTML += `<svg class="stroke"></svg><svg class="interactive"></svg>`;
    const svg1 = panel.querySelector('svg.stroke') as SVGElement;
    const svg2 = panel.querySelector('svg.interactive') as SVGElement;
    let s = '';
    let s2 = '';
    coords!.forEach((item, i) => {
      if (i) {
        s += `<path title="${i - 1}" d=""></path>`;
        s2 += `<div title="${i - 1}"></div>`;
      }
    });
    svg1.innerHTML = s;
    svg2.innerHTML = s;
    panel.innerHTML += s2;
  }

  updateVertex(node: Geom) {
    node.buildPoints();
    const coords = node.coords!;
    const zoom = node.root?.getCurPageZoom(true) || 1;
    const panel = this.panel;
    const divs = panel.querySelectorAll('div');
    const paths1 = panel.querySelectorAll('svg.stroke path');
    const paths2 = panel.querySelectorAll('svg.interactive path');
    coords.forEach((item, i) => {
      if (divs[i]) {
        const c = item.slice(-2);
        const style = divs[i].style;
        style.left = c[0] * zoom + 'px';
        style.top = c[1] * zoom + 'px';
      }
      if (paths1[i]) {
        let d = 'M' + item.slice(-2).map(n => n * zoom).join(',');
        const next = coords[i + 1] || coords[0];
        if (next) {
          if (next.length === 6) {
            d += 'C';
          }
          else if (next.length === 4) {
            d += 'Q';
          }
          else if (next.length === 2) {
            d += 'L';
          }
          d += next.map(n => n * zoom).join(',');
          paths1[i].setAttribute('d', d);
          paths2[i].setAttribute('d', d);
        }
      }
    });
  }

  updatePos() {
    if (this.node) {
      this.updateSize(this.node);
    }
  }

  hide() {
    this.panel.style.display = 'none';
    this.panel.innerHTML = '';
    this.node = undefined;
    this.keep = false;
  }
}
