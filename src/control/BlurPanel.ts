import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import Panel from './Panel';
import { BLUR } from '../style/define';

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

    this.radiusRange = panel.querySelector('.radius .range') as HTMLInputElement;
    this.radiusNumber = panel.querySelector('.radius .number') as HTMLInputElement;
    this.angleRange = panel.querySelector('.angle .range') as HTMLInputElement;
    this.angleNumber = panel.querySelector('.angle .number') as HTMLInputElement;
    this.saturationRange = panel.querySelector('.saturation .range') as HTMLInputElement;
    this.saturationNumber = panel.querySelector('.saturation .number') as HTMLInputElement;

    listener.on([
      Listener.SELECT_NODE,
      Listener.ADD_NODE,
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
