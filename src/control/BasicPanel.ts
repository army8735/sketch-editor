import Node from '../node/Node';
import Root from '../node/Root';
import Group from '../node/Group';
import Slice from '../node/Slice';
import AbstractFrame from '../node/AbstractFrame';
import ArtBoard from '../node/ArtBoard';
import { toPrecision } from '../math';
import Listener from './Listener';
import { getBasicInfo } from '../tool/node';
import MoveCommand, { MoveData } from '../history/MoveCommand';
import RotateCommand from '../history/RotateCommand';
import ConstrainProportionCommand, { ConstrainProportionData } from '../history/ConstrainProportionCommand';
import ResizeCommand, { CONTROL_TYPE, ResizeData } from '../history/ResizeCommand';
import OverflowCommand, { OverflowData } from '../history/OverflowCommand';
import FlipHCommand, { FlipHData } from '../history/FlipHCommand';
import FlipVCommand, { FlipVData } from '../history/FlipVCommand';
import { ComputedStyle, OVERFLOW, Style, StyleUnit } from '../style/define';
import { JStyle } from '../format';
import state from './state';
import Panel from './Panel';
import SymbolInstance from '../node/SymbolInstance';

const html = `
  <div class="line">
    <div class="input-unit">
      <input type="number" class="x" step="1"/>
      <span class="unit">X</span>
    </div>
    <div class="input-unit">
      <input type="number" class="y" step="1"/>
      <span class="unit">Y</span>
    </div>
    <div class="input-unit">
      <input type="number" class="r" step="1"/>
      <span class="unit">°</span>
    </div>
  </div>
  <div class="line">
    <div class="input-unit">
      <input type="number" class="w" step="1"/>
      <span class="unit">W</span>
    </div>
    <div class="cp"></div>
    <div class="input-unit">
      <input type="number" class="h" step="1"/>
      <span class="unit">H</span>
    </div>
    <span class="fh" title="水平翻转"></span>
    <span class="fv" title="垂直翻转"></span>
  </div>
  <div class="line clip">
    <span class="ov"></span>
    <span>裁剪内容</span>
  </div>
`;

