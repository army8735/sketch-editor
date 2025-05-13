import Root from '../node/Root';

export default class AddGeom {
  root: Root;
  dom: HTMLElement;
  rect: HTMLElement;
  oval: HTMLElement;
  round: HTMLElement;

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;

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
  }

  show(style: CSSStyleDeclaration, x: number, y: number) {
    style.left = x + 'px';
    style.top = y + 'px';
    style.width = '0px';
    style.height = '0px';
    style.display = 'block';
  }

  update(style: CSSStyleDeclaration, w: number, h: number) {
    style.width = Math.abs(w) + 'px';
    style.height = Math.abs(h) + 'px';
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
    return { x, y, w, h };
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
}

