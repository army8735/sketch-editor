import Polyline from '../node/geom/Polyline';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Listener from './Listener';
import { getPointWithDByApprox, sliceBezier } from '../math/bezier';
import { CURVE_MODE } from '../style/define';
import { r2d } from '../math/geom';
import { Point } from '../format';
import { clone, equal } from '../util/type';
import PointCommand, { PointData } from '../history/PointCommand';
import { getPointsAbsByDsp, getPointsDspByAbs } from '../tools/polyline';

export default class Geometry {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  panel: HTMLElement;
  keep?: boolean; // 按下整体任意，后续外部冒泡侦听按下识别
  keepVertPath?: boolean; // 按下顶点或边时特殊标识，后续外部冒泡侦听按下识别
  nodes: Polyline[];
  idxes: number[][]; // 当前激活点索引，多个编辑节点下的多个顶点，一维是node索引
  clonePoints: Point[][]; // 同上，编辑前的point数据

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;
    this.nodes = [];
    this.idxes = [];
    this.clonePoints = [];

    const panel = this.panel = document.createElement('div');
    panel.className = 'geometry';
    panel.style.display = 'none';
    dom.appendChild(panel);

    let nodeIdx = -1; // 当前按下的节点索引
    let idx = -1; // 当前按下点的索引
    let isVt = false;
    let isControlF = false;
    let isControlT = false;
    let isMove = false;
    let isSelected = false; // 多选点按下时无法判断意图，抬起时才能判断，另外按下未选要特殊标注
    let isShift = false; // 同上，shift以按下时为准，因为按下后可能松开
    let target: HTMLElement;
    let startX = 0;
    let startY = 0;
    const diff = {
      td: 0,
      fd: 0,
    }; // 按下记录点的位置，拖拽时计算用

