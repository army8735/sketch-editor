import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import Text from '../node/Text';
import Bitmap from '../node/Bitmap';
import { toPrecision } from '../math';
import picker from './picker';
import { color2hexStr, color2rgbaStr, getCssFill } from '../style/css';
import Listener from './Listener';
import { clone } from '../util/type';
import { ComputedGradient, ComputedPattern, GRADIENT, Style } from '../style/define';
import UpdateFormatStyleCommand from '../history/UpdateFormatStyleCommand';
import Panel from './Panel';

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
  const readOnly = (multiEnable || !enable || multiPattern || multiGradient) ? 'readonly="readonly"' : '';
  let background = '';
  let txt1 = '';
  let txt2 = '';
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
  }
  else if (fillGradient.length) {
    txt1 = '渐变';
    txt2 = '类型';
    if (fillGradient.length === 1) {
      background = getCssFill(fillGradient[0], width, height);
    }
  }
  return `<div class="line" title="${index}">
    <span class="enabled ${multiEnable ? 'multi-checked' : (enable ? 'checked' : 'un-checked')}"></span>
    <div class="color">
      <span class="picker-btn ${readOnly ? 'read-only' : ''}">
        <b class="${multi ? 'multi' : ''}" style="${multi ? '' : `background:${background}`}">○○○</b>
      </span>
      <span class="txt">${txt1}</span>
    </div>
    <div class="hex">
      <div class="color ${(fillPattern.length || fillGradient.length) ? 'hide' : ''}">
        <span>#</span>
        <input type="text" value="${multiColor ? '' : color2hexStr(fillColor[0]).slice(1)}" placeholder="${multiColor ? '多个' : ''}"/>
      </div>
      <div class="pattern ${(fillColor.length || fillGradient.length) ? 'hide' : ''}">
        <select>
          <option value="">填充</option>
          <option value="">适应</option>
          <option value="">拉伸</option>
          <option value="">平铺</option>
        </select>
      </div>
      <div class="gradient ${(fillColor.length || fillPattern.length) ? 'hide' : ''}">
        <select>
          <option value="${GRADIENT.LINEAR}">线性</option>
          <option value="${GRADIENT.RADIAL}">径向</option>
          <option value="${GRADIENT.CONIC}">角度</option>
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

    let nodes: Node[];
    let prevs: Partial<Style>[];
    let nexts: Partial<Style>[];

    const callback = () => {
      // 只有变更才会有next
      if (nexts && nexts.length) {
        listener.history.addCommand(new UpdateFormatStyleCommand(nodes.slice(0), prevs, nexts));
        listener.emit(Listener.FILL_NODE, nodes.slice(0));
      }
      nodes = [];
      prevs = [];
      nexts = [];
    };

    panel.addEventListener('click', (e) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'B') {
        const p = picker.show(el, 'fillPanel', callback);
        const line = el.parentElement!.parentElement!.parentElement!;
        const index = parseInt(line.title);
        // 最开始记录nodes/prevs
        nodes = this.nodes.slice(0);
        prevs = [];
        nodes.forEach(node => {
          const fill = clone(node.style.fill);
          const fillOpacity = clone(node.style.fillOpacity);
          prevs.push({
            fill,
            fillOpacity,
          });
        });
        // 每次变更记录更新nexts
        p.onChange = (color: any) => {
          nexts = [];
          nodes.forEach((node, i) => {
            const fill = clone(node.style.fill);
            const rgba = color.rgba.slice(0);
            rgba[3] = 1;
            fill[index].v = rgba;

            const fillOpacity = clone(node.style.fillOpacity);
            fillOpacity[index].v = color.rgba[3];

            if (!i) {
              const hex = line.querySelector('.hex input') as HTMLInputElement;
              hex.value = color2hexStr(rgba).slice(0, 7);
              const b = line.querySelector('.picker b') as HTMLElement;
              b.style.opacity = String(color.rgba[3]);
              b.style.background = hex.value;
              const op = line.querySelector('.opacity input') as HTMLInputElement;
              op.value = String(toPrecision(color.rgba[3] * 100, 0));
            }

            nexts.push({
              fill,
              fillOpacity,
            });
            node.updateFormatStyle({
              fill,
              fillOpacity,
            });
          });
        };
        p.onDone = () => {
          picker.hide();
          callback();
        };
      }
    });

    listener.on([
      Listener.SELECT_NODE,
      Listener.ADD_NODE,
    ], (nodes: Node[]) => {
      if (picker.isShowFrom('fillPanel')) {
        picker.hide();
        callback();
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
