import Root from '../node/Root';
import Listener from './Listener';

export type Controller = {
  destroy: () => void;
};

/**
 * 所有控制相关的都在这里，传入渲染根节点，和容器DOM，需要DOM是absolute/relative，
 * 会在DOM下生成各种辅助展示DOM
 */
export function initCanvasControl(root: Root, dom: HTMLElement) {
  return new Listener(root, dom);
  // const status = new Status();
  // const select = new Select(root, dom, status);
  // const list: Listener[] = [
  //   select,
  // ];
  // function mousedown(e: MouseEvent) {
  //   for (let i = 0, len = list.length; i < len; i++) {
  //     if (list[i].onMouseDown(e)) {
  //       break;
  //     }
  //   }
  // }
  // function mousemove(e: MouseEvent) {
  //   for (let i = 0, len = list.length; i < len; i++) {
  //     if (list[i].onMouseMove(e)) {
  //       break;
  //     }
  //   }
  // }
  // function mouseup() {
  //   for (let i = 0, len = list.length; i < len; i++) {
  //     if (list[i].onMouseUp()) {
  //       break;
  //     }
  //   }
  // }
  // function click(e: MouseEvent) {
  //   for (let i = 0, len = list.length; i < len; i++) {
  //     if (list[i].onClick(e)) {
  //       break;
  //     }
  //   }
  // }
  // dom.addEventListener('mousedown', mousedown);
  // dom.addEventListener('mousemove', mousemove);
  // dom.addEventListener('mouseup', mouseup);
  // dom.addEventListener('click', click);
  // return {
  //   destroy() {
  //     dom.removeEventListener('mousedown', mousedown);
  //     dom.removeEventListener('mousemove', mousemove);
  //     dom.removeEventListener('mouseup', mouseup);
  //     dom.removeEventListener('click', click);
  //   },
  // } as Controller;
}
