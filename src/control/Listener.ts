import Node from '../node/Node';
import Container from '../node/Container';
import Root from '../node/Root';
import Page from '../node/Page';
import Text from '../node/Text';
import ArtBoard from '../node/ArtBoard';
import Group from '../node/Group';
import { ComputedStyle, Style, StyleUnit } from '../style/define';
import Event from '../util/Event';
import Select from './Select';
import Input from './Input';
import State from './State';
import { clone } from '../util/util';
import { ArtBoardProps } from '../format';
import History from '../history/History';
import AbstractCommand from '../history/AbstractCommand';
import MoveCommand, { MoveData } from '../history/MoveCommand';
import ResizeCommand, { CONTROL_TYPE, ResizeData } from '../history/ResizeCommand';
import RemoveCommand, { RemoveData } from '../history/RemoveCommand';
import RotateCommand from '../history/RotateCommand';
import UpdateRichCommand from '../history/UpdateRichCommand';
import OpacityCommand from '../history/OpacityCommand';
import VerticalAlignCommand from '../history/VerticalAlignCommand';
import { getFrameNodes, getNodeByPoint } from '../tools/root';
import { intersectLineLine } from '../math/isec';
import { angleBySides, r2d } from '../math/geom';
import { crossProduct } from '../math/vector';
import picker from './picker';
import ShadowCommand from '../history/ShadowCommand';
import BlurCommand from '../history/BlurCommand';

export type ListenerOptions = {
  enabled?: {
    selectWithMeta?: boolean; // 初始状态hover/select时强制按下meta
  };
  disabled?: {
    select?: boolean;
    hover?: boolean;
    remove?: boolean;
    move?: boolean; // 移动节点
    resize?: boolean; // 节点尺寸
    drag?: boolean; // 拖拽画布
    scale?: boolean; // 缩放画布
    editText?: boolean; // 进入编辑文字状态如双击
    inputText?: boolean; // 编辑输入文字
  };
};

export default class Listener extends Event {
  options: ListenerOptions;
  state: State;
  root: Root;
  dom: HTMLElement;
  history: History;
  metaKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  spaceKey: boolean;
  isMouseDown: boolean;
  isMouseMove: boolean;
  isControl: boolean; // resize等操作控制
  isRotate: boolean; // 拖转旋转节点
  controlType: CONTROL_TYPE; // 拖动尺寸dom时节点的class，区分比如左拉还是右拉
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  pageTx: number;
  pageTy: number;
  centerX: number; // 拖转旋转时节点的中心
  centerY: number;
  dx: number; // 每次拖拽的px，考虑缩放和dpi，即为sketch内的单位
  dy: number;
  isFrame: boolean; // 点下时是否选中节点，没有则是框选
  select: Select; // 展示的选框dom
  selected: Node[]; // 已选的节点们
  abcStyle: Partial<Style>[][]; // 点击按下时已选artBoard（非resizeContent）下直接children的样式clone记录，拖动过程中用转换的px单位计算，拖动结束时还原
  computedStyle: ComputedStyle[]; // 点击按下时已选节点的值样式状态记录初始状态，拖动过程中对比计算
  originStyle: Style[]; // 同上
  input: Input; // 输入文字dom和文本光标
  mouseDownArtBoard?: ArtBoard;

