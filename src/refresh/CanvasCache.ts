import inject, { OffScreen } from '../util/inject';

const HASH: any = {};

class CanvasCache {
  available: boolean;
  offscreen: OffScreen;
  dx: number; // 离屏都是0, 0开始，和原始对象x, y有个偏移值
  dy: number;
  w: number; // 实际显示对象尺寸
  h: number;
  constructor(w: number, h: number, dx: number, dy: number) {
    this.available = false;
    this.offscreen = inject.getOffscreenCanvas(w, h);
    this.w = w;
    this.h = h;
    this.dx = dx;
    this.dy = dy;
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

  static getInstance(w: number, h: number, dx: number, dy: number): CanvasCache {
    return new CanvasCache(w, h, dx, dy);
  }

  static getImgInstance(w: number, h: number, dx: number, dy: number, url: string) {
    if (HASH.hasOwnProperty(url)) {
      const o = HASH[url];
      o.count++;
      return o.value;
    }
    const o = new CanvasCache(w, h, dx, dy);
    HASH[url] = {
      value: o,
      count: 1,
    };
    return o;
  }
}

export default CanvasCache;
