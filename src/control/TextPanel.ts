import Node from '../node/Node';
import Root from '../node/Root';
import Text from '../node/Text';
import { toPrecision } from '../math';
import { loadLocalFonts } from '../util/util';
import style from '../style';
import { getData, getWeight, TEXT_BEHAVIOUR, updateBehaviour } from '../tools/text';
import { TEXT_ALIGN, TEXT_VERTICAL_ALIGN } from '../style/define';
import Listener from './Listener';
import picker from './picker';
import UpdateRichCommand from '../history/UpdateRichCommand';
import ResizeCommand from '../history/ResizeCommand';
import State from './State';
import Panel from './Panel';
import { ModifyRichData, VerticalAlignData } from '../history/type';
import VerticalAlignCommand from '../history/VerticalAlignCommand';
import { Rich } from '../format';

const html = `
  <h4 class="panel-title">字符</h4>
  <div class="line ff">
    <select class="ff">
      <option value="arial">Arial</option>
    </select>
    <span class="multi">多种字体</span>
  </div>
  <div class="line wc">
    <div class="weight">
      <select class="w"></select>
      <span class="multi">多种字重</span>
    </div>
    <div class="color">
      <span class="picker"><b style="">○○○</b></span>
    </div>
  </div>
  <div class="line num">
    <div class="fs">
      <input type="number" min="0" step="1"/>
      <span>字号</span>
    </div>
    <div class="ls">
      <input type="number" step="1"/>
      <span>字距</span>
    </div>
    <div class="lh">
      <input type="number" min="0" step="1"/>
      <span>行高</span>
    </div>
    <div class="ps">
      <input type="number" step="1"/>
      <span>段落</span>
    </div>
  </div>
  <div class="line wh">
    <div>
      <span class="auto" title="自动宽度"></span>
      <span class="fw" title="自动高度"></span>
      <span class="fwh" title="固定尺寸"></span>
    </div>
    <span class="txt"></span>
  </div>
  <div class="line al">
    <span class="left" title="水平左对齐"></span>
    <span class="center" title="水平居中对齐"></span>
    <span class="right" title="水平右对齐"></span>
    <span class="justify" title="水平两端对齐"></span>
  </div> 
  <div class="line va">
    <span class="top" title="垂直上对齐"></span>
    <span class="middle" title="垂直居中对齐"></span>
    <span class="bottom" title="垂直下对齐"></span>
  </div> 
`;

let local = false;
loadLocalFonts().then(res => {
  local = true;
  style.font.registerLocalFonts(res);
}).catch(() => {
  local = true;
});

class TextPanel extends Panel {
  panel: HTMLElement;
  local = false;
  nodes: Text[];

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    super(root, dom, listener);
    this.nodes = [];

    const panel = this.panel = document.createElement('div');
    panel.className = 'text-panel';
    panel.style.display = 'none';
    panel.innerHTML = html;
    this.dom.appendChild(panel);

    let nodes: Text[] = [];
    let prevs: Rich[][] = [];
    let nexts: Rich[][] = [];

    // 选择颜色会刷新但不产生步骤，关闭颜色面板后才callback产生
    const pickCallback = () => {
      // 只有变更才会有next
      if (nexts && nexts.length) {
        listener.history.addCommand(new UpdateRichCommand(nodes, prevs.map((prev, i) => {
          return { prev, next: nexts[i] };
        }), UpdateRichCommand.COLOR));
        listener.emit(Listener.COLOR_NODE, nodes.slice(0));
      }
      nodes = [];
      prevs = [];
      nexts = [];
    };

