import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import AbstractGroup from '../node/AbstractGroup';
import { moveAfter, moveAppend, moveBefore } from '../tool/node';
import config from '../util/config';
import Container from '../node/Container';

export type position = 'before' | 'after' | 'append';

export type PositionData = {
  el: HTMLElement;
  sel: HTMLElement; // source原本位置，undo时需要
  sps: position;
};

class PositionCommand extends AbstractCommand {
  data: PositionData[];
  target: Node;
  el: HTMLElement;
  ps: 'before' | 'after' | 'append';

  constructor(nodes: Node[], data: PositionData[], target: Node, el: HTMLElement, ps: position) {
    super(nodes);
    this.data = data;
    this.target = target;
    this.el = el;
    this.ps = ps;
  }

  execute() {
    const { target, el, ps, data } = this;
    if (ps === 'append') {
      if (target instanceof AbstractGroup) {
        moveAppend(this.nodes, target);
      }
    }
    else {
      if (ps === 'after') {
        moveAfter(this.nodes, target);
      }
      else if (ps === 'before') {
        moveBefore(this.nodes, target);
      }
    }
  }

  undo() {
    const { data } = this;
    data.forEach((item, i) => {
      const { el, sel, sps } = item;
      const node = this.nodes[i];
      if (sps === 'append') {
        const dl = sel.querySelector('dl') as HTMLElement;
        const uuid = dl.getAttribute('uuid')!;
        const target = node.root!.refs[uuid] as Container;
        moveAppend([node], target);
      }
      else if (sps === 'after') {
        const dl = sel.querySelector('dl') as HTMLElement;
        const uuid = dl.getAttribute('uuid')!;
        const target = node.root!.refs[uuid];
        moveAfter([node], target);
      }
      else if (sps === 'before') {
        const dl = sel.querySelector('dl') as HTMLElement;
        const uuid = dl.getAttribute('uuid')!;
        const target = node.root!.refs[uuid];
        moveBefore([node], target);
      }
    });
  }
}

export default PositionCommand;
