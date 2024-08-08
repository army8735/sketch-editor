import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import Panel from './Panel';
import { BLUR } from '../style/define';
import { BlurStyle } from '../format';
import { getCssBlur } from '../style/css';
import BlurCommand from '../history/BlurCommand';
import { toPrecision } from '../math';

const html = `
  <div class="panel-title">模糊<b class="del"></b></div>
  <select>
    <option value="${BLUR.GAUSSIAN}">高斯模糊</option>
    <option value="${BLUR.MOTION}">动感模糊</option>
    <option value="${BLUR.RADIAL}">缩放模糊</option>
    <option value="${BLUR.BACKGROUND}">背景模糊</option>
    <option value="${BLUR.NONE}" disabled="disabled" style="display:none">多个</option>
  </select>
  <div class="type radius">
    <div class="con">
      <input class="range" type="range" min="0" max="50" step="1"/>
      <div class="input-unit">
        <input class="number" type="number" min="0" max="50" step="1"/>
      </div>
    </div>
  </div>
  <div class="type t${BLUR.MOTION} angle">
    <div class="intro">角度</div>
    <div class="con">
      <input class="range" type="range" min="-180" max="100" step="1"/>
      <div class="input-unit">
        <input class="number" type="number" min="180" max="100" step="1"/>
        <span class="unit">°</span>
      </div>
    </div>
  </div>
  <div class="type t${BLUR.RADIAL} center">
    <button disabled="disabled">编辑原点</button>
  </div>
  <div class="type t${BLUR.BACKGROUND} saturation">
    <div class="intro">饱和度</div>
    <div class="con">
      <input class="range" type="range" min="-100" max="100" step="1"/>
      <div class="input-unit">
        <input class="number" type="number" min="-100" max="100" step="1"/>
        <span class="unit">%</span>
      </div>
    </div>
  </div>
`;

class BlurPanel extends Panel {
  panel: HTMLElement;
  radiusRange: HTMLInputElement;
  radiusNumber: HTMLInputElement;
  angleRange: HTMLInputElement;
  angleNumber: HTMLInputElement;
  saturationRange: HTMLInputElement;
  saturationNumber: HTMLInputElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'blur-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    const radiusRange = this.radiusRange = panel.querySelector('.radius .range') as HTMLInputElement;
    const radiusNumber = this.radiusNumber = panel.querySelector('.radius .number') as HTMLInputElement;
    const angleRange = this.angleRange = panel.querySelector('.angle .range') as HTMLInputElement;
    const angleNumber = this.angleNumber = panel.querySelector('.angle .number') as HTMLInputElement;
    const saturationRange = this.saturationRange = panel.querySelector('.saturation .range') as HTMLInputElement;
    const saturationNumber = this.saturationNumber = panel.querySelector('.saturation .number') as HTMLInputElement;

    let nodes: Node[] = [];
    let prevs: BlurStyle[] = [];
    let nexts: BlurStyle[] = [];

    const onChange = () => {
      if (nodes.length) {
        listener.history.addCommand(new BlurCommand(nodes, prevs.map((prev, i) => {
          return {
            prev,
            next: nexts[i],
          };
        })));
        listener.emit(Listener.BLUR_NODE, nodes.slice(0));
      }
      nodes = [];
      prevs = [];
      nexts = [];
    };

    radiusRange.addEventListener('input', () => {
      // 连续多个只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      const value = radiusRange.value;
      this.nodes.forEach((node) => {
        if (isFirst) {
          nodes.push(node);
          prevs.push({
            blur: node.getCssStyle().blur,
          });
        }
        const blur = node.computedStyle.blur;
        const next = { blur: getCssBlur(blur.t, parseFloat(value), blur.angle, blur.center, blur.saturation) };
        nexts.push(next);
        node.updateStyle(next);
      });
      radiusNumber.value = value;
      radiusNumber.placeholder = '';
    });
    radiusRange.addEventListener('change', onChange);

