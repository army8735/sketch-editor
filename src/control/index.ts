import Root from '../node/Root';
import Listener, { ListenerOptions } from './Listener';
import Tree from './Tree';
import Select from './Select';
import Input from './Input';

/**
 * 所有控制相关的都在这里，传入渲染根节点，和容器DOM，需要DOM是absolute/relative，
 * 会在DOM下生成各种辅助展示DOM
 */
export function initCanvasControl(root: Root, dom: HTMLElement, options?: ListenerOptions) {
  return new Listener(root, dom, options);
}

export function initTreeList(root: Root, dom: HTMLElement, listener: Listener) {
  return new Tree(root, dom, listener);
}

export default {
  initCanvasControl,
  initTreeList,
  Listener,
  Tree,
  Select,
  Input,
};
