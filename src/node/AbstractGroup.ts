import Container from './Container';
import Node from './Node';
import { Props } from '../format';
import { StyleUnit } from '../style/define';
import { RefreshLevel } from '../refresh/level';
import { calPoint, identity, multiply, multiplyTranslate } from '../math/matrix';
import { calMatrixByOrigin, calRotateZ } from '../style/transform';
import { calSize } from '../style/css';

const EPS = 1e-4;

abstract class AbstractGroup extends Container {
  fixedPosAndSize: boolean;

  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.fixedPosAndSize = false;
  }
  // 根据新的盒子尺寸调整自己和直接孩子的定位尺寸，有调整返回true
  override adjustPosAndSize(rectC?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }) {
    if (this.fixedPosAndSize) {
      return false;
    }
    const { children } = this;
    if (!rectC) {
      rectC = this.getChildrenRect();
    }
    let { width, height } = this;
    const dx1 = rectC.minX,
      dy1 = rectC.minY,
      dx2 = rectC.maxX - width,
      dy2 = rectC.maxY - height;
    // 检查真正有变化，位置相对于自己原本位置为原点
    if (Math.abs(dx1) > EPS
      || Math.abs(dy1) > EPS
      || Math.abs(dx2) > EPS
      || Math.abs(dy2) > EPS)
    {
      const { transformOrigin, rotateZ } = this.computedStyle;
      if (rotateZ) {
        // 先计算左上原点/右下点逆旋转后的位置作为定位参考
        const i1 = identity();
        calRotateZ(i1, -rotateZ);
        let m1 = calMatrixByOrigin(i1, transformOrigin[0], transformOrigin[1]);
        m1 = multiply(this.matrix, m1);
        const p1 = calPoint({ x: 0, y: 0 }, m1);
        const p2 = calPoint({ x: this.width, y: this.height }, m1);
        const nw = this.width - dx1 + dx2;
        const nh = this.height - dy1 + dy2;
        // 计算新的transformOrigin，目前都是中心点
        const [cx, cy] = this.style.transformOrigin.map((item, i) => {
          return calSize(item, i ? nh : nw);
        });
        // 用新的tfo逆旋转回去，位置可能发生了位移
        const i = identity();
        if (dx1 || dy1) {
          multiplyTranslate(i, dx1, dy1);
        }
        calRotateZ(i, -rotateZ);
        let m2 = calMatrixByOrigin(i, cx, cy);
        m2 = multiply(this.matrix, m2);
        const n1 = calPoint({ x: 0, y: 0 }, m2);
        const n2 = calPoint({ x: nw, y: nh }, m2);
        this.adjustPosAndSizeSelf(n1.x - p1.x, n1.y - p1.y, n2.x - p2.x, n2.y - p2.y);
      }
      else {
        this.adjustPosAndSizeSelf(dx1, dy1, dx2, dy2);
      }
      // 先调整自己，之后尺寸更新用新wh
      width = this.width;
      height = this.height;
      // 再改孩子的，后面孩子计算要根据新的值，无需递归向下
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        this.adjustPosAndSizeChild(child, dx1, dy1, dx2, dy2, width, height);
      }
      return true;
    }
    return false;
  }

  // 父级组调整完后，直接子节点需跟着变更调整，之前数据都是相对于没调之前组的老的，位置和尺寸可能会同时发生变更
  protected adjustPosAndSizeChild(
    child: Node,
    dx1: number,
    dy1: number,
    dx2: number,
    dy2: number,
    gw: number,
    gh: number,
  ) {
    const { style, computedStyle, root } = child;
    if (!root) {
      return;
    }
    const {
      top,
      right,
      bottom,
      left,
    } = style;
    // 如果向左拖发生了group的x变更，则dx为负数，子节点的left值增加，
    // 如果向右拖发生了group的width变更，则maxX比原本的width大，子节点的right值增加
    // 2个只要有发生，都会影响左右，因为干扰尺寸
    if (dx1 || dx2) {
      computedStyle.left -= dx1;
      if (left.u === StyleUnit.PX) {
        left.v = computedStyle.left;
      }
      else if (left.u === StyleUnit.PERCENT && gw) {
        left.v = (computedStyle.left * 100) / gw;
      }
      computedStyle.right += dx2;
      if (right.u === StyleUnit.PX) {
        right.v = computedStyle.right;
      }
      else if (right.u === StyleUnit.PERCENT && gw) {
        right.v = (computedStyle.right * 100) / gw;
      }
    }
    // 类似水平情况
    if (dy1 || dy2) {
      computedStyle.top -= dy1;
      if (top.u === StyleUnit.PX) {
        top.v = computedStyle.top;
      }
      else if (top.u === StyleUnit.PERCENT && gh) {
        top.v = (computedStyle.top * 100) / gh;
      }
      computedStyle.bottom += dy2;
      if (bottom.u === StyleUnit.PX) {
        bottom.v = computedStyle.bottom;
      }
      else if (bottom.u === StyleUnit.PERCENT && gh) {
        bottom.v = (computedStyle.bottom * 100) / gh;
      }
    }
    // 影响matrix，这里不能用优化optimize计算，必须重新计算，因为最终值是left+translateX
    child.refreshLevel |= RefreshLevel.TRANSFORM;
    root.rl |= RefreshLevel.TRANSFORM;
    child.calMatrix(RefreshLevel.TRANSFORM);
    // 记得重置
    child._rect = undefined;
    child._bbox = undefined;
    child._bbox2 = undefined;
    child._filterBbox = undefined;
    child._filterBbox2 = undefined;
    child.tempBbox = undefined;
  }

  // 添加一个节点后，可能新节点在原本bbox之外，组需要调整尺寸
  checkPosSizeSelf() {
    if (this.adjustPosAndSize()) {
      this.checkPosSizeUpward();
    }
  }

  static get EPS() {
    return EPS;
  }
}

export default AbstractGroup;
