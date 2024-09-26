import Node from '../node/Node';
import Group from '../node/Group';
import Listener from './Listener';

let canvasDiv: HTMLElement;

const htmlCanvas = `
  <div class="item group">编组选择对象</div>
  <div class="item un-group">解除编组</div>
  <div class="item select-all">选择全部</div>
  <div class="split"></div>
  <div class="item scale-up">放大</div>
  <div class="item scale-down">缩小</div>
`;

export default {
  showCanvas(x: number, y: number, listener: Listener) {
    if (!canvasDiv) {
      canvasDiv = document.createElement('div');
      canvasDiv.innerHTML = htmlCanvas;
      document.body.appendChild(canvasDiv);
      // 点击自动关闭
      document.addEventListener('click', (e) => {
        this.hide();
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
    canvasDiv.style.left = x + 'px';
    canvasDiv.style.top = y + 'px';
    canvasDiv.style.display = 'block';
  },
  hide() {
    if (canvasDiv && canvasDiv.style.display === 'block') {
      canvasDiv.style.display = 'none';
    }
  },
};
