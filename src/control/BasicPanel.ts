import Node from '../node/Node';
import Root from '../node/Root';
import { toPrecision } from '../math';
import Listener from './Listener';
import MoveCommand from '../history/MoveCommand';
import RotateCommand from '../history/RotateCommand';
import { getBasicInfo, resizeBR } from '../tools/node';
import ResizeCommand from '../history/ResizeCommand';
import { JStyle } from '../format';
import UpdateStyleCommand from '../history/UpdateStyleCommand';

const html = `
  <h4 class="panel-title">基本</h4>
  <div class="line">
    <label class="x">
      <input type="number" class="num" step="1" disabled/>
      <span>X</span>
    </label>
    <label class="y">
      <input type="number" class="num" step="1" disabled/>
      <span>Y</span>
    </label>
    <label class="r">
      <input type="number" class="num" step="1" disabled/>
      <span>°</span>
    </label>
  </div>
  <div class="line">
    <label class="w">
      <input type="number" class="num" step="1" disabled/>
      <span>W</span>
    </label>
    <label class="h">
      <input type="number" class="num" step="1" disabled/>
      <span>H</span>
    </label>
    <span class="fh"></span>
    <span class="fv"></span>
  </div>
`;

class BasicPanel {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  panel: HTMLElement;
  nodes: Node[];
  data: Array<{ x: number, y: number, angle: number, w: number, h: number, rotation: number }>; // node当前数据，每次input变更则更新
  silence: boolean; // input更新触发listener的事件，避免循环侦听更新前静默标识不再侦听

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;
    this.nodes = [];
    this.data = [];
    this.silence = false;

    const panel = this.panel = document.createElement('div');
    panel.className = 'basic-panel';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    const x = panel.querySelector('.x input') as HTMLInputElement;
    const y = panel.querySelector('.y input') as HTMLInputElement;
    const r = panel.querySelector('.r input') as HTMLInputElement;
    const w = panel.querySelector('.w input') as HTMLInputElement;
    const h = panel.querySelector('.h input') as HTMLInputElement;
    const fh = panel.querySelector('.fh') as HTMLElement;
    const fv = panel.querySelector('.fv') as HTMLElement;

