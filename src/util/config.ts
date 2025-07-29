import inject from './inject';

let max = 2048;
let manual = false;
let MAX_TEXTURE_SIZE = max;
let hasInit = false;

export default {
  debug: false,
  offscreenCanvas: false,
  tile: false, // 是否开启tile优化
  deltaTime: 8, // 跨帧渲染，单帧渲染过程超过值时停止在下一帧继续
  get maxTextureSize() { // 系统纹理块尺寸限制记录，手动优先级>自动，默认2048自动不能超过
    return max;
  },
  set maxTextureSize(v: number) {
    if (hasInit) {
      max = Math.min(v, MAX_TEXTURE_SIZE);
    }
    else {
      max = v;
    }
    manual = true;
  },
  get MAX_TEXTURE_SIZE() {
    return MAX_TEXTURE_SIZE;
  },
  set MAX_TEXTURE_SIZE(v: number) {
    inject.warn('Deprecated, MAX_TEXTURE_SIZE -> maxTextureSize');
    this.maxTextureSize = v;
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
    hasInit = true;
    MAX_TEXTURE_SIZE = maxSize;
    this.MAX_TEXTURE_UNITS = maxUnits;
    this.MAX_VARYING_VECTORS = maxVectors;
  },
  treeLvPadding: 16, // 节点tree列表每级缩进px
  historyTime: 1000, // 添加历史记录时命令之间是否合并的时间差阈值
  guidesSnap: 8, // 参考线吸附阈值，2条参考线之间至少距离阈值
};
