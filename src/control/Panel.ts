import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import BasicPanel from './BasicPanel';
import OpacityPanel from './OpacityPanel';
import RoundPanel from './RoundPanel';
import FillPanel from './FillPanel';
import StrokePanel from './StrokePanel';
import TextPanel from './TextPanel';

class Panel {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  basicPanel: BasicPanel;
  opacityPanel: OpacityPanel;
  roundPanel: RoundPanel;
  fillPanel: FillPanel;
  strokePanel: StrokePanel;
  textPanel: TextPanel;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    this.basicPanel = new BasicPanel(root, dom, listener);
    this.basicPanel.show(listener.selected);

    this.opacityPanel = new OpacityPanel(root, dom);
    this.opacityPanel.show(listener.selected);

    this.roundPanel = new RoundPanel(root, dom);
    this.roundPanel.show(listener.selected);

    this.fillPanel = new FillPanel(root, dom);
    this.fillPanel.show(listener.selected);

    this.strokePanel = new StrokePanel(root, dom);
    this.strokePanel.show(listener.selected);

    this.textPanel = new TextPanel(root, dom);
    this.textPanel.show(listener.selected);

    listener.on(Listener.SELECT_NODE, (nodes: Node[]) => {
      this.select(nodes);
    });
  }

  select(nodes: Node[]) {
    this.basicPanel.show(nodes);
    this.opacityPanel.show(nodes);
    this.roundPanel.show(nodes);
    this.fillPanel.show(nodes);
    this.strokePanel.show(nodes);
    this.textPanel.show(nodes);
  }
}

export default Panel;
