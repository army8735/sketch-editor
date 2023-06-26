import { JNode, JPage, PageProps, TagName } from '../format';
import {
  ArtBoardProps,
  BitmapProps,
  JContainer,
  PolylineProps,
  TextProps,
} from '../format/';
import { calPoint, inverse4 } from '../math/matrix';
import { normalize } from '../style/css';
import { calMatrix } from '../style/transform';
import ArtBoard from './ArtBoard';
import Bitmap from './Bitmap';
import Container from './Container';
import Polyline from './geom/Polyline';
import ShapeGroup from './geom/ShapeGroup';
import Group from './Group';
import Node from './Node';
import Text from './Text';

function parse(json: JNode): Node | undefined {
  if (json.tagName === TagName.ArtBoard) {
    const children = [];
    for (let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i]);
      if (res) {
        children.push(res);
      }
    }
    return new ArtBoard(json.props as ArtBoardProps, children);
  } else if (json.tagName === TagName.Group) {
    const children = [];
    for (let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i]);
      if (res) {
        children.push(res);
      }
    }
    return new Group(json.props, children);
  } else if (json.tagName === TagName.Bitmap) {
    return new Bitmap(json.props as BitmapProps);
  } else if (json.tagName === TagName.Text) {
    return new Text(json.props as TextProps);
  } else if (json.tagName === TagName.Polyline) {
    return new Polyline(json.props as PolylineProps);
  } else if (json.tagName === TagName.ShapeGroup) {
    const children = [];
    for (let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i]) as
        | Polyline
        | ShapeGroup;
      if (res) {
        children.push(res);
      }
    }
    return new ShapeGroup(json.props, children);
  }
}

class Page extends Container {
  json?: JPage;
  constructor(props: PageProps, children: Array<Node>) {
    super(props, children);
    this.isPage = true;
    this.page = this;
  }

  initIfNot() {
    if (this.json) {
      for (let i = 0, len = this.json.children.length; i < len; i++) {
        const res = parse(this.json.children[i]);
        if (res) {
          this.appendChild(res);
        }
      }
      this.json = undefined;
    }
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
    } else {
      this.updateStyle({
        translateX: -tx * sx,
        translateY: -ty * sx - (h * sx - height) * 0.5,
        scaleX: sx,
        scaleY: sx,
      });
    }
  }
}

export default Page;
