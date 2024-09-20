import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { frame, FrameCallback } from '../animation/frame';
import { JPage, RootProps } from '../format';
import ca from '../gl/ca';
import colorFrag from '../gl/mbm/color.frag';
import colorBurnFrag from '../gl/mbm/colorBurn.frag';
import colorDodgeFrag from '../gl/mbm/colorDodge.frag';
import darkenFrag from '../gl/mbm/darken.frag';
import differenceFrag from '../gl/mbm/difference.frag';
import exclusionFrag from '../gl/mbm/exclusion.frag';
import hardLightFrag from '../gl/mbm/hardLight.frag';
import hueFrag from '../gl/mbm/hue.frag';
import lightenFrag from '../gl/mbm/lighten.frag';
import luminosityFrag from '../gl/mbm/luminosity.frag';
import multiplyFrag from '../gl/mbm/multiply.frag';
import overlayFrag from '../gl/mbm/overlay.frag';
import saturationFrag from '../gl/mbm/saturation.frag';
import screenFrag from '../gl/mbm/screen.frag';
import softLightFrag from '../gl/mbm/softLight.frag';
import bgColorVert from '../gl/bgColor.vert';
import bgColorFrag from '../gl/bgColor.frag';
import bgShadowVert from '../gl/bgShadow.vert';
import bgShadowFrag from '../gl/bgShadow.frag';
import clipFrag from '../gl/clip.frag';
import cmFrag from '../gl/cm.frag';
import dropShadowFrag from '../gl/dropShadow.frag';
import innerShadowFrag from '../gl/innerShadow.frag';
import mainVert from '../gl/main.vert';
import mainFrag from '../gl/main.frag';
import maskFrag from '../gl/mask.frag';
import boxFrag from '../gl/box.frag';
// import dualVert from '../gl/dual.vert';
// import dualFrag from '../gl/dual.frag';
import motionFrag from '../gl/motion.frag';
import radialFrag from '../gl/radial.frag';
import simpleVert from '../gl/simple.vert';
import simpleFrag from '../gl/simple.frag';
import tintFrag from '../gl/tint.frag';
import tileVert from '../gl/tile.vert';
import tileFrag from '../gl/tile.frag';
import { initShaders } from '../gl/webgl';
import config from '../util/config';
import Tile from '../refresh/Tile';
import TileManager from '../refresh/TileManager';
import { getLevel, isReflow, RefreshLevel } from '../refresh/level';
import { renderWebgl, Struct } from '../refresh/struct';
import Event from '../util/Event';
import ArtBoard from './ArtBoard';
import Container from './Container';
import Node from './Node';
import Overlay from './overlay/Overlay';
import Page from './Page';
import { checkReflow } from './reflow';
import SymbolMaster from './SymbolMaster';
import Bitmap from './Bitmap';
import Group from './Group';
import { StyleUnit } from '../style/define';
import inject from '../util/inject';

class Root extends Container implements FrameCallback {
  canvas?: HTMLCanvasElement;
  ctx: WebGL2RenderingContext | WebGLRenderingContext | undefined;
  dpi: number;
  isWebgl2?: boolean;
  programs: Record<string, WebGLProgram>;
  refs: Record<string, Node>;
  symbolMasters: Record<string, SymbolMaster>;
  lastPage?: Page; // 上一个显示的Page对象
  pageContainer: Container; // 存Page显示对象列表的容器
  overlay: Overlay; // 不跟随Page缩放的选框标尺等容器
  structs: Struct[]; // 队列代替递归Tree的数据结构
  isAsyncDraw: boolean; // 异步下帧刷新标识，多次刷新任务去重
  ani = []; // 动画任务，空占位
  aniChange = false;
  task: Array<((sync: boolean) => void) | undefined>; // 刷新任务回调
  taskClone: Array<((sync: boolean) => void) | undefined>; // 一帧内刷新任务clone，可能任务回调中会再次调用新的刷新，新的应该再下帧不能混在本帧
  rl: RefreshLevel; // 一帧内画布最大刷新等级记录
  pageTexture?: WebGLTexture; // 整体渲染结果先绘制到一个离屏中，每次刷新复用清空
  imgLoadingCount: number; // 刷新过程统计图片有没有加载完
  imgLoadList: Bitmap[]; // 每次刷新过程中产生的图片需要加载，但不能中途加载触发update影响bbox计算，收集在刷新完后统一调用
  firstDraw: boolean;
  tileManager?: TileManager;
  tileRecord: Record<string, Node>; // 节点更新影响老的tile清除记录，每次渲染时计算影响哪些tile
  tileLastIndex: number; // 上次tile绘制到哪个节点，再一帧内没绘完下次再续时节省遍历性能
  tileRemain: boolean; // tile模式是否有因跨帧导致的没绘制完的
  breakMerge: boolean; // 因跨帧渲染导致的没有渲染完成的标识
  scale: number; // 当前渲染的scale，2的幂次方，render时计算并赋值
  scaleIndex: number;

