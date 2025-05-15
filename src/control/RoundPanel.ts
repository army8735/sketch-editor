import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import { toPrecision } from '../math';
import Listener from './Listener';
import Panel from './Panel';
import state from './state';

const html = `
  <h4 class="panel-title">圆角</h4>
  <div class="line">
    <input type="range" min="0" step="1"/>
    <div class="input-unit">
      <input type="number" min="0" step="1"/>
    </div>
  </div>
`;

class RoundPanel extends Panel {
  panel: HTMLElement;
  nodes: (Polyline | ShapeGroup)[];

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);
    this.nodes = [];

    const panel = this.panel = document.createElement('div');
    panel.className = 'round-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    dom.appendChild(panel);

    listener.on(Listener.SELECT_NODE, (nodes: Node[]) => {
      this.show(nodes);
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
    if (this.listener.state === state.EDIT_GEOM) {
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
      scan(item, rs);
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

// 递归查看所有矢量节点，shapeGroup会有子孙节点
function scan(node: Node, rs: number[]) {
  if (node instanceof Polyline) {
    node.points.forEach(point => {
      const r = point.cornerRadius;
      if (!rs.includes(r)) {
        rs.push(r);
      }
    });
  }
  else if (node instanceof ShapeGroup) {
    node.children.forEach(child => {
      if (child instanceof Polyline) {
        child.points.forEach(point => {
          const r = point.cornerRadius;
          if (!rs.includes(r)) {
            rs.push(r);
          }
        });
      }
      else if (child instanceof ShapeGroup) {
        scan(child, rs);
      }
    });
  }
}

export default RoundPanel;
