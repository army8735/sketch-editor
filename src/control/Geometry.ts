import Polyline from '../node/geom/Polyline';
import Root from '../node/Root';
import Listener from './Listener';

export default class Geometry {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  panel: HTMLElement;
  node?: Polyline;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    const panel = this.panel = document.createElement('div');
    panel.className = 'geometry';
    panel.style.display = 'none';
    dom.appendChild(panel);

    panel.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      const classList = target.classList;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'SPAN') {
        panel.querySelector('div.cur')?.classList.remove('cur');
        target.classList.add('cur');
      }
    });
  }

  show(node: Polyline) {
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

  updateSize(node: Polyline) {
    const panel = this.panel;
    const res = this.listener.select.calRect(node);
    panel.style.left = res.left + 'px';
    panel.style.top = res.top + 'px';
    panel.style.width = res.width + 'px';
    panel.style.height = res.height + 'px';
    panel.style.transform = res.transform;
    panel.style.display = 'block';
  }

  genVertex(node: Polyline) {
    const panel = this.panel;
    const coords = node.coords;
    coords!.forEach((item, i) => {
      panel.innerHTML += `<div title="${i}"></div>`;
    });
  }

  updateVertex(node: Polyline) {
    const coords = node.coords!;
    const close = node.props.isClosed;
    const bbox = node._bbox2 || node.bbox2;
    const zoom = node.root?.getCurPageZoom(true) || 1;
    const divs = this.panel.querySelectorAll('span');
    coords.forEach((item, i) => {
      if (i < coords.length - 1 && close && divs[i]) {
        const c = item.slice(-2);
        const style = divs[i].style;
        style.left = c[0] * zoom + 'px';
        style.top = c[1] * zoom + 'px';
      }
    });
  }

  hide() {}
}