    panel.addEventListener('click', (e) => {
      this.silence = true;
      const el = e.target as HTMLElement;
      if (el.tagName === 'B') {
        // picker侦听了document全局click隐藏窗口，这里停止向上冒泡
        e.stopPropagation();
        picker.hide();
        if (picker.isShowFrom('textPanel')) {
          pickCallback();
          this.silence = false;
          return;
        }
        const p = picker.show(el, 'textPanel', pickCallback, true);
        // 最开始记录nodes/prevs
        nodes = this.nodes.slice(0);
        prevs = nodes.map(item => item.getRich());
        // 每次变更记录更新nexts
        p.onChange = (color: any) => {
          nexts = [];
          nodes.forEach(node => {
            const o = {
              location: 0,
              length: node._content.length,
              color: color.rgba.slice(0),
            };
            node.updateRichStyle(o);
            nexts.push(node.getRich());
          });
        };
        p.onDone = () => {
          picker.hide();
          pickCallback();
        };
      }
      // 尺寸固定模式
      else if ((el.classList.contains('auto') || el.classList.contains('fw') || el.classList.contains('fwh'))
        && !el.classList.contains('cur')) {
        pickCallback();
        nodes = this.nodes.slice(0);
        let behaviour = TEXT_BEHAVIOUR.AUTO;
        if (el.classList.contains('fw')) {
          behaviour = TEXT_BEHAVIOUR.FIXED_W;
        }
        else if (el.classList.contains('fwh')) {
          behaviour = TEXT_BEHAVIOUR.FIXED_W_H;
        }
        const data = nodes.map(item => updateBehaviour(item, behaviour));
        listener.history.addCommand(new ResizeCommand(nodes.slice(0), data));
        listener.select.updateSelect(nodes);
        listener.emit(Listener.RESIZE_NODE, nodes.slice(0));
      }
      // 左右对齐
      else if ((el.classList.contains('left') || el.classList.contains('right') || el.classList.contains('center') || el.classList.contains('justify'))
        && !el.classList.contains('cur')) {
        pickCallback();
        const nodes = this.nodes.slice(0);
        let value = TEXT_ALIGN.LEFT;
        if (el.classList.contains('right')) {
          value = TEXT_ALIGN.RIGHT;
        }
        else if (el.classList.contains('center')) {
          value = TEXT_ALIGN.CENTER;
        }
        else if (el.classList.contains('justify')) {
          value = TEXT_ALIGN.JUSTIFY;
        }
        // 编辑状态下特殊处理
        if (nodes.length === 1 && listener.state === State.EDIT_TEXT) {
        }
        // 普通状态
        else {
          const data: ModifyRichData[] = [];
          nodes.forEach(node => {
            const prev = node.getRich();
            node.updateRichStyle({
              location: 0,
              length: node._content.length,
              textAlign: value,
            });
            data.push({ prev, next: node.getRich() });
          });
          listener.history.addCommand(new UpdateRichCommand(nodes, data, UpdateRichCommand.TEXT_ALIGN));
          listener.emit(Listener.TEXT_ALIGN_NODE, nodes.slice(0));
        }
        dom.querySelector('.al .cur')?.classList.remove('cur');
        el.classList.add('cur');
      }
      // 上下对齐
      else if ((el.classList.contains('top') || el.classList.contains('bottom') || el.classList.contains('middle'))
        && !el.classList.contains('cur')) {
        pickCallback();
        const nodes = this.nodes.slice(0);
        let value: 'top' | 'middle' | 'bottom' = 'top';
        if (el.classList.contains('middle')) {
          value = 'middle';
        }
        else if (el.classList.contains('bottom')) {
          value = 'bottom';
        }
        const data: VerticalAlignData[] = [];
        nodes.forEach(node => {
          const tva = node.computedStyle.textVerticalAlign;
          let prev: 'top' | 'middle' | 'bottom' = 'top';
          if (tva === TEXT_VERTICAL_ALIGN.MIDDLE) {
            prev = 'middle';
          }
          else if (tva === TEXT_VERTICAL_ALIGN.BOTTOM) {
            prev = 'bottom';
          }
          node.updateStyle({
            textVerticalAlign: value,
          });
          data.push({
            prev: { textVerticalAlign: prev },
            next: { textVerticalAlign: value },
          });
        });
        listener.history.addCommand(new VerticalAlignCommand(nodes, data));
        listener.emit(Listener.TEXT_VERTICAL_ALIGN_NODE, nodes.slice(0));
        dom.querySelector('.va .cur')?.classList.remove('cur');
        el.classList.add('cur');
      }
      this.silence = false;
    });

