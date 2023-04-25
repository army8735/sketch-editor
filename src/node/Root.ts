import Node from './Node';
import Page from './Page';
import ArtBoard from './ArtBoard';
import Overlay from './overlay/Overlay';
import { JPage, Props } from '../format';
import { renderWebgl, Struct } from '../refresh/struct';
import { frame, FrameCallback } from '../animation/frame';
import Event from '../util/Event';
import { getLevel, isReflow, RefreshLevel } from '../refresh/level';
import { checkReflow } from './reflow';
import Container from './Container';
import { initShaders } from '../gl';
import config from '../refresh/config';
import {
  colorFrag,
  colorVert,
  mainFrag,
  mainVert,
  maskVert,
  maskFrag,
  simpleFrag,
  simpleVert,
} from '../gl/glsl';
import ca from '../gl/ca';

let uuid = 0;

type RootProps = Props & {
  dpi: number,
};

class Root extends Container implements FrameCallback {
  uuid: number;
  canvas?: HTMLCanvasElement;
  ctx: WebGL2RenderingContext | WebGLRenderingContext | undefined;
  dpi: number;
  isWebgl2?: boolean;
  programs: any;
  refs: any;
  lastPage: Page | undefined; // 上一个显示的Page对象
  pageContainer: Container | undefined; // 存Page显示对象列表的容器
  overlay: Overlay | undefined; // 不跟随Page缩放的选框标尺等容器
  structs: Array<Struct>; // 队列代替递归Tree的数据结构
  isAsyncDraw: boolean; // 异步下帧刷新标识，多次刷新任务去重
  ani = []; // 动画任务，空占位
  aniChange = false;
  task: Array<((sync: boolean) => void) | undefined>; // 刷新任务回调
  taskClone: Array<((sync: boolean) => void) | undefined>; // 一帧内刷新任务clone，可能任务回调中会再次调用新的刷新，新的应该再下帧不能混在本帧
  rl: RefreshLevel; // 一帧内画布最大刷新等级记录

  constructor(props: RootProps, children: Array<Node> = []) {
    super(props, children);
    this.uuid = uuid++;
    // 初始化的数据
    this.dpi = props.dpi;
    this.root = this;
    this.refs = {};
    this.structs = this.structure(0);
    this.isAsyncDraw = false;
    this.task = [];
    this.taskClone = [];
    this.rl = RefreshLevel.REBUILD;
  }

  appendTo(canvas: HTMLCanvasElement) {
    this.isDestroyed = false;
    this.canvas = canvas;
    // gl的初始化和配置
    let gl: WebGL2RenderingContext | WebGLRenderingContext
      = canvas.getContext('webgl2', ca) as WebGL2RenderingContext;
    if (gl) {
      this.ctx = gl;
      this.isWebgl2 = true;
    }
    else {
      this.ctx = gl = canvas.getContext('webgl', ca) as WebGLRenderingContext;
      this.isWebgl2 = false;
    }
    if (!gl) {
      alert('Webgl unsupported!');
      throw new Error('Webgl unsupported!');
    }
    config.init(
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
    );
    this.programs = {};
    this.initShaders(gl);
    // 刷新动画侦听，目前就一个Root
    frame.addRoot(this);
    this.reLayout();
    // 存所有Page
    this.pageContainer = new Container({
      style: {
        width: '100%',
        height: '100%',
        pointerEvents: false,
        scaleX: this.dpi,
        scaleY: this.dpi,
        transformOrigin: [0, 0],
      },
    }, []);
    this.appendChild(this.pageContainer);
    // 存上层的展示工具标尺等
    this.overlay = new Overlay({
      style: {
        width: '100%',
        height: '100%',
        pointerEvents: false,
      },
    }, []);
    this.appendChild(this.overlay);
  }

  private initShaders(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    const program = this.programs.program = initShaders(gl, mainVert, mainFrag);
    this.programs.colorProgram = initShaders(gl, colorVert, colorFrag);
    this.programs.simpleProgram = initShaders(gl, simpleVert, simpleFrag);
    this.programs.maskProgram = initShaders(gl, maskVert, maskFrag);
    gl.useProgram(program);
  }

  private checkRoot() {
    this.width = this.computedStyle.width = this.style.width.v as number;
    this.height = this.computedStyle.height = this.style.height.v as number;
    this.ctx!.viewport(0, 0, this.width, this.height);
  }

  setJPages(jPages: Array<JPage>) {
    jPages.forEach(item => {
      const page = new Page(item.props, []);
      page.json = item;
      this.pageContainer!.appendChild(page);
    });
  }

