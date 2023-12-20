import * as uuid from 'uuid';
import { frame, FrameCallback } from '../animation/frame';
import { JPage, Props } from '../format';
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
import cmFrag from '../gl/cm.frag';
import dropShadowFrag from '../gl/dropShadow.frag';
import innerShadowFrag from '../gl/innerShadow.frag';
import mainVert from '../gl/main.vert';
import mainFrag from '../gl/main.frag';
import maskFrag from '../gl/mask.frag';
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

type RootProps = Props & {
  dpi: number;
};

class Root extends Container implements FrameCallback {
  canvas?: HTMLCanvasElement;
  ctx: WebGL2RenderingContext | WebGLRenderingContext | undefined;
  dpi: number;
  isWebgl2?: boolean;
  programs: any;
  refs: Record<string, Node>;
  symbolMasters: Record<string, SymbolMaster>;
  lastPage: Page | undefined; // 上一个显示的Page对象
  pageContainer: Container; // 存Page显示对象列表的容器
  overlay: Overlay; // 不跟随Page缩放的选框标尺等容器
  structs: Struct[]; // 队列代替递归Tree的数据结构
  isAsyncDraw: boolean; // 异步下帧刷新标识，多次刷新任务去重
  ani = []; // 动画任务，空占位
  aniChange = false;
  task: Array<((sync: boolean) => void) | undefined>; // 刷新任务回调
  taskClone: Array<((sync: boolean) => void) | undefined>; // 一帧内刷新任务clone，可能任务回调中会再次调用新的刷新，新的应该再下帧不能混在本帧
  rl: RefreshLevel; // 一帧内画布最大刷新等级记录
  pageTexture: WebGLTexture | undefined; // 整体渲染结果先绘制到一个离屏中，每次刷新复用清空
  imgLoadingCount: number; // 刷新过程统计图片有没有加载完
  imgLoadList: Bitmap[]; // 每次刷新过程中产生的图片需要加载，但不能中途加载触发update影响bbox计算，收集在刷新完后统一调用
  firstDraw: boolean;
  tileManager?: TileManager;
  tileRecord: Node[]; // 节点更新影响老的tile清除记录，每次渲染时计算影响哪些tile
  tileLastIndex: number; // 上次tile绘制到哪个节点，再一帧内没绘完下次再续时节省遍历性能
  tileRemain: boolean; // tile模式是否有因跨帧导致的没绘制完的
  breakMerge: boolean; // 因跨帧渲染导致的没有渲染完成的标识

  constructor(props: RootProps, children: Node[] = []) {
    super(props, children);
    // 初始化的数据
    this.dpi = props.dpi;
    this.root = this;
    this.refs = {};
    this.symbolMasters = {};
    this.structs = this.structure(0);
    this.isAsyncDraw = false;
    this.task = [];
    this.taskClone = [];
    this.rl = RefreshLevel.REBUILD;
    this.imgLoadingCount = 0;
    this.imgLoadList = [];
    this.firstDraw = true;
    this.tileRecord = [];
    this.tileLastIndex = 0;
    this.tileRemain = false;
    this.breakMerge = false;
    // 存所有Page
    this.pageContainer = new Container(
      {
        name: 'pageContainer',
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
        style: {
          width: '100%',
          height: '100%',
          pointerEvents: false,
        },
      },
      [],
    );
  }

  appendTo(canvas: HTMLCanvasElement) {
    this.isDestroyed = false;
    this.canvas = canvas;
    // gl的初始化和配置
    if (!this.ctx) {
      let gl: WebGL2RenderingContext | WebGLRenderingContext = canvas.getContext(
        'webgl2',
        ca,
      ) as WebGL2RenderingContext;
      if (gl) {
        this.ctx = gl;
        this.isWebgl2 = true;
      }
      else {
        this.ctx = gl = canvas.getContext('webgl', ca) as WebGLRenderingContext;
        this.isWebgl2 = false;
      }
      if (!gl) {
        throw new Error('Webgl unsupported!');
      }
      config.init(
        gl.getParameter(gl.MAX_TEXTURE_SIZE),
        gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        gl.getParameter(gl.MAX_VARYING_VECTORS),
      );
      this.programs = {};
      this.initShaders(gl);
      this.tileManager = new TileManager(gl);
    }
    this.didMount();
    // 刷新动画侦听，目前就一个Root
    frame.addRoot(this);
    this.reLayout();
    this.didMountBubble();
    this.appendChild(this.pageContainer);
    this.appendChild(this.overlay);
  }

  private initShaders(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    const program = (this.programs.program = initShaders(
      gl,
      mainVert,
      mainFrag,
    ));
    this.programs.bgColorProgram = initShaders(gl, bgColorVert, bgColorFrag);
    this.programs.bgShadowProgram = initShaders(gl, bgShadowVert, bgShadowFrag);
    this.programs.simpleProgram = initShaders(gl, simpleVert, simpleFrag);
    this.programs.maskProgram = initShaders(gl, simpleVert, maskFrag);
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
    this.programs.dropShadowProgram = initShaders(
      gl,
      simpleVert,
      dropShadowFrag,
    );
    this.programs.innerShadowProgram = initShaders(
      gl,
      simpleVert,
      innerShadowFrag,
    );
    this.programs.tintProgram = initShaders(gl, simpleVert, tintFrag);
    this.programs.cmProgram = initShaders(gl, simpleVert, cmFrag);
    this.programs.motionProgram = initShaders(gl, simpleVert, motionFrag);
    this.programs.radialProgram = initShaders(gl, simpleVert, radialFrag);
    this.programs.tileProgram = initShaders(gl, tileVert, tileFrag);
    gl.useProgram(program);
  }

