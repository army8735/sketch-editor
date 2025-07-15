let max = 2048;
let manual = false;

export default {
  debug: false,
  offscreenCanvas: false,
  tile: false, // 是否开启tile优化
  deltaTime: 8, // 跨帧渲染，单帧渲染过程超过值时停止在下一帧继续
  maxTextureSize: max, // 系统纹理块尺寸限制记录，root用下面的大写
  get MAX_TEXTURE_SIZE() {
    return max;
  },
  set MAX_TEXTURE_SIZE(v: number) {
    max = v;
    manual = true;
  },
  MAX_TEXTURE_UNITS: 8,
  MAX_VARYING_VECTORS: 15,
  // 初始化root的时候才会调用
  init(maxSize: number, maxUnits: number, maxVectors: number) {
    if (!manual) {
      max = Math.min(max, maxSize);
    }
    // 手动事先设置了超限的尺寸需缩小
    else if (maxSize < max) {
      max = maxSize;
    }
    this.maxTextureSize = maxSize;
    this.MAX_TEXTURE_UNITS = maxUnits;
    this.MAX_VARYING_VECTORS = maxVectors;
  },
  treeLvPadding: 16, // 节点tree列表每级缩进px
  historyTime: 1000, // 添加历史记录时命令之间是否合并的时间差阈值
  guidesSnap: 8, // 参考线吸附阈值，2条参考线之间至少距离阈值
};
