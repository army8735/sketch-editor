import Node from '../node/Node';
import Root from '../node/Root';
import { toPrecision } from '../math';
import Listener from './Listener';
import MoveCommand from '../history/MoveCommand';
import RotateCommand from '../history/RotateCommand';
import { resizeBR } from '../tools/node';
import ResizeCommand from '../history/ResizeCommand';
import { JStyle } from '../format';

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
  </div>
`;

class BasicPanel {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  panel: HTMLElement;
  nodes: Node[];
  data: Array<{ x: number, y: number, angle: number, w: number, h: number }>; // node当前数据，每次input变更则更新
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

    x.addEventListener('input', (e) => {
      this.silence = true;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const nodes: Node[] = [];
      const dxs: number[] = [];
      const dys: number[] = [];
      this.nodes.forEach((node, i) => {
        let d = 0;
        if (isInput) {
          d = parseFloat(x.value) - this.data[i].x;
        }
        else {
          d = parseFloat(x.value);
        }
        if (d) {
          if (!isInput && listener.shiftKey) {
            e.preventDefault();
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
            if(!x.placeholder && !i) {
              x.value = toPrecision(this.data[i].x + d).toString();
            }
          }
          this.data[i].x += d;
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
      if (x.placeholder) {
        x.value = '';
      }
      listener.history.addCommand(new MoveCommand(nodes, dxs, dys));
      listener.select.updateSelect(nodes);
      listener.emit(Listener.MOVE_NODE, nodes.slice(0));
      this.silence = false;
    });

    y.addEventListener('input', (e) => {
      this.silence = true;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const nodes: Node[] = [];
      const dxs: number[] = [];
      const dys: number[] = [];
      this.nodes.forEach((node, i) => {
        let d = 0;
        if (isInput) {
          d = parseFloat(y.value) - this.data[i].y;
        }
        else {
          d = parseFloat(y.value);
        }
        if (d) {
          if (!isInput && listener.shiftKey) {
            e.preventDefault();
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
            if(!y.placeholder && !i) {
              y.value = toPrecision(this.data[i].y + d).toString();
            }
          }
          this.data[i].y += d;
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
      if (y.placeholder) {
        y.value = '';
      }
      listener.history.addCommand(new MoveCommand(nodes, dxs, dys));
      listener.select.updateSelect(nodes);
      listener.emit(Listener.MOVE_NODE, nodes.slice(0));
      this.silence = false;
    });

    r.addEventListener('input', (e) => {
      this.silence = true;
      this.nodes.forEach((node, i) => {
        let d = parseFloat(r.value) - this.data[i].angle;
        if (d) {
          if (listener.shiftKey) {
            e.preventDefault();
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
            d = this.data[i].angle + d;
            r.value = toPrecision(d).toString();
            this.data[i].angle = d;
          }
          else {
            d = parseFloat(r.value);
            this.data[i].angle = d;
          }
          node.updateStyle({
            rotateZ: d,
          });
          node.checkPosSizeUpward();
          listener.history.addCommand(new RotateCommand(node, d));
        }
      });
      this.silence = false;
    });

    w.addEventListener('input', (e) => {
      this.silence = true;
      this.nodes.forEach((node, i) => {
        let d = parseFloat(w.value) - this.data[i].w;
        if (d) {
          if (listener.shiftKey) {
            e.preventDefault();
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
            w.value = toPrecision(this.data[i].w + d).toString();
          }
          this.data[i].w += d;
          const { computedStyle } = node;
          const style = node.getStyle();
          const cssStyle = node.getCssStyle();
          const next = resizeBR(node, style, computedStyle, cssStyle, d, 0);
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
          listener.history.addCommand(new ResizeCommand(node, { prev, next }));
        }
      });
      this.silence = false;
    });

    h.addEventListener('input', (e) => {
      this.silence = true;
      this.nodes.forEach((node, i) => {
        let d = parseFloat(h.value) - this.data[i].h;
        if (d) {
          if (listener.shiftKey) {
            e.preventDefault();
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
            h.value = toPrecision(this.data[i].h + d).toString();
          }
          this.data[i].h += d;
          const { computedStyle } = node;
          const style = node.getStyle();
          const cssStyle = node.getCssStyle();
          const next = resizeBR(node, style, computedStyle, cssStyle, 0, d);
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
          listener.history.addCommand(new ResizeCommand(node, { prev, next }));
        }
      });
      this.silence = false;
    });

    listener.on(Listener.MOVE_NODE, (nodes: Node[]) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
    listener.on(Listener.RESIZE_NODE, (nodes: Node[]) => {
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
      panel.querySelectorAll('label').forEach(item => {
        item.classList.add('disabled');
      });
      panel.querySelectorAll('input').forEach(item => {
        item.disabled = true;
        item.placeholder = '';
        item.value = '';
      });
      return;
    }
    panel.querySelectorAll('label').forEach(item => {
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
    nodes.forEach(item => {
      const o = item.getFrameProps();
      const { x, y, angle, w, h } = o;
      this.data.push(o);
      if (!xs.includes(x)) {
        xs.push(x);
      }
      if (!ys.includes(y)) {
        ys.push(x);
      }
      if (!rs.includes(angle)) {
        rs.push(angle);
      }
      if (!ws.includes(w)) {
        ws.push(w);
      }
      if (!hs.includes(h)) {
        hs.push(h);
      }
    });
    const x = panel.querySelector('.x input') as HTMLInputElement;
    const y = panel.querySelector('.y input') as HTMLInputElement;
    const r = panel.querySelector('.r input') as HTMLInputElement;
    const w = panel.querySelector('.w input') as HTMLInputElement;
    const h = panel.querySelector('.h input') as HTMLInputElement;
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
  }
}

export default BasicPanel;
