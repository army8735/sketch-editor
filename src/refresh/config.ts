const config: any = {
  MAX_TEXTURE_SIZE: 2048,
  SMALL_UNIT: 32,
  MAX_NUM: Math.pow(2048 / 32, 2),
  MAX_TEXTURE_UNITS: 8,
  init(maxSize: number, maxUnits: number) {
    this.MAX_TEXTURE_SIZE = maxSize;
    this.MAX_NUM = Math.pow(maxSize / this.SMALL_UNIT, 2);
    this.MAX_TEXTURE_UNITS = maxUnits;
  },
};

export default config;
