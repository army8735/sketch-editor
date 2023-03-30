import Root from '../node/Root';
import Container from '../node/Container';
import { JStyle, Props } from '../format/';
import {
  assignMatrix,
  calRectPoint,
  identity,
  multiply2,
} from '../math/matrix';
import { d2r } from '../math/geom';
import { extend } from '../util';
import Event from '../util/Event';
import { LayoutData } from './layout';
import { calNormalLineHeight, equalStyle, normalize, calSize } from '../style/css';
import { StyleArray, StyleKey, StyleKeyHash, StyleUnit } from '../style/define';
import { calStyleMatrix } from '../style/transform';
import { Struct } from '../refresh/struct';
import { RefreshLevel } from '../refresh/level';
import CanvasCache from '../refresh/CanvasCache';
import TextureCache from '../refresh/TextureCache';

class Node extends Event {
  x: number;
  y: number;
  width: number;
  height: number;
  props: Props;
  style: StyleArray;
  computedStyle: Array<any>;
  cacheStyle: Array<any>;
  root: Root | undefined;
  prev: Node | undefined;
  next: Node | undefined;
  parent: Container | undefined;
  isDestroyed: boolean;
  struct: Struct;
  refreshLevel: RefreshLevel;
  _opacity: number;
  transform: Float64Array;
  matrix: Float64Array;
  _matrixWorld: Float64Array;
  layoutData: LayoutData | undefined; // 之前布局的数据留下次局部更新直接使用
  private _rect: Float64Array | undefined;
  private _bbox: Float64Array | undefined;
  hasContent: boolean;
  canvasCache?: CanvasCache; // 先渲染到2d上作为缓存 TODO 超大尺寸分割
  textureCache?: TextureCache; // 从canvasCache生成的纹理缓存

  constructor(props: Props) {
    super();
    this.props = props;
    this.style = extend([], normalize(props.style || {}));
    this.computedStyle = []; // 输出展示的值
    this.cacheStyle = []; // 缓存js直接使用的对象结果
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
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
    this.root = this.parent!.root;
  }

