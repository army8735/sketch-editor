import { TagName, JFile } from './format';
import { openAndConvertSketchBuffer, convertSketch } from './format/sketch';
import refresh from './refresh';
import style from './style';
import math from './math';
import util from './util';
import config from './util/config';
import animation from './animation';
import node from './node';
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
