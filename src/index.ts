import * as uuid from 'uuid';
import format, { TAG_NAME, JFile, JSymbolMaster, JLayer, JStyle } from './format';
import { openAndConvertSketchBuffer, openAndConvertSketchZip, convertSketch } from './format/sketch';
import { openAndConvertPsdBuffer } from './format/psd';
import refresh from './refresh';
import style from './style';
import math from './math';
import util from './util';
import config from './util/config';
import animation from './animation';
import node from './node';
import { parse, sortSymbolMasters } from './node/parser';
import SymbolMaster from './node/SymbolMaster';
import tool from './tool';
import control from './control';
import history from './history';
import { version } from '../package.json';
import gl from './gl';

export default {
  version,
  parse(json: JFile | JLayer, options: {
    width?: number,
    height?: number,
    dpi?: number,
    canvas?: HTMLCanvasElement,
    contextAttributes?: any,
  } = {}) {
    json = json as JFile;
    let { width = 0, height = 0, dpi = 1, canvas } = options;
    const style: Pick<JStyle, 'width' | 'height'> = { width, height };
    if (!width || width < 1) {
      style.width = 'auto';
    }
    if (!height || height < 1) {
      style.height = 'auto';
    }
    const root = new node.Root({
      dpi,
      uuid: json.document?.uuid || uuid.v4(),
      index: 0,
      assets: json.document?.assets,
      layerStyles: json.document?.layerStyles,
      layerTextStyles: json.document?.layerTextStyles,
      style,
      contextAttributes: Object.assign({}, gl.ca, options.contextAttributes),
    });
    if (canvas) {
      root.appendTo(canvas);
    }

    // symbolMaster优先初始化，其存在于控件页面的直接子节点，以及外部json，先收集起来
    const smList: JSymbolMaster[] = [];
    // 外部symbolMaster，sketch中是不展示出来的，masterGo专门有个外部控件页面
    (json.symbolMasters || []).forEach((child) => {
      smList.push(child as JSymbolMaster);
    });
    // 内部页面上的
    (json.pages || []).forEach((item) => {
      const children = item.children;
      children.forEach((child) => {
        if (child.tagName === TAG_NAME.SYMBOL_MASTER) {
          smList.push(child as JSymbolMaster);
        }
      });
    });
    // 收集完所有的之后，进行排序，因为可能出现互相递归依赖，无依赖的在前面先初始化，避免被引用时没初始化不存在
    const list = sortSymbolMasters(smList);
    list.forEach(item => {
      root.symbolMasters[item.props.symbolId] = parse(item, root) as SymbolMaster;
    });

    root.setJPages(json.pages || []);
    root.setPageIndex(json.currentPageIndex || 0);
    return root;
  },
  openAndConvertSketchBuffer,
  openAndConvertSketchZip,
  convertSketch,
  openAndConvertPsdBuffer,
  node,
  refresh,
  style,
  math,
  util,
  animation,
  tool,
  get tools() {
    util.inject.warn('Deprecated, tools -> tool');
    return tool;
  },
  config,
  control,
  history,
  gl,
  format,
};