    let key: 'fontSize' | 'letterSpacing' | 'lineHeight' | 'paragraphSpacing';
    panel.addEventListener('input', (e) => {
      const el = e.target as HTMLElement;
      const tagName = el.tagName.toUpperCase();
      // Select也会触发忽略
      if (tagName !== 'INPUT') {
        return;
      }
      pickCallback();
      this.silence = true;
      // 连续多次只有首次记录节点和prev值，但每次都更新next值
      const isFirst = !nodes.length;
      if (isFirst) {
        prevs = [];
      }
      nexts = [];
      const input = e.target as HTMLInputElement;
      const parent = input.parentElement!;
      let value = parseFloat(input.value);
      if (parent.classList.contains('fs')) {
        key = 'fontSize';
      }
      else if (parent.classList.contains('ls')) {
        key = 'letterSpacing';
      }
      else if (parent.classList.contains('lh')) {
        key = 'lineHeight';
      }
      else if (parent.classList.contains('paragraphSpacing')) {
        key = 'paragraphSpacing';
      }
      const isInput = e instanceof InputEvent; // 上下键还是真正输入
      this.nodes.forEach((node, i) => {
        if (isFirst) {
          nodes.push(node);
          prevs.push(node.getRich());
        }
        // 多个值的情况
        if (!isInput) {
          let d = 0;
          if (input.placeholder) {
            d = value > 0 ? 1 : -1;
            if (listener.shiftKey) {
              d *= 10;
            }
          }
          else {
            d = value - prevs[0][0][key];
            if (listener.shiftKey) {
              d *= 10;
            }
          }
          node.rich.forEach((rich) => {
            const p = rich[key];
            let n = p + d;
            if (key === 'fontSize' || key === 'lineHeight') {
              n = Math.max(0, n);
            }
            node.updateRichStyle({
              location: rich.location,
              length: rich.length,
              [key]: n,
            });
          });
        }
        // 单个值比较简单
        else {
          node.updateRichStyle({
            location: 0,
            length: node._content.length,
            [key]: value,
          });
        }
        nexts.push(node.getRich());
      });
      if (nodes.length) {
        listener.select.updateSelect(nodes);
        if (key === 'fontSize') {
          listener.emit(Listener.FONT_SIZE_NODE, nodes.slice(0));
        }
        else if (key === 'letterSpacing') {
          listener.emit(Listener.LETTER_SPACING_NODE, nodes.slice(0));
        }
        else if (key === 'paragraphSpacing') {
          listener.emit(Listener.PARAGRAPH_SPACING_NODE, nodes.slice(0));
        }
        else if (key === 'lineHeight') {
          listener.emit(Listener.LINE_HEIGHT_NODE, nodes.slice(0));
        }
        this.show(this.nodes);
      }
      this.silence = false;
    });

    // 字体和字重是Select会触发，字号等Input也会触发，需要区分
    panel.addEventListener('change', (e) => {
      this.silence = true;
      const el = e.target as (HTMLSelectElement | HTMLInputElement);
      const tagName = el.tagName.toUpperCase();
      const classList = el.classList;
      if (tagName === 'SELECT') {
        const value = el.value;
        const nodes = this.nodes.slice(0);
        // 字体
        if (classList.contains('ff')) {
          const { fontWeight, fontWeightList } = getWeight([value]);
          const select = panel.querySelector('.wc select') as HTMLSelectElement;
          let s = '';
          fontWeightList.forEach(item => {
            s += `<option value="${item.value}">${item.label}</option>`;
          });
          select.innerHTML = s;
          // 暂时切换后统一Regular
          const list = select.querySelectorAll('option');
          for (let i = 0, len = list.length; i < len; i++) {
            const option = list[i];
            if (option.innerHTML === fontWeight[0]) {
              option.selected = true;
              break;
            }
          }
          let ff = select.value;
          const data: ModifyRichData[] = [];
          nodes.forEach(node => {
            const prev = node.getRich();
            node.updateRichStyle({
              location: 0,
              length: node._content.length,
              fontFamily: ff,
            });
            data.push({ prev, next: node.getRich() });
          });
          listener.history.addCommand(new UpdateRichCommand(nodes, data, UpdateRichCommand.FONT_FAMILY));
          listener.select.updateSelect(nodes);
          listener.emit(Listener.FONT_FAMILY_NODE, nodes.slice(0));
        }
        // 字重
        else if (classList.contains('w')) {
          const data: ModifyRichData[] = [];
          nodes.forEach(node => {
            const prev = node.getRich();
            node.updateRichStyle({
              location: 0,
              length: node._content.length,
              fontFamily: value,
            });
            data.push({ prev, next: node.getRich() });
          });
          listener.history.addCommand(new UpdateRichCommand(nodes, data, UpdateRichCommand.FONT_FAMILY));
          listener.select.updateSelect(nodes);
          listener.emit(Listener.FONT_FAMILY_NODE, nodes.slice(0));
        }
      }
      else if (tagName === 'INPUT') {
        if (nodes.length) {
          let type = '';
          if (key == 'fontSize') {
            type = UpdateRichCommand.FONT_SIZE;
          }
          else if (key === 'letterSpacing') {
            type = UpdateRichCommand.LETTER_SPACING;
          }
          else if (key === 'lineHeight') {
            type = UpdateRichCommand.LINE_HEIGHT;
          }
          else if (key === 'paragraphSpacing') {
            type = UpdateRichCommand.PARAGRAPH_SPACING;
          }
          listener.history.addCommand(new UpdateRichCommand(nodes, prevs.map((prev, i) => {
            return { prev, next: nexts[i] };
          }), type));
          nodes = [];
          prevs = [];
          nexts = [];
          this.show(this.nodes);
        }
      }
      this.silence = false;
    });

