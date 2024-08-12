import Node from '../node/Node';
import Root from '../node/Root';
import Panel from './Panel';
import Listener from './Listener';
import Bitmap from '../node/Bitmap';
import { toPrecision } from '../math';
import { ColorAdjustStyle } from '../format';
import ColorAdjustCommand from '../history/ColorAdjustCommand';

const html = `
  <div class="panel-title">颜色调整</div>
  <div class="line hue">
    <div class="intro">色相</div>
    <div class="con">
      <input class="range" type="range" min="-180" max="180" step="1"/>
      <div class="input-unit">
        <input class="number" type="number" min="-180" max="180" step="1"/>
        <span class="unit">°</span>
      </div>
    </div>
  </div>
  <div class="line saturate">
    <div class="intro">饱和度</div>
    <div class="con">
      <input class="range" type="range" min="-100" max="100" step="1"/>
      <div class="input-unit">
        <input class="number" type="number" min="-100" max="100" step="1"/>
        <span class="unit">%</span>
      </div>
    </div>
  </div>
  <div class="line brightness">
    <div class="intro">亮度</div>
    <div class="con">
      <input class="range" type="range" min="-100" max="100" step="1"/>
      <div class="input-unit">
        <input class="number" type="number" min="-100" max="100" step="1"/>
        <span class="unit">%</span>
      </div>
    </div>
  </div>
  <div class="line contrast">
    <div class="intro">对比度</div>
    <div class="con">
      <input class="range" type="range" min="-100" max="100" step="1"/>
      <div class="input-unit">
        <input class="number" type="number" min="-100" max="100" step="1"/>
        <span class="unit">%</span>
      </div>
    </div>
  </div>
`;

