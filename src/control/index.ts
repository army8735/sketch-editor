import Root from '../node/Root';
import Listener from './Listener';
import Tree from './Tree';

/**
 * 所有控制相关的都在这里，传入渲染根节点，和容器DOM，需要DOM是absolute/relative，
 * 会在DOM下生成各种辅助展示DOM
 */
export function initCanvasControl(root: Root, dom: HTMLElement) {
  return new Listener(root, dom);
}

export function initTreeList(root: Root, dom: HTMLElement) {
  return new Tree(root, dom);
}
