import Node from '../node/Node';
import Root from '../node/Root';
import { identity, multiply, multiplyScale, multiplyTranslate } from '../math/matrix';
import Group from '../node/Group';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';
import { getGroupActualRect } from '../tools/node';

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
  <span class="tl" style="position:absolute;left:0;top:0;width:14px;height:14px;transform:translate(-50%,-50%)scale(0.5);cursor:nwse-resize;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="tr" style="position:absolute;right:0;top:0;width:14px;height:14px;transform:translate(50%,-50%)scale(0.5);cursor:nesw-resize;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="br" style="position:absolute;right:0;bottom:0;width:14px;height:14px;transform:translate(50%,50%)scale(0.5);cursor:nwse-resize;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="bl" style="position:absolute;left:0;bottom:0;width:14px;height:14px;transform:translate(-50%,50%)scale(0.5);cursor:nesw-resize;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
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
    hover.style.pointerEvents = 'none';
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
    const root = this.root;
    const dpi = root.dpi;
    const hover = this.hover;
    const rect = node._rect || node.rect;
    let matrix = node.matrixWorld;
    if (dpi !== 1) {
      const t = identity();
      multiplyScale(t, 1 / dpi);
      matrix = multiply(t, matrix);
    }
    const isLine = node instanceof Polyline && node.isLine();
    if (isLine) {
      const rect = node.rectLine;
      hover.style.width = (rect[2] - rect[0]) + 'px';
      hover.style.height = (rect[3] - rect[1]) + 'px';
      if (rect[0] || rect[1]) {
        multiplyTranslate(matrix, rect[0], rect[1]);
      }
    }
    else {
      if (node.isGroup && node instanceof Group && !(node instanceof ShapeGroup)) {
        const r = getGroupActualRect(node);
        hover.style.width = (r[2] - r[0]) + 'px';
        hover.style.height = (r[3] - r[1]) + 'px';
        if (r[0] || r[1]) {
          multiplyTranslate(matrix, r[0], r[1]);
        }
      }
      else {
        hover.style.width = (rect[2] - rect[0]) + 'px';
        hover.style.height = (rect[3] - rect[1]) + 'px';
      }
    }
    hover.style.transform = `matrix3d(${matrix.join(',')}`;
    const scale = 1 / matrix[0];
    hover.style.borderWidth = scale * 2 + 'px';
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
      const isLine = item instanceof Polyline && item.isLine();
      if (isLine) {
        const rect = item.rectLine;
        select.style.width = (rect[2] - rect[0]) + 'px';
        select.style.height = (rect[3] - rect[1]) + 'px';
        if (rect[0] || rect[1]) {
          multiplyTranslate(matrix, rect[0], rect[1]);
        }
      }
      else {
        if (item.isGroup && item instanceof Group && !(item instanceof ShapeGroup)) {
          const r = getGroupActualRect(item);
          select.style.width = (r[2] - r[0]) + 'px';
          select.style.height = (r[3] - r[1]) + 'px';
          if (r[0] || r[1]) {
            multiplyTranslate(matrix, r[0], r[1]);
          }
        }
        else {
          select.style.width = (rect[2] - rect[0]) + 'px';
          select.style.height = (rect[3] - rect[1]) + 'px';
        }
      }
      select.style.transform = `matrix3d(${matrix.join(',')}`;
      const scale = 1 / matrix[0];
      select.querySelectorAll('.l b, .r b').forEach((item) => {
        (item as HTMLElement).style.transform = 'scaleX(' + scale + ')';
      });
      select.querySelectorAll('.t b, .b b').forEach((item) => {
        (item as HTMLElement).style.transform = 'scaleY(' + scale + ')';
      });
      select.querySelectorAll('.tr b, .tl b, .br b, .bl b').forEach((item) => {
        (item as HTMLElement).style.transform = 'scale(' + scale + ')';
      });
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
