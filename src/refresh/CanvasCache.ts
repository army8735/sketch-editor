import inject, { OffScreen } from '../util/inject';
import config from '../util/config';

const HASH: Record<string, { value: CanvasCache, count: number }> = {};

class CanvasCache {
  available: boolean;
  // offscreen: OffScreen;
  dx: number; // 离屏都是0, 0开始，和原始对象x, y有个偏移值
  dy: number;
  w: number; // 实际显示对象尺寸
  h: number;
  list: {
    x: number;
    y: number;
    w: number;
    h: number;
    os: OffScreen;
  }[];

  constructor(w: number, h: number, dx: number = 0, dy: number = 0) {
    this.available = false;
    // this.offscreen = inject.getOffscreenCanvas(w, h);
    this.w = w;
    this.h = h;
    this.dx = dx;
    this.dy = dy;
    this.list = [];
    const UNIT = config.MAX_TEXTURE_SIZE;
    for (let i = 0, len = Math.ceil(h / UNIT); i < len; i++) {
      for (let j = 0, len2 = Math.ceil(w / UNIT); j < len2; j++) {
        const width = j === len2 - 1 ? (w - j * UNIT) : UNIT;
        const height = i === len - 1 ? (h - i * UNIT) : UNIT;
        this.list.push({
          x: j * UNIT,
          y: i * UNIT,
          w: width,
          h: height,
          os: inject.getOffscreenCanvas(width, height),
        });
      }
    }
  }

  release() {
    if (!this.available) {
      return;
    }
    this.available = false;
    // this.offscreen.release();
    this.list.splice(0).forEach(item => item.os.release());
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
      // this.offscreen.release();
      this.list.splice(0).forEach(item => item.os.release());
    }
  }

  getCount(url: string) {
    return HASH[url]?.count;
  }

  static getInstance(w: number, h: number, dx: number = 0, dy: number = 0): CanvasCache {
    return new CanvasCache(w, h, dx, dy);
  }

  static getImgInstance(w: number, h: number, url: string) {
    if (HASH.hasOwnProperty(url)) {
      const o = HASH[url];
      o.count++;
      return o.value;
    }
    const o = new CanvasCache(w, h, 0, 0);
    HASH[url] = {
      value: o,
      count: 1,
    };
    return o;
  }
}

export default CanvasCache;
