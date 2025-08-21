import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import Text from '../node/Text';
import Bitmap from '../node/Bitmap';
import AbstractFrame from '../node/AbstractFrame';
import picker from './picker';
import Listener from './Listener';
import { ComputedGradient, ComputedPattern } from '../style/define';
import { getCssFillStroke, getCssStrokePosition } from '../style/css';
import { color2rgbaStr } from '../style/color';
import Panel from './Panel';
import { StrokeStyle } from '../format';
import StrokeCommand from '../history/StrokeCommand';
import state from './state';

const html = `
  <h4 class="panel-title">描边<b class="btn add"></b></h4>
`;

function renderItem(
  index: number,
  multiStrokeEnable: boolean,
  strokeEnable: boolean,
  multiStrokePosition: boolean,
  strokePosition: string,
  multiStrokeWidth: boolean,
  strokeWidth: number,
  strokeColor: string[],
  strokePattern: ComputedPattern[],
  strokeGradient: ComputedGradient[],
  width: number,
  height: number,
) {
  const multiColor = strokeColor.length > 1;
  const multiPattern = strokePattern.length > 1;
  const multiGradient = strokeGradient.length > 1;
  const multiStroke = (strokeColor.length ? 1 : 0) + (strokePattern.length ? 1 : 0) + (strokeGradient.length ? 1 : 0) > 1;
  const multi = multiStroke || multiColor || multiPattern || multiGradient;
  const readOnly = (multiStrokeEnable || !strokeEnable || multiStroke || multiPattern || multiGradient || strokePattern.length) ? 'readonly="readonly"' : '';
  let background = '';
  let txt1 = ' ';
  if (multiStroke) {
    txt1 = '多个';
  }
  else if (strokeColor.length) {
    txt1 = '颜色';
    if (strokeColor.length === 1) {
      background = strokeColor[0];
    }
  }
  else if (strokePattern.length) {
    txt1 = '图像';
    if (strokePattern.length === 1) {
      background = getCssFillStroke(strokePattern[0], width, height, true);
    }
  }
  else if (strokeGradient.length) {
    txt1 = '渐变';
    if (strokeGradient.length === 1) {
      background = getCssFillStroke(strokeGradient[0], width, height, true);
    }
  }
  let txt2 = ' ';
  if (multiStrokePosition) {
    txt2 = '多种';
  }
  else {
    txt2 = { inside: '内部', center: '中间', outside: '外部' } [strokePosition]!;
  }
  return `<div class="line" title="${index}">
    <span class="enabled ${multiStrokeEnable ? 'multi-checked' : (strokeEnable ? 'checked' : 'un-checked')}"></span>
    <div class="color">
      <span class="picker-btn ${readOnly ? 'read-only' : ''}">
        <b class="pick ${multi ? 'multi' : ''}" style="${multi ? '' : `background:${background}`}">○○○</b>
      </span>
      <span class="txt">${txt1}</span>
    </div>
    <div class="pos">
      <div>
        <span class="p inside ${!multiStrokePosition && strokePosition === 'inside' ? 'cur' : ''}" title="内部"></span>
        <span class="p center ${!multiStrokePosition && strokePosition === 'center' ? 'cur' : ''}" title="中间"></span>
        <span class="p outside ${!multiStrokePosition && strokePosition === 'outside' ? 'cur' : ''}" title="外部"></span>
      </div>
      <span class="txt">${txt2}</span>
    </div>
    <div class="width">
      <div class="input-unit">
        <input type="number" min="0" max="100" step="1" value="${multiStrokeWidth ? '' : strokeWidth}" placeholder="${multiStrokeWidth ? '多个' : ''}"/>
      </div>
      <span class="txt">宽度</span>
    </div>
  </div>`;
}

class StrokePanel extends Panel {
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'stroke-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    dom.appendChild(panel);

    let nodes: Node[] = [];
    let prevs: StrokeStyle[] = [];
    let nexts: StrokeStyle[] = [];
    let hasRefresh = true; // onInput是否触发了刷新，onChange识别看是否需要兜底触发
    let indexes: number[] = [];
    let index: number;

    const pickCallback = (independence = false) => {
      if (nodes.length && nexts.length) {
        listener.history.addCommand(new StrokeCommand(nodes.slice(0), prevs.map((prev, i) => {
          return { prev, next: nexts[i], index: indexes[i] };
        })), independence);
        listener.emit(Listener.STROKE_NODE, nodes.slice(0));
        onBlur();
      }
    };

    const onBlur = () => {
      nodes = [];
      prevs = [];
      nexts = [];
      indexes = [];
    };

