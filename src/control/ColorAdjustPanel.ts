import Node from '../node/Node';
import Root from '../node/Root';
import Panel from './Panel';
import Listener from './Listener';
import Bitmap from '../node/Bitmap';
import { ColorAdjustStyle } from '../format';
import ColorAdjustCommand from '../history/ColorAdjustCommand';

const html = `
  <div class="panel-title">颜色调整</div>
  <div class="line hue">
    <div class="intro">色相</div>
    <input class="range" type="range" min="-180" max="180" step="1"/>
    <div class="input-unit">
      <input class="number" type="number" min="-180" max="180" step="1"/>
      <span class="unit">°</span>
    </div>
  </div>
  <div class="line saturate">
    <div class="intro">饱和度</div>
    <input class="range" type="range" min="-100" max="100" step="1"/>
    <div class="input-unit">
      <input class="number" type="number" min="-100" max="100" step="1"/>
      <span class="unit">%</span>
    </div>
  </div>
  <div class="line brightness">
    <div class="intro">亮度</div>
    <input class="range" type="range" min="-100" max="100" step="1"/>
    <div class="input-unit">
      <input class="number" type="number" min="-100" max="100" step="1"/>
      <span class="unit">%</span>
    </div>
  </div>
  <div class="line contrast">
    <div class="intro">对比度</div>
    <input class="range" type="range" min="-100" max="100" step="1"/>
    <div class="input-unit">
      <input class="number" type="number" min="-100" max="100" step="1"/>
      <span class="unit">%</span>
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
    dom.appendChild(panel);

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
      const n = parseFloat(value);
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
          hueRotate: type === 'hueRotate' ? n : hueRotate,
          saturate: type === 'saturate' ? (n + 100 + '%'): saturate,
          brightness: type === 'brightness' ? (n + 100 + '%'): brightness,
          contrast: type === 'contrast' ? ((n > 0 ? (n * 3 + 100) : (n + 100)) + '%'): contrast,
        };
        nexts.push(next);
        node.updateStyle(next);
      });
      if (type === 'hueRotate') {
        range.style.setProperty('--p', ((n + 180) * 100 / 360).toString());
      }
      else if (type === 'saturate' || type === 'brightness') {
        range.style.setProperty('--p', ((n + 100) * 0.5).toString());
      }
      else if (type === 'contrast') {
        range.style.setProperty('--p', ((n + 100) * 0.5).toString());
      }
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
      const n = parseFloat(number.value) || 0;
      this.nodes.forEach((node, i) => {
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
          prev = computedStyle.saturate * 100 - 100;
        }
        else if (type === 'brightness') {
          prev = computedStyle.brightness * 100 - 100;
        }
        else if (type === 'contrast') {
          prev = computedStyle.contrast * 100 - 100;
          if (prev > 0) {
            prev /= 3;
          }
        }
        let next = n;
        if (!isInput) {
          let d = 0;
          if (number.placeholder) {
            d = next > 0 ? 1 : -1;
            if (listener.shiftKey) {
              d *= 10;
            }
            next = Math.min(max, Math.max(min, Math.round(prev + d)));
            number.value = '';
          }
          else {
            d = next - prev;
            if (listener.shiftKey) {
              d *= 10;
            }
            next = Math.min(max, Math.max(min, Math.round(prev + d)));
            if (!i) {
              number.value = next.toString();
            }
          }
        }
        else if (!i) {
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
      if (!number.placeholder) {
        const n = parseFloat(range.value);
        if (type === 'hueRotate') {
          range.style.setProperty('--p', ((n + 180) * 100 / 360).toString());
        }
        else if (type === 'saturate' || type === 'brightness') {
          range.style.setProperty('--p', ((n + 100) * 0.5).toString());
        }
        else if (type === 'contrast') {
          range.style.setProperty('--p', ((n + 100) * 0.5).toString());
        }
      }
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
      onBlur();
    };

    const onBlur = () => {
      nodes = [];
      prevs = [];
      nexts = [];
    };

    hueRotateRange.addEventListener('input', () => {
      onRangeInput(hueRotateRange, hueRotateNumber, 'hueRotate');
    });
    hueRotateRange.addEventListener('change', onChange);

    hueRotateNumber.addEventListener('input', (e) => {
      onNumberInput(hueRotateRange, hueRotateNumber, 'hueRotate', e instanceof InputEvent, 180, -180);
    });
    hueRotateNumber.addEventListener('change', onChange);
    hueRotateNumber.addEventListener('blur', onBlur);

    saturateRange.addEventListener('input', () => {
      onRangeInput(saturateRange, saturateNumber, 'saturate');
    });
    saturateRange.addEventListener('change', onChange);

    saturateNumber.addEventListener('input', (e) => {
      onNumberInput(saturateRange, saturateNumber, 'saturate', e instanceof InputEvent, 100, -100);
    });
    saturateNumber.addEventListener('change', onChange);
    saturateNumber.addEventListener('blur', onBlur);

    brightnessRange.addEventListener('input', () => {
      onRangeInput(brightnessRange, brightnessNumber, 'brightness');
    });
    brightnessRange.addEventListener('change', onChange);

    brightnessNumber.addEventListener('input', (e) => {
      onNumberInput(brightnessRange, brightnessNumber, 'brightness', e instanceof InputEvent, 100, -100);
    });
    brightnessNumber.addEventListener('change', onChange);
    brightnessNumber.addEventListener('blur', onBlur);

    contrastRange.addEventListener('input', () => {
      onRangeInput(contrastRange, contrastNumber, 'contrast');
    });
    contrastRange.addEventListener('change', onChange);

    contrastNumber.addEventListener('input', (e) => {
      onNumberInput(contrastRange, contrastNumber, 'contrast', e instanceof InputEvent, 100, -100);
    });
    contrastNumber.addEventListener('change', onChange);
    contrastNumber.addEventListener('blur', onBlur);

    listener.on([
      Listener.COLOR_ADJUST_NODE,
    ], (nodes: Node[]) => {
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
  }

  override show(nodes: Node[]) {
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
      this.hueRotateRange.style.setProperty('--p', '50');
      this.hueRotateNumber.value = '';
      this.hueRotateNumber.placeholder = '多个';
    }
    else {
      const n = Math.round(hueRotateList[0] || 0);
      const v = n.toString();
      this.hueRotateRange.value = v;
      this.hueRotateRange.style.setProperty('--p', ((n + 180) * 100 / 360).toString());
      this.hueRotateNumber.value = v;
      this.hueRotateNumber.placeholder = '';
    }
    if (saturateList.length > 1) {
      this.saturateRange.value = '0';
      this.saturateRange.style.setProperty('--p', '50');
      this.saturateNumber.value = '';
      this.saturateNumber.placeholder = '多个';
    }
    else {
      const n = Math.round((saturateList[0] || 0) * 100 - 100);
      const v = n.toString();
      this.saturateRange.value = v;
      this.saturateRange.style.setProperty('--p', ((n + 100) * 0.5).toString());
      this.saturateNumber.value = v;
      this.saturateNumber.placeholder = '';
    }
    if (brightnessList.length > 1) {
      this.brightnessRange.value = '0';
      this.brightnessRange.style.setProperty('--p', '50');
      this.brightnessNumber.value = '';
      this.brightnessNumber.placeholder = '多个';
    }
    else {
      const n = Math.round((brightnessList[0] || 0) * 100 - 100);
      const v = n.toString();
      this.brightnessRange.value = v;
      this.brightnessRange.style.setProperty('--p', ((n + 100) * 0.5).toString());
      this.brightnessNumber.value = v;
      this.brightnessNumber.placeholder = '';
    }
    if (contrastList.length > 1) {
      this.contrastRange.value = '0';
      this.contrastRange.style.setProperty('--p', '50');
      this.contrastNumber.value = '';
      this.contrastNumber.placeholder = '多个';
    }
    else {
      const n = (contrastList[0] || 0) * 100 - 100;
      const v = Math.round(n > 0 ? n / 3 : n).toString();
      this.contrastRange.value = v;
      if (n > 0) {
        this.contrastRange.style.setProperty('--p', ((n / 3) * 0.5 + 50).toString());
      }
      else {
        this.contrastRange.style.setProperty('--p', ((n + 100) * 0.5).toString());
      }
      this.contrastNumber.value = v;
      this.contrastNumber.placeholder = '';
    }
  }
}

export default ColorAdjustPanel;
