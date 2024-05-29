import Picker from 'vanilla-picker';
import { color2rgbaInt, color2rgbaStr } from '../style/css';

let div: HTMLElement;
const html = `
<span style="position:absolute;left:90%;top:0;border:10px solid transparent;border-bottom-color:#CCC;transform:translate(-50%,-100%)">
  <b style="position:absolute;left:0;top:0;border:10px solid transparent;border-bottom-color:#FFF;transform:translate(-10px,-9px)"></b>
</span>
`;

let picker: Picker;

let callback: (() => void) | undefined; // 多个panel共用一个picker，新的点开老的还没关闭需要自动执行save，留个hook

export default {
  show(node: HTMLElement, cb?: () => void) {
    if (callback) {
      callback();
      callback = undefined;
    }
    callback = cb;
    const rect = node.getBoundingClientRect();
    if (!div) {
      div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = '0px';
      div.style.top = '0px';
      div.style.zIndex = '9999';
      div.style.display = 'none';
      div.style.padding = '5px';
      div.style.backgroundColor = '#FFF';
      div.style.border = '1px solid #CCC';
      div.style.borderRadius = '5px';
      div.style.filter = 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.2))';
      div.style.transform = 'translateX(-90%)';
      div.innerHTML = html;
      document.body.appendChild(div);
    }
    div.style.left = rect.left + (rect.right - rect.left) * 0.5 + 'px';
    div.style.top = rect.bottom + 10 + 'px';
    div.style.display = 'block';
    if (!picker) {
      picker = new Picker({
        parent: div,
        popup: false,
      });
    }
    const color = node.style.backgroundColor;
    const opacity = parseFloat(node.style.opacity);
    const rgba = color2rgbaInt(color);
    rgba[3] *= opacity;
    picker.setColor(color2rgbaStr(rgba), true);
    picker.show();
    return picker;
  },
  hide() {
    if (div) {
      div.style.display = 'none';
    }
  },
};