  layout(container: Container, data: LayoutData) {
    if (this.isDestroyed) {
      return;
    }
    this.refreshLevel = RefreshLevel.REFLOW;
    // 布局时计算所有样式，更新时根据不同级别调用
    this.calReflowStyle();
    this.calRepaintStyle();
    // 布局数据在更新时会用到
    this.layoutData = {
      x: data.x,
      y: data.y,
      w: data.w,
      h: data.h,
    };
    const { style, computedStyle } = this;
    const {
      [StyleKey.LEFT]: left,
      [StyleKey.TOP]: top,
      [StyleKey.RIGHT]: right,
      [StyleKey.BOTTOM]: bottom,
      [StyleKey.WIDTH]: width,
      [StyleKey.HEIGHT]: height,
    } = style;
    let fixedLeft = false;
    let fixedTop = false;
    let fixedRight = false;
    let fixedBottom = false;
    if (left.u === StyleUnit.AUTO) {
      computedStyle[StyleKey.LEFT] = 'auto';
    }
    else {
      fixedLeft = true;
      computedStyle[StyleKey.LEFT] = calSize(left, data.w);
    }
    if (right.u === StyleUnit.AUTO) {
      computedStyle[StyleKey.RIGHT] = 'auto';
    }
    else {
      fixedRight = true;
      computedStyle[StyleKey.RIGHT] = calSize(right, data.w);
    }
    if (top.u === StyleUnit.AUTO) {
      computedStyle[StyleKey.TOP] = 'auto';
    }
    else {
      fixedTop = true;
      computedStyle[StyleKey.TOP] = calSize(top, data.h);
    }
    if (bottom.u === StyleUnit.AUTO) {
      computedStyle[StyleKey.BOTTOM] = 'auto';
    }
    else {
      fixedBottom = true;
      computedStyle[StyleKey.BOTTOM] = calSize(bottom, data.h);
    }
    if (width.u === StyleUnit.AUTO) {
      computedStyle[StyleKey.WIDTH] = 'auto';
    }
    else {
      computedStyle[StyleKey.WIDTH] = calSize(width, data.w);
    }
    if (height.u === StyleUnit.AUTO) {
      computedStyle[StyleKey.HEIGHT] = 'auto';
    }
    else {
      computedStyle[StyleKey.HEIGHT] = calSize(height, data.h);
    }
    // 左右决定x+width
    if (fixedLeft && fixedRight) {
      this.x = data.x + computedStyle[StyleKey.LEFT];
      this.width = data.w - computedStyle[StyleKey.LEFT] - computedStyle[StyleKey.RIGHT];
    }
    else if (fixedLeft) {
      this.x = data.x + computedStyle[StyleKey.LEFT];
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle[StyleKey.WIDTH];
      }
      else {
        this.width = 0;
      }
    }
    else if (fixedRight) {
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle[StyleKey.WIDTH];
      }
      else {
        this.width = 0;
      }
      this.x = data.x + data.w - this.width - computedStyle[StyleKey.RIGHT];
    }
    else {
      this.x = data.x;
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle[StyleKey.WIDTH];
      }
      else {
        this.width = 0;
      }
    }
    // 上下决定y+height
    if (fixedTop && fixedBottom) {
      this.y = data.y + computedStyle[StyleKey.TOP];
      this.height = data.h - computedStyle[StyleKey.TOP] - computedStyle[StyleKey.BOTTOM];
    }
    else if (fixedTop) {
      this.y = data.y + computedStyle[StyleKey.TOP];
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle[StyleKey.HEIGHT];
      }
      else {
        this.height = 0;
      }
    }
    else if (fixedBottom) {
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle[StyleKey.HEIGHT];
      }
      else {
        this.height = 0;
      }
      this.y = data.y + data.h - this.height - computedStyle[StyleKey.BOTTOM];
    }
    else {
      this.y = data.y;
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle[StyleKey.HEIGHT];
      }
      else {
        this.height = 0;
      }
    }
  }

  // 布局前计算需要在布局阶段知道的样式，且必须是最终像素值之类，不能是百分比等原始值
  calReflowStyle() {
    const { style, computedStyle, parent } = this;
    computedStyle[StyleKey.FONT_FAMILY] = style[StyleKey.FONT_FAMILY].v;
    computedStyle[StyleKey.FONT_SIZE] = style[StyleKey.FONT_SIZE].v;
    computedStyle[StyleKey.FONT_WEIGHT] = style[StyleKey.FONT_WEIGHT].v;
    computedStyle[StyleKey.FONT_STYLE] = style[StyleKey.FONT_STYLE].v;
    const lineHeight = style[StyleKey.LINE_HEIGHT];
    if (lineHeight.u === StyleUnit.AUTO) {
      computedStyle[StyleKey.LINE_HEIGHT] = calNormalLineHeight(computedStyle);
    }
    else {
      computedStyle[StyleKey.LINE_HEIGHT] = lineHeight.v;
    }
    this.width = this.height = 0;
    const width = style[StyleKey.WIDTH];
    const height = style[StyleKey.HEIGHT];
    if (parent) {
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle[StyleKey.WIDTH] = calSize(width, parent.width);
      }
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle[StyleKey.HEIGHT] = calSize(height, parent.height);
      }
    }
  }

  calRepaintStyle() {
    const { style, computedStyle } = this;
    computedStyle[StyleKey.VISIBLE] = style[StyleKey.VISIBLE].v;
    computedStyle[StyleKey.OVERFLOW] = style[StyleKey.OVERFLOW].v;
    computedStyle[StyleKey.COLOR] = style[StyleKey.COLOR].v;
    computedStyle[StyleKey.BACKGROUND_COLOR] = style[StyleKey.BACKGROUND_COLOR].v;
    computedStyle[StyleKey.OPACITY] = style[StyleKey.OPACITY].v;
    computedStyle[StyleKey.MIX_BLEND_MODE] = style[StyleKey.MIX_BLEND_MODE].v;
    computedStyle[StyleKey.POINTER_EVENTS] = style[StyleKey.POINTER_EVENTS].v;
    this.calMatrix(RefreshLevel.REFLOW);
  }

  calMatrix(lv: RefreshLevel): Float64Array {
    const { style, computedStyle, matrix, transform } = this;
    let optimize = true;
    if (lv >= RefreshLevel.REFLOW
      || lv & RefreshLevel.TRANSFORM
      || (lv & RefreshLevel.SCALE_X) && !computedStyle[StyleKey.SCALE_X]
      || (lv & RefreshLevel.SCALE_Y) && !computedStyle[StyleKey.SCALE_Y]) {
      optimize = false;
    }
    // 优化计算scale不能为0，无法计算倍数差，rotateZ优化不能包含rotateX/rotateY/skew
    if (optimize) {
      if (lv & RefreshLevel.TRANSLATE_X) {
        const v = calSize(style[StyleKey.TRANSLATE_X], this.width);
        const diff = v - computedStyle[StyleKey.TRANSLATE_X];
        computedStyle[StyleKey.TRANSLATE_X] = v;
        transform[12] += diff;
        matrix[12] += diff;
      }
      if (lv & RefreshLevel.TRANSLATE_Y) {
        const v = calSize(style[StyleKey.TRANSLATE_Y], this.height);
        const diff = v - computedStyle[StyleKey.TRANSLATE_Y];
        computedStyle[StyleKey.TRANSLATE_Y] = v;
        transform[13] += diff;
        matrix[13] += diff;
      }
      if (lv & RefreshLevel.ROTATE_Z) {
        const v = style[StyleKey.ROTATE_Z].v as number;
        computedStyle[StyleKey.ROTATE_Z] = v;
        const r = d2r(v);
        const sin = Math.sin(r), cos = Math.cos(r);
        const x = computedStyle[StyleKey.SCALE_X], y = computedStyle[StyleKey.SCALE_Y];
        const cx = matrix[0] = cos * x;
        const sx = matrix[1] = sin * x;
        const sy = matrix[4] = -sin * y;
        const cy = matrix[5] = cos * y;
        const t = computedStyle[StyleKey.TRANSFORM_ORIGIN], ox = t[0] + this.x, oy = t[1] + this.y;
        matrix[12] = transform[12] + ox - cx * ox - oy * sy;
        matrix[13] = transform[13] + oy - sx * ox - oy * cy;
      }
      if (lv & RefreshLevel.SCALE) {
        if (lv & RefreshLevel.SCALE_X) {
          const v = style[StyleKey.SCALE_X].v as number;
          let x = v / computedStyle[StyleKey.SCALE_X];
          computedStyle[StyleKey.SCALE_X] = v;
          transform[0] *= x;
          transform[1] *= x;
          transform[2] *= x;
          matrix[0] *= x;
          matrix[1] *= x;
          matrix[2] *= x;
        }
        if (lv & RefreshLevel.SCALE_Y) {
          const v = style[StyleKey.SCALE_Y].v as number;
          let y = v / computedStyle[StyleKey.SCALE_Y];
          computedStyle[StyleKey.SCALE_Y] = v;
          transform[4] *= y;
          transform[5] *= y;
          transform[6] *= y;
          matrix[4] *= y;
          matrix[5] *= y;
          matrix[6] *= y;
        }
        const t = computedStyle[StyleKey.TRANSFORM_ORIGIN], ox = t[0] + this.x, oy = t[1] + this.y;
        matrix[12] = transform[12] + ox - transform[0] * ox - transform[4] * oy;
        matrix[13] = transform[13] + oy - transform[1] * ox - transform[5] * oy;
        matrix[14] = transform[14] - transform[2] * ox - transform[6] * oy;
      }
    }
    // 普通布局或者第一次计算
    else {
      const t = calStyleMatrix(style, this.x, this.y, this.width, this.height, computedStyle);
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
    if (!root) {
      return;
    }
    if (root as Node === this) {
      return;
    }
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
      cb && cb();
      return;
    }
    parent!.deleteStruct(this);
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

  updateStyle(style: any, cb?: Function) {
    const visible = this.computedStyle[StyleKey.VISIBLE];
    let hasVisible = false;
    const keys: Array<StyleKey> = [];
    const style2 = normalize(style);
    for (let k in style2) {
      if (style2.hasOwnProperty(k)) {
        const k2 = parseInt(k);
        const v = style2[k2];
        if (!equalStyle(k2, style2, this.style)) {
          this.style[k2] = v;
          keys.push(k2);
          if (k2 === StyleKey.VISIBLE) {
            hasVisible = true;
          }
        }
      }
    }
    // 不可见或销毁无需刷新
    if (!keys.length || this.isDestroyed || !visible && !hasVisible) {
      cb && cb(true);
      return;
    }
    // 父级不可见无需刷新
    let parent = this.parent;
    while (parent) {
      if (!parent.computedStyle[StyleKey.VISIBLE]) {
        cb && cb(true);
        return;
      }
      parent = parent.parent;
    }
    this.root!.addUpdate(this, keys, undefined, false, false, false, cb);
  }

  getComputedStyle() {
    const computedStyle = this.computedStyle;
    const res: any = {};
    for (let k in StyleKeyHash) {
      res[k] = computedStyle[StyleKeyHash[k]];
    }
    return res;
  }

  getStyle<T extends keyof JStyle>(key: T): any {
    const computedStyle = this.computedStyle;
    return computedStyle[StyleKeyHash[key]];
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

  get opacity() {
    let parent = this.parent;
    // 非Root节点继续向上乘
    if (parent) {
      const po = parent.opacity;
      this._opacity = this.computedStyle[StyleKey.OPACITY] * po;
    }
    // Root的世界透明度就是自己
    else {
      this._opacity = this.computedStyle[StyleKey.OPACITY]
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
      let parent = this.parent;
      let cache = true;
      // 检测树到根路径有无变更，没有也可以直接取缓存
      while (parent) {
        if (parent.refreshLevel & RefreshLevel.REFLOW_TRANSFORM) {
          cache = false;
          break;
        }
        parent = parent.parent;
      }
      if (!cache) {
        assignMatrix(m, this.matrix);
        parent = this.parent;
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