  constructor(root: Root, dom: HTMLElement, options: ListenerOptions = {}) {
    super();
    this.options = options;
    this.state = State.NORMAL;
    this.root = root;
    this.dom = dom;
    this.history = new History();

    this.metaKey = false;
    this.shiftKey = false;
    this.ctrlKey = false;
    this.altKey = false;
    this.spaceKey = false;

    this.isMouseDown = false;
    this.isMouseMove = false;
    this.isControl = false;
    this.isRotate = false;
    this.controlType = CONTROL_TYPE.T;

    this.originX = 0;
    this.originY = 0;
    this.startX = 0;
    this.startY = 0;
    this.pageTx = 0;
    this.pageTy = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.dx = 0;
    this.dy = 0;
    this.isFrame = false;

    this.selected = [];
    this.abcStyle = [];
    this.computedStyle = [];
    this.originStyle = [];
    this.updateOrigin();

    this.select = new Select(root, dom);
    this.input = new Input(root, dom, this.select);

    dom.addEventListener('mousedown', this.onMouseDown.bind(this));
    dom.addEventListener('mousemove', this.onMouseMove.bind(this));
    dom.addEventListener('mouseup', this.onMouseUp.bind(this));
    dom.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    dom.addEventListener('touchstart', this.onTouchStart.bind(this));
    dom.addEventListener('touchmove', this.onTouchMove.bind(this));
    dom.addEventListener('touchend', this.onTouchEnd.bind(this));
    dom.addEventListener('click', this.onClick.bind(this));
    dom.addEventListener('dblclick', this.onDblClick.bind(this));
    dom.addEventListener('wheel', this.onWheel.bind(this));
    dom.addEventListener('contextmenu', this.onContextMenu.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  // 更新dom的位置做原点坐标，鼠标按下或touch按下时
  updateOrigin() {
    const o = this.dom.getBoundingClientRect();
    this.originX = o.left;
    this.originY = o.top;
  }

  active(nodes: Node[]) {
    this.selected.splice(0);
    this.selected.push(...nodes);
    this.updateActive();
    this.emit(Listener.SELECT_NODE, this.selected.slice(0));
  }

  updateActive() {
    this.computedStyle = this.selected.map((item) =>
      item.getComputedStyle(),
    );
    if (this.selected.length) {
      this.select.showSelect(this.selected);
    }
    else {
      this.select.hideSelect();
    }
  }

  // 调整前先锁住group，防止自适应，在mouseup整体结束后统一进行，text也要记住状态
  prepare() {
    const selected = this.selected;
    selected.forEach((node) => {
      this.toggleGroup(node, true);
    });
    this.computedStyle = selected.map((item) => item.getComputedStyle());
    this.originStyle = selected.map((item) => item.getStyle());
  }

  toggleGroup(node: Node, value = false) {
    const p = node.parent;
    if (p && p.isGroup && p instanceof Group) {
      p.fixedPosAndSize = value;
    }
  }

  onDown(target: HTMLElement, e: MouseEvent | Touch) {
    const selected = this.selected;
    const isControl = this.select.isSelectControlDom(target);
    this.updateOrigin();
    const root = this.root;
    const dpi = root.dpi;
    // 操作开始清除
    this.originStyle.splice(0);
    this.computedStyle.splice(0);
    this.dx = this.dy = 0;
    // 点到控制html上
    if (isControl) {
      if (this.options.disabled?.resize) {
        return;
      }
      this.isControl = isControl;
      const controlType = this.controlType = {
        't': CONTROL_TYPE.T,
        'r': CONTROL_TYPE.R,
        'b': CONTROL_TYPE.B,
        'l': CONTROL_TYPE.L,
        'tl': CONTROL_TYPE.TL,
        'tr': CONTROL_TYPE.TR,
        'bl': CONTROL_TYPE.BL,
        'br': CONTROL_TYPE.BR,
      }[target.className]!;
      this.prepare();
      if (this.state === State.EDIT_TEXT) {
        this.state = State.NORMAL;
        this.input.hide();
      }
      // 旋转时记住中心坐标
      if (selected.length === 1 && this.metaKey
        && [CONTROL_TYPE.TL, CONTROL_TYPE.TR, CONTROL_TYPE.BL, CONTROL_TYPE.BR].indexOf(controlType) > -1) {
        const { points } = selected[0].getBoundingClientRect();
        const i = intersectLineLine(
          points[0].x, points[0].y, points[2].x, points[2].y,
          points[1].x, points[1].y, points[3].x, points[3].y,
        )!;
        this.centerX = i.x / dpi + this.originX;
        this.centerY = i.y / dpi + this.originY;
        this.isRotate = true;
      }
      else {
        this.abcStyle = selected.map((item) => {
          // resize画板children的定位尺寸临时变为固定px
          if (item.isArtBoard && item instanceof ArtBoard && !(item.props as ArtBoardProps).resizesContent) {
            return item.children.map((child) => {
              const { computedStyle, style } = child;
              const res = {
                left: clone(style.left),
                right: clone(style.right),
                top: clone(style.top),
                bottom: clone(style.bottom),
                width: clone(style.width),
                height: clone(style.height),
              };
              // 根据control的类型方向，决定将TRBL某个改为px固定值，对称方向改为auto
              if (controlType === CONTROL_TYPE.T || controlType === CONTROL_TYPE.TL || controlType === CONTROL_TYPE.TR) {
                if (style.bottom.u !== StyleUnit.PX) {
                  style.bottom.v = computedStyle.bottom;
                  style.bottom.u = StyleUnit.PX;
                }
                if (style.top.u !== StyleUnit.AUTO) {
                  style.top.u = StyleUnit.AUTO;
                }
              }
              else if (controlType === CONTROL_TYPE.B || controlType === CONTROL_TYPE.BL || controlType === CONTROL_TYPE.BR) {
                if (style.top.u !== StyleUnit.PX) {
                  style.top.v = computedStyle.top;
                  style.top.u = StyleUnit.PX;
                }
                if (style.bottom.u !== StyleUnit.AUTO) {
                  style.bottom.u = StyleUnit.AUTO;
                }
              }
              if (controlType === CONTROL_TYPE.L || controlType === CONTROL_TYPE.TL || controlType === CONTROL_TYPE.BL) {
                if (style.right.u !== StyleUnit.PX) {
                  style.right.v = computedStyle.right;
                  style.right.u = StyleUnit.PX;
                }
                if (style.left.u !== StyleUnit.AUTO) {
                  style.left.u = StyleUnit.AUTO;
                }
              }
              else if (controlType === CONTROL_TYPE.R || controlType === CONTROL_TYPE.TR || controlType === CONTROL_TYPE.BR) {
                if (style.left.u !== StyleUnit.PX) {
                  style.left.v = computedStyle.left;
                  style.left.u = StyleUnit.PX;
                }
                if (style.right.u !== StyleUnit.AUTO) {
                  style.right.u = StyleUnit.AUTO;
                }
              }
              // 尺寸一定会改固定
              if (style.width.u !== StyleUnit.PX) {
                style.width.v = computedStyle.width;
                style.width.u = StyleUnit.PX;
              }
              if (style.height.u !== StyleUnit.PX) {
                style.height.v = computedStyle.height;
                style.height.u = StyleUnit.PX;
              }
              return res;
            });
          }
          return [];
        });
      }
    }
    // 点到canvas上
    else {
      // 非按键多选情况下点击框内，视为移动，多选时选框一定是无旋转的
      if (selected.length > 1 && !this.metaKey && !this.shiftKey) {
        const x = e.clientX;
        const y = e.clientY;
        const rect = this.select.select.getBoundingClientRect();
        if (x >= rect.left && y >= rect.top && x <= rect.right && y <= rect.bottom) {
          this.prepare();
          return;
        }
      }
      // 普通根据点击坐标获取节点逻辑
      const x = (e.clientX - this.originX) * dpi;
      const y = (e.clientY - this.originY) * dpi;
      let node = getNodeByPoint(
        root,
        x,
        y,
        this.metaKey || this.options.enabled?.selectWithMeta,
        selected,
        false,
      );
      // 特殊的选择画板逻辑，mouseDown时不选择防止影响框选，mouseUp时才选择
      if (this.metaKey && node instanceof ArtBoard && selected.indexOf(node) === -1) {
        // 如果已选的里面有此画板或者属于此画板，要忽略
        let ignore = false;
        for (let i = 0, len = selected.length; i < len; i++) {
          const item = selected[i];
          if (item === node || item.artBoard === node) {
            ignore = true;
            break;
          }
        }
        if (!ignore) {
          this.mouseDownArtBoard = node;
          node = undefined;
        }
      }
      // 空选再拖拽则是框选行为，画一个长方形多选范围内的节点
      this.isFrame = !node;
      const oldSelected = selected.slice(0);
      if (node) {
        const i = selected.indexOf(node);
        // 点选已有节点
        if (i > -1) {
          if (this.shiftKey) {
            // 已选唯一相同节点，按shift不消失，是水平/垂直移动
            if (selected.length !== 1 || selected[0] !== node) {
              selected.splice(i, 1);
            }
          }
          else {
            // 持续编辑更新文本的编辑光标并提前退出
            if (this.state === State.EDIT_TEXT) {
              const text = selected[0] as Text;
              text.hideSelectArea();
              text.setCursorStartByAbsCoords(x, y);
              this.input.update(
                e.clientX - this.originX,
                e.clientY - this.originY
              );
              this.input.showCursor();
              // 防止触发click事件失焦
              if (e instanceof MouseEvent) {
                e.preventDefault();
              }
              return;
            }
            // 唯一已选节点继续点击，不触发选择事件
            if (selected.length === 1 && selected[0] === node) {
              this.prepare();
              return;
            }
            selected.splice(0);
            selected.push(node);
          }
        }
        // 点选新节点
        else {
          if (!this.shiftKey) {
            selected.splice(0);
          }
          // 特殊的地方，即便按下shift，但如果已选画板内子元素去选画板将无视，已选画板去选其子元素将取消画板
          else {
            for (let i = selected.length - 1; i >= 0; i--) {
              const item = selected[i];
              if (node.isArtBoard && item.artBoard === node && node !== item) {
                return;
              }
              if (item.isArtBoard && node.artBoard === item && node !== item) {
                selected.splice(i, 1);
              }
            }
          }
          selected.push(node);
        }
      }
      else {
        // 没有选中节点，但当前在编辑某个文本节点时，变为非编辑选择状态，此时已选的就是唯一文本节点，不用清空
        if (this.state === State.EDIT_TEXT) {
          const text = selected[0] as Text;
          text.hideSelectArea();
        }
        else if (!this.shiftKey) {
          selected.splice(0);
        }
      }
      // 一定是退出文本的编辑状态，持续编辑文本在前面逻辑会提前跳出
      if (this.state === State.EDIT_TEXT) {
        this.state = State.NORMAL;
        this.input.hide();
      }
      if (this.select.hoverNode) {
        this.select.hideHover();
        this.emit(Listener.UN_HOVER_NODE);
      }
      if (selected.length) {
        this.select.showSelect(selected);
      }
      else {
        this.select.hideSelect();
      }
      // 一直点选空白不选节点，防止重复触发
      if (oldSelected.length === 0 && selected.length === 0) {
        return;
      }
      // 旋转需记住节点中心坐标
      if (this.metaKey && selected.length === 1) {
        this.select.metaKey(true);
      }
      this.prepare();
      this.emit(Listener.SELECT_NODE, selected.slice(0));
    }
  }

  onMouseDown(e: MouseEvent) {
    e.preventDefault();
    if (this.options.disabled?.select) {
      return;
    }
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    // 左键
    if (e.button === 0 || e.button === 2) {
      if (e.button === 0) {
        this.isMouseDown = true;
        this.isMouseMove = false;
        this.startX = e.clientX;
        this.startY = e.clientY;
        // 空格按下移动画布
        if (this.spaceKey) {
          const o = page.getComputedStyle();
          this.pageTx = o.translateX;
          this.pageTy = o.translateY;
          this.dom.style.cursor = 'grabbing';
        }
      }
      // 普通按下是选择节点或者编辑文本
      if (!this.spaceKey) {
        const target = e.target as HTMLElement;
        this.onDown(target, e);
      }
    }
  }

  onMove(e: MouseEvent | Touch, isTouch: boolean) {
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    const dpi = root.dpi;
    const dx = e.clientX - this.startX; // 外部页面单位
    const dy = e.clientY - this.startY;
    const zoom = page.getZoom();
    let dx2 = this.dx = Math.round((dx / zoom) * dpi); // 画布内sketch单位
    let dy2 = this.dy = Math.round((dy / zoom) * dpi);
    const selected = this.selected;
    // 操作控制尺寸的时候，已经mousedown了
    if (this.isControl) {
      // 特殊单个节点旋转操控，知道节点中心坐标，点击初始坐标，移动后坐标，3点确定三角形，余弦定理求夹角
      if (this.isRotate) {
        const cx = this.centerX - this.originX;
        const cy = this.centerY - this.originY;
        const ax = this.startX - this.originX;
        const ay = this.startY - this.originY;
        const bx = e.clientX - this.originX;
        const by = e.clientY - this.originY;
        const r = angleBySides(
          Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2)),
          Math.sqrt(Math.pow(cx - bx, 2) + Math.pow(cy - by, 2)),
          Math.sqrt(Math.pow(ax - cx, 2) + Math.pow(ay - cy, 2)),
        );
        // 知道角度后需确定顺逆时针方向
        const c = crossProduct(
          ax - cx, ay - cy,
          bx - cx, by - cy,
        );
        const node = selected[0];
        const rotateZ = (this.computedStyle[0].rotateZ + r2d(r) * (c >= 0 ? 1 : -1)) % 360;
        node.updateStyle({
          rotateZ,
        });
        this.select.updateSelect(selected);
        this.emit(Listener.ROTATE_NODE, selected.slice(0));
      }
      // 普通的节点拉伸
      else {
        selected.forEach((node, i) => {
          // 改变尺寸前置记录操作，注意更新computedStyle（startSizeChange变更了），影响计算
          if (!this.isMouseMove) {
            node.startSizeChange();
            this.computedStyle[i] = node.getComputedStyle();
          }
          const computedStyle = this.computedStyle[i];
          const controlType = this.controlType;
          ResizeCommand.updateStyle(node, computedStyle, dx2, dy2, controlType, this.shiftKey);
        });
        this.isMouseMove = true;
        this.select.updateSelect(selected);
        this.emit(Listener.RESIZE_NODE, selected.slice(0));
      }
    }
    // 先看是否编辑文字决定选择一段文本，再看是否有选择节点决定是拖拽节点还是多选框
    else if (this.isMouseDown) {
      if (this.state === State.EDIT_TEXT) {
        const x = (e.clientX - this.originX) * dpi;
        const y = (e.clientY - this.originY) * dpi;
        const text = selected[0] as Text;
        text.setCursorEndByAbsCoords(x, y);
        this.input.hideCursor();
      }
      else {
        if (this.options.disabled?.move) {
          return;
        }
        if (this.isFrame) {
          if (!this.isMouseMove) {
            this.select.showFrame(this.startX - this.originX, this.startY - this.originY, dx, dy);
          }
          else {
            this.select.updateFrame(dx, dy);
          }
          const x = (this.startX - this.originX) * dpi;
          const y = (this.startY - this.originY) * dpi;
          const res = getFrameNodes(root, x, y, x + dx * dpi, y + dy * dpi, this.metaKey);
          const old = selected.splice(0);
          selected.push(...res);
          // 已选择的没变优化
          let change = old.length !== selected.length;
          if (!change) {
            for (let i = 0, len = old.length; i < len; i++) {
              if (old[i] !== selected[i]) {
                change = true;
              }
            }
          }
          if (change) {
            if (res.length) {
              this.select.showSelect(selected);
            }
            else {
              this.select.hideSelect();
            }
            this.emit(Listener.SELECT_NODE, selected.slice(0));
          }
        }
        else {
          // 水平/垂直
          if (this.shiftKey) {
            if (dx2 >= dy2) {
              this.dy = dy2 = 0;
            }
            else {
              this.dx = dx2 = 0;
            }
          }
          selected.forEach((node, i) => {
            const computedStyle = this.computedStyle[i];
            /**
             * 这里用computedStyle的translate差值做计算，得到当前的translate的px值updateStyle给node，
             * 在node的calMatrix那里是优化过的计算方式，只有translate变更的话也是只做差值计算，更快。
             * 需要注意目前matrix的整体计算是将布局信息TRLB换算为translate，因此style上的原始值和更新的这个px值并不一致，
             * 结束拖动调用endPosChange()将translate写回布局TRLB的style上满足定位要求。
             */
            MoveCommand.updateStyle(node, computedStyle, dx2, dy2);
          });
          this.select.updateSelect(selected);
          this.emit(Listener.MOVE_NODE, selected.slice(0));
        }
      }
      this.isMouseMove = true;
    }
    // 普通的hover，仅mouseEvent有
    else if (!isTouch) {
      if (this.options.disabled?.hover) {
        return;
      }
      // 因为用到offsetXY，避免是其它DOM触发的（如select上的html），防止不正确
      const target = e.target as HTMLElement;
      if (target.tagName.toUpperCase() !== 'CANVAS') {
        if (this.select.hoverNode) {
          this.select.hideHover();
          this.emit(Listener.UN_HOVER_NODE);
        }
        return;
      }
      // mousemove时可以用offsetXY直接获取坐标无需关心dom位置原点等
      const node = getNodeByPoint(
        root,
        (e as MouseEvent).offsetX * dpi,
        (e as MouseEvent).offsetY * dpi,
        this.metaKey || this.options.enabled?.selectWithMeta,
        selected,
        false,
      );
      if (node) {
        if (selected.indexOf(node) === -1 && this.select.hoverNode !== node) {
          this.select.showHover(node);
          this.emit(Listener.HOVER_NODE, node);
        }
        else if (selected.indexOf(node) > -1 && this.select.hoverNode) {
          this.select.hideHover();
          this.emit(Listener.UN_HOVER_NODE);
        }
      }
      else if (this.select.hoverNode) {
        this.select.hideHover();
        this.emit(Listener.UN_HOVER_NODE);
      }
    }
  }