  setPageIndex(index: number) {
    if (index < 0 || index >= this.pageContainer!.children.length) {
      return;
    }
    if (this.lastPage) {
      if (this.lastPage === this.pageContainer!.children[index]) {
        return;
      }
      this.lastPage.updateStyle({
        visible: false,
      });
    }
    // 先置空，否则新页初始化添加DOM会触发事件到老页上
    this.lastPage = undefined;
    let newPage = this.pageContainer!.children[index] as Page;
    // 延迟初始化，第一次需要显示时才从json初始化Page对象
    newPage.initIfNot();
    newPage.updateStyle({
      visible: true,
    });
    this.lastPage = newPage;
    const children: Array<ArtBoard> = [];
    newPage.children.forEach(item => {
      if (item instanceof ArtBoard) {
        children.push(item);
      }
    });
    this.overlay!.setArtBoard(children);
    // 触发事件告知外部如刷新图层列表
    this.emit(Event.PAGE_CHANGED, newPage);
  }

  /**
   * 添加更新，分析repaint/reflow和上下影响，异步刷新
   * sync是动画在gotoAndStop的时候，下一帧刷新由于一帧内同步执行计算标识true
   */
  addUpdate(node: Node, keys: Array<string>, focus: RefreshLevel = RefreshLevel.NONE,
            addDom: boolean = false, removeDom: boolean = false, cb?: (sync: boolean) => void) {
    if (this.isDestroyed) {
      return;
    }
    let lv = focus;
    if (keys && keys.length) {
      for (let i = 0, len = keys.length; i < len; i++) {
        const k = keys[i];
        lv |= getLevel(k);
      }
    }
    if (removeDom) {
      this.emit(Event.WILL_REMOVE_DOM, node);
    }
    const res = this.calUpdate(node, lv, addDom, removeDom);
    // 非动画走这
    if (res) {
      this.asyncDraw(cb);
    }
    else {
      cb && cb(true);
    }
    // 切页过程中page不存在不触发，防止新老错乱，还要防止overlay中的图层
    if (this.lastPage && node.page) {
      if (addDom) {
        this.emit(Event.DID_ADD_DOM, node);
      }
      else if (keys.indexOf('visible') > -1) {
        this.emit(Event.VISIBLE_CHANGED, node.computedStyle.visible);
      }
    }
  }

  private calUpdate(node: Node, lv: RefreshLevel, addDom: boolean, removeDom: boolean): boolean {
    // 防御一下
    if (addDom || removeDom) {
      lv |= RefreshLevel.REFLOW;
    }
    if (lv === RefreshLevel.NONE || !this.computedStyle.visible || this.isDestroyed) {
      return false;
    }
    const isRf = isReflow(lv);
    if (isRf) {
      // 除了特殊如窗口缩放变更canvas画布会影响根节点，其它都只会是变更节点自己
      if (node === this) {
        this.reLayout();
      }
      else {
        checkReflow(this, node, addDom, removeDom);
      }
    }
    else {
      const isRp = lv >= RefreshLevel.REPAINT;
      if (isRp) {
        node.calRepaintStyle(lv);
        node.clearCache(true);
        node.clearCacheUpward(false);
      }
      else {
        const { style, computedStyle } = node;
        if (lv & RefreshLevel.TRANSFORM_ALL) {
          node.calMatrix(lv); // matrixWorld缓存在方法内清除
        }
        if (lv & RefreshLevel.OPACITY) {
          computedStyle.opacity = style.opacity.v;
          node.hasCacheOp = false; // 手动删除缓存
          node.hasCacheOpLv = false;
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
      }
    }
    // 检查mask影响，这里是作为被遮罩对象存在的关系检查
    const mask = node.mask;
    if (mask) {
      mask.clearMask();
    }
    // 记录节点的刷新等级，以及本帧最大刷新等级
    node.refreshLevel |= lv;
    this.rl |= lv;
    if (addDom || removeDom) {
      this.rl |= RefreshLevel.REBUILD;
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
    this.clear();
    const rl = this.rl;
    this.rl = RefreshLevel.NONE;
    renderWebgl(this.ctx!, this, rl);
    this.emit(Event.REFRESH, rl);
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

  destroy() {
    super.destroy();
    frame.removeRoot(this);
  }

  /**
   * 每帧调用Root的before回调，先将存储的动画before执行，触发数据先变更完，然后若有变化或主动更新则刷新
   */
  before() {
    const ani = this.ani, task = this.taskClone = this.task.splice(0);
    let len = ani.length, len2 = task.length;
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
    const ani = this.ani, task = this.taskClone.splice(0);
    let len = ani.length, len2 = task.length;
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
    return this.pageContainer!.children as Array<Page>;
  }

  getCurPage() {
    return this.lastPage;
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
    return 1;
  }

  getNodeFromCurPage(x: number, y: number, includeGroup = false, includeArtBoard = false, lv?: number): Node | undefined {
    const page = this.lastPage;
    if (page) {
      return page.getNodeByPointAndLv(x, y, includeGroup, includeArtBoard, lv === undefined ? lv : (lv + 3));
    }
  }
}

export default Root;
