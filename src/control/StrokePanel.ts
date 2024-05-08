import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import Text from '../node/Text';
import Bitmap from '../node/Bitmap';
import { toPrecision } from '../math';
import { renderTemplate } from '../util/util';

const html = `
  <h4 class="panel-title">描边</h4>
`;

const single = `
  <div class="line">
    <span class="$\{checked}"></span>
    <div class="color">
      <input type="color" value="#$\{color}" placeholder="$\{colorM}"/>
      <span>颜色</span>
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
        <input type="number" min="0" max="100" step="1" value="$\{width}" placeholder="$\{widthM}"/>
        <span></span>
      </div>
      <span>宽度</span>
    </div>
  </div>
`;

class StrokePanel {
  root: Root;
  dom: HTMLElement;
  panel: HTMLElement;

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;

    const panel = this.panel = document.createElement('div');
    panel.className = 'stroke-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);
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
        checked,
        color: c.length > 1 ? '' : c[0].replace('#', '').toUpperCase(),
        colorM: c.length > 1 ? '多个' : '',
        width: w.length > 1 ? '' : toPrecision(w[0], 0),
        widthM: w.length > 1 ? '多个' : '',
        position: p.length > 1 ? 'multi' : p[0],
      });
      this.panel.innerHTML += s;
    }
  }
}

export default StrokePanel;
