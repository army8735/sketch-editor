import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import Panel from './Panel';

const html = `
  <dt class="panel-title">阴影</dt>
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
        <b class="${multiColor ? 'multi' : ''}" style="${multiColor ? '' : `background:${color}`}">○○○</b>
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
      <input class="spread" type="number" min="0" step="1" value="${spread}"/>
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

    // 选择颜色会刷新但不产生步骤，关闭颜色面板后才callback产生
    const pickCallback = () => {};

    listener.on([
      Listener.SELECT_NODE,
      Listener.ADD_NODE,
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
