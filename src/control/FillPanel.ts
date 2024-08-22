import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import Text from '../node/Text';
import Bitmap from '../node/Bitmap';
import { toPrecision } from '../math';
import picker from './picker';
import { color2hexStr, color2rgbaInt, color2rgbaStr } from '../style/css';
import Listener from './Listener';
import { clone } from '../util/type';
import { Style } from '../style/define';
import UpdateFormatStyleCommand from '../history/UpdateFormatStyleCommand';
import Panel from './Panel';

const html = `
  <h4 class="panel-title">填充</h4>
`;

function renderItem(
  index: number,
  multiEnable: boolean,
  enable: boolean,
  multiColor: boolean,
  color: string,
  multiOpacity: boolean,
  opacity: number,
) {
  const readOnly = (multiEnable || !enable) ? 'readonly="readonly"' : '';
  return `<div class="line" title="${index}">
    <span class="enabled ${multiEnable ? 'multi-checked' : (enable ? 'checked' : 'un-checked')}"></span>
    <div class="color">
      <span class="picker-btn ${readOnly ? 'read-only' : ''}">
        <b class="${multiColor ? 'multi' : ''}" style="${multiColor ? '' : `background:${color}`}">○○○</b>
      </span>
      <span class="txt">颜色</span>
    </div>
    <div class="hex">
      <div>
        <span>#</span>
        <input type="text" value="${multiColor ? '' : color2hexStr(color).slice(1)}" placeholder="${multiColor ? '多个' : ''}"/>
      </div>
      <span class="txt">Hex</span>
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
    const es: boolean[][] = [];
    const cs: string[][] = [];
    const os: number[][] = [];
    nodes.forEach(node => {
      if (node instanceof Polyline
        || node instanceof ShapeGroup
        || node instanceof Text
        || node instanceof Bitmap
      ) {
        const style = node.getCssStyle();
        style.fill.forEach((item, i) => {
          const e = es[i] = es[i] || [];
          if (!e.includes(style.fillEnable[i])) {
            e.push(style.fillEnable[i]);
          }
          const c = cs[i] = cs[i] || [];
          if (!c.includes(item as string)) {
            c.push(item as string);
          }
          const o = os[i] = os[i] || [];
          if (!o.includes(style.fillOpacity[i])) {
            o.push(style.fillOpacity[i]);
          }
        });
      }
    });
    for (let i = es.length - 1; i >= 0; i--) {
      const e = es[i];
      // 理论不会空，兜底防止bug
      if (!e.length) {
        return;
      }
      const c = cs[i];
      const o = os[i];
      this.panel.innerHTML += renderItem(i, e.length > 1, e[0], c.length > 1, c[0], o.length > 1, o[0]);
    }
  }
}

export default FillPanel;
