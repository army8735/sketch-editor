import Node from './Node';
import Container from './Container';
import { Props } from '../format';
import { calRectPoint } from '../math/matrix';
import { StyleUnit } from '../style/define';
import { calSize } from '../style/css';
import { calMatrixByOrigin } from '../style/transform';

class Group extends Container {
  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.isGroup = true;
  }

  override updateStyle(style: any, cb?: Function) {
    const { ignore, keys, formatStyle } = this.preUpdateStyleData(style);
    if (ignore) {
      cb && cb(true);
      return;
    }
    // 最小尺寸约束
    const parent = this.parent!;
    const computedStyle = this.computedStyle;
    // 组只能调左/右/左右/宽，不能同时左右和宽，因为互斥
    if (style.hasOwnProperty('left') && style.hasOwnProperty('right')) {}
    else if (style.hasOwnProperty('left')) {}
    else if (style.hasOwnProperty('right')) {
      const right = calSize(formatStyle.right, parent.width);
      const w = parent.width - computedStyle.left - right;
      if (w < this.minWidth) {
        if (formatStyle.right.u === StyleUnit.PX) {}
        else if (formatStyle.right.u === StyleUnit.PERCENT) {
          const max = (parent.width - computedStyle.left - this.minWidth) * 100 / parent.width;
          if ((formatStyle.right.v as number) === max) {
            let i = keys.indexOf('right');
            keys.splice(i, 1);
          }
          else {
            formatStyle.right.v = max;
          }
        }
      }
    }
    else if (style.hasOwnProperty('width')) {}
    // 再次检测可能以为尺寸限制造成的style更新无效，即限制后和当前一样
    if (!keys.length) {
      cb && cb(true);
      return;
    }
    // 和Node不同，这个检测需再最小尺寸约束之后
    if (this.preUpdateStyleCheck()) {
      cb && cb(true);
      return;
    }
    this.root!.addUpdate(this, keys, undefined, false, false, false, cb);
  }

  // 孩子布局调整后，组需要重新计算x/y/width/height，并且影响子节点的left/width等，还不能触发渲染
  checkFitPS() {
    const { children, style, computedStyle, parent } = this;
    if (!parent) {
      return false;
    }
    const { x: gx, y: gy, width: gw, height: gh } = this;
    let rect: any = {}, list = [];
    // 先循环一遍收集孩子数据，得到当前所有孩子所占位置尺寸的信息集合，坐标是相对于父元素（本组）修正前的
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const { x, y, width, height, transform } = child;
      const r = new Float64Array(4);
      r[0] = x - gx;
      r[1] = y - gy;
      r[2] = r[0] + width;
      r[3] = r[1] + height;
      // matrix需要按父级原点计算
      const matrix = calMatrixByOrigin(transform, r[0] + width * 0.5, r[1] + height * 0.5);
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
      const { width: gw2, height: gh2 } = this;
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
            // 如果向左拖发生了group的x变更，则minX为负数，子节点的left值增加
            computedStyle.left -= rect.minX;
            if (left.u === StyleUnit.PX) {
              left.v = computedStyle.left;
            }
            else if (left.u === StyleUnit.PERCENT) {
              left.v = computedStyle.left * 100 / gw2;
            }
            // 如果向右拖发生了group的width变更，则maxX比原本的width大，子节点的right值增加
            computedStyle.right += rect.maxX - gw;
            if (right.u === StyleUnit.PX) {
              right.v = computedStyle.right;
            }
            else if (right.u === StyleUnit.PERCENT) {
              right.v = computedStyle.right * 100 / gw2;
            }
          }
        }
        else {}
        // 高度自动，则上下必然有值
        if (height.u === StyleUnit.AUTO) {
          if (rect.minY !== 0 || rect.maxY !== gh) {
            computedStyle.top -= rect.minY;
            if (top.u === StyleUnit.PX) {
              top.v = computedStyle.top;
            }
            else if (top.u === StyleUnit.PERCENT) {
              top.v = computedStyle.top * 100 / gh2;
            }
            computedStyle.bottom += rect.maxY - gh;
            if (bottom.u === StyleUnit.PX) {
              bottom.v = computedStyle.bottom;
            }
            else if (bottom.u === StyleUnit.PERCENT) {
              bottom.v = computedStyle.bottom * 100 / gh2;
            }
          }
        }
        else {}
        child._rect = undefined;
        child._bbox = undefined;
      }
      return true;
    }
    return false;
  }

  checkSizeChange() {}
}

export default Group;
