import Node from './Node';
import Page from './Page';
import { getDefaultStyle, JPage, Props } from '../format';
import { renderWebgl, Struct } from '../refresh/struct';
import { frame, FrameCallback } from '../animation/frame';
import { getLevel, isReflow, RefreshLevel } from '../refresh/level';
import { checkReflow } from './reflow';
import Container from './Container';
import { StyleKey } from '../style';
import { initShaders } from '../gl';
import config from '../refresh/config';
import { mainVert, mainFrag, colorVert, colorFrag } from '../gl/glsl';

const CONTEXT_ATTRIBUTES = {
  alpha: true,
  antialias: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  depth: true,
  stencil: true,
};

let uuid = 0;

class Root extends Container implements FrameCallback {
  uuid: number;
  canvas: HTMLCanvasElement;
  ctx: WebGL2RenderingContext | WebGLRenderingContext | null;
  programs: any = {};
  lastPage: Page | undefined; // 上一个显示的Page对象
  pageContainer: Container | undefined; // 存Page显示对象列表的容器
  overlayContainer: Container | undefined; // 不跟随Page缩放的选框标尺等容器
  structs: Array<Struct>; // 队列代替递归Tree的数据结构
  isAsyncDraw: boolean; // 异步下帧刷新标识，多次刷新任务去重
  ani = []; // 动画任务，空占位
  aniChange = false;
  task: Array<Function | undefined>; // 刷新任务回调
  taskClone: Array<Function | undefined>; // 一帧内刷新任务clone，可能任务回调中会再次调用新的刷新，新的应该再下帧不能混在本帧
  rl: RefreshLevel; // 一帧内画布最大刷新等级记录

  constructor(canvas: HTMLCanvasElement, props: Props) {
    super('Root', props, []);
    this.uuid = uuid++;
    this.canvas = canvas;
    // gl的初始化和配置
    this.ctx = (canvas.getContext('webgl2', CONTEXT_ATTRIBUTES) as WebGL2RenderingContext)
      || (canvas.getContext('webgl', CONTEXT_ATTRIBUTES) as WebGLRenderingContext);
    const gl = this.ctx as (WebGL2RenderingContext | WebGLRenderingContext);
    if (!gl) {
      alert('Webgl unsupported!');
      throw new Error('Webgl unsupported!');
    }
    config.init(
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
    );
    this.initShaders(gl);
    // 初始化的数据
    this.root = this;
    this.isDestroyed = false;
    this.structs = this.structure(0);
    this.isAsyncDraw = false;
    this.task = [];
    this.taskClone = [];
    this.rl = RefreshLevel.REBUILD;
    // 刷新动画侦听，目前就一个Root
    frame.addRoot(this);
    this.reLayout();
    this.draw();
    // 存所有Page
    this.pageContainer = new Container('pageContainer', {
      style: getDefaultStyle({
        width: this.width,
        height: this.height,
      }),
    }, []);
    this.appendChild(this.pageContainer);
    // 存上层的展示工具标尺等
    this.overlayContainer = new Container('overlayContainer', {
      style: getDefaultStyle({
        width: this.width,
        height: this.height,
      }),
    }, []);
    this.appendChild(this.overlayContainer);
  }

  private initShaders(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    const program = this.programs.program = initShaders(gl, mainVert, mainFrag);
    this.programs.colorProgram = initShaders(gl, colorVert, colorFrag);
    gl.useProgram(program);
  }

  private checkRoot() {
    this.width = this.computedStyle[StyleKey.WIDTH] = this.style[StyleKey.WIDTH].v as number;
    this.height = this.computedStyle[StyleKey.HEIGHT] = this.style[StyleKey.HEIGHT].v as number;
  }