  onMouseMove(e: MouseEvent) {
    const root = this.root;
    const dpi = root.dpi;
    const selected = this.selected;
    // 空格拖拽画布
    if (this.spaceKey) {
      if (this.isMouseDown) {
        if (this.options.disabled?.drag) {
          return;
        }
        this.select.hideHover();
        this.isMouseMove = true;
        const page = root.getCurPage();
        if (page) {
          const dx = e.clientX - this.startX;
          const dy = e.clientY - this.startY;
          page.updateStyle({
            translateX: this.pageTx + dx,
            translateY: this.pageTy + dy,
          });
          if (selected.length) {
            this.select.updateSelect(selected);
          }
        }
      }
      else {
        if (this.options.disabled?.hover) {
          return;
        }
        // 因为用到offsetXY，避免是其它DOM触发的（如select上的html），防止不正确
        const target = e.target as HTMLElement;
        if (target.tagName.toUpperCase() !== 'CANVAS') {
          return;
        }
        // mousemove时可以用offsetXY直接获取坐标无需关心dom位置原点等
        const node = getNodeByPoint(
          root,
          e.offsetX * dpi,
          e.offsetY * dpi,
          this.metaKey || this.options.enabled?.selectWithMeta,
          selected,
          false,
        );
        if (node) {
          if (selected.indexOf(node) === -1) {
            this.select.showHover(node);
          }
          this.emit(Listener.HOVER_NODE, node);
        }
        else {
          this.select.hideHover();
          this.emit(Listener.UN_HOVER_NODE);
        }
      }
    }
    // 其它看情况点选
    else {
      this.onMove(e, false);
    }
  }

