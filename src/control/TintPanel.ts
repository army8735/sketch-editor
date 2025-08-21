import Node from '../node/Node';
import Root from '../node/Root';
import Group from '../node/Group';
import Listener from './Listener';
import Panel from './Panel';
import { getCssFillStroke } from '../style/css';
import { color2hexStr, color2rgbaInt, color2rgbaStr } from '../style/color';
import { FillStyle } from '../format';
import picker from './picker';
import { ComputedGradient, ComputedPattern } from '../style/define';
import TintCommand from '../history/TintCommand';
import state from './state';

const html = `
  <h4 class="panel-title">色调</h4>
`;

function renderItem(
  multiFillEnable: boolean,
  fillEnable: boolean,
  multiFillOpacity: boolean,
  fillOpacity: number,
  fillColor: string[],
) {
  const multiColor = fillColor.length > 1;
  const readOnly = (multiFillEnable || !fillEnable || multiColor) ? 'readonly="readonly"' : '';
  let background = '';
  if (fillColor.length === 1) {
    background = fillColor[0];
  }
  return `<div class="line">
    <span class="enabled ${multiFillEnable ? 'multi-checked' : (fillEnable ? 'checked' : 'un-checked')}"></span>
    <div class="color">
      <span class="picker-btn ${readOnly ? 'read-only' : ''}">
        <b class="pick ${multiColor ? 'multi' : ''}" style="${multiColor ? '' : `background:${background}`}">○○○</b>
      </span>
      <span class="txt">颜色</span>
    </div>
    <div class="value">
      <div class="hex">
        <span>#</span>
        <input type="text" value="${multiColor ? '' : color2hexStr(fillColor[0]).slice(1)}" placeholder="${multiColor ? '多个' : ''}" maxlength="8"/>
      </div>
      <span class="txt">Hex</span>
    </div>
    <div class="opacity">
      <div class="input-unit">
        <input type="number" min="0" max="100" step="1" value="${multiFillOpacity ? '' : fillOpacity * 100}" placeholder="${multiFillOpacity ? '多个' : ''}"/>
        <span class="unit">%</span>
      </div>
      <span class="txt">不透明度</span>
    </div>
  </div>`;
}

class TintPanel extends Panel {
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'tint-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    dom.appendChild(panel);

    let nodes: Group[] = [];
    let prevs: FillStyle[] = [];
    let nexts: FillStyle[] = [];
    let hasRefresh = true; // onInput是否触发了刷新，onChange识别看是否需要兜底触发

    const pickCallback = (independence = false) => {
      // 只有变更才会有next
      if (nodes.length && nexts.length) {
        listener.history.addCommand(new TintCommand(nodes, prevs.map((prev, i) => {
          return { prev, next: nexts[i] };
        })), independence);
        listener.emit(Listener.TINT_NODE, nodes.slice(0));
        onBlur();
      }
    };

    const onBlur = () => {
      nodes = [];
      prevs = [];
      nexts = [];
    };

    const setPrev = () => {
      nodes = this.nodes.slice(0) as Group[];
      prevs = [];
      nodes.forEach(node => {
        const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
        const cssFill = fill.map(item => getCssFillStroke(item, node.width, node.height));
        prevs.push({
          fill: cssFill,
          fillOpacity,
          fillEnable,
        });
      });
    };

