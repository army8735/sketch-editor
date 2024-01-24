import Root from '../node/Root';
import Node from '../node/Node';
import Select from './Select';
import Event from '../util/Event';

enum Status {
  NONE = 0,
}

export default class Listener extends Event {
  status: Status;
  root: Root;
  dom: HTMLElement;
  metaKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  spaceKey: boolean;
  isMouseDown: boolean;
  isMouseMove: boolean;
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  pageTx: number;
  pageTy: number;
  select: Select;
  selected: Node[];

  constructor(root: Root, dom: HTMLElement) {
    super();
    this.status = Status.NONE;
    this.root = root;
    this.dom = dom;

    this.metaKey = false;
    this.shiftKey = false;
    this.ctrlKey = false;
    this.altKey = false;
    this.spaceKey = false;

    this.isMouseDown = false;
    this.isMouseMove = false;

    const o = dom.getBoundingClientRect();
    this.originX = o.left;
    this.originY = o.top;
    this.startX = 0;
    this.startY = 0;
    this.pageTx = 0;
    this.pageTy = 0;
    this.selected = [];

    this.select = new Select(root, dom);

    dom.addEventListener('mousedown', this.onMouseDown.bind(this));
    dom.addEventListener('mousemove', this.onMouseMove.bind(this));
    dom.addEventListener('mouseup', this.onMouseUp.bind(this));
    dom.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    dom.addEventListener('click', this.onClick.bind(this));
    dom.addEventListener('wheel', this.onWheel.bind(this));
    dom.addEventListener('contextmenu', this.onContextMenu.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  onMouseDown(e: MouseEvent) {
    const root = this.root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    const dpi = root.dpi;
    // 左键
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
      // 普通按下是选择节点或者编辑文本
      else {
        let node = root.getNode(
          (e.pageX - this.originX) * dpi,
          (e.pageY - this.originY) * dpi,
          this.metaKey,
          this.selected,
        );
        if (node) {
          const i = this.selected.indexOf(node);
          if (i > -1) {
            if (this.shiftKey) {
              this.selected.splice(i, 1);
            }
          } else {
            if (!this.shiftKey) {
              this.selected.splice(0);
            }
            this.selected.push(node);
          }
        } else {
          this.selected.splice(0);
        }
        if (this.selected.length) {
          this.select.showSelect(this.selected);
        } else {
          this.select.hideSelect();
        }
        this.select.hideHover();
        this.emit(Listener.SELECT_NODE, this.selected);
      }
    }
  }

  onMouseMove(e: MouseEvent) {
    const root = this.root;
    const dpi = root.dpi;
    const isOnControl = this.select.isSelectDom(e.target as HTMLElement);
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
      } else if (isOnControl) {
        this.select.hideHover();
      } else {}
    }
    // 其它看情况点选
    else {
      if (!this.metaKey && isOnControl) {
        return;
      }
      const node = root.getNode(
        (e.pageX - this.originX) * dpi,
        (e.pageY - this.originY) * dpi,
        this.metaKey,
        this.selected,
      );
      if (node) {
        if (this.selected.indexOf(node) === -1) {
          this.select.showHover(node);
        }
      } else {
        this.select.hideHover();
      }
    }
  }

  onMouseUp() {
    this.isMouseDown = false;
    this.isMouseMove = false;
    if (this.spaceKey) {
      this.dom.style.cursor = 'grab';
    } else {
      this.dom.style.cursor = 'auto';
    }
  }

  onMouseLeave(e: MouseEvent) {
    this.select.hideHover();
  }

  onClick(e: MouseEvent) {}

  onWheel(e: WheelEvent) {
    const root = this.root;
    const { dpi, width, height } = root;
    const page = root.getCurPage();
    if (!page) {
      return;
    }
    this.select.hideHover();
    // 按下时缩放
    if (this.metaKey) {
      let sc = 0;
      if (e.deltaY < 0) {
        if (e.deltaY < -400) {
          sc = -0.1;
        } else if (e.deltaY < -200) {
          sc = -0.08;
        } else if (e.deltaY < -100) {
          sc = -0.05;
        } else if (e.deltaY < -50) {
          sc = -0.02;
        } else {
          sc = -0.01;
        }
      } else if (e.deltaY > 0) {
        if (e.deltaY > 400) {
          sc = 0.1;
        } else if (e.deltaY > 200) {
          sc = 0.08;
        } else if (e.deltaY > 100) {
          sc = 0.05;
        } else if (e.deltaY > 50) {
          sc = 0.02;
        } else {
          sc = 0.01;
        }
      }
      const x = (e.pageX * dpi) / width;
      const y = (e.pageY * dpi) / height;
      let scale = page.getZoom(true);
      scale += sc;
      if (scale > 32) {
        scale = 32;
      } else if (scale < 0.01) {
        scale = 0.01;
      }
      root.zoomTo(scale, x, y);
      this.emit(Listener.ZOOM_PAGE, scale);
    }
    // 滚轮+shift状态是移动
    else {
      let sc = 0;
      if (this.shiftKey) {
        if (e.deltaX < 0) {
          if (e.deltaX < -200) {
            sc = 50;
          } else if (e.deltaX < -100) {
            sc = 40;
          } else if (e.deltaX < -50) {
            sc = 30;
          } else if (e.deltaX < -20) {
            sc = 20;
          } else {
            sc = 10;
          }
        } else if (e.deltaX > 0) {
          if (e.deltaX > 200) {
            sc = -50;
          } else if (e.deltaX > 100) {
            sc = -40;
          } else if (e.deltaX > 50) {
            sc = -30;
          } else if (e.deltaX > 20) {
            sc = -20;
          } else {
            sc = -10;
          }
        }
        const { translateX } = page.getComputedStyle();
        page.updateStyle({
          translateX: translateX + sc,
        });
      } else {
        if (e.deltaY < 0) {
          if (e.deltaY < -200) {
            sc = 50;
          } else if (e.deltaY < -100) {
            sc = 40;
          } else if (e.deltaY < -50) {
            sc = 30;
          } else if (e.deltaY < -20) {
            sc = 20;
          } else {
            sc = 10;
          }
        } else if (e.deltaY > 0) {
          if (e.deltaY > 200) {
            sc = -50;
          } else if (e.deltaY > 100) {
            sc = -40;
          } else if (e.deltaY > 50) {
            sc = -30;
          } else if (e.deltaY > 20) {
            sc = -20;
          } else {
            sc = -10;
          }
        }
        const { translateY } = page.getComputedStyle();
        page.updateStyle({
          translateY: translateY + sc,
        });
      }
    }
    this.updateSelected();
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
    if (e.keyCode === 8) {}
    // space
    else if (e.keyCode === 32) {
      this.spaceKey = true;
      if (!this.isMouseDown) {
        this.dom.style.cursor = 'grab';
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
    this.dom.removeEventListener('wheel', this.onWheel);
    this.dom.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);

    this.select.destroy();
  }

  static SELECT_NODE = 'SELECT_NODE';
  static ZOOM_PAGE = 'ZOOM_PAGE';
  static CONTEXT_MENU = 'CONTEXT_MENU';
}
