import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import BasicPanel from './BasicPanel';
import OpacityPanel from './OpacityPanel';

class Panel {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  basicPanel: BasicPanel;
  opacityPanel: OpacityPanel;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    this.basicPanel = new BasicPanel(root, dom);
    this.basicPanel.show(listener.selected);

    this.opacityPanel = new OpacityPanel(root, dom);
    this.opacityPanel.show(listener.selected);

    listener.on(Listener.SELECT_NODE, (nodes: Node[]) => {
      this.select(nodes);
    });
  }

  select(nodes: Node[]) {
    this.basicPanel.show(nodes);
    this.opacityPanel.show(nodes);
  }
}

export default Panel;
