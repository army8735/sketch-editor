import Node from './Node';
import Container from './Container';
import { Props } from '../format';
import { calRectPoint } from '../math/matrix';
import { StyleKey, StyleUnit } from '../style/define';
import { calSize } from '../style/css';

class Group extends Container {
  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.isGroup = true;
  }

  // 孩子布局调整后，组需要重新计算x/y/width/height，并且影响子节点的left/width等，还不能触发渲染
  checkSize() {
    const { children, style, computedStyle, parent } = this;
    if (!parent) {
      return;
    }
    let rect: any = {}, list = [];
    // 先循环一遍收集孩子数据，得到当前所有孩子所占位置尺寸的信息集合
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const { x, y, width, height, matrix } = child;
      const r = new Float64Array(4);
      r[0] = x - this.x;
      r[1] = y - this.y;
      r[2] = r[0] + width;
      r[3] = r[1] + height;
      const c = calRectPoint(r[0], r[1], r[2], r[3], matrix);
      list.push(c);
      const {
        x1, y1,
        x2, y2,
        x3, y3,
        x4, y4,
      } = c;
      if (i) {
        rect.minX = Math.min(rect.minX, x1, x2, x3, x4);
        rect.minY = Math.min(rect.minY, y1, y2, y3, y4);
        rect.maxX = Math.max(rect.maxX, x1, x2, x3, x4);
        rect.maxY = Math.max(rect.maxY, y1, y2, y3, y4);
      }
      else {
        rect.minX = Math.min(x1, x2, x3, x4);
        rect.minY = Math.min(y1, y2, y3, y4);
        rect.maxX = Math.max(x1, x2, x3, x4);
        rect.maxY = Math.max(y1, y2, y3, y4);
      }
    }
    const rx = this.x - parent.x;
    const ry = this.y - parent.y;
    const { width: w, height: h } = this;
    const { width: pw, height: ph } = parent;
    // 检查真正有变化，和之前的位置尺寸相比
    if (rect.minX !== rx || rect.minY !== ry
      || rect.maxX !== rx + w || rect.maxY !== ry + h) {
      // 先改自己的尺寸
      const {
        [StyleKey.TOP]: top,
        [StyleKey.RIGHT]: right,
        [StyleKey.BOTTOM]: bottom,
        [StyleKey.LEFT]: left,
        [StyleKey.WIDTH]: width,
        [StyleKey.HEIGHT]: height,
      } = style;
      if (width.u === StyleUnit.AUTO) {
        if (rect.minX !== 0) {
          left.v = (left.v as number) + rect.minX * 100 / pw;
          computedStyle[StyleKey.LEFT] = calSize(left, pw);
        }
        if (rect.maxX !== w) {
          right.v = (right.v as number) + (rect.maxX - w) * 100 / pw;
          computedStyle[StyleKey.RIGHT] = calSize(right, pw);
        }
        this.x = parent.x + computedStyle[StyleKey.LEFT];
        this.width = parent.width - computedStyle[StyleKey.LEFT] - computedStyle[StyleKey.RIGHT];
      }
      else {}
      if (height.u === StyleUnit.AUTO) {
        if (rect.minY !== 0) {
          top.v = (top.v as number) + rect.minY * 100 / ph;
          computedStyle[StyleKey.TOP] = calSize(top, ph);
        }
        if (rect.maxY !== h) {
          bottom.v = (bottom.v as number) + (rect.maxY - h) * 100 / ph;
          computedStyle[StyleKey.BOTTOM] = calSize(bottom, ph);
        }
        this.y = parent.y + computedStyle[StyleKey.TOP];
        this.height = parent.height - computedStyle[StyleKey.TOP] - computedStyle[StyleKey.BOTTOM];
      }
      else {}
      this._rect = undefined;
      this._bbox = undefined;
      // 再改孩子的，无需递归向下
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        const { style, computedStyle } = child;
        console.log(i, child.x, this.x, style[StyleKey.LEFT]);
        const {
          [StyleKey.TOP]: top,
          // [StyleKey.RIGHT]: right,
          // [StyleKey.BOTTOM]: bottom,
          [StyleKey.LEFT]: left,
          [StyleKey.WIDTH]: width,
          [StyleKey.HEIGHT]: height,
        } = style;
        if (width.u === StyleUnit.AUTO) {
          if (rect.minX !== 0) {
            left.v = (child.x - this.x) * 100 / this.width;
            computedStyle[StyleKey.LEFT] = calSize(left, this.width);
          }
        }
        else {}
        if (height.u === StyleUnit.AUTO) {
          if (rect.minY !== 0) {
            top.v = (child.y - this.y) * 100 / this.height;
            computedStyle[StyleKey.TOP] = calSize(top, this.height);
          }
        }
        child._rect = undefined;
        child._bbox = undefined;
      }
    }
  }
}

export default Group;