    const setPrev = () => {
      nodes = this.nodes.slice(0);
      prevs = [];
      nodes.forEach(node => {
        const { stroke, strokeEnable, strokePosition, strokeWidth } = node.getComputedStyle();
        const cssStroke = stroke.map(item => getCssFillStroke(item, node.width, node.height));
        prevs.push({
          stroke: cssStroke,
          strokeEnable,
          strokePosition: strokePosition.map(item => getCssStrokePosition(item)),
          strokeWidth,
        });
      });
    };

    panel.addEventListener('click', (e) => {
      const el = e.target as HTMLElement;
      const classList = el.classList;
      const line = el.parentElement!.parentElement!.parentElement!;
      index = parseInt(line.title);
      if (classList.contains('pick')) {
        if (el.parentElement!.classList.contains('read-only')) {
          return;
        }
        if (picker.isShowFrom('strokePanel' + index)) {
          picker.hide();
          return;
        }
        // picker侦听了document全局click隐藏窗口，这里停止
        picker.keep = true;
        listener.gradient.keep = true;
        // 最开始记录nodes/prevs
        setPrev();

        const stroke = this.nodes[0].computedStyle.stroke[index];
        const onInput = (data: number[] | ComputedGradient | ComputedPattern, fromGradient = false) => {
          this.silence = true;
          const style = (line.querySelector('.pick') as HTMLElement).style;
          // 类型变更需改变select/input展示
          if (Array.isArray(data)) {
            panel.querySelector(`.line[title="${index}"] .value .multi-type`)?.classList.add('hide');
            style.background = color2rgbaStr(data);
          }
          else {
            const p = data as ComputedPattern;
            if (p.url !== undefined) {}
            else {
              data = data  as ComputedGradient;
              panel.querySelector(`.line[title="${index}"] .value .multi-type`)?.classList.add('hide');
              style.background = getCssFillStroke(data, this.nodes[0].width, this.nodes[0].height, true);
            }
          }
          nexts = [];
          indexes = [];
          nodes.forEach((node) => {
            const { stroke, strokeEnable, strokePosition, strokeWidth } = node.getComputedStyle();
            const cssStroke = stroke.map((item, i) => {
              if (i === index) {
                return getCssFillStroke(data);
              }
              else {
                return getCssFillStroke(item);
              }
            });
            const o = {
              stroke: cssStroke,
              strokeEnable,
              strokePosition: strokePosition.map(item => getCssStrokePosition(item)),
              strokeWidth,
            };
            nexts.push(o);
            indexes.push(index);
            node.updateStyle(o);
          });
          // 可能picker发生类型切换当前不是gradient了
          if (!fromGradient && !Array.isArray(nodes[0].computedStyle.stroke[index])) {
            listener.gradient.update(this.nodes[0], stroke);
          }
          if (nodes.length) {
            listener.emit(Listener.STROKE_NODE, nodes.slice(0));
          }
          this.silence = false;
        };
        // 取消可能的其它编辑态
        listener.cancelEditGeom();
        listener.cancelEditGradient();
        picker.hide();
        picker.show(el, stroke, 'strokePanel' + index, onInput, () => {
          this.silence = true;
          pickCallback(true);
          setPrev();
          this.silence = false;
        }, setPrev, listener);
        if (!Array.isArray(stroke)) {
          listener.select.hideSelect();
          // onChange特殊化和pickCallback不同，不能清空以及隐藏gradient
          listener.gradient.show(this.nodes[0], stroke, onInput, () => {
            if (nexts.length) {
              listener.history.addCommand(new StrokeCommand(nodes, prevs.map((prev, i) => {
                return { prev, next: nexts[i], index };
              })), true);
              prevs = nexts.slice(0);
              nexts = [];
            }
          });
          listener.state = state.EDIT_GRADIENT;
        }
      }
      else if (classList.contains('add')) {
        this.silence = true;
        const nodes = this.nodes.slice(0);
        const prevs: StrokeStyle[] = [];
        const nexts: StrokeStyle[] = [];
        nodes.forEach(node => {
          const { stroke, strokeEnable, strokePosition, strokeWidth } = node.getComputedStyle();
          const cssStroke = stroke.map(item => getCssFillStroke(item, node.width, node.height));
          prevs.push({
            stroke: cssStroke,
            strokeEnable,
            strokePosition: strokePosition.map(item => getCssStrokePosition(item)),
            strokeWidth,
          });
          const s = cssStroke.slice(0);
          const se = strokeEnable.slice(0);
          const sp = strokePosition.map(item => getCssStrokePosition(item));
          const sw = strokeWidth.slice(0);
          s.push('rgba(151,151,151,1)');
          se.push(true);
          sp.push('center');
          sw.push(1);
          const o = {
            stroke: s,
            strokeEnable: se,
            strokePosition: sp,
            strokeWidth: sw,
          };
          nexts.push(o);
          node.updateStyle(o);
        });
        this.show(nodes);
        listener.history.addCommand(new StrokeCommand(nodes.slice(0), prevs.map((prev, i) => {
          return { prev, next: nexts[i], index: prevs.length };
        })));
        listener.emit(Listener.STROKE_NODE, nodes.slice(0));
        this.silence = false;
      }
      else if (classList.contains('enabled')) {
        this.silence = true;
        const line = el.parentElement!;
        index = parseInt(line.title);
        const nodes = this.nodes.slice(0);
        const prevs: StrokeStyle[] = [];
        const nexts: StrokeStyle[] = [];
        const indexes: number[] = [];
        let value = false;
        if (classList.contains('multi-checked') || classList.contains('un-checked')) {
          value = true;
        }
        nodes.forEach(node => {
          const { stroke, strokeEnable, strokePosition, strokeWidth } = node.getComputedStyle();
          const cssStroke = stroke.map(item => getCssFillStroke(item, node.width, node.height));
          prevs.push({
            stroke: cssStroke,
            strokeEnable,
            strokePosition: strokePosition.map(item => getCssStrokePosition(item)),
            strokeWidth,
          });
          const s = cssStroke.slice(0);
          const se = strokeEnable.slice(0);
          const sp = strokePosition.map(item => getCssStrokePosition(item));
          const sw = strokeWidth.slice(0);
          if (se[index] !== undefined) {
            se[index] = value;
          }
          const o = {
            stroke: s,
            strokeEnable: se,
            strokePosition: sp,
            strokeWidth: sw,
          };
          nexts.push(o);
          indexes.push(index);
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
          listener.history.addCommand(new StrokeCommand(nodes.slice(0), prevs.map((prev, i) => {
            return { prev, next: nexts[i], index: indexes[i] };
          })));
          listener.emit(Listener.STROKE_NODE, nodes.slice(0), prevs.map((prev, i) => {
            return { prev, next: nexts[i], index: indexes[i] };
          }));
        }
        this.silence = false;
      }
      else if (classList.contains('p') && !classList.contains('cur')) {
        this.silence = true;
        el.parentElement!.querySelector('.cur')?.classList.remove('cur');
        el.classList.add('cur');
        const line = el.parentElement!.parentElement!.parentElement!;
        index = parseInt(line.title);
        const nodes = this.nodes.slice(0);
        const prevs: StrokeStyle[] = [];
        const nexts: StrokeStyle[] = [];
        let value: 'inside' | 'center' | 'outside' = 'inside';
        if (classList.contains('center')) {
          value = 'center';
        }
        else if (classList.contains('outside')) {
          value = 'outside';
        }
        nodes.forEach(node => {
          const { stroke, strokeEnable, strokePosition, strokeWidth } = node.getComputedStyle();
          const cssStroke = stroke.map(item => getCssFillStroke(item, node.width, node.height));
          prevs.push({
            stroke: cssStroke,
            strokeEnable,
            strokePosition: strokePosition.map(item => getCssStrokePosition(item)),
            strokeWidth,
          });
          const s = cssStroke.slice(0);
          const se = strokeEnable.slice(0);
          const sp = strokePosition.map(item => getCssStrokePosition(item));
          const sw = strokeWidth.slice(0);
          if (sp[index] !== undefined) {
            sp[index] = value;
          }
          const o = {
            stroke: s,
            strokeEnable: se,
            strokePosition: sp,
            strokeWidth: sw,
          };
          nexts.push(o);
          node.updateStyle(o);
        });
        if (nodes.length) {
          listener.history.addCommand(new StrokeCommand(nodes.slice(0), prevs.map((prev, i) => {
            return { prev, next: nexts[i], index: indexes[i] };
          })));
          listener.emit(Listener.STROKE_NODE, nodes.slice(0), prevs.map((prev, i) => {
            return { prev, next: nexts[i], index: indexes[i] };
          }));
        }
        this.silence = false;
      }
    });

    panel.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      const tagName = input.tagName.toUpperCase();
      if (tagName !== 'INPUT') {
        return;
      }
      this.silence = true;
      const line = input.parentElement!.parentElement!.parentElement!;
      index = parseInt(line.title);
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      const n = Math.min(100, Math.max(0, parseFloat(input.value) || 0));
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      hasRefresh = !isInput;
      this.nodes.forEach((node, i) => {
        if (isFirst) {
          nodes.push(node);
          const { stroke, strokeEnable, strokePosition, strokeWidth } = node.getComputedStyle();
          const cssStroke = stroke.map(item => getCssFillStroke(item, node.width, node.height));
          prevs.push({
            stroke: cssStroke,
            strokeEnable,
            strokePosition: strokePosition.map(item => getCssStrokePosition(item)),
            strokeWidth,
          });
        }
        const o = {
          stroke: prevs[i].stroke.slice(0),
          strokeEnable: prevs[i].strokeEnable.slice(0),
          strokePosition: prevs[i].strokePosition.slice(0),
          strokeWidth: prevs[i].strokeWidth.slice(0),
        };
        nexts.push(o);
        const prev = prevs[i].strokeWidth[index];
        if (isInput) {
          o.strokeWidth[index] = n;
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
          else if (listener.altKey) {
            if (d > 0) {
              d = 0.1;
            }
            else {
              d = -0.1;
            }
          }
          next = prev + d;
          next = Math.max(next, 0);
          next = Math.min(next, 100);
          if (d) {
            o.strokeWidth[index] = next;
            node.updateStyle(o);
          }
          if (!i) {
            input.value = input.placeholder ? '' : next.toString();
          }
        }
      });
      this.silence = false;
    });

    panel.addEventListener('change', (e) => {
      this.silence = true;
      const input = e.target as HTMLInputElement;
      const tagName = input.tagName.toUpperCase();
      if (tagName !== 'INPUT') {
        return;
      }
      if (!hasRefresh) {
        hasRefresh = true;
        root.asyncDraw();
      }
      pickCallback();
      this.silence = false;
    });

    panel.addEventListener('blur', (e) => {
      const input = e.target as HTMLInputElement;
      const tagName = input.tagName.toUpperCase();
      if (tagName !== 'INPUT') {
        return;
      }
      onBlur();
    });

    listener.on([
      Listener.STROKE_NODE,
    ], (nodes: Node[], idx: number[]) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
      if (listener.state === state.EDIT_GRADIENT) {
        // node一般相等，就是第0个，用记录的索引确定更新的是哪个fill，如果不相等说明是在另外node打开picker后执行undo/redo
        const node = listener.gradient.node!;
        if (nodes[0] === node && idx[0] === index) {
          listener.gradient.update(node, node.computedStyle.stroke[index]);
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

  show(nodes: Node[]) {
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
        || item instanceof AbstractFrame
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
    const strokeList: (number[] | ComputedGradient | ComputedPattern)[][] = [];
    const strokeEnableList: boolean[][] = [];
    const strokePositionList: string[][] = [];
    const strokeWidthList: number[][] = [];
    this.nodes.forEach(node => {
      const { stroke, strokeEnable, strokePosition, strokeWidth } = node.getComputedStyle();
      stroke.forEach((item, i) => {
        const o = strokeList[i] = strokeList[i] || [];
        // 对象一定引用不同，具体值是否相等后续判断
        o.push(item);
      });
      strokeEnable.forEach((item, i) => {
        const o = strokeEnableList[i] = strokeEnableList[i] || [];
        if (!o.includes(item)) {
          o.push(item);
        }
      });
      strokePosition.forEach((item, i) => {
        const o = strokePositionList[i] = strokePositionList[i] || [];
        const v = getCssStrokePosition(item);
        if (!o.includes(v)) {
          o.push(v);
        }
      });
      strokeWidth.forEach((item, i) => {
        const o = strokeWidthList[i] = strokeWidthList[i] || [];
        if (!o.includes(item)) {
          o.push(item);
        }
      });
    });
    for (let i = strokeList.length - 1; i >= 0; i--) {
      const stroke = strokeList[i];
      const strokeEnable = strokeEnableList[i];
      const strokePosition = strokePositionList[i];
      const strokeWidth = strokeWidthList[i];
      // stroke有3种
      const strokeColor: string[] = [];
      const strokePattern: ComputedPattern[] = [];
      const strokeGradient: ComputedGradient[] = [];
      stroke.forEach(item => {
        if (Array.isArray(item)) {
          const c = color2rgbaStr(item);
          if (!strokeColor.includes(c)) {
            strokeColor.push(c);
          }
          return;
        }
        const p = item as ComputedPattern;
        if (p.url !== undefined) {
          for (let i = 0, len = strokePattern.length; i < len; i++) {
            const o = strokePattern[i];
            if (o.url === p.url && o.type === p.type && o.scale === p.scale) {
              return;
            }
          }
          strokePattern.push(p);
          return;
        }
        const g = item as ComputedGradient;
        outer:
        for (let i = 0, len = strokeGradient.length; i < len; i++) {
          const o = strokeGradient[i];
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
        strokeGradient.push(g);
      });
      panel.innerHTML += renderItem(
        i,
        strokeEnable.length > 1,
        strokeEnable[0],
        strokePosition.length > 1,
        strokePosition[0],
        strokeWidth.length > 1,
        strokeWidth[0],
        strokeColor,
        strokePattern,
        strokeGradient,
        this.nodes[0].width,
        this.nodes[0].height,
      );
    }
  }
}

export default StrokePanel;
