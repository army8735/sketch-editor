import Node from '../node/Node';
import Root from '../node/Root';
import { calRectPoints, identity, multiply, multiplyScale } from '../math/matrix';
import Polyline from '../node/geom/Polyline';
import { r2d } from '../math/geom';

const html = `
  <span class="l" style="position:absolute;left:-4px;top:0;width:8px;height:100%;transform:scaleX(0.5);cursor:ew-resize;pointer-events:auto;">
    <b style="position:absolute;left:4px;top:0;width:0;height:100%;border-left:1px solid #F43;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="t" style="position:absolute;left:0;top:-4px;width:100%;height:8px;transform:scaleY(0.5);cursor:ns-resize;pointer-events:auto;">
    <b style="position:absolute;left:0;top:4px;width:100%;height:0;border-top:1px solid #F43;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="r" style="position:absolute;top:0;right:-4px;width:8px;height:100%;transform:scaleX(0.5);cursor:ew-resize;pointer-events:auto;">
    <b style="position:absolute;right:4px;top:0;width:0;height:100%;border-right:1px solid #F43;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="b" style="position:absolute;left:0;bottom:-4px;width:100%;height:8px;transform:scaleY(0.5);cursor:ns-resize;pointer-events:auto;">
    <b style="position:absolute;left:0;bottom:4px;width:100%;height:0;border-bottom:1px solid #F43;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="tl" style="position:absolute;left:0;top:0;width:14px;height:14px;transform:translate(-50%,-50%);cursor:nwse-resize;pointer-events:auto;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:scale(0.5);pointer-events:none;"></b>
  </span>
  <span class="tr" style="position:absolute;right:0;top:0;width:14px;height:14px;transform:translate(50%,-50%);cursor:nesw-resize;pointer-events:auto;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:scale(0.5);pointer-events:none;"></b>
  </span>
  <span class="br" style="position:absolute;right:0;bottom:0;width:14px;height:14px;transform:translate(50%,50%);cursor:nwse-resize;pointer-events:auto;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:scale(0.5);pointer-events:none;"></b>
  </span>
  <span class="bl" style="position:absolute;left:0;bottom:0;width:14px;height:14px;transform:translate(-50%,50%);cursor:nesw-resize;pointer-events:auto;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);transform:scale(0.5);pointer-events:none;"></b>
  </span>
`;

export default class Select {
  root: Root;
  dom: HTMLElement;
  frame: HTMLElement;
  hover: HTMLElement;
  select: HTMLElement;
  hoverNode?: Node;

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;
    const frame = this.frame = document.createElement('div');
    frame.className = 'frame';
    frame.style.display = 'none';
    frame.style.position = 'absolute';
    frame.style.left = '0px';
    frame.style.top = '0px';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.transformOrigin = '0 0';
    frame.style.boxSizing = 'border-box';
    frame.style.border = '1px solid rgba(0, 0, 0, 0.1)';
    frame.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    frame.style.pointerEvents = 'none';
    dom.appendChild(frame);

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

