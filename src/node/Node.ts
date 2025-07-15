import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { ExportOptions, getDefaultStyle, JNode, JStyle, Override, Props } from '../format';
import { ResizingConstraint, toSketchColor } from '../format/sketch';
import { kernelSize, outerSizeByD } from '../math/blur';
import { d2r } from '../math/geom';
import {
  assignMatrix,
  calRectPoints,
  identity,
  isE,
  multiply,
  multiplyRotateZ,
  multiplyScaleX,
  multiplyScaleY,
  toE,
} from '../math/matrix';
import Container from '../node/Container';
import Root from '../node/Root';
import CanvasCache from '../refresh/CanvasCache';
import { RefreshLevel } from '../refresh/level';
import { Struct } from '../refresh/struct';
import TextureCache from '../refresh/TextureCache';
import {
  calNormalLineHeight,
  calSize,
  color2rgbaStr,
  equalStyle,
  getCssBlur,
  getCssFillStroke,
  getCssShadow,
  getCssStrokePosition,
  normalize,
} from '../style/css';
import {
  BLUR,
  ComputedGradient,
  ComputedPattern,
  ComputedShadow,
  ComputedStyle,
  FILL_RULE,
  Gradient,
  GRADIENT,
  MASK,
  MIX_BLEND_MODE,
  Pattern,
  PATTERN_FILL_TYPE,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
  Style,
  StyleUnit,
  VISIBILITY,
} from '../style/define';
import { calMatrixByOrigin, calRotateZ, calTransformByMatrixAndOrigin } from '../style/transform';
import Event from '../util/Event';
import { clone, equal } from '../util/type';
import ArtBoard from './ArtBoard';
import { LayoutData } from './layout';
import Page from './Page';
import SymbolInstance from './SymbolInstance';
import Tile from '../refresh/Tile';
import { canvasPolygon } from '../refresh/paint';
import inject, { OffScreen } from '../util/inject';
import { getCanvasGCO } from '../style/mbm';
import { getConic, getLinear, getRadial } from '../style/gradient';

export type Loader = {
  error: boolean;
  loading: boolean;
  source?: HTMLImageElement;
  width: number;
  height: number;
};

class Node extends Event {
  width: number;
  height: number;
  minWidth: number; // 最小尺寸限制，当子节点有固定尺寸或者子节点还是组递归有固定时，最小限制不能调整
  minHeight: number; // 同上，同时要考虑子节点是文字的特殊情况，有类似一行最少文字宽度的情况
  props: Props;
  style: Style;
  computedStyle: ComputedStyle;
  root?: Root;
  page?: Page;
  artBoard?: ArtBoard;
  symbolInstance?: SymbolInstance;
  prev?: Node;
  next?: Node;
  mask?: Node; // 如果被mask遮罩，指向对方引用
  parent?: Container;
  isDestroyed: boolean;
  isMounted: boolean;
  struct: Struct;
  refreshLevel: RefreshLevel;
  _opacity: number; // 世界透明度
  hasCacheOp: boolean; // 是否计算过世界opacity
  localOpId: number; // 同下面的matrix
  parentOpId: number;
  transform: Float64Array; // 不包含transformOrigin
  matrix: Float64Array; // 包含transformOrigin
  _matrixWorld: Float64Array; // 世界transform
  hasCacheMw: boolean; // 是否计算过世界matrix
  localMwId: number; // 当前计算后的世界matrix的id，每次改变自增
  parentMwId: number; // 父级的id副本，用以对比确认父级是否变动过
  _rect?: Float64Array; // 真实内容组成的内容框，group/geom特殊计算
  _bbox?: Float64Array; // 以rect为基础，包含边框包围盒
  _filterBbox?: Float64Array; // 包含filter/阴影内内容外的包围盒
  _bbox2?: Float64Array; // 扩大取整的bbox
  _filterBbox2?: Float64Array; // 扩大取整的filterBbox
  hasContent: boolean;
  canvasCache?: CanvasCache; // 先渲染到2d上作为缓存
  textureCache: Array<TextureCache | undefined>; // 从canvasCache生成的纹理缓存
  textureTotal: Array<TextureCache | undefined>; // 局部子树缓存
  textureFilter: Array<TextureCache | undefined>; // 有filter时的缓存
  textureMask: Array<TextureCache | undefined>; // 作为mask时的缓存
  textureTint: Array<TextureCache | undefined>; // tint的缓存
  textureTarget: Array<TextureCache | undefined>; // 指向自身所有缓存中最优先的那个
  textureOutline: Array<TextureCache | undefined>; // 轮廓mask特殊使用
  tempOpacity: number; // 局部根节点merge汇总临时用到的2个
  tempMatrix: Float64Array;
  tempBbox?: Float64Array; // 这个比较特殊，在可视范围外的merge没有变化会一直保存，防止重复计算
  tempIndex: number;
  isGroup = false; // Group对象和Container基本一致，多了自适应尺寸和选择区别
  isArtBoard = false;
  isSymbolMaster = false;
  isSymbolInstance = false;
  isPage = false;
  isText = false;
  isGeom = false;
  isPolyline = false;
  isBitmap = false;
  isShapeGroup = false;
  isContainer = false;
  isSlice = false;
  isFrame = false;
  isGraphic = false;
  tileList: Tile[];
  uuid: string;
  name: string;
  nameIsFixed: boolean;
  index: number;
  constrainProportions: boolean;
  isLocked: boolean;
  isExpanded: boolean;
  exportOptions: ExportOptions;
  loaders: Loader[];

  constructor(props: Props) {
    super();
    this.props = props;
    this.uuid = this.props.uuid || uuid.v4();
    this.name = this.props.name || '';
    this.nameIsFixed = this.props.nameIsFixed || false;
    this.index = this.props.index ?? -1;
    this.constrainProportions = this.props.constrainProportions || false;
    this.isLocked = this.props.isLocked || false;
    this.isExpanded = this.props.isExpanded || false;
    this.exportOptions = {
      exportFormats: props.exportOptions?.exportFormats?.map(item => {
        return Object.assign({}, item);
      }) || [],
    };
    this.style = normalize(getDefaultStyle(props.style));
    // @ts-ignore
    this.computedStyle = {}; // 输出展示的值
    this.width = 0;
    this.height = 0;
    this.minWidth = 0.5;
    this.minHeight = 0.5;
    this.isDestroyed = true;
    this.isMounted = false;
    this.struct = {
      node: this,
      num: 0,
      total: 0,
      lv: 0,
      next: 0,
    };
    this.refreshLevel = RefreshLevel.REFLOW;
    this._opacity = 1;
    this.hasCacheOp = false;
    this.localOpId = 0;
    this.parentOpId = 0;
    this.transform = identity();
    this.matrix = identity();
    this._matrixWorld = identity();
    this.hasCacheMw = false;
    this.localMwId = 0;
    this.parentMwId = 0;
    this.hasContent = false;
    this.textureCache = [];
    this.textureTotal = [];
    this.textureFilter = [];
    this.textureMask = [];
    this.textureTint = [];
    this.textureTarget = [];
    this.textureOutline = [];
    // merge过程中相对于merge顶点作为局部根节点时暂存的数据
    this.tempOpacity = 1;
    this.tempMatrix = identity();
    this.tempIndex = 0;
    this.tileList = [];
    this.loaders = [];
  }

  // 添加到dom后标记非销毁状态，和root引用
  willMount() {
    this.isDestroyed = false;
    const parent = this.parent;
    // 只有root没有parent
    if (!parent) {
      return;
    }
    this.parentOpId = parent.localOpId;
    this.parentMwId = parent.localMwId;
    const root = (this.root = parent.root);
    if (!this.isPage) {
      this.page = parent.page;
    }
    if (!this.isArtBoard) {
      this.artBoard = parent.artBoard;
    }
    if (!this.isSymbolInstance) {
      this.symbolInstance = parent.symbolInstance;
    }
    const uuid = this.uuid;
    if (root && uuid) {
      root.refs[uuid] = this;
    }
  }

  // layout后触发，渲染之前
  didMount() {
    this.isMounted = true;
  }

  willUnmount() {
    // 无论是否真实dom，都清空
    this.prev = this.next = undefined;
    this.page = undefined;
    this.artBoard = undefined;
    this.symbolInstance = undefined;
    this.parent = this.root = this.mask = undefined;
  }

