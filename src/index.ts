import { TagName, JFile } from './format';
import { openAndConvertSketchBuffer, convertSketch } from './format/sketch';
import refresh from './refresh';
import style from './style';
import math from './math';
import util from './util';
import config from './util/config';
import animation from './animation';
import node from './node';

function apply(json: any, imgs: Array<string>): any {
  if (!json) {
    return;
  }
  if (Array.isArray(json)) {
    return json.map(item => apply(item, imgs));
  }
  const { tagName, props = {}, children = [] } = json;
  if (tagName === TagName.Bitmap) {
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
    const root = new node.Root({
      dpi,
      style: {
        width,
        height,
      },
    });
    root.appendTo(canvas);
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
  config,
};