  onMouseUp() {
    const selected = this.selected;
    // 调整之前锁住的group，结束后统一进行解锁
    selected.forEach(node => {
      this.toggleGroup(node, false);
    });
    if (this.isControl) {
      this.isControl = false;
      if (this.isRotate) {
        this.isRotate = false;
        const node = selected[0];
        this.history.addCommand(new RotateCommand([node], [{
          prev: {
            rotateZ: this.computedStyle[0].rotateZ,
          },
          next: {
            rotateZ: node.computedStyle.rotateZ,
          },
        }]));
        if (!this.metaKey) {
          this.select.metaKey(false);
        }
      }
      else {
        const { dx, dy } = this;
        // 还原artBoard的children为初始值，只有操作画板时才有，普通节点是空[]
        this.abcStyle.forEach((item, i) => {
          if (item.length) {
            const node = selected[i] as ArtBoard;
            const children = node.children;
            item.forEach((abcStyle, i) => {
              const style = children[i].style;
              ['left', 'right', 'top', 'bottom', 'width', 'height'].forEach((k) => {
                const o = abcStyle[k as keyof Style];
                // @ts-ignore
                style[k].v = o.v;
                // @ts-ignore
                style[k].u = o.u;
              });
            });
          }
        });
        if (this.isMouseMove && (dx || dy)) {
          const controlType = this.controlType;
          const data: ResizeData[] = [];
          selected.forEach((node, i) => {
            // 有调整尺寸的话，还原最初的translate/TRBL值，向上检测组的自适应尺寸
            node.endSizeChange(this.originStyle[i]);
            node.checkPosSizeUpward();
            const r: ResizeData = { dx, dy, controlType, aspectRatio: this.shiftKey };
            const originStyle = this.originStyle[i];
            if (originStyle.width.u === StyleUnit.AUTO) {
              r.widthFromAuto = true;
            }
            if (originStyle.height.u === StyleUnit.AUTO) {
              r.heightFromAuto = true;
            }
            data.push(r);
          });
          this.history.addCommand(new ResizeCommand(selected.slice(0), data));
        }
      }
    }
    else if (this.isMouseMove) {
      // 编辑文字检查是否选择了一段文本，普通则是移动选择节点
      if (this.state === State.EDIT_TEXT) {
        if (this.options.disabled?.inputText) {
          return;
        }
        const text = selected[0] as Text;
        const multi = text.checkCursorMulti();
        // 可能框选的文字为空不是多选，需取消
        if (!multi) {
          this.input.updateCurCursor();
          this.input.showCursor();
        }
        else {
          this.input.hideCursor();
        }
        this.input.focus();
      }
      else if (this.isFrame) {
        this.select.hideFrame();
      }
      else {
        const { dx, dy } = this;
        if (dx || dy) {
          const data: MoveData[] = [];
          selected.forEach((node, i) => {
            // 还原最初的translate/TRBL值
            node.endPosChange(this.originStyle[i], dx, dy);
            node.checkPosSizeUpward();
            data.push({ dx, dy });
          });
          this.history.addCommand(new MoveCommand(selected.slice(0), data));
        }
      }
    }
    // 特殊的选择画板逻辑，mouseDown时不选择防止影响框选，mouseUp时才选择，shift校验在down时做
    else if (this.metaKey && this.mouseDownArtBoard) {
      if (!this.shiftKey) {
        selected.splice(0);
      }
      selected.push(this.mouseDownArtBoard);
      this.select.hideHover();
      this.select.showSelect(selected);
      this.prepare();
      this.emit(Listener.SELECT_NODE, selected.slice(0));
    }
    this.isMouseDown = false;
    this.isMouseMove = false;
    this.mouseDownArtBoard = undefined;
    this.isFrame = false;
    if (this.spaceKey) {
      if (this.options.disabled?.drag) {
        return;
      }
      this.dom.style.cursor = 'grab';
    }
    else {
      this.dom.style.cursor = 'auto';
    }
  }