  setJPages(jPages: Array<JPage>) {
    jPages.forEach(item => {
      const page = new Page(item.name, item.props, []);
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
    // 延迟初始化，第一次需要显示才从json初始化Page对象
    let newPage = this.pageContainer!.children[index] as Page;
    newPage.initIfNot();
    newPage.updateStyle({
      visible: true,
    });
    this.lastPage = newPage;
  }

  /**
   * 添加更新，分析repaint/reflow和上下影响，异步刷新
   * sync是动画在gotoAndStop的时候，下一帧刷新由于一帧内同步执行计算标识true
   */
  addUpdate(node: Node, keys: Array<StyleKey>, focus: RefreshLevel = RefreshLevel.NONE,
            addDom: boolean = false, removeDom: boolean = false, sync: boolean = false, cb?: Function) {
    if (this.isDestroyed) {
      return;
    }
    let lv = focus;
    if (keys && keys.length) {
      for(let i = 0, len = keys.length; i < len; i++) {
        const k = keys[i];
        lv |= getLevel(k);
      }
    }
    const res = this.calUpdate(node, lv, addDom, removeDom);
    // 动画在最后一帧要finish或者cancel时，特殊调用同步计算无需刷新，不会有cb
    if (sync) {
      if (res) {
        //
      }
      return;
    }
    if (res) {
      this.asyncDraw(cb);
    }
    else {
      cb && cb(true);
    }
  }

  private calUpdate(node: Node, lv: RefreshLevel, addDom: boolean, removeDom: boolean): boolean {
    // 防御一下
    if (addDom || removeDom) {
      lv |= RefreshLevel.REFLOW;
    }
    if (lv === RefreshLevel.NONE || !this.computedStyle[StyleKey.VISIBLE]) {
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
      if (removeDom) {
        node.destroy();
      }
    }
    else {
      const isRp = lv >= RefreshLevel.REPAINT;
      if (isRp) {
        node.canvasCache?.release(); // 可能之前没有内容
        node.calRepaintStyle();
      }
      else {
        const { style, computedStyle } = node;
        if (lv & RefreshLevel.TRANSFORM_ALL) {
          node.calMatrix(lv);
        }
        if (lv & RefreshLevel.OPACITY) {
          computedStyle[StyleKey.OPACITY] = style[StyleKey.OPACITY].v;
        }
        if (lv & RefreshLevel.MIX_BLEND_MODE) {
          computedStyle[StyleKey.MIX_BLEND_MODE] = style[StyleKey.MIX_BLEND_MODE].v;
        }
      }
    }
    // 记录节点的刷新等级，以及本帧最大刷新等级
    node.refreshLevel |= lv;
    if (addDom || removeDom) {
      this.rl |= RefreshLevel.REBUILD;
    }
    else {
      this.rl |= lv;
    }
    return true;
  }

  asyncDraw(cb?: Function) {
    if (!this.isAsyncDraw) {
      frame.onFrame(this);
      this.isAsyncDraw = true;
    }
    this.task.push(cb);
  }

  cancelAsyncDraw(cb: Function) {
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
    renderWebgl(this.ctx!, this, this.rl);
    this.rl = RefreshLevel.NONE;
  }

  reLayout() {
    this.checkRoot(); // 根节点必须保持和canvas同尺寸
    this.layout(this, {
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
      //
    }
    if (this.aniChange || len2) {
      this.draw();
    }
  }

  /**
   * 每帧调用的Root的after回调，将所有动画的after执行，以及主动更新的回调执行
   * 当都清空的时候，取消raf对本Root的侦听
   */
  after(diff: number) {
    const ani = this.ani, task = this.taskClone.splice(0);
    let len = ani.length, len2 = task.length;
    for (let i = 0; i < len; i++) {
      //
    }
    for (let i = 0; i < len2; i++) {
      let item = task[i];
      item && item();
    }
    len = ani.length; // 动画和渲染任务可能会改变自己的任务队列
    len2 = this.task.length;
    if (!len && !len2) {
      frame.offFrame(this);
      this.isAsyncDraw = false;
    }
  }
}

export default Root;
