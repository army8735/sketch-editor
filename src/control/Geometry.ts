import Polyline from '../node/geom/Polyline';
import Root from '../node/Root';
import Listener from './Listener';
import { getPointWithDByApprox, sliceBezier } from '../math/bezier';
import ShapeGroup from '../node/geom/ShapeGroup';
import { CORNER_STYLE, CURVE_MODE } from '../style/define';
import { r2d } from '../math/geom';
import { Point } from '../format';
import { clone, equal } from '../util/type';
import PointCommand from '../history/PointCommand';

export default class Geometry {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  panel: HTMLElement;
  node?: Polyline | ShapeGroup;
  keep?: boolean; // 保持窗口外部点击时不关闭
  idx: number[]; // 当前激活点索引
  clonePoints: Point[];

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;
    this.idx = [];
    this.clonePoints = [];

    const panel = this.panel = document.createElement('div');
    panel.className = 'geometry';
    panel.style.display = 'none';
    dom.appendChild(panel);

    let idx = -1;
    let isDrag = false;
    let isControlF = false;
    let isControlT = false;
    let isMove = false;
    let isUnSelected = false; // 多选点按下时无法判断意图，抬起时才能判断，另外按下未选要特殊标注
    let isShift = false; // 同上，shift以按下时为准，因为按下后可能松开
    let target: HTMLElement;
    let ox = 0; // panel
    let oy = 0;
    let w = 1;
    let h = 1;
    const diff = { x: 0, y: 0, tx: 0, ty: 0, fx: 0, fy: 0, td: 0, fd: 0 }; // 按下记录点的位置，拖拽时计算用
    // let clonePoints: Point[];

