import Node from '../node/Node';
import Root from '../node/Root';
import Page from '../node/Page';
import Text from '../node/Text';
import ArtBoard from '../node/ArtBoard';
import { ComputedStyle, StyleUnit } from '../style/define';
import Event from '../util/Event';
import Select from './Select';
import Input from './Input';

enum State {
  NORMAL = 0,
  EDIT_TEXT = 1,
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
  controlType: string;
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  pageTx: number;
  pageTy: number;
  select: Select;
  selected: Node[];
  computedStyle: ComputedStyle[];
  input: Input;

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
    this.selected = [];
    this.computedStyle = [];
    this.updateOrigin();

    this.select = new Select(root, dom);
    this.input = new Input(root, dom, this.select);

    dom.addEventListener('mousedown', this.onMouseDown.bind(this));
    dom.addEventListener('mousemove', this.onMouseMove.bind(this));
    dom.addEventListener('mouseup', this.onMouseUp.bind(this));
    dom.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    dom.addEventListener('click', this.onClick.bind(this));
    dom.addEventListener('dblclick', this.onDblClick.bind(this));
    dom.addEventListener('wheel', this.onWheel.bind(this));
    dom.addEventListener('contextmenu', this.onContextMenu.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  updateOrigin() {
    const o = this.dom.getBoundingClientRect();
    this.originX = o.left;
    this.originY = o.top;
  }

  active(nodes: Node[]) {
    this.selected.splice(0);
    this.selected.push(...nodes);
    this.computedStyle = this.selected.map((item) =>
      item.getComputedStyle(),
    );
    if (this.selected.length) {
      this.select.showSelect(this.selected);
    } else {
      this.select.hideSelect();
    }
    this.emit(Listener.SELECT_NODE, this.selected);
  }

  onMouseDown(e: MouseEvent) {
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    const dpi = root.dpi;
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
        const isControl = this.select.isSelectControlDom(target);
        if (isControl) {
          this.isControl = isControl;
          this.controlType = target.className;
          this.startX = e.pageX;
          this.startY = e.pageY;
          this.computedStyle = this.selected.map((item) =>
            item.getComputedStyle(),
          );
          if (this.state === State.EDIT_TEXT) {
            this.state = State.NORMAL;
            this.input.hide();
          }
        } else {
          const x = (e.pageX - this.originX) * dpi;
          const y = (e.pageY - this.originY) * dpi;
          let node = root.getNode(
            x,
            y,
            this.metaKey,
            this.selected,
            false,
          );
          if (node) {
            const i = this.selected.indexOf(node);
            if (i > -1) {
              if (this.shiftKey) {
                this.selected.splice(i, 1);
              } else {
                // 持续编辑更新文本的编辑光标并提前退出
                if (this.state === State.EDIT_TEXT) {
                  const text = this.selected[0] as Text;
                  text.hideSelectArea();
                  text.setCursorStartByAbsCoord(x, y);
                  this.input.update(
                    e.pageX - this.originX,
                    e.pageY - this.originY
                  );
                  this.input.showCursor();
                  // 防止触发click事件失焦
                  e.preventDefault();
                  return;
                }
                if (this.selected.length === 1 && this.selected[0] === node) {
                  this.computedStyle = this.selected.map((item) =>
                    item.getComputedStyle(),
                  );
                  return;
                }
                this.selected = [node];
              }
            } else {
              if (!this.shiftKey) {
                this.selected.splice(0);
              }
              this.selected.push(node);
            }
          } else {
            // 没有选中节点，但当前在编辑某个文本节点时，变为非编辑选择状态，此时已选的就是唯一文本节点，不用清空
            if (this.state === State.EDIT_TEXT) {
              const text = this.selected[0] as Text;
              text.hideSelectArea();
            } else {
              this.selected.splice(0);
            }
          }
          // 一定是退出文本的编辑状态，持续编辑文本在前面逻辑会提前跳出
          if (this.state === State.EDIT_TEXT) {
            this.state = State.NORMAL;
            this.input.hide();
          }
          this.select.hideHover();
          if (this.selected.length) {
            this.select.showSelect(this.selected);
          } else {
            this.select.hideSelect();
          }
          this.computedStyle = this.selected.map((item) =>
            item.getComputedStyle(),
          );
          this.emit(Listener.SELECT_NODE, this.selected);
        }
      }
    }
  }

  onMouseMove(e: MouseEvent) {
    const root = this.root;
    const dpi = root.dpi;
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
          if (this.selected.length) {
            this.select.updateSelect(this.selected);
          }
        }
      } else {
        const node = root.getNode(
          (e.pageX - this.originX) * dpi,
          (e.pageY - this.originY) * dpi,
          this.metaKey,
          this.selected,
          false,
        );
        if (node) {
          if (this.selected.indexOf(node) === -1) {
            this.select.showHover(node);
          }
          this.emit(Listener.HOVER_NODE, node);
        } else {
          this.select.hideHover();
          this.emit(Listener.UN_HOVER_NODE);
        }
      }
    }
    // 其它看情况点选
    else {
      const dx = e.pageX - this.startX;
      const dy = e.pageY - this.startY;
      const page = root.getCurPage();
      const zoom = page!.getZoom();
      const dx2 = (dx / zoom) * root.dpi;
      const dy2 = (dy / zoom) * root.dpi;
      // 操作控制尺寸的时候，已经mousedown了
      if (this.isControl) {
        this.selected.forEach((node, i) => {
          const o: any = {};
          const { style } = node;
          const computedStyle = this.computedStyle[i];
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
                o.top = computedStyle.top + dy2;
              } else {
                o.top =
                  ((computedStyle.top + dy2) * 100) / node.parent!.height + '%';
              }
              if (style.height.u === StyleUnit.PX) {
                o.height = computedStyle.height - dy2;
              } else if (style.height.u === StyleUnit.PERCENT) {
                o.height =
                  ((computedStyle.height - dy2) * 100) / node.parent!.height +
                  '%';
              }
            }
            // top为自动，高度则为确定值修改，根据bottom定位
            else if (
              style.height.u === StyleUnit.PX ||
              style.height.u === StyleUnit.PERCENT
            ) {
              if (style.height.u === StyleUnit.PX) {
                o.height = computedStyle.height - dy2;
              } else {
                o.height =
                  ((computedStyle.height - dy2) * 100) / node.parent!.height +
                  '%';
              }
            }
          } else if (
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
                o.bottom = computedStyle.bottom - dy2;
              } else {
                o.bottom =
                  ((computedStyle.bottom - dy2) * 100) / node.parent!.height +
                  '%';
              }
              if (style.height.u === StyleUnit.PX) {
                o.height = computedStyle.height + dy2;
              } else if (style.height.u === StyleUnit.PERCENT) {
                o.height =
                  ((computedStyle.height + dy2) * 100) / node.parent!.height +
                  '%';
              }
            }
            // bottom为自动，高度则为确定值修改，根据top定位
            else if (
              style.height.u === StyleUnit.PX ||
              style.height.u === StyleUnit.PERCENT
            ) {
              if (style.height.u === StyleUnit.PX) {
                o.height = computedStyle.height + dy2;
              } else {
                o.height =
                  ((computedStyle.height + dy2) * 100) / node.parent!.height +
                  '%';
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
                o.left = computedStyle.left + dx2;
              } else {
                o.left =
                  ((computedStyle.left + dx2) * 100) / node.parent!.width + '%';
              }
              if (style.width.u === StyleUnit.PX) {
                o.width = computedStyle.width - dx2;
              } else if (style.width.u === StyleUnit.PERCENT) {
                o.width =
                  ((computedStyle.width - dx2) * 100) / node.parent!.width +
                  '%';
              }
            }
            // left为自动，宽度则为确定值修改，根据right定位
            else if (
              style.width.u === StyleUnit.PX ||
              style.width.u === StyleUnit.PERCENT
            ) {
              if (style.width.u === StyleUnit.PX) {
                o.width = computedStyle.width - dx2;
              } else {
                o.width =
                  ((computedStyle.width - dx2) * 100) / node.parent!.width +
                  '%';
              }
            }
          } else if (
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
                o.right = computedStyle.right - dx2;
              } else {
                o.right =
                  ((computedStyle.right - dx2) * 100) / node.parent!.width +
                  '%';
              }
              if (style.width.u === StyleUnit.PX) {
                o.width = computedStyle.width + dx2;
              } else if (style.width.u === StyleUnit.PERCENT) {
                o.width =
                  ((computedStyle.width + dx2) * 100) / node.parent!.width +
                  '%';
              }
            }
            // right为自动，高度则为确定值修改，根据left定位
            else if (
              style.width.u === StyleUnit.PX ||
              style.width.u === StyleUnit.PERCENT
            ) {
              if (style.width.u === StyleUnit.PX) {
                o.width = computedStyle.width + dx2;
              } else {
                o.width =
                  ((computedStyle.width + dx2) * 100) / node.parent!.width +
                  '%';
              }
            }
          }
          node.updateStyle(o);
        });
        this.select.updateSelect(this.selected);
        this.emit(Listener.RESIZE_NODE, this.selected);
      }
      // 先看是否编辑文字决定选择一段文本，再看是否有选择节点决定是拖拽节点还是多选框
      else if (this.isMouseDown) {
        this.isMouseMove = true;
        if (this.state === State.EDIT_TEXT) {
          const x = (e.pageX - this.originX) * dpi;
          const y = (e.pageY - this.originY) * dpi;
          const text = this.selected[0] as Text;
          text.setCursorEndByAbsCoord(x, y);
          this.input.hideCursor();
        } else {
          if (this.selected.length) {
            this.selected.forEach((node, i) => {
              const computedStyle = this.computedStyle[i];
              node.updateStyle({
                translateX: computedStyle.translateX + dx2,
                translateY: computedStyle.translateY + dy2,
              });
            });
            this.select.updateSelect(this.selected);
            this.emit(Listener.MOVE_NODE, this.selected);
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
          this.selected,
          false,
        );
        if (node) {
          if (this.selected.indexOf(node) === -1) {
            this.select.showHover(node);
          }
          this.emit(Listener.HOVER_NODE, node);
        } else {
          this.select.hideHover();
          this.emit(Listener.UN_HOVER_NODE);
        }
      }
    }
  }

  onMouseUp() {
    if (this.isControl) {
      this.isControl = false;
      if (this.isMouseMove) {
        this.selected.forEach((node) => {
          node.checkSizeChange();
        });
      }
    } else if (this.isMouseMove) {
      // 编辑文字检查是否选择了一段文本，普通则是移动选择节点
      if (this.state === State.EDIT_TEXT) {
        const text = this.selected[0] as Text;
        const multi = text.checkCursorMulti();
        // 可能框选的文字为空不是多选，需取消
        if (!multi) {
          this.input.updateCurCursor();
          this.input.showCursor();
        } else {
          this.input.hideCursor();
        }
        this.input.focus();
      } else {
        this.selected.forEach((node) => {
          node.checkPosChange();
        });
      }
    }
    this.isMouseDown = false;
    this.isMouseMove = false;
    if (this.spaceKey) {
      this.dom.style.cursor = 'grab';
    } else {
      this.dom.style.cursor = 'auto';
    }
  }

  onMouseLeave() {
    this.select.hideHover();
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
    } else {
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
        } else if (e.deltaY < -200) {
          sc = 0.08;
        } else if (e.deltaY < -100) {
          sc = 0.05;
        } else if (e.deltaY < -50) {
          sc = 0.02;
        } else {
          sc = 0.01;
        }
      } else if (e.deltaY > 0) {
        if (e.deltaY > 400) {
          sc = -0.1;
        } else if (e.deltaY > 200) {
          sc = -0.08;
        } else if (e.deltaY > 100) {
          sc = -0.05;
        } else if (e.deltaY > 50) {
          sc = -0.02;
        } else {
          sc = -0.01;
        }
      }
      const x = (e.pageX - this.originX) * dpi / width;
      const y = (e.pageY - this.originY) * dpi / height;
      let scale = page.getZoom(true);
      scale += sc;
      if (scale > 32) {
        scale = 32;
      } else if (scale < 0.01) {
        scale = 0.01;
      }
      root.zoomTo(scale, x, y);
      this.emit(Listener.ZOOM_PAGE, scale);
    } else {
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
        list.forEach(item => item.remove());
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
        this.selected = [node];
        this.select.updateSelect(this.selected);
        this.emit(Listener.SELECT_NODE, this.selected);
      }
    }
    // esc，编辑文字回到普通，普通取消选择
    else if (e.keyCode === 27) {
      if (this.state === State.EDIT_TEXT) {
        this.state = State.NORMAL;
        this.input.hide();
      } else {
        this.selected = [];
        this.select.hideSelect();
        this.emit(Listener.SELECT_NODE, this.selected);
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
