import Panel from './Panel';
import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import State from './State';
import Geom from '../node/geom/Geom';

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
    <input type="range" min="0" max="100" step="1"/>
    <div class="input-unit">
      <input type="number" min="0" max="100" step="1"/>
    </div>
  </div>
`;

class PointPanel extends Panel {
  panel: HTMLElement;
  node?: Geom;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'point-panel';
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
    const geoms = nodes.filter(item => item instanceof Geom);
    this.nodes = geoms;
    const panel = this.panel;
    if (!geoms.length || this.listener.state !== State.EDIT_GEOM) {
      panel.style.display = 'none';
      return;
    }
    this.node = geoms[0];
    panel.style.display = 'block';
  }
}

export default PointPanel;