  constructor(props: RootProps, children: Node[] = []) {
    super(props, children);
    // 初始化的数据
    this.dpi = props.dpi;
    this.root = this;
    this.programs = {};
    this.refs = {};
    this.symbolMasters = {};
    this.structs = [];
    this.isAsyncDraw = false;
    this.task = [];
    this.taskClone = [];
    this.rl = RefreshLevel.REBUILD;
    this.imgLoadingCount = 0;
    this.imgLoadList = [];
    this.firstDraw = true;
    this.tileRecord = {};
    this.tileLastIndex = 0;
    this.tileRemain = false;
    this.breakMerge = false;
    this.scale = 1;
    this.scaleIndex = 0;
    // 存所有Page
    this.pageContainer = new Container(
      {
        name: 'pageContainer',
        uuid: 'pageContainer',
        index: 0,
        style: {
          width: '100%',
          height: '100%',
          pointerEvents: false,
          scaleX: this.dpi, // 高清canvas被css缩放了，内部需反向扩大，不能省略，因为overlay上也要高清
          scaleY: this.dpi,
          transformOrigin: [0, 0],
        },
      },
      [],
    );
    // 存上层的展示工具标尺等
    this.overlay = new Overlay(
      {
        name: 'overlay',
        uuid: 'overlay',
        index: 1,
        style: {
          width: '100%',
          height: '100%',
          pointerEvents: false,
        },
      },
      [],
    );
    // 先添加上，还没附加到显示的canvas/gl上，不会执行willMount
    this.appendChild(this.pageContainer);
    this.appendChild(this.overlay);
  }

  appendTo(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const attributes = Object.assign(ca, (this.props as RootProps).contextAttributes);
    // gl的初始化和配置
    let gl: WebGL2RenderingContext | WebGLRenderingContext = canvas.getContext('webgl2', attributes) as WebGL2RenderingContext;
    if (gl) {
      this.isWebgl2 = true;
    }
    else {
      gl = canvas.getContext('webgl', attributes) as WebGLRenderingContext;
      this.isWebgl2 = false;
    }
    if (!gl) {
      throw new Error('Webgl unsupported!');
    }
    this.appendToGl(gl);
  }

  appendToGl(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    // 不能重复
    if (this.ctx) {
      inject.error('Duplicate appendToGl');
      return;
    }
    this.ctx = gl;
    config.init(
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      gl.getParameter(gl.MAX_VARYING_VECTORS),
    );
    this.initShaders(gl);
    this.tileManager = new TileManager(gl);
    // 渲染前设置必要的父子兄弟关系和结构
    this.willMount();
    this.structs = this.structure(0);
    // 刷新动画侦听，目前就一个Root
    frame.addRoot(this);
    this.reLayout();
    this.didMount();
    // 先设置的page和index，再附加到canvas上，需刷新
    if (this.lastPage) {
      this.addUpdate(this, [], RefreshLevel.REFLOW);
    }
  }

