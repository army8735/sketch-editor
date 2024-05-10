import Node from '../node/Node';
import Root from '../node/Root';
import Text from '../node/Text';
import { toPrecision } from '../math';
import { loadLocalFonts } from '../util/util';
import style from '../style';
import text from '../tools/text';
import { TEXT_ALIGN } from '../style/define';

const html = `
  <h4 class="panel-title">字符</h4>
  <div class="line ff">
    <select>
      <option value="arial">Arial</option>
    </select>
    <span class="multi">多种字体</span>
  </div>
  <div class="line wc">
    <div>
      <select></select>
      <span class="multi">多种字重</span>
    </div>
    <input type="color"/>
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
  <div class="line al">
    <span class="left" title="左对齐"></span>
    <span class="center" title="居中对齐"></span>
    <span class="right" title="右对齐"></span>
    <span class="justify" title="两端对齐"></span>
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
    });
    const texts = nodes.filter(item => item instanceof Text) as Text[];
    const o = text.getData(texts);
    {
      const select = panel.querySelector('.ff select') as HTMLSelectElement;
      const multi = panel.querySelector('.ff .multi') as HTMLElement;
      if (o.fontFamily.length > 1) {
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
        const ff = o.fontFamily[0];
        for (let i = 0, len = list.length; i < len; i++) {
          const option = list[i];
          const o = data[ff];
          if (o && o.family.toLowerCase() === option.value) {
            has = true;
            option.selected = true;
            break;
          }
        }
        if (!has) {
          const option = `<option value="${ff}" selected="selected" disabled>${ff}</option>`;
          select.innerHTML += option;
          select.classList.add('invalid');
        }
      }
    }
    {
      const select = panel.querySelector('.wc select') as HTMLSelectElement;
      let s = '';
      o.fontWeightList.forEach(item => {
        s += `<option value="${item.value}">${item.label}</option>`;
      });
      select.innerHTML = s;
      const multi = panel.querySelector('.wc .multi') as HTMLElement;
      if (o.fontWeight.length > 1) {
        multi.style.display = 'block';
        select.disabled = true;
      }
      else {
        multi.style.display = 'none';
        select.disabled = false;
        const list = select.querySelectorAll('option');
        for (let i = 0, len = list.length; i < len; i++) {
          const option = list[i];
          if (option.innerHTML === o.fontWeight[0]) {
            option.selected = true;
            break;
          }
        }
      }
    }
    {
      const color = panel.querySelector('input[type=color]') as HTMLInputElement;
      color.value = o.color[0];
    }
    {
      const input = panel.querySelector('.fs input') as HTMLInputElement;
      if (o.fontSize.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = toPrecision(o.fontSize[0], 0).toString();
      }
    }
    {
      const input = panel.querySelector('.ls input') as HTMLInputElement;
      if (o.letterSpacing.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = toPrecision(o.letterSpacing[0], 0).toString();
      }
    }
    {
      const input = panel.querySelector('.lh input') as HTMLInputElement;
      if (o.lineHeight.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = toPrecision(o.lineHeight[0], 0).toString();
      }
    }
    {
      const input = panel.querySelector('.ps input') as HTMLInputElement;
      if (o.paragraphSpacing.length > 1) {
        input.placeholder = '多个';
      }
      else {
        input.value = o.paragraphSpacing[0].toString();
      }
    }
    {
      const span = panel.querySelector('.al .cur') as HTMLElement;
      if (span) {
        span.classList.remove('cur');
      }
      if (o.textAlign.length === 1) {
        const ta = o.textAlign[0];
        if (ta === TEXT_ALIGN.LEFT) {
          panel.querySelector('.al .left')!.classList.add('cur');
        }
        else if (ta === TEXT_ALIGN.CENTER) {
          panel.querySelector('.al .center')!.classList.add('cur');
        }
        else if (ta === TEXT_ALIGN.RIGHT) {
          panel.querySelector('.al .right')!.classList.add('cur');
        }
        else if (ta === TEXT_ALIGN.JUSTIFY) {
          panel.querySelector('.al .justify')!.classList.add('cur');
        }
      }
    }
  }
}

export default TextPanel;
