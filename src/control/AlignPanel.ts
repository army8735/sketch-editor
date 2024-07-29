import Panel from './Panel';
import Root from '../node/Root';
import Listener from './Listener';
import Node from '../node/Node';
import Group from '../node/Group';
import ArtBoard from '../node/ArtBoard';
import MoveCommand from '../history/MoveCommand';
import { MoveData } from '../format';

const html = `
  <h4 class="panel-title">对齐</h4>
  <div class="line">
    <span class="left" title="居左"></span>
    <span class="center" title="左右居中"></span>
    <span class="right" title="居右"></span>
    <span class="top" title="居上"></span>
    <span class="middle" title="上下居中"></span>
    <span class="bottom" title="居下"></span>
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
      const classList = target.classList;
      const nodes: Node[] = [];
      const data: MoveData[] = [];
      this.nodes.forEach(node => {
        let dx = 0;
        let dy = 0;
        const parent = node.parent!;
        const { width: pw, height: ph } = parent;
        const computedStyle = node.computedStyle;
        if (classList.contains('left')) {
          dx = -computedStyle.left - computedStyle.translateX;
        }
        else if (classList.contains('center')) {
          dx = pw * 0.5 - computedStyle.left - computedStyle.translateX - computedStyle.width * 0.5;
        }
        else if (classList.contains('right')) {
          dx = pw - computedStyle.left - computedStyle.translateX - computedStyle.width;
        }
        else if (classList.contains('top')) {
          dy = -computedStyle.top - computedStyle.translateY;
        }
        else if (classList.contains('middle')) {
          dy = ph * 0.5 - computedStyle.top - computedStyle.translateY - computedStyle.height * 0.5;
        }
        else if (classList.contains('bottom')) {
          dy = ph - computedStyle.top - computedStyle.translateY - computedStyle.height;
        }
        if (dx || dy) {
          const style = node.getStyle();
          node.updateStyle({
            translateX: computedStyle.translateX + dx,
            translateY: computedStyle.translateY + dy,
          });
          // 还原最初的translate/TRBL值
          const md = node.endPosChange(style, dx, dy);
          node.checkPosSizeUpward();
          nodes.push(node);
          data.push(md);
        }
      });
      if (nodes.length) {
        listener.select.updateSelect(nodes);
        listener.emit(Listener.MOVE_NODE, nodes.slice(0));
        listener.history.addCommand(new MoveCommand(nodes, data));
      }
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
        ns.push(node);
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
