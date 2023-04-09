import { JFile } from './format';
import { openAndConvertSketchBuffer } from './format/sketch';
import refresh from './refresh';
import style from './style';
import math from './math';
import util from './util';
import animation from './animation';
import node from './node';
import { version } from '../package.json';

function apply(json: any, imgs: Array<string>): any {
  if (!json) {
    return;
  }
  if (Array.isArray(json)) {
    return json.map(item => apply(item, imgs));
  }
  const { type, props = {}, children = [] } = json;
  if (type === 'Bitmap') {
    const src = props.src;
    if (util.type.isNumber(src)) {
      props.src = imgs[src];
    }
  }
  if (children.length) {
    json.children = apply(children, imgs);
  }
  return json;
}

export default {
  parse(json: JFile, canvas: HTMLCanvasElement, dpi = 1) {
    // json中的imgs下标替换
    json.pages = apply(json.pages, json.imgs);
    const { width, height } = canvas;
    const root = new node.Root(canvas, {
      dpi,
      style: {
        width,
        height,
      },
    });
    root.setJPages(json.pages);
    // root.setPageIndex(0);
    return root;
  },
  openAndConvertSketchBuffer,
  node,
  refresh,
  style,
  math,
  util,
  animation,
  version,
};
