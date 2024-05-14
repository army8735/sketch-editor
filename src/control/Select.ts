import Node from '../node/Node';
import Root from '../node/Root';
import { identity, multiply, multiplyScale } from '../math/matrix';

const html = `
  <span class="l" style="position:absolute;left:-4px;top:0;width:8px;height:100%;transform:scaleX(0.5);cursor:ew-resize;">
    <b style="position:absolute;left:4px;top:0;width:0;height:100%;border-left:1px solid #F43;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="t" style="position:absolute;left:0;top:-4px;width:100%;height:8px;transform:scaleY(0.5);cursor:ns-resize;">
    <b style="position:absolute;left:0;top:4px;width:100%;height:0;border-top:1px solid #F43;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="r" style="position:absolute;top:0;right:-4px;width:8px;height:100%;transform:scaleX(0.5);cursor:ew-resize;">
    <b style="position:absolute;right:4px;top:0;width:0;height:100%;border-right:1px solid #F43;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="b" style="position:absolute;left:0;bottom:-4px;width:100%;height:8px;transform:scaleY(0.5);cursor:ns-resize;">
    <b style="position:absolute;left:0;bottom:4px;width:100%;height:0;border-bottom:1px solid #F43;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="tl" style="position:absolute;left:0;top:0;width:14px;height:14px;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:translate(-8px,-8px)scale(0.5);cursor:nwse-resize;"></span>
  <span class="tr" style="position:absolute;right:0;top:0;width:14px;height:14px;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:translate(8px,-8px)scale(0.5);cursor:nesw-resize;"></span>
  <span class="br" style="position:absolute;right:0;bottom:0;width:14px;height:14px;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:translate(8px,8px)scale(0.5);cursor:nwse-resize;"></span>
  <span class="bl" style="position:absolute;left:0;bottom:0;width:14px;height:14px;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:translate(-8px,8px)scale(0.5);cursor:nesw-resize;"></span>
`;

export default class Select {
  root: Root;
  dom: HTMLElement;
  hover: HTMLElement;
  select: HTMLElement[];

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;
    const hover = this.hover = document.createElement('div');
    hover.className = 'hover';
    hover.style.display = 'none';
    hover.style.position = 'absolute';
    hover.style.left = '0px';
    hover.style.top = '0px';
    hover.style.transformOrigin = '0 0';
    hover.style.boxSizing = 'border-box';
    hover.style.border = '2px solid #F43';
    hover.style.boxShadow = '0 0 3px rgba(0, 0, 0, 0.5)';
    dom.appendChild(hover);
    this.select = [];
  }

  showHover(node: Node) {
    this.hover.style.display = 'block';
    this.updateHover(node);
  }

  hideHover() {
    this.hover.style.display = 'none';
  }

  updateHover(node: Node) {
    const dpi = this.root.dpi;
    const hover = this.hover;
    const rect = node._rect || node.rect;
    let matrix = node.matrixWorld;
    if (dpi !== 1) {
      const t = identity();
      multiplyScale(t, 1 / dpi);
      matrix = multiply(t, matrix);
    }
    hover.style.width = (rect[2] - rect[0]) + 'px';
    hover.style.height = (rect[3] - rect[1]) + 'px';
    hover.style.transform = `matrix3d(${matrix.join(',')}`;
  }

  isHoverDom(dom: HTMLElement) {
    return dom === this.hover || dom.parentElement === this.hover || dom.parentElement?.parentElement === this.hover;
  }

  showSelect(selected: Node[]) {
    this.hideSelect();
    selected.forEach(() => {
      const select = document.createElement('div');
      select.className = 'select';
      select.style.position = 'absolute';
      select.style.left = '0px';
      select.style.top = '0px';
      select.style.transformOrigin = '0 0';
      select.style.boxSizing = 'content-box';
      select.innerHTML = html;
      this.dom.appendChild(select);
      this.select.push(select);
    });
    this.updateSelect(selected);
  }

  updateSelect(selected: Node[]) {
    const dpi = this.root.dpi;
    selected.forEach((item, i) => {
      const select = this.select[i];
      const rect = item._rect || item.rect;
      let matrix = item.matrixWorld;
      if (dpi !== 1) {
        const t = identity();
        multiplyScale(t, 1 / dpi);
        matrix = multiply(t, matrix);
      }
      select.style.width = (rect[2] - rect[0]) + 'px';
      select.style.height = (rect[3] - rect[1]) + 'px';
      select.style.transform = `matrix3d(${matrix.join(',')}`;
    });
  }

  hideSelect() {
    this.select.splice(0).forEach(item => {
      item.remove();
    });
  }

  isSelectControlDom(dom: HTMLElement) {
    return dom.parentElement && this.select.indexOf(dom.parentElement) > -1;
  }

  destroy() {
    this.hover.remove();
    this.hideSelect();
  }
}