    panel.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || listener.spaceKey) {
        return;
      }
      const node = this.node;
      if (!node) {
        return;
      }
      target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      const classList = target.classList;
      const o = panel.getBoundingClientRect();
      ox = o.left;
      oy = o.top;
      w = panel.clientWidth;
      h = panel.clientHeight;
      isMove = false;
      isUnSelected = false;
      isShift = false;
      if (tagName === 'DIV' && classList.contains('vt')) {
        this.keep = true;
        idx = parseInt(target.title);
        // shift按下时未选择的加入已选，已选的无法判断意图先记录等抬起判断
        if (listener.shiftKey) {
          isShift = true;
          if (!this.idx.includes(idx)) {
            this.idx.push(idx);
          }
          else {
            isUnSelected = true;
          }
          classList.add('cur');
          target.nextElementSibling?.classList.add('t');
          target.previousElementSibling?.classList.add('f');
        }
        // 无shift看点下的是否是已选，否是单个选择，是则也是无法判断意图
        else if (this.idx.includes(idx)) {
          isUnSelected = true;
        }
        else {
          this.clearCur();
          this.idx.splice(0);
          this.idx.push(idx);
          classList.add('cur');
          target.nextElementSibling?.classList.add('t');
          target.previousElementSibling?.classList.add('f');
        }
        isDrag = true;
        if (node instanceof Polyline) {
          const p = node.props.points[idx];
          diff.x = p.x;
          diff.y = p.y;
          diff.tx = p.tx - p.x;
          diff.ty = p.ty - p.y;
          diff.fx = p.fx - p.x;
          diff.fy = p.fy - p.y;
          this.clonePoints = clone(node.props.points);
        }
        listener.emit(Listener.SELECT_POINT, this.idx.slice(0));
      }
      else if (tagName === 'PATH') {
        const title = target.getAttribute('title')!;
        idx = parseInt(title);
        if (!isNaN(idx)) {
          const x = e.offsetX;
          const y = e.offsetY;
          const scale = root.getCurPageZoom(true);
          if (node instanceof Polyline) {
            const pts = getPolylineCoords(node, +target.getAttribute('idx')!, scale);
            const p = getPointWithDByApprox(pts, x, y);
            if (p && p.d <= 5) {
              this.keep = true;
              const a = sliceBezier(pts, 0, p.t).map(item => ({ x: item.x / w, y: item.y / h }));
              const b = sliceBezier(pts, p.t, 1).map(item => ({ x: item.x / w, y: item.y / h }));
              const i = parseInt(/\d+/.exec(title)![0]);
              const points = node.props.points;
              const prev = points[i];
              const next = points[i + 1] || points[0];
              const mx = p.x / w;
              const my = p.y / h;
              const mid: Point = {
                x: mx,
                y: my,
                cornerRadius: 0,
                cornerStyle: CORNER_STYLE.ROUNDED,
                curveMode: a.length === 2 ? CURVE_MODE.STRAIGHT : CURVE_MODE.ASYMMETRIC,
                fx: mx,
                fy: my,
                tx: mx,
                ty: my,
                hasCurveFrom: false,
                hasCurveTo: false,
              };
              if (a.length === 4) {
                prev.fx = a[1].x;
                prev.fy = a[1].y;
                mid.hasCurveTo = true;
                mid.tx = a[2].x;
                mid.ty = a[2].y;
              }
              else if (a.length === 3) {
                if (prev.hasCurveFrom && prev.curveMode !== CURVE_MODE.NONE && prev.curveMode !== CURVE_MODE.STRAIGHT) {
                  prev.fx = a[1].x;
                  prev.fy = a[1].y;
                }
                else {
                  mid.hasCurveTo = true;
                  mid.tx = a[1].x;
                  mid.ty = a[1].y;
                }
              }
              if (b.length === 4) {
                next.tx = b[2].x;
                next.ty = b[2].y;
                mid.hasCurveFrom = true;
                mid.fx = b[1].x;
                mid.fy = b[1].y;
              }
              else if (b.length === 3) {
                if (next.hasCurveTo && next.curveMode !== CURVE_MODE.NONE && next.curveMode !== CURVE_MODE.STRAIGHT) {
                  next.tx = b[1].x;
                  next.ty = b[1].y;
                }
                else {
                  mid.hasCurveFrom = true;
                  mid.fx = b[1].x;
                  mid.fy = b[1].y;
                }
              }
              // 曲线类型默认断开，如果对称就设置镜像
              if (mid.hasCurveTo && mid.hasCurveFrom) {
                const dfx = mid.fx - mid.x;
                const dfy = mid.fy - mid.y;
                const dtx = mid.x - mid.tx;
                const dty = mid.y - mid.ty;
                const df = Math.sqrt(Math.pow(dfx, 2) + Math.pow(dfy, 2));
                const dt = Math.sqrt(Math.pow(dtx, 2) + Math.pow(dty, 2));
                if (Math.abs(dt - df) < 1e-6 && Math.abs(dfx - dtx) < 1e-6 && Math.abs(dfy - dty) < 1e-6) {
                  mid.curveMode = CURVE_MODE.MIRRORED;
                }
              }
              else if (mid.hasCurveTo || mid.hasCurveFrom) {
                mid.curveMode = CURVE_MODE.DISCONNECTED;
              }
              points.splice(i + 1, 0, mid);
              node.refresh();
              node.checkPointsChange();
              this.show(node);
              this.idx.splice(0);
              this.idx.push(i + 1);
              listener.history.addCommand(new PointCommand([node], [{
                prev: clone(node.props.points),
                next: this.clonePoints.slice(0),
              }]), true);
              listener.emit(Listener.POINT_NODE, [node]);
              listener.emit(Listener.SELECT_POINT, this.idx.slice(0));
            }
            else {
              this.idx.splice(0);
              listener.emit(Listener.SELECT_POINT, []);
            }
          }
        }
        else {
          this.idx.splice(0);
          listener.emit(Listener.SELECT_POINT, []);
        }
      }
      else if (tagName === 'SPAN') {
        this.keep = true;
        const div = target.parentNode as HTMLElement;
        // span可能是相邻的顶点控制，所以不记录顶点
        idx = parseInt(div.title);
        const p = node.props.points[idx];
        if (target.classList.contains('f')) {
          isControlF = true;
        }
        else {
          isControlT = true;
        }
        diff.td = Math.sqrt(Math.pow(p.x - p.tx, 2) + Math.pow(p.y - p.tx, 2));
        diff.fd = Math.sqrt(Math.pow(p.x - p.fx, 2) + Math.pow(p.y - p.fx, 2));
      }
      else {
        this.idx.splice(0);
        listener.emit(Listener.SELECT_POINT, []);
      }
    });
    document.addEventListener('mousemove', (e) => {
      const node = this.node;
      if (!node) {
        return;
      }
      isMove = true;
      const x = (e.pageX - ox) / w;
      const y = (e.pageY - oy) / h;
      if (isDrag) {
        if (node instanceof Polyline) {
          const points = node.props.points;
          const p = points[idx];
          const dx = x - this.clonePoints[idx].x;
          const dy = y - this.clonePoints[idx].y;
          p.x = x;
          p.absX = x * w;
          p.y = y;
          p.absY = x * h;
          p.tx = p.x + diff.tx;
          p.absTx = p.tx * w;
          p.ty = p.y + diff.ty;
          p.absTy = p.ty * h;
          p.fx = p.x + diff.fx;
          p.absFx = p.fx * w;
          p.fy = p.y + diff.fy;
          p.absFy = p.fy * h;
          // 多个点的话其它的也随之变动
          this.idx.forEach(i => {
            if (i !== idx) {
              const p = points[i];
              const cp = this.clonePoints[i];
              p.x = cp.x + dx;
              p.absX = p.x * w;
              p.y = cp.y + dy;
              p.absY = p.y * h;
              p.tx = cp.tx + dx;
              p.absTx = p.tx * w;
              p.ty = cp.ty + dy;
              p.absTy = p.ty * h;
              p.fx = cp.fx + dx;
              p.absFx = p.fx * w;
              p.fy = cp.fy + dy;
              p.absFy = p.fy * h;
            }
          });
          node.refresh();
          this.updateVertex(node);
        }
        listener.emit(Listener.POINT_NODE, [node]);
      }
      else if (isControlF || isControlT) {
        if (node instanceof Polyline) {
          const p = node.props.points[idx];
          if (isControlF) {
            p.fx = x;
            p.absFx = x * w;
            p.fy = y;
            p.absFy = y * h;
          }
          else {
            p.tx = x;
            p.absTx = x * w;
            p.ty = y;
            p.absTy = y * h;
          }
          // 镜像和非对称需更改对应点
          if (p.curveMode === CURVE_MODE.MIRRORED || p.curveMode === CURVE_MODE.ASYMMETRIC) {
            let ratio = 1;
            if (isControlF) {
              if (p.curveMode === CURVE_MODE.ASYMMETRIC) {
                ratio = diff.fd / Math.sqrt(Math.pow(p.fx - p.x, 2) + Math.pow(p.fy - p.y, 2)) * diff.td;
              }
              const dx = p.fx - p.x;
              const dy = p.fy - p.y;
              p.tx = p.x - dx * ratio;
              p.absTx = p.tx * w;
              p.ty = p.y - dy * ratio;
              p.absTy = p.ty * h;
            }
            else {
              if (p.curveMode === CURVE_MODE.ASYMMETRIC) {
                ratio = diff.td / Math.sqrt(Math.pow(p.tx - p.x, 2) + Math.pow(p.ty - p.y, 2)) * diff.fd;
              }
              const dx = p.tx - p.x;
              const dy = p.ty - p.y;
              p.fx = p.x - dx * ratio;
              p.absFx = p.fx * w;
              p.fy = p.y - dy * ratio;
              p.absFy = p.fy * h;
            }
          }
          node.refresh();
          this.updateVertex(node);
        }
        listener.emit(Listener.POINT_NODE, [node]);
      }
    });
    document.addEventListener('mouseup', () => {
      if (isDrag || isControlF || isControlT) {
        // 顶点抬起时特殊判断，没有移动过的多选在已选时视为取消选择，没有移动过多单选取消其它的
        if (isDrag && !isMove && isUnSelected) {
          if (isShift) {
            panel.querySelector(`.vt[title="${idx}"]`)?.classList.remove('cur');
            const i = this.idx.indexOf(idx);
            if (i > -1) {
              this.idx.splice(i, 1);
              listener.emit(Listener.SELECT_POINT, this.idx.slice(0));
            }
          }
          else {
            panel.querySelectorAll('.vt.cur').forEach((item) => {
              if ((item as HTMLElement).title !== idx.toString()) {
                item.classList.remove('cur');
              }
            });
            this.idx.splice(0);
            this.idx.push(idx);
            listener.emit(Listener.SELECT_POINT, this.idx.slice(0));
          }
        }
        isDrag = isControlF = isControlT = false;
        const node = this.node;
        if (node instanceof Polyline) {
          let eq = this.clonePoints.length === node.props.points.length;
          if (eq) {
            for (let i = 0; i < this.clonePoints.length; i++) {
              const a = this.clonePoints[i];
              const b = node.props.points[i];
              if (!equal(a, b, ['x', 'y', 'cornerRadius', 'cornerStyle', 'curveMode', 'fx', 'fy', 'tx', 'ty', 'hasCurveTo', 'hasCurveFrom'])) {
                eq = false;
                break;
              }
            }
          }
          if (!eq) {
            listener.history.addCommand(new PointCommand([node], [{
              prev: this.clonePoints.slice(0),
              next: clone(node.props.points),
            }]), true);
          }
        }
        listener.emit(Listener.POINT_NODE, [node]);
      }
    });

    // 侦听在path上的移动，高亮当前path以及投影点
    let pathIdx = -1;
    let pj;
    panel.addEventListener('mouseover', (e) => {
      // 框选不侦听hover
      if (listener.isMouseDown) {
        return;
      }
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

    // 操作过程阻止滚轮拖动
    panel.addEventListener('wheel', (e) => {
      if (isDrag || isControlF || isControlT) {
        e.stopPropagation();
      }
    });
    // 自身点击设置keep，阻止document全局侦听关闭
    document.addEventListener('click', () => {
      if (this.keep) {
        this.keep = false;
        return;
      }
      // 直接关，外部框选不关由listener设置keep
      listener.cancelEditGeom();
    });
  }

  show(node: Polyline | ShapeGroup) {
    this.node = node;
    this.panel.innerHTML = '';
    this.updatePosSize(node);
    this.genVertex(node);
    this.updateVertex(node);
    this.idx.splice(0);
  }

  hide() {
    this.panel.style.display = 'none';
    this.panel.innerHTML = '';
    this.node = undefined;
    this.keep = false;
  }

  update() {
    const node = this.node;
    if (!node) {
      return;
    }
    this.updatePosSize(node);
    this.updateVertex(node);
  }

  updatePosSize(node: Polyline | ShapeGroup) {
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
          s2 += '<span class="t"><b></b></span>';
        }
        if (item.hasCurveFrom) {
          s2 += '<span class="f"><b></b></span>';
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
    node.buildPoints();
    const panel = this.panel;
    const zoom = node.root!.getCurPageZoom(true);
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
      this.updatePosSize(node);
    }
  }

  clearCur() {
    const panel = this.panel;
    panel.querySelectorAll('div.cur')?.forEach(div => {
      div.classList.remove('cur');
    });
    panel.querySelectorAll('div.f')?.forEach(div => {
      div.classList.remove('f');
    });
    panel.querySelectorAll('div.t')?.forEach(div => {
      div.classList.remove('t');
    });
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
