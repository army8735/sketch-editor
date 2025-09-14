import Container from './Container';
import Node from './Node';
import { Props } from '../format';
import { StyleUnit } from '../style/define';
import { RefreshLevel } from '../refresh/level';
import { calPoint, identity, multiply, multiplyScaleX, multiplyScaleY, multiplyTranslate } from '../math/matrix';
import { calMatrixByOrigin, calRotateZ } from '../style/transform';
import { calSize } from '../style/css';

const EPS = 1e-4;

abstract class AbstractGroup extends Container {
  fixedPosAndSize: boolean;

  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.fixedPosAndSize = false;
  }

  override didMount() {
    super.didMount();
    // 冒泡过程无需向下检测，直接向上
    this.adjustPosAndSize();
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
    if (!rectC) {
      rectC = this.getChildrenRect();
    }
    let { width, height } = this;
    let dx1 = rectC.minX,
      dy1 = rectC.minY,
      dx2 = rectC.maxX - width,
      dy2 = rectC.maxY - height;
    const w = rectC.maxX - rectC.minX;
    if (w < 0.5) {
      const r0 = rectC.minX;
      const r1 = rectC.maxX = rectC.minX + 0.5;
      dx1 = r0;
      dx2 = r1 - width;
    }
    const h = rectC.maxY - rectC.minY;
    if (h < 0.5) {
      const r0 = rectC.minY;
      const r1 = rectC.minY = rectC.minY + 0.5;
      dy1 = r0;
      dy2 = r1 - height;
    }
    // 检查真正有变化，位置相对于自己原本位置为原点
    if (Math.abs(dx1) > EPS
      || Math.abs(dy1) > EPS
      || Math.abs(dx2) > EPS
      || Math.abs(dy2) > EPS)
    {
      const { left, top, translateX, translateY, rotateZ, scaleX, scaleY } = this.computedStyle;
      if (rotateZ || scaleX !== 1 || scaleY !== 1) {
        // 先计算左上原点/右下点原始位置作为定位参考
        const p1 = { x: left + translateX, y: top + translateY };
        const p2 = { x: p1.x + this.width, y: p1.y + this.height };
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
        // 和正常的calMatrix顺序反了过来，因为在flip+rotate的情况下模拟逆运算，先逆旋转再逆flip
        calRotateZ(i, -rotateZ);
        if (scaleX === -1) {
          multiplyScaleX(i, -1);
        }
        if (scaleY === -1) {
          multiplyScaleY(i, -1);
        }
        let m2 = calMatrixByOrigin(i, cx, cy);
        m2 = multiply(this.matrix, m2);
        const n1 = calPoint({ x: 0, y: 0 }, m2);
        const n2 = calPoint({ x: nw, y: nh }, m2);
        this.adjustPosAndSizeSelf(n1.x - p1.x, n1.y - p1.y, n2.x - p2.x, n2.y - p2.y);
      }
      else {
        this.adjustPosAndSizeSelf(dx1, dy1, dx2, dy2);
      }
      // 再改孩子的，和自身恰好反向，后面孩子计算要根据新的值，无需递归向下
      this.adjustPosAndSizeChild(-dx1, -dy1, -dx2, -dy2);
      return true;
    }
    return false;
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
