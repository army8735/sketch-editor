import Panel from './Panel';
import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import State from './State';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';
import { CURVE_MODE } from '../style/define';
import { Point } from '../format';
import { clone } from '../util/type';
import PointCommand from '../history/PointCommand';
import { getPointsAbsByDsp, getPointsDspByAbs } from '../tools/polyline';
import { toPrecision } from '../math';

const html = `
  <h4 class="panel-title">锚点</h4>
  <div class="line">
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
  <ul class="type">
    <li class="straight" title="直线"></li>
    <li class="mirrored" title="对称曲线"></li>
    <li class="disconnected" title="断开连接"></li>
    <li class="asymmetric" title="不对称曲线"></li>
  </ul>
  <div class="intro">半径</div>
  <div class="line">
    <input type="range" min="0" max="100" step="1" value="0"/>
    <div class="input-unit">
      <input type="number" class="r" min="0" max="100" step="1" value=""/>
    </div>
  </div>
`;

class PointPanel extends Panel {
  panel: HTMLElement;
  node?: Polyline | ShapeGroup;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'point-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    dom.appendChild(panel);

    panel.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      const classList = target.classList;
      const node = this.node;
      if (tagName === 'LI' && !classList.contains('cur') && node) {
        panel.querySelector('.type .cur')?.classList.remove('cur');
        classList.add('cur');
        const points = node.props.points;
        listener.geometry.idx.forEach(i => {
          const p = points[i];
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
          }
        });
        node.refresh();
        listener.geometry.updateVertex(node);
      }
      // 不能关闭矢量编辑状态
      listener.geometry.keep = true;
    });

    let prevPoint: Point[] = [];
    const onChange = () => {
      listener.geometry.update();
      const node = this.node;
      if (node instanceof Polyline) {
        listener.history.addCommand(new PointCommand([node], [{
          prev: prevPoint.slice(0),
          next: clone(node.props.points),
        }]));
        prevPoint.splice(0);
      }
    };

    const x = panel.querySelector('input.x') as HTMLInputElement;
    const y = panel.querySelector('input.y') as HTMLInputElement;

    const onInputCoords = (e: Event, isX = true) => {
      const node = this.node;
      if (!node) {
        return;
      }
      this.silence = true;
      const value = parseFloat(isX ? x.value : y.value) || 0;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const isFirst = !prevPoint.length;
      if (isFirst) {
        if (node instanceof Polyline) {
          prevPoint = clone(node.props.points);
        }
      }
      if (node instanceof Polyline) {
        const points = listener.geometry.idx.map(i => node.props.points[i]);
        points.forEach((item, i) => {
          if (isInput) {
            if (isX) {
              item.dspX = value;
            }
            else {
              item.dspY = value;
            }
            if (!i) {
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
            if (!i) {
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
      }
      node.refresh();
      listener.geometry.updateVertex(node);
      listener.emit(Listener.POINT_NODE, [node]);
      this.silence = false;
    };

    x.addEventListener('input', (e) => {
      onInputCoords(e, true);
    });
    x.addEventListener('change', onChange);

    y.addEventListener('input', (e) => {
      onInputCoords(e, false);
    });
    y.addEventListener('change', onChange);

    const range = panel.querySelector('input[type="range"]') as HTMLInputElement;
    const number = panel.querySelector('input.r') as HTMLInputElement;

    range.addEventListener('input', (e) => {
      const node = this.node;
      if (!node) {
        return;
      }
      this.silence = true;
      if (!prevPoint.length) {
        if (node instanceof Polyline) {
          prevPoint = clone(node.props.points);
        }
      }
      const value = parseFloat(range.value) || 0;
      if (node instanceof Polyline) {
        let points = node.props.points;
        // 激活的顶点或者全部
        if (listener.geometry.idx.length) {
          points = listener.geometry.idx.map(i => points[i]);
        }
        points.forEach(item => {
          item.cornerRadius = value;
        });
      }
      range.placeholder = number.placeholder = '';
      number.value = range.value;
      node.refresh();
      listener.geometry.updateVertex(node);
      listener.emit(Listener.POINT_NODE, [node]);
      this.silence = false;
    });
    range.addEventListener('change', onChange);

    number.addEventListener('input', (e) => {
      const node = this.node;
      if (!node) {
        return;
      }
      this.silence = true;
      const value = parseFloat(number.value) || 0;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      if (!prevPoint.length) {
        if (node instanceof Polyline) {
          prevPoint = clone(node.props.points);
        }
      }
      if (node instanceof Polyline) {
        let points = node.props.points;
        // 激活的顶点或者全部
        if (listener.geometry.idx.length) {
          points = listener.geometry.idx.map(i => points[i]);
        }
        points.forEach((item, i) => {
          if (isInput) {
            item.cornerRadius = value;
            if (!i) {
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
            if (!i) {
              if (number.placeholder) {
                number.value = '';
              }
              else {
                number.value = toPrecision(item.cornerRadius).toString();
              }
            }
          }
        });
      }
      node.refresh();
      listener.geometry.updateVertex(node);
      listener.emit(Listener.POINT_NODE, [node]);
      this.silence = false;
    });
    number.addEventListener('change', onChange);

    listener.on(Listener.STATE_CHANGE, (prev: State, next: State) => {
      if (next === State.EDIT_GEOM || prev === State.EDIT_GEOM) {
        this.show(listener.selected);
      }
    });

    const showPoint = (idx: number[]) => {
      if (this.silence) {
        return;
      }
      this.updateCoords(idx);
      this.updateRange(idx);
      panel.querySelector('.type.enable')?.classList.remove('enable');
      panel.querySelector('.type .cur')?.classList.remove('cur');
      if (idx.length) {
        panel.querySelector('.type')?.classList.add('enable');
        const node = this.node;
        const type: CURVE_MODE[] = [];
        if (node instanceof Polyline) {
          idx.forEach(i => {
            const p = node.props.points[i];
            let { curveMode } = p;
            if (curveMode === CURVE_MODE.NONE) {
              curveMode = CURVE_MODE.STRAIGHT;
            }
            if (!type.includes(curveMode)) {
              type.push(curveMode);
            }
          });
        }
        if (type.length === 1) {
          let t = 'straight';
          if (type[0] === CURVE_MODE.MIRRORED) {
            t = 'mirrored';
          }
          else if (type[0] === CURVE_MODE.DISCONNECTED) {
            t = 'disconnected';
          }
          else if (type[0] === CURVE_MODE.ASYMMETRIC) {
            t = 'asymmetric';
          }
          panel.querySelector(`.type .${t}`)?.classList.add('cur');
        }
      }
    };

    listener.on(Listener.SELECT_POINT, showPoint);
    listener.on(Listener.POINT_NODE, (node) => {
      showPoint(listener.geometry.idx);
    });
  }

  override show(nodes: Node[]) {
    const geoms = nodes.filter(item => item instanceof Polyline || item instanceof ShapeGroup);
    this.nodes = geoms;
    const panel = this.panel;
    if (!geoms.length || this.listener.state !== State.EDIT_GEOM) {
      panel.style.display = 'none';
      return;
    }
    this.node = geoms[0];
    panel.style.display = 'block';
    this.updateCoords([]);
    this.updateRange([]);
  }

  updateCoords(idx: number[]) {
    const node = this.node;
    if (!node) {
      return;
    }
    const panel = this.panel;
    const x = panel.querySelector('input.x') as HTMLInputElement;
    const y = panel.querySelector('input.y') as HTMLInputElement;
    if (!idx.length) {
      x.value = y.value = '';
      x.placeholder = y.placeholder = '';
      return;
    }
    const xs: number[] = [];
    const ys: number[] = [];
    if (node instanceof Polyline) {
      const points = idx.map(i => node.props.points[i]);
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

  updateRange(idx: number[]) {
    const node = this.node;
    if (!node) {
      return;
    }
    const panel = this.panel;
    const range = panel.querySelector('input[type="range"]') as HTMLInputElement;
    const number = panel.querySelector('input.r') as HTMLInputElement;
    if (!idx.length) {
      range.value = '0';
      number.value = '';
      range.placeholder = number.placeholder = '';
      return;
    }
    const radius: number[] = [];
    if (node instanceof Polyline) {
      let points = node.props.points;
      // 默认展示全部
      if (idx.length) {
        points = idx.map(i => points[i]);
      }
      points.forEach(item => {
        if (item.curveMode === CURVE_MODE.NONE || item.curveMode === CURVE_MODE.STRAIGHT) {
          const r = item.cornerRadius;
          if (!radius.includes(r)) {
            radius.push(r);
          }
        }
      });
    }
    if (!radius.length) {
      radius.push(0);
    }
    if (radius.length > 1) {
      range.placeholder = number.placeholder = '多个';
      range.value = '0';
      number.value = '';
    }
    else {
      range.placeholder = number.placeholder = '';
      range.value = number.value = radius[0].toString();
    }
  }
}

export default PointPanel;
