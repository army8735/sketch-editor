import Panel from './Panel';
import Root from '../node/Root';
import Listener from './Listener';
import State from './State';
import Polyline from '../node/geom/Polyline';
import { CURVE_MODE } from '../style/define';
import { Point } from '../format';
import { clone } from '../util/type';
import PointCommand from '../history/PointCommand';
import { getPointsAbsByDsp, getPointsDspByAbs } from '../tools/polyline';
import { toPrecision } from '../math';

const html = `
  <h4 class="panel-title">锚点</h4>
  <div class="line coords">
    <div class="input-unit">
      <input type="number" class="x" step="1"/>
      <span class="unit">X</span>
    </div>
    <div class="input-unit">
      <input type="number" class="y" step="1"/>
      <span class="unit">Y</span>
    </div>
  </div>
  <div class="intro">类型</div>
  <ul class="line type">
    <li class="straight" title="直线"></li>
    <li class="mirrored" title="对称曲线"></li>
    <li class="disconnected" title="断开连接"></li>
    <li class="asymmetric" title="不对称曲线"></li>
  </ul>
  <div class="intro">半径</div>
  <div class="line num">
    <input type="range" min="0" max="100" step="1" value="0"/>
    <div class="input-unit">
      <input type="number" class="r" min="0" max="100" step="1" value=""/>
    </div>
  </div>
`;

