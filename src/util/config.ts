export default {
  debug: false,
  offscreenCanvas: false,
  tile: false,
  canvasSize: 2048,
  MAX_TEXTURE_SIZE: 2048,
  MAX_TEXTURE_UNITS: 8,
  MAX_VARYING_VECTORS: 15,
  init(maxSize: number, maxUnits: number, maxVectors: number) {
    this.MAX_TEXTURE_SIZE = maxSize;
    this.MAX_TEXTURE_UNITS = maxUnits;
    this.MAX_VARYING_VECTORS = maxVectors;
    this.canvasSize = Math.min(this.canvasSize, maxSize);
  },
};
