import { TAG_NAME, JFile, JSymbolMaster } from './format';
import { openAndConvertSketchBuffer, convertSketch, openAndConvertSketchZip } from './format/sketch';
import refresh from './refresh';
import style from './style';
import math from './math';
import util from './util';
import config from './util/config';
import animation from './animation';
import node from './node';
import Page from './node/Page';
import SymbolMaster from './node/SymbolMaster';
import tools from './tools';

export default {
  parse(json: JFile, canvas: HTMLCanvasElement, dpi = 1) {
    const { width, height } = canvas;
    const root = new node.Root({
      dpi,
      style: {
        width,
        height,
      },
    });
    root.appendTo(canvas);

    // symbolMaster优先初始化，其存在于控件页面的直接子节点，后续控件页面初始化的时候，遇到记得取缓存
    (json.pages || []).forEach(item => {
      const children = item.children;
      children.forEach(child => {
        if (child.tagName === TAG_NAME.SYMBOL_MASTER) {
          root.symbolMasters[(child as JSymbolMaster).props.symbolId] = Page.parse(child, root) as SymbolMaster;
        }
      });
    });
    // 外部symbolMaster，sketch中是不展示出来的，masterGo专门有个外部控件页面
    (json.symbolMasters || []).forEach(child => {
      root.symbolMasters[(child as JSymbolMaster).props.symbolId] = Page.parse(child, root) as SymbolMaster;
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
};
