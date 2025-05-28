import Node from '../node/Node';
import Root from '../node/Root';
import ShapeGroup from '../node/geom/ShapeGroup';
import Polyline from '../node/geom/Polyline';
import { toPrecision } from '../math';
import Listener from './Listener';
import Panel from './Panel';
import state from './state';
import { Point } from '../format';
import { clone } from '../util/type';
import RoundCommand from '../history/RoundCommand';

const html = `
  <h4 class="panel-title">圆角</h4>
  <div class="line">
    <input type="range" min="0" step="1"/>
    <div class="input-unit">
      <input type="number" min="0" step="1"/>
    </div>
  </div>
`;

class RoundPanel extends Panel {
  panel: HTMLElement;
  nodes: (Polyline | ShapeGroup)[];

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);
    this.nodes = [];

    const panel = this.panel = document.createElement('div');
    panel.className = 'round-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    dom.appendChild(panel);

    let polylines: Polyline[] = []; // 所有polyline和shapeGroup的子孙polyline，合并并打平
    let nodes: Polyline[][] = []; // 所有polyline和shapeGroup的子孙polyline，合并不打平
    let prevPoints: Point[][][] = []; // 同上
    let hasRefresh = false; // onInput是否触发了刷新，onChange识别看是否需要兜底触发

    const onChange = () => {
      if (polylines.length) {
        if (!hasRefresh) {
          hasRefresh = true;
          this.nodes.forEach(node => {
            node.refresh();
          });
        }
        listener.history.addCommand(new RoundCommand(this.nodes.slice(0), this.nodes.map((item, i) => {
          return {
            nodes: nodes[i],
            prev: prevPoints[i],
            next: nodes[i].map(item => clone(item.points)),
          };
        })));
        onBlur();
      }
    };

    const onBlur = () => {
      polylines = [];
      nodes = [];
      prevPoints = [];
    };

    const range = panel.querySelector('input[type="range"]') as HTMLInputElement;
    const number = panel.querySelector('input[type="number"]') as HTMLInputElement;

    range.addEventListener('input', () => {
      this.silence = true;
      const value = parseFloat(range.value) || 0;
      const isFirst = !polylines.length;
      hasRefresh = true;
      this.nodes.forEach((node, i) => {
        scan2(node, value, polylines, nodes[i] = nodes[i] || [], prevPoints[i] = prevPoints[i] || [], isFirst, true);
      });
      polylines.forEach(item => {
        const parent = item.parent;
        if (parent instanceof ShapeGroup) {
          parent.clearPointsUpward(); // ShapeGroup的子节点会递归向上检查
        }
      });
      range.placeholder = number.placeholder = '';
      range.style.setProperty('--p', (value * 100 / (+range.max)).toString());
      number.value = range.value;
      listener.emit(Listener.ROUND_NODE, nodes.slice(0));
      this.silence = false;
    });
    range.addEventListener('change', () => onChange());

    number.addEventListener('input', (e) => {
      this.silence = true;
      const value = parseFloat(number.value) || 0;
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      const isFirst = !nodes.length;
      this.nodes.forEach((node, i) => {
        if (isInput) {
          hasRefresh = false;
          scan2(node, value, polylines, nodes[i] = nodes[i] || [], prevPoints[i] = prevPoints[i] || [], isFirst);
          if (!i) {
            range.placeholder = number.placeholder = '';
            range.value = number.value;
          }
        }
        else {
          hasRefresh = true;
          const t = scan3(node, value, polylines, nodes[i] = nodes[i] || [], prevPoints[i] = prevPoints[i] || [], isFirst, number.placeholder, listener);
          if (!i) {
            if (number.placeholder) {
              number.value = '';
            }
            else {
              range.value = number.value = t.toString();
            }
          }
        }
      });
      polylines.forEach(item => {
        const parent = item.parent;
        if (parent instanceof ShapeGroup) {
          parent.clearPointsUpward(); // ShapeGroup的子节点会递归向上检查
        }
      });
      range.style.setProperty('--p', ((+range.value) * 100 / (+range.max)).toString());
      listener.emit(Listener.ROUND_NODE, nodes.slice(0));
      this.silence = false;
    });
    number.addEventListener('change', () => onChange());
    number.addEventListener('blur', () => onBlur());

    listener.on(Listener.STATE_CHANGE, (prev: state, next: state) => {
      // 出现或消失
      if (next === state.EDIT_GEOM || prev === state.EDIT_GEOM) {
        polylines.splice(0);
        nodes.splice(0);
        prevPoints.splice(0);
        this.show(listener.selected);
      }
    });

    listener.on(Listener.ROUND_NODE, (nodes2: Node[]) => {
      if (this.silence) {
        return;
      }
      polylines.splice(0);
      nodes.splice(0);
      prevPoints.splice(0);
      this.show(nodes2);
    });
  }

  override show(nodes: Node[]) {
    const panel = this.panel;
    let willShow = false;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      if ((item instanceof Polyline && !item.isOval) || item instanceof ShapeGroup) {
        willShow = true;
        break;
      }
    }
    if (this.listener.state === state.EDIT_GEOM) {
      willShow = false;
    }
    if (!willShow) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    panel.querySelectorAll('input').forEach(item => {
      item.placeholder = '';
      item.value = '';
    });
    const geoms = nodes.filter(item => item instanceof Polyline || item instanceof ShapeGroup);
    this.nodes = geoms;
    const rs: number[] = [];
    const ws: number[] = [];
    const hs: number[] = [];
    geoms.forEach(item => {
      scan(item, rs, ws, hs);
    });
    ws.sort((a, b) => a - b);
    hs.sort((a, b) => a - b);
    const min = Math.min(ws[0], hs[0]) * 0.5;
    const r = panel.querySelector('input[type=range]') as HTMLInputElement;
    const n = panel.querySelector('input[type=number]') as HTMLInputElement;
    r.setAttribute('max', min.toString());
    n.setAttribute('max', min.toString());
    if (rs.length > 1) {
      r.value = '0';
      r.style.setProperty('--p', '0');
      n.placeholder = '多个';
    }
    else {
      const c = toPrecision(rs[0], 2).toString();
      r.value = c;
      r.style.setProperty('--p', (rs[0] * 100 / min).toString());
      n.value = c;
    }
  }
}