    panel.addEventListener('click', (e) => {
      const el = e.target as HTMLElement;
      const classList = el.classList;
      const line = el.parentElement!.parentElement!.parentElement!;
      if (classList.contains('pick')) {
        if (el.parentElement!.classList.contains('read-only')) {
          return;
        }
        if (picker.isShowFrom('tintPanel')) {
          picker.hide();
          return;
        }
        // picker侦听了document全局click隐藏窗口，这里停止
        picker.keep = true;
        // 最开始记录nodes/prevs
        setPrev();

        const fill = this.nodes[0].computedStyle.fill[0];
        const onInput = (data: number[] | ComputedGradient | ComputedPattern, fromGradient = false, changeType = false) => {
          this.silence = true;
          const style = (line.querySelector('.pick') as HTMLElement).style;
          if (Array.isArray(data)) {
            panel.querySelector(`.line .value .hex`)?.classList.remove('hide');
            const c = color2hexStr(data);
            (line.querySelector('.hex input') as HTMLInputElement).value = c.slice(1);
            style.background = color2rgbaStr(data);
          }
          nexts = [];
          nodes.forEach(node => {
            const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
            const cssFill = fill.map((item, i) => {
              if (i === 0) {
                return getCssFillStroke(data);
              }
              else {
                return getCssFillStroke(item);
              }
            });
            const o = {
              fill: cssFill,
              fillOpacity,
              fillEnable,
            };
            nexts.push(o);
            node.updateStyle(o);
          });
          this.silence = false;
        };
        // 取消可能的其它编辑态
        listener.cancelEditGeom();
        listener.cancelEditGradient();
        picker.hide();
        picker.show(el, fill, 'tintPanel', onInput, () => {
          this.silence = true;
          pickCallback(true);
          setPrev();
          this.silence = false;
        }, setPrev, listener);
      }
      else if (classList.contains('enabled')) {
        this.silence = true;
        const line = el.parentElement!;
        const nodes = this.nodes.slice(0) as Group[];
        const prevs: FillStyle[] = [];
        const nexts: FillStyle[] = [];
        let value = false;
        if (classList.contains('multi-checked') || classList.contains('un-checked')) {
          value = true;
        }
        nodes.forEach(node => {
          const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
          const cssFill = fill.map(item => getCssFillStroke(item, node.width, node.height));
          prevs.push({
            fill: cssFill,
            fillOpacity,
            fillEnable,
          });
          const f = cssFill.slice(0);
          const fe = fillEnable.slice(0);
          const fo = fillOpacity.slice(0);
          if (fe[0] !== undefined) {
            fe[0] = value;
          }
          const o = {
            fill: f,
            fillEnable: fe,
            fillOpacity: fo,
          };
          nexts.push(o);
          node.updateStyle(o);
        });
        classList.remove('multi-checked');
        if (value) {
          classList.remove('un-checked');
          classList.add('checked');
          line.querySelector('.read-only')?.classList.remove('read-only');
          line.querySelectorAll('input:read-only').forEach((item) => {
            (item as HTMLInputElement).readOnly = false;
          });
        }
        else {
          classList.remove('checked');
          classList.add('un-checked');
          line.querySelector('.picker-btn')?.classList.add('read-only');
          line.querySelectorAll('input').forEach(item => {
            (item as HTMLInputElement).readOnly = true;
          });
        }
        if (nodes.length) {
          listener.history.addCommand(new TintCommand(nodes, prevs.map((prev, i) => {
            return { prev, next: nexts[i] };
          })));
          listener.emit(Listener.TINT_NODE, nodes.slice(0));
        }
        this.silence = false;
      }
    });

