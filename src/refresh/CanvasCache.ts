import inject, { OffScreen } from '../util/inject';

const HASH: any = {};

class CanvasCache {
  available: boolean;
  offscreen: OffScreen;
  w: number; // 实际显示对象尺寸
  h: number;
  constructor(w: number, h: number) {
    this.available = false;
    this.offscreen = inject.getOffscreenCanvas(w, h);
    this.w = w;
    this.h = h;
  }

  release() {
    if (!this.available) {
      return;
    }
    this.available = false;
    this.offscreen.release();
  }

  releaseImg(url: string) {
    if (!this.available) {
      return;
    }
    this.available = false;
    const o = HASH[url];
    o.count--;
    if (!o.count) {
      // 此时无引用计数可清空且释放离屏canvas
      delete HASH[url];
      this.offscreen.release();
    }
  }

  getCount(url: string) {
    return HASH[url]?.count;
  }

  static getInstance(w: number, h: number): CanvasCache {
    return new CanvasCache(w, h);
  }

  static getImgInstance(w: number, h: number, url: string) {
    if (HASH.hasOwnProperty(url)) {
      const o = HASH[url];
      o.count++;
      return o.value;
    }
    const o = new CanvasCache(w, h);
    HASH[url] = {
      value: o,
      count: 1,
    };
    return o;
  }
}

export default CanvasCache;
