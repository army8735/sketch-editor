import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import {
  JNode,
  JPage,
  PageProps,
  TAG_NAME,
} from '../format/';
import { calPoint, inverse4 } from '../math/matrix';
import { normalize } from '../style/css';
import { calMatrix } from '../style/transform';
import Container from './Container';
import Node from './Node';
import { parse } from './parse';

class Page extends Container {
  json?: JPage;

  constructor(props: PageProps, children: Node[]) {
    super(props, children);
    this.isPage = true;
    this.page = this;
  }

  initIfNot() {
    if (this.json) {
      for (let i = 0, len = this.json.children.length; i < len; i++) {
        const res = parse(this.json.children[i], this.root!);
        if (res) {
          this.appendChild(res);
        }
      }
      this.json = undefined;
      return true;
    }
    return false;
  }

  // 以cx/cy为中心点进行缩放，默认画布50%中心处
  zoomTo(scale: number, cx = 0.5, cy = 0.5) {
    if (!this.root || this.isDestroyed) {
      this.updateStyle({
        scaleX: scale,
        scaleY: scale,
      });
      return;
    }
    const { translateX, translateY, scaleX } = this.getComputedStyle();
    if (scaleX === scale) {
      return;
    }
    const i = inverse4(this.matrixWorld);
    const { width, height, dpi } = this.root;
    const x = (cx * width) / dpi;
    const y = (cy * height) / dpi;
    const pt = {
      x: x * dpi,
      y: y * dpi,
    };
    // 求出鼠标屏幕坐标在画布内相对page的坐标
    const pt1 = calPoint(pt, i);
    const style = normalize({
      translateX,
      translateY,
      scaleX: scale,
      scaleY: scale,
    });
    const newMatrix = calMatrix(style);
    // 新缩放尺寸，位置不动，相对page坐标在新matrix下的坐标
    const pt2 = calPoint(pt1, newMatrix);
    // 差值是需要调整的距离
    const dx = pt2.x - pt.x / dpi;
    const dy = pt2.y - pt.y / dpi;
    this.updateStyle({
      translateX: translateX - dx,
      translateY: translateY - dy,
      scaleX: scale,
      scaleY: scale,
    });
  }

  zoomFit() {
    const children = this.children;
    if (!children.length || !this.root) {
      return;
    }
    // 先求得所有直接子节点的可视范围矩形
    const first = children[0];
    const [x1, y1, x2, y2] = first.rect;
    const matrix = first.matrix;
    const t1 = calPoint({ x: x1, y: y1 }, matrix);
    const t2 = calPoint({ x: x1, y: y2 }, matrix);
    const t3 = calPoint({ x: x2, y: y1 }, matrix);
    const t4 = calPoint({ x: x2, y: y2 }, matrix);
    let xa = Math.min(t1.x, t2.x, t3.x, t4.x);
    let ya = Math.min(t1.y, t2.y, t3.y, t4.y);
    let xb = Math.max(t1.x, t2.x, t3.x, t4.x);
    let yb = Math.max(t1.y, t2.y, t3.y, t4.y);
    for (let i = 1, len = children.length; i < len; i++) {
      const item = children[i];
      const [x1, y1, x2, y2] = item.rect;
      const matrix = item.matrix;
      const t1 = calPoint({ x: x1, y: y1 }, matrix);
      const t2 = calPoint({ x: x1, y: y2 }, matrix);
      const t3 = calPoint({ x: x2, y: y1 }, matrix);
      const t4 = calPoint({ x: x2, y: y2 }, matrix);
      xa = Math.min(xa, t1.x, t2.x, t3.x, t4.x);
      ya = Math.min(ya, t1.y, t2.y, t3.y, t4.y);
      xb = Math.max(xb, t1.x, t2.x, t3.x, t4.x);
      yb = Math.max(yb, t1.y, t2.y, t3.y, t4.y);
    }
    // 将这个矩形缩放移至当前窗口，稍微留5%的空白边距，相当于矩形四周扩大5%
    let w = xb - xa;
    let h = yb - ya;
    if (!w || !h) {
      return;
    }
    const tx = xa - w * 0.05;
    const ty = ya - h * 0.05;
    w *= 1.1;
    h *= 1.1;
    let { width, height, dpi } = this.root;
    width = Math.max(width, 100) / dpi;
    height = Math.max(height, 100) / dpi;
    const sx = width / w;
    const sy = height / h;
    // 可视矩形和浏览器画布矩形长短比例不一定一致，一边缩放后另一边需居中对齐，以较长的一边为缩放基准
    if (sx >= sy) {
      this.updateStyle({
        translateX: -tx * sy - (w * sy - width) * 0.5,
        translateY: -ty * sy,
        scaleX: sy,
        scaleY: sy,
      });
    }
    else {
      this.updateStyle({
        translateX: -tx * sx,
        translateY: -ty * sx - (h * sx - height) * 0.5,
        scaleX: sx,
        scaleY: sx,
      });
    }
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.PAGE;
    return res;
  }

  override async toSketchJson(zip: JSZip, filter?: (node: Node) => boolean): Promise<SketchFormat.Page> {
    const json = await super.toSketchJson(zip, filter) as SketchFormat.Page;
    json._class = SketchFormat.ClassValue.Page;
    json.hasClickThrough = true;
    json.horizontalRulerData = {
      _class: 'rulerData',
      base: 0,
      guides: [],
    };
    json.verticalRulerData = {
      _class: 'rulerData',
      base: 0,
      guides: [],
    };
    const list = await Promise.all(this.children.filter(item => {
      if (filter) {
        return filter(item);
      }
      return true;
    }).map(item => {
      return item.toSketchJson(zip, filter);
    }));
    json.layers = list.map(item => {
      return item as SketchFormat.Artboard |
        SketchFormat.Group |
        SketchFormat.Oval |
        SketchFormat.Polygon |
        SketchFormat.Rectangle |
        SketchFormat.ShapePath |
        SketchFormat.Star |
        SketchFormat.Triangle |
        SketchFormat.ShapeGroup |
        SketchFormat.Text |
        SketchFormat.SymbolMaster |
        SketchFormat.SymbolInstance |
        SketchFormat.Slice |
        SketchFormat.Hotspot |
        SketchFormat.Bitmap;
    });
    return json;
  }
}

export default Page;
