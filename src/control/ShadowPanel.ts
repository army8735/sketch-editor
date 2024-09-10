import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import Panel from './Panel';
import { ShadowStyle } from '../format';
import ShadowCommand from '../history/ShadowCommand';
import picker from './picker';
import { color2hexStr, color2rgbaStr, getCssShadow } from '../style/css';
import { ComputedShadow } from '../style/define';

const html = `
  <div class="panel-title">阴影<b class="btn del"></b><b class="btn add"></b></div>
`;

function renderItem(
  index: number,
  multiEnable: boolean,
  enable: boolean,
  multiColor: boolean,
  color: string,
  multiX: boolean,
  x: number,
  multiY: boolean,
  y: number,
  multiBlur: boolean,
  blur: number,
  multiSpread: boolean,
  spread: number,
) {
  const readOnly = (multiEnable || !enable) ? 'readonly="readonly"' : '';
  return `<div class="line" title="${index}">
    <span class="enabled ${multiEnable ? 'multi-checked' : (enable ? 'checked' : 'un-checked')}"></span>
    <div class="color">
      <span class="picker-btn ${readOnly ? 'read-only' : ''}">
        <b class="pick ${multiColor ? 'multi' : ''}" style="${multiColor ? '' : `background:${color}`}" title="${color}">○○○</b>
      </span>
      <span class="txt">颜色</span>
    </div>
    <div>
      <input class="x" type="number" min="-500000" max="500000" step="1" value="${multiX ? '' : x}" placeholder="${multiX ? '多个' : ''}" ${readOnly}/>
      <span class="txt">X</span>
    </div>
    <div>
      <input class="y" type="number" min="-500000" max="500000" step="1" value="${multiY ? '' : y}" placeholder="${multiY ? '多个' : ''}" ${readOnly}/>
      <span class="txt">Y</span>
    </div>
    <div>
      <input class="blur" type="number" min="0" max="50" step="1" value="${multiBlur ? '' : blur}" placeholder="${multiBlur ? '多个' : ''}" ${readOnly}/>
      <span class="txt">模糊</span>
    </div>
  </div>`;
}

class ShadowPanel extends Panel {
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'shadow-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    let nodes: Node[] = [];
    let prevs: ShadowStyle[] = [];
    let nexts: ShadowStyle[] = [];

    // 选择颜色会刷新但不产生步骤，关闭颜色面板后才callback产生
    const pickCallback = () => {
      // 只有变更才会有next
      if (nexts && nexts.length) {
        listener.history.addCommand(new ShadowCommand(nodes, prevs.map((prev, i) => {
          return { prev, next: nexts[i] };
        })));
      }
      nodes = [];
      prevs = [];
      nexts = [];
    };

