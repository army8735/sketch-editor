import Node from '../node/Node';
import Group from '../node/Group';
import Listener from './Listener';

let canvasDiv: HTMLElement;

const htmlCanvas = `
  <div class="item group">编组选择对象</div>
  <div class="item un-group">解除编组</div>
  <div class="item select-all">选择全部</div>
  <div class="split split1"></div>
  <div class="item mask"><span>✅</span>用作蒙版</div>
  <div class="item break-mask"><span>✅</span>忽略底层蒙版</div>
  <div class="split split2"></div>
  <div class="item scale-up">放大</div>
  <div class="item scale-down">缩小</div>
`;

export default {
  showCanvas(x: number, y: number, listener: Listener) {
    if (!canvasDiv) {
      canvasDiv = document.createElement('div');
      canvasDiv.innerHTML = htmlCanvas;
      document.body.appendChild(canvasDiv);
      // 点击自动关闭，外部或者子项都可，但点自身不关闭，因为有padding或者不可点击的项视为点自己
      document.addEventListener('click', (e) => {
        if (e.target !== canvasDiv) {
          this.hide();
        }
      });
      canvasDiv.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const classList = target.classList;
        if (classList.contains('group')) {
          listener.group();
        }
        else if (classList.contains('un-group')) {
          listener.unGroup();
        }
        else if (classList.contains('select-all')) {
          listener.selectAll();
        }
        else if (classList.contains('scale-up') || classList.contains('scale-down')) {
          listener.scale(classList.contains('scale-up'));
        }
        else if (classList.contains('mask')) {
          if (canvasDiv.classList.contains('msk')) {
            listener.unMask();
          }
          else {
            listener.mask();
          }
        }
        else if (classList.contains('break-mask')) {
          if (canvasDiv.classList.contains('brk-msk')) {
            listener.unBreakMask();
          }
          else {
            listener.breakMask();
          }
        }
      });
    }
    canvasDiv.className = 'sketch-editor-context-menu';
    const classList = canvasDiv.classList;
    const nodes = listener.selected;
    if (nodes.length > 1) {
      classList.add('multi');
    }
    else if (nodes.length === 1) {
      const node = nodes[0];
      if (node instanceof Group) {
        classList.add('single-group');
      }
      else {
        classList.add('single');
      }
    }
    else {
      classList.add('empty');
    }
    let hasMask = nodes.filter(item => item.computedStyle.maskMode);
    if (hasMask.length) {
      if (hasMask.length === nodes.length) {
        classList.add('msk');
      }
      else {
        classList.add('msk-conflict');
      }
    }
    let hasBreakMask = nodes.filter(item => item.computedStyle.breakMask);
    if (hasBreakMask.length) {
      if (hasBreakMask.length === nodes.length) {
        classList.add('brk-msk');
      }
      else {
        classList.add('brk-msk-conflict');
      }
    }
    canvasDiv.style.left = x + 'px';
    canvasDiv.style.top = y + 'px';
    canvasDiv.style.display = 'block';
  },
  showTree(x: number, y: number, listener: Listener) {
    this.showCanvas(x, y, listener);
  },
  hide() {
    if (canvasDiv && canvasDiv.style.display === 'block') {
      canvasDiv.style.display = 'none';
    }
  },
};
