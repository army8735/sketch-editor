import Root from '../node/Root';
import Listener from './Listener';

export default class AddGeom {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  rect: HTMLElement;
  oval: HTMLElement;
  round: HTMLElement;
  triangle: HTMLElement;
  line: HTMLElement;
  star: HTMLElement;
  custom: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    const rect = this.rect = document.createElement('div');
    rect.className = 'rect';
    rect.style.display = 'none';
    dom.appendChild(rect);

    const oval = this.oval = document.createElement('div');
    oval.className = 'oval';
    oval.style.display = 'none';
    dom.appendChild(oval);

    const round = this.round = document.createElement('div');
    round.className = 'round';
    round.style.display = 'none';
    dom.appendChild(round);

    const line = this.line = document.createElement('div');
    line.className = 'line';
    line.style.display = 'none';
    line.innerHTML = '<svg><path d="" stroke="#979797" fill="none" stroke-width="1"></path></svg>';
    dom.appendChild(line);

    const triangle = this.triangle = document.createElement('div');
    triangle.className = 'triangle';
    triangle.style.display = 'none';
    triangle.innerHTML = '<svg><path d="" stroke="#979797" fill="none" stroke-width="1"></path></svg>';
    dom.appendChild(triangle);

    const star = this.star = document.createElement('div');
    star.className = 'star';
    star.style.display = 'none';
    // dom.appendChild(star);

    const custom = this.custom = document.createElement('div');
    custom.className = 'custom';
    custom.style.display = 'none';
    custom.innerHTML = '<svg><path d="" stroke="#979797" fill="none" stroke-width="1"></path></svg>';
    dom.appendChild(custom);
  }

  show(style: CSSStyleDeclaration, x: number, y: number) {
    style.left = x + 'px';
    style.top = y + 'px';
    style.width = '0px';
    style.height = '0px';
    style.display = 'block';
  }

  update(style: CSSStyleDeclaration, w: number, h: number) {
    style.width = Math.max(1, Math.abs(w)) + 'px';
    style.height = Math.max(1, Math.abs(h)) + 'px';
    if (w < 0 && h < 0) {
      style.transform = 'scale(-1, -1)';
    }
    else if (w < 0) {
      style.transform = 'scaleX(-1)';
    }
    else if (h < 0) {
      style.transform = 'scaleY(-1)';
    }
    else {
      style.transform = '';
    }
  }

  hide(style: CSSStyleDeclaration, w: number, h: number) {
    const { left, top, transform } = style;
    let x = parseInt(left);
    let y = parseInt(top);
    if (transform === 'scale(-1, -1)') {
      x -= w;
      y -= h;
    }
    else if (transform === 'scaleX(-1)') {
      x -= w;
    }
    else if (transform === 'scaleY(-1)') {
      y -= h;
    }
    style.display = 'none';
    style.width = '0px';
    style.height = '0px';
    style.transform = '';
    return { x, y, w, h, transform };
  }

  showRect(x: number, y: number) {
    const style = this.rect.style;
    this.show(style, x, y);
  }

  updateRect(w: number, h: number) {
    const style = this.rect.style;
    this.update(style, w, h);
  }

  hideRect() {
    const { clientWidth: w, clientHeight: h, style } = this.rect;
    return this.hide(style, w, h);
  }

  showOval(x: number, y: number) {
    const style = this.oval.style;
    this.show(style, x, y);
  }

  showCustom(x: number, y: number) {
    const style = this.custom.style;
    this.show(style, x, y);
  }

  updateOval(w: number, h: number) {
    const style = this.oval.style;
    this.update(style, w, h);
  }

  hideOval() {
    const { clientWidth: w, clientHeight: h, style } = this.oval;
    return this.hide(style, w, h);
  }

  showRound(x: number, y: number) {
    const style = this.round.style;
    this.show(style, x, y);
  }

  updateRound(w: number, h: number) {
    const style = this.round.style;
    this.update(style, w, h);
  }

  hideRound() {
    const { clientWidth: w, clientHeight: h, style } = this.round;
    return this.hide(style, w, h);
  }

  showTriangle(x: number, y: number) {
    const style = this.triangle.style;
    this.show(style, x, y);
  }

  updateTriangle(w: number, h: number) {
    const style = this.triangle.style;
    this.update(style, w, h);
    w = Math.max(1, Math.abs(w));
    h = Math.max(1, Math.abs(h));
    const svg = this.triangle.querySelector('svg') as SVGSVGElement;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', w + 'px');
    svg.setAttribute('height', h + 'px');
    svg.style.transform = style.transform;
    const path = svg.querySelector('path') as SVGPathElement;
    path.setAttribute('d', `M${w * 0.5},0 L${w},${h} L0,${h} L${w * 0.5},0 Z`);
  }

  hideTriangle() {
    const { clientWidth: w, clientHeight: h, style } = this.triangle;
    return this.hide(style, w, h);
  }

  showLine(x: number, y: number) {
    const style = this.line.style;
    this.show(style, x, y);
  }

  updateLine(w: number, h: number) {
    const style = this.line.style;
    this.update(style, w, h);
    w = Math.max(1, Math.abs(w));
    h = Math.max(1, Math.abs(h));
    const svg = this.line.querySelector('svg') as SVGSVGElement;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', w + 'px');
    svg.setAttribute('height', h + 'px');
    const path = svg.querySelector('path') as SVGPathElement;
    path.setAttribute('d', `M0,0 L${w},${h}`);
  }

  hideLine() {
    const { clientWidth: w, clientHeight: h, style } = this.line;
    return this.hide(style, w, h);
  }

  showStar(x: number, y: number) {
    const style = this.star.style;
    this.show(style, x, y);
  }

  updateStar(w: number, h: number) {}

  hideStar() {}

  updateCustom(w: number, h: number) {
    const style = this.custom.style;
    this.update(style, w, h);
    w = Math.max(1, Math.abs(w));
    h = Math.max(1, Math.abs(h));
    const svg = this.custom.querySelector('svg') as SVGSVGElement;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', w + 'px');
    svg.setAttribute('height', h + 'px');
    svg.style.transform = style.transform;
    const path = svg.querySelector('path') as SVGPathElement;
    const d = this.listener.customGeom.preview(w, h)
      || `M0,0 L${w},0 L${w},${h} L0,${h} L0,0 Z`;
    path.setAttribute('d', d);
  }

  hideCustom() {
    const { clientWidth: w, clientHeight: h, style } = this.custom;
    return this.hide(style, w, h);
  }
}

