import * as uuid from 'uuid';
import Root from '../node/Root';
import Container from '../node/Container';
import { getDefaultStyle, JStyle, Props } from '../format/';
import {
  assignMatrix,
  calRectPoint,
  identity,
  isE,
  multiply2,
  multiplyRotateZ,
  multiplyScaleX,
  multiplyScaleY,
  toE,
} from '../math/matrix';
import { d2r } from '../math/geom';
import Event from '../util/Event';
import { LayoutData } from './layout';
import { calNormalLineHeight, calSize, color2rgbaStr, equalStyle, normalize } from '../style/css';
import { ComputedStyle, Style, StyleNumValue, StyleUnit } from '../style/define';
import { calMatrixByOrigin, calRotateZ } from '../style/transform';
import { Struct } from '../refresh/struct';
import { RefreshLevel } from '../refresh/level';
import CanvasCache from '../refresh/CanvasCache';
import TextureCache from '../refresh/TextureCache';

class Node extends Event {
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number; // 最小尺寸限制，当子节点有固定尺寸或者子节点还是组递归有固定时，最小限制不能调整
  minHeight: number; // 同上，同时要考虑子节点是文字的特殊情况，有类似一行最少文字宽度的情况
  props: Props;
  style: Style;
  computedStyle: ComputedStyle;
  root: Root | undefined;
  prev: Node | undefined;
  next: Node | undefined;
  parent: Container | undefined;
  isDestroyed: boolean;
  struct: Struct;
  refreshLevel: RefreshLevel;
  _opacity: number; // 世界透明度
  transform: Float64Array; // 不包含transformOrigin
  matrix: Float64Array; // 包含transformOrigin
  _matrixWorld: Float64Array; // 世界transform
  _rect: Float64Array | undefined; // x/y/w/h组成的内容框
  _bbox: Float64Array | undefined; // 包含filter/阴影内内容外的包围盒
  hasContent: boolean;
  canvasCache?: CanvasCache; // 先渲染到2d上作为缓存 TODO 超大尺寸分割
  textureCache?: TextureCache; // 从canvasCache生成的纹理缓存

  constructor(props: Props) {
    super();
    this.props = props;
    this.props.uuid = this.props.uuid || uuid.v4();
    this.style = normalize(getDefaultStyle(props.style));
    // @ts-ignore
    this.computedStyle = {}; // 输出展示的值
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.minWidth = 0;
    this.minHeight = 0;
    this.isDestroyed = true;
    this.struct = {
      node: this,
      num: 0,
      total: 0,
      lv: 0,
    }
    this.refreshLevel = RefreshLevel.REFLOW;
    this._opacity = 1;
    this.transform = identity();
    this.matrix = identity();
    this._matrixWorld = identity();
    this.hasContent = false;
  }

  // 添加到dom后标记非销毁状态，和root引用
  didMount() {
    this.isDestroyed = false;
    this.root = this.parent!.root!;
    const uuid = this.props.uuid;
    if (uuid) {
      this.root.refs[uuid] = this;
    }
  }

