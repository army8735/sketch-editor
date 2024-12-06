import { color2rgbaStr, getCssFillStroke } from '../style/css';
import { ComputedGradient, ComputedPattern, GRADIENT } from '../style/define';
import { convert2Css } from '../style/gradient';
import Listener from './Listener';
import State from './State';

let div: HTMLElement;
const html = `
<span class="arrow">
  <b></b>
</span>
<ul class="type">
  <li class="color" title="纯色"></li>
  <li class="linear" title="线性渐变"></li>
  <li class="radial" title="径向渐变"></li>
  <li class="conic" title="圆锥渐变"></li>
</ul>
<div class="line">
  <div class="bg"></div>
  <div class="con"></div>
</div>
`;

let picker: any;
let openFrom: string | undefined;
let callback: (() => void) | undefined; // 多个panel共用一个picker，新的点开老的还没关闭需要自动执行save，留个hook

let tempColor: number[] | undefined; // 编辑切换类别时，保存下可以切回去不丢失
let tempGradient: ComputedGradient | undefined;

let index = 0;

export default {
  keep: false,
  show(
    el: HTMLElement,
    data: number[] | ComputedGradient | ComputedPattern,
    from: string,
    onInput: (data: number[] | ComputedGradient | ComputedPattern, fromGradient?: boolean, changeType?: boolean) => void,
    cb: () => void,
    listener: Listener,
  ) {
    // 强制渐变stops顺序排列初始化
    // if (!Array.isArray(data) && (data as ComputedGradient).stops) {
    //   (data as ComputedGradient).stops.sort((a, b) => a.offset - b.offset);
    // }
    openFrom = from;
    // 已经显示了，之前遗留的回调直接先执行
    if (callback) {
      callback();
      callback = undefined;
    }
    callback = cb;
    // 可能发生切换，记录切换前的
    if (Array.isArray(data)) {
      tempColor = data;
    }
    else if ((data as ComputedGradient).stops) {
      tempGradient = data as ComputedGradient;
    }
    const rect = el.getBoundingClientRect();
    // 初次初始化dom
    const isInit = !div;
    if (isInit) {
      div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div);
    }
    const type = div.querySelector('.type') as HTMLElement;
    type.querySelector('.cur')?.classList.remove('cur');
    const line = div.querySelector('.line') as HTMLElement;
    // 防止切换的inline最高优先级变不了
    line.removeAttribute('style');
    const bg = line.querySelector('.bg') as HTMLElement;
    const con = line.querySelector('.con') as HTMLElement;
    // 事件侦听
    if (isInit) {
      type.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.tagName.toUpperCase() !== 'LI') {
          return;
        }
        const classList = target.classList;
        if (classList.contains('cur')) {
          return;
        }
        type.querySelector('.cur')!.classList.remove('cur');
        classList.add('cur');
        if (classList.contains('color')) {
          line.style.display = 'none';
          let c = [0, 0, 0, 1];
          if (tempColor) {
            c = tempColor.slice(0);
          }
          else if ((data as ComputedGradient).stops) {
            c = (data as ComputedGradient).stops[0].color;
            onInput(c, false, true);
          }
          else {
            onInput(c, false, true);
          }
          picker.setColor(c, true);
        }
        else {
          line.style.display = 'block';
          if (classList.contains('linear')) {
            if (tempGradient) {
              // 取中心点映射对角线
              if (tempGradient.t === GRADIENT.RADIAL || tempGradient.t === GRADIENT.CONIC) {
                const dx = tempGradient.d[2] - tempGradient.d[0];
                const dy = tempGradient.d[3] - tempGradient.d[1];
                tempGradient.d[0] -= dx;
                tempGradient.d[1] -= dy;
              }
              tempGradient.t = GRADIENT.LINEAR;
            }
            else {
              tempGradient = {
                t: GRADIENT.LINEAR,
                d: [0, 0.5, 1, 0.5],
                stops: [
                  {
                    color: tempColor ? tempColor.slice(0) : [0, 0, 0, 1],
                    offset: 0,
                  },
                  {
                    color: tempColor ? tempColor.slice(0) : [255, 255, 255, 1],
                    offset: 1,
                  },
                ],
              };
            }
          }
          else if (classList.contains('radial')) {
            if (tempGradient) {
              // 取中心点
              if (tempGradient.t === GRADIENT.LINEAR) {
                const dx = tempGradient.d[2] - tempGradient.d[0];
                const dy = tempGradient.d[3] - tempGradient.d[1];
                tempGradient.d[0] += dx * 0.5;
                tempGradient.d[1] += dy * 0.5;
              }
              else if (tempGradient.t === GRADIENT.CONIC) {
                if (!tempGradient.d.length) {
                  tempGradient.d.push(0.5, 0.5, 1, 1);
                }
              }
              tempGradient.t = GRADIENT.RADIAL;
            }
            else {
              tempGradient = {
                t: GRADIENT.RADIAL,
                d: [0.5, 0.5, 1, 1],
                stops: [
                  {
                    color: tempColor ? tempColor.slice(0) : [0, 0, 0, 1],
                    offset: 0,
                  },
                  {
                    color: tempColor ? tempColor.slice(0) : [255, 255, 255, 1],
                    offset: 1,
                  },
                ],
              };
            }
          }
          else if (classList.contains('conic')) {
            if (tempGradient) {
              // 取中心点
              if (tempGradient.t === GRADIENT.LINEAR) {
                const dx = tempGradient.d[2] - tempGradient.d[0];
                const dy = tempGradient.d[3] - tempGradient.d[1];
                tempGradient.d[0] += dx * 0.5;
                tempGradient.d[1] += dy * 0.5;
              }
              tempGradient.t = GRADIENT.CONIC;
            }
            else {
              tempGradient = {
                t: GRADIENT.CONIC,
                d: [],
                stops: [
                  {
                    color: tempColor ? tempColor.slice(0) : [0, 0, 0, 1],
                    offset: 0,
                  },
                  {
                    color: tempColor ? tempColor.slice(0) : [255, 255, 255, 1],
                    offset: 1,
                  },
                ],
              };
            }
          }
          // 肯定有
          if (tempGradient) {
            onInput(tempGradient, false, true);
          }
        }
      });
      // 拖拽渐变
      let w = bg.clientWidth;
      let isDrag = false;
      let startX = 0;
      let initX = 0;
      let cur = con.querySelector('.cur') as HTMLElement;
      con.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const tagName = target.tagName.toUpperCase();
        w = bg.clientWidth;
        // 已有的stop的offset
        if (tagName === 'SPAN') {
          con.querySelector('.cur')!.classList.remove('cur');
          cur = target;
          cur.classList.add('cur');
          index = parseInt(cur.title);
          isDrag = true;
          startX = e.pageX;
          initX = parseFloat(cur.style.left) * 0.01;
          picker.setColor((data as ComputedGradient).stops[index].color, true);
          listener.gradient.setCur(index);
        }
        // 新增一个
        else if (tagName === 'DIV') {
          con.querySelector('.cur')!.classList.remove('cur');
          const p = e.offsetX / w;
          const span = document.createElement('span');
          span.style.left = p * 100 + '%';
          const list = con.querySelectorAll('.con span');
          con.appendChild(span);
          const o = {
            color: [0, 0, 0, 0],
            offset: p,
          };
          for (let i = 0, len = list.length; i < len; i++) {
            const exist = list[i] as HTMLElement;
            const x = parseFloat(exist.style.left) * 0.01;
            if (x >= p) {
              if (!i) {
                o.color = (data as ComputedGradient).stops[i].color.slice(0);
              }
              else {
                const prev = (data as ComputedGradient).stops[i - 1].color;
                const next = (data as ComputedGradient).stops[i].color;
                const l = parseFloat((list[i - 1] as HTMLElement).style.left) * 0.01;
                const d = x - l;
                const p2 = (p - l) / d;
                o.color = [
                  prev[0] + (next[0] - prev[0]) * p2,
                  prev[1] + (next[1] - prev[1]) * p2,
                  prev[2] + (next[2] - prev[2]) * p2,
                  (prev[3] ?? 1) + ((next[3] ?? 1) - (prev[3] ?? 1)) * p2,
                ];
              }
              index = i;
              break;
            }
            else if (i === len - 1) {
              o.color = (data as ComputedGradient).stops[i].color.slice(0);
              index = len;
            }
          }
          // 后面的index++
          for (let i = index, len = list.length; i < len; i++) {
            (list[i] as HTMLElement).title = (index + 1).toString();
          }
          span.title = index.toString();
          (data as ComputedGradient).stops.splice(index, 0, o);
          cur = span;
          cur.classList.add('cur');
          isDrag = true;
          startX = e.pageX;
          initX = parseFloat(cur.style.left) * 0.01;
          picker.setColor(o.color, true);
          listener.gradient.setCur(index);
          onInput(data);
        }
      });
      // 拖拽渐变节点和颜色区域特殊处理，让最外层侦听识别取消隐藏
      div.addEventListener('mousedown', () => {
        this.keep = true;
        if (listener.state === State.EDIT_GRADIENT) {
          listener.gradient.keep = true;
        }
      });
      document.addEventListener('mousemove', (e) => {
        if (isDrag) {
          e.preventDefault();
          const diff = e.pageX - startX;
          const p = Math.min(1, Math.max(0, initX + diff / w));
          (data as ComputedGradient).stops[index].offset = p;
          cur.style.left = p * 100 + '%';
          bg.style.background = getCssFillStroke(data, bg.clientWidth, bg.clientHeight, true).replace(/\([^,]*,/, '(to right,');
          onInput(data);
        }
      });
      // 点击外部自动关闭，拖拽过程除外，利用冒泡顺序，为防止拖拽乱序重新设置
      document.addEventListener('click', (e) => {
        if (isDrag) {
          (data as ComputedGradient).stops.sort((a, b) => a.offset - b.offset);
          div.querySelectorAll('.line .con span').forEach((item, i) => {
            (item as HTMLElement).title = i.toString();
          });
          isDrag = false;
        }
        if (this.keep) {
          this.keep = false;
          return;
        }
        this.hide();
        if (listener.state === State.EDIT_GRADIENT) {
          listener.state = State.NORMAL;
          listener.select.showSelectNotUpdate();
        }
      });
    }
    div.className = 'sketch-editor-picker';
    div.classList.add(from);
    div.style.left = rect.left + (rect.right - rect.left) * 0.5 + 'px';
    div.style.top = rect.bottom + 10 + 'px';
    div.style.display = 'block';
    if (!picker) {
      // @ts-ignore
      picker = new window.Picker({
        parent: div,
        popup: false,
      });
      picker.onDone = () => {
        this.hide();
        if (listener.state === State.EDIT_GRADIENT) {
          listener.state = State.NORMAL;
          listener.select.showSelectNotUpdate();
        }
      };
      picker.onChange = (color: any) => {
        const cur = type.querySelector('.cur') as HTMLElement;
        const classList = cur.classList;
        if (classList.contains('color')) {
          onInput(color.rgba);
        }
        else {
          (data as ComputedGradient).stops[index].color = color.rgba;
          bg.style.background = getCssFillStroke(data, bg.clientWidth, bg.clientHeight, true).replace(/\([^,]*,/, '(to right,');
          onInput(data);
        }
      };
    }
    if (Array.isArray(data)) {
      const c = color2rgbaStr(data);
      picker.setColor(c, true);
      type.querySelector('.color')?.classList.add('cur');
      line.style.display = 'none';
    }
    else {
      if ((data as ComputedPattern).url !== undefined) {
        data = data as ComputedPattern;
        line.style.display = 'none';
      }
      else {
        data = data as ComputedGradient;
        picker.setColor(color2rgbaStr(data.stops[0].color), true);
        this.updateLineBg(data);
        line.style.display = 'block';
        initStops(data, line); // 初始0
        picker.setColor(color2rgbaStr(data.stops[0].color), true);
        if (data.t === GRADIENT.LINEAR) {
          type.querySelector('.linear')?.classList.add('cur');
        }
        else if (data.t === GRADIENT.RADIAL) {
          type.querySelector('.radial')?.classList.add('cur');
        }
        else if (data.t === GRADIENT.CONIC) {
          type.querySelector('.conic')?.classList.add('cur');
        }
      }
    }
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
  setLineCur(i: number) {
    if (div) {
      div.querySelector('.line .con .cur')?.classList.remove('cur');
      div.querySelector(`.line .con span[title="${i}"]`)?.classList.add('cur');
      index = i;
    }
  },
  addLineItem(i: number, offset: number) {
    if (div) {
      const con = div.querySelector('.line .con') as HTMLElement;
      const span = document.createElement('span');
      span.title = i.toString();
      span.style.left = offset * 100 + '%';
      const spans = con.querySelectorAll('span');
      for (let j = 0, len = spans.length; j < len; j++) {
        const item = spans[j];
        const idx = parseInt(item.title);
        if (i <= idx) {
          con.insertBefore(span, item);
          for (let k = j; k < len; k++) {
            const item = spans[k];
            item.title = (parseInt(item.title) + 1).toString();
          }
          break;
        }
        else if (j === len - 1) {
          con.appendChild(span);
        }
      }
      index = i;
    }
  },
  updateLinePos(i: number, offset: number, data: ComputedGradient) {
    if (div) {
      (div.querySelector(`.line .con span[title="${i}"]`) as HTMLElement).style.left = offset * 100 + '%';
      this.updateLineBg(data);
    }
  },
  updateLineBg(data: ComputedGradient) {
    if (div) {
      const t = Object.assign({}, data);
      t.t = GRADIENT.LINEAR;
      const bg = div.querySelector('.line .bg') as HTMLElement;
      // bg条恒定linear-gradient且向右
      bg.style.background = convert2Css(t, bg.clientWidth, bg.clientHeight, true).replace(/\([^,]*,/, '(to right,');
    }
  },
};

function initStops(data: ComputedGradient, line: HTMLElement) {
  const con = line.querySelector('.con') as HTMLElement;
  con.innerHTML = '';
  const fragment = document.createDocumentFragment();
  data.stops.forEach((item, i) => {
    const span = document.createElement('span');
    if (!i) {
      span.classList.add('cur');
    }
    span.style.left = item.offset * 100 + '%';
    span.title = i.toString();
    fragment.appendChild(span);
  });
  con.appendChild(fragment);
}
