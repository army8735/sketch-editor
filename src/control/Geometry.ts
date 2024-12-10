import Polyline from '../node/geom/Polyline';
import Geom from '../node/geom/Geom';
import Root from '../node/Root';
import Listener from './Listener';

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
      else if (tagName === 'PATH') {}
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
    panel.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'PATH') {
        const i = target.getAttribute('title');
        panel.querySelector('svg.stroke .cur')?.classList.remove('cur');
        panel.querySelector(`svg.stroke path[title="${i}"]`)?.classList.add('cur');
      }
    });
    panel.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'PATH') {
        panel.querySelector('svg.stroke .cur')?.classList.remove('cur');
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
