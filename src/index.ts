import { TAG_NAME, JFile, JSymbolMaster } from './format';
import { openAndConvertSketchBuffer, convertSketch, openAndConvertSketchZip } from './format/sketch';
import refresh from './refresh';
import style from './style';
import math from './math';
import util from './util';
import config from './util/config';
import animation from './animation';
import node from './node';
import { parse, sortSymbolMasters } from './node/parse';
import SymbolMaster from './node/SymbolMaster';
import tools from './tools';
import control from './control';
import { version } from '../package.json';

export default {
  version,
  parse(json: JFile, canvas: HTMLCanvasElement, dpi = 1) {
    const { width, height } = canvas;
    const root = new node.Root({
      dpi,
      uuid: json.document.uuid,
      assets: json.document.assets,
      layerStyles: json.document.layerStyles,
      layerTextStyles: json.document.layerTextStyles,
      style: {
        width,
        height,
      },
    });
    root.appendTo(canvas);

    // symbolMaster优先初始化，其存在于控件页面的直接子节点，以及外部json，先收集起来
    const smList: JSymbolMaster[] = [];
    (json.pages || []).forEach((item) => {
      const children = item.children;
      children.forEach((child) => {
        if (child.tagName === TAG_NAME.SYMBOL_MASTER) {
          smList.push(child as JSymbolMaster);
        }
      });
    });
    // 外部symbolMaster，sketch中是不展示出来的，masterGo专门有个外部控件页面
    (json.symbolMasters || []).forEach((child) => {
      smList.push(child as JSymbolMaster);
    });
    // 收集完所有的之后，进行排序，因为可能出现互相递归依赖，无依赖的在前面先初始化，避免被引用时没初始化不存在
    const list = sortSymbolMasters(smList);
    list.forEach(item => {
      root.symbolMasters[item.props.symbolId] = parse(item, root) as SymbolMaster;
    });

    root.setJPages(json.pages || []);
    return root;
  },
  openAndConvertSketchBuffer,
  openAndConvertSketchZip,
  convertSketch,
  node,
  refresh,
  style,
  math,
  util,
  animation,
  tools,
  config,
  control,
};
