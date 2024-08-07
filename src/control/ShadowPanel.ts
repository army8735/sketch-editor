import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import Panel from './Panel';
import { ShadowStyle } from '../format';
import ShadowCommand from '../history/ShadowCommand';
import picker from './picker';
import { color2hexStr } from '../style/css';

const html = `
  <dt class="panel-title">阴影<b class="add"></b></dt>
`;

function renderItem(
  index: number,
  multiEnable: boolean,
  enable: boolean,
  multiColor: boolean,
  color: string,
  x: number,
  y: number,
  blur: number,
  spread: number,
) {
  return `<div class="line" title="${index}">
    <span class="${multiEnable ? 'multi-checked' : (enable ? 'checked' : 'un-checked')}"></span>
    <div class="color">
      <span class="picker">
        <b class="pick-btn ${multiColor ? 'multi' : ''}" style="${multiColor ? '' : `background:${color}`}">○○○</b>
      </span>
      <span class="txt">颜色</span>
    </div>
    <div>
      <input class="x" type="number" step="1" value="${x}"/>
      <span class="txt">X</span>
    </div>
    <div>
      <input class="y" type="number" step="1" value="${y}"/>
      <span class="txt">Y</span>
    </div>
    <div>
      <input class="blur" type="number" min="0" step="1" value="${blur}"/>
      <span class="txt">模糊</span>
    </div>
    <div>
      <input class="spread" type="number" min="0" step="1" value="${spread}" readonly="readonly" disabled="disabled"/>
      <span class="txt">扩展</span>
    </div>
  </div>`;
}

class ShadowPanel extends Panel {
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'shadow-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    let nodes: Node[] = [];
    let prevs: ShadowStyle[] = [];
    let nexts: ShadowStyle[] = [];

    // 选择颜色会刷新但不产生步骤，关闭颜色面板后才callback产生
    const pickCallback = () => {
      // 只有变更才会有next
      if (nexts && nexts.length) {
        listener.history.addCommand(new ShadowCommand(nodes, prevs.map((prev, i) => {
          return { prev, next: nexts[i] };
        })));
      }
      nodes = [];
      prevs = [];
      nexts = [];
    };

    panel.addEventListener('click', (e) => {
      const el = e.target as HTMLElement;
      const classList = el.classList;
      if (classList.contains('pick-btn')) {
        // picker侦听了document全局click隐藏窗口，这里停止向上冒泡
        e.stopPropagation();
        if (picker.isShowFrom('shadowPanel')) {
          picker.hide();
          pickCallback();
          return;
        }
        const p = picker.show(el, 'shadowPanel', pickCallback);
        // 最开始记录nodes/prevs
        nodes = this.nodes.slice(0);
        prevs = [];
        nodes.forEach(node => {
          const { shadow, shadowEnable } = node.getCssStyle();
          prevs.push({
            shadow,
            shadowEnable,
          });
        });
        // 每次变更记录更新nexts
        p.onChange = (color: any) => {
          nexts = [];
          const s = color2hexStr(color.rgba);
          nodes.forEach(node => {
            const { shadow, shadowEnable } = node.getCssStyle();
            shadow.forEach((item, i) => {
              const arr= item.split(' ');
              arr[0] = s;
              shadow[i] = arr.join(' ');
            });
            const o = {
              shadow,
              shadowEnable,
            };
            nexts.push(o);
            node.updateStyle(o);
          });
          if (nodes.length) {
            listener.emit(Listener.SHADOW_NODE, nodes.slice(0));
          }
        };
        p.onDone = () => {
          picker.hide();
          pickCallback();
        };
      }
      else if (classList.contains('add')) {
        this.silence = true;
        nodes = this.nodes.slice(0);
        prevs = [];
        nexts = [];
        nodes.forEach(node => {
          const { shadow, shadowEnable } = node.getCssStyle();
          prevs.push({
            shadow,
            shadowEnable,
          });
          const s = shadow.slice(0);
          const se = shadowEnable.slice(0);
          s.push('rgba(0,0,0,0.5) 0 2 4 0');
          se.push(true);
          const o = {
            shadow: s,
            shadowEnable: se,
          };
          nexts.push(o);
          node.updateStyle(o);
        });
        this.show(nodes);
        listener.emit(Listener.SHADOW_NODE, nodes.slice(0));
        listener.history.addCommand(new ShadowCommand(nodes.slice(0), prevs.map((prev, i) => {
          return {
            prev,
            next: nexts[i],
          };
        })));
        nodes = [];
        prevs = [];
        nexts = [];
        this.silence = false;
      }
    });

