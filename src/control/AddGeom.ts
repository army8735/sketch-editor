import Root from '../node/Root';

export default class AddGeom {
  root: Root;
  dom: HTMLElement;
  rect: HTMLElement;

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;

    const rect = this.rect = document.createElement('div');
    rect.className = 'rect';
    rect.style.display = 'none';
    dom.appendChild(rect);
  }

  showRect(x: number, y: number) {
    const style = this.rect.style;
    style.left = x + 'px';
    style.top = y + 'px';
    style.width = '0px';
    style.height = '0px';
    style.display = 'block';
  }

  updateRect(w: number, h: number) {
    const style = this.rect.style;
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

  hideRect() {
    const { clientWidth: width, clientHeight: height } = this.rect;
    const style = this.rect.style;
    const { left, top, transform } = style;
    let x = parseInt(left);
    let y = parseInt(top);
    if (transform === 'scale(-1, -1)') {
      x -= width;
      y -= height;
    }
    else if (transform === 'scaleX(-1)') {
      x -= width;
    }
    else if (transform === 'scaleY(-1)') {
      y -= height;
    }
    style.display = 'none';
    style.width = '0px';
    style.height = '0px';
    style.transform = '';
    return { x, y, width, height };
  }
}

