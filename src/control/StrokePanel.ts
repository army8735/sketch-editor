import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import Text from '../node/Text';
import Bitmap from '../node/Bitmap';
import { toPrecision } from '../math';
import { clone, renderTemplate } from '../util/util';
import Listener from './Listener';
import { Style } from '../style/define';
import picker from './picker';
import { color2hexStr, color2rgbaStr } from '../style/css';
import UpdateFormatStyleCommand from '../history/UpdateFormatStyleCommand';
import Panel from './Panel';

const html = `
  <h4 class="panel-title">描边</h4>
`;

const single = `
  <div class="line" title="$\{index}">
    <span class="$\{checked}"></span>
    <div class="color">
      <span class="picker"><b style="color:#666;text-align:center;line-height:18px;overflow:hidden;text-indent:`
  + `$\{textIndent};text-shadow:0 0 2px rgba(0, 0, 0, 0.2);background:$\{color};">○○○</b></span>
      <span class="txt">颜色</span>
    </div>
    <div class="pos $\{position}">
      <div>
        <span class="inside" title="内部"></span>
        <span class="center" title="中间"></span>
        <span class="outside" title="外部"></span>
      </div>
      <span class="inside">内部</span>
      <span class="center">中间</span>
      <span class="outside">外部</span>
      <span class="multi">多个</span>
    </div>
    <div class="width">
      <div>
        <input type="number" min="0" max="100" step="1" value="$\{width}" placeholder="$\{widthMulti}"/>
        <span></span>
      </div>
      <span>宽度</span>
    </div>
  </div>
`;

class StrokePanel extends Panel {
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'stroke-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    let nodes: Node[];
    let prevs: Partial<Style>[];
    let nexts: Partial<Style>[];

    const callback = () => {
      if (nexts && nexts.length) {
        listener.history.addCommand(new UpdateFormatStyleCommand(nodes.slice(0), prevs, nexts));
        listener.emit(Listener.STROKE_NODE, nodes.slice(0));
        nodes = [];
        prevs = [];
        nexts = [];
      }
    };

    panel.addEventListener('click', (e) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'B') {
        const p = picker.show(el, 'strokePanel', callback);
        const line = el.parentElement!.parentElement!.parentElement!;
        const index = parseInt(line.title);
        // 最开始记录nodes/prevs
        nodes = [];
        prevs = [];
        this.nodes.forEach(node => {
          const stroke = clone(node.style.stroke);
          nodes.push(node);
          prevs.push({
            stroke,
          });
        });
        // 每次变更记录更新nexts
        p.onChange = (color: any) => {
          nexts = [];
          this.nodes.forEach((node) => {
            const stroke = clone(node.style.stroke);
            const rgba = color.rgba.slice(0);
            stroke[index].v = rgba;

            nexts.push({
              stroke,
            });
            node.updateFormatStyle({
              stroke,
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
      if (picker.isShowFrom('strokePanel')) {
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
    const ws: number[][] = [];
    const ps: string[][] = [];
    nodes.forEach(node => {
      if (node instanceof Polyline
        || node instanceof ShapeGroup
        || node instanceof Text
        || node instanceof Bitmap
      ) {
        const style = node.getCssStyle();
        style.stroke.forEach((item, i) => {
          const e = es[i] = es[i] || [];
          if (!e.includes(style.strokeEnable[i])) {
            e.push(style.strokeEnable[i]);
          }
          const c = cs[i] = cs[i] || [];
          if (!c.includes(item as string)) {
            c.push(item as string);
          }
          const w = ws[i] = ws[i] || [];
          if (!w.includes(style.strokeWidth[i])) {
            w.push(style.strokeWidth[i]);
          }
          const p = ps[i] = ps[i] || [];
          if (!p.includes(style.strokePosition[i])) {
            p.push(style.strokePosition[i]);
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
      const w = ws[i];
      const p = ps[i];
      let checked = 'un-checked';
      if (e.length > 1) {
        checked = 'multi-checked';
      }
      else if (e.includes(true)) {
        checked = 'checked';
      }
      const s = renderTemplate(single, {
        index: es.length - 1 - i,
        checked,
        textIndent: c.length > 1 ? 0 : '9999px',
        color: c.length > 1 ? '#FFFFFF' : c[0],
        colorMulti: c.length > 1 ? '多个' : '',
        width: w.length > 1 ? '' : toPrecision(w[0], 0),
        widthMulti: w.length > 1 ? '多个' : '',
        position: p.length > 1 ? 'multi' : p[0],
      });
      this.panel.innerHTML += s;
    }
  }
}

export default StrokePanel;