    panel.addEventListener('input', (e) => {
      this.silence = true;
      pickCallback();
      const input = e.target as HTMLInputElement;
      const index = parseInt((input.parentElement!.parentElement as HTMLElement).title);
      const classList = input.classList;
      let type = 1; // x
      if (classList.contains('y')) {
        type = 2;
      }
      else if (classList.contains('blur')) {
        type = 3;
      }
      else if (classList.contains('spread')) {
        type = 4;
      }
      let value = parseFloat(input.value) || 0;
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      let p: number;
      this.nodes.forEach((node, i) => {
        if (isFirst) {
          nodes.push(node);
          const { shadow, shadowEnable } = node.getCssStyle();
          prevs.push({
            shadow,
            shadowEnable,
          });
        }
        const o = {
          shadow: prevs[i].shadow.slice(0),
          shadowEnable: prevs[i].shadowEnable.slice(0),
        };
        nexts.push(o);
        if (!isInput) {
          let d = 0;
          if (input.placeholder) {
            d = value > 0 ? 1 : -1;
            if (listener.shiftKey) {
              d *= 10;
            }
          }
          else {
            // 只计算一次，没有多个值直接用第一个即可
            if (p === undefined) {
              p = parseFloat(prevs[0].shadow[index].split(' ')[type]);
            }
            d = value - p;
            if (listener.shiftKey) {
              d *= 10;
            }
          }
          if (p === undefined) {
            p = parseFloat(prevs[0].shadow[index].split(' ')[type]);
          }
          value = p + d;
        }
        else {
          // 直接有value
        }
        const arr = o.shadow[index].split(' ');
        arr[type] = value.toString();
        o.shadow[index] = arr.join(' ');
        node.updateStyle(o);
      });
      if (nodes.length) {
        listener.emit(Listener.SHADOW_NODE, nodes.slice(0));
      }
      this.silence = false;
    });

    panel.addEventListener('change', (e) => {
      if (nexts.length) {
        listener.history.addCommand(new ShadowCommand(nodes, prevs.map((prev, i) => {
          return {
            prev,
            next: nexts[i],
          };
        })));
      }
      nodes = [];
      prevs = [];
      nexts = [];
    });

    listener.on([
      Listener.SELECT_NODE,
      Listener.ADD_NODE,
      Listener.SHADOW_NODE,
    ], (nodes: Node[]) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
    listener.on(Listener.REMOVE_NODE, () => {
      if (this.silence) {
        return;
      }
      this.show([]);
    });
  }

  show(nodes: Node[]) {
    this.nodes = nodes;
    const panel = this.panel;
    // 老的清除
    this.panel.querySelectorAll('.line').forEach(item => {
      item.remove();
    });
    if (!nodes.length) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    const shadowEnableList: boolean[][] = [];
    const shadowList: string[][] = [];
    nodes.forEach(node => {
      const { shadow, shadowEnable } = node.getCssStyle();
      shadowEnable.forEach((item, i) => {
        const o = shadowEnableList[i] = shadowEnableList[i] || [];
        if (!o.includes(item)) {
          o.push(item);
        }
      });
      shadow.forEach((item, i) => {
        const o = shadowList[i] = shadowList[i] || [];
        if (!o.includes(item)) {
          o.push(item);
        }
      });
    });
    shadowList.forEach((shadow, i) => {
      const shadowEnable = shadowEnableList[i];
      const data = shadow[0].split(' ');
      panel.innerHTML += renderItem(
        i,
        shadowEnable.length > 1,
        shadowEnable[0],
        shadow.length > 1,
        data[0],
        parseFloat(data[1]),
        parseFloat(data[2]),
        parseFloat(data[3]),
        parseFloat(data[4]),
      );
    });
  }
}

export default ShadowPanel;
