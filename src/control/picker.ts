import Picker from 'vanilla-picker';
import { color2rgbaInt, color2rgbaStr } from '../style/css';

const div = document.createElement('div');
div.style.position = 'absolute';
div.style.left = '0px';
div.style.top = '0px';
div.style.zIndex = '9999';
div.style.display = 'none';
div.style.padding = '10px';
div.style.backgroundColor = '#FFF';
div.style.border = '1px solid #CCC';
div.style.borderRadius = '5px';
div.style.filter = 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.2))';
div.style.transform = 'translateX(-50%)';
div.innerHTML = `
<span style="position:absolute;left:50%;top:0;border:10px solid transparent;border-bottom-color:#CCC;transform:translate(-50%,-100%)">
  <b style="position:absolute;left:0;top:0;border:10px solid transparent;border-bottom-color:#FFF;transform:translate(-10px,-9px)"></b>
</span>
`;
document.body.appendChild(div);

let picker: Picker;

export default {
  show(node: HTMLElement) {
    const rect = node.getBoundingClientRect();
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
    div.style.display = 'none';
  }
};