  private initShaders(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    const program = (this.programs.program = initShaders(gl, mainVert, mainFrag));
    this.programs.bgColorProgram = initShaders(gl, bgColorVert, bgColorFrag);
    this.programs.bgShadowProgram = initShaders(gl, bgShadowVert, bgShadowFrag);
    this.programs.simpleProgram = initShaders(gl, simpleVert, simpleFrag);
    this.programs.maskProgram = initShaders(gl, simpleVert, maskFrag);
    this.programs.clipProgram = initShaders(gl, simpleVert, clipFrag);
    this.programs.multiplyProgram = initShaders(gl, simpleVert, multiplyFrag);
    this.programs.screenProgram = initShaders(gl, simpleVert, screenFrag);
    this.programs.overlayProgram = initShaders(gl, simpleVert, overlayFrag);
    this.programs.darkenProgram = initShaders(gl, simpleVert, darkenFrag);
    this.programs.lightenProgram = initShaders(gl, simpleVert, lightenFrag);
    this.programs.colorDodgeProgram = initShaders(gl, simpleVert, colorDodgeFrag);
    this.programs.colorBurnProgram = initShaders(gl, simpleVert, colorBurnFrag);
    this.programs.hardLightProgram = initShaders(gl, simpleVert, hardLightFrag);
    this.programs.softLightProgram = initShaders(gl, simpleVert, softLightFrag);
    this.programs.differenceProgram = initShaders(gl, simpleVert, differenceFrag);
    this.programs.exclusionProgram = initShaders(gl, simpleVert, exclusionFrag);
    this.programs.hueProgram = initShaders(gl, simpleVert, hueFrag);
    this.programs.saturationProgram = initShaders(gl, simpleVert, saturationFrag);
    this.programs.colorProgram = initShaders(gl, simpleVert, colorFrag);
    this.programs.luminosityProgram = initShaders(gl, simpleVert, luminosityFrag);
    this.programs.dropShadowProgram = initShaders(gl, simpleVert, dropShadowFrag);
    this.programs.innerShadowProgram = initShaders(gl, simpleVert, innerShadowFrag);
    this.programs.tintProgram = initShaders(gl, simpleVert, tintFrag);
    this.programs.cmProgram = initShaders(gl, simpleVert, cmFrag);
    this.programs.boxProgram = initShaders(gl, simpleVert, boxFrag);
    // this.programs.dualProgram = initShaders(gl, dualVert, dualFrag);
    this.programs.motionProgram = initShaders(gl, simpleVert, motionFrag);
    this.programs.radialProgram = initShaders(gl, simpleVert, radialFrag);
    this.programs.tileProgram = initShaders(gl, tileVert, tileFrag);
    gl.useProgram(program);
  }

  private checkRoot() {
    const { width, height } = this.style;
    const canvas = this.canvas;
    if (width.u === StyleUnit.AUTO) {
      if (canvas) {
        width.u = StyleUnit.PX;
        this.width = this.computedStyle.width = width.v = Math.max(1, canvas.width);
      }
    }
    else {
      this.width = this.computedStyle.width = Math.max(1, this.style.width.v as number);
    }
    if (height.u === StyleUnit.AUTO) {
      if (canvas) {
        height.u = StyleUnit.PX;
        this.height = this.computedStyle.height = height.v = Math.max(1, canvas.height);
      }
    }
    else {
      this.height = this.computedStyle.height = Math.max(1, this.style.height.v as number);
    }
    // 一般情况肯定有，但新建的未添加canvas直接调用toSketchJson会没有
    this.ctx?.viewport(0, 0, this.width, this.height);
  }

  setJPages(jPages: JPage[]) {
    jPages.forEach((item) => {
      const page = new Page(item.props, []);
      page.json = item;
      this.pageContainer.appendChild(page);
    });
  }

  getPageIndex() {
    const children = this.pageContainer.children;
    for (let i = 0, len = children.length; i < len; i++) {
      if (this.lastPage === children[i]) {
        return i;
      }
    }
    return -1;
  }

