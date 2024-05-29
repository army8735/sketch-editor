import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import Text from '../node/Text';
import Bitmap from '../node/Bitmap';
import { toPrecision } from '../math';
import { renderTemplate } from '../util/util';
import picker from './picker';
import { color2hexStr, color2rgbaInt, color2rgbaStr } from '../style/css';
import Listener from './Listener';
import { clone } from '../util/util';
import { Style } from '../style/define';
import UpdateFormatStyleCommand from '../history/UpdateFormatStyleCommand';

const html = `
  <h4 class="panel-title">填充</h4>
`;

const single = `
  <div class="line" title="$\{index}">
    <span class="$\{checked}"></span>
    <div class="color">
      <span class="picker"><b style="color:#666;text-align:center;line-height:18px;overflow:hidden;text-indent:`
  + `$\{textIndent};text-shadow:0 0 2px rgba(0, 0, 0, 0.2);background:$\{colorRgb};opacity:$\{opacityFloat}">○○○</b></span>
      <span class="txt">颜色</span>
    </div>
    <div class="hex">
      <div>
        <span>#</span>
        <input type="text" value="$\{color}" placeholder="$\{colorMulti}"/>
      </div>
      <span class="txt">Hex</span>
    </div>
    <div class="opacity">
      <div>
        <input type="number" min="0" max="100" step="1" value="$\{opacity}" placeholder="$\{opacityMulti}"/>
        <span>%</span>
      </div>
      <span class="txt">不透明度</span>
    </div>
  </div>
`;

class FillPanel {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  panel: HTMLElement;
  nodes: Node[];

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;
    this.nodes = [];

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
        const p = picker.show(el, callback);
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
        p.onChange = (color) => {
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

    listener.on(Listener.SELECT_NODE, () => {
      picker.hide();
      callback();
    });
  }

  show(nodes: Node[]) {
    const panel = this.panel;
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
    panel.querySelectorAll('input').forEach(item => {
      item.disabled = false;
      item.placeholder = '';
      item.value = '';
    });
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
    // 老的清除
    this.panel.querySelectorAll('.line').forEach(item => {
      item.remove();
    });
    for (let i = es.length - 1; i >= 0; i--) {
      const e = es[i];
      // 理论不会空，兜底防止bug
      if (!e.length) {
        return;
      }
      const c = cs[i];
      const o = os[i];
      let checked = 'un-checked';
      if (e.length > 1) {
        checked = 'multi-checked';
      }
      else if (e.includes(true)) {
        checked = 'checked';
      }
      let opacity = 1;
      let opacityFloat = 1;
      if (o.length === 1) {
        opacity = toPrecision(o[0] * 100, 0);
        opacityFloat = o[0];
        if (c.length === 1 && c[0].charAt(0) === '#') {
          const color = color2rgbaInt(c[0]);
          opacity *= color[3];
          opacity = toPrecision(opacity, 0);
          opacityFloat *= color[3];
        }
      }
      const s = renderTemplate(single, {
        index: es.length - 1 - i,
        checked,
        textIndent: c.length > 1 ? 0 : '9999px',
        color: c.length > 1 ? '#FFFFFF' : c[0].slice(1, 7).toUpperCase(),
        colorRgb: c.length > 1 ? '#FFFFFF' : (c[0].charAt(0) === '#' ? color2rgbaStr(c[0].slice(0, 7)) : '#FFFFFF'),
        colorMulti: c.length > 1 ? '多个' : '',
        opacity,
        opacityFloat,
        opacityMulti: o.length > 1 ? '多个' : '',
      });
      this.panel.innerHTML += s;
    }
  }
}

export default FillPanel;
