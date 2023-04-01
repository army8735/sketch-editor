import Node from './Node';
import Container from './Container';
import { Props } from '../format';
import { calRectPoint } from '../math/matrix';
import { StyleUnit } from '../style/define';
import { calSize } from '../style/css';

class Group extends Container {
  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.isGroup = true;
  }

  // 孩子布局调整后，组需要重新计算x/y/width/height，并且影响子节点的left/width等，还不能触发渲染
  checkFitPS() {
    const { children, style, computedStyle, parent } = this;
    if (!parent) {
      return;
    }
    const { x: gx, y: gy, width: gw, height: gh } = this;
    let rect: any = {}, list = [];
    // 先循环一遍收集孩子数据，得到当前所有孩子所占位置尺寸的信息集合，坐标是相对于父元素（本组）修正前的
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const { x, y, width, height, matrix } = child;
      const r = new Float64Array(4);
      r[0] = x - gx;
      r[1] = y - gy;
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
    // 检查真正有变化，位置相对于自己原本位置为原点
    if (rect.minX !== 0 || rect.minY !== 0 || rect.maxX !== gw || rect.maxY !== gh) {
      const { width: pw, height: ph } = parent;
      // 先改自己的尺寸
      const {
        top,
        right,
        bottom,
        left,
        width,
        height,
      } = style;
      // 宽度自动，则左右必然有值
      if (width.u === StyleUnit.AUTO) {
        if (rect.minX !== 0) {
          left.v = (left.v as number) + rect.minX * 100 / pw;
          computedStyle.left = calSize(left, pw);
        }
        if (rect.maxX !== gw) {
          right.v = (right.v as number) - (rect.maxX - gw) * 100 / pw;
          computedStyle.right = calSize(right, pw);
        }
        this.x = parent.x + computedStyle.left;
        this.width = parent.width - computedStyle.left - computedStyle.right;
      }
      else {}
      // 高度自动，则上下必然有值
      if (height.u === StyleUnit.AUTO) {
        if (rect.minY !== 0) {
          top.v = (top.v as number) + rect.minY * 100 / ph;
          computedStyle.top = calSize(top, ph);
        }
        if (rect.maxY !== gh) {
          bottom.v = (bottom.v as number) - (rect.maxY - gh) * 100 / ph;
          computedStyle.bottom = calSize(bottom, ph);
        }
        this.y = parent.y + computedStyle.top;
        this.height = parent.height - computedStyle.top - computedStyle.bottom;
      }
      else {}
      this._rect = undefined;
      this._bbox = undefined;
      // 后面计算要用新的值
      const { x: gx2, y: gy2, width: gw2, height: gh2 } = this;
      // 再改孩子的，无需递归向下
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        const { style, computedStyle } = child;
        const {
          top,
          right,
          bottom,
          left,
          width,
          height,
        } = style;
        // 宽度自动，则左右必然有值
        if (width.u === StyleUnit.AUTO) {
          // 注意判断条件，组的水平只要有x/width变更，child的水平都得全变
          if (rect.minX !== 0 || rect.maxX !== gw) {
            left.v = (child.x - gx2) * 100 / gw2;
            computedStyle.left = calSize(left, gw2);
            right.v = (gw2 - child.x + gx2 - child.width) * 100 / gw2;
            computedStyle.right = calSize(right, gw2);
          }
        }
        else {}
        // 高度自动，则上下必然有值
        if (height.u === StyleUnit.AUTO) {
          if (rect.minY !== 0 || rect.maxY !== gh) {
            top.v = (child.y - gy2) * 100 / gh2;
            computedStyle.top = calSize(top, gh2);
            bottom.v = (gh2 - child.y + gy2 - child.height) * 100 / gh2;
            computedStyle.bottom = calSize(bottom, gh2);
          }
        }
        else {}
        child._rect = undefined;
        child._bbox = undefined;
      }
    }
  }
}

export default Group;