    listener.on([
      Listener.SELECT_NODE,
      Listener.RESIZE_NODE,
      Listener.FONT_SIZE_NODE,
      Listener.FONT_FAMILY_NODE,
      Listener.LETTER_SPACING_NODE,
      Listener.LINE_HEIGHT_NODE,
      Listener.PARAGRAPH_SPACING_NODE,
      Listener.COLOR_NODE,
      Listener.TEXT_ALIGN_NODE,
      Listener.TEXT_VERTICAL_ALIGN_NODE,
    ], (nodes: Node[]) => {
      // 输入的时候，防止重复触发；选择/undo/redo的时候则更新显示
      if (this.silence) {
        return;
      }
      this.show(nodes);
    });
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
    this.nodes = texts;
    const o = getData(texts);
    {
      const select = panel.querySelector('.ff select') as HTMLSelectElement;
      // 移除上次可能遗留的无效字体展示
      const invalid = select.querySelector(':disabled') as HTMLOptionElement;
      if (invalid) {
        invalid.remove();
      }
      const multi = panel.querySelector('.ff .multi') as HTMLElement;
      const list = select.querySelectorAll('option');
      if (o.fontFamily.length > 1) {
        multi.style.display = 'block';
        for (let i = 0, len = list.length; i < len; i++) {
          const option = list[i];
          if (option.selected) {
            option.selected = false;
            break;
          }
        }
        const option = `<option value="" selected="selected" disabled>多种字体</option>`;
        select.innerHTML += option;
      }
      else {
        multi.style.display = 'none';
        const { data } = style.font;
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
      const color = panel.querySelector('.color b') as HTMLElement;
      if (o.color.length > 1) {
        color.style.background = '#FFF';
        color.style.textIndent = '0px';
      }
      else {
        color.style.background = o.color[0];
        color.style.textIndent = '9999px';
      }
    }
    {
      const input = panel.querySelector('.fs input') as HTMLInputElement;
      if (o.fontSize.length > 1) {
        input.value = '';
        input.placeholder = '多个';
      }
      else {
        input.value = toPrecision(o.fontSize[0], 0).toString();
        input.placeholder = '';
      }
    }
    {
      const input = panel.querySelector('.ls input') as HTMLInputElement;
      if (o.letterSpacing.length > 1) {
        input.value = '';
        input.placeholder = '多个';
      }
      else {
        input.value = toPrecision(o.letterSpacing[0], 0).toString();
        input.placeholder = '';
      }
    }
    {
      const input = panel.querySelector('.lh input') as HTMLInputElement;
      if (o.lineHeight.length > 1) {
        input.value = '';
        input.placeholder = '多个';
      }
      else {
        if (o.autoLineHeight[0]) {
          input.value = '';
          input.placeholder = toPrecision(o.lineHeight[0], 0).toString();
        }
        else {
          input.value = toPrecision(o.lineHeight[0], 0).toString();
          input.placeholder = '';
        }
      }
    }
    {
      const input = panel.querySelector('.ps input') as HTMLInputElement;
      if (o.paragraphSpacing.length > 1) {
        input.value = '';
        input.placeholder = '多个';
      }
      else {
        input.value = o.paragraphSpacing[0].toString();
        input.placeholder = '';
      }
    }
    {
      const span = panel.querySelector('.wh .cur') as HTMLElement;
      if (span) {
        span.classList.remove('cur');
      }
      const txt = panel.querySelector('.wh .txt') as HTMLSpanElement;
      if (o.textBehaviour.length === 1) {
        const tb = o.textBehaviour[0];
        if (tb === TEXT_BEHAVIOUR.AUTO) {
          panel.querySelector('.wh .auto')!.classList.add('cur');
          txt.innerHTML = '自动宽度';
        }
        else if (tb === TEXT_BEHAVIOUR.FIXED_W) {
          panel.querySelector('.wh .fw')!.classList.add('cur');
          txt.innerHTML = '自动高度';
        }
        else if (tb === TEXT_BEHAVIOUR.FIXED_W_H) {
          panel.querySelector('.wh .fwh')!.classList.add('cur');
          txt.innerHTML = '固定尺寸';
        }
      }
      else {
        txt.innerHTML = '多种';
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
    {
      const span = panel.querySelector('.va .cur') as HTMLElement;
      if (span) {
        span.classList.remove('cur');
      }
      if (o.textVerticalAlign.length === 1) {
        const tva = o.textVerticalAlign[0];
        if (tva === TEXT_VERTICAL_ALIGN.TOP) {
          panel.querySelector('.va .top')!.classList.add('cur');
        }
        else if (tva === TEXT_VERTICAL_ALIGN.MIDDLE) {
          panel.querySelector('.va .middle')!.classList.add('cur');
        }
        else if (tva === TEXT_VERTICAL_ALIGN.BOTTOM) {
          panel.querySelector('.va .bottom')!.classList.add('cur');
        }
      }
    }
  }
}

export default TextPanel;