// 递归查看所有矢量节点获取半径宽高数据，shapeGroup会有子孙节点
function scan(node: Node, rs: number[], ws: number[], hs: number[]) {
  if (node instanceof Polyline) {
    node.points.forEach(point => {
      const r = point.cornerRadius;
      if (!rs.includes(r)) {
        rs.push(r);
      }
    });
    const { width, height } = node;
    if (!ws.includes(width)) {
      ws.push(width);
    }
    if (!hs.includes(height)) {
      hs.push(height);
    }
  }
  else if (node instanceof ShapeGroup) {
    node.children.forEach(child => {
      scan(child, rs, ws, hs);
    });
  }
}

// 递归所有矢量节点undo/redo保存，shapeGroup会查看所有子孙节点并按顺序保存更新数据
function scan2(node: Node, value: number, polylines: Polyline[], nodes: Polyline[], prevPoints: Point[][], isFirst: boolean, refresh = false) {
  if (node instanceof Polyline) {
    if (isFirst) {
      polylines.push(node);
      nodes.push(node);
      prevPoints.push(clone(node.points));
    }
    node.points.forEach(point => {
      point.cornerRadius = value;
    });
    if (refresh) {
      node.refresh();
    }
  }
  else if (node instanceof ShapeGroup) {
    node.children.forEach(child => {
      scan2(child, value, polylines, nodes, prevPoints, isFirst, refresh);
    });
  }
}

// 同上，在number触发input时使用
function scan3(node: Node, value: number, polylines: Polyline[], nodes: Polyline[], prevPoints: Point[][], isFirst: boolean, placeholder: string, listener: Listener) {
  let firstReturn = true;
  let res = 0;
  if (node instanceof Polyline) {
    if (isFirst) {
      polylines.push(node);
      nodes.push(node);
      prevPoints.push(clone(node.points));
    }
    node.points.forEach((point) => {
      let d = 0;
      if (placeholder) {
        d = value;
      }
      else {
        d = value - point.cornerRadius;
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
      point.cornerRadius += d;
      if (firstReturn) {
        firstReturn = false;
        res = point.cornerRadius;
      }
    });
    node.refresh();
  }
  else if (node instanceof ShapeGroup) {
    node.children.forEach(child => {
      const t = scan3(child, value, polylines, nodes, prevPoints, isFirst, placeholder, listener);
      if (firstReturn) {
        firstReturn = false;
        res = t;
      }
    });
  }
  return res;
}

export default RoundPanel;
