import Node from '../node/Node';
import Root from '../node/Root';
import { calRectPoints, identity, multiply, multiplyScale, multiplyTranslate } from '../math/matrix';
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
  <span class="tl" style="position:absolute;left:0;top:0;width:14px;height:14px;transform:translate(-50%,-50%)scale(0.5);cursor:nwse-resize;pointer-events:auto;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="tr" style="position:absolute;right:0;top:0;width:14px;height:14px;transform:translate(50%,-50%)scale(0.5);cursor:nesw-resize;pointer-events:auto;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="br" style="position:absolute;right:0;bottom:0;width:14px;height:14px;transform:translate(50%,50%)scale(0.5);cursor:nwse-resize;pointer-events:auto;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
  <span class="bl" style="position:absolute;left:0;bottom:0;width:14px;height:14px;transform:translate(-50%,50%)scale(0.5);cursor:nesw-resize;pointer-events:auto;">
    <b style="position:absolute;box-sizing:border-box;width:100%;height:100%;border:1px solid #999;background:#FFF;box-shadow:0 0 4px rgba(0,0,0,0.5);pointer-events:none;"></b>
  </span>
`;

export default class Select {
  root: Root;
  dom: HTMLElement;
  frame: HTMLElement;
  hover: HTMLElement;
  select: HTMLElement[];

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

    this.select = [];
  }

  showFrame(x: number, y: number, w: number, h: number) {
    this.frame.style.display = 'block';
    this.frame.style.left = x + 'px';
    this.frame.style.top = y + 'px';
    this.updateFrame(w, h)
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
    this.hover.style.display = 'block';
    this.updateHover(node);
  }

  hideHover() {
    this.hover.style.display = 'none';
  }

  calRect(node: Node) {
    const root = this.root;
    const dpi = root.dpi;
    const hover = this.hover;
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
    const { x1, y1, x2, y2, x3, y3, x4, y4 } = calRectPoints(rect[0], rect[1], rect[2], rect[3], matrix);
    const width = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    const height = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
    const res = {
      left: x1,
      top: y1,
      width,
      height,
      transform: '',
    };
    // 水平的特例，分为等效4类
    if (Math.abs(y2 - y1) < 1e-10) {
      if (x2 > x1) {
        if (y3 > y2) {
          res.transform = 'none';
        }
        else {
          res.transform = 'scaleY(-1)';
        }
      }
      else {
        if (y3 > y2) {
          res.transform = 'rotateZ(180deg) scaleY(-1)';
        }
        else {
          res.transform = 'rotateZ(180deg)';
        }
      }
      return res;
    }
    // 垂直的特例，分为等效4类
    else if (Math.abs(x2 - x1) < 1e-10) {
      if (y2 > y1) {
        if (x3 > x2) {
          res.transform = 'rotateZ(90deg) scaleY(-1)';
        }
        else {
          res.transform = 'rotateZ(90deg)';
        }
      }
      else {
        if (x3 > x2) {
          res.transform = 'rotateZ(270deg)';
        }
        else {
          res.transform = 'rotateZ(270deg) scaleY(-1)';
        }
      }
      return res;
    }
    // 普通旋转最终分为等效的4类
    if (x1 < x2) {
      const deg = r2d(Math.atan((y2 - y1) / (x2 - x1)));
      if (y1 < y4) {
        res.transform = `rotateZ(${deg}deg)`;
      }
      else {
        res.transform = `rotateZ(${deg}deg) scaleY(-1)`;
      }
    }
    else {
      const deg = r2d(Math.atan((y2 - y1) / (x1 - x2)));
      if (y1 > y4) {
        res.transform = `rotateZ(${180 - deg}deg)`;
      }
      else {
        res.transform = `rotateZ(${180 - deg}deg) scaleY(-1)`;
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

  isHoverDom(dom: HTMLElement) {
    return dom === this.hover || dom.parentElement === this.hover || dom.parentElement?.parentElement === this.hover;
  }

  showSelect(selected: Node[]) {
    this.hideSelect();
    selected.forEach(() => {
      const select = document.createElement('div');
      select.className = 'select';
      select.style.position = 'absolute';
      select.style.transformOrigin = '0 0';
      select.style.pointerEvents = 'none';
      select.innerHTML = html;
      this.dom.appendChild(select);
      this.select.push(select);
    });
    this.updateSelect(selected);
  }

  updateSelect(selected: Node[]) {
    selected.forEach((item, i) => {
      const res = this.calRect(item);
      const select = this.select[i];
      select.style.left = res.left + 'px';
      select.style.top = res.top + 'px';
      select.style.width = res.width + 'px';
      select.style.height = res.height + 'px';
      select.style.transform = res.transform;
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
