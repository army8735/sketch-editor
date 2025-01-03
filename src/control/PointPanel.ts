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

    const range = panel.querySelector('input[type="range"]') as HTMLInputElement;
    const number = panel.querySelector('input[type="number"]') as HTMLInputElement;
    range.addEventListener('input', (e) => {
      console.log(1);
    });
    range.addEventListener('change', (e) => {
      console.log(2);
    });

    listener.on(Listener.STATE_CHANGE, (prev: State, next: State) => {
      if (next === State.EDIT_GEOM || prev === State.EDIT_GEOM) {
        this.show(listener.selected);
      }
    });

    listener.on(Listener.SELECT_POINT, (idx: number[]) => {
      panel.querySelector('.type.enable')?.classList.remove('enable');
      panel.querySelector('.type .cur')?.classList.remove('cur');
      if (idx.length) {
        panel.querySelector('.type')?.classList.add('enable');
        const node = this.node;
        const type: CURVE_MODE[] = [];
        const radius: number[] = [];
        if (node instanceof Polyline) {
          idx.forEach(i => {
            const p = node.props.points[i];
            let { curveMode, cornerRadius } = p;
            if (curveMode === CURVE_MODE.NONE) {
              curveMode = CURVE_MODE.STRAIGHT;
            }
            if (!type.includes(curveMode)) {
              type.push(curveMode);
            }
            if (!radius.includes(cornerRadius)) {
              radius.push(cornerRadius);
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
    const radius: number[] = [];
    this.node.props.points.forEach(item => {
      if (item.curveMode === CURVE_MODE.NONE || item.curveMode === CURVE_MODE.STRAIGHT) {
        const r = item.cornerRadius;
        if (!radius.includes(r)) {
          radius.push(r);
        }
      }
    });
    if (!radius.length) {
      radius.push(0);
    }
    const range = panel.querySelector('input[type="range"]') as HTMLInputElement;
    const number = panel.querySelector('input[type="number"]') as HTMLInputElement;
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
