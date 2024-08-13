let manual = false;

export default {
  debug: false,
  offscreenCanvas: false,
  tile: false,
  deltaTime: 8,
  maxTextureSize: 8192,
  get MAX_TEXTURE_SIZE() {
    return this.maxTextureSize;
  },
  set MAX_TEXTURE_SIZE(v: number) {
    this.maxTextureSize = v;
    manual = true;
  },
  MAX_TEXTURE_UNITS: 8,
  MAX_VARYING_VECTORS: 15,
  init(maxSize: number, maxUnits: number, maxVectors: number) {
    if (!manual) {
      this.maxTextureSize = maxSize;
    }
    // 手动事先设置了超限的尺寸需缩小
    else if (maxSize < this.maxTextureSize) {
      this.maxTextureSize = maxSize;
    }
    this.MAX_TEXTURE_UNITS = maxUnits;
    this.MAX_VARYING_VECTORS = maxVectors;
  },
  treeLvPadding: 10,
};
