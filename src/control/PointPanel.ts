import Panel from './Panel';
import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import State from './State';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';
import { CURVE_MODE } from '../style/define';

const html = `
  <h4 class="panel-title">锚点</h4>
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
      <input type="number" min="0" max="100" step="1" value=""/>
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
        panel.querySelector('.type.enable')?.classList.remove('enable');
        panel.querySelector('.type .cur')?.classList.remove('cur');
        classList.add('cur');
        const points = node.props.points;
        const p = points[idx];
        if (classList.contains('mirrored')) {
          p.curveMode = CURVE_MODE.MIRRORED;
          // 前后控制点都有则后面的跟随前面的，否则没有的跟随有的
          if (p.hasCurveFrom && p.hasCurveTo || p.hasCurveTo) {
            const dx = p.tx - p.x;
            const dy = p.ty - p.y;
            p.fx = p.x + dx;
            p.fy = p.y + dy;
            p.hasCurveFrom = true;
          }
          else if (p.hasCurveFrom) {
            const dx = p.fx - p.x;
            const dy = p.fy - p.y;
            p.tx = p.x + dx;
            p.ty = p.y + dy;
            p.hasCurveTo = true;
          }
          // 都没有默认设置和前后点x/y的差值
          else {
            p.hasCurveFrom = true;
            p.hasCurveTo = true;
            const prev = points[idx - 1] || points[points.length - 1];
            const next = points[idx + 1] || points[0];
            p.tx = (prev.x + p.x) * 0.5;
            p.ty = (prev.y + p.y) * 0.5;
            p.fx = (next.x + p.x) * 0.5;
            p.fy = (next.y + p.y) * 0.5;
          }
        }
        else if (classList.contains('disconnected')) {
          p.curveMode = CURVE_MODE.DISCONNECTED;
        }
        else if (classList.contains('asymmetric')) {
          p.curveMode = CURVE_MODE.ASYMMETRIC;
        }
        else {
          p.curveMode = CURVE_MODE.STRAIGHT;
        }
      }
    });

    listener.on(Listener.STATE_CHANGE, (prev: State, next: State) => {
      if (next === State.EDIT_GEOM || prev === State.EDIT_GEOM) {
        this.show(listener.selected);
      }
    });

    let idx = -1;
    listener.on(Listener.SELECT_POINT, (i: number) => {
      idx = i;
      panel.querySelector('.type.enable')?.classList.remove('enable');
      panel.querySelector('.type .cur')?.classList.remove('cur');
      if (idx > -1) {
        panel.querySelector('.type')?.classList.add('enable');
        const node = this.node;
        if (node instanceof Polyline) {
          const p = node.props.points[i];
          if (p.curveMode === CURVE_MODE.MIRRORED) {
            panel.querySelector('.type .mirrored')?.classList.add('cur');
          }
          else if (p.curveMode === CURVE_MODE.DISCONNECTED) {
            panel.querySelector('.type .disconnected')?.classList.add('cur');
          }
          else if (p.curveMode === CURVE_MODE.ASYMMETRIC) {
            panel.querySelector('.type .asymmetric')?.classList.add('cur');
          }
          else {
            panel.querySelector('.type .straight')?.classList.add('cur');
          }
        }
      }
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
  }
}

export default PointPanel;