  private checkRoot() {
    this.width = this.computedStyle.width = this.style.width.v as number;
    this.height = this.computedStyle.height = this.style.height.v as number;
    this.ctx!.viewport(0, 0, this.width, this.height);
  }

  setJPages(jPages: JPage[]) {
    jPages.forEach((item) => {
      const page = new Page(item.props, []);
      page.json = item;
      this.pageContainer.appendChild(page);
    });
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
    // 触发事件告知外部如刷新图层列表
    this.emit(Event.PAGE_CHANGED, newPage);
  }

  addNewPage(page?: Page, setCurrent = false) {
    const pageContainer = this.pageContainer;
    if (!page) {
      page = new Page(
        {
          uuid: uuid.v4(),
          name: '页面 ' + (pageContainer.children.length + 1),
          style: {
            width: 100,
            height: 100,
            visible: false,
            transformOrigin: [0, 0],
            pointerEvents: false,
          },
          rule: {
            baseX: 0,
            baseY: 0,
          },
          isLocked: false,
          isExpanded: false,
        },
        [],
      );
    }
    pageContainer.appendChild(page);
    if (setCurrent) {
      this.setCurPage(page);
    }
    return page;
  }

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
      return;
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
      } else {
        this.emit(Event.WILL_REMOVE_DOM, node);
        // 移除的同时重置关联tile
        const list = node.cleanTile();
        Tile.clean(list);
      }
    }
    const res = this.calUpdate(node, lv, keys, addDom, removeDom);
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
        this.tileRecord[node.uuid] = node;
      }
    }
    if (res) {
      this.asyncDraw(cb);
    } else {
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
        } else {
          this.emit(Event.DID_ADD_DOM, node);
        }
      } else if (!removeDom && keys.length) {
        this.emit(Event.STYLE_CHANGED, node, keys);
      }
    }
  }

  private calUpdate(
    node: Node,
    lv: RefreshLevel,
    keys: string[],
    addDom: boolean,
    removeDom: boolean,
  ): boolean {
    // 防御一下
    if (addDom || removeDom) {
      lv |= RefreshLevel.REFLOW;
    }
    if (lv === RefreshLevel.NONE || this.isDestroyed) {
      return false;
    }
    // reflow/repaint/<repaint分级
    const isRf = isReflow(lv);
    if (isRf) {
      // 除了特殊如窗口缩放变更canvas画布会影响根节点，其它都只会是变更节点自己
      if (node === this) {
        this.reLayout();
      } else {
        checkReflow(node, addDom, removeDom);
      }
    } else {
      const isRp = lv >= RefreshLevel.REPAINT;
      if (isRp) {
        node.calRepaintStyle(lv);
      } else {
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
        if (lv & RefreshLevel.MASK) {
          computedStyle.maskMode = style.maskMode.v;
          node.clearMask();
        }
        if (lv & RefreshLevel.BREAK_MASK) {
          computedStyle.breakMask = style.breakMask.v;
        }
        // mask的任何变更都要清空重绘
        if (computedStyle.maskMode && !(lv & RefreshLevel.MASK)) {
          node.clearMask();
        }
      }
      node.clearCacheUpward(false);
    }
    // 检查mask影响，这里是作为被遮罩对象存在的关系检查，可能会有连续
    let mask = node.mask;
    while (mask) {
      mask.clearMask();
      mask = mask.mask;
    }
    // 记录节点的刷新等级，以及本帧最大刷新等级
    node.refreshLevel |= lv;
    this.rl |= lv;
    if (addDom || removeDom) {
      this.rl |= RefreshLevel.REBUILD;
    }
    // 自己不可见且没改变visible无需刷新
    const visible = node.computedStyle.visible;
    if (!visible && keys.indexOf('visible') < 0) {
      return false;
    }
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
      x: 0,
      y: 0,
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
      [
        'program',
        'bgColorProgram',
        'bgShadowProgram',
        'simpleProgram',
        'maskProgram',
        'multiplyProgram',
        'screenProgram',
        'overlayProgram',
        'darkenProgram',
        'lightenProgram',
        'colorDodgeProgram',
        'colorBurnProgram',
        'hardLightProgram',
        'softLightProgram',
        'differenceProgram',
        'exclusionProgram',
        'hueProgram',
        'saturationProgram',
        'colorProgram',
        'luminosityProgram',
        'dropShadowProgram',
        'innerShadowProgram',
        'tintProgram',
        'cmProgram',
        'motionProgram',
        'radialProgram',
        'tileProgram',
      ].forEach(k => {
        const p = programs[k];
        gl.deleteProgram(p);
      });
      for (let k in gl) {
        if(k.indexOf('programGauss,') === 0) {
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

  getCurPageZoom() {
    if (this.lastPage) {
      return this.lastPage.getZoom();
    }
    return this.dpi;
  }

  getNodeFromCurPage(
    x: number,
    y: number,
    includeGroup = false,
    includeArtBoard = false,
    lv?: number,
  ): Node | undefined {
    const page = this.lastPage;
    if (page) {
      return page.getNodeByPointAndLv(
        x,
        y,
        includeGroup,
        includeArtBoard,
        lv === undefined ? lv : lv + 3,
      );
    }
  }

  zoomTo(scale: number, cx?: number, cy?: number) {
    this.lastPage?.zoomTo(scale, cx, cy);
  }

  zoomFit() {
    this.lastPage?.zoomFit();
  }
}

export default Root;
