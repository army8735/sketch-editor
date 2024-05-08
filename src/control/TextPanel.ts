import Node from '../node/Node';
import Root from '../node/Root';
import Text from '../node/Text';
import { toPrecision } from '../math';
import { loadLocalFonts } from '../util/util';
import style from '../style';

const html = `
  <h4 class="panel-title">字符</h4>
  <div class="line ff">
    <select>
      <option value="arial">Arial</option>
    </select>
    <span class="multi">多种字体</span>
  </div>
  <div class="line num">
    <div class="fs">
      <input type="number" min="1" step="1"/>
      <span>字号</span>
    </div>
    <div class="ls">
      <input type="number" step="1"/>
      <span>字距</span>
    </div>
    <div class="lh">
      <input type="number" min="1" step="1"/>
      <span>行高</span>
    </div>
    <div class="ps">
      <input type="number" step="1"/>
      <span>段落</span>
    </div>
  </div>
`;

let local = false;
loadLocalFonts().then(res => {
  local = true;
  style.font.registerLocalFonts(res);
}).catch(() => {
  local = true;
});

class TextPanel {
  root: Root;
  dom: HTMLElement;
  panel: HTMLElement;
  local = false;

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;

    const panel = this.panel = document.createElement('div');
    panel.className = 'text-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);
  }

  initLocal() {
    if (this.local || !local) {
      return;
    }
    this.local = true;
    const { info } = style.font;
    let s = '';
    for (let i in info) {
      if (info.hasOwnProperty(i)) {
        const item = info[i];
        const list = item.list || [];
        if (list.length) {
          s += `<option value="${i}">${item.name || i}</option>`;
        }
      }
    }
    const select = this.panel.querySelector('select') as HTMLSelectElement;
    select.innerHTML = s;
  }

  show(nodes: Node[]) {
    const panel = this.panel;
    let willShow = false;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      if (item instanceof Text) {
        willShow = true;
        break;
      }
    }
    if (!willShow) {
      panel.style.display = 'none';
      return;
    }
    this.initLocal();
    panel.style.display = 'block';
    panel.querySelectorAll('input').forEach(item => {
      item.disabled = false;
      item.placeholder = '';
      item.value = '';
    });
    const ffs: string[] = [];
    const fss: number[] = [];
    const lss: number[] = [];
    const lhs: number[] = [];
    const pss: number[] = [];
    nodes.forEach(node => {
      if (node instanceof Text) {
        const style = node.getCssStyle();
        if (!ffs.includes(style.fontFamily)) {
          ffs.push(style.fontFamily);
        }
        if (!fss.includes(style.fontSize)) {
          fss.push(style.fontSize);
        }
        if (!lss.includes(style.letterSpacing)) {
          lss.push(style.letterSpacing);
        }
        const lineHeight = style.lineHeight as number;
        if (!lhs.includes(lineHeight)) {
          lhs.push(lineHeight);
        }
        if (!pss.includes(style.paragraphSpacing)) {
          pss.push(style.paragraphSpacing);
        }
      }
    });
    {
      const select = panel.querySelector('.ff select') as HTMLSelectElement;
      const multi = panel.querySelector('.ff .multi') as HTMLElement;
      if (ffs.length > 1) {
        multi.style.display = 'block';
      }
      else {
        multi.style.display = 'none';
        // 移除上次可能遗留的无效字体展示
        const invalid = select.querySelector(':disabled') as HTMLOptionElement;
        if (invalid) {
          invalid.remove();
        }
        const { data } = style.font;
        const list = select.querySelectorAll('option');
        let has = false;
        for (let i = 0, len = list.length; i < len; i++) {
          const option = list[i];
          const o = data[ffs[0]];
          if (o && o.family.toLowerCase() === option.value) {
            has = true;
            option.selected = true;
            break;
          }
        }
        if (!has) {
          const option = `<option value="${ffs[0]}" selected="selected" disabled>${ffs[0]}</option>`;
          select.innerHTML += option;
          select.classList.add('invalid');
        }
      }
    }
    {
      const input = panel.querySelector('.fs input') as HTMLInputElement;
      if (fss.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = toPrecision(fss[0], 0).toString();
      }
    }
    {
      const input = panel.querySelector('.ls input') as HTMLInputElement;
      if (lss.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = toPrecision(lss[0], 0).toString();
      }
    }
    {
      const input = panel.querySelector('.lh input') as HTMLInputElement;
      if (lhs.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = toPrecision(lhs[0], 0).toString();
      }
    }
    {
      const input = panel.querySelector('.ps input') as HTMLInputElement;
      if (pss.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = pss[0].toString();
      }
    }
  }
}

export default TextPanel;