class BasicPanel extends Panel {
  panel: HTMLElement;
  // node当前数据，每次input变更则更新
  data: { x: number, y: number, w: number, h: number, rotation: number }[];

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);
    this.data = [];

    const panel = this.panel = document.createElement('div');
    panel.className = 'basic-panel';
    panel.innerHTML = html;
    dom.appendChild(panel);

    const x = panel.querySelector('.x') as HTMLInputElement;
    const y = panel.querySelector('.y') as HTMLInputElement;
    const r = panel.querySelector('.r') as HTMLInputElement;
    const w = panel.querySelector('.w') as HTMLInputElement;
    const h = panel.querySelector('.h') as HTMLInputElement;
    const cp = panel.querySelector('.cp') as HTMLElement;
    const fh = panel.querySelector('.fh') as HTMLElement;
    const fv = panel.querySelector('.fv') as HTMLElement;
    const ov = panel.querySelector('.ov') as HTMLElement;

    let nodes: Node[] = [];
    let originStyle: Style[] = [];
    let computedStyle: ComputedStyle[] = [];
    let cssStyle: JStyle[] = [];
    let prevNumber: number[] = [];
    let nextNumber: number[] = [];
    let abs: (ArtBoard | undefined)[] = [];
    let hasRefresh = true; // onInput是否触发了刷新，onChange识别看是否需要兜底触发

    const onInputPos = (e: Event, isXOrY = true) => {
      this.silence = true;
      const isFirst = !nodes.length;
      if (isFirst) {
        originStyle = [];
        computedStyle = [];
        prevNumber = [];
        abs = [];
      }
      nextNumber = [];
      const value = parseFloat(isXOrY ? x.value : y.value) || 0;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      hasRefresh = !isInput;
      this.nodes.forEach((node, i) => {
        if (isFirst) {
          nodes.push(node);
          originStyle.push(node.getStyle());
          computedStyle.push(node.getComputedStyle());
          prevNumber.push(isXOrY ? this.data[i].x : this.data[i].y);
        }
        const prev = prevNumber[i];
        let next = value;
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
          else if (listener.altKey) {
            if (d > 0) {
              d = 0.1;
            }
            else {
              d = -0.1;
            }
          }
          next = prev + d;
        }
        nextNumber.push(next);
        abs[i] = node.artBoard;
        // 和拖拽一样只更新translate，在change事件才计算定位和生成命令
        if (isXOrY) {
          MoveCommand.update(node, computedStyle[i], d, 0, isInput);
        }
        else {
          MoveCommand.update(node, computedStyle[i], 0, d, isInput);
        }
      });
      if (nodes.length) {
        listener.select.updateSelect(this.nodes);
        this.show(nodes);
      }
      this.silence = false;
    }

    const onChangePos = (isXOrY = true) => {
      this.silence = true;
      if (nodes.length) {
        if (!hasRefresh) {
          hasRefresh = true;
          root.asyncDraw();
        }
        const data: MoveData[] = [];
        const list: Node[] = [];
        nodes.forEach((node, i) => {
          const d = nextNumber[i] - prevNumber[i];
          if (isXOrY) {
            node.endPosChange(originStyle[i], d, 0);
            data.push({ dx: d, dy: 0 });
          }
          else {
            node.endPosChange(originStyle[i], 0, d);
            data.push({ dx: 0, dy: d });
          }
          node.checkPosSizeUpward();
          if (abs[i] !== node.artBoard) {
            list.push(node);
          }
        });
        listener.history.addCommand(new MoveCommand(nodes, data));
        if (list.length) {
          listener.emit(Listener.ART_BOARD_NODE, list);
        }
        listener.emit(Listener.MOVE_NODE, nodes.slice(0));
      }
      onBlur();
      this.silence = false;
    };

    const onBlur = () => {
      nodes = [];
      originStyle = [];
      computedStyle = [];
      cssStyle = [];
      prevNumber = [];
      nextNumber = [];
      abs = [];
    };

    x.addEventListener('input', (e) => {
      onInputPos(e, true);
    });
    x.addEventListener('change', (e) => {
      onChangePos(true);
    });
    x.addEventListener('blur', () => onBlur());

    y.addEventListener('input', (e) => {
      onInputPos(e, false);
    });
    y.addEventListener('change', (e) => {
      onChangePos(false);
    });
    y.addEventListener('blur', () => onBlur());

    r.addEventListener('input', (e) => {
      this.silence = true;
      const isFirst = !nodes.length;
      if (isFirst) {
        computedStyle = [];
        prevNumber = [];
      }
      nextNumber = [];
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      hasRefresh = !isInput;
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
          else if (listener.altKey) {
            if (d > 0) {
              d = 0.1;
            }
            else {
              d = -0.1;
            }
          }
          next = prev + d;
        }
        nextNumber.push(next);
        node.updateStyle({
          rotateZ: computedStyle[i].rotateZ + d,
        }, isInput);
      });
      if (nodes.length) {
        listener.select.updateSelect(this.nodes);
        this.show(this.nodes);
      }
      this.silence = false;
    });
    r.addEventListener('change', () => {
      this.silence = true;
      if (nodes.length) {
        if (!hasRefresh) {
          hasRefresh = true;
          root.asyncDraw();
        }
        listener.history.addCommand(new RotateCommand(nodes, prevNumber.map((prev, i) => ({
          prev: {
            rotateZ: prev,
          },
          next: {
            rotateZ: nextNumber[i],
          },
        }))));
        listener.emit(Listener.ROTATE_NODE, nodes.slice(0));
      }
      onBlur();
      this.silence = false;
    });
    r.addEventListener('blur', () => onBlur());

    const onInputSize = (e: Event, isWOrH = true) => {
      this.silence = true;
      listener.beforeResize();
      let shift = false;
      if (!shift) {
        // 有一个是固定宽高比的，整体都是
        for (let i = 0, len = listener.selected.length; i < len; i++) {
          if (listener.selected[i].constrainProportions) {
            shift = true;
            break;
          }
        }
      }
      const isFirst = !nodes.length;
      if (isFirst) {
        originStyle = [];
        computedStyle = [];
        cssStyle = [];
        prevNumber = [];
      }
      nextNumber = [];
      const value = parseFloat(isWOrH ? w.value : h.value) || 0;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      hasRefresh = !isInput;
      this.nodes.forEach((node, i) => {
        if (isFirst) {
          nodes.push(node);
          originStyle.push(node.getStyle());
          node.startSizeChange();
          computedStyle.push(node.getComputedStyle());
          cssStyle.push(node.getCssStyle());
          prevNumber.push(isWOrH ? this.data[i].w : this.data[i].h);
          const p = node.parent;
          if (p && p.isGroup && p instanceof Group) {
            p.fixedPosAndSize = true;
          }
        }
        const prev = prevNumber[i];
        let next = value;
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
          else if (listener.altKey) {
            if (d > 0) {
              d = 0.1;
            }
            else {
              d = -0.1;
            }
          }
          next = prev + d;
        }
        nextNumber.push(next);
        ResizeCommand.updateStyle(node, computedStyle[i], cssStyle[i], isWOrH ? d : 0, isWOrH ? 0 : d,
          isWOrH ? CONTROL_TYPE.R : CONTROL_TYPE.B, shift, false, false, false, isInput);
      });
      if (nodes.length) {
        listener.select.updateSelect(this.nodes);
        this.show(nodes);
      }
      this.silence = false;
    };

    const onChangeSize = (isWOrH = true) => {
      this.silence = true;
      if (nodes.length) {
        if (!hasRefresh) {
          hasRefresh = true;
          root.asyncDraw();
        }
        let shift = listener.shiftKey;
        if (!shift) {
          // 有一个是固定宽高比的，整体都是
          for (let i = 0, len = listener.selected.length; i < len; i++) {
            if (listener.selected[i].constrainProportions) {
              shift = true;
              break;
            }
          }
        }
        const data: ResizeData[] = [];
        nodes.forEach((node, i) => {
          const p = node.parent;
          if (p && p instanceof Group) {
            p.fixedPosAndSize = false;
          }
          node.endSizeChange(originStyle[i]);
          node.checkPosSizeUpward();
          const d = nextNumber[i] - prevNumber[i];
          const rd: ResizeData = {
            dx: isWOrH ? d : 0,
            dy: isWOrH ? 0 : d,
            controlType: isWOrH ? CONTROL_TYPE.R : CONTROL_TYPE.B,
            aspectRatio: shift,
            fromCenter: false,
          };
          if (originStyle[i].width.u === StyleUnit.AUTO) {
            rd.widthFromAuto = true;
          }
          if (originStyle[i].height.u === StyleUnit.AUTO) {
            rd.heightFromAuto = true;
          }
          if (computedStyle[i].scaleX !== node.computedStyle.scaleX) {
            rd.flipX = true;
          }
          if (computedStyle[i].scaleY !== node.computedStyle.scaleY) {
            rd.flipY = true;
          }
          data.push(rd);
        });
        if (nodes.length && data.length) {
          listener.history.addCommand(new ResizeCommand(nodes, data));
        }
        listener.emit(Listener.RESIZE_NODE, nodes.slice(0));
      }
      onBlur();
      this.silence = false;
    };

    w.addEventListener('input', (e) => {
      onInputSize(e, true);
    });
    w.addEventListener('change', (e) => {
      onChangeSize(true);
    });
    w.addEventListener('blur', () => onBlur());

    h.addEventListener('input', (e) => {
      onInputSize(e, false);
    });
    h.addEventListener('change', (e) => {
      onChangeSize(false);
    });
    h.addEventListener('blur', () => onBlur());

    cp.addEventListener('click', (e) => {
      this.silence = true;
      if (cp.classList.contains('active')) {
        cp.classList.remove('active');
      }
      else {
        cp.classList.add('active');
      }
      const nodes: Node[] = [];
      const data: ConstrainProportionData[] = [];
      this.nodes.forEach((node) => {
        const prev = !!node.constrainProportions;
        const next = cp.classList.contains('active');
        if (prev !== next) {
          node.constrainProportions = next;
          nodes.push(node);
          data.push({
            prev,
            next,
          });
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new ConstrainProportionCommand(nodes, data));
        listener.emit(Listener.CONSTRAIN_PROPORTION_NODE, nodes.slice(0));
      }
      this.silence = false;
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
      const data: FlipHData[] = [];
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
        listener.history.addCommand(new FlipHCommand(nodes, data));
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
      const data: FlipVData[] = [];
      this.nodes.forEach((node, i) => {
        const prev = node.computedStyle.scaleY;
        const next = fv.classList.contains('active') ? -1 : 1;
        if (prev !== next) {
          node.updateStyle({
            scaleY: next,
          });
          nodes.push(node);
          data.push({
            prev: { scaleY: prev },
            next: { scaleY: next },
          });
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new FlipVCommand(nodes, data));
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.FLIP_V_NODE, nodes.slice(0));
      }
      this.silence = false;
    });

    const onOverflowChange = () => {
      this.silence = true;
      if (ov.classList.contains('checked')) {
        ov.className = 'ov un-checked';
      }
      else {
        ov.className = 'ov checked';
      }
      const nodes: Node[] = [];
      const data: OverflowData[] = [];
      this.nodes.forEach((node, i) => {
        nodes.push(node);
        const prev = node.computedStyle.overflow;
        if (node instanceof AbstractFrame) {
          const next = ov.classList.contains('checked') ? 'hidden' : 'visible';
          data.push({
            prev: {
              overflow: (['visible', 'hidden'][prev] || 'visible') as JStyle['overflow'],
            },
            next: {
              overflow: next as JStyle['overflow'],
            },
          });
          node.updateStyle({
            overflow: next,
          });
        }
        else {
          data.push({
            prev: {
              overflow: (['visible', 'hidden'][prev] || 'visible') as JStyle['overflow'],
            },
            next: {
              overflow: (['visible', 'hidden'][prev] || 'visible') as JStyle['overflow'],
            },
          });
        }
      });
      if (nodes.length) {
        listener.history.addCommand(new OverflowCommand(nodes, data));
        listener.select.updateSelect(this.nodes);
        listener.emit(Listener.OVERFLOW_NODE, nodes.slice(0));
      }
      this.silence = false;
    };

    ov.addEventListener('click', onOverflowChange);
    ov.nextElementSibling?.addEventListener('click', onOverflowChange);

    listener.on([
      Listener.MOVE_NODE,
      Listener.RESIZE_NODE,
      Listener.ROTATE_NODE,
      Listener.FLIP_H_NODE,
      Listener.FLIP_V_NODE,
      Listener.CONSTRAIN_PROPORTION_NODE,
      Listener.OVERFLOW_NODE,
      Listener.POSITION_NODE,
    ], (nodes: Node[]) => {
      // 输入的时候，防止重复触发；选择/undo/redo的时候则更新显示
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
    listener.on(Listener.STATE_CHANGE, (prev: state, next: state) => {
      if (next === state.EDIT_GEOM || next === state.NORMAL) {
        this.show(listener.selected);
      }
    });
  }

  override show(nodes: Node[]) {
    super.show(nodes);
    this.data = [];
    const panel = this.panel;
    if (this.listener.state === state.EDIT_GEOM) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    if (!nodes.length) {
      panel.querySelectorAll('.input-unit,.cp,.fh,.fv').forEach(item => {
        item.classList.add('disabled');
        item.classList.remove('active');
      });
      panel.querySelectorAll('input').forEach(item => {
        item.disabled = true;
        item.placeholder = '';
        item.value = '';
      });
      panel.querySelector('.ov')!.parentElement!.style.display = 'none';
      return;
    }
    panel.querySelectorAll('.input-unit,.cp,.fh,.fv').forEach(item => {
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
    const cps: boolean[] = [];
    const fhs: boolean[] = [];
    const fvs: boolean[] = [];
    const ovs: OVERFLOW[] = [];
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
        constrainProportions,
        overflow,
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
      if (!cps.includes(constrainProportions)) {
        cps.push(constrainProportions);
      }
      if (!fhs.includes(isFlippedHorizontal)) {
        fhs.push(isFlippedHorizontal);
      }
      if (!fvs.includes(isFlippedVertical)) {
        fvs.push(isFlippedVertical);
      }
      if (item instanceof AbstractFrame && !ovs.includes(overflow)) {
        ovs.push(overflow);
      }
    });
    const x = panel.querySelector('.x') as HTMLInputElement;
    const y = panel.querySelector('.y') as HTMLInputElement;
    const r = panel.querySelector('.r') as HTMLInputElement;
    const w = panel.querySelector('.w') as HTMLInputElement;
    const h = panel.querySelector('.h') as HTMLInputElement;
    const cp = panel.querySelector('.cp') as HTMLElement;
    const fh = panel.querySelector('.fh') as HTMLElement;
    const fv = panel.querySelector('.fv') as HTMLElement;
    const ov = panel.querySelector('.ov') as HTMLElement;
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
    r.disabled = nodes.filter(item => item instanceof Slice).length > 0;
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
    if (cps.length > 1 || cps[0]) {
      cp.classList.add('active');
    }
    else {
      cp.classList.remove('active');
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
    if (ovs.length) {
      ov.parentElement!.style.display = 'flex';
      if (ovs.length > 1) {
        ov.className = 'ov multi-checked';
      }
      else if (ovs[0] === OVERFLOW.VISIBLE) {
        ov.className = 'ov un-checked';
      }
      else if (ovs[0] === OVERFLOW.HIDDEN) {
        ov.className = 'ov checked';
      }
    }
    else {
      ov.parentElement!.style.display = 'none';
    }
    // symbolInstance和子节点禁止修改
    if (nodes.filter(item => item instanceof SymbolInstance).length > 0) {
      ov.parentElement!.style.display = 'none';
    }
    if (nodes.filter(item => item.symbolInstance).length > 0) {
      ov.parentElement!.style.display = 'none';
      panel.querySelectorAll('.input-unit,.cp,.fh,.fv').forEach(item => {
        item.classList.add('disabled');
      });
      panel.querySelectorAll('input').forEach(item => {
        item.disabled = true;
      });
    }
  }
}

export default BasicPanel;
