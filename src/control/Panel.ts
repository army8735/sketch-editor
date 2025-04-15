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

    listener.on([
      Listener.SELECT_NODE,
      // Listener.ADD_NODE,
      // Listener.GROUP_NODE,
      // Listener.BOOL_GROUP_NODE,
    ], (nodes: Node[]) => {
      // 输入的时候，防止重复触发；选择/undo/redo的时候则更新显示
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
    // listener.on([Listener.UN_GROUP_NODE, Listener.UN_BOOL_GROUP_NODE], (nodes: Node[][]) => {
    //   const list: Node[] = [];
    //   nodes.forEach(item => {
    //     list.push(...item);
    //   });
    //   this.show(list);
    // });
    listener.on(Listener.REMOVE_NODE, () => {
      if (this.silence) {
        return;
      }
      this.show([]);
    });
  }

  show(nodes: Node[]) {
    this.nodes = nodes;
  }
}

export default Panel;