    panel.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || listener.spaceKey || !this.nodes.length) {
        return;
      }
      let node: Polyline;
      this.keep = true;
      target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      const classList = target.classList;
      isVt = isControlF = isControlT = isMove = false;
      isSelected = false;
      isShift = false;
      startX = e.clientX;
      startY = e.clientY;
      // 点顶点开始拖拽
      if (tagName === 'DIV' && classList.contains('vt')) {
        this.keepVertPath = true;
        nodeIdx = +target.parentElement!.getAttribute('idx')!;
        idx = parseInt(target.title);
        const idxes = this.idxes[nodeIdx];
        // shift按下时未选择的加入已选，已选的无法判断意图先记录等抬起
        if (listener.shiftKey || listener.metaKey) {
          isShift = true;
          if (idxes.includes(idx)) {
            isSelected = true;
          }
          else {
            idxes.push(idx);
          }
          classList.add('cur');
          target.nextElementSibling?.classList.add('t');
          target.previousElementSibling?.classList.add('f');
        }
        // 无shift看点下的是否是已选，是暂时无法判断意图先记录等抬起
        else if (idxes.includes(idx)) {
          isSelected = true;
        }
        // 无shift单选未选的，将其它节点索引清空，本节点索引只留1个
        else {
          idxes.splice(0);
          idxes.push(idx);
          this.clearCur(idxes);
          classList.add('cur');
          target.nextElementSibling?.classList.add('t');
          target.previousElementSibling?.classList.add('f');
        }
        isVt = true;
        this.setClonePoints();
        this.emitSelectPoint();
      }
      // 点矢量边添加顶点，点后只剩这一个已选
      else if (tagName === 'PATH') {
        nodeIdx = +target.parentElement!.parentElement!.getAttribute('idx')!;
        node = this.nodes[nodeIdx];
        const title = target.getAttribute('title')!;
        idx = parseInt(title); // 这里指向的是第几个path
        // 肯定有，兜底
        if (!isNaN(idx)) {
          const x = e.offsetX;
          const y = e.offsetY;
          const scale = root.getCurPageZoom(true);
          const pts = getPolylineCoords(node, +target.getAttribute('idx')!, scale);
          const p = getPointWithDByApprox(pts, x, y);
          if (p && p.d <= 5) {
            this.keepVertPath = true;
            const div = panel.querySelector(`div.item[idx="${nodeIdx}"]`) as HTMLElement;
            const w = div.clientWidth;
            const h = div.clientHeight;
            const prevPoints = clone(node.points);
            const a = sliceBezier(pts, 0, p.t).map(item => ({ x: item.x / w, y: item.y / h }));
            const b = sliceBezier(pts, p.t, 1).map(item => ({ x: item.x / w, y: item.y / h }));
            const i = parseInt(/\d+/.exec(title)![0]);
            const points = node.points;
            const prev = points[i];
            const next = points[i + 1] || points[0];
            const mx = p.x / w;
            const my = p.y / h;
            const mid: Point = {
              x: mx,
              y: my,
              absX: p.x,
              absY: p.y,
              cornerRadius: 0,
              curveMode: a.length === 2 ? CURVE_MODE.STRAIGHT : CURVE_MODE.ASYMMETRIC,
              fx: mx,
              fy: my,
              absFx: p.x,
              absFy: p.y,
              tx: mx,
              ty: my,
              absTx: p.x,
              absTy: p.y,
              hasCurveFrom: false,
              hasCurveTo: false,
              dspX: 0,
              dspY: 0,
              dspFx: 0,
              dspFy: 0,
              dspTx: 0,
              dspTy: 0,
            };
            if (a.length === 4) {
              prev.fx = a[1].x;
              prev.fy = a[1].y;
              prev.absFx = prev.fx * w;
              prev.absFy = prev.fy * h;
              mid.hasCurveTo = true;
              mid.tx = a[2].x;
              mid.ty = a[2].y;
              mid.absTx = mid.tx * w;
              mid.absTy = mid.ty * h;
              getPointsDspByAbs(node, [prev, mid]);
            }
            else if (a.length === 3) {
              if (prev.hasCurveFrom && prev.curveMode !== CURVE_MODE.NONE && prev.curveMode !== CURVE_MODE.STRAIGHT) {
                prev.fx = a[1].x;
                prev.fy = a[1].y;
                prev.absFx = prev.fx * w;
                prev.absFy = prev.fy * h;
                getPointsDspByAbs(node, prev);
              }
              else {
                mid.hasCurveTo = true;
                mid.tx = a[1].x;
                mid.ty = a[1].y;
                mid.absTx = mid.tx * w;
                mid.absTy = mid.ty * h;
                getPointsDspByAbs(node, mid);
              }
            }
            if (b.length === 4) {
              next.tx = b[2].x;
              next.ty = b[2].y;
              next.absTx = next.tx * w;
              next.absTy = next.ty * h;
              mid.hasCurveFrom = true;
              mid.fx = b[1].x;
              mid.fy = b[1].y;
              mid.absFx = mid.fx * w;
              mid.absFy = mid.fy * h;
              getPointsDspByAbs(node, [next, mid]);
            }
            else if (b.length === 3) {
              if (next.hasCurveTo && next.curveMode !== CURVE_MODE.NONE && next.curveMode !== CURVE_MODE.STRAIGHT) {
                next.tx = b[1].x;
                next.ty = b[1].y;
                next.absTx = next.tx * w;
                next.absTy = next.ty * h;
                getPointsDspByAbs(node, next);
              }
              else {
                mid.hasCurveFrom = true;
                mid.fx = b[1].x;
                mid.fy = b[1].y;
                mid.absFx = mid.fx * w;
                mid.absFy = mid.fy * h;
                getPointsDspByAbs(node, mid);
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
            getPointsDspByAbs(node, mid);
            this.clearCur();
            this.idxes[nodeIdx].splice(0);
            this.idxes[nodeIdx].push(i + 1);
            this.update(node, true);
            const target = div.querySelector(`.vt[title="${i + 1}"]`) as HTMLElement;
            target.classList.add('cur');
            target.nextElementSibling?.classList.add('t');
            target.previousElementSibling?.classList.add('f');
            const data: PointData[] = this.nodes.map(item => {
              if (item === node) {
                return {
                  prev: prevPoints,
                  next: clone(node.points),
                };
              }
            });
            listener.history.addCommand(new PointCommand(this.nodes.slice(0), data), true);
            listener.emit(Listener.POINT_NODE, [node]);
            isVt = true;
            this.setClonePoints();
            pathIdx = -1;
          }
          // 点空了
          else {
            this.clearCur();
            listener.emit(Listener.SELECT_POINT, [], []);
          }
        }
        // 理论进不来兜底，同点空
        else {
          this.clearCur();
          listener.emit(Listener.SELECT_POINT, [], []);
        }
      }
      // 点控制点开始拖拽，只能单选
      else if (tagName === 'SPAN') {
        this.keepVertPath = true;
        const div = target.parentNode as HTMLElement;
        nodeIdx = +div.parentElement!.title;
        node = this.nodes[nodeIdx];
        const idxes = this.idxes[nodeIdx];
        this.clearCur(idxes);
        div.classList.add('cur');
        div.nextElementSibling?.classList.add('t');
        div.previousElementSibling?.classList.add('f');
        // span可能是相邻的顶点控制（激活顶点后选兄弟的），从div识别索引
        idx = parseInt(div.title);
        idxes.splice(0);
        idxes.push(idx);
        const p = node.points[idx];
        if (target.classList.contains('f')) {
          isControlF = true;
        }
        else {
          isControlT = true;
        }
        this.setClonePoints();
        diff.td = Math.sqrt(Math.pow(p.dspX! - p.dspTx!, 2) + Math.pow(p.dspY! - p.dspTy!, 2));
        diff.fd = Math.sqrt(Math.pow(p.dspX! - p.dspFx!, 2) + Math.pow(p.dspY! - p.dspFy!, 2));
      }
      // 点panel自己清空顶点，保持编辑态
      else {
        this.clearCur();
        listener.emit(Listener.SELECT_POINT, [], []);
      }
    });
    // 已选节点可能移出panel范围，所以侦听document
    document.addEventListener('mousemove', (e) => {
      // 当前按下移动的那个point属于的node，用来算diff距离，多个其它node上的point会跟着这个点一起变
      const node = this.nodes[nodeIdx];
      if (!node) {
        return;
      }
      const page = root.getCurPage();
      if (!page) {
        return;
      }
      const dpi = root.dpi;
      const zoom = page.getZoom();
      let dx = Math.round(e.clientX - startX);
      let dy = Math.round(e.clientY - startY);
      let dx2 = Math.round(dx * dpi / zoom);
      let dy2 = Math.round(dy * dpi / zoom);
      // 水平/垂直
      if (listener.shiftKey) {
        if (Math.abs(dx2) >= Math.abs(dy2)) {
          dy = dy2 = 0;
        }
        else {
          dx = dx2 = 0;
        }
      }
      // 拖动顶点，多个顶点的话其它的也随之变动
      if (isVt) {
        const nodes: Polyline[] = [];
        this.nodes.forEach((item, i) => {
          const pts = this.idxes[i].map(j => {
            const p = item.points[j];
            const c = this.clonePoints[i][j];
            p.dspX = c.dspX! + dx2;
            p.dspY = c.dspY! + dy2;
            p.dspFx = c.dspFx! + dx2;
            p.dspFy = c.dspFy! + dy2;
            p.dspTx = c.dspTx! + dx2;
            p.dspTy = c.dspTy! + dy2;
            return p;
          });
          if (pts.length) {
            getPointsAbsByDsp(item, pts);
            item.reflectPoints(pts);
            item.refresh();
            let parent = item.parent;
            if (parent instanceof ShapeGroup) {
              parent.clearPointsUpward(); // ShapeGroup的子节点会递归向上检查
            }
            this.updateVertex(item);
            nodes.push(item);
          }
        });
        listener.emit(Listener.POINT_NODE, nodes);
      }
      // 拖控制点
      else if (isControlF || isControlT) {
        const p = node.points[idx];
        if (isControlF) {
          p.dspFx = this.clonePoints[nodeIdx][idx].dspFx! + dx2;
          p.dspFy = this.clonePoints[nodeIdx][idx].dspFy! + dy2;
        }
        else {
          p.dspTx = this.clonePoints[nodeIdx][idx].dspTx! + dx2;
          p.dspTy = this.clonePoints[nodeIdx][idx].dspTy! + dy2;
        }
        // 镜像和非对称需更改对称点，MIRRORED距离角度对称相等，ASYMMETRIC距离不对称角度对称
        if (p.curveMode === CURVE_MODE.MIRRORED || p.curveMode === CURVE_MODE.ASYMMETRIC) {
          let ratio = 1;
          if (isControlF) {
            if (p.curveMode === CURVE_MODE.ASYMMETRIC) {
              ratio = diff.fd / diff.td;
            }
            const dx = p.dspFx! - p.dspX!;
            const dy = p.dspFy! - p.dspY!;
            p.dspTx = p.dspX! - dx * ratio;
            p.dspTy = p.dspY! - dy * ratio;
          }
          else {
            if (p.curveMode === CURVE_MODE.ASYMMETRIC) {
              ratio = diff.fd / diff.td;
            }
            const dx = p.dspTx! - p.dspX!;
            const dy = p.dspTy! - p.dspY!;
            p.dspFx = p.dspX! - dx * ratio;
            p.dspFy = p.dspY! - dy * ratio;
          }
        }
        getPointsAbsByDsp(node, p);
        node.reflectPoints(p);
        node.refresh();
        let parent = node.parent;
        if (parent instanceof ShapeGroup) {
          parent.clearPointsUpward(); // ShapeGroup的子节点会递归向上检查
        }
        this.updateVertex(node);
        listener.emit(Listener.POINT_NODE, [node]);
      }
      isMove = true;
    });

    document.addEventListener('mouseup', () => {
      const node = this.nodes[nodeIdx];
      if (!node) {
        return;
      }
      // 顶点抬起时特殊判断，没有移动过的多选在已选时点击，shift视为取消选择，非是变为单选
      if (isVt && !isMove && isSelected) {
        if (isShift) {
          panel.querySelector(`div.item[idx="${nodeIdx}"]`)!.querySelector(`div.vt[title="${idx}"]`)?.classList.remove('cur');
          const idxes = this.idxes[nodeIdx];
          const j = idxes.indexOf(idx);
          if (j > -1) {
            idxes.splice(j, 1);
            this.emitSelectPoint();
          }
        }
        else {
          panel.querySelectorAll('div.item')?.forEach((div, i) => {
            div.querySelectorAll('div.vt.cur').forEach(item => {
              const title = +(item as HTMLElement).title;
              if (i !== nodeIdx || title !== idx) {
                item.classList.remove('cur');
              }
            });
          });
          const idxes = this.idxes[nodeIdx];
          idxes.splice(0);
          idxes.push(idx);
          this.clearCur(idxes);
          const target = panel.querySelector(`div.item[idx="${nodeIdx}"]`)!.querySelector(`div.vt[title="${idx}"]`) as HTMLElement;
          const classList = target.classList;
          classList.add('cur');
          target.nextElementSibling?.classList.add('t');
          target.previousElementSibling?.classList.add('f');
          this.emitSelectPoint();
        }
      }
      // 移动可能会回原点，有变化的改变顶点/控制点才更新
      else if (isMove && (isVt || isControlF || isControlT)) {
        const nodes: Polyline[] = [];
        const data: PointData[] = [];
        this.nodes.forEach((item, i) => {
          const a = this.clonePoints[i];
          const b = item.points;
          nodes.push(item);
          if (!equal(a, b, ['x', 'y', 'cornerRadius', 'curveMode', 'fx', 'fy', 'tx', 'ty', 'hasCurveTo', 'hasCurveFrom'])) {
            data.push({
              prev: a,
              next: clone(b),
            });
          }
          // 没变化
          else {
            data.push(undefined);
          }
        });
        if (nodes.length) {
          // move结束可能干扰尺寸，调整后重新设置
          nodes.forEach((item, i) => {
            if (!data[i]) {
              return;
            }
            item.checkPointsChange();
            this.update(item, false);
          });
          listener.history.addCommand(new PointCommand(nodes, data), true);
        }
      }
      isVt = isControlF = isControlT = isMove = false;
    });

    // 侦听在path上的移动，高亮当前path以及投影点
    let pathIdx = -1;
    let pj: HTMLElement;
    panel.addEventListener('mouseover', (e) => {
      // 框选不侦听hover
      if (listener.isMouseDown) {
        return;
      }
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'PATH') {
        nodeIdx = +target.parentElement!.parentElement!.getAttribute('idx')!;
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
      pj = panel.querySelector(`.item[idx="${nodeIdx}"] .pj`) as HTMLElement;
    });

    panel.addEventListener('mousemove', (e) => {
      const node = this.nodes[nodeIdx];
      if (pathIdx > -1 && node) {
        const x = e.offsetX;
        const y = e.offsetY;
        const scale = root.getCurPageZoom(true);
        const points = getPolylineCoords(node, pathIdx, scale);
        const p = getPointWithDByApprox(points, x, y);
        panel.querySelector('svg.stroke .cur')?.classList.remove('cur');
        panel.querySelector('svg.interactive .cur')?.classList.remove('cur');
        panel.querySelector('.pt.cur')?.classList.remove('cur');
        if (p && p.d <= 5) {
          panel.querySelector(`.item[idx="${nodeIdx}"] svg.stroke path[idx="${pathIdx}"]`)?.classList.add('cur');
          panel.querySelector(`.item[idx="${nodeIdx}"] svg.interactive path[idx="${pathIdx}"]`)?.classList.add('cur');
          pj!.style.left = p.x + 'px';
          pj!.style.top = p.y + 'px';
          pj!.classList.add('cur');
        }
        else {
          pj?.classList.remove('cur');
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
      pj?.classList.remove('cur');
    });

    // 操作过程阻止滚轮拖动
    panel.addEventListener('wheel', (e) => {
      if (isVt || isControlF || isControlT) {
        e.stopPropagation();
      }
    });
    // 自身点击设置keep，阻止document全局侦听关闭
    document.addEventListener('click', (e) => {
      if (this.keep || this.keepVertPath) {
        this.keep = false;
        this.keepVertPath = false;
        return;
      }
    });
  }

  show(nodes: Polyline[], idx?: number[][]) {
    this.nodes.splice(0);
    this.nodes.push(...nodes);
    this.idxes.splice(0);
    if (idx) {
      this.idxes.push(...idx);
    }
    else {
      nodes.forEach(() => {
        this.idxes.push([]);
      });
    }
    this.panel.innerHTML = '';
    this.nodes.forEach((node) => {
      getPointsDspByAbs(node);
      this.update(node, true);
    });
    this.panel.style.display = 'block';
  }

  hide() {
    this.panel.style.display = 'none';
    this.panel.innerHTML = '';
    this.nodes.splice(0);
    this.idxes.splice(0);
    this.keep = false;
    this.keepVertPath = false;
  }

  update(node: Polyline, init = false) {
    const nodeIdx = this.nodes.indexOf(node);
    // 一般不可能，防范一下
    if (nodeIdx === -1) {
      return;
    }
    this.updatePosSize(node);
    if (init) {
      this.genVertex(node);
    }
    this.updateVertex(node);
  }

  updateAll(init = false) {
    this.nodes.forEach((item) => {
      this.update(item, init);
    });
  }

  updatePosSize(node: Polyline) {
    const nodeIdx = this.nodes.indexOf(node);
    // 一般不可能，防范一下
    if (nodeIdx === -1) {
      return;
    }
    const panel = this.panel;
    let div = panel.querySelector(`div.item[idx="${nodeIdx}"]`) as HTMLElement;
    if (!div) {
      div = document.createElement('div');
      div.className = 'item';
      div.setAttribute('idx', nodeIdx.toString());
      panel.appendChild(div);
    }
    const res = this.listener.select.calRect(node);
    div.style.left = res.left + 'px';
    div.style.top = res.top + 'px';
    div.style.width = res.width + 'px';
    div.style.height = res.height + 'px';
    div.style.transform = res.transform;
  }

  genVertex(node: Polyline) {
    const nodeIdx = this.nodes.indexOf(node);
    // 一般不可能，防范一下
    if (nodeIdx === -1) {
      return;
    }
    const panel = this.panel;
    const points = node.points;
    const div = panel.querySelector(`div.item[idx="${nodeIdx}"]`) as HTMLElement;
    div.innerHTML = `<svg class="stroke"></svg><svg class="interactive"></svg>`;
    const svg1 = div.querySelector('svg.stroke') as SVGElement;
    const svg2 = div.querySelector('svg.interactive') as SVGElement;
    let s = '';
    let s2 = '';
    const len = points.length;
    let count = 0;
    points.forEach((item, i) => {
      const isStraight = item.curveMode === CURVE_MODE.NONE || item.curveMode === CURVE_MODE.STRAIGHT;
      s2 += `<div class="vt" title="${i}">`;
      s2 += `<span class="t ${isStraight ? 'hide' : ''}"><b></b></span>`;
      s2 += `<span class="f ${isStraight ? 'hide' : ''}"><b></b></span>`;
      s2 += '</div>';
      if (isStraight) {
        // 最后一个判断是否闭合
        if (item.cornerRadius && (i < (len - 1) || node.isClosed)) {
          s += `<path title="cr${i}" idx="${count++}" d=""></path>`;
        }
        if (i < (len - 1) || node.isClosed) {
          s += `<path title="${i}" idx="${count++}" d=""></path>`;
        }
      }
      else {
        // 最后一个判断是否闭合
        if (i < (len - 1) || node.isClosed) {
          s += `<path title="${i}" idx="${count++}" d=""></path>`;
        }
      }
    });
    svg1.innerHTML = s;
    svg2.innerHTML = s;
    div.innerHTML += s2 + '<div class="pj"></div>';
    panel.appendChild(div);
  }

  updateVertex(node: Polyline) {
    const nodeIdx = this.nodes.indexOf(node);
    // 一般不可能，防范一下
    if (nodeIdx === -1) {
      return;
    }
    const idxes = this.idxes[nodeIdx] || [];
    node.buildPoints();
    const panel = this.panel;
    const div = panel.querySelector(`div.item[idx="${nodeIdx}"]`) as HTMLElement;
    const zoom = node.root!.getCurPageZoom(true);
    const points = node.points;
    const coords = node.coords!;
    const vts = div.querySelectorAll('.vt');
    const paths1 = div.querySelectorAll('svg.stroke path');
    const paths2 = div.querySelectorAll('svg.interactive path');
    points.forEach((item, i) => {
      const div = vts[i] as HTMLElement;
      if (div) {
        div.style.transform = `translate(${item.absX * zoom}px, ${item.absY * zoom}px)`;
        // 可能重新生成后丢掉了已选，比如改变radius由0变成正数触发重新生成
        if (idxes.includes(i)) {
          div.classList.add('cur');
        }
        const spans = div.querySelectorAll('span');
        const [prev, next] = spans;
        prev.classList.add('hide');
        next.classList.add('hide');
        if (item.curveMode !== CURVE_MODE.NONE && item.curveMode !== CURVE_MODE.STRAIGHT) {
          const list: { el: HTMLElement, cx: number, cy: number }[] = [];
          if (item.hasCurveTo && prev) {
            prev.classList.remove('hide');
            list.push({
              el: prev,
              cx: item.absTx,
              cy: item.absTy,
            });
          }
          if (item.hasCurveFrom && next) {
            next.classList.remove('hide');
            list.push({
              el: next,
              cx: item.absFx,
              cy: item.absFy,
            });
          }
          list.forEach((item2) => {
            const { el, cx, cy } = item2;
            const x = (cx - item.absX) * zoom;
            const y = (cy - item.absY) * zoom;
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
          d += points[j].absX * zoom + ',' + points[j].absY * zoom;
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

  updateCurPosSize() {
    this.nodes.forEach((item, i) => {
      const idxes = this.idxes[i];
      if (idxes.length) {
        this.updatePosSize(item);
      }
    });
  }

  clearCur(idxes?: number[]) {
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
    this.idxes.forEach(item => {
      if (item !== idxes) {
        item.splice(0);
      }
    });
  }

  hasEditPoint() {
    for (let i = 0, len = this.idxes.length; i < len; i++) {
      if (this.idxes[i].length) {
        return true;
      }
    }
    return false;
  }

  delVertex() {
    const nodes: Polyline[] = [];
    const data: PointData[] = [];
    this.nodes.forEach((item, i) => {
      nodes.push(item);
      const idxes = this.idxes[i];
      if (idxes.length) {
        const prev = clone(item.points);
        idxes.sort((a, b) => b - a);
        idxes.forEach(i => {
          item.points.splice(i, 1);
        });
        item.refresh();
        item.checkPointsChange();
        this.update(item, true);
        data.push({
          prev,
          next: clone(item.points),
        });
      }
      else {
        data.push(undefined);
      }
    });
    if (nodes.length) {
      this.listener.history.addCommand(new PointCommand(nodes, data), true);
    }
  }

  setClonePoints() {
    this.clonePoints = this.nodes.map(item => {
      return clone(item.points);
    });
  }

  emitSelectPoint() {
    const nodes: Polyline[] = [];
    const points: Point[][] = [];
    this.nodes.map((item, i) => {
      const idxes = this.idxes[i];
      if (idxes.length) {
        const list: Point[] = [];
        idxes.forEach(i => {
          list.push(item.points[i]);
        });
        points.push(list);
      }
    });
    this.listener.emit(Listener.SELECT_POINT, nodes, points);
  }

  selectAll() {
    const t: number[][] = [];
    let equal = true;
    this.nodes.forEach((item, i) => {
      const arr: number[] = [];
      const points = item.points;
      for (let i = 0, len = points.length; i < len; i++) {
        arr.push(i);
      }
      t.push(arr);
      if (equal && (this.idxes[i] || []).join(',') !== arr.join(',')) {
        equal = false;
      }
    });
    if (!equal) {
      this.idxes.splice(0);
      this.idxes.push(...t);
      this.panel.querySelectorAll('.f,.t')?.forEach(item => {
        item.classList.remove('f');
        item.classList.remove('t');
      });
      this.panel.querySelectorAll('div.vt')?.forEach(item => {
        item.classList.add('cur');
      });
      this.emitSelectPoint();
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