  layout(data: LayoutData) {
    if (this.isDestroyed) {
      return;
    }
    this.refreshLevel = RefreshLevel.REFLOW;
    // 布局时计算所有样式，更新时根据不同级别调用
    this.calReflowStyle();
    const { style, computedStyle } = this;
    const {
      left,
      top,
      right,
      bottom,
      width,
      height,
    } = style;
    // 检查是否按相对边固定（px/%）还是尺寸固定，如左右vs宽度
    let fixedLeft = false;
    let fixedTop = false;
    let fixedRight = false;
    let fixedBottom = false;
    if (left.u !== StyleUnit.AUTO) {
      fixedLeft = true;
      computedStyle.left = calSize(left, data.w);
    }
    if (right.u !== StyleUnit.AUTO) {
      fixedRight = true;
      computedStyle.right = calSize(right, data.w);
    }
    if (top.u !== StyleUnit.AUTO) {
      fixedTop = true;
      computedStyle.top = calSize(top, data.h);
    }
    if (bottom.u !== StyleUnit.AUTO) {
      fixedBottom = true;
      computedStyle.bottom = calSize(bottom, data.h);
    }
    // 固定尺寸直接设置，另外还要考虑min值
    if (width.u !== StyleUnit.AUTO) {
      computedStyle.width = computedStyle.minWidth = this.minWidth = calSize(width, data.w);
    }
    else {
      computedStyle.minWidth = this.minWidth = 0;
    }
    if (height.u !== StyleUnit.AUTO) {
      computedStyle.height = computedStyle.minHeight = this.minHeight = calSize(height, data.h);
    }
    else {
      computedStyle.minHeight = this.minHeight = 0;
    }
    // 左右决定x+width
    if (fixedLeft && fixedRight) {
      this.x = data.x + computedStyle.left;
      this.width = data.w - computedStyle.left - computedStyle.right;
    }
    else if (fixedLeft) {
      this.x = data.x + computedStyle.left;
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle.width;
      }
      else {
        this.width = 0;
      }
    }
    else if (fixedRight) {
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle.width;
      }
      else {
        this.width = 0;
      }
      this.x = data.x + data.w - this.width - computedStyle.right;
    }
    else {
      this.x = data.x;
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle.width;
      }
      else {
        this.width = 0;
      }
    }
    // 上下决定y+height
    if (fixedTop && fixedBottom) {
      this.y = data.y + computedStyle.top;
      this.height = data.h - computedStyle.top - computedStyle.bottom;
    }
    else if (fixedTop) {
      this.y = data.y + computedStyle.top;
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle.height;
      }
      else {
        this.height = 0;
      }
    }
    else if (fixedBottom) {
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle.height;
      }
      else {
        this.height = 0;
      }
      this.y = data.y + data.h - this.height - computedStyle.bottom;
    }
    else {
      this.y = data.y;
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle.height;
      }
      else {
        this.height = 0;
      }
    }
    // 还要计算距离边auto的实际px，以及未声明尺寸根据距离边的计算
    if (fixedLeft && fixedRight) {
      computedStyle.width = this.width;
    }
    else if (fixedLeft) {
      computedStyle.right = data.w - computedStyle.left - this.width;
    }
    else if (fixedRight) {
      computedStyle.left = this.x - data.x;
    }
    else {
      computedStyle.left = this.x - data.x;
      computedStyle.right = data.w - computedStyle.left - this.width;
    }
    if (fixedTop && fixedBottom) {
      computedStyle.height = this.height;
    }
    else if (fixedTop) {
      computedStyle.bottom = data.h - computedStyle.top - this.width;
    }
    else if (fixedBottom) {
      computedStyle.top = this.y - data.y;
    }
    else {
      computedStyle.top = this.y - data.y;
      computedStyle.bottom = data.h - computedStyle.top - this.width;
    }
    // repaint和matrix计算需要x/y/width/height
    this.calRepaintStyle(RefreshLevel.REFLOW);
    this._rect = undefined;
    this._bbox = undefined;
  }

  // 布局前计算需要在布局阶段知道的样式，且必须是最终像素值之类，不能是百分比等原始值
  calReflowStyle() {
    const { style, computedStyle, parent } = this;
    computedStyle.fontFamily = style.fontFamily.v;
    computedStyle.fontSize = style.fontSize.v;
    computedStyle.fontWeight = style.fontWeight.v;
    computedStyle.fontStyle = style.fontStyle.v;
    const lineHeight = style.lineHeight;
    if (lineHeight.u === StyleUnit.AUTO) {
      computedStyle.lineHeight = calNormalLineHeight(computedStyle);
    }
    else {
      computedStyle.lineHeight = lineHeight.v as number;
    }
    this.width = this.height = 0;
    const width = style.width;
    const height = style.height;
    if (parent) {
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle.width = calSize(width, parent.width);
      }
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle.height = calSize(height, parent.height);
      }
    }
  }

  calRepaintStyle(lv: RefreshLevel) {
    const { style, computedStyle } = this;
    computedStyle.visible = style.visible.v;
    computedStyle.overflow = style.overflow.v;
    computedStyle.color = style.color.v;
    computedStyle.backgroundColor = style.backgroundColor.v;
    computedStyle.opacity = style.opacity.v;
    computedStyle.mixBlendMode = style.mixBlendMode.v;
    computedStyle.pointerEvents = style.pointerEvents.v;
    if (lv & RefreshLevel.REFLOW_TRANSFORM) {
      this.calMatrix(lv);
    }
  }

  calMatrix(lv: RefreshLevel): Float64Array {
    const { style, computedStyle, matrix, transform } = this;
    let optimize = true;
    if (lv >= RefreshLevel.REFLOW
      || lv & RefreshLevel.TRANSFORM
      || (lv & RefreshLevel.SCALE_X) && !computedStyle.scaleX
      || (lv & RefreshLevel.SCALE_Y) && !computedStyle.scaleY) {
      optimize = false;
    }
    // 优化计算scale不能为0，无法计算倍数差，rotateZ优化不能包含rotateX/rotateY/skew
    if (optimize) {
      if (lv & RefreshLevel.TRANSLATE_X) {
        const v = calSize(style.translateX, this.width);
        const diff = v - computedStyle.translateX;
        computedStyle.translateX = v;
        transform[12] += diff;
        matrix[12] += diff;
      }
      if (lv & RefreshLevel.TRANSLATE_Y) {
        const v = calSize(style.translateY, this.height);
        const diff = v - computedStyle.translateY;
        computedStyle.translateY = v;
        transform[13] += diff;
        matrix[13] += diff;
      }
      if (lv & RefreshLevel.ROTATE_Z) {
        const v = style.rotateZ.v as number;
        computedStyle.rotateZ = v;
        const r = d2r(v);
        const sin = Math.sin(r), cos = Math.cos(r);
        const x = computedStyle.scaleX, y = computedStyle.scaleY;
        const cx = matrix[0] = cos * x;
        const sx = matrix[1] = sin * x;
        const sy = matrix[4] = -sin * y;
        const cy = matrix[5] = cos * y;
        const t = computedStyle.transformOrigin, ox = t[0] + this.x, oy = t[1] + this.y;
        matrix[12] = transform[12] + ox - cx * ox - oy * sy;
        matrix[13] = transform[13] + oy - sx * ox - oy * cy;
      }
      if (lv & RefreshLevel.SCALE) {
        if (lv & RefreshLevel.SCALE_X) {
          const v = style.scaleX.v as number;
          let x = v / computedStyle.scaleX;
          computedStyle.scaleX = v;
          transform[0] *= x;
          transform[1] *= x;
          transform[2] *= x;
          matrix[0] *= x;
          matrix[1] *= x;
          matrix[2] *= x;
        }
        if (lv & RefreshLevel.SCALE_Y) {
          const v = style.scaleY.v as number;
          let y = v / computedStyle.scaleY;
          computedStyle.scaleY = v;
          transform[4] *= y;
          transform[5] *= y;
          transform[6] *= y;
          matrix[4] *= y;
          matrix[5] *= y;
          matrix[6] *= y;
        }
        const t = computedStyle.transformOrigin, ox = t[0] + this.x, oy = t[1] + this.y;
        matrix[12] = transform[12] + ox - transform[0] * ox - transform[4] * oy;
        matrix[13] = transform[13] + oy - transform[1] * ox - transform[5] * oy;
        matrix[14] = transform[14] - transform[2] * ox - transform[6] * oy;
      }
    }
    // 普通布局或者第一次计算
    else {
      toE(transform);
      transform[12] = computedStyle.translateX = calSize(style.translateX, this.width);
      transform[13] = computedStyle.translateY = calSize(style.translateY, this.height);
      const rotateZ = style.rotateZ ? (style.rotateZ.v as number) : 0;
      const scaleX = style.scaleX ? (style.scaleX.v as number) : 1;
      const scaleY = style.scaleY ? (style.scaleY.v as number) : 1;
      computedStyle.rotateZ = rotateZ;
      computedStyle.scaleX = scaleX;
      computedStyle.scaleY = scaleY;
      if (isE(transform)) {
        calRotateZ(transform, rotateZ);
      }
      else if (rotateZ) {
        multiplyRotateZ(transform, d2r(rotateZ));
      }
      if (scaleX !== 1) {
        if (isE(transform)) {
          transform[0] = scaleX;
        }
        else {
          multiplyScaleX(transform, scaleX);
        }
      }
      if (scaleY !== 1) {
        if (isE(transform)) {
          transform[5] = scaleY;
        }
        else {
          multiplyScaleY(transform, scaleY);
        }
      }
      const tfo = style.transformOrigin.map((item, i) => {
        return calSize(item, i ? this.height : this.width);
      });
      computedStyle.transformOrigin = tfo as [number, number];
      const t = calMatrixByOrigin(transform, tfo[0] + this.x, tfo[1] + this.y);
      assignMatrix(matrix, t);
    }
    return matrix;
  }

  calContent(): boolean {
    return this.hasContent = false;
  }

  renderCanvas() {
    // const canvasCache = this.canvasCache;
    // if (canvasCache && canvasCache.available) {
    //   canvasCache.release();
    // }
  }

  genTexture(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    this.textureCache = TextureCache.getInstance(gl, this.canvasCache!.offscreen.canvas);
  }

  releaseCache(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    this.canvasCache?.release();
    this.textureCache?.release(gl);
  }

  remove(cb?: Function) {
    const { root, parent } = this;
    if (parent) {
      let i = parent.children.indexOf(this);
      if (i === -1) {
        throw new Error('Invalid index of remove()');
      }
      parent.children.splice(i, 1);
      const { prev, next } = this;
      if (prev) {
        prev.next = next;
      }
      if (next) {
        next.prev = prev;
      }
    }
    // 未添加到dom时
    if (this.isDestroyed) {
      cb && cb(true);
      return;
    }
    parent?.deleteStruct(this);
    root!.addUpdate(this, [], RefreshLevel.REFLOW, false, true, cb);
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    this.prev = this.next = this.parent = this.root = undefined;
  }

  structure(lv: number): Array<Struct> {
    const temp = this.struct;
    temp.lv = lv;
    return [temp];
  }

  preUpdateStyleData(style: any) {
    const keys: Array<string> = [];
    const formatStyle = normalize(style);
    for (let k in formatStyle) {
      if (formatStyle.hasOwnProperty(k)) {
        // @ts-ignore
        const v = formatStyle[k];
        if (!equalStyle(k, formatStyle, this.style)) {
          // @ts-ignore
          this.style[k] = v;
          keys.push(k);
        }
      }
    }
    return { keys, formatStyle };
  }

  preUpdateStyleCheck(keys: Array<string>) {
    if (!keys.length) {
      return true;
    }
    // 自己不可见且没改变visible无需刷新
    let visible = this.computedStyle.visible;
    if (!visible && keys.indexOf('visible') < 0) {
      return true;
    }
    // 父级不可见无需刷新
    let parent = this.parent;
    while (parent) {
      if (!parent.computedStyle.visible) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  updateStyle(style: any, cb?: Function) {
    const { keys } = this.preUpdateStyleData(style);
    // 无变更或不可见
    if (this.preUpdateStyleCheck(keys)) {
      cb && cb(true);
      return;
    }
    this.root!.addUpdate(this, keys, undefined, false, false, cb);
  }

  getComputedStyle() {
    const computedStyle = this.computedStyle;
    const res: any = {};
    for (let k in computedStyle) {
      if (k === 'color' || k === 'backgroundColor' || k === 'transformOrigin') {
        res[k] = computedStyle[k].slice(0);
      }
      else {
        // @ts-ignore
        res[k] = computedStyle[k];
      }
    }
    return res;
  }

  getStyle<T extends keyof JStyle>(k: T): any {
    const computedStyle = this.computedStyle;
    if (k === 'color' || k === 'backgroundColor') {
      // @ts-ignore
      return color2rgbaStr(computedStyle[k]);
    }
    // @ts-ignore
    return computedStyle[k];
  }

  getBoundingClientRect() {
    const { bbox, matrixWorld } = this;
    const { x1, y1, x2, y2, x3, y3, x4, y4 }
      = calRectPoint(bbox[0], bbox[1], bbox[2], bbox[3], matrixWorld);
    return {
      left: Math.min(x1, Math.min(x2, Math.min(x3, x4))),
      top: Math.min(y1, Math.min(y2, Math.min(y3, y4))),
      right: Math.max(x1, Math.max(x2, Math.max(x3, x4))),
      bottom: Math.max(y1, Math.max(y2, Math.max(y3, y4))),
      points: [{
        x: x1,
        y: y1,
      }, {
        x: x2,
        y: y2,
      }, {
        x: x3,
        y: y3,
      }, {
        x: x4,
        y: y4,
      }],
    };
  }

  //
  checkPosChange() {
    if (this.isDestroyed) {
      return;
    }
    const { style, computedStyle } = this;
    const {
      top,
      right,
      bottom,
      left,
      width,
      height,
      translateX,
      translateY,
    } = style;
    // 一定有parent，不会改root下固定的Container子节点
    let parent = this.parent!;
    let x = 0;
    // 非固定宽度，left和right一定是有值非auto的，translate单位是px，且拖动前translate一定是0，拖动后如果有水平拖则是x距离
    if (width.u === StyleUnit.AUTO) {
      x = translateX.v;
      if (x !== 0) {
        this.x += x;
        translateX.v = 0;
        this.adjustLR(left, right, computedStyle, x, parent);
      }
    }
    // 固定宽度
    else {
      const half = calSize({ v: -50, u: StyleUnit.PERCENT }, this.width);
      x = translateX.v - half;
      if (x !== 0) {
        this.x += x;
        this.adjustLR(left, right, computedStyle, x, parent);
      }
      // 无论如何都要还原-50%，因为移动过程中可能会变成px
      translateX.v = -50;
      translateX.u = StyleUnit.PERCENT;
    }
    let y = 0;
    // 高度和宽度一样
    if (height.u === StyleUnit.AUTO) {
      y = translateY.v;
      if (y !== 0) {
        this.y += y;
        translateY.v = 0;
        this.adjustTB(top, bottom, computedStyle, y, parent);
      }
    }
    // 固定高度
    else {
      const half = calSize({ v: -50, u: StyleUnit.PERCENT }, this.height);
      y = translateY.v - half;
      if (y !== 0) {
        this.y += y;
        this.adjustTB(top, bottom, computedStyle, y, parent);
      }
      // 无论如何都要还原-50%，因为移动过程中可能会变成px
      translateY.v = -50;
      translateY.u = StyleUnit.PERCENT;
    }
    // matrix的影响
    const lv = (x ? RefreshLevel.TRANSLATE_X : 0) | (y ? RefreshLevel.TRANSLATE_Y : 0);
    if (lv) {
      this.refreshLevel |= lv; // matrixWorld需重算
      const root = this.root!;
      root.rl |= lv;
      this.calMatrix(lv);
      const structs = root!.structs, struct = this.struct;
      const index = structs.indexOf(struct);
      // 肯定有，所有子节点需跟着同样偏移x/y，稍稍有点多余
      if (index > -1) {
        for (let i = index + 1, len = i + struct.total; i < len; i++) {
          const { node } = structs[i];
          if (x) {
            node.x += x;
          }
          if (y) {
            node.y += y;
          }
        }
      }
      else {
        throw new Error('Unknown index of checkPosChange()');
      }
    }
    this._rect = undefined;
    this._bbox = undefined;
    // 向上检查group的影响，group一定是自适应尺寸需要调整的，group的固定宽度仅针对父级调整尺寸而言
    this.checkPosSizeUpward();
  }

  private adjustLR(left: StyleNumValue, right: StyleNumValue, computedStyle: ComputedStyle, x: number, parent: Container) {
    if (left.u === StyleUnit.PERCENT) {
      left.v += x * 100 / parent.width;
      computedStyle.left += x;
    }
    else if (left.u === StyleUnit.PX) {
      left.v += x;
      computedStyle.left = left.v;
    }
    if (right.u === StyleUnit.PERCENT) {
      right.v -= x * 100 / parent.width;
      computedStyle.right -= x;
    }
    else if (right.u === StyleUnit.PX) {
      right.v -= x;
      computedStyle.right = right.v;
    }
  }

  private adjustTB(top: StyleNumValue, bottom: StyleNumValue, computedStyle: ComputedStyle, y: number, parent: Container) {
    if (top.u === StyleUnit.PERCENT) {
      top.v += y * 100 / parent.height;
      computedStyle.top += y;
    }
    else if (top.u === StyleUnit.PX) {
      top.v += y;
      computedStyle.top = top.v;
    }
    if (bottom.u === StyleUnit.PERCENT) {
      bottom.v -= y * 100 / parent.height;
      computedStyle.bottom -= y;
    }
    else if (bottom.u === StyleUnit.PX) {
      bottom.v -= y;
      computedStyle.bottom = bottom.v;
    }
  }

  // 节点位置尺寸发生变更后，会递归向上影响，逐步检查，可能在某层没有影响提前跳出中断
  checkPosSizeUpward() {
    const root = this.root!;
    let parent = this.parent;
    while (parent && parent !== root) {
      if (!parent.adjustPosAndSize()) { // 无影响中断向上递归，比如拖动节点并未超过组的范围
        break;
      }
      parent = parent.parent;
    }
  }

  // 空实现，叶子节点和Container要么没children，要么不关心根据children自适应尺寸，Group会覆盖
  adjustPosAndSize() {
    return false;
  }

  // 自身不再计算，叶子节点调整过程中就是在reflow，自己本身数据已经及时更新。
  // 如果是组，子节点虽然在reflow过程中更新了数据，但是相对于组的老数据情况，
  // 子节点reflow过程中可能会对组产生位置尺寸的影响，需要组先根据子节点情况更新自己。
  // 然后再检查向上影响，是否需要重新计算，组覆盖实现。
  checkSizeChange() {
    // 啥也不做，组覆盖实现
  }

  get opacity() {
    let parent = this.parent;
    // 非Root节点继续向上乘
    if (parent) {
      const po = parent.opacity;
      this._opacity = this.computedStyle.opacity * po;
    }
    // Root的世界透明度就是自己
    else {
      this._opacity = this.computedStyle.opacity
    }
    return this._opacity;
  }

  // 可能在布局后异步渲染前被访问，此时没有这个数据，刷新后就有缓存，变更transform或者reflow无缓存
  get matrixWorld(): Float64Array {
    const root = this.root;
    if (!root) {
      return this.matrix;
    }
    const m = this._matrixWorld;
    // root总刷新没有包含变更，可以直接取缓存，否则才重新计算
    if (root.rl & RefreshLevel.REFLOW_TRANSFORM) {
      let cache = !(this.refreshLevel & RefreshLevel.REFLOW_TRANSFORM);
      // 检测树到根路径有无变更，没有也可以直接取缓存，因为可能多次执行或者同树枝提前执行过了 TODO 优化
      if (!cache) {
        let parent = this.parent;
        while (parent) {
          if (parent.refreshLevel & RefreshLevel.REFLOW_TRANSFORM) {
            cache = false;
            break;
          }
          parent = parent.parent;
        }
      }
      if (!cache) {
        assignMatrix(m, this.matrix);
        let parent = this.parent;
        while (parent) {
          multiply2(parent.matrix, m);
          parent = parent.parent;
        }
      }
    }
    return m;
  }

  get rect(): Float64Array {
    if (!this._rect) {
      this._rect = new Float64Array(4);
      this._rect[0] = this.x;
      this._rect[1] = this.y;
      this._rect[2] = this.x + this.width;
      this._rect[3] = this.y + this.height;
    }
    return this._rect;
  }

  get bbox(): Float64Array {
    if (!this._bbox) {
      let bbox = this._rect || this.rect;
      this._bbox = bbox.slice(0);
    }
    return this._bbox;
  }

}

export default Node;