  onMouseLeave() {
    this.select.hideHover();
    // 离屏需终止当前操作
    if (this.isMouseDown || this.isControl) {
      this.onMouseUp();
    }
  }

  onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) {
      return;
    }
    const touch = e.touches[0];
    this.isMouseDown = true;
    this.isMouseMove = false;
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    const target = e.target as HTMLElement;
    this.onDown(target, touch);
  }

  onTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1) {
      return;
    }
    this.onMove(e.touches[0], true);
  }

  onTouchEnd() {
    this.onMouseUp();
  }

  onClick() {
  }

  onDblClick(e: MouseEvent) {
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    const dpi = root.dpi;
    let node = getNodeByPoint(
      root,
      (e.clientX - this.originX) * dpi,
      (e.clientY - this.originY) * dpi,
      this.metaKey || this.options.enabled?.selectWithMeta,
      this.selected,
      true,
    );
    // 忽略画板
    if (node && !(node instanceof ArtBoard)) {
      if (this.selected.length !== 1 || node !== this.selected[0]) {
        if (this.options.disabled?.select) {
          return;
        }
        this.selected.splice(0);
        this.selected.push(node);
        this.select.showSelect(this.selected);
      }
      if (node instanceof Text) {
        if (this.options.disabled?.editText) {
          return;
        }
        this.input.show(
          node,
          e.clientX - this.originX,
          e.clientY - this.originY,
        );
        node.hideSelectArea();
        this.state = State.EDIT_TEXT;
      }
    }
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    const root = this.root;
    const { dpi, width, height } = root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    this.select.hideHover();
    // 按下时缩放
    if (e.ctrlKey || e.metaKey) {
      if (this.options.disabled?.scale) {
        return;
      }
      let deltaY = e.deltaY;
      // 来源于手势，数值和滚轮比会很小
      if (e.ctrlKey && !e.metaKey) {
        deltaY *= 50;
      }
      let sc = 0;
      if (deltaY < 0) {
        if (deltaY < -300) {
          sc = 0.2;
        }
        else if (deltaY < -200) {
          sc = 0.1;
        }
        else if (deltaY < -100) {
          sc = 0.05;
        }
        else if (deltaY < -50) {
          sc = 0.02;
        }
        else {
          sc = 0.01;
        }
      }
      else if (deltaY > 0) {
        if (deltaY > 300) {
          sc = -0.2;
        }
        else if (deltaY > 200) {
          sc = -0.1;
        }
        else if (deltaY > 100) {
          sc = -0.05;
        }
        else if (deltaY > 50) {
          sc = -0.02;
        }
        else {
          sc = -0.01;
        }
      }
      const x = (e.clientX - this.originX) * dpi / width;
      const y = (e.clientY - this.originY) * dpi / height;
      let scale = page.getZoom(true);
      // 最后缩小时防止太快
      if (scale < 1) {
        sc *= scale;
      }
      scale += sc;
      if (scale > 32) {
        scale = 32;
      }
      else if (scale < 0.01) {
        scale = 0.01;
      }
      root.zoomTo(scale, x, y);
      this.emit(Listener.ZOOM_PAGE, scale);
    }
    else {
      if (this.options.disabled?.drag) {
        return;
      }
      const { translateX, translateY } = page.getComputedStyle();
      page.updateStyle({
        translateX: translateX - e.deltaX,
        translateY: translateY - e.deltaY,
      });
    }
    this.updateSelected();
    this.updateInput();
  }

  onKeyDown(e: KeyboardEvent) {
    this.metaKey = e.metaKey;
    this.altKey = e.altKey;
    this.ctrlKey = e.ctrlKey;
    this.shiftKey = e.shiftKey;
    const page = this.root.getCurPage();
    if (!page) {
      return;
    }
    if (this.metaKey && this.selected.length === 1) {
      this.select.metaKey(true);
    }
    // backspace
    if (e.keyCode === 8 || e.keyCode === 46) {
      const target = e.target as HTMLElement; // 忽略输入时
      if (target.tagName.toUpperCase() !== 'INPUT' && this.selected.length && !this.options.disabled?.remove) {
        const nodes = this.selected.splice(0);
        const data: RemoveData[] = [];
        nodes.forEach((item) => {
          data.push(RemoveCommand.operate(item));
        });
        this.select.hideSelect();
        this.history.addCommand(new RemoveCommand(nodes, data));
        this.emit(Listener.REMOVE_NODE, nodes.slice(0));
      }
    }
    // space
    else if (e.keyCode === 32) {
      this.spaceKey = true;
      if (!this.isMouseDown && !this.options.disabled?.drag) {
        this.dom.style.cursor = 'grab';
      }
    }
    // option+esc
    else if (e.keyCode === 27 && this.altKey) {
      if (this.selected.length) {
        let node = this.selected[0];
        if (node instanceof Page || node instanceof Root || node instanceof ArtBoard) {
          return;
        }
        node = node.parent!;
        this.selected.splice(0);
        this.selected.push(node);
        this.select.updateSelect(this.selected);
        this.emit(Listener.SELECT_NODE, this.selected.slice(0));
      }
    }
    // esc，编辑文字回到普通，普通取消选择
    else if (e.keyCode === 27) {
      if (this.state === State.EDIT_TEXT) {
        this.state = State.NORMAL;
        this.input.hide();
      }
      else if (picker.isShow()) {
        picker.hide();
      }
      else {
        this.selected.splice(0);
        this.select.hideSelect();
        this.select.hideHover();
        this.emit(Listener.SELECT_NODE, this.selected.slice(0));
      }
    }
    // z，undo/redo
    else if (e.keyCode === 90 && this.metaKey) {
      const target = e.target as HTMLElement;
      if (target && target.tagName.toUpperCase() === 'INPUT') {
        e.preventDefault();
      }
      let c: AbstractCommand | undefined;
      if (this.shiftKey) {
        c = this.history.redo();
      }
      else {
        c = this.history.undo();
      }
      if (c) {
        this.updateActive();
        // 触发更新的还是目前已选的而不是undo里的数据
        if (c instanceof MoveCommand) {
          this.emit(Listener.MOVE_NODE, this.selected.slice(0));
        }
        else if (c instanceof ResizeCommand) {
          this.emit(Listener.RESIZE_NODE, this.selected.slice(0));
        }
        else if (c instanceof RemoveCommand) {
          if (this.shiftKey) {
            this.selected = [];
            this.select.hideSelect();
            this.emit(Listener.REMOVE_NODE, c.nodes.slice(0));
          }
          else {
            this.selected = c.nodes.slice(0);
            this.select.showSelect(this.selected);
            this.emit(Listener.ADD_NODE, c.nodes.slice(0));
          }
        }
        else if (c instanceof RotateCommand) {
          this.emit(Listener.ROTATE_NODE, this.selected.slice(0));
        }
        else if (c instanceof OpacityCommand) {
          this.emit(Listener.OPACITY_NODE, this.selected.slice(0));
        }
        else if (c instanceof ShadowCommand) {
          this.emit(Listener.SHADOW_NODE, this.selected.slice(0));
        }
        else if (c instanceof BlurCommand) {
          this.emit(Listener.BLUR_NODE, this.selected.slice(0));
        }
        else if (c instanceof VerticalAlignCommand) {
          this.emit(Listener.TEXT_VERTICAL_ALIGN_NODE, this.selected.slice(0));
        }
        else if (c instanceof UpdateRichCommand) {
          if (c.type === UpdateRichCommand.TEXT_ALIGN) {
            this.emit(Listener.TEXT_ALIGN_NODE, this.selected.slice(0));
          }
          else if (c.type === UpdateRichCommand.COLOR) {
            this.emit(Listener.COLOR_NODE, this.selected.slice(0));
          }
          else if (c.type === UpdateRichCommand.FONT_FAMILY) {
            this.emit(Listener.FONT_FAMILY_NODE, this.selected.slice(0));
          }
          else if (c.type === UpdateRichCommand.FONT_SIZE) {
            this.emit(Listener.FONT_SIZE_NODE, this.selected.slice(0));
          }
          else if (c.type === UpdateRichCommand.LINE_HEIGHT) {
            this.emit(Listener.LINE_HEIGHT_NODE, this.selected.slice(0));
          }
          else if (c.type === UpdateRichCommand.PARAGRAPH_SPACING) {
            this.emit(Listener.PARAGRAPH_SPACING_NODE, this.selected.slice(0));
          }
          else if (c.type === UpdateRichCommand.LETTER_SPACING) {
            this.emit(Listener.LETTER_SPACING_NODE, this.selected.slice(0));
          }
        }
      }
    }
  }

  onKeyUp(e: KeyboardEvent) {
    this.metaKey = e.metaKey;
    this.altKey = e.altKey;
    this.ctrlKey = e.ctrlKey;
    this.shiftKey = e.shiftKey;
    if (!this.metaKey && !this.isRotate) {
      this.select.metaKey(false);
    }
    // space
    if (e.keyCode === 32) {
      this.spaceKey = false;
      this.dom.style.cursor = 'auto';
    }
  }

  updateSelected() {
    if (this.selected.length) {
      this.select.updateSelect(this.selected);
    }
  }

  updateInput() {
    if (this.state === State.EDIT_TEXT) {
      this.input.updateCurCursor();
    }
  }

  onContextMenu(e: MouseEvent) {
    e.preventDefault();
    this.emit(Listener.CONTEXT_MENU, e);
  }

  destroy() {
    this.dom.removeEventListener('mousedown', this.onMouseDown);
    this.dom.removeEventListener('mousemove', this.onMouseMove);
    this.dom.removeEventListener('mouseup', this.onMouseUp);
    this.dom.removeEventListener('mouseleave', this.onMouseLeave);
    this.dom.removeEventListener('click', this.onClick);
    this.dom.removeEventListener('dblclick', this.onDblClick);
    this.dom.removeEventListener('wheel', this.onWheel);
    this.dom.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);

    this.selected.splice(0);
    this.abcStyle.splice(0);
    this.computedStyle.splice(0);
    this.originStyle.splice(0);
    this.select.destroy();
  }

  static HOVER_NODE = 'HOVER_NODE';
  static UN_HOVER_NODE = 'UN_HOVER_NODE';
  static SELECT_NODE = 'SELECT_NODE';
  static RESIZE_NODE = 'RESIZE_NODE';
  static MOVE_NODE = 'MOVE_NODE';
  static ROTATE_NODE = 'ROTATE_NODE';
  static OPACITY_NODE = 'OPACITY_NODE';
  static FLIP_H_NODE = 'FLIP_H_NODE';
  static FLIP_V_NODE = 'FLIP_V_NODE';
  static FILL_NODE = 'FILL_NODE';
  static STROKE_NODE = 'STROKE_NODE';
  static FONT_FAMILY_NODE = 'FONT_FAMILY_NODE';
  static FONT_SIZE_NODE = 'FONT_SIZE_NODE';
  static LINE_HEIGHT_NODE = 'LINE_HEIGHT_NODE';
  static LETTER_SPACING_NODE = 'LETTER_SPACING_NODE';
  static PARAGRAPH_SPACING_NODE = 'PARAGRAPH_SPACING_NODE';
  static COLOR_NODE = 'COLOR_NODE';
  static TEXT_ALIGN_NODE = 'TEXT_ALIGN_NODE';
  static TEXT_VERTICAL_ALIGN_NODE = 'TEXT_VERTICAL_ALIGN_NODE';
  static SHADOW_NODE = 'SHADOW_NODE';
  static BLUR_NODE = `BLUR_NODE`;
  static REMOVE_NODE = 'REMOVE_NODE';
  static ADD_NODE = 'ADD_NODE';
  static ZOOM_PAGE = 'ZOOM_PAGE';
  static CONTEXT_MENU = 'CONTEXT_MENU';
}
