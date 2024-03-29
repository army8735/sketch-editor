import Node from '../node/Node';
import Root from '../node/Root';
import Page from '../node/Page';
import Text from '../node/Text';
import ArtBoard from '../node/ArtBoard';
import Group from '../node/Group';
import { ComputedStyle, Style, StyleUnit } from '../style/define';
import Event from '../util/Event';
import Select from './Select';
import Input from './Input';
import { clone } from '../util/util';
import { ArtBoardProps, JStyle } from '../format';
import history from '../history';

const { History, UpdateStyleCommand } = history;

enum State {
  NORMAL = 0,
  EDIT_TEXT = 1, // 编辑文字进入特殊状态
}

export default class Listener extends Event {
  state: State;
  root: Root;
  dom: HTMLElement;
  metaKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  spaceKey: boolean;
  isMouseDown: boolean;
  isMouseMove: boolean;
  isControl: boolean;
  controlType: string; // 拖动尺寸dom时节点的class，区分比如左拉还是右拉
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  pageTx: number;
  pageTy: number;
  dx: number; // 上次move的px，考虑缩放和dpi
  dy: number;
  select: Select; // 展示的选框dom
  selected: Node[]; // 已选的节点们
  updateStyle: ({ prev: Partial<JStyle>, next: Partial<JStyle> } | undefined)[]; // 每次变更的style记录，在结束时供history使用
  hasControl: Boolean; // 每次control按下后是否进行了调整，性能优化
  sizeChangeStyle: (Style | undefined)[]; // 修改size时记录
  abcStyle: Partial<Style>[][]; // 点击按下时已选artBoard（非resizeContent）下直接children的样式clone记录，拖动过程中用转换的px单位计算，拖动结束时还原
  computedStyle: ComputedStyle[]; // 点击按下时已选节点的值样式状态记录初始状态，拖动过程中对比计算
  originStyle: Style[]; // 同上
  cssStyle: JStyle[]; // 同上
  input: Input; // 输入文字dom和文本光标

