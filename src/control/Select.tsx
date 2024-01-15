import Node from '../node/Node';
import Root from '../node/Root';

export default class Select {
  root: Root;
  dom: HTMLElement;
  hover: HTMLDivElement;

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;
    const hover = this.hover = document.createElement('div');
    hover.style.display = 'none';
    hover.style.position = 'absolute';
    hover.style.border = '1px solid #F43';
    hover.style.boxShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
    hover.style.transform = 'translate(-1px, -1px)';
    dom.appendChild(hover);
  }

  showHove(node: Node) {
    this.hover.style.display = 'block';
    this.updateHover(node);
  }

  hideHove() {
    this.hover.style.display = 'none';
  }

  updateHover(node: Node) {
    const rect = node.getBoundingClientRect();
    const dpi = this.root.dpi;
    const hover = this.hover;
    hover.style.left = rect.left / dpi + 'px';
    hover.style.top = rect.top / dpi + 'px';
    hover.style.width = (rect.right - rect.left) / dpi + 'px';
    hover.style.height = (rect.bottom - rect.top) / dpi + 'px';
  }

  destroy() {
    this.hover.remove();
  }
}
