import CanvasCache from '../refresh/CanvasCache';

const HASH: any = {};

// @ts-ignore
class ImgCanvasCache extends CanvasCache {
  url: string;
  constructor(w: number, h: number, dx: number, dy: number, url: string) {
    super(w, h, dx, dy);
    this.url = url;
  }

  release() {
    const o = HASH[this.url];
    o.count--;
    if (!o.count) {
      super.release();
      delete HASH[this.url];
    }
  }

  get count(): number {
    return HASH[this.url].count;
  }

  static getInstance(w: number, h: number, dx: number, dy: number, url: string): ImgCanvasCache {
    if (HASH.hasOwnProperty(url)) {
      const o = HASH[url];
      o.count++;
      return o.value;
    }
    const o = new ImgCanvasCache(w, h, dx, dy, url);
    HASH[url] = {
      value: o,
      count: 1,
    };
    return o;
  }
}

export default ImgCanvasCache;
