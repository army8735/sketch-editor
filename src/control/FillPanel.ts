import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import Text from '../node/Text';
import Bitmap from '../node/Bitmap';
import picker from './picker';
import { color2hexStr, color2rgbaInt, color2rgbaStr, getCssFill } from '../style/css';
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
  multiEnable: boolean,
  enable: boolean,
  multiOpacity: boolean,
  opacity: number,
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
  const readOnly = (multiEnable || !enable || multiFill || multiPattern || multiGradient || fillPattern.length || fillGradient.length) ? 'readonly="readonly"' : '';
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
    if (fillPattern.length === 1) {
      background = getCssFill(fillPattern[0]);
    }
    else {
      txt3 = ['填充', '适应', '拉伸', '平铺'][fillPattern[0].type];
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
    if (fillGradient.length === 1) {
      background = getCssFill(fillGradient[0], width, height);
    }
    else {
      txt3 = ['线性', '径向', '角度'][fillGradient[0].t];
      for (let i = 1, len = fillGradient.length; i < len; i++) {
        if (fillGradient[i].t !== fillGradient[0].t) {
          txt3 = '多个';
          break;
        }
      }
    }
  }
  return `<div class="line" title="${index}">
    <span class="enabled ${multiEnable ? 'multi-checked' : (enable ? 'checked' : 'un-checked')}"></span>
    <div class="color">
      <span class="picker-btn ${readOnly ? 'read-only' : ''}">
        <b class="pick ${multi ? 'multi' : ''}" style="${multi ? '' : `background:${background}`}" title="${background}">○○○</b>
      </span>
      <span class="txt">${txt1}</span>
    </div>
    <div class="hex">
      <div class="color ${(fillPattern.length || fillGradient.length) ? 'hide' : ''}">
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
        <select disabled="disabled">
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
        <input type="number" min="0" max="100" step="1" value="${multiOpacity ? '' : opacity * 100}" placeholder="${multiOpacity ? '多个' : ''}"/>
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
    this.dom.appendChild(panel);

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
        const line = el.parentElement!.parentElement!.parentElement!;
        const index = parseInt(line.title);
        const p = picker.show(el, 'fillPanel', pickCallback);
        // 最开始记录nodes/prevs
        nodes = this.nodes.slice(0);
        prevs = [];
        nodes.forEach(node => {
          const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
          const cssFill = fill.map(item => getCssFill(item, node.width, node.height));
          prevs.push({
            fill: cssFill,
            fillOpacity,
            fillEnable,
          });
        });
        // 每次变更记录更新nexts
        p.onChange = (color: any) => {
          this.silence = true;
          nexts = [];
          nodes.forEach((node) => {
            const { fill, fillEnable, fillOpacity } = node.getComputedStyle();
            const cssFill = fill.map((item, i) => {
              if (i === index) {
                return getCssFill(color.rgba, node.width, node.height);
              }
              else {
                return getCssFill(item, node.width, node.height);
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
          const c = color2hexStr(color.rgba);
          el.title = el.style.background = c;
          (line.querySelector('.hex input') as HTMLInputElement).value = c.slice(1);
          this.silence = false;
        };
        p.onDone = () => {
          picker.hide();
          pickCallback();
        };
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
          const cssFill = fill.map(item => getCssFill(item, node.width, node.height));
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
        listener.emit(Listener.FILL_NODE, nodes.slice(0));
        listener.history.addCommand(new FillCommand(nodes, prevs.map((prev, i) => {
          return { prev, next: nexts[i] };
        })));
        this.silence = false;
      }
    });

    // 颜色input防止无效输入，undo/redo干扰输入
    panel.addEventListener('keydown', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName.toUpperCase() === 'INPUT' && target.type === 'text') {
        const keyCode = e.keyCode;
        if (e.metaKey || listener.isWin && e.ctrlKey) {
        }
        else if (keyCode >= 48 && keyCode <= 57
          || keyCode >= 37 && keyCode <= 40
          || keyCode >= 65 && keyCode <= 90
          || keyCode === 8
          || keyCode === 46
          || keyCode === 27
          || keyCode === 13) {}
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
            const cssFill = fill.map(item => getCssFill(item, node.width, node.height));
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
            const cssFill = fill.map(item => getCssFill(item, node.width, node.height));
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

    panel.addEventListener('change', pickCallback);

    listener.on([
      Listener.SELECT_NODE,
      Listener.ADD_NODE,
      Listener.FILL_NODE,
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
    const panel = this.panel;
    // 老的清除
    this.panel.querySelectorAll('.line').forEach(item => {
      item.remove();
    });
    let willShow = false;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      if (item instanceof Polyline
        || item instanceof ShapeGroup
        || item instanceof Text
        || item instanceof Bitmap
      ) {
        willShow = true;
        break;
      }
    }
    if (!willShow) {
      panel.style.display = 'none';
      return;
    }
    this.nodes = nodes;
    panel.style.display = 'block';
    const fillList: (number[] | ComputedGradient | ComputedPattern)[][] = [];
    const fillEnableList: boolean[][] = [];
    const fillOpacityList: number[][] = [];
    nodes.forEach(node => {
      if (node instanceof Polyline
        || node instanceof ShapeGroup
        || node instanceof Text
        || node instanceof Bitmap
      ) {
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
      }
    });
    for (let i = fillList.length - 1; i >= 0; i--) {
      const fill = fillList[i];
      const fillEnable = fillEnableList[i];
      const fillOpacity = fillOpacityList[i];
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
        nodes[i].width,
        nodes[i].height,
      );
    }
  }
}

export default FillPanel;
