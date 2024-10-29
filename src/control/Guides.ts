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
  lineH: HTMLElement;
  lineV: HTMLElement;
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

    this.lineH = document.createElement('div');
    this.lineH.className = 'line-h';
    this.lineH.style.display = 'none';
    this.dom.appendChild(this.lineH);

    this.lineV = document.createElement('div');
    this.lineV.className = 'line-v';
    this.lineV.style.display = 'none';
    this.dom.appendChild(this.lineV);

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
    const dpi = this.root.dpi;
    const left = parseFloat(dom.style.left) * dpi;
    const top = parseFloat(dom.style.top) * dpi;
    const width = parseFloat(dom.style.width) * dpi;
    const height = parseFloat(dom.style.height) * dpi;
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

  snapMove(dx: number, dy: number) {
    let x = 0;
    let y = 0;
    let ngX;
    let ngY;
    let has = false;
    const { xs, ys } = this;
    const threshold = Math.max(0, config.guidesSnap * this.root.dpi);
    // 当前位置寻找位于哪条参考线索引
    let { left, right, top, bottom, center, middle } = this.move;
    left += dx;
    right += dx;
    center += dx;
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
      this.showLineV(ng.n, ng);
      ngX = ng;
    }
    else {
      this.hideLineV();
    }
    // y同样
    top += dy;
    bottom += dy;
    middle += dy;
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
      this.showLineH(ng.n, ng);
    }
    else {
      this.hideLineH();
    }
    // 距离显示，需要节点在目标外
    if (ngX) {
      if (top > ngX.r.bottom) {
        this.showDistanceV(ngX.r.bottom, top);
      }
      else if (bottom < ngX.r.top) {
        this.showDistanceV(bottom, ngX.r.top);
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
        this.showDistanceH(ngY.r.right, left);
      }
      else if (right < ngY.r.left) {
        this.showDistanceH(right, ngY.r.left);
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

  showLineH(n: number, ng: NodeGuide) {
    const dpi = this.root.dpi;
    const style = this.lineH.style;
    style.top = n / dpi + 'px';
    style.left = ng.r.left / dpi + 'px';
    style.width = (ng.r.right - ng.r.left) / dpi + 'px';
    style.display = 'block';
  }

  showLineV(n: number, ng: NodeGuide) {
    const dpi = this.root.dpi;
    const style = this.lineV.style;
    style.left = n / dpi + 'px';
    style.top = ng.r.top / dpi + 'px';
    style.height = (ng.r.bottom - ng.r.top) / dpi + 'px';
    style.display = 'block';
  }

  showDistanceH(x1: number, x2: number) {
    const dpi = this.root.dpi;
    const style = this.distanceH.style;
    const w = Math.abs(x1 - x2);
    this.distanceH.querySelector('span')!.innerHTML = toPrecision(w, 2).toString();
    style.top = this.lineH.style.top;
    style.left = Math.min(x1, x2) / dpi + 'px';
    style.width = w / dpi + 'px';
    style.display = 'block';
  }

  showDistanceV(y1: number, y2: number) {
    const dpi = this.root.dpi;
    const style = this.distanceV.style;
    const h = Math.abs(y1 - y2);
    this.distanceV.querySelector('span')!.innerHTML = toPrecision(h, 2).toString();
    style.left = this.lineV.style.left;
    style.top = Math.min(y1, y2) / dpi + 'px';
    style.height = h / dpi + 'px';
    style.display = 'block';
  }

  hideLineH() {
    this.lineH.style.display = 'none';
  }

  hideLineV() {
    this.lineV.style.display = 'none';
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
