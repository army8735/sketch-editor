import Root from '../node/Root';
import Listener from './Listener';
import Node from '../node/Node';

class Panel {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  nodes: Node[];
  silence: boolean; // input更新触发listener的事件，避免循环侦听更新前静默标识不再侦听

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;
    this.nodes = [];
    this.silence = false;
  }
}

export default Panel;