    panel.addEventListener('click', (e) => {
      const el = e.target as HTMLElement;
      const classList = el.classList;
      if (classList.contains('pick')) {
        // picker侦听了document全局click隐藏窗口，这里停止向上冒泡
        e.stopPropagation();
        if (el.parentElement!.classList.contains('read-only')) {
          return;
        }
        if (picker.isShowFrom('shadowPanel')) {
          picker.hide();
          pickCallback();
          return;
        }
        const index = parseInt(el.parentElement!.parentElement!.parentElement!.title);
        const p = picker.show(el, 'shadowPanel', pickCallback);
        // 最开始记录nodes/prevs
        nodes = this.nodes.slice(0);
        prevs = [];
        nodes.forEach(node => {
          const { shadow, shadowEnable } = node.getComputedStyle();
          const cssShadow = shadow.map(item => getCssShadow(item));
          prevs.push({
            shadow: cssShadow,
            shadowEnable,
          });
        });
        // 每次变更记录更新nexts
        p.onChange = (color: any) => {
          this.silence = true;
          nexts = [];
          nodes.forEach(node => {
            const { shadow, shadowEnable } = node.getComputedStyle();
            const cssShadow = shadow.map((item, i) => {
              if (i === index) {
                return getCssShadow({
                  color: color.rgba,
                  x: item.x,
                  y: item.y,
                  blur: item.blur,
                  spread: item.spread,
                });
              }
              else {
                return getCssShadow(item);
              }
            });
            const o = {
              shadow: cssShadow,
              shadowEnable,
            };
            nexts.push(o);
            node.updateStyle(o);
          });
          if (nodes.length) {
            listener.emit(Listener.SHADOW_NODE, nodes.slice(0));
          }
          el.title = el.style.background = color2hexStr(color.rgba);
          this.silence = false;
        };
        p.onDone = () => {
          picker.hide();
          pickCallback();
        };
      }
      else if (classList.contains('add')) {
        this.silence = true;
        const nodes = this.nodes.slice(0);
        const prevs: ShadowStyle[] = [];
        const nexts: ShadowStyle[] = [];
        nodes.forEach(node => {
          const { shadow, shadowEnable } = node.getComputedStyle();
          const cssShadow = shadow.map(item => getCssShadow(item));
          prevs.push({
            shadow: cssShadow,
            shadowEnable,
          });
          const s = cssShadow.slice(0);
          const se = shadowEnable.slice(0);
          s.push('rgba(0,0,0,0.5) 0 2 4 0');
          se.push(true);
          const o = {
            shadow: s,
            shadowEnable: se,
          };
          nexts.push(o);
          node.updateStyle(o);
        });
        this.show(nodes);
        listener.emit(Listener.SHADOW_NODE, nodes.slice(0));
        listener.history.addCommand(new ShadowCommand(nodes.slice(0), prevs.map((prev, i) => {
          return {
            prev,
            next: nexts[i],
          };
        })));
        this.silence = false;
      }
      else if (classList.contains('del')) {
        this.silence = true;
        const nodes = this.nodes.slice(0);
        const prevs: ShadowStyle[] = [];
        const nexts: ShadowStyle[] = [];
        let len = 0;
        nodes.forEach(node => {
          const { shadow, shadowEnable } = node.getComputedStyle();
          const cssShadow = shadow.map(item => getCssShadow(item));
          len = Math.max(len, shadowEnable.length);
          prevs.push({
            shadow: cssShadow,
            shadowEnable,
          });
          nexts.push({
            shadow: cssShadow.slice(0),
            shadowEnable: shadowEnable.slice(0),
          });
        });
        // 先按第几个shadow维度循环
        outer:
        for (let i = len - 1; i >= 0; i--) {
          for (let j = 0, len = nexts.length; j < len; j++) {
            const { shadowEnable } = nexts[j];
            // 如果有启用的，这第i个shadow不能删除
            if (shadowEnable[i]) {
              continue outer;
            }
          }
          nexts.forEach(item => {
            item.shadow.splice(i, 1);
            item.shadowEnable.splice(i, 1);
          });
        }
        nodes.forEach((node, i) => {
          node.updateStyle(nexts[i]);
        });
        this.show(nodes);
        listener.emit(Listener.SHADOW_NODE, nodes.slice(0));
        listener.history.addCommand(new ShadowCommand(nodes.slice(0), prevs.map((prev, i) => {
          return {
            prev,
            next: nexts[i],
          };
        })));
        this.silence = false;
      }
      else if (classList.contains('enabled')) {
        const index = parseInt(el.parentElement!.title);
        this.silence = true;
        const nodes = this.nodes.slice(0);
        const prevs: ShadowStyle[] = [];
        const nexts: ShadowStyle[] = [];
        let value = false;
        if (classList.contains('multi-checked') || classList.contains('un-checked')) {
          value = true;
        }
        nodes.forEach(node => {
          const { shadow, shadowEnable } = node.getComputedStyle();
          const cssShadow = shadow.map(item => getCssShadow(item));
          prevs.push({
            shadow: cssShadow,
            shadowEnable,
          });
          const s = cssShadow.slice(0);
          const se = shadowEnable.slice(0);
          if (se[index] !== undefined) {
            se[index] = value;
          }
          const o = {
            shadow: s,
            shadowEnable: se,
          };
          nexts.push(o);
          node.updateStyle(o);
        });
        this.show(nodes);
        listener.emit(Listener.SHADOW_NODE, nodes.slice(0));
        listener.history.addCommand(new ShadowCommand(nodes.slice(0), prevs.map((prev, i) => {
          return {
            prev,
            next: nexts[i],
          };
        })));
        this.silence = false;
      }
    });

