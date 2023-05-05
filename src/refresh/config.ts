const config: any = {
  MAX_TEXTURE_SIZE: 2048,
  SMALL_UNIT: 32,
  MAX_NUM: Math.pow(2048 / 32, 2),
  MAX_TEXTURE_UNITS: 8,
  MAX_VARYING_VECTORS: 15,
  init(maxSize: number, maxUnits: number, maxVectors: number) {
    this.MAX_TEXTURE_SIZE = maxSize;
    this.MAX_NUM = Math.pow(maxSize / this.SMALL_UNIT, 2);
    this.MAX_TEXTURE_UNITS = maxUnits;
    this.MAX_VARYING_VECTORS = maxVectors;
  },
};

export default config;