  setPageIndex(index: number) {
    if (index < 0 || index >= this.pageContainer.children.length) {
      return;
    }
    if (this.lastPage) {
      if (this.lastPage === this.pageContainer.children[index]) {
        return;
      }
      this.lastPage.updateStyle({
        visible: false,
      });
    }
    // 先置空，否则新页初始化添加DOM会触发事件到老页上
    this.lastPage = undefined;
    let newPage = this.pageContainer.children[index] as Page;
    // 延迟初始化，第一次需要显示时才从json初始化Page对象
    newPage.initIfNot();
    newPage.updateStyle({
      visible: true,
    });
    this.lastPage = newPage;
    const children: ArtBoard[] = [];
    newPage.children.forEach((item) => {
      if (item instanceof ArtBoard) {
        children.push(item);
      }
    });
    this.overlay.setArtBoard(children);
    return newPage;
  }

  // addNewPage(page?: Page, setCurrent = false) {
  //   const pageContainer = this.pageContainer;
  //   if (!page) {
  //     page = new Page(
  //       {
  //         uuid: uuid.v4(),
  //         name: '页面 ' + (pageContainer.children.length + 1),
  //         index: 1,
  //         style: {
  //           width: 100,
  //           height: 100,
  //           visible: false,
  //           transformOrigin: [0, 0],
  //           pointerEvents: false,
  //         },
  //         rule: {
  //           baseX: 0,
  //           baseY: 0,
  //         },
  //         isLocked: false,
  //         isExpanded: false,
  //       },
  //       [],
  //     );
  //   }
  //   pageContainer.appendChild(page);
  //   if (setCurrent) {
  //     this.setCurPage(page);
  //   }
  //   return page;
  // }

  /**
   * 添加更新，分析repaint/reflow和上下影响，异步刷新
   * sync是动画在gotoAndStop的时候，下一帧刷新由于一帧内同步执行计算标识true
   */
  addUpdate(
    node: Node,
    keys: string[],
    focus: RefreshLevel = RefreshLevel.NONE,
    addDom: boolean = false,
    removeDom: boolean = false,
    cb?: (sync: boolean) => void,
  ) {
    if (this.isDestroyed) {
      return RefreshLevel.NONE;
    }
    // root的resize需要清空整体的离屏绘制纹理
    if (node === this && this.pageTexture && (keys.indexOf('width') > -1 || keys.indexOf('height') > -1)) {
      this.ctx!.deleteTexture(this.pageTexture);
      this.pageTexture = undefined;
    }
    let lv = focus;
    if (keys && keys.length) {
      for (let i = 0, len = keys.length; i < len; i++) {
        const k = keys[i];
        lv |= getLevel(k);
      }
    }
    if (removeDom) {
      if (node instanceof Page) {
        this.emit(Event.WILL_REMOVE_PAGE, node);
      }
      else {
        this.emit(Event.WILL_REMOVE_DOM, node);
        // 移除的同时重置关联tile
        const list = node.cleanTile();
        Tile.clean(list);
      }
    }
    if (addDom || removeDom) {
      lv |= RefreshLevel.REFLOW | RefreshLevel.REBUILD;
    }
    const res = this.calUpdate(node, lv, addDom, removeDom);
    // 有tile时重置关联的tile，为了清空上一次绘制的tile的内容让其重绘
    if (lv && config.tile && !this.firstDraw && node.page && !node.isPage) {
      let p = node;
      while (p && p.page && !p.isPage) {
        const list = p.cleanTile();
        Tile.clean(list);
        p = p.parent!;
      }
      // 移动元素或者添加时，需要清空新的位置所占的tile区域，记录下来在渲染最初做
      if (lv & RefreshLevel.TRANSLATE) {
        this.tileRecord[node.props.uuid] = node;
      }
    }
    if (res) {
      this.asyncDraw(cb);
    }
    else {
      cb && cb(true);
      if (!this.imgLoadingCount && !this.breakMerge && !this.tileRemain) {
        this.emit(Event.REFRESH_COMPLETE, RefreshLevel.NONE);
      }
    }
    // 切页过程中page不存在不触发，防止新老错乱，还要防止overlay中的图层
    if (this.lastPage && node.page) {
      if (addDom) {
        if (node instanceof Page) {
          this.emit(Event.DID_ADD_PAGE, node);
        }
        else {
          this.emit(Event.DID_ADD_DOM, node);
        }
      }
      else if (!removeDom && keys.length) {
        this.emit(Event.STYLE_CHANGED, node, keys);
      }
    }
    return lv;
  }

