import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import { toPrecision } from '../math';
import Listener from './Listener';

const html = `
  <h4 class="panel-title">圆角</h4>
  <div class="line">
    <input type="range" min="0" max="100" step="1"/>
    <input type="number" min="0" max="100" step="1"/>
    <span></span>
  </div>
`;

class RoundPanel {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    const panel = this.panel = document.createElement('div');
    panel.className = 'round-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    listener.on(Listener.SELECT_NODE, (nodes: Node[]) => {
      this.show(nodes);
    });
  }

  show(nodes: Node[]) {
    const panel = this.panel;
    if (!nodes.length) {
      panel.style.display = 'none';
      return;
    }
    panel.querySelectorAll('input').forEach(item => {
      item.disabled = false;
      item.placeholder = '';
      item.value = '';
    });
    const rs: number[] = [];
    nodes.forEach(item => {
      if (item instanceof Polyline) {
        item.points.forEach(point => {
          const r = point.cornerRadius;
          if (!rs.includes(r)) {
            rs.push(r);
          }
        });
      }
      else if (item instanceof ShapeGroup) {
        item.children.forEach(child => {
          if (child instanceof Polyline) {
            child.points.forEach(point => {
              const r = point.cornerRadius;
              if (!rs.includes(r)) {
                rs.push(r);
              }
            });
          }
        });
      }
    });
    if (rs.length) {
      panel.style.display = 'block';
      const r = panel.querySelector('input[type=range]') as HTMLInputElement;
      const n = panel.querySelector('input[type=number]') as HTMLInputElement;
      if (rs.length > 1) {
        r.value = '0';
        n.placeholder = '多个';
      }
      else {
        const c = toPrecision(rs[0] * 100, 0);
        r.value = c.toString();
        n.value = c.toString();
      }
    }
    else {
      panel.style.display = 'none';
    }
  }
}

export default RoundPanel;
