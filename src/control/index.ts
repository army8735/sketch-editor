import Root from '../node/Root';
import Listener, { ListenerOptions } from './Listener';
import Tree from './Tree';
import Select from './Select';
import Input from './Input';
import Panel from './Panel';
import BasicPanel from './BasicPanel';
import OpacityPanel from './OpacityPanel';
import RoundPanel from './RoundPanel';
import PointPanel from './PointPanel';
import FillPanel from './FillPanel';
import StrokePanel from './StrokePanel';
import TextPanel from './TextPanel';
import AlignPanel from './AlignPanel';
import PageList from './PageList';
import ShadowPanel from './ShadowPanel';
import BlurPanel from './BlurPanel';
import ColorAdjustPanel from './ColorAdjustPanel';
import Zoom from './Zoom';
import picker from './picker';
import contextMenu from './contextMenu';
import Guides from './Guides';
import Toolbar from './Toolbar';
import state from './state';
import { PanelOptions } from './opts';

export function initPageList(root: Root, dom: HTMLElement, listener: Listener) {
  return new PageList(root, dom, listener);
}

/**
 * 所有控制相关的都在这里，传入渲染根节点，和容器DOM，需要DOM是absolute/relative，
 * 会在DOM下生成各种辅助展示DOM
 */
export function initCanvasControl(root: Root, dom: HTMLElement, options?: ListenerOptions) {
  return new Listener(root, dom, options);
}

export function initTree(root: Root, dom: HTMLElement, listener: Listener) {
  return new Tree(root, dom, listener);
}

export function initPanel(root: Root, dom: HTMLElement, listener: Listener, opts?: PanelOptions) {
  const alignPanel = new AlignPanel(root, dom, listener);
  alignPanel.show(listener.selected);

  const basicPanel = new BasicPanel(root, dom, listener);
  basicPanel.show(listener.selected);

  const opacityPanel = new OpacityPanel(root, dom, listener);
  opacityPanel.show(listener.selected);

  // const roundPanel = new RoundPanel(root, dom, listener);
  // roundPanel.show(listener.selected);

  const pointPanel = new PointPanel(root, dom, listener);
  pointPanel.show(listener.selected);

  const fillPanel = new FillPanel(root, dom, listener);
  fillPanel.show(listener.selected);

  const strokePanel = new StrokePanel(root, dom, listener);
  strokePanel.show(listener.selected);

  const textPanel = new TextPanel(root, dom, listener, opts);
  textPanel.show(listener.selected);

  const shadowPanel = new ShadowPanel(root, dom, listener);
  shadowPanel.show(listener.selected);

  const blurPanel = new BlurPanel(root, dom, listener);
  blurPanel.show(listener.selected);

  const colorAdjustPanel = new ColorAdjustPanel(root, dom, listener);
  colorAdjustPanel.show(listener.selected);

  return {
    alignPanel,
    basicPanel,
    opacityPanel,
    // roundPanel,
    fillPanel,
    strokePanel,
    textPanel,
    shadowPanel,
    blurPanel,
    colorAdjustPanel,
  };
}

export function initZoom(root: Root, dom: HTMLElement, listener: Listener) {
  return new Zoom(root, dom, listener);
}

export function initToolbar(root: Root, dom: HTMLElement, listener: Listener) {
  return new Toolbar(root, dom, listener);
}

export default {
  initCanvasControl,
  initPageList,
  initTree,
  initPanel,
  initZoom,
  initToolbar,
  Listener,
  PageList,
  Tree,
  Select,
  Input,
  Panel,
  BasicPanel,
  OpacityPanel,
  // RoundPanel,
  PointPanel,
  FillPanel,
  StrokePanel,
  TextPanel,
  ShadowPanel,
  BlurPanel,
  AlignPanel,
  ColorAdjustPanel,
  Zoom,
  picker,
  contextMenu,
  Guides,
  state,
};
