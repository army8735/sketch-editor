import Node from '../node/Node';
import Root from '../node/Root';
import { toPrecision } from '../math';
import Listener from './Listener';
import MoveCommand from '../history/MoveCommand';
import RotateCommand from '../history/RotateCommand';
import { getBasicInfo, resizeBottomOperate, resizeRightOperate } from '../tools/node';
import ResizeCommand from '../history/ResizeCommand';
import UpdateStyleCommand from '../history/UpdateStyleCommand';
import Panel from './Panel';
import { ModifyData, MoveData, ResizeData, ResizeStyle } from '../format';
import { ComputedStyle, Style } from '../style/define';

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
  // node当前数据，每次input变更则更新
  data: { x: number, y: number, angle: number, w: number, h: number, rotation: number }[];

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
    let originStyle: Style[] = [];
    let computedStyle: ComputedStyle[] = [];
    let prevNumber: number[] = [];
    let nextNumber: number[] = [];
    let nextStyle: ResizeStyle[] = [];

    const onInputPos = (e: Event, isXOrY = true) => {
      this.silence = true;
      const isFirst = !nodes.length;
      if (isFirst) {
        originStyle = [];
        computedStyle = [];
        prevNumber = [];
      }
      nextNumber = [];
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        if (isFirst) {
          nodes.push(node);
          originStyle.push(node.getStyle());
          computedStyle.push(node.getComputedStyle());
          prevNumber.push(isXOrY ? this.data[i].x : this.data[i].y);
        }
        const prev = prevNumber[i];
        let next = parseFloat(isXOrY ? x.value : y.value) || 0;
        let d = 0;
        if (isInput) {
          d = next - prev;
        }
        else {
          // 多个的时候有placeholder无值，差值就是1或-1；单个则是值本身
          if (isXOrY ? x.placeholder : y.placeholder) {
            d = next;
          }
          else {
            d = next - prev;
          }
          if (listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
          }
          next = prev + d;
        }
        nextNumber.push(next);
        // 和拖拽一样只更新translate，在change事件才计算定位和生成命令
        if (isXOrY) {
          node.updateStyle({
            translateX: computedStyle[i].translateX + d,
          });
        }
        else {
          node.updateStyle({
            translateY: computedStyle[i].translateY + d,
          });
        }
      });
      if (nodes.length) {
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.MOVE_NODE, nodes.slice(0));
        this.show(this.nodes);
      }
      this.silence = false;
    }

    const onChangePos = (isXOrY = true) => {
      if (nodes.length) {
        const data: MoveData[] = [];
        nodes.forEach((node, i) => {
          const md = isXOrY
            ? node.endPosChange(originStyle[i], nextNumber[i] - prevNumber[i], 0)
            : node.endPosChange(originStyle[i], 0, nextNumber[i] - prevNumber[i]);
          node.checkPosSizeUpward();
          data.push(md);
        });
        listener.history.addCommand(new MoveCommand(nodes, data));
        nodes = [];
        originStyle = [];
        computedStyle = [];
        prevNumber = [];
        nextNumber = [];
      }
    };

    x.addEventListener('input', (e) => {
      onInputPos(e, true);
    });
    x.addEventListener('change', (e) => {
      onChangePos(true);
    });

    y.addEventListener('input', (e) => {
      onInputPos(e, false);
    });
    y.addEventListener('change', (e) => {
      onChangePos(false);
    });

    r.addEventListener('input', (e) => {
      this.silence = true;
      const isFirst = !nodes.length;
      if (isFirst) {
        computedStyle = [];
        prevNumber = [];
      }
      nextNumber = [];
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        if (isFirst) {
          nodes.push(node);
          computedStyle.push(node.getComputedStyle());
          prevNumber.push(this.data[i].rotation);
        }
        const prev = prevNumber[i];
        let next = parseFloat(r.value) || 0;
        let d = 0;
        if (isInput) {
          d = next - prev;
        }
        else {
          // 多个的时候有placeholder无值，差值就是1或-1；单个则是值本身
          if (r.placeholder) {
            d = next;
          }
          else {
            d = next - prev;
          }
          if (listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
          }
          next = prev + d;
        }
        nextNumber.push(next);
        node.updateStyle({
          rotateZ: computedStyle[i].rotateZ + d,
        });
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
        listener.history.addCommand(new RotateCommand(nodes, prevNumber.map((prev, i) => ({
          prev,
          next: nextNumber[i],
        }))));
        nodes = [];
        computedStyle = [];
        prevNumber = [];
        nextNumber = [];
      }
    });

    const onInputSize = (e: Event, isWOrH = true) => {
      this.silence = true;
      const isFirst = !nodes.length;
      if (isFirst) {
        originStyle = [];
        computedStyle = [];
        prevNumber = [];
      }
      nextNumber = [];
      nextStyle = [];
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        if (isFirst) {
          nodes.push(node);
          originStyle.push(node.getStyle());
          computedStyle.push(node.getComputedStyle());
          prevNumber.push(isWOrH ? this.data[i].w : this.data[i].h);
          node.startSizeChange();
        }
        const prev = prevNumber[i];
        let next = parseFloat(isWOrH ? w.value : h.value) || 0;
        let d = 0;
        if (isInput) {
          d = next - prev;
        }
        else {
          // 多个的时候有placeholder无值，差值就是1或-1；单个则是值本身
          if (isWOrH ? w.placeholder : h.placeholder) {
            d = next;
          }
          else {
            d = next - prev;
          }
          if (listener.shiftKey) {
            if (d > 0) {
              d = 10;
            }
            else {
              d = -10;
            }
          }
          next = prev + d;
        }
        nextNumber.push(next);
        const t = isWOrH
          ? resizeRightOperate(node, computedStyle[i], d)
          : resizeBottomOperate(node, computedStyle[i], d);
        if (t) {
          node.updateStyle(t);
          nextStyle[i] = t;
        }
      });
      if (nodes.length) {
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.RESIZE_NODE, nodes.slice(0));
        this.show(this.nodes);
      }
      this.silence = false;
    };

    const onChangeSize = () => {
      if (nodes.length) {
        const data: ResizeData[] = [];
        nodes.forEach((node, i) => {
          const rd = node.endSizeChange(originStyle[i], nextStyle[i]);
          node.checkPosSizeUpward();
          data.push(rd);
        });
        listener.history.addCommand(new ResizeCommand(nodes, data));
        nodes = [];
        originStyle = [];
        computedStyle = [];
        prevNumber = [];
        nextNumber = [];
        nextStyle = [];
      }
    };

    w.addEventListener('input', (e) => {
      onInputSize(e, true);
    });
    w.addEventListener('change', (e) => {
      onChangeSize();
    });

    h.addEventListener('input', (e) => {
      onInputSize(e, false);
    });
    h.addEventListener('change', (e) => {
      onChangeSize();
    });

    fh.addEventListener('click', (e) => {
      this.silence = true;
      if (fh.classList.contains('active')) {
        fh.classList.remove('active');
      }
      else {
        fh.classList.add('active');
      }
      const nodes: Node[] = [];
      const data: ModifyData[] = [];
      this.nodes.forEach((node, i) => {
        const prev = node.computedStyle.scaleX;
        const next = fh.classList.contains('active') ? -1 : 1;
        if (prev !== next) {
          node.updateStyle({
            scaleX: next,
          });
          nodes.push(node);
          data.push({
            prev: { scaleX: prev },
            next: { scaleX: next },
          });
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new UpdateStyleCommand(nodes, data));
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.FLIP_H_NODE, nodes.slice(0));
      }
      this.silence = false;
    });

    fv.addEventListener('click', (e) => {
      this.silence = true;
      if (fv.classList.contains('active')) {
        fv.classList.remove('active');
      }
      else {
        fv.classList.add('active');
      }
      const nodes: Node[] = [];
      const data: ModifyData[] = [];
      this.nodes.forEach((node, i) => {
        const prev = node.computedStyle.scaleY;
        const next = fv.classList.contains('active') ? -1 : 1;
        if (prev !== next) {
          node.updateStyle({
            scaleY: next,
          });
          nodes.push(node);
          data.push({
            prev: { scaleX: prev },
            next: { scaleX: next },
          });
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new UpdateStyleCommand(nodes, data));
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.FLIP_V_NODE, nodes.slice(0));
      }
      this.silence = false;
    });

    listener.on([
      Listener.SELECT_NODE,
      Listener.MOVE_NODE,
      Listener.RESIZE_NODE,
      Listener.ROTATE_NODE,
      Listener.FLIP_H_NODE,
      Listener.FLIP_V_NODE,
    ], (nodes: Node[]) => {
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
