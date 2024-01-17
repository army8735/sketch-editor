import Node from '../node/Node';
import Root from '../node/Root';

const html = `
  <span class="l" style="position:absolute;left:-4px;top:0;width:8px;height:100%;transform:scaleX(0.5);cursor:ew-resize;">
    <b style="position:absolute;left:2px;top:0;width:100%;height:100%;border-left:1px solid #34F;pointer-events:none;"></b>
  </span>
  <span class="t" style="position:absolute;left:0;top:-4px;width:100%;height:8px;transform:scaleY(0.5);cursor:ns-resize;">
    <b style="position:absolute;left:0;top:2px;width:100%;height:100%;border-top:1px solid #34F;pointer-events:none;"></b>
  </span>
  <span class="r" style="position:absolute;top:0;right:-4px;width:8px;height:100%;transform:scaleX(0.5);cursor:ew-resize;">
    <b style="position:absolute;right:2px;top:0;width:100%;height:100%;border-right:1px solid #34F;pointer-events:none;"></b>
  </span>
  <span class="b" style="position:absolute;left:0;bottom:-4px;width:100%;height:8px;transform:scaleY(0.5);cursor:ns-resize;">
    <b style="position:absolute;left:0;bottom:2px;width:100%;height:100%;border-bottom:1px solid #34F;pointer-events:none;"></b>
  </span>
  <span class="tl"></span>
  <span class="tr"></span>
  <span class="br"></span>
  <span class="bl"></span>
`;

export default class Select {
  root: Root;
  dom: HTMLElement;
  hover: HTMLDivElement;
  select: HTMLDivElement;

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;
    const hover = this.hover = document.createElement('div');
    hover.style.display = 'none';
    hover.style.position = 'absolute';
    hover.style.boxSizing = 'content-box';
    hover.style.border = '2px solid #F43';
    hover.style.boxShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
    hover.style.transform = 'translate(-2px, -2px)';
    dom.appendChild(hover);
    const select = this.select = document.createElement('div');
    select.style.display = 'none';
    select.style.position = 'absolute';
    select.style.boxSizing = 'content-box';
    select.innerHTML = html;
    dom.appendChild(select);
  }

  showHover(node: Node) {
    this.hover.style.display = 'block';
    this.updateHover(node);
  }

  hideHover() {
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

  isHoverDom(dom: HTMLElement) {
    return dom === this.hover || dom.parentElement === this.hover || dom.parentElement?.parentElement === this.hover;
  }

  showSelect(node: Node) {
    this.select.style.display = 'block';
    this.updateSelect(node);
  }

  updateSelect(node: Node) {
    const rect = node.getBoundingClientRect();
    const dpi = this.root.dpi;
    const select = this.select;
    select.style.left = rect.left / dpi + 'px';
    select.style.top = rect.top / dpi + 'px';
    select.style.width = (rect.right - rect.left) / dpi + 'px';
    select.style.height = (rect.bottom - rect.top) / dpi + 'px';
  }

  hideSelect() {
    this.select.style.display = 'none';
  }

  isSelectDom(dom: HTMLElement) {
    return dom === this.select || dom.parentElement === this.select || dom.parentElement?.parentElement === this.select;
  }

  destroy() {
    this.hover.remove();
    this.select.remove();
  }
}