  lay(data: LayoutData) {
    this.refreshLevel = RefreshLevel.REFLOW;
    // 布局时计算所有样式，更新时根据不同级别调用
    this.calReflowStyle();
    const { style, computedStyle } = this;
    const { left, top, right, bottom, width, height } = style;
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
    // if (width.u !== StyleUnit.AUTO) {
    //   this.minWidth = this.width;
    // }
    // else {
    //   this.minWidth = 0.5;
    // }
    // if (height.u !== StyleUnit.AUTO) {
    //   this.minHeight = this.height;
    // }
    // else {
    //   this.minHeight = 0.5;
    // }
    // 左右决定width
    if (fixedLeft && fixedRight) {
      this.width = computedStyle.width =
        Math.max(this.minWidth, data.w - computedStyle.left - computedStyle.right);
    }
    else if (fixedLeft) {
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle.width;
      }
      else {
        this.width = this.minWidth;
      }
      computedStyle.right = data.w - computedStyle.left - this.width;
    }
    else if (fixedRight) {
      if (width.u !== StyleUnit.AUTO) {
        this.width = computedStyle.width;
      }
      else {
        this.width = this.minWidth;
      }
      computedStyle.left = data.w - computedStyle.right - this.width;
    }
    // 上下决定height
    if (fixedTop && fixedBottom) {
      this.height = computedStyle.height =
        Math.max(this.minHeight, data.h - computedStyle.top - computedStyle.bottom);
    }
    else if (fixedTop) {
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle.height;
      }
      else {
        this.height = this.minHeight;
      }
      computedStyle.bottom = data.h - computedStyle.top - this.height;
    }
    else if (fixedBottom) {
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle.height;
      }
      else {
        this.height = this.minHeight;
      }
      computedStyle.top = data.h - computedStyle.bottom - this.height;
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
    // 轮廓的缓存一般仅在reflow时清除，因为不会因渲染改变，矢量则根据points变化自行覆写
    this.textureOutline.forEach((item) => item?.release());
    this._rect = undefined;
  }

  // 插入node到自己后面
  insertAfter(node: Node, cb?: (sync: boolean) => void) {
    node.remove();
    const { root, parent } = this;
    if (!parent) {
      throw new Error('Can not appendSelf without parent');
    }
    node.parent = parent;
    node.prev = this;
    if (this.next) {
      node.index = (this.next.index + this.index) * 0.5;
      this.next.prev = node;
    }
    else {
      node.index = (this.index + 1) * 0.5;
    }
    node.next = this.next;
    this.next = node;
    node.root = root;
    const children = parent.children;
    const i = children.indexOf(this);
    children.splice(i + 1, 0, node);
    if (parent.isDestroyed) {
      cb && cb(true);
      return;
    }
    node.willMount();
    parent.insertStruct(node, i + 1);
    root!.addUpdate(node, [], RefreshLevel.REFLOW, true, false, (sync) => {
      cb && cb(sync);
    });
  }

  // 插入node到自己前面
  insertBefore(node: Node, cb?: (sync: boolean) => void) {
    node.remove();
    const { root, parent } = this;
    if (!parent) {
      throw new Error('Can not prependBefore without parent');
    }
    node.parent = parent;
    node.prev = this.prev;
    if (this.prev) {
      node.index = (this.prev.index + this.index) * 0.5;
      this.prev.next = node;
    }
    else {
      node.index = this.index * 0.5;
    }
    node.next = this;
    this.prev = node;
    node.root = root;
    const children = parent.children;
    const i = children.indexOf(this);
    children.splice(i, 0, node);
    if (parent.isDestroyed) {
      cb && cb(true);
      return;
    }
    node.willMount();
    parent.insertStruct(node, i);
    root!.addUpdate(node, [], RefreshLevel.REFLOW, true, false, (sync) => {
      cb && cb(sync);
    });
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
        this.width = computedStyle.width = Math.max(this.minWidth, calSize(width, parent.width));
      }
      if (height.u !== StyleUnit.AUTO) {
        this.height = computedStyle.height = Math.max(this.minHeight, calSize(height, parent.height));
      }
    }
    // 不应该没有parent，Root会自己强制计算要求px，但防止特殊逻辑比如添加自定义矢量fake计算还是兜底
    else {
      if (width.u === StyleUnit.PX) {
        this.width = computedStyle.width = width.v;
      }
      if (height.u === StyleUnit.PX) {
        this.height = computedStyle.height = height.v;
      }
    }
    computedStyle.letterSpacing = style.letterSpacing.v;
    computedStyle.paragraphSpacing = style.paragraphSpacing.v;
    computedStyle.textAlign = style.textAlign.v;
    computedStyle.textVerticalAlign = style.textVerticalAlign.v;
  }

  calRepaintStyle(lv: RefreshLevel) {
    const { style, computedStyle } = this;
    computedStyle.visibility = style.visibility.v;
    computedStyle.color = style.color.v;
    computedStyle.backgroundColor = style.backgroundColor.v;
    computedStyle.fill = style.fill.map((item) => {
      if (Array.isArray(item.v)) {
        return item.v.slice(0);
      }
      const p = item.v as Pattern;
      if (p && p.url !== undefined) {
        return {
          url: p.url,
          type: p.type,
          scale: (p.scale?.v ?? 100) * 0.01,
        } as ComputedPattern;
      }
      const v = item.v as Gradient;
      return {
        t: v.t,
        d: v.d.slice(0),
        stops: v.stops.map(item => {
          const offset = item.offset.v * 0.01;
          return {
            color: item.color.v.slice(0),
            offset,
          };
        }),
      } as ComputedGradient;
    });
    computedStyle.fillEnable = style.fillEnable.map((item) => item.v);
    computedStyle.fillOpacity = style.fillOpacity.map((item) => item.v);
    computedStyle.fillMode = style.fillMode.map((item) => item.v);
    computedStyle.fillRule = style.fillRule.v;
    computedStyle.stroke = style.stroke.map((item) => {
      if (Array.isArray(item.v)) {
        return item.v.slice(0);
      }
      const v = item.v as Gradient;
      return {
        t: v.t,
        d: v.d.slice(0),
        stops: v.stops.map(item => {
          const offset = item.offset ? item.offset.v * 0.01 : undefined;
          return {
            color: item.color.v.slice(0),
            offset,
          };
        }),
      } as ComputedGradient;
    });
    computedStyle.strokeEnable = style.strokeEnable.map((item) => item.v);
    computedStyle.strokeWidth = style.strokeWidth.map((item) => item.v);
    computedStyle.strokePosition = style.strokePosition.map((item) => item.v);
    computedStyle.strokeMode = style.strokeMode.map((item) => item.v);
    computedStyle.strokeDasharray = style.strokeDasharray.map((item) => item.v);
    computedStyle.strokeLinecap = style.strokeLinecap.v;
    computedStyle.strokeLinejoin = style.strokeLinejoin.v;
    computedStyle.strokeMiterlimit = style.strokeMiterlimit.v;
    computedStyle.booleanOperation = style.booleanOperation.v;
    computedStyle.mixBlendMode = style.mixBlendMode.v;
    computedStyle.pointerEvents = style.pointerEvents.v;
    if (lv & (RefreshLevel.MASK | RefreshLevel.REFLOW | RefreshLevel.REPAINT)) {
      this.calMask();
    }
    computedStyle.innerShadow = style.innerShadow.map((item) => {
      const v = item.v;
      return {
        x: v.x.v,
        y: v.y.v,
        blur: v.blur.v,
        spread: v.spread.v,
        color: v.color.v,
      };
    });
    computedStyle.innerShadowEnable = style.innerShadowEnable.map(
      (item) => item.v,
    );
    computedStyle.textDecoration = style.textDecoration.map(item => item.v);
    computedStyle.overflow = style.overflow.v;
    // 只有重布局或者改transform才影响，普通repaint不变
    if (lv & RefreshLevel.REFLOW_TRANSFORM) {
      this.calMatrix(lv);
    }
    // 同matrix
    if (lv & RefreshLevel.REFLOW_OPACITY) {
      this.calOpacity();
    }
    if (lv & RefreshLevel.REFLOW_FILTER) {
      this.calFilter(lv);
    }
    this.clearCache(true);
    this._bbox = undefined;
    this._bbox2 = undefined;
    this._filterBbox = undefined;
    this._filterBbox2 = undefined;
    this.tempBbox = undefined;
  }

  calMask() {
    const { style, computedStyle } = this;
    computedStyle.maskMode = style.maskMode.v;
    computedStyle.breakMask = style.breakMask.v;
    // append时还得看prev的情况，如果自己也是mask，后续会修正
    let prev = this.prev;
    if (prev && !computedStyle.breakMask) {
      if (prev.computedStyle.maskMode) {
        this.mask = prev;
      }
      else if (prev.mask) {
        this.mask = prev.mask;
      }
    }
    if (computedStyle.maskMode) {
      // mask不能同时被mask
      this.mask = undefined;
      let next = this.next;
      while (next) {
        // 初始连续mask的情况，next的computedStyle还未生成，紧接着后续节点自己calMask()会修正
        if (next.computedStyle.maskMode) {
          next.mask = this;
          break;
        }
        if (next.computedStyle.breakMask) {
          break;
        }
        // 本身是mask的话，忽略breakMask，后续肯定都是自己的遮罩对象
        next.mask = this;
        next = next.next;
      }
    }
    else {
      // 不是mask的话，要看本身是否被遮罩，决定next是否有被遮罩
      let target = computedStyle.breakMask ? undefined : this.mask;
      this.mask = target;
      let next = this.next;
      while (next) {
        if (next.computedStyle.maskMode) {
          next.mask = target;
          break;
        }
        if (next.computedStyle.breakMask) {
          break;
        }
        next.mask = target;
        next = next.next;
      }
    }
  }

  calFilter(lv: RefreshLevel) {
    const { style, computedStyle } = this;
    const blur = style.blur.v;
    computedStyle.blur = {
      t: blur.t,
      radius: blur.radius?.v || 0,
      center: blur.center ? blur.center.map(item => item.v * 0.01) as [number, number] : [0.5, 0.5],
      saturation: (blur.saturation?.v ?? 100) * 0.01,
      angle: blur.angle ? blur.angle.v : 0,
    };
    computedStyle.shadow = style.shadow.map((item) => {
      const v = item.v;
      return {
        x: v.x.v,
        y: v.y.v,
        blur: v.blur.v,
        spread: v.spread.v,
        color: v.color.v,
      };
    });
    computedStyle.shadowEnable = style.shadowEnable.map((item) => item.v);
    computedStyle.hueRotate = style.hueRotate.v;
    computedStyle.saturate = style.saturate.v * 0.01;
    computedStyle.brightness = style.brightness.v * 0.01;
    computedStyle.contrast = style.contrast.v * 0.01;
    // repaint已经做了
    if (lv < RefreshLevel.REPAINT) {
      this._filterBbox = undefined;
      this._filterBbox2 = undefined;
      this.tempBbox = undefined;
      this.textureFilter.forEach((item) => item?.release());
      this.textureMask.forEach((item) => item?.release());
      this.textureTint.forEach((item) => item?.release());
      this.resetTextureTarget();
    }
  }

  calMatrix(lv: RefreshLevel): Float64Array {
    const { style, computedStyle, matrix, transform } = this;
    // 每次更新标识且id++，获取matrixWorld或者每帧渲染会置true，首次0时强制进入，虽然布局过程中会调用，防止手动调用不可预期
    if (this.hasCacheMw || !this.localMwId) {
      this.hasCacheMw = false;
      this.localMwId++;
    }
    let optimize = true;
    if (
      lv >= RefreshLevel.REFLOW ||
      lv & RefreshLevel.TRANSFORM ||
      (lv & RefreshLevel.SCALE_X && !computedStyle.scaleX) ||
      (lv & RefreshLevel.SCALE_Y && !computedStyle.scaleY)
    ) {
      optimize = false;
    }
    // 优化计算scale不能为0，无法计算倍数差
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
        const sin = Math.sin(r),
          cos = Math.cos(r);
        const x = computedStyle.scaleX,
          y = computedStyle.scaleY;
        matrix[0] = transform[0] = cos * x;
        matrix[1] = transform[1] = sin * y;
        matrix[4] = transform[4] = -sin * x;
        matrix[5] = transform[5] = cos * y;
        const t = computedStyle.transformOrigin,
          ox = t[0],
          oy = t[1];
        matrix[12] = transform[12] + ox - transform[0] * ox - oy * transform[4];
        matrix[13] = transform[13] + oy - transform[1] * ox - oy * transform[5];
      }
      if (lv & RefreshLevel.SCALE) {
        if (lv & RefreshLevel.SCALE_X) {
          const v = style.scaleX.v;
          const x = v / computedStyle.scaleX;
          computedStyle.scaleX = v;
          transform[0] *= x;
          transform[4] *= x;
          matrix[0] *= x;
          matrix[4] *= x;
        }
        if (lv & RefreshLevel.SCALE_Y) {
          const v = style.scaleY.v;
          const y = v / computedStyle.scaleY;
          computedStyle.scaleY = v;
          transform[1] *= y;
          transform[5] *= y;
          matrix[1] *= y;
          matrix[5] *= y;
        }
        const t = computedStyle.transformOrigin,
          ox = t[0],
          oy = t[1];
        matrix[12] = transform[12] + ox - transform[0] * ox - transform[4] * oy;
        matrix[13] = transform[13] + oy - transform[1] * ox - transform[5] * oy;
        matrix[14] = transform[14] - transform[2] * ox - transform[6] * oy;
      }
    }
    // 普通布局或者第一次计算
    else {
      toE(transform);
      const tfo = style.transformOrigin.map((item, i) => {
        return calSize(item, i ? this.height : this.width);
      });
      computedStyle.transformOrigin = tfo as [number, number];
      // 开个口子，直接提供matrix
      if (style.matrix) {
        computedStyle.matrix = style.matrix.v.slice(0);
        assignMatrix(matrix, computedStyle.matrix);
        this.transform = calTransformByMatrixAndOrigin(matrix, tfo[0], tfo[1]);
        return matrix;
      }
      // 一般走这里，特殊将left/top和translate合并一起加到matrix上，这样渲染视为[0, 0]开始
      // karas是不加上但渲染时以left/top为开始
      computedStyle.translateX = calSize(style.translateX, this.width);
      transform[12] = computedStyle.left + computedStyle.translateX;
      computedStyle.translateY = calSize(style.translateY, this.height);
      transform[13] = computedStyle.top + computedStyle.translateY;
      const rotateZ = style.rotateZ ? style.rotateZ.v : 0;
      const scaleX = style.scaleX ? style.scaleX.v : 1;
      const scaleY = style.scaleY ? style.scaleY.v : 1;
      computedStyle.rotateZ = rotateZ;
      computedStyle.scaleX = scaleX;
      computedStyle.scaleY = scaleY;
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
      if (isE(transform) && rotateZ) {
        calRotateZ(transform, rotateZ);
      }
      else if (rotateZ) {
        multiplyRotateZ(transform, d2r(rotateZ));
      }
      const t = calMatrixByOrigin(transform, tfo[0], tfo[1]);
      assignMatrix(matrix, t);
    }
    return matrix;
  }

  calOpacity() {
    const { style, computedStyle } = this;
    if (this.hasCacheOp || !this.localOpId) {
      this.hasCacheOp = false;
      this.localOpId++;
    }
    computedStyle.opacity = style.opacity.v;
  }

  // 是否有内容，由各个子类自己实现
  calContent() {
    return (this.hasContent = false);
  }

  // 释放可能存在的老数据，具体渲染由各个子类自己实现
  renderCanvas(scale: number) {
    const canvasCache = this.canvasCache;
    if (canvasCache && canvasCache.available && scale) {
      canvasCache.release();
    }
  }

  renderFillStroke(scale: number, coords: number[][][], isClosed = true) {
    if (!coords.length) {
      return;
    }
    const bbox = this._bbox2 || this.bbox2;
    const x = bbox[0],
      y = bbox[1];
    let w = bbox[2] - x,
      h = bbox[3] - y;
    const dx = -x * scale,
      dy = -y * scale;
    w *= scale;
    h *= scale;
    const {
      fill,
      fillOpacity,
      fillRule,
      fillEnable,
      fillMode,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
    } = this.computedStyle;

    const canvasCache = (this.canvasCache = CanvasCache.getInstance(w, h, dx, dy));
    canvasCache.available = true;
    const list = canvasCache.list;
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      const { x, y, os: { ctx } } = item;
      const dx2 = -x;
      const dy2 = -y;
      if (scale !== 1) {
        ctx.setLineDash(strokeDasharray.map((i) => i * scale));
      }
      else {
        ctx.setLineDash(strokeDasharray);
      }
      ctx.beginPath();
      coords.forEach((item) => {
        canvasPolygon(ctx, item, scale, dx2, dy2);
      });
      if (isClosed) {
        ctx.closePath();
      }
      // 先下层的fill
      for (let j = 0, len = fill.length; j < len; j++) {
        if (!fillEnable[j] || !fillOpacity[j]) {
          continue;
        }
        let f = fill[j];
        // 椭圆的径向渐变无法直接完成，用mask来模拟，即原本用纯色填充，然后离屏绘制渐变并用matrix模拟椭圆，再合并
        let ellipse: OffScreen | undefined;
        const mode = fillMode[j];
        ctx.globalAlpha = fillOpacity[j];
        if (Array.isArray(f)) {
          if (f[3] <= 0) {
            continue;
          }
          ctx.fillStyle = color2rgbaStr(f);
        }
        // 非纯色
        else {
          // 图像填充
          if ((f as ComputedPattern).url !== undefined) {
            f = f as ComputedPattern;
            const url = f.url;
            if (url) {
              let loader = this.loaders[j];
              const cache = inject.IMG[url];
              // 已有的图像同步直接用
              if (!loader && cache && cache.source) {
                loader = this.loaders[j] = {
                  error: false,
                  loading: false,
                  width: cache.width,
                  height: cache.height,
                  source: cache.source,
                };
              }
              if (loader) {
                if (!loader.error && !loader.loading && loader.source) {
                  const width = this.width;
                  const height = this.height;
                  const wc = width * scale;
                  const hc = height * scale;
                  // 裁剪到范围内，不包含边框，即矢量本身的内容范围，本来直接在原画布即可，但chrome下clip+mbm有问题，不得已用离屏
                  const os = inject.getOffscreenCanvas(w, h);
                  const ctx2 = os.ctx;
                  ctx2.beginPath();
                  coords.forEach((item) => {
                    canvasPolygon(ctx2, item, scale, dx2, dy2);
                  });
                  if (isClosed) {
                    ctx2.closePath();
                  }
                  ctx2.save();
                  ctx2.clip();
                  if (f.type === PATTERN_FILL_TYPE.TILE) {
                    const ratio = f.scale ?? 1;
                    for (let i = 0, len = Math.ceil(width / ratio / loader.width); i < len; i++) {
                      for (let j = 0, len = Math.ceil(height / ratio / loader.height); j < len; j++) {
                        ctx2.drawImage(
                          loader.source,
                          dx2 + i * loader.width * scale * ratio,
                          dy2 + j * loader.height * scale * ratio,
                          loader.width * scale * ratio,
                          loader.height * scale * ratio,
                        );
                      }
                    }
                  }
                  else if (f.type === PATTERN_FILL_TYPE.FILL) {
                    const sx = wc / loader.width;
                    const sy = hc / loader.height;
                    const sc = Math.max(sx, sy);
                    const x = (loader.width * sc - wc) * -0.5;
                    const y = (loader.height * sc - hc) * -0.5;
                    ctx2.drawImage(loader.source, 0, 0, loader.width, loader.height,
                      x + dx2, y + dy2, loader.width * sc, loader.height * sc);
                  }
                  else if (f.type === PATTERN_FILL_TYPE.STRETCH) {
                    ctx2.drawImage(loader.source!, dx2, dy2, wc, hc);
                  }
                  else if (f.type === PATTERN_FILL_TYPE.FIT) {
                    const sx = wc / loader.width;
                    const sy = hc / loader.height;
                    const sc = Math.min(sx, sy);
                    const x = (loader.width * sc - wc) * -0.5;
                    const y = (loader.height * sc - hc) * -0.5;
                    ctx2.drawImage(loader.source, 0, 0, loader.width, loader.height,
                      x + dx2, y + dy2, loader.width * sc, loader.height * sc);
                  }
                  // 记得还原
                  ctx2.restore();
                  if (mode !== MIX_BLEND_MODE.NORMAL) {
                    ctx.globalCompositeOperation = getCanvasGCO(mode);
                  }
                  ctx.drawImage(os.canvas, 0, 0);
                  if (mode !== MIX_BLEND_MODE.NORMAL) {
                    ctx.globalCompositeOperation = 'source-over';
                  }
                  os.release();
                }
                else if (!loader.error && !loader.loading) {
                  this.root!.imgLoadingCount++;
                }
              }
              else {
                this.root!.imgLoadingCount++;
                loader = this.loaders[j] = this.loaders[j] || {
                  error: false,
                  loading: true,
                  width: 0,
                  height: 0,
                  source: undefined,
                };
                inject.loadImg(url, (data: any) => {
                  // 可能会变更，所以加载完后对比下是不是当前最新的
                  if (url === (fill[j] as ComputedPattern)?.url) {
                    loader.loading = false;
                    if (data.success) {
                      loader.error = false;
                      loader.source = data.source;
                      loader.width = data.width;
                      loader.height = data.height;
                      if (!this.isDestroyed) {
                        this.root!.addUpdate(
                          this,
                          [],
                          RefreshLevel.REPAINT,
                          false,
                          false,
                          undefined,
                        );
                      }
                    }
                    else {
                      loader.error = true;
                    }
                    this.root!.imgLoadingCount--;
                  }
                });
              }
            }
            continue;
          }
          // 渐变
          else {
            f = f as ComputedGradient;
            if (f.t === GRADIENT.LINEAR) {
              const gd = getLinear(f.stops, f.d, 0, 0, w - dx * 2, h - dy * 2);
              const lg = ctx.createLinearGradient(gd.x1 + dx2, gd.y1 + dy2, gd.x2 + dx2, gd.y2 + dy2);
              gd.stop.forEach((item) => {
                lg.addColorStop(item.offset, color2rgbaStr(item.color));
              });
              ctx.fillStyle = lg;
            }
            else if (f.t === GRADIENT.RADIAL) {
              const gd = getRadial(f.stops, f.d, 0, 0, w - dx * 2, h - dy * 2);
              const rg = ctx.createRadialGradient(
                gd.cx + dx2,
                gd.cy + dy2,
                0,
                gd.cx + dx2,
                gd.cy + dy2,
                gd.total,
              );
              gd.stop.forEach((item) => {
                rg.addColorStop(item.offset, color2rgbaStr(item.color));
              });
              // 椭圆渐变，由于有缩放，用clip确定绘制范围，然后缩放长短轴绘制椭圆
              const m = gd.matrix;
              if (m) {
                ellipse = inject.getOffscreenCanvas(w, h);
                const ctx2 = ellipse.ctx;
                ctx2.beginPath();
                coords.forEach((item) => {
                  canvasPolygon(ctx2, item, scale, dx2, dy2);
                });
                if (isClosed) {
                  ctx2.closePath();
                }
                ctx2.clip();
                ctx2.fillStyle = rg;
                ctx2.setTransform(m[0], m[1], m[4], m[5], m[12], m[13]);
                ctx2.fill(fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero');
              }
              else {
                ctx.fillStyle = rg;
              }
            }
            else if (f.t === GRADIENT.CONIC) {
              const gd = getConic(f.stops, f.d, 0, 0, w - dx * 2, h - dy * 2);
              const cg = ctx.createConicGradient(gd.angle, gd.cx + dx2, gd.cy + dy2);
              gd.stop.forEach((item) => {
                cg.addColorStop(item.offset, color2rgbaStr(item.color));
              });
              ctx.fillStyle = cg;
            }
          }
        }
        if (mode !== MIX_BLEND_MODE.NORMAL) {
          ctx.globalCompositeOperation = getCanvasGCO(mode);
        }
        if (ellipse) {
          ctx.drawImage(ellipse.canvas, 0, 0);
          ellipse.release();
        }
        else {
          ctx.fill(fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero');
        }
        if (mode !== MIX_BLEND_MODE.NORMAL) {
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      // fill有opacity和mode，设置记得还原
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // 内阴影使用canvas的能力
      const { innerShadow, innerShadowEnable } = this.computedStyle;
      if (innerShadow && innerShadow.length) {
        let hasInnerShadow = false;
        // 计算取偏移+spread最大值后再加上blur半径，这个尺寸扩展用以生成shadow的必要宽度
        let n = 0;
        innerShadow.forEach((item, i) => {
          if (!innerShadowEnable[i]) {
            return;
          }
          hasInnerShadow = true;
          const m =
            (Math.max(Math.abs(item.x), Math.abs(item.y)) + item.spread) * scale;
          n = Math.max(n, m + item.blur * scale);
        });
        if (hasInnerShadow) {
          // 限制在图形内clip
          ctx.save();
          ctx.beginPath();
          coords.forEach((item) => {
            canvasPolygon(ctx, item, scale, dx2, dy2);
          });
          if (isClosed) {
            ctx.closePath();
          }
          ctx.clip();
          ctx.fillStyle = '#FFF';
          // 在原本图形基础上，外围扩大n画个边框，这样奇偶使得填充在clip范围外不会显示出来，但shadow却在内可以显示
          ctx.beginPath();
          coords.forEach((item) => {
            canvasPolygon(ctx, item, scale, dx2, dy2);
          });
          canvasPolygon(
            ctx,
            [
              [-n, -n],
              [w + n, -n],
              [w + n, h + n],
              [-n, h + n],
              [-n, -n],
            ],
            1,
            dx2,
            dy2,
          );
          ctx.closePath();
          innerShadow.forEach((item, i) => {
            if (!innerShadowEnable[i]) {
              return;
            }
            ctx.shadowOffsetX = item.x * scale;
            ctx.shadowOffsetY = item.y * scale;
            ctx.shadowColor = color2rgbaStr(item.color);
            ctx.shadowBlur = item.blur * scale;
            ctx.fill('evenodd');
          });
          ctx.restore();
          // 还原给stroke用
          ctx.beginPath();
          coords.forEach((item) => {
            canvasPolygon(ctx, item, scale, dx2, dy2);
          });
          if (isClosed) {
            ctx.closePath();
          }
        }
      }
      // 线帽设置
      if (strokeLinecap === STROKE_LINE_CAP.ROUND) {
        ctx.lineCap = 'round';
      }
      else if (strokeLinecap === STROKE_LINE_CAP.SQUARE) {
        ctx.lineCap = 'square';
      }
      else {
        ctx.lineCap = 'butt';
      }
      if (strokeLinejoin === STROKE_LINE_JOIN.ROUND) {
        ctx.lineJoin = 'round';
      }
      else if (strokeLinejoin === STROKE_LINE_JOIN.BEVEL) {
        ctx.lineJoin = 'bevel';
      }
      else {
        ctx.lineJoin = 'miter';
      }
      ctx.miterLimit = strokeMiterlimit;
      // 再上层的stroke
      for (let j = 0, len = stroke.length; j < len; j++) {
        if (!strokeEnable[j] || !strokeWidth[j]) {
          continue;
        }
        const s = stroke[j];
        const p = strokePosition[j];
        ctx.globalCompositeOperation = getCanvasGCO(strokeMode[j]);
        // 颜色
        if (Array.isArray(s)) {
          ctx.strokeStyle = color2rgbaStr(s);
        }
        // 或者渐变
        else {
          if (s.t === GRADIENT.LINEAR) {
            const gd = getLinear(s.stops, s.d, 0, 0, w - dx * 2, h - dy * 2);
            const lg = ctx.createLinearGradient(gd.x1 + dx2, gd.y1 + dy2, gd.x2 + dx2, gd.y2 + dy2);
            gd.stop.forEach((item) => {
              lg.addColorStop(item.offset, color2rgbaStr(item.color));
            });
            ctx.strokeStyle = lg;
          }
          else if (s.t === GRADIENT.RADIAL) {
            const gd = getRadial(s.stops, s.d, 0, 0, w - dx * 2, h - dy * 2);
            const rg = ctx.createRadialGradient(
              gd.cx + dx2,
              gd.cy + dy2,
              0,
              gd.cx + dx2,
              gd.cy + dy2,
              gd.total,
            );
            gd.stop.forEach((item) => {
              rg.addColorStop(item.offset, color2rgbaStr(item.color));
            });
            // 椭圆渐变，由于有缩放，先离屏绘制白色stroke记a，再绘制变换的结果整屏fill记b，b混合到a上用source-in即可只显示重合的b
            const m = gd.matrix;
            if (m) {
              const ellipse = inject.getOffscreenCanvas(item.w, item.h);
              const ctx2 = ellipse.ctx;
              ctx2.setLineDash(ctx.getLineDash());
              ctx2.lineCap = ctx.lineCap;
              ctx2.lineJoin = ctx.lineJoin;
              ctx2.miterLimit = ctx.miterLimit;
              ctx2.lineWidth = strokeWidth[j] * scale;
              ctx2.strokeStyle = '#FFF';
              ctx2.beginPath();
              coords.forEach((item) => {
                canvasPolygon(ctx2, item, scale, dx2, dy2);
              });
              if (isClosed) {
                ctx2.closePath();
              }
              if (p === STROKE_POSITION.INSIDE && isClosed) {
                ctx2.lineWidth = strokeWidth[j] * 2 * scale;
                ctx2.save();
                ctx2.clip();
                ctx2.stroke();
                ctx2.restore();
              }
              else if (p === STROKE_POSITION.OUTSIDE && isClosed) {
                ctx2.lineWidth = strokeWidth[j] * 2 * scale;
                ctx2.stroke();
                ctx2.save();
                ctx2.clip();
                ctx2.globalCompositeOperation = 'destination-out';
                ctx2.strokeStyle = '#FFF';
                ctx2.stroke();
                ctx2.restore();
              }
              else {
                ctx2.stroke();
              }
              ctx2.fillStyle = rg;
              ctx2.globalCompositeOperation = 'source-in';
              ctx2.setTransform(m[0], m[1], m[4], m[5], m[12], m[13]);
              ctx2.fillRect(0, 0, w, h);
              ctx.drawImage(ellipse.canvas, 0, 0);
              ellipse.release();
              continue;
            }
            else {
              ctx.strokeStyle = rg;
            }
          }
          else if (s.t === GRADIENT.CONIC) {
            const gd = getConic(s.stops, s.d, 0, 0, w - dx * 2, h - dy * 2);
            const cg = ctx.createConicGradient(gd.angle, gd.cx + dx2, gd.cy + dy2);
            gd.stop.forEach((item) => {
              cg.addColorStop(item.offset, color2rgbaStr(item.color));
            });
            ctx.strokeStyle = cg;
          }
        }
        // 注意canvas只有居中描边，内部需用clip模拟，外部比较复杂需离屏擦除
        let os: OffScreen | undefined, ctx2: CanvasRenderingContext2D | undefined;
        if (p === STROKE_POSITION.INSIDE && isClosed) {
          ctx.lineWidth = strokeWidth[j] * 2 * scale;
        }
        else if (p === STROKE_POSITION.OUTSIDE && isClosed) {
          os = inject.getOffscreenCanvas(item.w, item.h);
          ctx2 = os.ctx;
          ctx2.setLineDash(ctx.getLineDash());
          ctx2.lineCap = ctx.lineCap;
          ctx2.lineJoin = ctx.lineJoin;
          ctx2.miterLimit = ctx.miterLimit;
          ctx2.strokeStyle = ctx.strokeStyle;
          ctx2.lineWidth = strokeWidth[j] * 2 * scale;
          ctx2.beginPath();
          coords.forEach((item) => {
            canvasPolygon(ctx2!, item, scale, dx2, dy2);
          });
        }
        else {
          ctx.lineWidth = strokeWidth[j] * scale;
        }
        if (isClosed) {
          if (ctx2) {
            ctx2.closePath();
          }
        }
        if (p === STROKE_POSITION.INSIDE && isClosed) {
          ctx.save();
          ctx.clip();
          ctx.stroke();
          ctx.restore();
        }
        else if (p === STROKE_POSITION.OUTSIDE && isClosed) {
          ctx2!.stroke();
          ctx2!.save();
          ctx2!.clip();
          ctx2!.globalCompositeOperation = 'destination-out';
          ctx2!.strokeStyle = '#FFF';
          ctx2!.stroke();
          ctx2!.restore();
          ctx.drawImage(os!.canvas, 0, 0);
          os!.release();
        }
        else {
          ctx.stroke();
        }
      }
      // 还原
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  genTexture(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    scale: number,
    scaleIndex: number,
  ) {
    this.renderCanvas(scale);
    this.textureCache[scaleIndex]?.release();
    const canvasCache = this.canvasCache;
    if (canvasCache?.available) {
      this.textureTarget[scaleIndex] = this.textureCache[scaleIndex] =
        TextureCache.getInstance(
          gl,
          canvasCache,
          (this._bbox2 || this.bbox2).slice(0),
        );
      // canvasCache.list.forEach((item, i) => {
      //   item.os.canvas.toBlob((blob) => {
      //     if (blob) {
      //       const img = document.createElement('img');
      //       img.onload = () => {
      //         canvasCache.release();
      //       };
      //       img.src = URL.createObjectURL(blob);
      //       img.setAttribute('name', this.name + i);
      //       document.body.appendChild(img);
      //     }
      //   });
      // });
      canvasCache.release();
    }
    else {
      this.textureTarget[scaleIndex] = this.textureCache[scaleIndex] =
        undefined;
    }
  }

  resetTextureTarget() {
    const { textureTint, textureMask, textureFilter, textureTotal, textureCache } = this;
    // 组可能没有自身内容但有total
    for (let i = 0, len = Math.max(textureCache.length, textureTotal.length); i < len; i++) {
      if (textureTint[i]?.available) {
        this.textureTarget[i] = textureTint[i];
      }
      else if (textureMask[i]?.available) {
        this.textureTarget[i] = textureMask[i];
      }
      else if (textureFilter[i]?.available) {
        this.textureTarget[i] = textureFilter[i];
      }
      else if (textureTotal[i]?.available) {
        this.textureTarget[i] = textureTotal[i];
      }
      else if (textureCache[i]?.available) {
        this.textureTarget[i] = textureCache[i];
      }
      else {
        this.textureTarget[i] = undefined;
      }
    }
  }

  clearCache(includeSelf = false) {
    this.textureTarget.splice(0);
    if (includeSelf) {
      this.refreshLevel |= RefreshLevel.REPAINT;
      this.textureCache.forEach((item) => item?.release());
    }
    else {
      this.textureCache.forEach((item, i) => {
        if (item && item.available) {
          this.textureTarget[i] = item;
        }
      });
    }
    // 可能total就是cache自身，前面includeSelf已经判断过，无论哪种情况都可以不关心
    this.textureTotal.forEach((item) => {
      if (item?.release()) {
        this.refreshLevel |= RefreshLevel.CACHE;
      }
    });
    this.textureFilter.forEach((item) => {
      if (item?.release()) {
        this.refreshLevel |= RefreshLevel.FILTER;
      }
    });
    this.textureMask.forEach((item) => {
      if (item?.release()) {
        this.refreshLevel |= RefreshLevel.MASK;
      }
    });
    this.textureTint.forEach((item) => {
      if (item?.release()) {
        this.refreshLevel |= RefreshLevel.TINT;
      }
    });
    this.textureOutline.forEach((item) => item?.release());
  }

  clearCacheUpward(includeSelf = false) {
    let parent = this.parent;
    while (parent) {
      parent.tempBbox = undefined;
      parent.clearCache(includeSelf);
      let mask = parent.mask;
      if (mask) {
        mask.clearMask();
      }
      parent = parent.parent;
    }
  }

  clearMask(upwards = true) {
    this.textureMask.forEach((item) => item?.release());
    this.resetTextureTarget();
    this.struct.next = 0;
    this.refreshLevel |= RefreshLevel.MASK;
    // mask切换影响父级组的bbox
    if (upwards) {
      let p = this.parent;
      while (p && p !== this.root) {
        p._rect = undefined;
        p._bbox = undefined;
        p._bbox2 = undefined;
        p._filterBbox = undefined;
        p._filterBbox2 = undefined;
        p.tempBbox = undefined;
        p = p.parent;
      }
    }
  }

  clearTint() {
    this.textureTint.forEach((item) => item?.release());
    this.resetTextureTarget();
    this.refreshLevel |= RefreshLevel.TINT;
  }

  remove(cb?: (sync: boolean) => void) {
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
    this.isMounted = false;
    this.clearCache(true);
  }

  structure(lv: number): Array<Struct> {
    const temp = this.struct;
    temp.lv = lv;
    return [temp];
  }

  updateFormatStyleData(style: Partial<Style>) {
    const keys: string[] = [];
    for (let k in style) {
      if (style.hasOwnProperty(k)) {
        const v = style[k as keyof Style];
        if (!equalStyle(k, style, this.style)) {
          // @ts-ignore
          this.style[k] = v;
          keys.push(k);
        }
      }
    }
    // 最小尺寸约束
    // const parent = this.parent;
    // if (parent) {
    //   const computedStyle = this.computedStyle;
    //   /**
    //    * 拖拽拉伸只会有left或者right之一，同时有是修改x输入框时left+right同时平移等量距离
    //    * 文本是个特殊，自动尺寸时left和right只有一方且width是auto
    //    * 因此修改left时如果同时修改right可以不校验（x输入框触发，后续会改成translate），
    //    * 而如果right是auto则说明是自适应/固定尺寸的文本，也要忽略
    //    * 如果要更精细地区分，需要看left/right/width的值和修改值，暂时省略
    //    */
    //   if (
    //     style.hasOwnProperty('left') &&
    //     !style.hasOwnProperty('right') &&
    //     this.style.right.u !== StyleUnit.AUTO
    //   ) {
    //     const left = style.left!;
    //     const left2 = calSize(left, parent.width);
    //     const w = parent.width - computedStyle.right - left2;
    //     if (w < this.minWidth) {
    //       if (left.u === StyleUnit.PX) {
    //       }
    //       else if (left.u === StyleUnit.PERCENT) {
    //         const max =
    //           ((parent.width - computedStyle.right - this.minWidth) * 100) /
    //           parent.width;
    //         // 限制导致的无效更新去除
    //         if (left.v === max) {
    //           let i = keys.indexOf('left');
    //           keys.splice(i, 1);
    //         }
    //         else {
    //           left.v = this.style.left.v = max;
    //         }
    //       }
    //     }
    //   }
    //   else if (
    //     style.hasOwnProperty('right') &&
    //     !style.hasOwnProperty('left') &&
    //     this.style.left.u !== StyleUnit.AUTO
    //   ) {
    //     const right = style.right!;
    //     const right2 = calSize(right, parent.width);
    //     const w = parent.width - computedStyle.left - right2;
    //     if (w < this.minWidth) {
    //       if (right.u === StyleUnit.PX) {
    //       }
    //       else if (right.u === StyleUnit.PERCENT) {
    //         const max =
    //           ((parent.width - computedStyle.left - this.minWidth) * 100) /
    //           parent.width;
    //         // 限制导致的无效更新去除
    //         if (right.v === max) {
    //           let i = keys.indexOf('right');
    //           keys.splice(i, 1);
    //         }
    //         else {
    //           right.v = this.style.right.v = max;
    //         }
    //       }
    //     }
    //   }
    //   // 上下也一样
    //   if (
    //     style.hasOwnProperty('top') &&
    //     !style.hasOwnProperty('bottom') &&
    //     this.style.bottom.u !== StyleUnit.AUTO
    //   ) {
    //     const top = style.top!;
    //     const top2 = calSize(top, parent.height);
    //     const h = parent.height - computedStyle.bottom - top2;
    //     if (h < this.minHeight) {
    //       if (top.u === StyleUnit.PX) {
    //       }
    //       else if (top.u === StyleUnit.PERCENT) {
    //         const max =
    //           ((parent.height - computedStyle.bottom - this.minHeight) * 100) /
    //           parent.height;
    //         // 限制导致的无效更新去除
    //         if (top.v === max) {
    //           let i = keys.indexOf('top');
    //           keys.splice(i, 1);
    //         }
    //         else {
    //           top.v = this.style.top.v = max;
    //         }
    //       }
    //     }
    //   }
    //   else if (
    //     style.hasOwnProperty('bottom') &&
    //     !style.hasOwnProperty('top') &&
    //     this.style.top.u !== StyleUnit.AUTO
    //   ) {
    //     const bottom = style.bottom!;
    //     const bottom2 = calSize(bottom, parent.height);
    //     const h = parent.height - computedStyle.top - bottom2;
    //     if (h < this.minHeight) {
    //       if (bottom.u === StyleUnit.PX) {
    //       }
    //       else if (bottom.u === StyleUnit.PERCENT) {
    //         const max =
    //           ((parent.height - computedStyle.top - this.minHeight) * 100) /
    //           parent.height;
    //         // 限制导致的无效更新去除
    //         if (bottom.v === max) {
    //           let i = keys.indexOf('bottom');
    //           keys.splice(i, 1);
    //         }
    //         else {
    //           bottom.v = this.style.bottom.v = max;
    //         }
    //       }
    //     }
    //   }
    // }
    return keys;
  }

  updateFormatStyle(style: Partial<Style>, cb?: ((sync: boolean) => void), noRefresh = false) {
    const keys = this.updateFormatStyleData(style);
    // 无变更
    if (!keys.length) {
      cb && cb(true);
      return { keys, lv: RefreshLevel.NONE };
    }
    const lv = this.root?.addUpdate(this, keys, undefined, false, false, cb, noRefresh);
    return { keys, lv };
  }

  // 只更新样式不触发影响计算和后续刷新
  updateStyleData(style: Partial<JStyle>) {
    const formatStyle = normalize(style);
    return this.updateFormatStyleData(formatStyle);
  }

  updateStyle(style: Partial<JStyle>, cb?: ((sync: boolean) => void) | boolean, noRefresh = false) {
    const formatStyle = normalize(style);
    if (typeof cb === 'boolean') {
      noRefresh = cb;
      cb = undefined;
    }
    return this.updateFormatStyle(formatStyle, cb, noRefresh);
  }

  updateProps(props: any, cb?: (sync: boolean) => void) {
    const keys: string[] = [];
    for (let k in props) {
      if (props.hasOwnProperty(k)) {
        // @ts-ignore
        const v = props[k];
        // @ts-ignore
        const v2 = this.props[k];
        if (!equal(v, v2)) {
          // @ts-ignore
          this.props[k] = v;
          keys.push(v);
        }
      }
    }
    if (!keys.length) {
      cb && cb(true);
      return keys;
    }
    this.root?.addUpdate(this, keys, undefined, false, false, cb);
  }

  refreshStyle(style: string[] | Object, cb?: (sync: boolean) => void) {
    let keys: string[];
    if (Array.isArray(style)) {
      keys = style.slice(0);
    }
    else {
      keys = Object.keys(style);
      keys.forEach((k) => {
        // @ts-ignore
        this.style[k] = style[k];
      });
    }
    if (!keys.length) {
      cb && cb(true);
      return keys;
    }
    this.root?.addUpdate(this, keys, undefined, false, false, cb);
    return keys;
  }

  refreshProps(props: any, cb?: (sync: boolean) => void) {
    let keys: string[];
    if (Array.isArray(props)) {
      keys = props.slice(0);
    }
    else {
      keys = Object.keys(props);
      keys.forEach((k) => {
        // @ts-ignore
        this.props[k] = props[k];
      });
    }
    if (!keys.length) {
      cb && cb(true);
      return keys;
    }
    this.root?.addUpdate(this, keys, undefined, false, false, cb);
    return keys;
  }

  refresh(data: RefreshLevel = RefreshLevel.REPAINT, cb?: ((sync: boolean) => void) | boolean, noRefresh = false) {
    if (typeof cb === 'boolean') {
      noRefresh = cb;
      cb = undefined;
    }
    this.root?.addUpdate(this, [], data, false, false, cb, noRefresh);
  }

  getStyle() {
    return clone(this.style) as Style;
  }

  getComputedStyle() {
    const res: ComputedStyle = Object.assign({}, this.computedStyle);
    res.color = res.color.slice(0);
    res.backgroundColor = res.backgroundColor.slice(0);
    res.fill = clone(res.fill);
    res.stroke = clone(res.stroke);
    res.shadow = clone(res.shadow);
    res.innerShadow = clone(res.innerShadow);
    res.fillOpacity = res.fillOpacity.slice(0);
    res.fillEnable = res.fillEnable.slice(0);
    res.fillMode = res.fillMode.slice(0);
    res.strokeEnable = res.strokeEnable.slice(0);
    res.strokeWidth = res.strokeWidth.slice(0);
    res.transformOrigin = res.transformOrigin.slice(0);
    res.strokeDasharray = res.strokeDasharray.slice(0);
    res.shadowEnable = res.shadowEnable.slice(0);
    return res;
  }

  getCssStyle() {
    const res: any = {};
    const { style, computedStyle } = this;
    Object.assign(res, computedStyle);
    // %单位转换
    ['top', 'right', 'bottom', 'left', 'width', 'height', 'translateX', 'translateY', 'scaleX', 'scaleY', 'rotateZ'].forEach((k) => {
      const o: any = style[k as keyof JStyle];
      if (o.u === StyleUnit.AUTO) {
        res[k] = 'auto';
      }
      else if (o.u === StyleUnit.PERCENT) {
        res[k] = o.v + '%';
      }
      else if (o.u === StyleUnit.PX || o.u === StyleUnit.NUMBER || o.u === StyleUnit.DEG) {
        res[k] = o.v;
      }
    });
    res.opacity = computedStyle.opacity;
    res.visibility = computedStyle.visibility === VISIBILITY.VISIBLE ? 'visible' : 'hidden';
    res.color = color2rgbaStr(computedStyle.color);
    res.backgroundColor = color2rgbaStr(computedStyle.backgroundColor);
    res.fontStyle = ['normal', 'italic', 'oblique'][computedStyle.fontStyle];
    res.textAlign = ['left', 'center', 'right', 'justify'][computedStyle.textAlign];
    res.textVerticalAlign = ['top', 'middle', 'bottom'][computedStyle.textVerticalAlign];
    res.mixBlendMode = [
      'normal',
      'multiply',
      'screen',
      'overlay',
      'darken',
      'lighten',
      'color-dodge',
      'color-burn',
      'hard-light',
      'soft-light',
      'difference',
      'exclusion',
      'hue',
      'saturation',
      'color',
      'luminosity',
    ][computedStyle.mixBlendMode];
    ['shadowEnable', 'strokeEnable', 'fillEnable', 'fillOpacity', 'strokeWidth'].forEach((k) => {
      res[k] = computedStyle[k as 'shadowEnable' | 'strokeEnable' | 'fillEnable' | 'fillOpacity' | 'strokeWidth'].slice(0);
    });
    res.fill = computedStyle.fill.map(item => getCssFillStroke(item, this.width, this.height));
    res.fillRule = ['nonzero', 'evenodd'][computedStyle.fillRule];
    res.fillMode = computedStyle.fillMode;
    res.stroke = computedStyle.stroke.map(item => getCssFillStroke(item, this.width, this.height));
    res.strokeLinecap = ['butt', 'round', 'square'][computedStyle.strokeLinecap];
    res.strokeLinejoin = ['miter', 'round', 'bevel'][computedStyle.strokeLinejoin];
    res.strokePosition = computedStyle.strokePosition.map(item => getCssStrokePosition(item));
    res.strokeMiterlimit = computedStyle.strokeMiterlimit;
    res.strokeDasharray = computedStyle.strokeDasharray;
    res.maskMode = ['none', 'outline', 'alpha', 'gray', 'alpha-with', 'gray-with'][computedStyle.maskMode];
    res.booleanOperation = ['none', 'union', 'subtract', 'intersect', 'xor']
      [computedStyle.booleanOperation];
    const blur = computedStyle.blur;
    res.blur = getCssBlur(blur.t, blur.radius, blur.angle, blur.center, blur.saturation);
    res.shadow = computedStyle.shadow.map((item: ComputedShadow) => getCssShadow(item));
    const tfo = style.transformOrigin;
    res.transformOrigin = computedStyle.transformOrigin.map((item: number, i: number) => {
      const o = tfo[i];
      if (o.u === StyleUnit.PERCENT) {
        return o.v + '%';
      }
      return item;
    });
    res.hueRotate = computedStyle.hueRotate;
    res.saturate = computedStyle.saturate * 100 + '%';
    res.brightness = computedStyle.brightness * 100 + '%';
    res.contrast = computedStyle.contrast * 100 + '%';
    res.overflow = ['visible', 'hidden'][computedStyle.overflow] || 'visible';
    return res as JStyle;
  }

  getBoundingClientRect(opt?: {
    includeBbox?: boolean,
    excludeRotate?: boolean,
    excludeDpi?: boolean,
  }) {
    const bbox = opt?.includeBbox
      ? this._bbox || this.bbox
      : this._rect || this.rect;
    let t;
    // 由于没有scale（仅-1翻转），不考虑自身旋转时需parent的matrixWorld点乘自身无旋转的matrix
    if (opt?.excludeRotate && this.computedStyle.rotateZ) {
      const parent = this.parent!;
      const i = identity();
      const matrix = this.matrix;
      i[12] = matrix[12];
      i[13] = matrix[13];
      const m = multiply(parent.matrixWorld, i);
      t = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], m);
    }
    else {
      t = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], this.matrixWorld);
    }
    const dpi = this.root?.dpi || 1;
    const x1 = opt?.excludeDpi ? t.x1 / dpi : t.x1;
    const y1 = opt?.excludeDpi ? t.y1 / dpi : t.y1;
    const x2 = opt?.excludeDpi ? t.x2 / dpi : t.x2;
    const y2 = opt?.excludeDpi ? t.y2 / dpi : t.y2;
    const x3 = opt?.excludeDpi ? t.x3 / dpi : t.x3;
    const y3 = opt?.excludeDpi ? t.y3 / dpi : t.y3;
    const x4 = opt?.excludeDpi ? t.x4 / dpi : t.x4;
    const y4 = opt?.excludeDpi ? t.y4 / dpi : t.y4;
    const left = Math.min(x1, x2, x3, x4);
    const top = Math.min(y1, y2, y3, y4);
    const right = Math.max(x1, x2, x3, x4);
    const bottom = Math.max(y1, y2, y3, y4);
    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      points: [
        {
          x: x1,
          y: y1,
        },
        {
          x: x2,
          y: y2,
        },
        {
          x: x3,
          y: y3,
        },
        {
          x: x4,
          y: y4,
        },
      ],
    };
  }

  /**
   * 拖拽开始变更尺寸前预校验，如果style有translate初始值，需要改成普通模式（为0），比如Text和固定尺寸的节点，
   * left调整到以左侧为基准（translateX从-50%到0，差值重新加到left上），top同理，
   * 如此才能防止拉伸时（如往右）以自身中心点为原点左右一起变化，拖拽结束后再重置回去（translateX重新-50%，left也重算）。
   * right/bottom一般情况不用关心，因为如果是left+right说明Text是固定尺寸width无效且无translateX，但为了扩展兼容一并考虑，
   * 只有left百分比+translateX-50%需要，width可能固定也可能自动不用考虑只需看当前计算好的width值。
   */
  startSizeChange() {
    const {
      width,
      height,
      style,
      computedStyle,
      parent,
      isDestroyed,
    } = this;
    if (isDestroyed || !parent) {
      throw new Error('Can not resize a destroyed Node or Root');
    }
    const {
      left,
      right,
      top,
      bottom,
      translateX,
      translateY,
    } = style;
    const { width: pw, height: ph } = parent;
    // 理论sketch中只有-50%，但人工可能有其他值，可统一处理
    if (translateX.v && translateX.u === StyleUnit.PERCENT) {
      const v = translateX.v * width * 0.01;
      if (left.u === StyleUnit.PERCENT) {
        left.v += v * 100 / pw;
      }
      else if (left.u === StyleUnit.PX) {
        left.v += v;
      }
      computedStyle.left += v;
      if (right.u === StyleUnit.PERCENT) {
        right.v -= v * 100 / pw;
      }
      else if (right.u === StyleUnit.PX) {
        right.v -= v;
      }
      computedStyle.right -= v;
      translateX.v = 0;
    }
    if (translateY.v && translateY.u === StyleUnit.PERCENT) {
      const v = translateY.v * height * 0.01;
      if (top.u === StyleUnit.PERCENT) {
        top.v += v * 100 / ph;
      }
      else if (top.u === StyleUnit.PX) {
        top.v += v;
      }
      computedStyle.top += v;
      if (bottom.u === StyleUnit.PERCENT) {
        bottom.v -= v * 100 / ph;
      }
      else if (bottom.u === StyleUnit.PX) {
        bottom.v -= v;
      }
      computedStyle.bottom -= v;
      translateY.v = 0;
    }
  }

  /**
   * 参考 startSizeChange()，反向进行，在连续拖拽改变尺寸的过程中，最后结束调用。
   * 根据开始调整时记录的prev样式，还原布局信息到translate（仅百分比）上。
   * 还需向上检查组的自适应尺寸，放在外部自己调用check。
   */
  endSizeChange(prev: Style) {
    const {
      translateX,
      translateY,
    } = prev;
    const {
      style,
      computedStyle,
      parent,
      width: w,
      height: h,
    } = this;
    const {
      left,
      right,
      top,
      bottom,
    } = style;
    const { width: pw, height: ph } = parent!;
    if (translateX.v && translateX.u === StyleUnit.PERCENT) {
      const v = translateX.v * w * 0.01;
      if (left.u === StyleUnit.PX) {
        left.v -= v;
      }
      else if (left.u === StyleUnit.PERCENT) {
        left.v -= v * 100 / pw;
      }
      computedStyle.left -= v;
      if (right.u === StyleUnit.PX) {
        right.v += v;
      }
      else if (right.u === StyleUnit.PERCENT) {
        right.v += v * 100 / pw;
      }
      computedStyle.right += v;
      computedStyle.translateX += v; // start置0了
    }
    if (translateY.v && translateY.u === StyleUnit.PERCENT) {
      const v = translateY.v * h * 0.01;
      if (top.u === StyleUnit.PX) {
        top.v -= v;
      }
      else if (style.top.u === StyleUnit.PERCENT) {
        top.v -= v * 100 / ph;
      }
      computedStyle.top -= v;
      if (bottom.u === StyleUnit.PX) {
        bottom.v += v;
      }
      else if (bottom.u === StyleUnit.PERCENT) {
        bottom.v += v * 100 / ph;
      }
      computedStyle.bottom += v;
      computedStyle.translateY += v;
    }
    style.translateX.v = translateX.v;
    style.translateX.u = translateX.u;
    style.translateY.v = translateY.v;
    style.translateY.u = translateY.u;
  }

  // 移动过程是用translate加速，结束后要更新TRBL的位置以便后续定位，还要还原translate为原本的%（可能）
  endPosChange(prev: Style, dx: number, dy: number) {
    const { style, computedStyle, parent } = this;
    // 未添加到dom
    if (!parent) {
      return;
    }
    const {
      translateX,
      translateY,
    } = prev;
    const {
      top,
      right,
      bottom,
      left,
    } = style;
    // 一定有parent，不会改root下固定的Container子节点
    const { width: pw, height: ph } = parent;
    if (dx) {
      if (left.u === StyleUnit.PX) {
        left.v += dx;
      }
      else if (left.u === StyleUnit.PERCENT) {
        left.v += dx * 100 / pw;
      }
      computedStyle.left += dx;
      if (right.u === StyleUnit.PX) {
        right.v -= dx;
      }
      else if (right.u === StyleUnit.PERCENT) {
        right.v -= dx * 100 / pw;
      }
      computedStyle.right -= dx;
      computedStyle.translateX -= dx;
    }
    if (dy) {
      if (top.u === StyleUnit.PX) {
        top.v += dy;
      }
      else if (top.u === StyleUnit.PERCENT) {
        top.v += dy * 100 / ph;
      }
      computedStyle.top += dy;
      if (bottom.u === StyleUnit.PX) {
        bottom.v -= dy;
      }
      else if (bottom.u === StyleUnit.PERCENT) {
        bottom.v -= dy * 100 / ph;
      }
      computedStyle.bottom -= dy;
      computedStyle.translateY -= dy;
    }
    style.translateX.v = translateX.v;
    style.translateX.u = translateX.u;
    style.translateY.v = translateY.v;
    style.translateY.u = translateY.u;
  }

  // 子节点变更导致的父组适配，无视固定尺寸设置调整，调整后的数据才是新固定尺寸
  protected adjustPosAndSizeSelf(
    dx1: number,
    dy1: number,
    dx2: number,
    dy2: number,
  ) {
    const { style, computedStyle, parent, root } = this;
    if (!parent || !root || (!dx1 && !dy1 && !dx2 && !dy2)) {
      return;
    }
    const { width: pw, height: ph } = parent;
    const {
      top,
      right,
      bottom,
      left,
      width,
      height,
    } = style;
    // 水平调整统一处理，固定此时无效
    if (dx1) {
      if (left.u === StyleUnit.PX) {
        left.v += dx1;
      }
      else if (left.u === StyleUnit.PERCENT) {
        left.v += (dx1 * 100) / pw;
      }
      else if (width.u === StyleUnit.PX) {
        width.v = dx2 + this.width - dx1;
      }
      else if (width.u === StyleUnit.PERCENT) {
        width.v = (dx2 + this.width - dx1) * 100 / parent.width;
      }
      computedStyle.left += dx1;
    }
    if (dx2) {
      if (right.u === StyleUnit.PX) {
        right.v -= dx2;
      }
      else if (right.u === StyleUnit.PERCENT) {
        right.v -= (dx2 * 100) / pw;
      }
      else if (width.u === StyleUnit.PX) {
        width.v = dx2 + this.width - dx1;
      }
      else if (width.u === StyleUnit.PERCENT) {
        width.v = (dx2 + this.width - dx1) * 100 / parent.width;
      }
      computedStyle.right -= dx2;
    }
    this.width = computedStyle.width =
      parent.width - computedStyle.left - computedStyle.right;
    // 垂直和水平一样
    if (dy1) {
      if (top.u === StyleUnit.PX) {
        top.v += dy1;
      }
      else if (top.u === StyleUnit.PERCENT) {
        top.v += (dy1 * 100) / ph;
      }
      else if (height.u === StyleUnit.PX) {
        height.v = dy2 + this.height - dy1;
      }
      else if (height.u === StyleUnit.PERCENT) {
        height.v = (dy2 + this.height - dy1) * 100 / parent.height;
      }
      computedStyle.top += dy1;
    }
    if (dy2) {
      if (bottom.u === StyleUnit.PX) {
        bottom.v -= dy2
      }
      else if (bottom.u === StyleUnit.PERCENT) {
        bottom.v -= (dy2 * 100) / ph;
      }
      else if (height.u === StyleUnit.PX) {
        height.v = dy2 + this.height - dy1;
      }
      else if (height.u === StyleUnit.PERCENT) {
        height.v = (dy2 + this.height - dy1) * 100 / parent.height;
      }
      computedStyle.bottom -= dy2;
    }
    this.height = computedStyle.height =
      parent.height - computedStyle.top - computedStyle.bottom;
    // 影响matrix，这里不能用优化optimize计算，必须重新计算，因为最终值是left+translateX
    this.refreshLevel |= RefreshLevel.TRANSFORM;
    root.rl |= RefreshLevel.TRANSFORM;
    this.calMatrix(RefreshLevel.TRANSFORM);
    // 记得重置
    this._rect = undefined;
    this._bbox = undefined;
    this._bbox2 = undefined;
    this._filterBbox = undefined;
    this._filterBbox2 = undefined;
    this.tempBbox = undefined;
  }

  // 节点位置尺寸发生变更后，会递归向上影响，逐步检查，可能在某层没有影响提前跳出中断
  checkPosSizeUpward() {
    const root = this.root!;
    let parent = this.parent;
    while (parent && parent !== root) {
      if (!parent.adjustPosAndSize()) {
        // 无影响中断向上递归，比如拖动节点并未超过组的范围
        break;
      }
      parent = parent.parent;
    }
  }

  // 空实现，叶子节点和Container要么没children，要么不关心根据children自适应尺寸，Group会覆盖
  adjustPosAndSize() {
    return false;
  }

  getZoom(excludeDpi = false) {
    let n = this.computedStyle.scaleX;
    let p = this.parent;
    while (p && p !== this.page && !p.isPage) {
      n *= p.computedStyle.scaleX;
      p = p.parent;
    }
    if (!excludeDpi && this.root) {
      return n * this.root.dpi;
    }
    return n;
  }

  setZoom(n: number, excludeDpi = false) {
    if (excludeDpi && this.root) {
      n /= this.root.dpi;
    }
    this.updateStyle({
      scaleX: n,
      scaleY: n,
    });
  }

  rename(s: string) {
    this.name = s;
  }

  getStructs() {
    if (!this.root) {
      return [];
    }
    return [this.struct];
  }

  isSibling(target: Node) {
    let p = this.prev;
    while (p) {
      if (p === target) {
        return true;
      }
      p = p.prev;
    }
    let n = this.next;
    while (n) {
      if (n === target) {
        return true;
      }
      n = n.next;
    }
    return false;
  }

  toJson(): JNode {
    return {
      tagName: 'node',
      props: Object.assign({}, clone(this.props), {
        uuid: this.uuid,
        name: this.name,
        nameIsFixed: this.nameIsFixed,
        index: this.index,
        constrainProportions: this.constrainProportions,
        isLocked: this.isLocked,
        isExpanded: this.isExpanded,
        exportOptions: this.exportOptions,
      }),
    };
  }

  async toSketchJson(zip: JSZip, blobHash?: Record<string, string>) {
    const { width, height, style, computedStyle } = this;
    let resizingConstraint = 0;
    if (style.left.v === StyleUnit.PX) {
      resizingConstraint |= ResizingConstraint.LEFT;
    }
    if (style.right.v === StyleUnit.PX) {
      resizingConstraint |= ResizingConstraint.RIGHT;
    }
    if (style.top.v === StyleUnit.PX) {
      resizingConstraint |= ResizingConstraint.TOP;
    }
    if (style.bottom.v === StyleUnit.PX) {
      resizingConstraint |= ResizingConstraint.BOTTOM;
    }
    if (style.width.v === StyleUnit.PX) {
      resizingConstraint |= ResizingConstraint.WIDTH;
    }
    if (style.height.v === StyleUnit.PX) {
      resizingConstraint |= ResizingConstraint.HEIGHT;
    }
    resizingConstraint ^= ResizingConstraint.UNSET;
    let lineCapStyle = SketchFormat.LineCapStyle.Butt;
    if (computedStyle.strokeLinecap === STROKE_LINE_CAP.ROUND) {
      lineCapStyle = SketchFormat.LineCapStyle.Round;
    }
    else if (computedStyle.strokeLinecap === STROKE_LINE_CAP.SQUARE) {
      lineCapStyle = SketchFormat.LineCapStyle.Projecting;
    }
    let lineJoinStyle = SketchFormat.LineJoinStyle.Miter;
    if (computedStyle.strokeLinejoin === STROKE_LINE_JOIN.ROUND) {
      lineJoinStyle = SketchFormat.LineJoinStyle.Round;
    }
    else if (computedStyle.strokeLinejoin === STROKE_LINE_JOIN.BEVEL) {
      lineJoinStyle = SketchFormat.LineJoinStyle.Bevel;
    }
    const {
      shadow,
      shadowEnable,
      innerShadow,
      innerShadowEnable,
      blur,
      hueRotate,
      brightness,
      contrast,
      saturate,
      opacity,
      mixBlendMode,
      scaleX,
      scaleY,
    } = computedStyle;
    const shadows: SketchFormat.Shadow[] = [];
    const innerShadows: SketchFormat.InnerShadow[] = [];
    shadow.forEach((item, i) => {
      shadows.push({
        _class: 'shadow',
        isEnabled: shadowEnable[i],
        blurRadius: item.blur,
        color: toSketchColor(item.color),
        contextSettings: {
          _class: 'graphicsContextSettings',
          blendMode: SketchFormat.BlendMode.Normal,
          opacity: 1,
        },
        offsetX: item.x,
        offsetY: item.y,
        spread: item.spread,
      });
    });
    innerShadow.forEach((item, i) => {
      innerShadows.push({
        _class: 'innerShadow',
        isEnabled: innerShadowEnable[i],
        blurRadius: item.blur,
        color: toSketchColor(item.color),
        contextSettings: {
          _class: 'graphicsContextSettings',
          blendMode: SketchFormat.BlendMode.Normal,
          opacity: 1,
        },
        offsetX: item.x,
        offsetY: item.y,
        spread: item.spread,
      });
    });
    const json: Pick<
      SketchFormat.AnyLayer,
      'booleanOperation' |
      'clippingMaskMode' |
      'do_objectID' |
      'exportOptions' |
      'frame' |
      'hasClippingMask' |
      'isFixedToViewport' |
      'isFlippedHorizontal' |
      'isFlippedVertical' |
      'isLocked' |
      'isTemplate' |
      'isVisible' |
      'layerListExpandedType' |
      'name' |
      'nameIsFixed' |
      'resizingConstraint' |
      'resizingType' |
      'rotation' |
      'shouldBreakMaskChain' |
      'style'
    > = {
      booleanOperation: computedStyle.booleanOperation - 1,
      clippingMaskMode: computedStyle.maskMode === MASK.ALPHA ? 1 : 0,
      do_objectID: this.uuid,
      exportOptions: {
        exportFormats: this.exportOptions.exportFormats?.map(item => {
          return {
            _class: 'exportFormat',
            absoluteSize: 0,
            fileFormat: item.fileFormat as SketchFormat.ExportFileFormat,
            name: '',
            scale: item.scale,
            visibleScaleType: 0,
          };
        }) || [],
        includedLayerIds: [],
        layerOptions: 0,
        shouldTrim: false,
        _class: 'exportOptions',
      },
      frame: {
        constrainProportions: this.constrainProportions || false,
        width: width || 0,
        height: height || 0,
        x: computedStyle.left + computedStyle.translateX,
        y: computedStyle.top + computedStyle.translateY,
        _class: 'rect',
      },
      hasClippingMask: computedStyle.maskMode !== MASK.NONE,
      isFixedToViewport: false,
      isFlippedHorizontal: scaleX === -1,
      isFlippedVertical: scaleY === -1,
      isLocked: this.isLocked || false,
      isTemplate: false,
      isVisible: computedStyle.visibility === VISIBILITY.VISIBLE,
      layerListExpandedType: this.isExpanded
        ? SketchFormat.LayerListExpanded.Expanded
        : SketchFormat.LayerListExpanded.Collapsed,
      name: this.name || '',
      nameIsFixed: this.nameIsFixed || false,
      resizingConstraint,
      resizingType: SketchFormat.ResizeType.Stretch,
      rotation: -computedStyle.rotateZ,
      shouldBreakMaskChain: computedStyle.breakMask,
      style: {
        _class: 'style',
        do_objectID: this.props.styleId || uuid.v4(),
        borderOptions: {
          _class: 'borderOptions',
          isEnabled: true,
          dashPattern: computedStyle.strokeDasharray,
          lineCapStyle,
          lineJoinStyle,
        },
        startMarkerType: SketchFormat.MarkerType.OpenArrow,
        endMarkerType: SketchFormat.MarkerType.OpenArrow,
        miterLimit: computedStyle.strokeMiterlimit,
        windingRule: computedStyle.fillRule === FILL_RULE.EVEN_ODD ?
          SketchFormat.WindingRule.EvenOdd :
          SketchFormat.WindingRule.NonZero,
        shadows,
        innerShadows,
        colorControls: {
          _class: 'colorControls',
          isEnabled: true,
          brightness: brightness - 1,
          contrast,
          hue: d2r(hueRotate),
          saturation: saturate,
        },
        contextSettings: {
          _class: 'graphicsContextSettings',
          blendMode: [0, 2, 5, 7, 1, 4, 6, 3, 9, 8, 10, 11, 12, 13, 14, 15][mixBlendMode] || 0,
          opacity,
        },
      },
    };
    json.style!.fills = await Promise.all(computedStyle.fill.map(async (f, i) => {
      const color: SketchFormat.Color = {
        _class: 'color',
        alpha: 1,
        red: 0,
        green: 0,
        blue: 0,
      };
      const gradient: SketchFormat.Gradient = {
        _class: 'gradient',
        gradientType: SketchFormat.GradientType.Linear,
        elipseLength: 1,
        from: '',
        to: '',
        stops: [],
      };
      let fillType = SketchFormat.FillType.Color;
      let patternFillType: any = SketchFormat.PatternFillType.Tile;
      let patternTileScale = 1;
      let image: SketchFormat.FileRef | undefined;
      // 纯色
      if (Array.isArray(f)) {
        toSketchColor(f, color);
      }
      // 非纯色
      else {
        // 图像填充
        if ((f as ComputedPattern).url) {
          f = f as ComputedPattern;
          fillType = SketchFormat.FillType.Pattern;
          patternFillType = f.type;
          patternTileScale = f.scale;
          const imagesZip = zip.folder('images');
          if (imagesZip) {
            const res = await fetch(f.url);
            const blob = res.blob();
            const url = (this.uuid || uuid.v4()) + '.png';
            imagesZip.file(url, blob);
            image = {
              _class: 'MSJSONFileReference',
              _ref_class: 'MSImageData',
              _ref: 'images/' + url,
            };
          }
        }
        // 渐变
        else {
          fillType = SketchFormat.FillType.Gradient;
          f = f as ComputedGradient;
          gradient.from = '{' + f.d[0] + ', ' + f.d[1] + '}';
          gradient.to = '{' + f.d[2] + ', ' + f.d[3] + '}';
          if (f.t === GRADIENT.RADIAL) {
            gradient.gradientType = SketchFormat.GradientType.Radial;
            gradient.elipseLength = f.d[4];
          }
          else if (f.t === GRADIENT.CONIC) {
            gradient.gradientType = SketchFormat.GradientType.Angular;
          }
          f.stops.forEach(item => {
            gradient.stops.push({
              _class: 'gradientStop',
              color: toSketchColor(item.color),
              position: item.offset || 0,
            });
          });
        }
      }
      return {
        _class: 'fill',
        isEnabled: computedStyle.fillEnable[i],
        color,
        fillType,
        noiseIndex: 0,
        noiseIntensity: 0,
        patternFillType,
        patternTileScale,
        gradient,
        image,
        contextSettings: {
          _class: 'graphicsContextSettings',
          blendMode: SketchFormat.BlendMode.Normal,
          opacity: computedStyle.fillOpacity[i],
        },
      };
    }));
    json.style!.borders = computedStyle.stroke.map((s, i) => {
      const color: SketchFormat.Color = {
        _class: 'color',
        alpha: 1,
        red: 0,
        green: 0,
        blue: 0,
      };
      const gradient: SketchFormat.Gradient = {
        _class: 'gradient',
        gradientType: SketchFormat.GradientType.Linear,
        elipseLength: 1,
        from: '',
        to: '',
        stops: [],
      };
      let fillType = SketchFormat.FillType.Color;
      // 纯色
      if (Array.isArray(s)) {
        toSketchColor(s, color);
      }
      // 渐变
      else {
        fillType = SketchFormat.FillType.Gradient;
        s = s as ComputedGradient;
        gradient.from = '{' + s.d[0] + ', ' + s.d[1] + '}';
        gradient.to = '{' + s.d[2] + ', ' + s.d[3] + '}';
        if (s.t === GRADIENT.RADIAL) {
          gradient.gradientType = SketchFormat.GradientType.Radial;
          gradient.elipseLength = s.d[4];
        }
        else if (s.t === GRADIENT.CONIC) {
          gradient.gradientType = SketchFormat.GradientType.Angular;
        }
        s.stops.forEach(item => {
          gradient.stops.push({
            _class: 'gradientStop',
            color: toSketchColor(item.color),
            position: item.offset || 0,
          });
        });
      }
      let position = SketchFormat.BorderPosition.Center;
      if (computedStyle.strokePosition[i] === STROKE_POSITION.INSIDE) {
        position = SketchFormat.BorderPosition.Inside;
      }
      else if (computedStyle.strokePosition[i] === STROKE_POSITION.OUTSIDE) {
        position = SketchFormat.BorderPosition.Outside;
      }
      return {
        _class: 'border',
        isEnabled: computedStyle.strokeEnable[i],
        color,
        fillType,
        position,
        thickness: computedStyle.strokeWidth[i],
        gradient,
        contextSettings: {
          _class: 'graphicsContextSettings',
          blendMode: SketchFormat.BlendMode.Normal,
          opacity: 1,
        },
      };
    });
    if (blur.t === BLUR.GAUSSIAN || blur.t === BLUR.MOTION || blur.t === BLUR.BACKGROUND || blur.t === BLUR.RADIAL) {
      let center: string;
      if (blur.center) {
        center = '{' + blur.center.join(', ') + '}';
      }
      else {
        center = '{0.5, 0.5}';
      }
      json.style!.blur = {
        _class: 'blur',
        isEnabled: true,
        center,
        motionAngle: d2r(blur.angle || 0),
        radius: blur.radius || 0,
        saturation: blur.saturation || 0,
        type: [
          SketchFormat.BlurType.Gaussian,
          SketchFormat.BlurType.Motion,
          SketchFormat.BlurType.Zoom,
          SketchFormat.BlurType.Background,
        ][blur.t - 1],
      };
    }
    return json;
  }

  clone(override?: Record<string, Override[]>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    props.sourceUuid = this.uuid;
    props.name = this.name;
    props.nameIsFixed = this.nameIsFixed;
    props.index = this.index;
    const res = new Node(props);
    res.style = clone(this.style);
    res.computedStyle = clone(this.computedStyle);
    if (override) {
    }
    return res;
  }

  addTile(tile: Tile) {
    if (this.tileList.indexOf(tile) === -1) {
      this.tileList.push(tile);
      tile.add(this);
    }
  }

  removeTile(tile: Tile) {
    const i = this.tileList.indexOf(tile);
    if (i > -1) {
      const t = this.tileList.splice(i, 1);
      t[0].remove(this);
    }
  }

  cleanTile() {
    const list = this.tileList.splice(0);
    list.forEach(item => {
      item.remove(this);
    });
    return list;
  }

  isParent(target: Node) {
    let p = this.parent;
    while (p) {
      if (p === target) {
        return true;
      }
      p = p.parent;
    }
    return false;
  }

  isChild(target: Node) {
    return target.isParent(this);
  }

  get opacity() {
    const root = this.root;
    if (!root) {
      return this._opacity;
    }
    // 循环代替递归，判断包含自己在内的这条分支上的父级是否有缓存，如果都有缓存，则无需计算
    /* eslint-disable */
    let node: Node = this,
      cache = this.hasCacheOp,
      parent = node.parent,
      index = -1;
    const pList: Container[] = [];
    while (parent) {
      pList.push(parent);
      // 父级变更过后id就会对不上，但首次初始化后是一致的，防止初始化后立刻调用所以要多判断下
      if (!parent.hasCacheOp || parent.localOpId !== node.parentOpId) {
        cache = false;
        index = pList.length; // 供后面splice裁剪用
      }
      node = parent;
      parent = parent.parent;
    }
    // 这里的cache是考虑了向上父级的，只要有失败的就进入，从这条分支上最上层无缓存的父级开始计算
    if (!cache) {
      // 父级有变化则所有向下都需更新，可能第一个是root（极少场景会修改root的opacity）
      if (index > -1) {
        pList.splice(index);
        pList.reverse();
        for (let i = 0, len = pList.length; i < len; i++) {
          const node = pList[i];
          if (node.hasCacheOp && node.localOpId !== node.parent?.parentOpId) {
            node.localOpId++;
          }
          node.hasCacheOp = true;
          if (node === root) {
            node._opacity = node.computedStyle.opacity;
          }
          else {
            node._opacity = node.parent!._opacity * node.computedStyle.opacity;
            node.parentOpId = node.parent!.localOpId;
          }
        }
      }
      // 自己没有变化但父级出现变化影响了这条链路，被动变更，这里父级id一定是不一致的，否则进不来
      if (this.hasCacheOp) {
        this.localOpId++;
      }
      this.hasCacheOp = true;
      // 仅自身变化，或者有父级变化但父级前面已经算好了，防止自己是Root
      parent = this.parent;
      if (parent) {
        this._opacity = parent._opacity * this.computedStyle.opacity;
        this.parentOpId = parent.localOpId;
      }
      else {
        this._opacity = this.computedStyle.opacity;
      }
    }
    return this._opacity;
  }

  // 可能在布局后异步渲染前被访问，此时没有这个数据，刷新后就有缓存，变更transform或者reflow无缓存
  get matrixWorld(): Float64Array {
    const root = this.root;
    let m = this._matrixWorld;
    if (!root) {
      return m;
    }
    // 循环代替递归，判断包含自己在内的这条分支上的父级是否有缓存，如果都有缓存，则无需计算
    /* eslint-disable */
    let node: Node = this,
      cache = this.hasCacheMw,
      parent = node.parent,
      index = -1;
    const pList: Container[] = [];
    while (parent) {
      pList.push(parent);
      // 父级变更过后id就会对不上，但首次初始化后是一致的，防止初始化后立刻调用所以要多判断下
      if (!parent.hasCacheMw || parent.localMwId !== node.parentMwId) {
        cache = false;
        index = pList.length; // 供后面splice裁剪用
      }
      node = parent;
      parent = parent.parent;
    }
    // 这里的cache是考虑了向上父级的，只要有失败的就进入，从这条分支上最上层无缓存的父级开始计算
    if (!cache) {
      // 父级有变化则所有向下都需更新，可能第一个是root（极少场景会修改root的matrix）
      if (index > -1) {
        pList.splice(index);
        pList.reverse();
        for (let i = 0, len = pList.length; i < len; i++) {
          const node = pList[i];
          /**
           * 被动变更判断，自己没有变更但父级发生了变更需要更新id，这里的情况比较多
           * 某个父节点可能没有变更，也可能发生变更，变更后如果进行了读取则不会被记录进来
           * 记录的顶层父节点比较特殊，会发生上述情况，中间父节点不会有变更后读取的情况
           * 因此只有没有变化且和父级id不一致时，其id自增标识，有变化已经主动更新过了
           */
          if (node.hasCacheMw && node.parentMwId !== node.parent?.localMwId) {
            node.localMwId++;
          }
          node.hasCacheMw = true;
          if (node === root) {
            assignMatrix(node._matrixWorld, node.matrix);
          }
          else {
            const t = multiply(node.parent!._matrixWorld, node.matrix);
            assignMatrix(node._matrixWorld, t);
            node.parentMwId = node.parent!.localMwId;
          }
        }
      }
      // 自己没有变化但父级出现变化影响了这条链路，被动变更，这里父级id一定是不一致的，否则进不来
      if (this.hasCacheMw) {
        this.localMwId++;
      }
      this.hasCacheMw = true;
      // 仅自身变化，或者有父级变化但父级前面已经算好了，防止自己是Root
      parent = this.parent;
      if (parent) {
        const t = multiply(parent._matrixWorld, this.matrix);
        assignMatrix(m, t);
        this.parentMwId = parent.localMwId; // 更新以便后续对比
      }
      else {
        assignMatrix(m, this.matrix);
      }
    }
    return m;
  }

  get rect() {
    let res = this._rect;
    if (!res) {
      res = this._rect = new Float64Array(4);
      res[0] = 0;
      res[1] = 0;
      res[2] = this.width;
      res[3] = this.height;
    }
    return res;
  }

  get bbox() {
    let res = this._bbox;
    if (!res) {
      const rect = this._rect || this.rect;
      res = this._bbox = rect.slice(0);
      const { strokeWidth, strokeEnable, strokePosition } = this.computedStyle;
      // 所有描边最大值，影响bbox
      let border = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          if (strokePosition[i] === STROKE_POSITION.INSIDE) {
            // 0
          }
          else if (strokePosition[i] === STROKE_POSITION.OUTSIDE) {
            border = Math.max(border, item);
          }
          else {
            // 默认中间
            border = Math.max(border, item * 0.5);
          }
        }
      });
      res[0] -= border;
      res[1] -= border;
      res[2] += border;
      res[3] += border;
    }
    return res;
  }

  get filterBbox() {
    let res = this._filterBbox;
    if (!res) {
      const bbox = this._bbox || this.bbox;
      res = this._filterBbox = bbox.slice(0);
      // shadow是个特殊存在，有多个，取最大值影响扩展
      const { shadow, shadowEnable, blur } = this.computedStyle;
      const sb = [0, 0, 0, 0];
      for (let i = 0, len = shadow.length; i < len; i++) {
        if (shadowEnable[i]) {
          const item = shadow[i];
          if (item.color[3] > 0) {
            // shadow的卷积核在sketch中需要乘以0.5
            const d = kernelSize(item.blur * 0.5);
            const spread = outerSizeByD(d);
            if (item.x || item.y || spread) {
              sb[0] = Math.min(sb[0], item.x - spread);
              sb[1] = Math.min(sb[1], item.y - spread);
              sb[2] = Math.max(sb[2], item.x + spread);
              sb[3] = Math.max(sb[3], item.y + spread);
            }
          }
        }
      }
      res[0] += sb[0];
      res[1] += sb[1];
      res[2] += sb[2];
      res[3] += sb[3];
      if (blur.t === BLUR.GAUSSIAN || blur.t === BLUR.MOTION || blur.t === BLUR.BACKGROUND || blur.t === BLUR.RADIAL) {
        const r = blur.radius!;
        if (r > 0) {
          const d = kernelSize(r);
          const spread = outerSizeByD(d);
          if (spread) {
            res[0] -= spread;
            res[1] -= spread;
            res[2] += spread;
            res[3] += spread;
          }
        }
      }
    }
    return res;
  }

  get bbox2() {
    let res = this._bbox2;
    if (!res) {
      res = (this._bbox || this.bbox).slice(0);
      res[0] = Math.floor(res[0]);
      res[1] = Math.floor(res[1]);
      res[2] = Math.ceil(res[2]);
      res[3] = Math.ceil(res[3]);
    }
    return res;
  }

  get filterBbox2() {
    let res = this._filterBbox2;
    if (!res) {
      res = (this._filterBbox || this.filterBbox).slice(0);
      res[0] = Math.floor(res[0]);
      res[1] = Math.floor(res[1]);
      res[2] = Math.ceil(res[2]);
      res[3] = Math.ceil(res[3]);
    }
    return res;
  }
}

export default Node;