    panel.addEventListener('input', (e) => {
      this.silence = true;
      const input = e.target as HTMLInputElement;
      const line = input.parentElement!.parentElement!.parentElement!;
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      if (input.type === 'text') {
        hasRefresh = false;
        const value = color2rgbaInt(input.value);
        this.nodes.forEach((node, i) => {
          if (isFirst) {
            nodes.push(node as Group);
            const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
            const cssFill = fill.map(item => getCssFillStroke(item, node.width, node.height));
            prevs.push({
              fill: cssFill,
              fillOpacity,
              fillEnable,
            });
          }
          const o = {
            fill: prevs[i].fill.slice(0),
            fillOpacity: prevs[i].fillOpacity.slice(0),
            fillEnable: prevs[i].fillEnable.slice(0),
          };
          nexts.push(o);
          o.fill[0] = value;
          node.updateStyle(o, true);
        });
        input.placeholder = '';
        const b = line.querySelector('.picker-btn b') as HTMLElement;
        b.title = b.style.background = color2rgbaStr(value);
      }
      else if (input.type === 'number') {
        const n = Math.min(100, Math.max(0, parseFloat(input.value) || 0));
        const isInput = e instanceof InputEvent; // 上下键还是真正输入
        hasRefresh = !isInput;
        this.nodes.forEach((node, i) => {
          if (isFirst) {
            nodes.push(node as Group);
            const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
            const cssFill = fill.map(item => getCssFillStroke(item, node.width, node.height));
            prevs.push({
              fill: cssFill,
              fillOpacity,
              fillEnable,
            });
          }
          const o = {
            fill: prevs[i].fill.slice(0),
            fillOpacity: prevs[i].fillOpacity.slice(0),
            fillEnable: prevs[i].fillEnable.slice(0),
          };
          nexts.push(o);
          const prev = prevs[i].fillOpacity[0] * 100;
          if (isInput) {
            o.fillOpacity[0] = n * 0.01;
            node.updateStyle(o, true);
            if (input.placeholder) {
              input.placeholder = '';
            }
          }
          else {
            let next = n;
            let d = 0;
            // 由于min/max限制，在极小值的时候下键获取的值不再是-1而是0，仅会发生在multi情况，单个直接被限制min/max不会有input事件
            if (next === 0) {
              next = -1;
            }
            // 多个的时候有placeholder无值，差值就是1或-1；单个则是值本身
            if (input.placeholder) {
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
            next = Math.max(next, 0);
            next = Math.min(next, 100);
            if (d) {
              o.fillOpacity[0] = next * 0.01;
              node.updateStyle(o);
            }
            if (!i) {
              input.value = input.placeholder ? '' : next.toString();
            }
          }
        });
      }
      this.silence = false;
    });

    panel.addEventListener('change', (e) => {
      this.silence = true;
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'SELECT') {
        if (target.parentElement!.classList.contains('pattern')) {}
        else {
          nodes = this.nodes.slice(0) as Group[];
          prevs = [];
          nexts = [];
          nodes.forEach(node => {
            const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
            const cssFill = fill.map(item => getCssFillStroke(item, node.width, node.height));
            prevs.push({
              fill: cssFill,
              fillOpacity,
              fillEnable,
            });
            const cssFill2 = fill.map((item, i) => {
              if (i === 0) {
                (item as ComputedGradient).t = parseInt((target as HTMLSelectElement).value);
                return getCssFillStroke(item, node.width, node.height);
              }
              else {
                return getCssFillStroke(item, node.width, node.height);
              }
            });
            const o = {
              fill: cssFill2,
              fillOpacity,
              fillEnable,
            };
            nexts.push(o);
            node.updateStyle(o);
          });
          pickCallback();
        }
      }
      else if (tagName === 'INPUT') {
        if (!hasRefresh) {
          hasRefresh = true;
          root.asyncDraw();
        }
        pickCallback();
      }
      this.silence = false;
    });

    panel.addEventListener('blur', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'INPUT') {
        onBlur();
      }
    });

    listener.on([
      Listener.TINT_NODE,
    ], (nodes: Node[], idx: number[]) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
      if (listener.state === state.EDIT_GRADIENT) {
        // node一般相等，就是第0个，用记录的索引确定更新的是哪个fill，如果不相等说明是在另外node打开picker后执行undo/redo
        const node = listener.gradient.node!;
        if (nodes[0] === node && idx[0] === 0) {
          listener.gradient.update(node, node.computedStyle.fill[0]);
          listener.select.hideSelect();
        }
        else {
          listener.gradient.hide();
          picker.hide();
          listener.state = state.NORMAL;
          listener.emit(Listener.STATE_CHANGE, state.EDIT_GRADIENT, state.NORMAL);
        }
      }
    });
  }

  override show(nodes: Node[]) {
    const panel = this.panel;
    // 老的清除
    this.panel.querySelectorAll('.line').forEach(item => {
      item.remove();
    });
    this.nodes = nodes.filter(item => item instanceof Group);
    if (!this.nodes.length || this.nodes.length !== nodes.length) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    // 很像fillPanel，但限制只存在1个fill，因此简化
    const fillList: (number[])[] = [];
    const fillEnableList: boolean[] = [];
    const fillOpacityList: number[] = [];
    this.nodes.forEach(node => {
      const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
      if (fill[0] && Array.isArray(fill[0])) {
        // 对象一定引用不同，具体值是否相等后续判断
        fillList.push(fill[0]);
      }
      if (fillEnable[0] !== undefined && !fillEnableList.includes(fillEnable[0])) {
        fillEnableList.push(fillEnable[0]);
      }
      if (fillOpacity[0] !== undefined && !fillOpacityList.includes(fillOpacity[0])) {
        fillOpacityList.push(fillOpacity[0]);
      }
    });
    const fillColor: string[] = [];
    fillList.forEach(item => {
      const c = color2rgbaStr(item);
      if (!fillColor.includes(c)) {
        fillColor.push(c);
      }
    });
    if (fillColor.length > 0) {
      panel.innerHTML += renderItem(
        fillEnableList.length > 1,
        fillEnableList[0],
        fillOpacityList.length > 1,
        fillOpacityList[0],
        fillColor,
      );
    }
  }
}

export default TintPanel;