class PointPanel extends Panel {
  panel: HTMLElement;
  nodes: Polyline[];

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);
    this.nodes = [];

    const panel = this.panel = document.createElement('div');
    panel.className = 'point-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    dom.appendChild(panel);

    const nodes: Polyline[] = [];
    const prevPoint: Point[][] = [];

    panel.addEventListener('click', (e) => {
      this.silence = true;
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      const classList = target.classList;
      const { geometry: { nodes: nodes2, nodeIdxes, idxes } } = listener;
      nodeIdxes.forEach((nodeIdx, i) => {
        const node = nodes2[nodeIdx];
        const is = idxes[i] || [];
        if (is.length) {
          nodes.push(node);
          prevPoint.push(clone(node.props.points));
        }
      });
      if (tagName === 'LI' && !classList.contains('cur')) {
        panel.querySelector('.type .cur')?.classList.remove('cur');
        classList.add('cur');
        nodes.splice(0);
        prevPoint.splice(0);
        nodeIdxes.forEach((nodeIdx, i) => {
          const node = nodes2[nodeIdx];
          const is = idxes[i] || [];
          if (is.length) {
            nodes.push(node);
            prevPoint.push(clone(node.props.points));
            const points = is.map(i => node.props.points[i]);
            points.forEach(p => {
              p.hasCurveTo = p.hasCurveFrom = true;
              if (classList.contains('mirrored')) {
                p.curveMode = CURVE_MODE.MIRRORED;
                // 前后控制点都有则后面的跟随前面的，否则没有的跟随有的
                if (p.hasCurveTo) {
                  const dx = p.tx - p.x;
                  const dy = p.ty - p.y;
                  p.fx = p.x - dx;
                  p.fy = p.y - dy;
                }
                else if (p.hasCurveFrom) {
                  const dx = p.fx - p.x;
                  const dy = p.fy - p.y;
                  p.tx = p.x - dx;
                  p.ty = p.y - dy;
                }
                // 都没有默认设置和前后点x/y的差值
                else {
                  const prev = points[i - 1] || points[points.length - 1];
                  p.tx = (prev.x + p.x) * 0.5;
                  p.ty = (prev.y + p.y) * 0.5;
                  const dx = p.tx - p.x;
                  const dy = p.ty - p.y;
                  p.fx = p.x - dx;
                  p.fy = p.y - dy;
                }
                p.hasCurveFrom = true;
                p.hasCurveTo = true;
              }
              else if (classList.contains('disconnected')) {
                p.curveMode = CURVE_MODE.DISCONNECTED;
              }
              else if (classList.contains('asymmetric')) {
                p.curveMode = CURVE_MODE.ASYMMETRIC;
                const dt = Math.sqrt(Math.pow(p.tx - p.x, 2) + Math.pow(p.ty - p.y, 2));
                const df = Math.sqrt(Math.pow(p.fx - p.x, 2) + Math.pow(p.fy - p.y, 2));
                // 前后控制点都有或者都没有则后面的跟随前面的，否则没有的跟随有的
                if (p.hasCurveTo || !p.hasCurveFrom && !p.hasCurveTo) {
                  const dx = p.tx - p.x;
                  const dy = p.ty - p.y;
                  p.fx = p.x - dx * df / dt;
                  p.fy = p.y - dy * df / dt;
                }
                else if (p.hasCurveFrom) {
                  const dx = p.fx - p.x;
                  const dy = p.fy - p.y;
                  p.tx = p.x - dx * dt / df;
                  p.ty = p.y - dy * dt / df;
                }
                p.hasCurveFrom = true;
                p.hasCurveTo = true;
              }
              else {
                p.curveMode = CURVE_MODE.STRAIGHT;
                p.hasCurveTo = p.hasCurveFrom = false;
              }
            });
            node.refresh();
          }
          listener.geometry.updateVertex(node, nodeIdx);
        });
        onChange();
      }
      // 不能关闭矢量编辑状态
      listener.geometry.keep = true;
      this.silence = false;
    });

    const onChange = (init = false) => {
      if (nodes.length) {
        nodes.forEach(item => item.checkPointsChange());
        listener.geometry.updateAll(init);
        listener.history.addCommand(new PointCommand(nodes.slice(0), nodes.map((item, i) => {
          return {
            prev: prevPoint[i],
            next: clone(item.props.points),
          };
        })));
        nodes.splice(0);
        prevPoint.splice(0);
      }
    };

    const x = panel.querySelector('input.x') as HTMLInputElement;
    const y = panel.querySelector('input.y') as HTMLInputElement;

    const onInputCoords = (e: Event, isX = true) => {
      this.silence = true;
      const { geometry: { nodes: nodes2, nodeIdxes, idxes } } = listener;
      const value = parseFloat(isX ? x.value : y.value) || 0;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const isFirst = !nodes.length;
      const data: Point[][] = [];
      nodeIdxes.forEach((nodeIdx, i) => {
        const node = nodes2[nodeIdx];
        const is = idxes[i] || [];
        if (is.length) {
          if (isFirst) {
            nodes.push(node);
            prevPoint.push(clone(node.props.points));
          }
          const points = is.map(i => node.props.points[i]);
          points.forEach((item, j) => {
            if (isInput) {
              if (isX) {
                item.dspX = value;
              }
              else {
                item.dspY = value;
              }
              if (!i && !j) {
                if (isX) {
                  x.placeholder = '';
                }
                else {
                  y.placeholder = '';
                }
              }
            }
            else {
              let d = 0;
              if (isX) {
                if (x.placeholder) {
                  d = value;
                }
                else {
                  d = value - item.dspX!;
                }
              }
              else {
                if (y.placeholder) {
                  d = value;
                }
                else {
                  d = value - item.dspY!;
                }
              }
              if (listener.shiftKey) {
                if (d > 0) {
                  d = 10;
                }
                else {
                  d = -10;
                }
              }
              else if (listener.altKey) {
                if (d > 0) {
                  d = 0.1;
                }
                else {
                  d = -0.1;
                }
              }
              if (isX) {
                item.dspX! += d;
                item.dspFx! += d;
                item.dspTx! += d;
              }
              else {
                item.dspY! += d;
                item.dspFy! += d;
                item.dspTy! += d;
              }
              if (!i && !j) {
                if (isX) {
                  if (x.placeholder) {
                    x.value = '';
                  }
                  else {
                    x.value = toPrecision(item.dspX!).toString();
                  }
                }
                else {
                  if (y.placeholder) {
                    y.value = '';
                  }
                  else {
                    y.value = toPrecision(item.dspY!).toString();
                  }
                }
              }
            }
          });
          getPointsAbsByDsp(node, points);
          node.reflectPoints(points);
          node.refresh();
          listener.geometry.updateVertex(node, nodeIdx);
          data.push(points);
        }
      });
      listener.emit(Listener.POINT_NODE, nodes.slice(0), data);
      this.silence = false;
    };

    x.addEventListener('input', (e) => {
      onInputCoords(e, true);
    });
    x.addEventListener('change', () => onChange());

    y.addEventListener('input', (e) => {
      onInputCoords(e, false);
    });
    y.addEventListener('change', () => onChange());

    const range = panel.querySelector('input[type="range"]') as HTMLInputElement;
    const number = panel.querySelector('input.r') as HTMLInputElement;

    let rangeAlt = false; // 半径在0和有之间切换需重新生成path
    range.addEventListener('input', (e) => {
      this.silence = true;
      const  { geometry: { nodes: nodes2, nodeIdxes, idxes } } = listener;
      const value = parseFloat(range.value) || 0;
      rangeAlt = false;
      const isFirst = !nodes.length;
      const data: Point[][] = [];
      nodeIdxes.forEach((nodeIdx, i) => {
        const node = nodes2[nodeIdx];
        const is = idxes[i] || [];
        if (is.length) {
          if (isFirst) {
            nodes.push(node);
            prevPoint.push(clone(node.props.points));
          }
          const points = is.map(i => node.props.points[i]);
          points.forEach(item => {
            if (item.cornerRadius && !value || !item.cornerRadius && value) {
              rangeAlt = true;
            }
            item.cornerRadius = value;
          });
          node.refresh();
          listener.geometry.updateVertex(node, nodeIdx);
          data.push(points);
        }
      });
      range.placeholder = number.placeholder = '';
      number.value = range.value;
      listener.emit(Listener.POINT_NODE, nodes.slice(0), data);
      this.silence = false;
    });
    range.addEventListener('change', () => onChange(rangeAlt));

    number.addEventListener('input', (e) => {
      this.silence = true;
      const  { geometry: { nodes: nodes2, nodeIdxes, idxes } } = listener;
      const value = parseFloat(number.value) || 0;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const isFirst = !nodes.length;
      const data: Point[][] = [];
      nodeIdxes.forEach((nodeIdx, i) => {
        const node = nodes2[nodeIdx];
        const is = idxes[i] || [];
        if (is.length) {
          if (isFirst) {
            nodes.push(node);
            prevPoint.push(clone(node.props.points));
          }
          const points = is.map(i => node.props.points[i]);
          points.forEach((item, j) => {
            if (isInput) {
              item.cornerRadius = value;
              if (!i && !j) {
                range.placeholder = number.placeholder = '';
                range.value = number.value;
              }
            }
            else {
              let d = 0;
              if (number.placeholder) {
                d = value;
              }
              else {
                d = value - item.cornerRadius;
              }
              if (listener.shiftKey) {
                if (d > 0) {
                  d = 10;
                }
                else {
                  d = -10;
                }
              }
              else if (listener.altKey) {
                if (d > 0) {
                  d = 0.1;
                }
                else {
                  d = -0.1;
                }
              }
              item.cornerRadius += d;
              if (!i && !j) {
                if (number.placeholder) {
                  number.value = '';
                }
                else {
                  number.value = toPrecision(item.cornerRadius).toString();
                }
              }
            }
          });
          node.refresh();
          listener.geometry.updateVertex(node, nodeIdx);
          data.push(points);
        }
      });
      listener.emit(Listener.POINT_NODE, nodes.slice(0), data);
      this.silence = false;
    });
    number.addEventListener('change', () => onChange());

    listener.on(Listener.STATE_CHANGE, (prev: State, next: State) => {
      // 出现或消失
      if (next === State.EDIT_GEOM || prev === State.EDIT_GEOM) {
        nodes.splice(0);
        prevPoint.splice(0);
        this.show();
      }
    });

    listener.on([
      Listener.SELECT_POINT,
      Listener.POINT_NODE,
    ], () => {
      nodes.splice(0);
      prevPoint.splice(0);
      this.updateCoords();
      this.updateType();
      this.updateRange();
    });
  }

  override show() {
    const geoms = this.listener.selected.filter(item => item instanceof Polyline);
    const panel = this.panel;
    if (!geoms.length || this.listener.state !== State.EDIT_GEOM) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    this.updateCoords();
    this.updateType();
    this.updateRange();
  }

  updateCoords() {
    const { panel, listener: { geometry: { nodes, nodeIdxes, idxes } } } = this;
    const coords = panel.querySelector('.coords') as HTMLInputElement;
    const x = coords.querySelector('input.x') as HTMLInputElement;
    const y = coords.querySelector('input.y') as HTMLInputElement;
    const xs: number[] = [];
    const ys: number[] = [];
    nodeIdxes.forEach((nodeIdx, i) => {
      const node = nodes[nodeIdx];
      const is = idxes[i] || [];
      if (is.length) {
        const points = is.map(i => node.props.points[i]);
        getPointsDspByAbs(node, points);
        points.forEach(item => {
          if (!xs.includes(item.dspX!)) {
            xs.push(item.dspX!);
          }
          if (!ys.includes(item.dspY!)) {
            ys.push(item.dspY!);
          }
        });
      }
    });
    coords.classList.remove('enable');
    x.value = y.value = '';
    x.placeholder = y.placeholder = '';
    x.disabled = y.disabled = true;
    if (!xs.length) {
      return;
    }
    coords.classList.add('enable');
    x.disabled = y.disabled = false;
    if (xs.length > 1) {
      x.placeholder = '多个';
    }
    else {
      x.value = toPrecision(xs[0]).toString();
    }
    if (ys.length > 1) {
      y.placeholder = '多个';
    }
    else {
      y.value = toPrecision(ys[0]).toString();
    }
  }

  updateType() {
    const { panel, listener: { geometry: { nodes, nodeIdxes, idxes } } } = this;
    const type = panel.querySelector('.type') as HTMLInputElement;
    const ts: CURVE_MODE[] = [];
    nodeIdxes.forEach((nodeIdx, i) => {
      const node = nodes[nodeIdx];
      const is = idxes[i] || [];
      if (is.length) {
        const points = is.map(i => node.props.points[i]);
        points.forEach(item => {
          let { curveMode } = item;
          if (curveMode === CURVE_MODE.NONE) {
            curveMode = CURVE_MODE.STRAIGHT;
          }
          if (!ts.includes(curveMode)) {
            ts.push(curveMode);
          }
        });
      }
    });
    type.classList.remove('enable');
    type.querySelector('.cur')?.classList.remove('cur');
    if (!ts.length) {
      return;
    }
    type.classList.add('enable');
    if (ts.length === 1) {
      let t = 'straight';
      if (ts[0] === CURVE_MODE.MIRRORED) {
        t = 'mirrored';
      }
      else if (ts[0] === CURVE_MODE.DISCONNECTED) {
        t = 'disconnected';
      }
      else if (ts[0] === CURVE_MODE.ASYMMETRIC) {
        t = 'asymmetric';
      }
      panel.querySelector(`.type .${t}`)?.classList.add('cur');
    }
  }

  updateRange() {
    const { panel, listener: { geometry: { nodes, nodeIdxes, idxes } } } = this;
    const num = panel.querySelector('.num') as HTMLElement;
    const range = num.querySelector('input[type="range"]') as HTMLInputElement;
    const number = num.querySelector('input.r') as HTMLInputElement;
    const radius: number[] = [];
    nodeIdxes.forEach((nodeIdx, i) => {
      const node = nodes[nodeIdx];
      const is = idxes[i] || [];
      if (is.length) {
        const points = is.map(i => node.props.points[i]);
        points.forEach(item => {
          if (item.curveMode === CURVE_MODE.NONE || item.curveMode === CURVE_MODE.STRAIGHT) {
            const r = item.cornerRadius;
            if (!radius.includes(r)) {
              radius.push(r);
            }
          }
        });
      }
    });
    num.classList.remove('enable');
    range.value = '0';
    number.value = '';
    range.placeholder = number.placeholder = '';
    range.disabled = number.disabled = true;
    if (!radius.length) {
      return;
    }
    num.classList.add('enable');
    range.disabled = number.disabled = false;
    if (radius.length > 1) {
      range.placeholder = number.placeholder = '多个';
    }
    else {
      range.value = number.value = toPrecision(radius[0]).toString();
    }
  }
}

export default PointPanel;
