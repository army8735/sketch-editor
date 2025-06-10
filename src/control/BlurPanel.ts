import Node from '../node/Node';
import Root from '../node/Root';
import Listener from './Listener';
import Panel from './Panel';
import { BLUR } from '../style/define';
import { BlurStyle } from '../format';
import { getCssBlur } from '../style/css';
import BlurCommand from '../history/BlurCommand';
import state from './state';

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
    dom.appendChild(panel);

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
    let keys: string[][] = []; // 输入的input不刷新记录等change，按上下箭头一起触发不需要记录

    const onChange = () => {
      if (nodes.length && nexts.length) {
        listener.history.addCommand(new BlurCommand(nodes, prevs.map((prev, i) => {
          return {
            prev,
            next: nexts[i],
          };
        })));
        onBlur();
      }
    };

    const onBlur = () => {
      nodes = [];
      prevs = [];
      nexts = [];
      keys = [];
    };

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
        // 默认删除，如果是添加则改变
        const next = {
          blur: 'none',
        };
        if (isAdd) {
          next.blur = getCssBlur(BLUR.GAUSSIAN, 4, 0, [0.5, 0.5], 1);
        }
        nexts.push(next);
        node.updateStyle(next);
      });
      this.show(this.nodes);
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
      const n = parseFloat(value);
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
            blur: getCssBlur(blur.t, n, blur.angle, blur.center, blur.saturation),
          };
        }
        else if (type === 'angle') {
          next = {
            blur: getCssBlur(blur.t, blur.radius, n, blur.center, blur.saturation),
          };
        }
        else if (type === 'saturation') {
          next = {
            blur: getCssBlur(blur.t, blur.radius, blur.angle, blur.center, (n + 100) * 0.01),
          };
        }
        nexts.push(next!);
        node.updateStyle(next!);
      });
      if (type === 'radius') {
        range.style.setProperty('--p', (n * 2).toString());
      }
      else if (type === 'angle') {
        range.style.setProperty('--p', ((n + 180) * 100 / 360).toString());
      }
      else if (type === 'saturation') {
        range.style.setProperty('--p', ((n + 100) * 0.5).toString());
      }
      number.value = value;
      number.placeholder = '';
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
      keys = [];
      const n = parseFloat(number.value) || 0;
      this.nodes.forEach((node, i) => {
        const blur = node.computedStyle.blur;
        if (blur.t === BLUR.NONE) {
          return;
        }
        if (isFirst) {
          nodes.push(node);
          prevs.push({
            blur: node.getCssStyle().blur,
          });
        }
        let prev = blur.radius;
        if (type === 'angle') {
          prev = blur.angle!;
        }
        else if (type === 'saturation') {
          prev = blur.saturation! * 100 - 100;
        }
        let next = n;
        if (isInput) {
          if (number.placeholder) {
            number.placeholder = '';
          }
        }
        else {
          let d = 0;
          if (number.placeholder) {
            d = next > 0 ? 1 : -1;
            if (listener.shiftKey) {
              d *= 10;
            }
            else if (listener.altKey) {
              d *= 0.1;
            }
            next = Math.min(max, Math.max(min, Math.round(prev + d)));
            number.value = '';
          }
          else {
            d = next - prev;
            if (listener.shiftKey) {
              d *= 10;
            }
            else if (listener.altKey) {
              d *= 0.1;
            }
            next = Math.min(max, Math.max(min, Math.round(prev + d)));
            if (!i) {
              number.value = next.toString();
            }
          }
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
            blur: getCssBlur(blur.t, blur.radius, blur.angle, blur.center, (next + 100) * 0.01),
          };
        }
        nexts.push(o!);
        if (isInput) {
          const k = node.updateStyleData(o!);
          keys.push(k);
        }
        else {
          node.updateStyle(o!);
        }
      });
      range.value = number.value || '0';
      if (!number.placeholder) {
        const n = parseFloat(range.value);
        if (type === 'radius') {
          range.style.setProperty('--p', (n * 2).toString());
        }
        else if (type === 'angle') {
          range.style.setProperty('--p', ((n + 180) * 100 / 360).toString());
        }
        else if (type === 'saturation') {
          range.style.setProperty('--p', ((n + 100) * 0.5).toString());
        }
      }
      this.silence = false;
    };

    radiusRange.addEventListener('input', () => {
      onRangeInput(radiusRange, radiusNumber, 'radius');
    });
    radiusRange.addEventListener('change', () => onChange());

    radiusNumber.addEventListener('input', (e) => {
      onNumberInput(radiusRange, radiusNumber, 'radius', e instanceof InputEvent, 50, 0);
    });
    radiusNumber.addEventListener('change', () => {
      this.silence = true;
      if (keys.length) {
        nodes.forEach((node, i) => {
          if (keys[i].length) {
            node.refresh(keys[i]);
          }
        });
      }
      listener.emit(Listener.BLUR_NODE, nodes.slice(0));
      onChange();
      this.silence = false;
    });
    radiusNumber.addEventListener('blur', () => onBlur());

    angleRange.addEventListener('input', () => {
      onRangeInput(angleRange, angleNumber, 'angle');
    });
    angleRange.addEventListener('change', () => onChange());

    angleNumber.addEventListener('input', (e) => {
      onNumberInput(angleRange, angleNumber, 'angle', e instanceof InputEvent, 180, -180);
    });
    angleNumber.addEventListener('change', () => {
      this.silence = true;
      if (keys.length) {
        nodes.forEach((node, i) => {
          if (keys[i].length) {
            node.refresh(keys[i]);
          }
        });
      }
      listener.emit(Listener.BLUR_NODE, nodes.slice(0));
      onChange();
      this.silence = false;
    });
    angleNumber.addEventListener('blur', () => onBlur());

    saturationRange.addEventListener('input', () => {
      onRangeInput(saturationRange, saturationNumber, 'saturation');
    });
    saturationRange.addEventListener('change', () => onChange());

    saturationNumber.addEventListener('input', (e) => {
      onNumberInput(saturationRange, saturationNumber, 'saturation', e instanceof InputEvent, 100, -100);
    });
    saturationNumber.addEventListener('change', () => {
      this.silence = true;
      if (keys.length) {
        nodes.forEach((node, i) => {
          if (keys[i].length) {
            node.refresh(keys[i]);
          }
        });
      }
      listener.emit(Listener.BLUR_NODE, nodes.slice(0));
      onChange();
      this.silence = false;
    });
    saturationNumber.addEventListener('blur', () => onBlur());

    listener.on([
      Listener.BLUR_NODE,
    ], (nodes: Node[]) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
    listener.on(Listener.STATE_CHANGE, (prev: state, next: state) => {
      if (next === state.EDIT_GEOM || next === state.NORMAL) {
        this.show(listener.selected);
      }
    });
  }

  override show(nodes: Node[]) {
    super.show(nodes);
    const panel = this.panel;
    if (!nodes.length || this.listener.state === state.EDIT_GEOM) {
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
      this.radiusRange.style.setProperty('--p', '0');
      this.radiusNumber.value = '';
      this.radiusNumber.placeholder = '多个';
    }
    else {
      const n = Math.round(radiusList[0] || 0);
      const v = n.toString();
      this.radiusRange.style.setProperty('--p', (n * 2).toString());
      this.radiusRange.value = v;
      this.radiusNumber.value = v;
      this.radiusNumber.placeholder = '';
    }
    if (angleList.length > 1) {
      this.angleRange.value = '0';
      this.radiusRange.style.setProperty('--p', '50');
      this.angleNumber.value = '';
      this.angleNumber.placeholder = '多个';
    }
    else {
      const n = Math.round(angleList[0] || 0);
      const v = n.toString();
      this.angleRange.value = v;
      this.angleRange.style.setProperty('--p', ((n + 180) * 100 / 360).toString());
      this.angleNumber.value = v;
      this.angleNumber.placeholder = '';
    }
    if (saturationList.length > 1) {
      this.saturationRange.value = '0';
      this.saturationRange.style.setProperty('--p', '50');
      this.saturationNumber.value = '';
      this.saturationNumber.placeholder = '多个';
    }
    else {
      const n = Math.round((saturationList[0] || 0) * 100 - 100);
      const v = n.toString();
      this.saturationRange.value = v;
      this.saturationRange.style.setProperty('--p', ((n + 100) * 0.5).toString());
      this.saturationNumber.value = v;
      this.saturationNumber.placeholder = '';
    }
  }
}

export default BlurPanel;
