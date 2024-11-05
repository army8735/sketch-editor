import Node from '../node/Node';
import Root from '../node/Root';
import { getGuidesNodes, GuideRect, NodeGuide, search2 } from '../tools/root';
import config from '../util/config';
import Listener from './Listener';
import { toPrecision } from '../math';

class Guides {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  xs: NodeGuide[];
  ys: NodeGuide[];
  move: GuideRect;
  lineH: HTMLElement[];
  lineV: HTMLElement[];
  distanceH: HTMLElement;
  distanceV: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    this.xs = [];
    this.ys = [];
    this.move = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      center: 0,
      middle: 0,
    };

    this.lineH = [];
    this.lineV = [];

    this.distanceH = document.createElement('div');
    this.distanceH.className = 'distance-h';
    this.distanceH.style.display = 'none';
    this.distanceH.innerHTML = '<span></span>';
    this.dom.appendChild(this.distanceH);

    this.distanceV = document.createElement('div');
    this.distanceV.className = 'distance-v';
    this.distanceV.style.display = 'none';
    this.distanceV.innerHTML = '<span></span>';
    this.dom.appendChild(this.distanceV);

  }

  // 鼠标点下时初始化显示范围内的节点数据，为后续参考线做准备
  initMove(dom: HTMLElement, ignore: Node[]) {
    const { x, y } = getGuidesNodes(this.root, ignore);
    this.xs = x;
    this.ys = y;
    const left = parseFloat(dom.style.left);
    const top = parseFloat(dom.style.top);
    const width = parseFloat(dom.style.width);
    const height = parseFloat(dom.style.height);
    const right = left + width;
    const center = (left + right) * 0.5;
    const bottom = top + height;
    const middle = (top + bottom) * 0.5;
    this.move = {
      left,
      right,
      top,
      bottom,
      center,
      middle,
    };
  }

  snapMove(dx: number, dy: number, factor: number) {
    let x = 0;
    let y = 0;
    let ngX;
    let ngY;
    let has = false;
    const { xs, ys } = this;
    const threshold = Math.max(0, config.guidesSnap);
    // 当前位置寻找位于哪条参考线索引
    let { left, right, top, bottom, center, middle } = this.move;
    left += dx;
    right += dx;
    center += dx;
    top += dy;
    bottom += dy;
    middle += dy;
    const il = search2(left, xs);
    const ic = search2(center, xs);
    const ir = search2(right, xs);
    // 计算符合阈值的距离，前中后都算，不符合是undefined
    const l = getD(left, threshold, xs, il);
    const c = getD(center, threshold, xs, ic);
    const r = getD(right, threshold, xs, ir);
    // 取最近的，如果有
    const listX = [l, c, r].filter(item => item);
    if (listX.length) {
      has = true;
      listX.sort((a, b) => Math.abs(a!.d) - Math.abs(b!.d));
      const { d, ng } = listX[0]!;
      x = d;
      left += x;
      right += x;
      ngX = ng;
      this.showLineV(ng.n, Math.min(top, ng.r.top), Math.max(bottom, ng.r.bottom), 0);
      for (let i = 1, len = listX.length; i < len; i++) {
        const item = listX[i]!;
        if (Math.abs(item.d - d) < 1e-9) {
          this.showLineV(item.ng.n, Math.min(top, item.ng.r.top), Math.max(bottom, item.ng.r.bottom), i);
        }
        else {
          break;
        }
      }
    }
    else {
      this.hideLineV();
    }
    // y同样
    const it = search2(top, ys);
    const im = search2(middle, ys);
    const ib = search2(bottom, ys);
    const t = getD(top, threshold, ys, it);
    const m = getD(middle, threshold, ys, im);
    const b = getD(bottom, threshold, ys, ib);
    const listY = [t, m, b].filter(item => item);
    if (listY.length) {
      has = true;
      listY.sort((a, b) => Math.abs(a!.d) - Math.abs(b!.d));
      const { d, ng } = listY[0]!;
      y = d;
      top += y;
      bottom += y;
      ngY = ng;
      this.showLineH(ng.n, Math.min(left, ng.r.left), Math.max(right, ng.r.right), 0);
      for (let i = 1, len = listY.length; i < len; i++) {
        const item = listY[i]!;
        if (item.d === d) {
          this.showLineH(item.ng.n, Math.min(left, item.ng.r.left), Math.max(right, item.ng.r.right), i);
        }
        else {
          break;
        }
      }
    }
    else {
      this.hideLineH();
    }
    // 距离显示，需要节点在目标外
    if (ngX) {
      if (top > ngX.r.bottom) {
        this.showDistanceV(ngX.r.bottom, top, factor);
      }
      else if (bottom < ngX.r.top) {
        this.showDistanceV(bottom, ngX.r.top, factor);
      }
      else {
        this.hideDistanceV();
      }
    }
    else {
      this.hideDistanceV();
    }
    if (ngY) {
      if (left > ngY.r.right) {
        this.showDistanceH(ngY.r.right, left, factor);
      }
      else if (right < ngY.r.left) {
        this.showDistanceH(right, ngY.r.left, factor);
      }
      else {
        this.hideDistanceH();
      }
    }
    else {
      this.hideDistanceH();
    }
    if (has) {
      return { x, y };
    }
  }

  showLineH(n: number, left: number, right: number, i: number) {
    if (!this.lineH[i]) {
      const o = this.lineH[i] = document.createElement('div');
      o.className = 'line-h';
      this.dom.appendChild(o);
    }
    const style = this.lineH[i].style;
    style.top = n + 'px';
    style.left = left + 'px';
    style.width = (right - left) + 'px';
    style.display = 'block';
  }

  showLineV(n: number, top: number, bottom: number, i: number) {
    if (!this.lineV[i]) {
      const o = this.lineV[i] = document.createElement('div');
      o.className = 'line-v';
      this.dom.appendChild(o);
    }
    const style = this.lineV[i].style;
    style.left = n + 'px';
    style.top = top + 'px';
    style.height = (bottom - top) + 'px';
    style.display = 'block';
  }

  showDistanceH(x1: number, x2: number, factor: number) {
    const style = this.distanceH.style;
    const w = Math.abs(x1 - x2);
    this.distanceH.querySelector('span')!.innerHTML = toPrecision(w * factor, 2).toString();
    const len = this.lineH.length;
    if (len === 3) {
      style.top = this.lineH[1].style.top;
    }
    else if (len > 1) {
      style.top = (parseFloat(this.lineH[0].style.top) + parseFloat(this.lineH[len - 1].style.top)) * 0.5 + 'px';
    }
    else {
      style.top = this.lineH[0].style.top;
    }
    style.left = Math.min(x1, x2) + 'px';
    style.width = w + 'px';
    style.display = 'block';
  }

  showDistanceV(y1: number, y2: number, factor: number) {
    const style = this.distanceV.style;
    const h = Math.abs(y1 - y2);
    this.distanceV.querySelector('span')!.innerHTML = toPrecision(h * factor, 2).toString();
    const len = this.lineV.length;
    if (len === 3) {
      style.left = this.lineV[1].style.left;
    }
    else if (len > 1) {
      style.left = (parseFloat(this.lineV[0].style.left) + parseFloat(this.lineV[len - 1].style.left)) * 0.5 + 'px';
    }
    else {
      style.left = this.lineV[0].style.left;
    }
    style.top = Math.min(y1, y2) + 'px';
    style.height = h + 'px';
    style.display = 'block';
  }

  hideLineH() {
    this.lineH.splice(0).forEach(item => {
      item.style.display = 'none';
      item.remove();
    });
  }

  hideLineV() {
    this.lineV.splice(0).forEach(item => {
      item.style.display = 'none';
      item.remove();
    });
  }

  hideDistanceH() {
    this.distanceH.style.display = 'none';
  }

  hideDistanceV() {
    this.distanceV.style.display = 'none';
  }

  hide() {
    this.hideLineH();
    this.hideLineV();
    this.hideDistanceH();
    this.hideDistanceV();
  }
}

function getD(n: number, threshold: number, list: NodeGuide[], index: number) {
  const prev = list[index - 1];
  const next = list[index];
  if (prev && next) {
    const a = Math.abs(prev.n - n);
    const b = Math.abs(next.n - n);
    if (a <= threshold && b <= threshold) {
      if (a <= b) {
        return {
          d: prev.n - n,
          ng: prev,
        };
      }
      else {
        return {
          d: next.n - n,
          ng: next,
        };
      }
    }
    else if (a <= threshold) {
      return {
        d: prev.n - n,
        ng: prev,
      };
    }
    else if (b <= threshold) {
      return {
        d: next.n - n,
        ng: next,
      };
    }
  }
  else if (prev) {
    if (Math.abs(n - prev.n) <= threshold) {
      return {
        d: prev.n - n,
        ng: prev,
      };
    }
  }
  else if (next) {
    if (Math.abs(n - next.n) <= threshold) {
      return {
        d: next.n - n,
        ng: next,
      };
    }
  }
}

export default Guides;