    radiusNumber.addEventListener('input', (e) => {
      this.silence = true;
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        const blur = node.computedStyle.blur;
        const prev = blur.radius;
        if (isFirst && blur.t !== BLUR.NONE) {
          nodes.push(node);
          prevs.push({
            blur: node.getCssStyle().blur,
          });
        }
        let value = parseFloat(radiusNumber.value) || 0;
        if (!isInput) {
          let d = 0;
          if (radiusNumber.placeholder) {
            d = value > 0 ? 1 : -1;
            if (listener.shiftKey) {
              d *= 10;
            }
            radiusNumber.value = '';
          }
          else {
            d = value - prev;
            if (listener.shiftKey) {
              d *= 10;
            }
            value = prev + d;
            radiusNumber.value = toPrecision(value).toString();
          }
        }
        else {
          radiusNumber.placeholder = '';
        }
        if (blur.t !== BLUR.NONE) {
          const next = { blur: getCssBlur(blur.t, value, blur.angle, blur.center, blur.saturation) };
          nexts.push(next);
          node.updateStyle(next);
        }
      });
      if (nodes.length) {
        listener.emit(Listener.SHADOW_NODE, nodes.slice(0));
      }
      radiusRange.value = (parseFloat(radiusNumber.value) || 0).toString();
      this.silence = false;
    });
    radiusNumber.addEventListener('change', onChange);

    listener.on([
      Listener.SELECT_NODE,
      Listener.ADD_NODE,
      Listener.BLUR_NODE,
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
    this.nodes = nodes;
    const panel = this.panel;
    if (!nodes.length) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    const select = panel.querySelector('select')!;
    const disabled = select.querySelector(':disabled') as HTMLOptionElement;
    const typeList: BLUR[] = [];
    const radiusList: number[] = [];
    const angleList: number[] = [];
    const saturationList: number[] = [];
    nodes.forEach(node => {
      const blur = node.computedStyle.blur;
      if (!typeList.includes(blur.t)) {
        typeList.push(blur.t);
      }
      if (!radiusList.includes(blur.radius)) {
        radiusList.push(blur.radius);
      }
      if (blur.angle !== undefined && !angleList.includes(blur.angle)) {
        angleList.push(blur.angle);
      }
      if (blur.saturation !== undefined && !saturationList.includes(blur.saturation)) {
        saturationList.push(blur.saturation);
      }
    });
    panel.querySelectorAll('div.t2,div.t3,div.t4').forEach(item => {
      (item as HTMLDivElement).style.display = 'none';
    });
    if (typeList.length > 1) {
      disabled.style.display = 'block';
      select.value = BLUR.NONE.toString();
    }
    else {
      disabled.style.display = 'none';
      select.value = typeList[0].toString();
      const div = panel.querySelector(`div.t${typeList[0]}`) as HTMLDivElement;
      if (div) {
        div.style.display = 'block';
      }
    }
    if (radiusList.length > 1) {
      this.radiusRange.value = '0';
      this.radiusNumber.value = '';
      this.radiusNumber.placeholder = '多个';
    }
    else {
      this.radiusRange.value = (radiusList[0] || 0).toString();
      this.radiusNumber.value = (radiusList[0] || 0).toString();
      this.radiusNumber.placeholder = '';
    }
    if (angleList.length > 1) {
      this.angleRange.value = '0';
      this.angleNumber.value = '';
      this.angleNumber.placeholder = '多个';
    }
    else {
      this.angleRange.value = (angleList[0] || 0).toString();
      this.angleNumber.value = (angleList[0] || 0).toString();
      this.angleNumber.placeholder = '';
    }
    if (saturationList.length > 1) {
      this.saturationRange.value = '0';
      this.saturationNumber.value = '';
      this.saturationNumber.placeholder = '多个';
    }
    else {
      this.saturationRange.value = ((saturationList[0] || 0) * 100 - 100).toString();
      this.saturationNumber.value = ((saturationList[0] || 0) * 100 - 100).toString();
      this.saturationNumber.placeholder = '';
    }
  }
}

export default BlurPanel;
