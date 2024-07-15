import Root from '../node/Root';
import Listener from './Listener';
import Node from '../node/Node';

class Panel {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  nodes: Node[];

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;
    this.nodes = [];
  }
}

export default Panel;
