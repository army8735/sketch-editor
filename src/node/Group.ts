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

  // 覆盖实现，有最小尺寸约束，更新要预防
  override updateStyle(style: any, cb?: Function) {
    const { keys, formatStyle } = this.preUpdateStyleData(style);
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
          // 限制导致的无效更新去除
          if ((formatStyle.right.v as number) === max) {
            let i = keys.indexOf('right');
            keys.splice(i, 1);
          }
          else {
            formatStyle.right.v = this.style.right.v = max;
          }
        }
      }
    }
    else if (style.hasOwnProperty('width')) {}
    // 再次检测可能因为尺寸限制造成的style更新无效，即限制后和当前一样
    if (this.preUpdateStyleCheck(keys)) {
      cb && cb(true);
      return;
    }
    this.root!.addUpdate(this, keys, undefined, false, false, cb);
  }

  // 获取单个孩子相对于本父元素的盒子尺寸
  private getChildRect(child: Node) {
    const { x: gx, y: gy } = this;
    const { x, y, width, height, matrix } = child;
    let {
      x1, y1,
      x2, y2,
      x3, y3,
      x4, y4,
    } = calRectPoint(x, y, x + width, y + height, matrix);
    // 相对父原点
    x1 -= gx;
    y1 -= gy;
    x2 -= gx;
    y2 -= gy;
    x3 -= gx;
    y3 -= gy;
    x4 -= gx;
    y4 -= gy;
    return {
      minX: Math.min(x1, x2, x3, x4),
      minY: Math.min(y1, y2, y3, y4),
      maxX: Math.max(x1, x2, x3, x4),
      maxY: Math.max(y1, y2, y3, y4),
    };
  }

  // 获取所有孩子相对于本父元素的盒子尺寸，再全集的极值
  private getChildrenRect() {
    const { width: gw, height: gh, children } = this;
    let rect = children.length
      ? this.getChildRect(children[0])
      : {
        minX: 0,
        minY: 0,
        maxX: gw,
        maxY: gh,
      };
    for (let i = 1, len = children.length; i < len; i++) {
      const child = children[i];
      const { minX, minY, maxX, maxY } = this.getChildRect(child);
      rect.minX = Math.min(rect.minX, minX);
      rect.minY = Math.min(rect.minY, minY);
      rect.maxX = Math.max(rect.maxX, maxX);
      rect.maxY = Math.max(rect.maxY, maxY);
    }
    return rect;
  }

  // 根据新的盒子尺寸调整自己和孩子的定位尺寸
  override adjustPosAndSize() {
    const { style, computedStyle, parent, children,
      width: gw, height: gh } = this;
    if (!parent) {
      return false;
    }
    const rect = this.getChildrenRect();
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
          this.x += rect.minX;
          left.v += rect.minX * 100 / pw;
          computedStyle.left += rect.minX;
        }
        if (rect.maxX !== gw) {
          const v = rect.maxX - gw;
          right.v -= v * 100 / pw;
          computedStyle.right -= v;
        }
        this.width = parent.width - computedStyle.left - computedStyle.right;
      }
      else {}
      // 高度自动，则上下必然有值
      if (height.u === StyleUnit.AUTO) {
        if (rect.minY !== 0) {
          this.y += rect.minY;
          top.v += rect.minY * 100 / ph;
          computedStyle.top += rect.minY;
        }
        if (rect.maxY !== gh) {
          const v = rect.maxY - gh;
          bottom.v -= v * 100 / ph;
          computedStyle.bottom -= v;
        }
        this.height = parent.height - computedStyle.top - computedStyle.bottom;
      }
      else {}
      // 记得重置
      this._rect = undefined;
      this._bbox = undefined;
      // 后面计算要用新的值
      const { width: gw2, height: gh2 } = this;
      // 再改孩子的，只改TRBL，x/y/width/height/translate不变，无需递归向下
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        const { style, computedStyle } = child;
        const {
          top,
          right,
          bottom,
          left,
        } = style;
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
        // 同上
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
        // 记得重置
        child._rect = undefined;
        child._bbox = undefined;
      }
      return true;
    }
    return false;
  }

  // 组调整尺寸reflow后，先递归看子节点，可能会变更如left百分比等数据，需重新计算更新，
  // 这个递归是深度递归回溯，先叶子节点的变化及对其父元素的影响，然后慢慢向上到引发检测的组，
  // 然后再向上看，和位置变化一样，自身的改变向上递归影响父级组的尺寸位置。
  override checkSizeChange() {
    this.checkPosSizeDownward();
    this.checkPosSizeUpward();
  }

  private checkPosSizeDownward() {
    const { children } = this;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      if (child instanceof Group) {
        child.checkPosSizeDownward();
      }
    }
    return this.adjustPosAndSize();
  }
}

export default Group;
