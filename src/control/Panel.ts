import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import BasicPanel from './BasicPanel';

class Panel {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  basicPanel: BasicPanel;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    this.basicPanel = new BasicPanel(root, dom);
    this.basicPanel.show(listener.selected);

    listener.on(Listener.SELECT_NODE, (nodes: Node[]) => {
      this.select(nodes);
    });
  }

  select(nodes: Node[]) {
    this.basicPanel.show(nodes);
  }
}

export default Panel;