class ColorAdjustPanel extends Panel {
  panel: HTMLElement;
  hueRotateRange: HTMLInputElement;
  hueRotateNumber: HTMLInputElement;
  saturateRange: HTMLInputElement;
  saturateNumber: HTMLInputElement;
  brightnessRange: HTMLInputElement;
  brightnessNumber: HTMLInputElement;
  contrastRange: HTMLInputElement;
  contrastNumber: HTMLInputElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);

    const panel = this.panel = document.createElement('div');
    panel.className = 'color-adjust-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    const hueRotateRange = this.hueRotateRange = panel.querySelector('.hue .range') as HTMLInputElement;
    const hueRotateNumber = this.hueRotateNumber = panel.querySelector('.hue .number') as HTMLInputElement;
    const saturateRange = this.saturateRange = panel.querySelector('.saturate .range') as HTMLInputElement;
    const saturateNumber = this.saturateNumber = panel.querySelector('.saturate .number') as HTMLInputElement;
    const brightnessRange = this.brightnessRange = panel.querySelector('.brightness .range') as HTMLInputElement;
    const brightnessNumber = this.brightnessNumber = panel.querySelector('.brightness .number') as HTMLInputElement;
    const contrastRange = this.contrastRange = panel.querySelector('.contrast .range') as HTMLInputElement;
    const contrastNumber = this.contrastNumber = panel.querySelector('.contrast .number') as HTMLInputElement;

    let nodes: Node[] = [];
    let prevs: ColorAdjustStyle[] = [];
    let nexts: ColorAdjustStyle[] = [];

    const onRangeInput = (range: HTMLInputElement, number: HTMLInputElement, type: 'hueRotate' | 'saturate' | 'brightness' | 'contrast') => {
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
        const { hueRotate, saturate, brightness, contrast } = node.getCssStyle();
        if (isFirst) {
          nodes.push(node);
          prevs.push({
            hueRotate,
            saturate,
            brightness,
            contrast,
          });
        }
        let next: ColorAdjustStyle = {
          hueRotate: type === 'hueRotate' ? v : hueRotate,
          saturate: type === 'saturate' ? (v + 100 + '%'): saturate,
          brightness: type === 'brightness' ? (v + 100 + '%'): brightness,
          contrast: type === 'contrast' ? ((v > 0 ? (v * 3 + 100) : (v + 100)) + '%'): contrast,
        };
        nexts.push(next);
        node.updateStyle(next);
      });
      number.value = value;
      number.placeholder = '';
      if (nodes.length) {
        listener.emit(Listener.COLOR_ADJUST_NODE, nodes.slice(0));
      }
      this.silence = false;
    };

    const onNumberInput = (range: HTMLInputElement, number: HTMLInputElement, type: 'hueRotate' | 'saturate' | 'brightness' | 'contrast', isInput: boolean, max: number, min: number) => {
      this.silence = true;
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      const v = parseFloat(number.value) || 0;
      this.nodes.forEach((node) => {
        const { hueRotate, saturate, brightness, contrast } = node.getCssStyle();
        if (isFirst) {
          nodes.push(node);
          prevs.push({
            hueRotate,
            saturate,
            brightness,
            contrast,
          });
        }
        const computedStyle = node.computedStyle;
        let prev = 0;
        if (type === 'hueRotate') {
          prev = computedStyle.hueRotate;
        }
        else if (type === 'saturate') {
          prev = computedStyle.saturate;
        }
        else if (type === 'brightness') {
          prev = computedStyle.brightness;
        }
        else if (type === 'contrast') {
          prev = computedStyle.contrast;
        }
        let next = v;
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
        const o: ColorAdjustStyle = {
          hueRotate: type === 'hueRotate' ? next : hueRotate,
          saturate: type === 'saturate' ? (next + 100 + '%') : saturate,
          brightness: type === 'brightness' ? (next + 100 + '%') : brightness,
          contrast: type === 'contrast' ? ((next > 0 ? (next * 3 + 100) : (next + 100)) + '%'): contrast,
        };
        nexts.push(o);
        node.updateStyle(o);
      });
      range.value = number.value || '0';
      if (nodes.length) {
        listener.emit(Listener.COLOR_ADJUST_NODE, nodes.slice(0));
      }
      this.silence = false;
    };

    const onChange = () => {
      if (nodes.length) {
        listener.history.addCommand(new ColorAdjustCommand(nodes, prevs.map((prev, i) => {
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

    hueRotateRange.addEventListener('input', () => {
      onRangeInput(hueRotateRange, hueRotateNumber, 'hueRotate');
    });
    hueRotateRange.addEventListener('change', onChange);

    hueRotateNumber.addEventListener('change', (e) => {
      onNumberInput(hueRotateRange, hueRotateNumber, 'hueRotate', e instanceof InputEvent, 180, -180);
    });
    hueRotateNumber.addEventListener('change', onChange);

    saturateRange.addEventListener('input', () => {
      onRangeInput(saturateRange, saturateNumber, 'saturate');
    });
    saturateRange.addEventListener('change', onChange);

    saturateNumber.addEventListener('change', (e) => {
      onNumberInput(saturateRange, saturateNumber, 'saturate', e instanceof InputEvent, 100, 0);
    });
    saturateNumber.addEventListener('change', onChange);

    brightnessRange.addEventListener('input', () => {
      onRangeInput(brightnessRange, brightnessNumber, 'brightness');
    });
    brightnessRange.addEventListener('change', onChange);

    brightnessNumber.addEventListener('change', (e) => {
      onNumberInput(brightnessRange, brightnessNumber, 'brightness', e instanceof InputEvent, 100, 0);
    });
    brightnessNumber.addEventListener('change', onChange);

    contrastRange.addEventListener('input', () => {
      onRangeInput(contrastRange, contrastNumber, 'contrast');
    });
    contrastRange.addEventListener('change', onChange);

    contrastNumber.addEventListener('change', (e) => {
      onNumberInput(contrastRange, contrastNumber, 'contrast', e instanceof InputEvent, 100, 0);
    });
    contrastNumber.addEventListener('change', onChange);

    listener.on([
      Listener.SELECT_NODE,
      Listener.ADD_NODE,
      Listener.COLOR_ADJUST_NODE,
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
    const panel = this.panel;
    let willShow = false;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      if (item instanceof Bitmap) {
        willShow = true;
        break;
      }
    }
    if (!willShow) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    const hueRotateList: number[] = [];
    const saturateList: number[] = [];
    const brightnessList: number[] = [];
    const contrastList: number[] = [];
    this.nodes = nodes.filter(item => item instanceof Bitmap);
    this.nodes.forEach(node => {
      const { hueRotate, saturate, brightness, contrast } = node.computedStyle;
      if (!hueRotateList.includes(hueRotate)) {
        hueRotateList.push(hueRotate);
      }
      if (!saturateList.includes(saturate)) {
        saturateList.push(saturate);
      }
      if (!brightnessList.includes(brightness)) {
        brightnessList.push(brightness);
      }
      if (!contrastList.includes(contrast)) {
        contrastList.push(contrast);
      }
    });
    if (hueRotateList.length > 1) {
      this.hueRotateRange.value = '0';
      this.hueRotateNumber.value = '';
      this.hueRotateNumber.placeholder = '多个';
    }
    else {
      const v = toPrecision(hueRotateList[0] || 0, 0).toString();
      this.hueRotateRange.value = v;
      this.hueRotateNumber.value = v;
      this.hueRotateNumber.placeholder = '';
    }
    if (saturateList.length > 1) {
      this.saturateRange.value = '0';
      this.saturateNumber.value = '';
      this.saturateNumber.placeholder = '多个';
    }
    else {
      const v = toPrecision((saturateList[0] || 0) * 100 - 100, 0).toString();
      this.saturateRange.value = v;
      this.saturateNumber.value = v;
      this.saturateNumber.placeholder = '';
    }
    if (brightnessList.length > 1) {
      this.brightnessRange.value = '0';
      this.brightnessNumber.value = '';
      this.brightnessNumber.placeholder = '多个';
    }
    else {
      const v = toPrecision((brightnessList[0] || 0) * 100 - 100, 0).toString();
      this.brightnessRange.value = v;
      this.brightnessNumber.value = v;
      this.brightnessNumber.placeholder = '';
    }
    if (contrastList.length > 1) {
      this.contrastRange.value = '0';
      this.contrastNumber.value = '';
      this.contrastNumber.placeholder = '多个';
    }
    else {
      let n = (contrastList[0] || 0) * 100 - 100;
      const v = toPrecision(n > 0 ? n / 3 : n, 0).toString();
      this.contrastRange.value = v;
      this.contrastNumber.value = v;
      this.contrastNumber.placeholder = '';
    }
  }
}

export default ColorAdjustPanel;
