import Root from '../node/Root';
import Node from '../node/Node';
import Select from './Select';

enum Status {
  NONE = 0,
}

export default class Listener {
  status: Status;
  root: Root;
  dom: HTMLElement;
  metaKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  spaceKey: boolean;
  node: Node | undefined;
  select: Select;

  constructor(root: Root, dom: HTMLElement) {
    this.status = Status.NONE;
    this.root = root;
    this.dom = dom;

    this.metaKey = false;
    this.shiftKey = false;
    this.ctrlKey = false;
    this.altKey = false;
    this.spaceKey = false;

    this.select = new Select(root, dom);

    dom.addEventListener('mousedown', this.onDown.bind(this));
    dom.addEventListener('mousemove', this.onMove.bind(this));
    dom.addEventListener('mouseup', this.onUp.bind(this));
    dom.addEventListener('click', this.onClick.bind(this));
    dom.addEventListener('wheel', this.onWheel.bind(this));
  }

  onDown(e: MouseEvent) {
  }

  onMove(e: MouseEvent) {
    const root = this.root;
    const node = root.getNodeFromCurPage(
      e.offsetX * root.dpi,
      e.offsetY * root.dpi,
      !this.metaKey,
      this.metaKey,
      this.metaKey ? undefined : 1,
    );
    if (node) {
      if (this.node === node) {
        this.select.updateHover(node);
      } else {
        this.select.showHove(node);
      }
    } else {
      this.select.hideHove();
    }
    this.node = node;
  }

  onUp(e: MouseEvent) {
  }

  onClick(e: MouseEvent) {}

  onWheel(e: WheelEvent) {
  }

  destroy() {
    this.dom.removeEventListener('mousedown', this.onDown);
    this.dom.removeEventListener('mousemove', this.onMove);
    this.dom.removeEventListener('mouseup', this.onUp);
    this.dom.removeEventListener('click', this.onClick);
    this.dom.removeEventListener('wheel', this.onWheel);

    this.select.destroy();
  }
}
