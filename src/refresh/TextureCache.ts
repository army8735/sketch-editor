import { createTexture } from '../gl/webgl';
import CanvasCache from './CanvasCache';

const HASH: Record<string, Record<string, {
  value: {
    x: number;
    y: number;
    w: number;
    h: number;
    t: WebGLTexture;
  }[],
  w: number, h: number, count: number,
}>> = {};

class TextureCache {
  gl: WebGL2RenderingContext | WebGLRenderingContext;
  available: boolean;
  bbox: Float64Array;
  list: {
    bbox: Float64Array;
    w: number;
    h: number;
    t: WebGLTexture;
    tc?: { x1: number, y1: number, x3: number, y3: number },
  }[];

  constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, bbox: Float64Array, cache?: CanvasCache) {
    this.gl = gl;
    this.available = true;
    this.bbox = bbox.slice(0);
    const maxX = bbox[2], maxY = bbox[3];
    this.list = [];
    // 从已有节点来的内容
    if (cache) {
      const { list, w, h } = cache;
      const len = list.length;
      // 一般单个bbox就是总的bbox拆分开来1:1，但纯图片存在复用原始尺寸的因素要计算
      const w2 = bbox[2] - bbox[0];
      const h2 = bbox[3] - bbox[1];
      const r1 = w2 / w;
      const r2 = h2 / h;
      for (let i = 0; i < len; i++) {
        const item = list[i];
        const t = createTexture(gl, 0, item.os.canvas);
        this.list.push({
          bbox: new Float64Array([
            item.x * r1, // 允许小数
            item.y * r2,
            Math.min(maxX, (item.x + item.w) * r1), // 精度问题保底
            Math.min(maxY, (item.y + item.h) * r2),
          ]),
          w: item.w,
          h: item.h,
          t,
        });
      }
    }
    // merge汇总产生的新空白内容外部自行控制，另外复用位图的自己控制
    else {
    }
  }

  release() {
    if (!this.available) {
      return;
    }
    this.available = false;
    // this.gl.deleteTexture(this.texture);
    this.list.splice(0).forEach(item => this.gl.deleteTexture(item.t));
  }

  releaseImg(id: string, url: string) {
    if (!this.available) {
      return;
    }
    this.available = false;
    const o = HASH[id];
    const item = o[url];
    if (!item) {
      return;
    }
    item.count--;
    if (!item.count) {
      // 此时无引用计数可清空且释放texture
      delete o[url];
      // this.gl.deleteTexture(this.texture);
      this.list.splice(0).forEach(item => this.gl.deleteTexture(item.t));
    }
  }

  static getInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, cache: CanvasCache, bbox: Float64Array) {
    // const texture = createTexture(gl, 0, canvas);
    return new TextureCache(gl, bbox, cache);
  }

  static hasImgInstance(id: string, url: string) {
    if (HASH.hasOwnProperty(id)) {
      const o = HASH[id];
      if (o.hasOwnProperty(url)) {
        return true;
      }
    }
    return false;
  }

  static getImgInstance(id: string, gl: WebGL2RenderingContext | WebGLRenderingContext, url: string, bbox: Float64Array, cache?: CanvasCache) {
    if (HASH.hasOwnProperty(id)) {
      const o = HASH[id];
      if (o.hasOwnProperty(url)) {
        const item = o[url];
        item.count++;
        const res = new TextureCache(gl, bbox);
        const w2 = bbox[2] - bbox[0];
        const h2 = bbox[3] - bbox[1];
        const r1 = w2 / item.w;
        const r2 = h2 / item.h;
        const maxX = bbox[2], maxY = bbox[3];
        const value = item.value;
        const len = value.length;
        // 复用第一张留下的原始信息计算
        for (let i = 0; i < len; i++) {
          const item = value[i];
          res.list.push({
            bbox: new Float64Array([
              item.x * r1, // 允许小数
              item.y * r2,
              Math.min(maxX, (item.x + item.w) * r1), // 精度问题保底
              Math.min(maxY, (item.y + item.h) * r2),
            ]),
            w: item.w,
            h: item.h,
            t: item.t,
          });
        }
        return res;
      }
    }
    // const texture = createTexture(gl, 0, canvas!);
    const item = HASH[id] = HASH[id] || {};
    const res = new TextureCache(gl, bbox, cache!);
    // 第一张图记录下原始位图的尺寸等信息供后续复用计算
    item[url] = {
      value: res.list.map((item, i) => {
        return {
          x: cache!.list[i].x,
          y: cache!.list[i].y,
          w: item.w,
          h: item.h,
          t: item.t,
        };
      }),
      w: cache!.w,
      h: cache!.h,
      count: 1,
    };
    return new TextureCache(gl, bbox, cache!);
  }

  static getEmptyInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, bbox: Float64Array) {
    // const texture = createTexture(gl, 0, undefined, (bbox[2] - bbox[0]) * scale, (bbox[3] - bbox[1]) * scale);
    // const dx = bbox[0] * scale, dy = bbox[1] * scale;
    // const w = bbox[2] * scale - dx, h = bbox[3] * scale - dy;
    // const cache = CanvasCache.getInstance(w, h, dx, dy);
    return new TextureCache(gl, bbox);
  }
}

export default TextureCache;