    panel.addEventListener('input', (e) => {
      this.silence = true;
      pickCallback();
      const input = e.target as HTMLInputElement;
      const index = parseInt((input.parentElement!.parentElement as HTMLElement).title);
      const classList = input.classList;
      let type = 1; // x
      if (classList.contains('y')) {
        type = 2;
      }
      else if (classList.contains('blur')) {
        type = 3;
      }
      else if (classList.contains('spread')) {
        type = 4;
      }
      let n = parseFloat(input.value) || 0;
      if (n > 500000 || n < -500000) {
        n = 0;
      }
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        if (isFirst) {
          nodes.push(node);
          const { shadow, shadowEnable } = node.getComputedStyle();
          const cssShadow = shadow.map(item => getCssShadow(item));
          prevs.push({
            shadow: cssShadow,
            shadowEnable,
          });
        }
        const o = {
          shadow: prevs[i].shadow.slice(0),
          shadowEnable: prevs[i].shadowEnable.slice(0),
        };
        nexts.push(o);
        const p = parseFloat(prevs[i].shadow[index].split(' ')[type]);
        let next = n;
        if (!isInput) {
          let d = 0;
          if (input.placeholder) {
            d = n > 0 ? 1 : -1;
            if (listener.shiftKey) {
              d *= 10;
            }
          }
          else {
            d = n - p;
            if (listener.shiftKey) {
              d *= 10;
            }
          }
          next = p + d;
          if (!input.placeholder) {
            input.value = Math.round(next).toString();
          }
          else {
            input.value = '';
          }
        }
        else {
          input.placeholder = '';
        }
        if (o.shadow[index]) {
          const arr = o.shadow[index].split(' ');
          arr[type] = next.toString();
          o.shadow[index] = arr.join(' ');
          node.updateStyle(o);
        }
      });
      if (nodes.length) {
        listener.emit(Listener.SHADOW_NODE, nodes.slice(0));
      }
      this.silence = false;
    });

    panel.addEventListener('change', (e) => {
      if (nexts.length) {
        listener.history.addCommand(new ShadowCommand(nodes, prevs.map((prev, i) => {
          return {
            prev,
            next: nexts[i],
          };
        })));
      }
      nodes = [];
      prevs = [];
      nexts = [];
    });

    listener.on([
      Listener.SELECT_NODE,
      Listener.ADD_NODE,
      Listener.SHADOW_NODE,
    ], (nodes: Node[]) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
    listener.on(Listener.REMOVE_NODE, () => {
      if (this.silence) {
        return;
      }
      this.show([]);
    });
  }

  show(nodes: Node[]) {
    this.nodes = nodes;
    const panel = this.panel;
    // 老的清除
    this.panel.querySelectorAll('.line').forEach(item => {
      item.remove();
    });
    if (!nodes.length) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    const shadowEnableList: boolean[][] = [];
    const shadowList: ComputedShadow[][] = [];
    nodes.forEach(node => {
      const { shadow, shadowEnable } = node.getComputedStyle();
      shadowEnable.forEach((item, i) => {
        const o = shadowEnableList[i] = shadowEnableList[i] || [];
        if (!o.includes(item)) {
          o.push(item);
        }
      });
      shadow.forEach((item, i) => {
        const o = shadowList[i] = shadowList[i] || [];
        if (!o.includes(item)) {
          o.push(item);
        }
      });
    });
    let showDel = false;
    for (let i = shadowList.length - 1; i >= 0; i--) {
      const shadow = shadowList[i];
      const shadowEnable = shadowEnableList[i];
      const color: string[] = [];
      const x: number[] = [];
      const y: number[] = [];
      const blur: number[] = [];
      const spread: number[] = [];
      shadow.forEach(item => {
        const data = item;
        const c = color2rgbaStr(data.color);
        if (!color.includes(c)) {
          color.push(c);
        }
        if (!x.includes(data.x)) {
          x.push(data.x);
        }
        if (!y.includes(data.y)) {
          y.push(data.y);
        }
        if (!blur.includes(data.blur)) {
          blur.push(data.blur);
        }
        if (!spread.includes(data.spread)) {
          spread.push(data.spread);
        }
      });
      panel.innerHTML += renderItem(
        i,
        shadowEnable.length > 1,
        shadowEnable[0],
        color.length > 1,
        color[0],
        x.length > 1,
        x[0],
        y.length > 1,
        y[0],
        blur.length > 1,
        blur[0],
        spread.length > 1,
        spread[0],
      );
      if (shadowEnable.length === 1 && !shadowEnable[0]) {
        showDel = true;
      }
    }
    const btn = this.panel.querySelector('.del') as HTMLElement;
    btn.style.display = showDel ? 'block' : 'none';
  }
}

export default ShadowPanel;
