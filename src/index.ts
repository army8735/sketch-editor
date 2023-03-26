import { JFile, getDefaultStyle } from './format';
import { isNumber } from './util/type';
import Root from './node/Root';

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
    if (isNumber(src)) {
      props.src = imgs[src];
    }
  }
  if (children.length) {
    json.children = apply(children, imgs);
  }
  return json;
}

export function parse(json: JFile, canvas: HTMLCanvasElement) {
  // json中的imgs下标替换
  json.pages = apply(json.pages, json.imgs);
  const { width, height } = canvas;
  const root = new Root(canvas, {
    style: getDefaultStyle({
      width,
      height,
    }),
  });
  root.setJPages(json.pages);
  root.setPageIndex(0);
}
