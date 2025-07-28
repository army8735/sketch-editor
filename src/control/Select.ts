import Node from '../node/Node';
import Root from '../node/Root';
import { calRectPoints, identity, multiply, multiplyScale } from '../math/matrix';
import Polyline from '../node/geom/Polyline';
import { r2d } from '../math/geom';
import { VISIBILITY } from '../style/define';
import { getFlipOnPage } from '../tool/node';

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const html = `
  <div class="sub"></div>
  <span class="l">
    <b></b>
  </span>
  <span class="t">
    <b></b>
  </span>
  <span class="r">
    <b></b>
  </span>
  <span class="b">
    <b></b>
  </span>
  <span class="tl">
    <b></b>
  </span>
  <span class="tr">
    <b></b>
  </span>
  <span class="br">
    <b></b>
  </span>
  <span class="bl">
    <b></b>
  </span>
`;

export default class Select {
  root: Root;
  dom: HTMLElement;
  frame: HTMLElement;
  hover: HTMLElement;
  select: HTMLElement;
  hoverNode?: Node;

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;
    const frame = this.frame = document.createElement('div');
    frame.className = 'frame';
    frame.style.display = 'none';
    dom.appendChild(frame);

    const hover = this.hover = document.createElement('div');
    hover.className = 'hover';
    hover.style.display = 'none';
    dom.appendChild(hover);