  constructor(root: Root, dom: HTMLElement) {
    super();
    this.state = State.NORMAL;
    this.root = root;
    this.dom = dom;

    this.metaKey = false;
    this.shiftKey = false;
    this.ctrlKey = false;
    this.altKey = false;
    this.spaceKey = false;

    this.isMouseDown = false;
    this.isMouseMove = false;
    this.isControl = false;
    this.controlType = '';

    this.originX = 0;
    this.originY = 0;
    this.startX = 0;
    this.startY = 0;
    this.pageTx = 0;
    this.pageTy = 0;
    this.dx = 0;
    this.dy = 0;
    this.selected = [];
    this.updateStyle = [];
    this.hasControl = false;
    this.sizeChangeStyle = [];
    this.abcStyle = [];
    this.computedStyle = [];
    this.originStyle = [];
    this.cssStyle = [];
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

  // 更新dom的位置，拖动时计算用，很少发生，一般首次调用即可
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
  prepare(isSize = false) {
    const selected = this.selected;
    selected.forEach((node, i) => {
      const p = node.parent;
      if (p && p.isGroup && p instanceof Group) {
        p.fixedPosAndSize = true;
      }
      // 暂时只有Text节点自适应尺寸时会有translate:-50%，不排除人工修改数据，所以记录所有节点
      if (isSize) {
        this.sizeChangeStyle[i] = node.startSizeChange();
      }
    });
    this.computedStyle = selected.map((item) => item.getComputedStyle());
    this.originStyle = selected.map((item) => item.getStyle());
    this.cssStyle = selected.map((item) => item.getCssComputedStyle());
  }

  onDown(target: HTMLElement, e: MouseEvent | Touch) {
    const selected = this.selected;
    const isControl = this.select.isSelectControlDom(target);
    // 操作开始清除
    this.sizeChangeStyle.splice(0);
    this.updateStyle.splice(0);
    this.dx = this.dy = 0;
    // 点到控制html上
    if (isControl) {
      this.isControl = isControl;
      this.hasControl = false;
      this.controlType = target.className;
      this.startX = e.pageX;
      this.startY = e.pageY;
      this.prepare(true);
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
            if (
              this.controlType === 't' ||
              this.controlType === 'tl' ||
              this.controlType === 'tr'
            ) {
              if (style.bottom.u !== StyleUnit.PX) {
                style.bottom.v = computedStyle.bottom;
                style.bottom.u = StyleUnit.PX;
              }
              if (style.top.u !== StyleUnit.AUTO) {
                style.top.u = StyleUnit.AUTO;
              }
            }
            else if (this.controlType === 'b' ||
              this.controlType === 'bl' ||
              this.controlType === 'br') {
              if (style.top.u !== StyleUnit.PX) {
                style.top.v = computedStyle.top;
                style.top.u = StyleUnit.PX;
              }
              if (style.bottom.u !== StyleUnit.AUTO) {
                style.bottom.u = StyleUnit.AUTO;
              }
            }
            if (
              this.controlType === 'l' ||
              this.controlType === 'tl' ||
              this.controlType === 'bl'
            ) {
              if (style.right.u !== StyleUnit.PX) {
                style.right.v = computedStyle.right;
                style.right.u = StyleUnit.PX;
              }
              if (style.left.u !== StyleUnit.AUTO) {
                style.left.u = StyleUnit.AUTO;
              }
            }
            else if (
              this.controlType === 'r' ||
              this.controlType === 'tr' ||
              this.controlType === 'br'
            ) {
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
      if (this.state === State.EDIT_TEXT) {
        this.state = State.NORMAL;
        this.input.hide();
      }
    }
    // 点到canvas上
    else {
      const root = this.root;
      const dpi = root.dpi;
      const x = (e.pageX - this.originX) * dpi;
      const y = (e.pageY - this.originY) * dpi;
      let node = root.getNode(
        x,
        y,
        this.metaKey,
        selected,
        false,
      );
      const oldSelected = selected.slice(0);
      if (node) {
        const i = selected.indexOf(node);
        // 点选已有节点
        if (i > -1) {
          if (this.shiftKey) {
            selected.splice(i, 1);
          }
          else {
            // 持续编辑更新文本的编辑光标并提前退出
            if (this.state === State.EDIT_TEXT) {
              const text = selected[0] as Text;
              text.hideSelectArea();
              text.setCursorStartByAbsCoord(x, y);
              this.input.update(
                e.pageX - this.originX,
                e.pageY - this.originY
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
        else {
          selected.splice(0);
        }
      }
      // 一定是退出文本的编辑状态，持续编辑文本在前面逻辑会提前跳出
      if (this.state === State.EDIT_TEXT) {
        this.state = State.NORMAL;
        this.input.hide();
      }
      this.select.hideHover();
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
      this.prepare();
      this.emit(Listener.SELECT_NODE, selected.slice(0));
    }
  }

  onMouseDown(e: MouseEvent) {
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
        this.startX = e.pageX;
        this.startY = e.pageY;
        // 空格按下移动画布
        if (this.spaceKey) {
          e.preventDefault();
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

  onMove(e: MouseEvent | Touch) {
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    const dpi = root.dpi;
    const dx = e.pageX - this.startX;
    const dy = e.pageY - this.startY;
    const zoom = page.getZoom();
    const dx2 = this.dx = (dx / zoom) * root.dpi;
    const dy2 = this.dy = (dy / zoom) * root.dpi;
    const selected = this.selected;
    // 操作控制尺寸的时候，已经mousedown了
    if (this.isControl) {
      selected.forEach((node, i) => {
        const prev: Partial<JStyle> = {};
        const next: Partial<JStyle> = {};
        const { style } = node;
        const computedStyle = this.computedStyle[i];
        const cssStyle = this.cssStyle[i];
        if (
          this.controlType === 't' ||
          this.controlType === 'tl' ||
          this.controlType === 'tr'
        ) {
          // top为确定值则修改它，还要看height是否是确定值也一并修改
          if (
            style.top.u === StyleUnit.PX ||
            style.top.u === StyleUnit.PERCENT
          ) {
            if (style.top.u === StyleUnit.PX) {
              next.top = computedStyle.top + dy2;
            }
            else {
              next.top =
                ((computedStyle.top + dy2) * 100) / node.parent!.height + '%';
            }
            if (style.height.u === StyleUnit.PX ||
              // 只有top定位的自动高度文本
              style.height.u === StyleUnit.AUTO && style.bottom.u === StyleUnit.AUTO) {
              next.height = computedStyle.height - dy2;
            }
            else if (style.height.u === StyleUnit.PERCENT) {
              next.height =
                ((computedStyle.height - dy2) * 100) / node.parent!.height + '%';
            }
          }
          // top为自动，高度则为确定值修改，根据bottom定位
          else if (
            style.height.u === StyleUnit.PX ||
            style.height.u === StyleUnit.PERCENT ||
            // top和height均为auto，只有人工bottom定位文本
            style.height.u === StyleUnit.AUTO
          ) {
            if (style.height.u === StyleUnit.PX || style.height.u === StyleUnit.AUTO) {
              next.height = computedStyle.height - dy2;
            }
            else {
              next.height =
                ((computedStyle.height - dy2) * 100) / node.parent!.height + '%';
            }
          }
        }
        else if (
          this.controlType === 'b' ||
          this.controlType === 'bl' ||
          this.controlType === 'br'
        ) {
          // bottom为确定值则修改它，还要看height是否是确定值也一并修改
          if (
            style.bottom.u === StyleUnit.PX ||
            style.bottom.u === StyleUnit.PERCENT
          ) {
            if (style.bottom.u === StyleUnit.PX) {
              next.bottom = computedStyle.bottom - dy2;
            }
            else {
              next.bottom =
                ((computedStyle.bottom - dy2) * 100) / node.parent!.height + '%';
            }
            if (style.height.u === StyleUnit.PX ||
              // 只有bottom定位的自动高度文本
            style.height.u === StyleUnit.AUTO && style.top.u === StyleUnit.AUTO) {
              next.height = computedStyle.height + dy2;
            }
            else if (style.height.u === StyleUnit.PERCENT) {
              next.height =
                ((computedStyle.height + dy2) * 100) / node.parent!.height + '%';
            }
          }
          // bottom为自动，高度则为确定值修改，根据top定位
          else if (
            style.height.u === StyleUnit.PX ||
            style.height.u === StyleUnit.PERCENT ||
            style.height.u === StyleUnit.AUTO
          ) {
            if (style.height.u === StyleUnit.PX || style.height.u === StyleUnit.AUTO) {
              next.height = computedStyle.height + dy2;
            }
            else {
              next.height =
                ((computedStyle.height + dy2) * 100) / node.parent!.height + '%';
            }
          }
        }
        if (
          this.controlType === 'l' ||
          this.controlType === 'tl' ||
          this.controlType === 'bl'
        ) {
          // left为确定值则修改它，还要看width是否是确定值也一并修改
          if (
            style.left.u === StyleUnit.PX ||
            style.left.u === StyleUnit.PERCENT
          ) {
            if (style.left.u === StyleUnit.PX) {
              next.left = computedStyle.left + dx2;
            }
            else {
              next.left =
                ((computedStyle.left + dx2) * 100) / node.parent!.width + '%';
            }
            if (style.width.u === StyleUnit.PX ||
              // 只有left定位的自动宽度文本
              style.width.u === StyleUnit.AUTO && style.right.u === StyleUnit.AUTO) {
              next.width = computedStyle.width - dx2;
            }
            else if (style.width.u === StyleUnit.PERCENT) {
              next.width =
                ((computedStyle.width - dx2) * 100) / node.parent!.width + '%';
            }
          }
          // left为自动，宽度则为确定值修改，根据right定位
          else if (
            style.width.u === StyleUnit.PX ||
            style.width.u === StyleUnit.PERCENT ||
            // left和width均为auto，只有人工right定位文本
            style.width.u === StyleUnit.AUTO
          ) {
            if (style.width.u === StyleUnit.PX || style.width.u === StyleUnit.AUTO) {
              next.width = computedStyle.width - dx2;
            }
            else {
              next.width =
                ((computedStyle.width - dx2) * 100) / node.parent!.width + '%';
            }
          }
        }
        else if (
          this.controlType === 'r' ||
          this.controlType === 'tr' ||
          this.controlType === 'br'
        ) {
          // right为确定值则修改它，还要看width是否是确定值也一并修改
          if (
            style.right.u === StyleUnit.PX ||
            style.right.u === StyleUnit.PERCENT
          ) {
            if (style.right.u === StyleUnit.PX) {
              next.right = computedStyle.right - dx2;
            }
            else {
              next.right =
                ((computedStyle.right - dx2) * 100) / node.parent!.width + '%';
            }
            if (style.width.u === StyleUnit.PX ||
              // 只有right定位的自动宽度文本
              style.width.u === StyleUnit.AUTO && style.left.u === StyleUnit.AUTO) {
              next.width = computedStyle.width + dx2;
            }
            else if (style.width.u === StyleUnit.PERCENT) {
              next.width =
                ((computedStyle.width + dx2) * 100) / node.parent!.width + '%';
            }
          }
          // right为自动，宽度则为确定值修改，根据left定位
          else if (
            style.width.u === StyleUnit.PX ||
            style.width.u === StyleUnit.PERCENT ||
            // right和width均auto，只有自动宽度文本，修改为定宽
            style.width.u === StyleUnit.AUTO
          ) {
            if (style.width.u === StyleUnit.PX || style.width.u === StyleUnit.AUTO) {
              next.width = computedStyle.width + dx2;
            }
            else {
              next.width =
                ((computedStyle.width + dx2) * 100) / node.parent!.width + '%';
            }
          }
        }
        node.updateStyle(next);
        Object.keys(next).forEach((k) => {
          // @ts-ignore
          prev[k] = cssStyle[k as keyof JStyle];
        });
        this.updateStyle[i] = { prev, next };
        this.hasControl = true;
      });
      this.select.updateSelect(selected);
      this.emit(Listener.RESIZE_NODE, selected.slice(0));
    }
    // 先看是否编辑文字决定选择一段文本，再看是否有选择节点决定是拖拽节点还是多选框
    else if (this.isMouseDown) {
      this.isMouseMove = true;
      if (this.state === State.EDIT_TEXT) {
        const x = (e.pageX - this.originX) * dpi;
        const y = (e.pageY - this.originY) * dpi;
        const text = selected[0] as Text;
        text.setCursorEndByAbsCoord(x, y);
        this.input.hideCursor();
      }
      else {
        if (selected.length) {
          selected.forEach((node, i) => {
            const computedStyle = this.computedStyle[i];
            /**
             * 这里用computedStyle的translate差值做计算，得到当前的translate的px值updateStyle给node，
             * 在node的calMatrix那里是优化过的计算方式，只有translate变更的话也是只做差值计算，更快。
             * 需要注意目前matrix的整体计算是将布局信息TRLB换算为translate，因此style上的原始值和更新的这个px值并不一致，
             * 如果涉及到相关的读取写入话要注意换算，这里没有涉及到，updateStyle会同步将translate写会布局TRLB的style上满足功能要求。
             */
            const o = {
              translateX: computedStyle.translateX + dx2,
              translateY: computedStyle.translateY + dy2,
            };
            node.updateStyle(o);
            this.updateStyle[i] = {
              prev: {
                translateX: computedStyle.translateX,
                translateY: computedStyle.translateY,
              },
              next: o,
            };
          });
          this.select.updateSelect(selected);
          this.emit(Listener.MOVE_NODE, selected.slice(0));
        }
        else {
          // TODO 框选
        }
      }
    }
    // 普通的hover
    else {
      const node = root.getNode(
        (e.pageX - this.originX) * dpi,
        (e.pageY - this.originY) * dpi,
        this.metaKey,
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

  onMouseMove(e: MouseEvent) {
    const root = this.root;
    const dpi = root.dpi;
    const selected = this.selected;
    // 空格拖拽画布
    if (this.spaceKey) {
      if (this.isMouseDown) {
        this.select.hideHover();
        this.isMouseMove = true;
        const page = root.getCurPage();
        if (page) {
          const dx = e.pageX - this.startX;
          const dy = e.pageY - this.startY;
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
        const node = root.getNode(
          (e.pageX - this.originX) * dpi,
          (e.pageY - this.originY) * dpi,
          this.metaKey,
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
      this.onMove(e);
    }
  }

  onMouseUp() {
    const selected = this.selected;
    if (this.isControl) {
      this.isControl = false;
      // 还原artBoard的children为初始值
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
      selected.forEach((node, i) => {
        // 调整之前锁住的group，结束后统一进行解锁
        const p = node.parent;
        if (p && p.isGroup && p instanceof Group) {
          p.fixedPosAndSize = false;
        }
        // 还原最初的translate/TRBL值
        const prev = this.sizeChangeStyle[i];
        node.endSizeChange(prev);
        // 有调整尺寸的话，向上检测组的自适应尺寸
        if (this.hasControl) {
          node.checkPosSizeUpward();
          const o = this.updateStyle[i];
          if (o) {
            History.getInstance().addCommand(new UpdateStyleCommand(node, o));
          }
        }
      });
      this.hasControl = false;
    }
    else if (this.isMouseMove) {
      // 编辑文字检查是否选择了一段文本，普通则是移动选择节点
      if (this.state === State.EDIT_TEXT) {
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
      else {
        selected.forEach((node, i) => {
          // 调整之前锁住的group，结束后统一进行解锁
          const p = node.parent;
          if (p && p.isGroup && p instanceof Group) {
            p.fixedPosAndSize = false;
          }
          // 还原最初的translate/TRBL值
          node.endPosChange(this.originStyle[i], this.dx, this.dy);
          node.checkPosSizeUpward();
          const o = this.updateStyle[i];
          if (o) {
            History.getInstance().addCommand(new UpdateStyleCommand(node, o));
          }
        });
      }
    }
    this.isMouseDown = false;
    this.isMouseMove = false;
    if (this.spaceKey) {
      this.dom.style.cursor = 'grab';
    }
    else {
      this.dom.style.cursor = 'auto';
    }
  }

  onMouseLeave() {
    this.select.hideHover();
  }

  onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) {
      return;
    }
    const touch = e.touches[0];
    this.isMouseDown = true;
    this.isMouseMove = false;
    this.startX = touch.pageX;
    this.startY = touch.pageY;
    const target = e.target as HTMLElement;
    this.onDown(target, touch);
  }

  onTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1) {
      return;
    }
    this.onMove(e.touches[0]);
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
    let node = root.getNode(
      (e.pageX - this.originX) * dpi,
      (e.pageY - this.originY) * dpi,
      this.metaKey,
      this.selected,
      true,
    );
    if (node) {
      if (this.selected.length !== 1 || node !== this.selected[0]) {
        this.selected.splice(0);
        this.selected.push(node);
        this.select.showSelect(this.selected);
      }
      if (node instanceof Text) {
        this.input.show(
          node,
          e.pageX - this.originX,
          e.pageY - this.originY,
        );
        node.hideSelectArea();
        this.state = State.EDIT_TEXT;
      }
    }
    else {
      this.select.hideSelect();
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
      let sc = 0;
      if (e.deltaY < 0) {
        if (e.deltaY < -400) {
          sc = 0.1;
        }
        else if (e.deltaY < -200) {
          sc = 0.08;
        }
        else if (e.deltaY < -100) {
          sc = 0.05;
        }
        else if (e.deltaY < -50) {
          sc = 0.02;
        }
        else {
          sc = 0.01;
        }
      }
      else if (e.deltaY > 0) {
        if (e.deltaY > 400) {
          sc = -0.1;
        }
        else if (e.deltaY > 200) {
          sc = -0.08;
        }
        else if (e.deltaY > 100) {
          sc = -0.05;
        }
        else if (e.deltaY > 50) {
          sc = -0.02;
        }
        else {
          sc = -0.01;
        }
      }
      const x = (e.pageX - this.originX) * dpi / width;
      const y = (e.pageY - this.originY) * dpi / height;
      let scale = page.getZoom(true);
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
    // back
    if (e.keyCode === 8) {
      if (this.selected.length) {
        const list = this.selected.splice(0);
        list.forEach((item) => item.remove());
        this.emit(Listener.REMOVE_NODE, list);
        this.select.hideSelect();
      }
    }
    // space
    else if (e.keyCode === 32) {
      this.spaceKey = true;
      if (!this.isMouseDown) {
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
      else {
        this.selected.splice(0);
        this.select.hideSelect();
        this.emit(Listener.SELECT_NODE, this.selected.slice(0));
      }
    }
    // z，undo/redo
    else if (e.keyCode === 90) {
      if (this.metaKey && this.shiftKey) {
        const c = History.getInstance().redo();
        if (c) {
          if (c instanceof UpdateStyleCommand) {
            this.updateActive();
          }
        }
      }
      else if (this.metaKey) {
        const c = History.getInstance().undo();
        if (c) {
          if (c instanceof UpdateStyleCommand) {
            this.updateActive();
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

    this.select.destroy();
  }

  static HOVER_NODE = 'HOVER_NODE';
  static UN_HOVER_NODE = 'UN_HOVER_NODE';
  static SELECT_NODE = 'SELECT_NODE';
  static RESIZE_NODE = 'RESIZE_NODE';
  static MOVE_NODE = 'MOVE_NODE';
  static REMOVE_NODE = 'REMOVE_NODE';
  static ZOOM_PAGE = 'ZOOM_PAGE';
  static CONTEXT_MENU = 'CONTEXT_MENU';
}
