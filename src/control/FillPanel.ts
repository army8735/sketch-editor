import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import Text from '../node/Text';
import Bitmap from '../node/Bitmap';
import picker from './picker';
import { color2hexStr, color2rgbaInt, color2rgbaStr, getCssFillStroke } from '../style/css';
import Listener from './Listener';
import { ComputedGradient, ComputedPattern, GRADIENT, PATTERN_FILL_TYPE } from '../style/define';
import Panel from './Panel';
import { FillStyle } from '../format';
import FillCommand from '../history/FillCommand';

const html = `
  <h4 class="panel-title">填充</h4>
`;

function renderItem(
  index: number,
  multiFillEnable: boolean,
  fillEnable: boolean,
  multiFillOpacity: boolean,
  fillOpacity: number,
  fillColor: string[],
  fillPattern: ComputedPattern[],
  fillGradient: ComputedGradient[],
  width: number,
  height: number,
) {
  const multiColor = fillColor.length > 1;
  const multiPattern = fillPattern.length > 1;
  const multiGradient = fillGradient.length > 1;
  const multiFill = (fillColor.length ? 1 : 0) + (fillPattern.length ? 1 : 0) + (fillGradient.length ? 1 : 0) > 1;
  const multi = multiFill || multiColor || multiPattern || multiGradient;
  const readOnly = (multiFillEnable || !fillEnable || multiFill || multiPattern || multiGradient || fillPattern.length) ? 'readonly="readonly"' : '';
  let background = '';
  let txt1 = ' ';
  let txt2 = ' ';
  let txt3 = '多种';
  if (multiFill) {
    txt1 = '多个';
  }
  else if (fillColor.length) {
    txt1 = '颜色';
    txt2 = 'Hex';
    if (fillColor.length === 1) {
      background = fillColor[0];
    }
  }
  else if (fillPattern.length) {
    txt1 = '图像';
    txt2 = '显示';
    txt3 = ['填充', '适应', '拉伸', '平铺'][fillPattern[0].type];
    if (fillPattern.length === 1) {
      background = getCssFillStroke(fillPattern[0], width, height, true);
    }
    else {
      for (let i = 1, len = fillPattern.length; i < len; i++) {
        if (fillPattern[i].type !== fillPattern[0].type) {
          txt3 = '多个';
          break;
        }
      }
    }
  }
  else if (fillGradient.length) {
    txt1 = '渐变';
    txt2 = '类型';
    txt3 = ['线性', '径向', '角度'][fillGradient[0].t];
    if (fillGradient.length === 1) {
      background = getCssFillStroke(fillGradient[0], width, height, true);
    }
    else {
      for (let i = 1, len = fillGradient.length; i < len; i++) {
        if (fillGradient[i].t !== fillGradient[0].t) {
          txt3 = '多个';
          break;
        }
      }
    }
  }
  return `<div class="line" title="${index}">
    <span class="enabled ${multiFillEnable ? 'multi-checked' : (fillEnable ? 'checked' : 'un-checked')}"></span>
    <div class="color">
      <span class="picker-btn ${readOnly ? 'read-only' : ''}">
        <b class="pick ${multi ? 'multi' : ''}" style="${multi ? '' : `background:${background}`}">○○○</b>
      </span>
      <span class="txt">${txt1}</span>
    </div>
    <div class="value">
      <div class="hex ${(fillPattern.length || fillGradient.length) ? 'hide' : ''}">
        <span>#</span>
        <input type="text" value="${multiColor ? '' : color2hexStr(fillColor[0]).slice(1)}" placeholder="${multiColor ? '多个' : ''}" maxlength="8"/>
      </div>
      <div class="pattern ${(fillColor.length || fillGradient.length || multiPattern) ? 'hide' : ''}">
        <select disabled="disabled">
          <option value="${PATTERN_FILL_TYPE.FILL}" ${fillPattern[0]?.type === PATTERN_FILL_TYPE.FILL ? 'selected="selected"' : ''}>填充</option>
          <option value="${PATTERN_FILL_TYPE.FIT}" ${fillPattern[0]?.type === PATTERN_FILL_TYPE.FIT ? 'selected="selected"' : ''}>适应</option>
          <option value="${PATTERN_FILL_TYPE.STRETCH}" ${fillPattern[0]?.type === PATTERN_FILL_TYPE.STRETCH ? 'selected="selected"' : ''}>拉伸</option>
          <option value="${PATTERN_FILL_TYPE.TILE}" ${fillPattern[0]?.type === PATTERN_FILL_TYPE.TILE ? 'selected="selected"' : ''}>平铺</option>
        </select>
      </div>
      <div class="gradient ${(fillColor.length || fillPattern.length || multiGradient) ? 'hide' : ''}">
        <select>
          <option value="${GRADIENT.LINEAR}" ${fillGradient[0]?.t === GRADIENT.LINEAR ? 'selected="selected"' : ''}>线性</option>
          <option value="${GRADIENT.RADIAL}" ${fillGradient[0]?.t === GRADIENT.RADIAL ? 'selected="selected"' : ''}>径向</option>
          <option value="${GRADIENT.CONIC}" ${fillGradient[0]?.t === GRADIENT.CONIC ? 'selected="selected"' : ''}>角度</option>
        </select>
      </div>
      <div class="multi-type ${multiFill || multiPattern || multiGradient ? '' : 'hide'}">
        <select disabled="disabled">
          <option>${txt3}</option>
        </select>
      </div>
      <span class="txt">${txt2}</span>
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

class FillPanel extends Panel {
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'fill-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    dom.appendChild(panel);

    let nodes: Node[] = [];
    let prevs: FillStyle[] = [];
    let nexts: FillStyle[] = [];

    const pickCallback = () => {
      // 只有变更才会有next
      if (nexts.length) {
        listener.history.addCommand(new FillCommand(nodes, prevs.map((prev, i) => {
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
        if (picker.isShowFrom('fillPanel')) {
          picker.hide();
          return;
        }
        // 最开始记录nodes/prevs
        nodes = this.nodes.slice(0);
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
        const line = el.parentElement!.parentElement!.parentElement!;
        const index = parseInt(line.title);
        picker.show(el, this.nodes[0].computedStyle.fill[0], 'fillPanel',
          (data: number[] | ComputedGradient | ComputedPattern) => {
            this.silence = true;
            const style = (line.querySelector('.pick') as HTMLElement).style;
            // 类型变更需改变select/input展示
            if (Array.isArray(data)) {
              panel.querySelector('.value .hex')!.classList.remove('hide');
              panel.querySelector('.value .gradient')!.classList.add('hide');
              panel.querySelector('.value .multi-type')!.classList.add('hide');
              const c = color2hexStr(data);
              (line.querySelector('.hex input') as HTMLInputElement).value = c.slice(1);
              style.background = color2rgbaStr(data);
            }
            else {
              const p = data as ComputedPattern;
              if (p.url !== undefined) {}
              else {
                data = data  as ComputedGradient;
                panel.querySelector('.value .hex')!.classList.add('hide');
                panel.querySelector('.value .gradient')!.classList.remove('hide');
                panel.querySelector('.value .multi-type')!.classList.add('hide');
                const select = panel.querySelector('.value .gradient select') as HTMLSelectElement;
                select.value = data.t.toString();
                style.background = getCssFillStroke(data, this.nodes[0].width, this.nodes[0].height, true);
              }
            }
            nexts = [];
            nodes.forEach(node => {
              const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
              const cssFill = fill.map((item, i) => {
                if (i === index) {
                  return getCssFillStroke(data, node.width, node.height);
                }
                else {
                  return getCssFillStroke(item, node.width, node.height);
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
            if (nodes.length) {
              listener.emit(Listener.FILL_NODE, nodes.slice(0));
            }
            this.silence = false;
          }, pickCallback);
      }
      else if (classList.contains('enabled')) {
        this.silence = true;
        const line = el.parentElement!;
        const index = parseInt(line.title);
        const nodes = this.nodes.slice(0);
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
          if (fe[index] !== undefined) {
            fe[index] = value;
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
          line.querySelectorAll('input:read-only').forEach((item) => {
            (item as HTMLInputElement).readOnly = false;
          });
        }
        else {
          classList.remove('checked');
          classList.add('un-checked');
          line.querySelectorAll('input').forEach(item => {
            (item as HTMLInputElement).readOnly = true;
          });
        }
        if (nodes.length) {
          listener.emit(Listener.FILL_NODE, nodes.slice(0));
          listener.history.addCommand(new FillCommand(nodes, prevs.map((prev, i) => {
            return { prev, next: nexts[i] };
          })));
        }
        this.silence = false;
      }
    });

    // 颜色input防止无效输入，undo/redo干扰输入
    panel.addEventListener('keydown', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName.toUpperCase() === 'INPUT' && target.type === 'text') {
        const { keyCode, code } = e;
        if (e.metaKey || listener.isWin && e.ctrlKey || e.shiftKey || e.altKey) {
        }
        else if (keyCode >= 48 && keyCode <= 57 // 0-9
          || /Digit\d/.test(code)
          || keyCode >= 37 && keyCode <= 40 // 上下左右
          || ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(code)
          || keyCode >= 65 && keyCode <= 90 // a-z
          || /Key[A-Z]/.test(code)
          || keyCode === 8 // backspace
          || code === 'Backspace'
          || keyCode === 46 // delete
          || code === 'Delete'
          || keyCode === 27 // esc
          || code === 'Escape'
          || keyCode === 13 // enter
          || code === 'Enter'
          || keyCode === 20 // capslock
          || code === 'CapsLock'
        ) {}
        else {
          e.preventDefault();
        }
      }
    });

    panel.addEventListener('input', (e) => {
      this.silence = true;
      const input = e.target as HTMLInputElement;
      const line = input.parentElement!.parentElement!.parentElement!;
      const index = parseInt(line.title);
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      if (input.type === 'text') {
        const value = color2rgbaInt(input.value);
        this.nodes.forEach((node, i) => {
          if (isFirst) {
            nodes.push(node);
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
          o.fill[index] = value;
          node.updateStyle(o);
        });
        input.placeholder = '';
        const b = line.querySelector('.picker-btn b') as HTMLElement;
        b.title = b.style.background = color2rgbaStr(value);
      }
      else if (input.type === 'number') {
        const n = Math.min(100, Math.max(0, parseFloat(input.value) || 0));
        const isInput = e instanceof InputEvent; // 上下键还是真正输入
        this.nodes.forEach((node, i) => {
          if (isFirst) {
            nodes.push(node);
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
          const prev = prevs[i].fillOpacity[index] * 100;
          let next = n;
          let d = 0;
          if (isInput) {
            d = next - prev;
            if (!i) {
              input.placeholder = '';
            }
          }
          else {
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
            if (!i) {
              input.value = input.placeholder ? '' : next.toString();
            }
          }
          if (d) {
            o.fillOpacity[index] = next * 0.01;
            node.updateStyle(o);
          }
        });
      }
      if (nodes.length) {
        listener.emit(Listener.FILL_NODE, nodes.slice(0));
      }
      this.silence = false;
    });

    panel.addEventListener('change', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      if (tagName === 'SELECT') {
        if (target.parentElement!.classList.contains('pattern')) {}
        else {
          const line = target.parentElement!.parentElement!.parentElement!;
          const index = parseInt(line.title);
          nodes = this.nodes.slice(0);
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
              if (i === index) {
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
          if (nodes.length) {
            listener.emit(Listener.FILL_NODE, nodes.slice(0));
          }
        }
      }
      else if (tagName === 'INPUT') {
        pickCallback();
      }
    });

    listener.on([
      Listener.FILL_NODE,
    ], (nodes: Node[]) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
  }

  override show(nodes: Node[]) {
    const panel = this.panel;
    // 老的清除
    this.panel.querySelectorAll('.line').forEach(item => {
      item.remove();
    });
    this.nodes = nodes.filter(item => {
      if (item instanceof Polyline
        || item instanceof ShapeGroup
        || item instanceof Text
        || item instanceof Bitmap
      ) {
        return true;
      }
      return false;
    });
    if (!this.nodes.length) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    const fillList: (number[] | ComputedGradient | ComputedPattern)[][] = [];
    const fillEnableList: boolean[][] = [];
    const fillOpacityList: number[][] = [];
    this.nodes.forEach(node => {
      const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
      fill.forEach((item, i) => {
        const o = fillList[i] = fillList[i] || [];
        // 对象一定引用不同，具体值是否相等后续判断
        o.push(item);
      });
      fillEnable.forEach((item, i) => {
        const o = fillEnableList[i] = fillEnableList[i] || [];
        if (!o.includes(item)) {
          o.push(item);
        }
      });
      fillOpacity.forEach((item, i) => {
        const o = fillOpacityList[i] = fillOpacityList[i] || [];
        if (!o.includes(item)) {
          o.push(item);
        }
      });
    });
    for (let i = fillList.length - 1; i >= 0; i--) {
      const fill = fillList[i];
      const fillEnable = fillEnableList[i];
      const fillOpacity = fillOpacityList[i];
      // fill有3种
      const fillColor: string[] = [];
      const fillPattern: ComputedPattern[] = [];
      const fillGradient: ComputedGradient[] = [];
      fill.forEach(item => {
        if (Array.isArray(item)) {
          const c = color2rgbaStr(item);
          if (!fillColor.includes(c)) {
            fillColor.push(c);
          }
          return;
        }
        const p = item as ComputedPattern;
        if (p.url !== undefined) {
          for (let i = 0, len = fillPattern.length; i < len; i++) {
            const o = fillPattern[i];
            if (o.url === p.url && o.type === p.type && o.scale === p.scale) {
              return;
            }
          }
          fillPattern.push(p);
          return;
        }
        const g = item as ComputedGradient;
        outer:
        for (let i = 0, len = fillGradient.length; i < len; i++) {
          const o = fillGradient[i];
          if (o.t !== g.t) {
            continue;
          }
          if (o.d.length !== g.d.length) {
            continue;
          }
          for (let j = o.d.length - 1; j >= 0; j--) {
            if (o.d[j] !== g.d[j]) {
              continue outer;
            }
          }
          if (o.stops.length !== g.stops.length) {
            continue;
          }
          for (let j = o.stops.length - 1; j >= 0; j--) {
            const a = o.stops[j];
            const b = g.stops[j];
            if (a.color[0] !== b.color[0]
              || a.color[1] !== b.color[1]
              || a.color[2] !== b.color[2]
              || a.color[3] !== b.color[3]
              || a.offset !== b.offset) {
              continue outer;
            }
          }
          // 找到相等的就不添加
          return;
        }
        fillGradient.push(g);
      });
      panel.innerHTML += renderItem(
        i,
        fillEnable.length > 1,
        fillEnable[0],
        fillOpacity.length > 1,
        fillOpacity[0],
        fillColor,
        fillPattern,
        fillGradient,
        this.nodes[0].width,
        this.nodes[0].height,
      );
    }
  }
}

export default FillPanel;
