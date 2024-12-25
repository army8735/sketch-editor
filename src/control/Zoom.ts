import Root from '../node/Root';
import Listener from './Listener';
import { toPrecision } from '../math';

class Zoom {
  root: Root;
  dom: HTMLElement;
  listener: Listener;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;
    const select = document.createElement('select');
    select.innerHTML = `
      <option value="" disabled="disabled">请选择</option>
      <option value="up">放大</option>
      <option value="down">缩小</option>
      <option value="actual">实际尺寸</option>
      <option value="fit">适应画布</option>
    `;
    select.selectedIndex = -1;
    dom.appendChild(select);

    const div = document.createElement('div');
    div.innerText = toPrecision(root.getCurPageZoom(true) * 100, 0).toString() + '%';
    dom.appendChild(div);

    select.addEventListener('change', (e) => {
      if (select.value === 'up') {
        listener.zoom(2);
      }
      else if (select.value === 'down') {
        listener.zoom(0.5);
      }
      else if (select.value === 'actual') {
        listener.zoomActual();
      }
      else if (select.value === 'fit') {
        listener.zoomFit();
      }
      select.value = '';
    });

    listener.on(Listener.ZOOM_PAGE, (zoom: number) => {
      div.innerText = toPrecision(zoom * 100, 0).toString() + '%';
    });
  }
}

export default Zoom;