  private calUpdate(
    node: Node,
    lv: RefreshLevel,
    addDom: boolean,
    removeDom: boolean,
  ): boolean {
    if (lv === RefreshLevel.NONE || this.isDestroyed) {
      return false;
    }
    // reflow/repaint/<repaint分级
    const isRf = isReflow(lv);
    if (isRf) {
      // 除了特殊如窗口缩放变更canvas画布会影响根节点，其它都只会是变更节点自己
      if (node === this) {
        this.reLayout();
      }
      else {
        checkReflow(node, addDom, removeDom);
      }
    }
    else {
      const isRp = lv >= RefreshLevel.REPAINT;
      if (isRp) {
        node.calRepaintStyle(lv);
      }
      else {
        const { style, computedStyle } = node;
        if (lv & RefreshLevel.TRANSFORM_ALL) {
          node.calMatrix(lv);
        }
        if (lv & RefreshLevel.OPACITY) {
          node.calOpacity();
        }
        if (lv & RefreshLevel.FILTER) {
          node.calFilter(lv);
        }
        if (lv & RefreshLevel.MIX_BLEND_MODE) {
          computedStyle.mixBlendMode = style.mixBlendMode.v;
        }
        let cleared = false;
        if (lv & RefreshLevel.MASK) {
          computedStyle.maskMode = style.maskMode.v;
          node.clearMask();
          cleared = true;
          const p = node.parent;
          if (p && p.isGroup && p instanceof Group) {
            p.adjustPosAndSize();
          }
          node.calMask();
        }
        if (lv & RefreshLevel.BREAK_MASK) {
          computedStyle.breakMask = style.breakMask.v;
        }
        // mask的任何变更都要清空重绘，必须CACHE以上，CACHE是跨帧渲染用级别
        if (computedStyle.maskMode && !cleared) {
          node.clearMask();
        }
      }
      node.clearCacheUpward(false);
    }
    // 检查mask影响，这里是作为被遮罩对象存在的关系检查，不会有连续，mask不能同时被mask
    let mask = node.mask;
    if (mask) {
      const p = node.parent;
      if (p && p.isGroup && p instanceof Group) {
        p.adjustPosAndSize();
      }
      mask.clearMask();
    }
    // 记录节点的刷新等级，以及本帧最大刷新等级
    node.refreshLevel |= lv;
    this.rl |= lv;
    // 父级不可见无需刷新
    let parent = node.parent;
    while (parent) {
      if (!parent.computedStyle.visible) {
        return false;
      }
      parent = parent.parent;
    }
    return true;
  }

  asyncDraw(cb?: (sync: boolean) => void) {
    if (!this.isAsyncDraw) {
      frame.onFrame(this);
      this.isAsyncDraw = true;
    }
    this.task.push(cb);
  }

  cancelAsyncDraw(cb: (sync: boolean) => void) {
    if (!cb) {
      return;
    }
    const task = this.task;
    const i = task.indexOf(cb);
    if (i > -1) {
      task.splice(i, 1);
      if (!task.length) {
        frame.offFrame(this);
        this.isAsyncDraw = false;
      }
    }
  }

  draw() {
    if (this.isDestroyed) {
      return;
    }
    this.tileRemain = false;
    this.breakMerge = false;
    const rl = this.rl;
    if (rl > RefreshLevel.NONE) {
      // 仅在一帧内没绘完的情况续上次，否则还是从头重绘
      if (rl > RefreshLevel.CACHE) {
        this.tileLastIndex = 0;
      }
      this.clear();
      this.rl = RefreshLevel.NONE;
      renderWebgl(this.ctx!, this);
      this.emit(Event.REFRESH, rl);
      this.firstDraw = false;
    }
    if (!this.imgLoadingCount && !this.breakMerge && !this.tileRemain) {
      this.emit(Event.REFRESH_COMPLETE, rl);
    }
  }

