import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import { toPrecision } from '../math';
import Listener from './Listener';
import Panel from './Panel';
import State from './State';

const html = `
  <h4 class="panel-title">圆角</h4>
  <div class="line">
    <input type="range" min="0" max="100" step="1"/>
    <div class="input-unit">
      <input type="number" min="0" max="100" step="1"/>
    </div>
  </div>
`;

class RoundPanel extends Panel {
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'round-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    dom.appendChild(panel);

    listener.on(Listener.STATE_CHANGE, (prev: State, next: State) => {
      if (next === State.EDIT_GEOM || next === State.NORMAL) {
        this.show(listener.selected);
      }
    });
  }

  override show(nodes: Node[]) {
    const panel = this.panel;
    let willShow = false;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      if (item instanceof Polyline || item instanceof ShapeGroup) {
        willShow = true;
        break;
      }
    }
    if (this.listener.state === State.EDIT_GEOM) {
      willShow = false;
    }
    if (!willShow) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    panel.querySelectorAll('input').forEach(item => {
      item.placeholder = '';
      item.value = '';
    });
    const geoms = nodes.filter(item => item instanceof Polyline || item instanceof ShapeGroup);
    this.nodes = geoms;
    const rs: number[] = [];
    geoms.forEach(item => {
      if (item instanceof Polyline) {
        item.props.points.forEach(point => {
          const r = point.cornerRadius;
          if (!rs.includes(r)) {
            rs.push(r);
          }
        });
      }
      else if (item instanceof ShapeGroup) {
        item.children.forEach(child => {
          if (child instanceof Polyline) {
            child.props.points.forEach(point => {
              const r = point.cornerRadius;
              if (!rs.includes(r)) {
                rs.push(r);
              }
            });
          }
        });
      }
    });
    const r = panel.querySelector('input[type=range]') as HTMLInputElement;
    const n = panel.querySelector('input[type=number]') as HTMLInputElement;
    if (rs.length > 1) {
      r.value = '0';
      r.style.setProperty('--p', '0');
      n.placeholder = '多个';
    }
    else {
      const c = toPrecision(rs[0] * 100, 2).toString();
      r.value = c;
      r.style.setProperty('--p', c);
      n.value = c;
    }
  }
}

export default RoundPanel;
