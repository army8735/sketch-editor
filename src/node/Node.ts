import * as uuid from 'uuid';
import Root from '../node/Root';
import Container from '../node/Container';
import { getDefaultStyle, JStyle, Props } from '../format/';
import {
  assignMatrix,
  calRectPoint,
  identity,
  isE,
  multiplyRef,
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
  // x: number;
  // y: number;
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
    // this.x = 0;
    // this.y = 0;
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

  lay(data: LayoutData) {
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
    // 考虑min值约束
    if (width.u !== StyleUnit.AUTO) {
      this.minWidth = this.width;
    }
    else {
      this.minWidth = 0;
    }
    if (height.u !== StyleUnit.AUTO) {
      this.minHeight = this.height;
    }
    else {
      this.minHeight = 0;
    }
    // 左右决定x+width
    if (fixedLeft && fixedRight) {
      this.width = computedStyle.width = data.w - computedStyle.left - computedStyle.right;
    }
    else if (fixedLeft) {
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle.width;
      }
      else {
        this.width = 0;
      }
      computedStyle.right = data.w - computedStyle.left - this.width;
    }
    else if (fixedRight) {
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle.width;
      }
      else {
        this.width = 0;
      }
      computedStyle.left = data.w - computedStyle.right - this.width;
    }
    // 上下决定y+height
    if (fixedTop && fixedBottom) {
      this.height = data.h - computedStyle.top - computedStyle.bottom;
    }
    else if (fixedTop) {
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle.height;
      }
      else {
        this.height = 0;
      }
      computedStyle.bottom = data.h - computedStyle.top - this.height;
    }
    else if (fixedBottom) {
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle.height;
      }
      else {
        this.height = 0;
      }
      computedStyle.top = data.w - computedStyle.bottom - this.height;
    }
  }

  // 封装，布局后计算repaint和matrix的样式，清空包围盒等老数据，真的布局计算在lay()中，各子类覆盖实现
  layout(data: LayoutData) {
    if (this.isDestroyed) {
      return;
    }
    this.lay(data);
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
      computedStyle.lineHeight = lineHeight.v;
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
    computedStyle.letterSpacing = style.letterSpacing.v;
  }

  calRepaintStyle(lv: RefreshLevel) {
    const { style, computedStyle } = this;
    computedStyle.visible = style.visible.v;
    computedStyle.overflow = style.overflow.v;
    computedStyle.color = style.color.v;
    computedStyle.backgroundColor = style.backgroundColor.v;
    computedStyle.opacity = style.opacity.v;
    computedStyle.fill = style.fill.map(item => item.v);
    computedStyle.fillEnable = style.fillEnable.map(item => item.v);
    computedStyle.stroke = style.stroke.map(item => item.v);
    computedStyle.strokeEnable = style.strokeEnable.map(item => item.v);
    computedStyle.strokeWidth = style.strokeWidth.map(item => item.v);
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
        const v = style.rotateZ.v;
        computedStyle.rotateZ = v;
        const r = d2r(v);
        const sin = Math.sin(r), cos = Math.cos(r);
        const x = computedStyle.scaleX, y = computedStyle.scaleY;
        const cx = matrix[0] = cos * x;
        const sx = matrix[1] = sin * x;
        const sy = matrix[4] = -sin * y;
        const cy = matrix[5] = cos * y;
        const t = computedStyle.transformOrigin, ox = t[0], oy = t[1];
        matrix[12] = transform[12] + ox - cx * ox - oy * sy;
        matrix[13] = transform[13] + oy - sx * ox - oy * cy;
      }
      if (lv & RefreshLevel.SCALE) {
        if (lv & RefreshLevel.SCALE_X) {
          const v = style.scaleX.v;
          const x = v / computedStyle.scaleX;
          computedStyle.scaleX = v;
          transform[0] *= x;
          transform[1] *= x;
          transform[2] *= x;
          matrix[0] *= x;
          matrix[1] *= x;
          matrix[2] *= x;
        }
        if (lv & RefreshLevel.SCALE_Y) {
          const v = style.scaleY.v;
          const y = v / computedStyle.scaleY;
          computedStyle.scaleY = v;
          transform[4] *= y;
          transform[5] *= y;
          transform[6] *= y;
          matrix[4] *= y;
          matrix[5] *= y;
          matrix[6] *= y;
        }
        const t = computedStyle.transformOrigin, ox = t[0], oy = t[1];
        matrix[12] = transform[12] + ox - transform[0] * ox - transform[4] * oy;
        matrix[13] = transform[13] + oy - transform[1] * ox - transform[5] * oy;
        matrix[14] = transform[14] - transform[2] * ox - transform[6] * oy;
      }
    }
    // 普通布局或者第一次计算
    else {
      toE(transform);
      transform[12] = computedStyle.translateX = computedStyle.left + calSize(style.translateX, this.width);
      transform[13] = computedStyle.translateY = computedStyle.top + calSize(style.translateY, this.height);
      const rotateZ = style.rotateZ ? style.rotateZ.v : 0;
      const scaleX = style.scaleX ? style.scaleX.v : 1;
      const scaleY = style.scaleY ? style.scaleY.v : 1;
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
      const t = calMatrixByOrigin(transform, tfo[0], tfo[1]);
      assignMatrix(matrix, t);
    }
    return matrix;
  }

  calContent(): boolean {
    return this.hasContent = false;
  }

  // 释放可能存在的老数据，具体渲染由各个子类自己实现
  renderCanvas() {
    const canvasCache = this.canvasCache;
    if (canvasCache && canvasCache.available) {
      canvasCache.release();
    }
  }

  genTexture(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    this.textureCache && this.textureCache.release(gl);
    const canvasCache = this.canvasCache;
    if (canvasCache && canvasCache.available) {
      this.textureCache = TextureCache.getInstance(gl, this.canvasCache!.offscreen.canvas);
    }
  }

  releaseCache(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    this.canvasCache?.release();
    this.textureCache?.release(gl);
  }

  remove(cb?: Function) {
    const { root, parent } = this;
    if (parent) {
      const i = parent.children.indexOf(this);
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
    const visible = this.computedStyle.visible;
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

  getBoundingClientRect(includeBbox: boolean = false) {
    const { matrixWorld } = this;
    const bbox = includeBbox ? this.bbox : this.rect;
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

  /**
   * 拖拽开始变更尺寸前预校验，如果是固定尺寸+百分比对齐，以为是以自身中心点为基准，需要改成普通模式，
   * 即left百分比调整到以左侧为基准，translateX不再-50%，垂直方向同理，改为top上侧基准，translateY不再-50%。
   * 如此才能防止拉伸时（如往右）以自身中心点为原点左右一起变化，拖拽结束后再重置回自身中心基准数据。
   */
  startSizeChange() {
    const { style, computedStyle, parent } = this;
    if (!parent) {
      return;
    }
    const {
      top,
      left,
      width,
      height,
      translateX,
      translateY,
    } = style;
    // 不可能有固定尺寸+right百分比这种情况，right要么auto要么px
    if (width.u === StyleUnit.PX && left.u === StyleUnit.PERCENT) {
      const v = computedStyle.left -= width.v * 0.5;
      left.v = v * 100 / parent.width;
      translateX.v = 0;
      translateX.u = StyleUnit.PX;
    }
    if (height.u === StyleUnit.PX && top.u === StyleUnit.PERCENT) {
      const v = computedStyle.top -= height.v * 0.5;
      top.v = v * 100 / parent.height;
      translateY.v = 0;
      translateY.u = StyleUnit.PX;
    }
  }

  // 移动过程是用translate加速，结束后要更新TRBL的位置以便后续定位，如果是固定尺寸，还要还原translate为-50%（中心点对齐）
  checkPosChange() {
    const { style, computedStyle, parent } = this;
    if (!parent) {
      return;
    }
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
    const {
      translateX: tx,
      translateY: ty,
    } = computedStyle;
    // 一定有parent，不会改root下固定的Container子节点
    const { width: pw, height: ph } = parent;
    // 宽度自动，left和right一定是有值，translateX单位是px
    if (width.u === StyleUnit.AUTO) {
      if (left.u === StyleUnit.PX) {
        left.v = tx;
      }
      else if (left.u === StyleUnit.PERCENT) {
        left.v = tx * 100 / pw;
      }
      if (right.u === StyleUnit.PX) {
        right.v = pw - tx - this.width;
      }
      else if (right.u === StyleUnit.PERCENT) {
        right.v = (pw - tx - this.width) * 100 / pw;
      }
    }
    // 固定宽度，发生过变更单位会变成px（节点可能只上下移动，看实现，这里多预防下），left/right至少有一个固定值，translateX需要重置为-50%
    else if (translateX.u === StyleUnit.PX) {
      if (left.u === StyleUnit.PX) {
        left.v = tx + this.width * 0.5;
      }
      else if (left.u === StyleUnit.PERCENT) {
        left.v = (tx + this.width * 0.5) * 100 / pw;
      }
      if (right.u === StyleUnit.PX) {
        right.v = pw - tx - this.width * 1.5;
      }
      else if (right.u === StyleUnit.PERCENT) {
        right.v = (pw - tx - this.width * 1.5) * 100 / pw;
      }
    }
    this.resetTranslateX(left, width, translateX);
    // 换算，固定不固定统一处理
    if (left.u !== StyleUnit.AUTO) {
      computedStyle.left = calSize(left, pw);
    }
    if (right.u !== StyleUnit.AUTO) {
      computedStyle.right = calSize(right, pw);
    }
    // auto依赖left/right处理完
    if (left.u === StyleUnit.AUTO) {
      computedStyle.left = pw - computedStyle.right - this.width;
    }
    if (right.u === StyleUnit.AUTO) {
      computedStyle.right = pw - computedStyle.left - this.width;
    }
    // 自动高度，和自动宽度一样
    if (height.u === StyleUnit.AUTO) {
      if (top.u === StyleUnit.PX) {
        top.v = ty;
      }
      else if (top.u === StyleUnit.PERCENT) {
        top.v = ty * 100 / ph;
      }
      if (bottom.u === StyleUnit.PX) {
        bottom.v = ph - ty - this.height;
      }
      else if (bottom.u === StyleUnit.PERCENT) {
        bottom.v = (ph - ty - this.height) * 100 / ph;
      }
    }
    // 固定高度，和固定宽度一样
    else if (translateY.u === StyleUnit.PX) {
      if (top.u === StyleUnit.PX) {
        top.v = ty + this.height * 0.5;
      }
      else if (top.u === StyleUnit.PERCENT) {
        top.v = (ty + this.height * 0.5) * 100 / ph;
      }
      if (bottom.u === StyleUnit.PX) {
        bottom.v = ph - ty - this.height * 1.5;
      }
      else if (bottom.u === StyleUnit.PERCENT) {
        bottom.v = (ph - ty - this.height * 1.5) * 100 / ph;
      }
    }
    this.resetTranslateY(top, height, translateY);
    // 换算，固定不固定统一处理
    if (top.u !== StyleUnit.AUTO) {
      computedStyle.top = calSize(top, ph);
    }
    if (bottom.u !== StyleUnit.AUTO) {
      computedStyle.bottom = calSize(bottom, ph);
    }
    // auto依赖top/bottom处理完
    if (top.u === StyleUnit.AUTO) {
      computedStyle.top = pw - computedStyle.bottom - this.height;
    }
    if (bottom.u === StyleUnit.AUTO) {
      computedStyle.bottom = pw - computedStyle.top - this.height;
    }
    // matrix并无变化，移动过程中一直在更新translate，并触发了matrix变更
    // 向上检查group的影响，group一定是自适应尺寸需要调整的，group的固定宽度仅针对父级调整尺寸而言
    this.checkPosSizeUpward();
  }

  resetTranslateX(left: StyleNumValue, width: StyleNumValue, translateX: StyleNumValue) {
    if (width.u === StyleUnit.AUTO) {
      translateX.v = 0;
    }
    else if (width.u === StyleUnit.PX && left.u === StyleUnit.PERCENT) {
      translateX.v = -50;
      translateX.u = StyleUnit.PERCENT;
    }
  }

  resetTranslateY(top: StyleNumValue, height: StyleNumValue, translateY: StyleNumValue) {
    if (height.u === StyleUnit.AUTO) {
      translateY.v = 0;
    }
    else if (height.u === StyleUnit.PX && top.u === StyleUnit.PERCENT) {
      translateY.v = -50;
      translateY.u = StyleUnit.PERCENT;
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

  /**
   * 自身不再计算，叶子节点调整过程中就是在reflow，自己本身数据已经及时更新。
   * 如果是组，子节点虽然在reflow过程中更新了数据，但是相对于组的老数据情况，
   * 子节点reflow过程中可能会对组产生位置尺寸的影响，需要组先根据子节点情况更新自己。
   * 然后再检查向上影响，是否需要重新计算，组覆盖实现。
   * 对于固定尺寸+%对齐的，在开始前将基点转换到左上，并且translate变为0，防止变形，
   * 在这里结束后需要转换回来，即自身中点为基准，translate为-50%。
   */
  checkSizeChange() {
    const { style, computedStyle, parent } = this;
    if (!parent) {
      return;
    }
    const {
      top,
      left,
      width,
      height,
      translateX,
      translateY,
    } = style;
    if (width.u === StyleUnit.PX && left.u === StyleUnit.PERCENT) {
      const v = computedStyle.left += width.v * 0.5;
      left.v = v * 100 / parent.width;
      translateX.v = -50;
      translateX.u = StyleUnit.PERCENT;
    }
    if (height.u === StyleUnit.PX && top.u === StyleUnit.PERCENT) {
      const v = computedStyle.top += height.v * 0.5;
      top.v = v * 100 / parent.height;
      translateY.v = -50;
      translateY.u = StyleUnit.PERCENT;
    }
    this.checkPosSizeUpward();
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
      this._opacity = this.computedStyle.opacity;
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
      if (cache) {
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
          multiplyRef(parent.matrix, m);
          parent = parent.parent;
        }
      }
    }
    return m;
  }

  get rect(): Float64Array {
    if (!this._rect) {
      this._rect = new Float64Array(4);
      this._rect[0] = 0;
      this._rect[1] = 0;
      this._rect[2] = this.width;
      this._rect[3] = this.height;
    }
    return this._rect;
  }

  get bbox(): Float64Array {
    if (!this._bbox) {
      const bbox = this._rect || this.rect;
      this._bbox = bbox.slice(0);
    }
    return this._bbox;
  }

}

export default Node;
