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
  <div class="panel-title">模糊<b class="btn"></b></div>
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
      <input class="range" type="range" min="-180" max="180" step="1"/>
      <div class="input-unit">
        <input class="number" type="number" min="-180" max="180" step="1"/>
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
  btn: HTMLElement;
  select: HTMLSelectElement;
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

    const btn = this.btn = panel.querySelector('.btn') as HTMLElement;
    const select = this.select = panel.querySelector('select')!;
    const radiusRange = this.radiusRange = panel.querySelector('.radius .range') as HTMLInputElement;
    const radiusNumber = this.radiusNumber = panel.querySelector('.radius .number') as HTMLInputElement;
    const angleRange = this.angleRange = panel.querySelector('.angle .range') as HTMLInputElement;
    const angleNumber = this.angleNumber = panel.querySelector('.angle .number') as HTMLInputElement;
    const saturationRange = this.saturationRange = panel.querySelector('.saturation .range') as HTMLInputElement;
    const saturationNumber = this.saturationNumber = panel.querySelector('.saturation .number') as HTMLInputElement;

    let nodes: Node[] = [];
    let prevs: BlurStyle[] = [];
    let nexts: BlurStyle[] = [];

    btn.addEventListener('click', () => {
      const isAdd = btn.classList.contains('add');
      if (isAdd) {
        btn.classList.remove('add');
        btn.classList.add('del');
      }
      else {
        btn.classList.add('add');
        btn.classList.remove('del');
      }
      nodes = [];
      prevs = [];
      nexts = [];
      this.nodes.forEach(node => {
        nodes.push(node);
        prevs.push({
          blur: node.getCssStyle().blur,
        });
        const blur = node.computedStyle.blur;
        // 默认删除，如果是添加则改变
        let next = {
          blur: 'none',
        };
        if (isAdd) {
          next.blur = getCssBlur(BLUR.GAUSSIAN, 4, 0, [0.5, 0.5], 1);
        }
        nexts.push(next);
        node.updateStyle(next);
      });
      onChange();
    });

    select.addEventListener('change', () => {
      this.silence = true;
      const value = parseInt(select.value) as BLUR;
      panel.querySelectorAll('div.t2,div.t3,div.t4').forEach(item => {
        (item as HTMLDivElement).style.display = 'none';
      });
      const div = panel.querySelector(`div.t${value}`) as HTMLDivElement;
      if (div) {
        div.style.display = 'block';
      }
      nodes = [];
      prevs = [];
      nexts = [];
      this.nodes.forEach(node => {
        nodes.push(node);
        prevs.push({
          blur: node.getCssStyle().blur,
        });
        const blur = node.computedStyle.blur;
        const next = {
          blur: getCssBlur(value, blur.radius, blur.angle, blur.center, blur.saturation),
        };
        nexts.push(next);
        node.updateStyle(next);
      });
      listener.emit(Listener.BLUR_NODE, nodes.slice(0));
      onChange();
      this.show(this.nodes);
      this.silence = false;
    });

    const onRangeInput = (range: HTMLInputElement, number: HTMLInputElement, type: 'radius' | 'angle' | 'saturation') => {
      this.silence = true;
      const value = range.value;
      const v = parseFloat(value);
      // 连续多个只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      this.nodes.forEach((node) => {
        if (isFirst) {
          nodes.push(node);
          prevs.push({
            blur: node.getCssStyle().blur,
          });
        }
        const blur = node.computedStyle.blur;
        let next: BlurStyle;
        if (type === 'radius') {
          next = {
            blur: getCssBlur(blur.t, v, blur.angle, blur.center, blur.saturation),
          };
        }
        else if (type === 'angle') {
          next = {
            blur: getCssBlur(blur.t, blur.radius, v, blur.center, blur.saturation),
          };
        }
        else if (type === 'saturation') {
          next = {
            blur: getCssBlur(blur.t, blur.radius, blur.angle, blur.center, toPrecision((v + 100) * 0.01)),
          };
        }
        nexts.push(next!);
        node.updateStyle(next!);
        number.value = value;
        number.placeholder = '';
      });
      if (nodes.length) {
        listener.emit(Listener.BLUR_NODE, nodes.slice(0));
      }
      this.silence = false;
    };

    const onNumberInput = (range: HTMLInputElement, number: HTMLInputElement, type: 'radius' | 'angle' | 'saturation', isInput: boolean, max: number, min: number) => {
      this.silence = true;
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      const value = parseFloat(number.value) || 0;
      this.nodes.forEach((node) => {
        const blur = node.computedStyle.blur;
        if (blur.t === BLUR.NONE) {
          return;
        }
        let prev = blur.radius;
        if (type === 'angle') {
          prev = blur.angle!;
        }
        else if (type === 'saturation') {
          prev = blur.saturation! * 100 - 100;
        }
        let next = value;
        if (isFirst) {
          nodes.push(node);
          prevs.push({
            blur: node.getCssStyle().blur,
          });
        }
        if (!isInput) {
          let d = 0;
          if (number.placeholder) {
            d = next > 0 ? 1 : -1;
            if (listener.shiftKey) {
              d *= 10;
            }
            next = Math.min(max, Math.max(min, prev + d));
            number.value = '';
          }
          else {
            d = next - prev;
            if (listener.shiftKey) {
              d *= 10;
            }
            next = Math.min(max, Math.max(min, prev + d));
            number.value = toPrecision(next).toString();
          }
        }
        else {
          number.placeholder = '';
        }
        let o: BlurStyle;
        if (type === 'radius') {
          o = {
            blur: getCssBlur(blur.t, next, blur.angle, blur.center, blur.saturation),
          };
        }
        else if (type === 'angle') {
          o = {
            blur: getCssBlur(blur.t, blur.radius, next, blur.center, blur.saturation),
          };
        }
        else if (type === 'saturation') {
          o = {
            blur: getCssBlur(blur.t, blur.radius, blur.angle, blur.center, toPrecision((next + 100) * 0.01)),
          };
        }
        nexts.push(o!);
        node.updateStyle(o!);
      });
      range.value = value.toString();
      if (nodes.length) {
        listener.emit(Listener.BLUR_NODE, nodes.slice(0));
      }
      this.silence = false;
    };

    const onChange = () => {
      if (nodes.length) {
        listener.history.addCommand(new BlurCommand(nodes, prevs.map((prev, i) => {
          return {
            prev,
            next: nexts[i],
          };
        })));
      }
      nodes = [];
      prevs = [];
      nexts = [];
    };

    radiusRange.addEventListener('input', () => {
      onRangeInput(radiusRange, radiusNumber, 'radius');
    });
    radiusRange.addEventListener('change', onChange);

    radiusNumber.addEventListener('input', (e) => {
      onNumberInput(radiusRange, radiusNumber, 'radius', e instanceof InputEvent, 50, 0);
    });
    radiusNumber.addEventListener('change', onChange);

    angleRange.addEventListener('input', () => {
      onRangeInput(angleRange, angleNumber, 'angle');
    });
    angleRange.addEventListener('change', onChange);

    angleNumber.addEventListener('input', (e) => {
      onNumberInput(angleRange, angleNumber, 'angle', e instanceof InputEvent, 180, -180);
    });
    angleNumber.addEventListener('change', onChange);

    saturationRange.addEventListener('input', () => {
      onRangeInput(saturationRange, saturationNumber, 'saturation');
    });
    saturationRange.addEventListener('change', onChange);

    saturationNumber.addEventListener('input', (e) => {
      onNumberInput(saturationRange, saturationNumber, 'saturation', e instanceof InputEvent, 100, -100);
    });
    saturationNumber.addEventListener('change', onChange);

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
      if (blur.t === BLUR.NONE) {
        return;
      }
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
    panel.querySelectorAll('select,div.type').forEach(item => {
      (item as HTMLElement).style.display = 'none';
    });
    if (!typeList.length) {
      this.btn.classList.remove('del');
      this.btn.classList.add('add');
      return;
    }
    this.btn.classList.remove('add');
    this.btn.classList.add('del');
    this.select.style.display = 'block';
    (panel.querySelector('div.radius') as HTMLDivElement).style.display = 'block';
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
      this.radiusRange.value = toPrecision(radiusList[0] || 0, 0).toString();
      this.radiusNumber.value = toPrecision(radiusList[0] || 0, 0).toString();
      this.radiusNumber.placeholder = '';
    }
    if (angleList.length > 1) {
      this.angleRange.value = '0';
      this.angleNumber.value = '';
      this.angleNumber.placeholder = '多个';
    }
    else {
      this.angleRange.value = toPrecision(angleList[0] || 0, 0).toString();
      this.angleNumber.value = toPrecision(angleList[0] || 0, 0).toString();
      this.angleNumber.placeholder = '';
    }
    if (saturationList.length > 1) {
      this.saturationRange.value = '0';
      this.saturationNumber.value = '';
      this.saturationNumber.placeholder = '多个';
    }
    else {
      this.saturationRange.value = toPrecision((saturationList[0] || 0) * 100 - 100, 0).toString();
      this.saturationNumber.value = toPrecision((saturationList[0] || 0) * 100 - 100, 0).toString();
      this.saturationNumber.placeholder = '';
    }
  }
}

export default BlurPanel;
