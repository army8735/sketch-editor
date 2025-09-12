import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import OpacityCommand from '../history/OpacityCommand';
import Panel from './Panel';
import state from './state';

const html = `
  <h4 class="panel-title">不透明度</h4>
  <div class="line">
    <input type="range" min="0" max="100" step="1"/>
    <div class="input-unit">
      <input type="number" min="0" max="100" step="1"/>
      <span class="unit">%</span>
    </div>
  </div>
`;

class OpacityPanel extends Panel {
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'opacity-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    dom.appendChild(panel);

    const range = panel.querySelector('input[type=range]') as HTMLInputElement;
    const number = panel.querySelector('input[type=number]') as HTMLInputElement;

    let nodes: Node[] = [];
    let prevs: number[] = [];
    let nexts: number[] = [];
    let hasRefresh = true; // onInput是否触发了刷新，onChange识别看是否需要兜底触发

    const onChange = () => {
      if (nodes.length && nexts.length) {
        if (!hasRefresh) {
          hasRefresh = true;
          root.asyncDraw();
        }
        listener.history.addCommand(new OpacityCommand(nodes, prevs.map((prev, i) => ({
          prev: {
            opacity: prev,
          },
          next: {
            opacity: nexts[i],
          },
        }))));
        listener.emit(Listener.OPACITY_NODE, nodes.slice(0));
        onBlur();
      }
    };

    const onBlur = () => {
      nodes = [];
      prevs = [];
      nexts = [];
    };

    range.addEventListener('input', () => {
      this.silence = true;
      // 连续多个只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      hasRefresh = true;
      this.nodes.forEach((node) => {
        const prev = node.computedStyle.opacity;
        const next = parseFloat(range.value) * 0.01;
        if (prev !== next) {
          node.updateStyle({
            opacity: next,
          });
          if (isFirst) {
            nodes.push(node);
            prevs.push(prev);
          }
          nexts.push(next);
        }
      });
      range.style.setProperty('--p', range.value);
      number.value = range.value;
      number.placeholder = '';
      if (nodes.length) {
        listener.emit(Listener.OPACITY_NODE, nodes.slice(0));
      }
      this.silence = false;
    });
    range.addEventListener('change', () => onChange());

    number.addEventListener('input', (e) => {
      this.silence = true;
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      hasRefresh = !isInput;
      const n = Math.min(100, Math.max(0, parseFloat(number.value) || 0));
      this.nodes.forEach((node, i) => {
        const prev = node.computedStyle.opacity * 100;
        if (isFirst) {
          nodes.push(node);
          prevs.push(prev * 0.01);
        }
        if (isInput) {
          nexts.push(n * 0.01);
          node.updateStyle({
            opacity: n * 0.01,
          }, true);
          if (number.placeholder) {
            number.placeholder = '';
          }
        }
        else {
          let next = n;
          let d = 0;
          // 由于min/max限制，在极小值的时候下键获取的值不再是-1而是0，仅会发生在multi情况，单个直接被限制min/max不会有input事件
          if (next === 0) {
            next = -1;
          }
          // 多个的时候有placeholder无值，差值就是1或-1；单个则是值本身
          if (number.placeholder) {
            d = next;
          }
          else {
            d = next - prev;
          }
          if (listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
          }
          next = prev + d;
          next = Math.max(next, 0);
          next = Math.min(next, 100);
          nexts.push(next * 0.01);
          if (prev !== next) {
            node.updateStyle({
              opacity: next * 0.01,
            });
          }
          if (!i) {
            number.value = number.placeholder ? '' : next.toString();
          }
        }
      });
      range.value = number.value || '0';
      range.style.setProperty('--p', range.value);
      this.silence = false;
    });
    number.addEventListener('change', () => onChange());
    number.addEventListener('blur', () => onBlur());

    listener.on([
      Listener.OPACITY_NODE,
    ], (nodes: Node[]) => {
      // 输入的时候，防止重复触发；选择/undo/redo的时候则更新显示
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
    listener.on(Listener.STATE_CHANGE, (prev: state, next: state) => {
      if (next === state.EDIT_GEOM || next === state.NORMAL) {
        this.show(listener.selected);
      }
    });
  }

  override show(nodes: Node[]) {
    super.show(nodes);
    const panel = this.panel;
    if (!nodes.length || this.listener.state === state.EDIT_GEOM) {
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
      r.style.setProperty('--p', '0');
      n.placeholder = '多个';
    }
    else {
      const a = Math.round(as[0] * 100).toString();
      r.value = a;
      r.style.setProperty('--p', a);
      n.value = a;
    }
  }
}

export default OpacityPanel;