  reLayout() {
    this.checkRoot(); // 根节点必须保持和canvas同尺寸
    this.layout({
      w: this.width,
      h: this.height,
    });
  }

  clear() {
    const gl = this.ctx;
    if (gl) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }

  override destroy() {
    super.destroy();
    frame.removeRoot(this);
    this.task.splice(0);
    this.taskClone.splice(0);
    const { ctx: gl, programs } = this;
    if (gl) {
      gl.deleteProgram(programs.program);
      gl.deleteProgram(programs.bgColorProgram);
      gl.deleteProgram(programs.bgShadowProgram);
      gl.deleteProgram(programs.simpleProgram);
      gl.deleteProgram(programs.maskProgram);
      gl.deleteProgram(programs.clipProgram);
      gl.deleteProgram(programs.multiplyProgram);
      gl.deleteProgram(programs.screenProgram);
      gl.deleteProgram(programs.overlayProgram);
      gl.deleteProgram(programs.darkenProgram);
      gl.deleteProgram(programs.lightenProgram);
      gl.deleteProgram(programs.colorDodgeProgram);
      gl.deleteProgram(programs.colorBurnProgram);
      gl.deleteProgram(programs.hardLightProgram);
      gl.deleteProgram(programs.softLightProgram);
      gl.deleteProgram(programs.differenceProgram);
      gl.deleteProgram(programs.exclusionProgram);
      gl.deleteProgram(programs.hueProgram);
      gl.deleteProgram(programs.saturationProgram);
      gl.deleteProgram(programs.colorProgram);
      gl.deleteProgram(programs.luminosityProgram);
      gl.deleteProgram(programs.dropShadowProgram);
      gl.deleteProgram(programs.innerShadowProgram);
      gl.deleteProgram(programs.gaussBlurProgram);
      gl.deleteProgram(programs.tintProgram);
      gl.deleteProgram(programs.cmProgram);
      gl.deleteProgram(programs.boxProgram);
      // gl.deleteProgram(programs.dualProgram);
      gl.deleteProgram(programs.motionProgram);
      gl.deleteProgram(programs.radialProgram);
      gl.deleteProgram(programs.tileProgram);
      for (let k in gl) {
        if (k.indexOf('programGauss,') === 0) {
          const p = programs[k];
          gl.deleteProgram(p);
        }
      }
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }

  /**
   * 每帧调用Root的before回调，先将存储的动画before执行，触发数据先变更完，然后若有变化或主动更新则刷新
   */
  before() {
    const ani = this.ani,
      task = (this.taskClone = this.task.splice(0));
    let len = ani.length,
      len2 = task.length;
    // 先重置标识，动画没有触发更新，在每个before执行，如果调用了更新则更改标识
    this.aniChange = false;
    for (let i = 0; i < len; i++) {
      // 没动画现在
    }
    if (this.aniChange || len2) {
      this.draw();
    }
  }

  /**
   * 每帧调用的Root的after回调，将所有动画的after执行，以及主动更新的回调执行
   * 当都清空的时候，取消raf对本Root的侦听
   */
  after() {
    const ani = this.ani,
      task = this.taskClone.splice(0);
    let len = ani.length,
      len2 = task.length;
    for (let i = 0; i < len; i++) {
      // 没动画现在
    }
    for (let i = 0; i < len2; i++) {
      let item = task[i];
      item && item(false);
    }
    len = ani.length; // 动画和渲染任务可能会改变自己的任务队列
    len2 = this.task.length;
    if (!len && !len2) {
      frame.offFrame(this);
      this.isAsyncDraw = false;
    }
  }

  getPages() {
    return this.pageContainer.children as Page[];
  }

  getCurPage() {
    return this.lastPage;
  }

  setCurPage(page: Page) {
    const i = this.pageContainer.children.indexOf(page);
    this.setPageIndex(i);
  }

  getCurPageStructs() {
    const { structs, lastPage } = this;
    if (lastPage) {
      const struct = lastPage.struct;
      const i = structs.indexOf(struct);
      if (i === -1) {
        throw new Error('Unknown index error');
      }
      return structs.slice(i, i + struct.total + 1);
    }
  }

  getCurPageZoom(excludeDpi = false) {
    if (this.lastPage) {
      return this.lastPage.getZoom(excludeDpi);
    }
    return this.dpi;
  }

  zoomTo(scale: number, cx?: number, cy?: number) {
    this.lastPage?.zoomTo(scale, cx, cy);
  }

  zoomFit() {
    this.lastPage?.zoomFit();
  }

  async toSketchFile(filter?: (node: Node) => boolean): Promise<JSZip> {
    if (this.isDestroyed) {
      // 离屏情况特殊处理
      this.willMount();
      this.reLayout();
      this.didMount();
    }
    const zip = new JSZip();
    const pagesZip = zip.folder('pages');
    const imagesZip = zip.folder('images');
    const props = this.props as RootProps;
    const pagesAndArtboards: {
      [key: string]: {
        name: string;
        artboards: {
          [key: string]: {
            name: string;
          };
        };
      };
    } = {};
    const pages: SketchFormat.FileRef[] = [];
    const user: SketchFormat.User = {
      document: {
        pageListHeight: 100,
        pageListCollapsed: 0,
      },
    };
    this.pageContainer.children.forEach(item => {
      const page = item as Page;
      const uuid = page.props.uuid;
      pages.push({
        _class: 'MSJSONFileReference',
        _ref_class: 'MSImmutablePage',
        _ref: 'pages/' + uuid,
      });
      user[uuid] = {
        scrollOrigin: '{' + page.computedStyle.translateX + ', ' + page.computedStyle.translateY + '}',
        zoomValue: page.getZoom(true),
      };
      pagesAndArtboards[uuid] = {
        name: page.props.name || '',
        artboards: {},
      };
      page.children.forEach((item2) => {
        if (item2 instanceof ArtBoard) {
          const uuid2 = item2.props.uuid;
          pagesAndArtboards[uuid].artboards[uuid2] = {
            name: item2.props.name || '',
          };
        }
      });
    });
    if (pagesZip && imagesZip) {
      const list = await Promise.all(this.pageContainer.children.map(item => {
        return item.toSketchJson(zip, filter);
      }));
      list.forEach(item => {
        pagesZip.file(item.do_objectID + '.json', JSON.stringify(item));
      });
    }
    const meta: SketchFormat.Meta = {
      commit: '',
      pagesAndArtboards,
      version: 146,
      compatibilityVersion: 99,
      app: SketchFormat.BundleId.PublicRelease,
      autosaved: 0,
      variant: 'NONAPPSTORE',
      created: {
        commit: '',
        appVersion: '99.1',
        build: 0,
        app: SketchFormat.BundleId.PublicRelease,
        coeditCompatibilityVersion: 145,
        compatibilityVersion: 99,
        version: 146,
        variant: 'NONAPPSTORE',
      },
      saveHistory: [],
      appVersion: '99.1',
      build: 0,
    };
    const document: SketchFormat.Document = {
      _class: 'document',
      do_objectID: props.uuid || uuid.v4(),
      assets: {
        _class: 'assetCollection',
        do_objectID: props.assets.uuid || uuid.v4(),
        colorAssets: [],
        gradientAssets: [],
        images: [],
        colors: [],
        gradients: [],
        exportPresets: [],
      },
      colorSpace: SketchFormat.ColorSpace.Unmanaged,
      currentPageIndex: this.getPageIndex(),
      foreignLayerStyles: [],
      foreignSymbols: [],
      foreignTextStyles: [],
      foreignSwatches: [],
      layerStyles: {
        _class: 'sharedStyleContainer',
        do_objectID: props.layerStyles.uuid || uuid.v4(),
        objects: [],
      },
      layerTextStyles: {
        _class: 'sharedTextStyleContainer',
        do_objectID: props.layerTextStyles.uuid || uuid.v4(),
        objects: [],
      },
      perDocumentLibraries: [],
      pages,
    };
    zip.file('meta.json', JSON.stringify(meta));
    zip.file('user.json', JSON.stringify(user));
    zip.file('document.json', JSON.stringify(document));
    return zip;
  }
}

export default Root;
