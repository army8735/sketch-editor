import { color2rgbaInt, color2rgbaStr } from '../style/css';

let div: HTMLElement;
const html = `
<span style="position:absolute;left:90%;top:0;border:10px solid transparent;border-bottom-color:#CCC;transform:translate(-50%,-100%);pointer-events:none">
  <b style="position:absolute;left:0;top:0;border:10px solid transparent;border-bottom-color:#FFF;transform:translate(-10px,-9px)"></b>
</span>
`;

let picker: any;
let openFrom: string | undefined;
let callback: (() => void) | undefined; // 多个panel共用一个picker，新的点开老的还没关闭需要自动执行save，留个hook

export default {
  show(node: HTMLElement, from?: string, cb?: () => void, alignRight = false) {
    openFrom = from;
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
      // 点击外部自动关闭
      document.addEventListener('click', (e) => {
        let p = e.target as (HTMLElement | null);
        while (p) {
          if (p === div) {
            return;
          }
          p = p.parentElement;
        }
        this.hide();
      });
    }
    div.style.left = rect.left + (rect.right - rect.left) * 0.5 + 'px';
    div.style.top = rect.bottom + 10 + 'px';
    const span = div.querySelector('span')!;
    if (alignRight) {
      div.style.transform = 'translateX(-90%)';
      span.style.left = '90%';
    }
    else {
      div.style.transform = 'translateX(-24%)';
      span.style.left = '24%';
    }
    div.style.display = 'block';
    if (!picker) {
      // @ts-ignore
      picker = new window.Picker({
        parent: div,
        popup: false,
      });
    }
    const color = node.getAttribute('color') || '';
    const opacity = parseFloat(node.style.opacity);
    const rgba = color2rgbaInt(color);
    rgba[3] *= isNaN(opacity) ? 1 : opacity;
    picker.setColor(color2rgbaStr(rgba), true);
    picker.show();
    return picker;
  },
  hide() {
    if (div && div.style.display === 'block') {
      div.style.display = 'none';
      if (callback) {
        callback();
        callback = undefined;
      }
    }
  },
  isShow() {
    if (div) {
      return div.style.display === 'block';
    }
    return false;
  },
  isShowFrom(from: string) {
    return this.isShow() && openFrom === from;
  },
};
