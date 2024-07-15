import Panel from './Panel';
import Root from '../node/Root';
import Listener from './Listener';
import Node from '../node/Node';
import Group from '../node/Group';
import ArtBoard from '../node/ArtBoard';

const html = `
  <h4 class="panel-title">对齐</h4>
  <div class="line">
    <span class="left"></span>
    <span class="center"></span>
    <span class="right"></span>
    <span class="top"></span>
    <span class="middle"></span>
    <span class="bottom"></span>
  </div>
`;

class AlignPanel extends Panel {
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'align-panel';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    panel.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toUpperCase() === 'SPAN') {
        const p = target.parentElement!;
        if (p.classList.contains('disabled')) {
          return;
        }
      }
      this.nodes.forEach(item => {});
    });

    listener.on(Listener.SELECT_NODE, (nodes: Node[]) => {
      this.show(nodes);
    });
  }

  show(nodes: Node[]) {
    const panel = this.panel;
    const ns: Node[] = [];
    nodes.forEach((node: Node) => {
      const p = node.parent;
      if (p && (p instanceof Group || p instanceof ArtBoard)) {
        ns.push(p);
      }
    });
    this.nodes = ns;
    if (!ns.length) {
      panel.querySelector('.line')!.classList.add('disabled');
      return;
    }
    panel.querySelector('.line')!.classList.remove('disabled');
  }
}

export default AlignPanel;
