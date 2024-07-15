import Node from '../node/Node';
import Root from '../node/Root';
import { toPrecision } from '../math';
import Listener from './Listener';
import { JStyle } from '../format';
import UpdateStyleCommand from '../history/UpdateStyleCommand';
import Panel from './Panel';

const html = `
  <h4 class="panel-title">不透明度</h4>
  <div class="line">
    <input type="range" min="0" max="100" step="1"/>
    <input type="number" min="0" max="100" step="1"/>
    <span>%</span>
  </div>
`;

class OpacityPanel extends Panel {
  panel: HTMLElement;
  silence: boolean; // input更新触发listener的事件，避免循环侦听更新前静默标识不再侦听

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);
    this.silence = false;

    const panel = this.panel = document.createElement('div');
    panel.className = 'opacity-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    const range = panel.querySelector('input[type=range]') as HTMLInputElement;
    const number = panel.querySelector('input[type=number]') as HTMLInputElement;

    range.addEventListener('input', (e) => {
      this.silence = true;
      const nodes: Node[] = [];
      const prevs: Partial<JStyle>[] = [];
      const nexts: Partial<JStyle>[] = [];
      this.nodes.forEach((node) => {
        const prev = node.computedStyle.opacity;
        const next = parseFloat(range.value) * 0.01;
        if (prev !== next) {
          node.updateStyle({
            opacity: next,
          });
          nodes.push(node);
          prevs.push({
            opacity: prev,
          });
          nexts.push({
            opacity: next,
          });
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new UpdateStyleCommand(nodes.slice(0), prevs, nexts));
        listener.emit(Listener.OPACITY_NODE, nodes.slice(0));
        number.value = range.value;
      }
      this.silence = false;
    });

    number.addEventListener('input', (e) => {
      this.silence = true;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const nodes: Node[] = [];
      const prevs: Partial<JStyle>[] = [];
      const nexts: Partial<JStyle>[] = [];
      this.nodes.forEach((node, i) => {
        const prev = node.computedStyle.opacity;
        let next = parseFloat(number.value) * 0.01;
        let d = 0;
        if (isInput) {
          d = next - prev;
        }
        else {
          d = next;
        }
        // 最小值为0，按↓时可能无法触发-1的值，特殊判断
        if (d || !isInput && !next) {
          if (!isInput) {
            if (listener.shiftKey) {
              if (d > 0) {
                d = 0.1;
              }
              else {
                d = -0.1;
              }
            }
            else {
              if (d > 0) {
                d = 0.01;
              }
              else {
                d = -0.01;
              }
            }
          }
          next = prev + d;
          next = Math.max(next, 0);
          next = Math.min(next, 1);
          if (isInput && !i) {
            number.value = toPrecision(next * 100).toString();
          }
          if (prev !== next) {
            node.updateStyle({
              opacity: next,
            });
            nodes.push(node);
            prevs.push({
              opacity: prev,
            });
            nexts.push({
              opacity: next,
            });
          }
        }
      });
      if (!isInput) {
        number.value = '';
      }
      if (nodes.length) {
        listener.history.addCommand(new UpdateStyleCommand(nodes.slice(0), prevs, nexts));
        listener.emit(Listener.OPACITY_NODE, nodes.slice(0));
        range.value = number.value;
      }
      this.silence = false;
    });

    listener.on(Listener.SELECT_NODE, (nodes: Node[]) => {
      this.show(nodes);
    });
    listener.on(Listener.OPACITY_NODE, (nodes: Node[]) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
  }

  show(nodes: Node[]) {
    this.nodes = nodes;
    const panel = this.panel;
    if (!nodes.length) {
      panel.style.display = 'none';
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