    const select = this.select = document.createElement('div');
    select.className = 'select';
    select.style.display = 'none';
    select.style.position = 'absolute';
    select.style.transformOrigin = '0 0';
    select.style.pointerEvents = 'none';
    select.innerHTML = html;
    dom.appendChild(select);
  }

  showFrame(x: number, y: number, w: number, h: number) {
    this.frame.style.left = x + 'px';
    this.frame.style.top = y + 'px';
    this.updateFrame(w, h);
    this.frame.style.display = 'block';
  }

  updateFrame(w: number, h: number) {
    this.frame.style.width = Math.abs(w) + 'px';
    this.frame.style.height = Math.abs(h) + 'px';
    this.frame.style.transform = `scale(${w >= 0 ? 1 : -1}, ${h >= 0 ? 1 : -1})`;
  }

  hideFrame() {
    this.frame.style.display = 'none';
  }

  showHover(node: Node) {
    this.hoverNode = node;
    this.updateHover(node);
    this.hover.style.display = 'block';
  }

  hideHover() {
    this.hoverNode = undefined;
    this.hover.style.display = 'none';
  }

  // hover/select时单个节点的位置，包含镜像旋转等在内的transform，换算成dom的实际宽高尺寸
  calRect(node: Node) {
    const root = this.root;
    const dpi = root.dpi;
    const computedStyle = node.computedStyle;
    let rect = node._rect || node.rect;
    let matrix = node.matrixWorld;
    if (dpi !== 1) {
      const t = identity();
      multiplyScale(t, 1 / dpi);
      matrix = multiply(t, matrix);
    }
    const isLine = node instanceof Polyline && node.isLine();
    if (isLine) {
      rect = node.rectLine;
    }
    let { x1, y1, x2, y2, x3, y3, x4, y4 } = calRectPoints(rect[0], rect[1], rect[2], rect[3], matrix);
    if (computedStyle.scaleX === -1) {
      [x1, x2] = [x2, x1];
      [y1, y2] = [y2, y1];
      [x3, x4] = [x4, x3];
      [y3, y4] = [y4, y3];
    }
    if (computedStyle.scaleY === -1) {
      [x1, x4] = [x4, x1];
      [y1, y4] = [y4, y1];
      [x2, x3] = [x3, x2];
      [y2, y3] = [y3, y2];
    }
    const width = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    const height = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
    const res = {
      left: x1,
      top: y1,
      width,
      height,
      transform: '',
    };
    if (x2 > x1) {
      if (y2 !== y1) {
        const deg = r2d(Math.atan((y2 - y1) / (x2 - x1)));
        res.transform = `rotateZ(${deg}deg)`;
      }
    }
    else if (x2 < x1) {
      const deg = r2d(Math.atan((y2 - y1) / (x2 - x1)));
      res.transform = `rotateZ(${deg + 180}deg)`;
    }
    else {
      if (y2 > y1) {
        res.transform = `rotateZ(90deg)`;
      }
      else if (y2 < y1) {
        res.transform = `rotateZ(-90deg)`;
      }
    }
    return res;
  }

  updateHover(node: Node) {
    const res = this.calRect(node);
    this.hover.style.left = res.left + 'px';
    this.hover.style.top = res.top + 'px';
    this.hover.style.width = res.width + 'px';
    this.hover.style.height = res.height + 'px';
    this.hover.style.transform = res.transform;
  }

  showSelect(selected: Node[]) {
    this.updateSelect(selected);
    this.select.style.display = 'block';
  }

  updateSelect(selected: Node[]) {
    if (selected.length === 1) {
      const res = this.calRect(selected[0]);
      this.select.style.left = res.left + 'px';
      this.select.style.top = res.top + 'px';
      this.select.style.width = res.width + 'px';
      this.select.style.height = res.height + 'px';
      this.select.style.transform = res.transform;
    }
    // 多个时表现不一样，忽略了旋转镜像等transform，取所有节点的boundingClientRect全集
    else if (selected.length > 1) {
      let left = 0, top = 0, right = 0, bottom = 0;
      selected.forEach((item, i) => {
        const rect = item.getBoundingClientRect();
        if (i) {
          left = Math.min(left, rect.left);
          top = Math.min(top, rect.top);
          right = Math.max(right, rect.right);
          bottom = Math.max(bottom, rect.bottom);
        }
        else {
          left = rect.left;
          top = rect.top;
          right = rect.right;
          bottom = rect.bottom;
        }
      });
      const dpi = this.root.dpi;
      this.select.style.left = left / dpi + 'px';
      this.select.style.top = top / dpi + 'px';
      this.select.style.width = (right - left) / dpi + 'px';
      this.select.style.height = (bottom - top) / dpi + 'px';
      this.select.style.transform = '';
    }
  }

  hideSelect() {
    this.select.style.display = 'none';
  }

  isSelectControlDom(dom: HTMLElement) {
    return dom.parentElement === this.select;
  }

  destroy() {
    this.hover.remove();
    this.hideSelect();
  }

  metaKey(meta: boolean) {
    if (meta) {
      this.select.querySelectorAll('.tl, .tr, .bl, .br').forEach(item => {
        (item as HTMLElement).style.cursor = 'cell';
      });
    }
    else {
      (this.select.querySelector('.tl') as HTMLElement).style.cursor = 'nwse-resize';
      (this.select.querySelector('.tr') as HTMLElement).style.cursor = 'nesw-resize';
      (this.select.querySelector('.bl') as HTMLElement).style.cursor = 'nesw-resize';
      (this.select.querySelector('.br') as HTMLElement).style.cursor = 'nwse-resize';
    }
  }
}
