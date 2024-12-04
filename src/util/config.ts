let max = 2048;

export default {
  debug: false,
  offscreenCanvas: false,
  tile: false, // 是否开启tile优化
  deltaTime: 8, // 跨帧渲染，单帧渲染过程超过值时停止在下一帧继续
  maxTextureSize: max, // 纹理块尺寸限制
  get MAX_TEXTURE_SIZE() {
    return this.maxTextureSize;
  },
  set MAX_TEXTURE_SIZE(v: number) {
    this.maxTextureSize = Math.min(max, v);
  },
  MAX_TEXTURE_UNITS: 8,
  MAX_VARYING_VECTORS: 15,
  init(maxSize: number, maxUnits: number, maxVectors: number) {
    this.maxTextureSize = Math.min(max, maxSize);
    max = maxSize;
    this.MAX_TEXTURE_UNITS = maxUnits;
    this.MAX_VARYING_VECTORS = maxVectors;
  },
  treeLvPadding: 16, // 节点tree列表每级缩进px
  historyTime: 1000, // 添加历史记录时命令之间是否合并的时间差阈值
  guidesSnap: 8, // 参考线吸附阈值，2条参考线之间至少距离阈值
};
