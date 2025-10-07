import { createTexture } from '../gl/webgl';
import CanvasCache from './CanvasCache';

export type SubTexture = {
  bbox: Float64Array;
  w: number;
  h: number;
  t?: WebGLTexture;
  tc?: { x1: number, y1: number, x3: number, y3: number },
};

const HASH: Record<string, Record<string, {
  value: {
    x: number;
    y: number;
    w: number;
    h: number;
    t?: WebGLTexture;
  }[],
  w: number, h: number, count: number,
}>> = {};

class TextureCache {
  gl: WebGL2RenderingContext | WebGLRenderingContext;
  available: boolean;
  bbox: Float64Array;
  list: SubTexture[];

  constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, bbox: Float64Array, cache?: CanvasCache) {
    this.gl = gl;
    this.bbox = bbox.slice(0);
    const maxX = bbox[2], maxY = bbox[3];
    this.list = [];
    // 从已有节点来的内容
    if (cache) {
      this.available = true;
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
      this.available = false;
    }
  }

  release() {
    if (!this.available) {
      return false;
    }
    this.available = false;
    this.list.splice(0).forEach(item => {
      if (item.t) {
        this.gl.deleteTexture(item.t);
      }
    });
    return true;
  }

  releaseImg(id: string, url: string) {
    if (!this.available) {
      return false;
    }
    this.available = false;
    const o = HASH[id];
    const item = o[url];
    if (!item) {
      return false;
    }
    item.count--;
    if (!item.count) {
      // 此时无引用计数可清空且释放texture
      delete o[url];
      this.list.splice(0).forEach(item => {
        if (item.t) {
          this.gl.deleteTexture(item.t);
        }
      });
    }
    return true;
  }

  static getInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, cache: CanvasCache, bbox: Float64Array) {
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
              item.x * r1, // 允许小数，只有图片有小数
              item.y * r2,
              Math.min(maxX, (item.x + item.w) * r1), // 精度问题保底，防止最后一个超过
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
    if (!cache) {
      throw new Error('Missing content');
    }
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
    return res;
  }

  static getEmptyInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, bbox: Float64Array) {
    return new TextureCache(gl, bbox);
  }
}

export default TextureCache;