    const select = this.select = document.createElement('div');
    select.className = 'select';
    select.style.display = 'none';
    select.innerHTML = html;
    dom.appendChild(select);
  }

  showFrame(x: number, y: number, w: number, h: number) {
    this.frame.style.left = x + 'px';
    this.frame.style.top = y + 'px';
    this.updateFrame(w, h);
    this.frame.style.display = 'block';
  }

  updateFrame(w: number, h: number) {
    this.frame.style.width = Math.abs(w) + 'px';
    this.frame.style.height = Math.abs(h) + 'px';
    this.frame.style.transform = `scale(${w >= 0 ? 1 : -1}, ${h >= 0 ? 1 : -1})`;
  }

  hideFrame() {
    this.frame.style.display = 'none';
  }

  showHover(node: Node) {
    this.hoverNode = node;
    this.updateHover(node);
    this.hover.style.display = 'block';
  }

  hideHover() {
    this.hoverNode = undefined;
    this.hover.style.display = 'none';
  }

  // hover/select时单个节点的位置，包含镜像旋转等在内的transform，换算成dom的实际宽高尺寸
  calRect(node: Node) {
    const root = this.root;
    const dpi = root.dpi;
    let rect = node._rect || node.rect;
    // console.log(node.width, node.height, rect.join(','))
    let matrix = node.matrixWorld;
    if (dpi !== 1) {
      const t = identity();
      multiplyScale(t, 1 / dpi);
      matrix = multiply(t, matrix);
    }
    const isLine = node instanceof Polyline && node.isLine();
    if (isLine) {
      // rect = node.rectLine;
    }
    let { x1, y1, x2, y2, x3, y3, x4, y4 } = calRectPoints(rect[0], rect[1], rect[2], rect[3], matrix);
    const flip = getFlipOnPage(node);
    if (flip.x === -1) {
      [x1, x2] = [x2, x1];
      [y1, y2] = [y2, y1];
      [x3, x4] = [x4, x3];
      [y3, y4] = [y4, y3];
    }
    if (flip.y === -1) {
      [x1, x4] = [x4, x1];
      [y1, y4] = [y4, y1];
      [x2, x3] = [x3, x2];
      [y2, y3] = [y3, y2];
    }
    const width = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    const height = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
    const res = {
      left: x1,
      top: y1,
      width,
      height,
      transform: '',
    };
    if (x2 > x1) {
      if (y2 !== y1) {
        const deg = r2d(Math.atan((y2 - y1) / (x2 - x1)));
        res.transform = `rotateZ(${deg}deg)`;
      }
    }
    else if (x2 < x1) {
      const deg = r2d(Math.atan((y2 - y1) / (x2 - x1)));
      res.transform = `rotateZ(${deg + 180}deg)`;
    }
    else {
      if (y2 > y1) {
        res.transform = `rotateZ(90deg)`;
      }
      else if (y2 < y1) {
        res.transform = `rotateZ(-90deg)`;
      }
    }
    return res;
  }

  updateHover(node: Node) {
    const res = this.calRect(node);
    this.hover.style.left = res.left + 'px';
    this.hover.style.top = res.top + 'px';
    this.hover.style.width = res.width + 'px';
    this.hover.style.height = res.height + 'px';
    this.hover.style.transform = res.transform;
  }

  showSelect(selected: Node[]) {
    this.updateSelect(selected);
    this.showSelectNotUpdate();
  }

  showSelectNotUpdate() {
    this.select.style.display = 'block';
  }

  updateSelect(selected: Node[]) {
    const sub = this.select.querySelector('.sub') as HTMLElement;
    if (selected.length === 1) {
      sub.innerHTML = '';
      this.select.classList.remove('multi');
      if (selected[0].computedStyle.visibility === VISIBILITY.VISIBLE) {
        this.select.classList.remove('hide');
      }
      else {
        this.select.classList.add('hide');
      }
      const res = this.calRect(selected[0]);
      this.select.style.left = res.left + 'px';
      this.select.style.top = res.top + 'px';
      this.select.style.width = res.width + 'px';
      this.select.style.height = res.height + 'px';
      this.select.style.transform = res.transform;
    }
    // 多个时表现不一样，忽略了旋转镜像等transform，取所有节点的boundingClientRect全集
    else if (selected.length > 1) {
      this.select.classList.add('multi');
      let left = 0, top = 0, right = 0, bottom = 0;
      const rects: { left: number, top: number, right: number, bottom: number, visible: boolean }[] = [];
      selected.forEach((item, i) => {
        const rect = item.getBoundingClientRect();
        rects.push({
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          visible: item.computedStyle.visibility === VISIBILITY.VISIBLE,
        });
        if (i) {
          left = Math.min(left, rect.left);
          top = Math.min(top, rect.top);
          right = Math.max(right, rect.right);
          bottom = Math.max(bottom, rect.bottom);
        }
        else {
          left = rect.left;
          top = rect.top;
          right = rect.right;
          bottom = rect.bottom;
        }
      });
      const dpi = this.root.dpi;
      const style = this.select.style;
      style.left = left / dpi + 'px';
      style.top = top / dpi + 'px';
      style.width = (right - left) / dpi + 'px';
      style.height = (bottom - top) / dpi + 'px';
      style.transform = '';
      // 多选更新每个节点的小框
      let s = '';
      selected.forEach(item => {
        const r = this.calRect(item);
        s += `<div style="left:${(r.left-left/dpi)}px;top:${(r.top-top/dpi)}px;width:${r.width}px;height:${r.height}px;transform:${r.transform}"></div>`;
      });
      const sub = this.select.querySelector('.sub') as HTMLElement;
      if (sub.innerHTML !== s) {
        sub.innerHTML = s;
      }
    }
  }

  hideSelect() {
    this.select.style.display = 'none';
  }

  isSelectControlDom(dom: HTMLElement) {
    return dom.parentElement === this.select;
  }

  destroy() {
    this.hover.remove();
    this.select.remove();
    this.frame.remove();
  }

  metaKey(meta: boolean) {
    if (meta) {
      this.select.classList.add('rotate');
    }
    else {
      this.select.classList.remove('rotate');
    }
  }

  getAspectRatio() {
    const style = this.select.style;
    return {
      x: parseFloat(style.left),
      y: parseFloat(style.top),
      w: parseFloat(style.width),
      h: parseFloat(style.height),
    };
  }
}
