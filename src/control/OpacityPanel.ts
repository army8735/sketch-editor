import Node from '../node/Node';
import Root from '../node/Root';
import { toPrecision } from '../math';

const html = `
  <h4>不透明度</h4>
  <div class="line">
    <input type="range" min="0" max="100" step="1"/>
    <input type="number" min="0" max="100" step="1"/>
    <span>%</span>
  </div>
`;

class OpacityPanel {
  root: Root;
  dom: HTMLElement;
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;

    const panel = this.panel = document.createElement('div');
    panel.className = 'opacity-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);
  }

  show(nodes: Node[]) {
    const panel = this.panel;
    if (!nodes.length) {
      panel.style.display = 'none';
      panel.querySelectorAll('input').forEach(item => {
        item.disabled = true;
        item.placeholder = '';
        item.value = '';
      });
      return;
    }
    panel.style.display = 'block';
    panel.querySelectorAll('input').forEach(item => {
      item.disabled = false;
      item.placeholder = '';
      item.value = '';
    });
    const as: number[] = [];
    nodes.forEach(item => {
      const opacity = item.computedStyle.opacity;
      if (!as.includes(opacity)) {
        as.push(opacity);
      }
    });
    const r = panel.querySelector('input[type=range]') as HTMLInputElement;
    const n = panel.querySelector('input[type=number]') as HTMLInputElement;
    if (as.length > 1) {
      r.value = '0';
      n.placeholder = '多个';
    }
    else {
      const a = toPrecision(as[0] * 100, 0);
      r.value = a.toString();
      n.value = a.toString();
    }
  }
}

export default OpacityPanel;