    x.addEventListener('input', (e) => {
      this.silence = true;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const nodes: Node[] = [];
      const dxs: number[] = [];
      const dys: number[] = [];
      this.nodes.forEach((node, i) => {
        const o = this.data[i];
        let d = parseFloat(x.value) - o.x;
        if (d) {
          if (!isInput && listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
            if (!i) {
              x.value = toPrecision(o.x + d).toString();
            }
          }
          o.x += d;
          const style = node.getStyle();
          node.updateStyle({
            translateX: node.computedStyle.translateX + d,
          });
          // 还原最初的translate/TRBL值
          node.endPosChange(style, d, 0);
          node.checkPosSizeUpward();
          nodes.push(node);
          dxs.push(d);
          dys.push(0);
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new MoveCommand(nodes.slice(0), dxs, dys));
        listener.select.updateSelect(nodes);
        listener.emit(Listener.MOVE_NODE, nodes.slice(0));
      }
      this.silence = false;
    });

    y.addEventListener('input', (e) => {
      this.silence = true;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const nodes: Node[] = [];
      const dxs: number[] = [];
      const dys: number[] = [];
      this.nodes.forEach((node, i) => {
        const o = this.data[i];
        let d = parseFloat(y.value) - o.y;
        if (d) {
          if (!isInput && listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
            if (!i) {
              y.value = toPrecision(o.y + d).toString();
            }
          }
          o.y += d;
          const style = node.getStyle();
          node.updateStyle({
            translateY: node.computedStyle.translateY + d,
          });
          // 还原最初的translate/TRBL值
          node.endPosChange(style, 0, d);
          node.checkPosSizeUpward();
          nodes.push(node);
          dxs.push(0);
          dys.push(d);
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new MoveCommand(nodes.slice(0), dxs, dys));
        listener.select.updateSelect(nodes);
        listener.emit(Listener.MOVE_NODE, nodes.slice(0));
      }
      this.silence = false;
    });

    r.addEventListener('input', (e) => {
      this.silence = true;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const nodes: Node[] = [];
      const ns: number[] = [];
      this.nodes.forEach((node, i) => {
        const o = this.data[i];
        let d = parseFloat(r.value) - o.rotation;
        if (d) {
          if (!isInput && listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
            if (!i) {
              r.value = toPrecision(o.rotation + d).toString();
            }
          }
          o.rotation += d;
          node.updateStyle({
            rotateZ: node.computedStyle.rotateZ + d,
          });
          node.checkPosSizeUpward();
          nodes.push(node);
          ns.push(d);
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new RotateCommand(nodes.slice(0), ns));
        listener.select.updateSelect(nodes);
        listener.emit(Listener.ROTATE_NODE, nodes.slice(0));
        this.show(nodes);
      }
      this.silence = false;
    });

    w.addEventListener('input', (e) => {
      this.silence = true;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const nodes: Node[] = [];
      const styles: { prev: Partial<JStyle>, next: Partial<JStyle> }[] = [];
      this.nodes.forEach((node, i) => {
        const o = this.data[i];
        let d = parseFloat(w.value) - o.w;
        if (d) {
          if (!isInput && listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
            if (!i) {
              w.value = toPrecision(o.w + d).toString();
            }
          }
          o.w += d;
          const { computedStyle } = node;
          node.startSizeChange();
          const style = node.getStyle();
          const cssStyle = node.getCssStyle();
          const next = resizeBR(node, style, computedStyle, d, 0);
          node.updateStyle(next);
          const prev: Partial<JStyle> = {};
          Object.keys(next).forEach((k) => {
            const v = cssStyle[k as keyof JStyle];
            // @ts-ignore
            prev[k] = v;
          });
          // 还原最初的translate/TRBL值
          node.endSizeChange(style);
          node.checkPosSizeUpward();
          nodes.push(node);
          styles.push({ prev, next });
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new ResizeCommand(nodes.slice(0), styles));
        listener.select.updateSelect(nodes);
        this.show(nodes);
        listener.emit(Listener.RESIZE_NODE, nodes.slice(0));
      }
      this.silence = false;
    });

    h.addEventListener('input', (e) => {
      this.silence = true;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const nodes: Node[] = [];
      const styles: { prev: Partial<JStyle>, next: Partial<JStyle> }[] = [];
      this.nodes.forEach((node, i) => {
        const o = this.data[i];
        let d = parseFloat(h.value) - o.h;
        if (d) {
          if (!isInput && listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
            if (!i) {
              h.value = toPrecision(o.h + d).toString();
            }
          }
          o.h += d;
          const { computedStyle } = node;
          node.startSizeChange();
          const style = node.getStyle();
          const cssStyle = node.getCssStyle();
          const next = resizeBR(node, style, computedStyle, 0, d);
          node.updateStyle(next);
          const prev: Partial<JStyle> = {};
          Object.keys(next).forEach((k) => {
            const v = cssStyle[k as keyof JStyle];
            // @ts-ignore
            prev[k] = v;
          });
          // 还原最初的translate/TRBL值
          node.endSizeChange(style);
          node.checkPosSizeUpward();
          nodes.push(node);
          styles.push({ prev, next });
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new ResizeCommand(nodes.slice(0), styles));
        listener.select.updateSelect(nodes);
        listener.emit(Listener.RESIZE_NODE, nodes.slice(0));
      }
      this.silence = false;
    });

    fh.addEventListener('click', (e) => {
      if (fh.classList.contains('active')) {
        fh.classList.remove('active');
      }
      else {
        fh.classList.add('active');
      }
      const nodes: Node[] = [];
      const prevs: Partial<JStyle>[] = [];
      const nexts: Partial<JStyle>[] = [];
      this.nodes.forEach((node, i) => {
        const prev = node.computedStyle.scaleX;
        const next = fh.classList.contains('active') ? -1 : 1;
        if (prev !== next) {
          node.updateStyle({
            scaleX: next,
          });
          nodes.push(node);
          prevs.push({
            scaleX: prev,
          });
          nexts.push({
            scaleX: next,
          });
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new UpdateStyleCommand(nodes.slice(0), prevs, nexts));
        listener.select.updateSelect(nodes);
        listener.emit(Listener.FLIP_H_NODE, nodes.slice(0));
      }
    });

    fv.addEventListener('click', (e) => {
      if (fv.classList.contains('active')) {
        fv.classList.remove('active');
      }
      else {
        fv.classList.add('active');
      }
      const nodes: Node[] = [];
      const prevs: Partial<JStyle>[] = [];
      const nexts: Partial<JStyle>[] = [];
      this.nodes.forEach((node, i) => {
        const prev = node.computedStyle.scaleY;
        const next = fv.classList.contains('active') ? -1 : 1;
        if (prev !== next) {
          node.updateStyle({
            scaleY: next,
          });
          nodes.push(node);
          prevs.push({
            scaleY: prev,
          });
          nexts.push({
            scaleY: next,
          });
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new UpdateStyleCommand(nodes.slice(0), prevs, nexts));
        listener.select.updateSelect(nodes);
        listener.emit(Listener.FLIP_V_NODE, nodes.slice(0));
      }
    });

    listener.on(Listener.SELECT_NODE, (nodes: Node[]) => {
      this.show(nodes);
    });
    listener.on([Listener.MOVE_NODE, Listener.RESIZE_NODE, Listener.ROTATE_NODE], (nodes: Node[]) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
  }

  show(nodes: Node[]) {
    this.nodes = nodes;
    this.data = [];
    const panel = this.panel;
    if (!nodes.length) {
      panel.querySelectorAll('label,.fh,.fv').forEach(item => {
        item.classList.add('disabled');
        item.classList.remove('active');
      });
      panel.querySelectorAll('input').forEach(item => {
        item.disabled = true;
        item.placeholder = '';
        item.value = '';
      });
      return;
    }
    panel.querySelectorAll('label,.fh,.fv').forEach(item => {
      item.classList.remove('disabled');
    });
    panel.querySelectorAll('input').forEach(item => {
      item.disabled = false;
      item.placeholder = '';
      item.value = '';
    });
    const xs: number[] = [];
    const ys: number[] = [];
    const rs: number[] = [];
    const ws: number[] = [];
    const hs: number[] = [];
    const fhs: boolean[] = [];
    const fvs: boolean[] = [];
    nodes.forEach(item => {
      const o = getBasicInfo(item);
      let {
        x,
        y,
        rotation,
        w,
        h,
        isFlippedHorizontal,
        isFlippedVertical,
      } = o;
      this.data.push(o);
      if (!xs.includes(x)) {
        xs.push(x);
      }
      if (!ys.includes(y)) {
        ys.push(y);
      }
      if (!rs.includes(rotation)) {
        rs.push(rotation);
      }
      if (!ws.includes(w)) {
        ws.push(w);
      }
      if (!hs.includes(h)) {
        hs.push(h);
      }
      if (!fhs.includes(isFlippedHorizontal)) {
        fhs.push(isFlippedHorizontal);
      }
      if (!fvs.includes(isFlippedVertical)) {
        fvs.push(isFlippedVertical);
      }
    });
    const x = panel.querySelector('.x input') as HTMLInputElement;
    const y = panel.querySelector('.y input') as HTMLInputElement;
    const r = panel.querySelector('.r input') as HTMLInputElement;
    const w = panel.querySelector('.w input') as HTMLInputElement;
    const h = panel.querySelector('.h input') as HTMLInputElement;
    const fh = panel.querySelector('.fh') as HTMLElement;
    const fv = panel.querySelector('.fv') as HTMLElement;
    if (xs.length > 1) {
      x.placeholder = '多个';
    }
    else {
      x.value = toPrecision(xs[0]).toString();
    }
    if (ys.length > 1) {
      y.placeholder = '多个';
    }
    else {
      y.value = toPrecision(ys[0]).toString();
    }
    if (rs.length > 1) {
      r.placeholder = '多个';
    }
    else {
      r.value = toPrecision(rs[0]).toString();
    }
    if (ws.length > 1) {
      w.placeholder = '多个';
    }
    else {
      w.value = toPrecision(ws[0]).toString();
    }
    if (hs.length > 1) {
      h.placeholder = '多个';
    }
    else {
      h.value = toPrecision(hs[0]).toString();
    }
    if (fhs.includes(true)) {
      fh.classList.add('active');
    }
    else {
      fh.classList.remove('active');
    }
    if (fvs.includes(true)) {
      fv.classList.add('active');
    }
    else {
      fv.classList.remove('active');
    }
  }
}

export default BasicPanel;
