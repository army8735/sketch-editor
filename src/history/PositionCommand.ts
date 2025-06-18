import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import AbstractGroup from '../node/AbstractGroup';
import { moveAfter, moveAppend, moveBefore } from '../tools/node';
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
        target.fixedPosAndSize = true;
        moveAppend(this.nodes, target);
        target.fixedPosAndSize = false;
        target.checkPosSizeSelf();
      }
      const dt = el.querySelector('dt') as HTMLElement;
      this.data.forEach((item) => {
        const p = item.el.parentElement!;
        if (dt.nextElementSibling) {
          el.insertBefore(p, dt.nextElementSibling);
        }
        else {
          el.prepend(p);
        }
      });
    }
    else {
      const p = target.parent;
      if (p instanceof AbstractGroup) {
        p.fixedPosAndSize = true;
      }
      if (ps === 'after') {
        moveAfter(this.nodes, target);
        data.slice(0).reverse().forEach((item, i) => {
          const dd = el.parentElement!;
          dd.parentElement!.insertBefore(item.el.parentElement!, dd);
        });
      }
      else if (ps === 'before') {
        moveBefore(this.nodes, target);
        data.forEach((item) => {
          const dd = el.parentElement!;
          const prev = dd.nextElementSibling;
          if (prev) {
            dd.parentElement!.insertBefore(item.el.parentElement!, prev);
          }
          else {
            dd.parentElement!.append(item.el.parentElement!);
          }
        });
      }
      if (p instanceof AbstractGroup) {
        p.fixedPosAndSize = false;
        p.checkPosSizeSelf();
      }
    }
    this.update();
  }

  undo() {
    const { data } = this;
    data.forEach((item, i) => {
      const { el, sel, sps } = item;
      const node = this.nodes[i];
      const dd = el.parentElement!;
      if (sps === 'append') {
        sel.parentElement!.append(dd);
        const dl = sel.querySelector('dl') as HTMLElement;
        const uuid = dl.getAttribute('uuid')!;
        const target = node.root!.refs[uuid] as Container;
        target.appendChild(node);
      }
      else if (sps === 'after') {
        sel.parentElement!.insertBefore(dd, sel);
        const dl = sel.querySelector('dl') as HTMLElement;
        const uuid = dl.getAttribute('uuid')!;
        const target = node.root!.refs[uuid];
        target.insertAfter(node);
      }
      else if (sps === 'before') {
        const next = sel.nextElementSibling;
        if (next) {
          sel.parentElement!.insertBefore(dd, next);
        }
        else {
          sel.parentElement!.append(dd);
        }
        const dl = sel.querySelector('dl') as HTMLElement;
        const uuid = dl.getAttribute('uuid')!;
        const target = node.root!.refs[uuid];
        target.insertAfter(node);
      }
    });
    this.update();
  }

  private update() {
    // 更新dl/dt的样式和信息
    this.data.forEach((item, i) => {
      const lv = this.nodes[i].struct.lv;
      item.el.setAttribute('lv', lv.toString());
      item.el.querySelector('dt')!.style.paddingLeft = (lv - 3) * config.treeLvPadding + 'px';
    });
  }
}

export default PositionCommand;
