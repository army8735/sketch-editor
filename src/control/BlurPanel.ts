import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import Panel from './Panel';
import { BLUR } from '../style/define';

const html = `
  <div class="panel-title">模糊<b class="del"></b></div>
  <select>
    <option value="${BLUR.GAUSSIAN}">高斯模糊</option>
    <option value="${BLUR.MOTION}">动感模糊</option>
    <option value="${BLUR.RADIAL}">缩放模糊</option>
    <option value="${BLUR.BACKGROUND}">背景模糊</option>
    <option value="${BLUR.NONE}" disabled="disabled" style="display:none">多个</option>
  </select>
  <div class="val">
    <input class="range" type="range" min="0" max="50" step="1"/>
      <div class="input-unit">
        <input class="number" type="number" min="0" max="50" step="1"/>
      </div>
  </div>
  <div class="t${BLUR.MOTION}">
    <div class="intro">角度</div>
    <div class="con">
      <input type="range" min="-180" max="100" step="1"/>
      <div class="input-unit">
        <input type="number" min="180" max="100" step="1"/>
        <span class="unit">°</span>
      </div>
    </div>
  </div>
  <div class="t${BLUR.RADIAL}">
    <button disabled="disabled">编辑原点</button>
  </div>
  <div class="t${BLUR.BACKGROUND}">
    <div class="intro">饱和度</div>
    <div class="con">
      <input type="range" min="-100" max="100" step="1"/>
      <div class="input-unit">
        <input type="number" min="-100" max="100" step="1"/>
        <span class="unit">%</span>
      </div>
    </div>
  </div>
`;

class BlurPanel extends Panel {
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'blur-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

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
    if (!nodes.length) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    nodes.forEach(node => {
      const blur = node.computedStyle;
      console.log(blur);
    });
  }
}

export default BlurPanel;
