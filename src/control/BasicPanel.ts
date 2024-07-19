import Node from '../node/Node';
import Root from '../node/Root';
import { toPrecision } from '../math';
import Listener from './Listener';
import MoveCommand from '../history/MoveCommand';
import RotateCommand from '../history/RotateCommand';
import { getBasicInfo, resizeBottom, resizeRight } from '../tools/node';
import ResizeCommand from '../history/ResizeCommand';
import { JStyle } from '../format';
import UpdateStyleCommand from '../history/UpdateStyleCommand';
import Panel from './Panel';

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

class BasicPanel extends Panel {
  panel: HTMLElement;
  data: Array<{ x: number, y: number, angle: number, w: number, h: number, rotation: number }>; // node当前数据，每次input变更则更新

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);
    this.data = [];

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

    let nodes: Node[] = [];
    let dxs: number[] = [];
    let dys: number[] = [];
    let drs: number[] = [];
    let styles: { prev: Partial<JStyle>, next: Partial<JStyle> }[] = [];

    x.addEventListener('input', (e) => {
      this.silence = true;
      const isFirst = !nodes.length;
      if (isFirst) {
        dxs = [];
        dys = [];
      }
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        const o = this.data[i];
        let d = 0;
        if (isInput) {
          d = parseFloat(x.value) - o.x;
        }
        else {
          // 多个的时候有placeholder无值，差值就是1或-1；单个则是值本身
          if (x.placeholder) {
            d = parseFloat(x.value);
          }
          else {
            d = parseFloat(x.value) - o.x;
          }
          if (listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
          }
        }
        if (d) {
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
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.MOVE_NODE, nodes.slice(0));
        this.show(this.nodes);
      }
      this.silence = false;
    });
    x.addEventListener('change', (e) => {
      if (nodes.length) {
        listener.history.addCommand(new MoveCommand(nodes, dxs, dys));
        nodes = [];
        dxs = [];
        dys = [];
      }
    });

    y.addEventListener('input', (e) => {
      this.silence = true;
      const isFirst = !nodes.length;
      if (isFirst) {
        dxs = [];
        dys = [];
      }
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        const o = this.data[i];
        let d = 0;
        if (isInput) {
          d = parseFloat(y.value) - o.y;
        }
        else {
          // 多个的时候有placeholder无值，差值就是1或-1；单个则是值本身
          if (y.placeholder) {
            d = parseFloat(y.value);
          }
          else {
            d = parseFloat(y.value) - o.y;
          }
          if (listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
          }
        }
        if (d) {
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
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.MOVE_NODE, nodes.slice(0));
        this.show(this.nodes);
      }
      this.silence = false;
    });
    y.addEventListener('change', (e) => {
      if (nodes.length) {
        listener.history.addCommand(new MoveCommand(nodes, dxs, dys));
        nodes = [];
        dxs = [];
        dys = [];
      }
    });

    r.addEventListener('input', (e) => {
      this.silence = true;
      const isFirst = !nodes.length;
      if (isFirst) {
        drs = [];
      }
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        const o = this.data[i];
        let d = 0;
        if (isInput) {
          d = parseFloat(r.value) - o.rotation;
        }
        else {
          // 多个的时候有placeholder无值，差值就是1或-1；单个则是值本身
          if (r.placeholder) {
            d = parseFloat(r.value);
          }
          else {
            d = parseFloat(r.value) - o.rotation;
          }
          if (listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
          }
        }
        if (d) {
          o.rotation += d;
          node.updateStyle({
            rotateZ: node.computedStyle.rotateZ + d,
          });
          node.checkPosSizeUpward();
          nodes.push(node);
          drs.push(d);
        }
      });
      if (nodes.length) {
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.ROTATE_NODE, nodes.slice(0));
        this.show(this.nodes);
      }
      this.silence = false;
    });
    r.addEventListener('change', (e) => {
      if (nodes.length) {
        listener.history.addCommand(new RotateCommand(nodes, drs));
        nodes = [];
        drs = [];
      }
    });

    w.addEventListener('input', (e) => {
      this.silence = true;
      const isFirst = !nodes.length;
      if (isFirst) {
        styles = [];
      }
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        const o = this.data[i];
        let d = 0;
        if (isInput) {
          d = parseFloat(w.value) - o.w;
        }
        else {
          // 多个的时候有placeholder无值，差值就是1或-1；单个则是值本身
          if (w.placeholder) {
            d = parseFloat(w.value);
          }
          else {
            d = parseFloat(w.value) - o.w;
          }
          if (listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
          }
        }
        if (d) {
          o.w += d;
          const { computedStyle } = node;
          const style = node.getStyle();
          node.startSizeChange();
          const cssStyle = node.getCssStyle();
          const next = resizeRight(node, node.style, computedStyle, d)!;
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
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.RESIZE_NODE, nodes.slice(0));
        this.show(this.nodes);
      }
      this.silence = false;
    });
    w.addEventListener('change', (e) => {
      if (nodes.length) {
        listener.history.addCommand(new ResizeCommand(nodes, styles));
        nodes = [];
        styles = [];
      }
    });

    h.addEventListener('input', (e) => {
      this.silence = true;
      const isFirst = !nodes.length;
      if (isFirst) {
        styles = [];
      }
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        const o = this.data[i];
        let d = 0;
        if (isInput) {
          d = parseFloat(h.value) - o.h;
        }
        else {
          // 多个的时候有placeholder无值，差值就是1或-1；单个则是值本身
          if (h.placeholder) {
            d = parseFloat(h.value);
          }
          else {
            d = parseFloat(h.value) - o.h;
          }
          if (listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
          }
        }
        if (d) {
          o.h += d;
          const { computedStyle } = node;
          const style = node.getStyle();
          node.startSizeChange();
          const cssStyle = node.getCssStyle();
          const next = resizeBottom(node, node.style, computedStyle, d)!;
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
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.RESIZE_NODE, nodes.slice(0));
        this.show(this.nodes);
      }
      this.silence = false;
    });
    h.addEventListener('change', (e) => {
      if (nodes.length) {
        listener.history.addCommand(new ResizeCommand(nodes, styles));
        nodes = [];
        styles = [];
      }
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
        listener.history.addCommand(new UpdateStyleCommand(nodes, prevs, nexts));
        listener.select.updateSelect(this.nodes);
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
        listener.history.addCommand(new UpdateStyleCommand(nodes, prevs, nexts));
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.FLIP_V_NODE, nodes.slice(0));
      }
    });

    listener.on([Listener.SELECT_NODE, Listener.MOVE_NODE, Listener.RESIZE_NODE, Listener.ROTATE_NODE], (nodes: Node[]) => {
      // 输入的时候，防止重复触发；选择/undo/redo的时候则更新显示
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
