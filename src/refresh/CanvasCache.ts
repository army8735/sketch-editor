import inject, { OffScreen } from '../util/inject';

class CanvasCache {
  offscreen: OffScreen;
  dx: number; // 离屏都是0, 0开始，和原始对象x, y有个偏移值
  dy: number;
  w: number; // 实际显示对象尺寸
  h: number;
  constructor(w: number, h: number, dx: number, dy: number) {
    this.offscreen = inject.getOffscreenCanvas(w, h);
    this.w = w;
    this.h = h;
    this.dx = dx;
    this.dy = dy;
  }

  release() {
    this.offscreen.release();
  }

  static getInstance(w: number, h: number, dx: number, dy: number): CanvasCache {
    return new CanvasCache(w, h, dx, dy);
  }
}

export default CanvasCache;
