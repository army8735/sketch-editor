import { TagName, JFile, JSymbolMaster } from './format';
import { openAndConvertSketchBuffer, convertSketch } from './format/sketch';
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

function apply(json: any, imgs: Array<string>): any {
  if (!json) {
    return;
  }
  if (Array.isArray(json)) {
    for (let i = 0, len = json.length; i < len; i++) {
      apply(json[i], imgs);
    }
    return;
  }
  const { tagName, props = {}, children = [] } = json;
  if (tagName === TagName.Bitmap) {
    const src = props.src;
    if (util.type.isNumber(src)) {
      props.src = imgs[src];
    }
  }
  const fill = props.style.fill;
  if (fill) {
    for (let i = 0, len = fill.length; i < len; i++) {
      const item = fill[i];
      if (/^url\(\d+\)/.test(item)) {
        fill[i] = item.replace(/^url\((\d+)\)/, function ($0: string, $1: string) {
          return 'url(' + imgs[parseInt($1)] + ')';
        });
      }
    }
  }
  if (children.length) {
    apply(children, imgs);
  }
}

export default {
  parse(json: JFile, canvas: HTMLCanvasElement, dpi = 1) {
    // json中的imgs下标替换
    apply(json.pages, json.imgs);

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
    json.pages.forEach(item => {
      const children = item.children;
      children.forEach(child => {
        if (child.tagName === TagName.SymbolMaster) {
          root.symbolMasters[(child as JSymbolMaster).props.symbolId] = Page.parse(child, root) as SymbolMaster;
        }
      });
    });
    // 外部symbolMaster，sketch中是不展示出来的，masterGo专门有个外部控件页面
    json.symbolMasters.forEach(child => {
      root.symbolMasters[(child as JSymbolMaster).props.symbolId] = Page.parse(child, root) as SymbolMaster;
    });

    root.setJPages(json.pages);
    return root;
  },
  openAndConvertSketchBuffer,
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
