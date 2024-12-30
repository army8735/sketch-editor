import Polyline from '../node/geom/Polyline';
import Root from '../node/Root';
import Listener from './Listener';
import { getPointWithDByApprox, sliceBezier } from '../math/bezier';
import ShapeGroup from '../node/geom/ShapeGroup';
import { CURVE_MODE } from '../style/define';
import { r2d } from '../math/geom';

export default class Geometry {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  panel: HTMLElement;
  node?: Polyline | ShapeGroup;
  keep?: boolean; // 保持窗口外部点击时不关闭

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    const panel = this.panel = document.createElement('div');
    panel.className = 'geometry';
    panel.style.display = 'none';
    dom.appendChild(panel);

    let idx = -1;
    let isDrag = false;
    let isControl = false;
    let isMove = false;
    let target: HTMLElement;
    let ox = 0; // panel
    let oy = 0;
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
        idx = +target.getAttribute('title')!;
        if (!isNaN(idx)) {
          const x = e.offsetX;
          const y = e.offsetY;
          const scale = root.getCurPageZoom(true);
          if (node instanceof Polyline) {
            const points = getPolylineCoords(node, +target.getAttribute('idx')!, scale);
            const p = getPointWithDByApprox(points, x, y);
            if (p && p.d <= 5) {
              console.log(idx, p);
              const a = sliceBezier(points, 0, p.t);
              const b = sliceBezier(points, p.t, 1);
            }
          }
        }
      }
      else if (tagName === 'SPAN') {
        isControl = true;
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

    // 侦听在path上的移动，高亮当前path以及投影点
    let pathIdx = -1;
    let pj;
    panel.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      pj = panel.querySelector('.pj') as HTMLElement;
      if (tagName === 'PATH') {
        pathIdx = +target.getAttribute('title')!;
        if (isNaN(pathIdx)) {
          pathIdx = -1;
        }
        else {
          pathIdx = +target.getAttribute('idx')!;
        }
      }
      else {
        pathIdx = -1;
      }
    });
    panel.addEventListener('mousemove', (e) => {
      const node = this.node;
      if (pathIdx > -1 && node) {
        const x = e.offsetX;
        const y = e.offsetY;
        const scale = root.getCurPageZoom(true);
        if (node instanceof Polyline) {
          const points = getPolylineCoords(node, pathIdx, scale);
          const p = getPointWithDByApprox(points, x, y);
          panel.querySelector('svg.stroke .cur')?.classList.remove('cur');
          panel.querySelector('svg.interactive .cur')?.classList.remove('cur');
          panel.querySelector('.pt.cur')?.classList.remove('cur');
          if (p && p.d <= 5) {
            panel.querySelector(`svg.stroke path[idx="${pathIdx}"]`)?.classList.add('cur');
            panel.querySelector(`svg.interactive path[idx="${pathIdx}"]`)?.classList.add('cur');
            pj!.style.left = p.x + 'px';
            pj!.style.top = p.y + 'px';
            pj!.classList.add('cur');
          }
          else {
            pj!.classList.remove('cur');
          }
        }
      }
    });
    panel.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'PATH') {
        panel.querySelector('svg.stroke .cur')?.classList.remove('cur');
        panel.querySelector('svg.interactive .cur')?.classList.remove('cur');
      }
      pathIdx = -1;
      pj!.classList.remove('cur');
    });

    // 操作过程组织滚轮拖动
    panel.addEventListener('wheel', (e) => {
      console.log(isDrag, isControl)
      if (isDrag || isControl) {
        e.stopPropagation();
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

  show(node: Polyline | ShapeGroup) {
    this.node = node;
    this.panel.innerHTML = '';
    this.updateSize(node);
    this.genVertex(node);
    this.updateVertex(node);
  }

  hide() {
    this.panel.style.display = 'none';
    this.panel.innerHTML = '';
    this.node = undefined;
    this.keep = false;
  }

  update() {
    if (this.node) {
      this.updateSize(this.node);
      this.updateVertex(this.node);
    }
  }

  updateSize(node: Polyline | ShapeGroup) {
    const panel = this.panel;
    const res = this.listener.select.calRect(node);
    panel.style.left = res.left + 'px';
    panel.style.top = res.top + 'px';
    panel.style.width = res.width + 'px';
    panel.style.height = res.height + 'px';
    panel.style.transform = res.transform;
    panel.style.display = 'block';
  }

  genVertex(node: Polyline | ShapeGroup) {
    const panel = this.panel;
    const points = node.props.points;
    panel.innerHTML += `<svg class="stroke"></svg><svg class="interactive"></svg>`;
    const svg1 = panel.querySelector('svg.stroke') as SVGElement;
    const svg2 = panel.querySelector('svg.interactive') as SVGElement;
    let s = '';
    let s2 = '';
    const len = points.length;
    let count = 0;
    points.forEach((item, i) => {
      if (item.curveMode === CURVE_MODE.NONE || item.curveMode === CURVE_MODE.STRAIGHT) {
        s2 += `<div class="vt" title="${i}"></div>`;
        // 最后一个判断是否闭合
        if (item.cornerRadius && (i < len || node.props.isClosed)) {
          s += `<path title="cr${i}" idx="${count++}" d=""></path>`;
        }
        if (i < len || node.props.isClosed) {
          s += `<path title="${i}" idx="${count++}" d=""></path>`;
        }
      }
      else {
        s2 += `<div class="vt" title="${i}">`;
        if (item.hasCurveTo) {
          s2 += '<span><b></b></span>';
        }
        if (item.hasCurveFrom) {
          s2 += '<span><b></b></span>';
        }
        s2 += '</div>';
        // 最后一个判断是否闭合
        if (i < len || node.props.isClosed) {
          s += `<path title="${i}" idx="${count++}" d=""></path>`;
        }
      }
    });
    svg1.innerHTML = s;
    svg2.innerHTML = s;
    panel.innerHTML += s2 + '<div class="pj"></div>';
  }

  updateVertex(node: Polyline | ShapeGroup) {
    const panel = this.panel;
    const zoom = node.root!.getCurPageZoom(true) || 1;
    if (node instanceof Polyline) {
      const points = node.props.points;
      const coords = node.coords!;
      const vts = panel.querySelectorAll('.vt');
      const paths1 = panel.querySelectorAll('svg.stroke path');
      const paths2 = panel.querySelectorAll('svg.interactive path');
      points.forEach((item, i) => {
        const div = vts[i] as HTMLElement;
        if (div) {
          div.style.transform = `translate(${item.absX! * zoom}px, ${item.absY! * zoom}px)`;
          const spans = div.querySelectorAll('span');
          if (item.curveMode !== CURVE_MODE.NONE && item.curveMode !== CURVE_MODE.STRAIGHT) {
            const [prev, next] = spans;
            const list: { el: HTMLElement, cx: number, cy: number }[] = [];
            if (item.hasCurveTo && prev) {
              list.push({
                el: prev,
                cx: item.absTx!,
                cy: item.absTy!,
              });
            }
            if (item.hasCurveFrom && next) {
              list.push({
                el: next,
                cx: item.absFx!,
                cy: item.absFy!,
              });
            }
            list.forEach((item2) => {
              const { el, cx, cy } = item2;
              const x = (cx - item.absX!) * zoom;
              const y = (cy - item.absY!) * zoom;
              el.style.transform = `translate(${x}px, ${y}px)`;
              const d = Math.sqrt(x * x + y * y);
              const b = el.firstElementChild as HTMLElement;
              b.style.width = d + 'px';
              b.style.transform = `rotateZ(${getRotate(-x, -y) || 0}deg)`;
            });
          }
        }
      });
      coords.forEach((item, i) => {
        if (paths1[i] && paths2[i]) {
          let d = 'M' + item.slice(-2).map(n => n * zoom).join(',');
          const next = coords[i + 1] || coords[0];
          const title = paths1[i].getAttribute('title') || '';
          const idx = parseInt(title);
          if (isNaN(idx)) {
            d += 'L';
            const j = parseInt(/\d+/.exec(title)![0]);
            d += points[j].absX! * zoom + ',' + points[j].absY! * zoom;
            d += 'L';
            d += next.slice(-2).map(n => n * zoom).join(',');
          }
          else if (next) {
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
          }
          paths1[i].setAttribute('d', d);
          paths2[i].setAttribute('d', d);
        }
      });
    }
  }

  updatePos() {
    const node = this.node;
    if (node) {
      this.updateSize(node);
    }
  }
}

function getPolylineCoords(node: Polyline, idx: number, scale: number) {
  const coords = node.coords!;
  const prev = coords[idx].slice(-2);
  const next = coords[idx + 1] || coords[0];
  const points: { x: number; y: number }[] = [];
  points.push({ x: prev[0] * scale, y: prev[1] * scale });
  for (let i = 0, len = next.length; i < len; i += 2) {
    points.push({ x: next[i] * scale, y: next[i + 1] * scale });
  }
  return points;
}

function getRotate(x: number, y: number) {
  if (x === 0) {
    if (y >= 0) {
      return 90;
    }
    else {
      return -90;
    }
  }
  if (y === 0) {
    if (x >= 0) {
      return 0;
    }
    else {
      return 180;
    }
  }
  const atan = Math.atan(y / x);
  const deg = r2d(atan);
  if (x > 0) {
    if (y >= 0) {
      return deg;
    }
    else {
      return deg;
    }
  }
  else if (x < 0) {
    if (y >= 0) {
      return 180 + deg;
    }
    else {
      return 180 + deg;
    }
  }
}
