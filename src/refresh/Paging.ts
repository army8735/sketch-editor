import { createTexture } from '../gl/webgl';
import config from '../refresh/config';

let uuid = 0;

const HASH: any = {};

class Paging {
  uuid: number;
  size: number;
  num: number;
  grid: Uint8ClampedArray;
  pointer: number;
  texture: WebGLTexture;
  activeUnit: number = -1; // 纹理是否绑定并激活纹理单元通道，-1为没有绑定激活
  constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, size: number) {
    this.uuid = uuid++;
    this.size = size;
    this.num = Math.round(size / config.SMALL_UNIT);
    this.pointer = 0;
    this.grid = new Uint8ClampedArray(this.num * this.num);
    this.texture = createTexture(gl, 0, undefined, size, size);
  }

  hasFreePos(total: number): boolean {
    return this.pointer <= this.grid.length - total;
  }

  getFreePos(total: number): number {
    if (!this.hasFreePos(total)) {
      throw new Error('Insufficient paging memory');
    }
    const res = this.pointer;
    this.pointer += total;
    return res;
  }

  getPosCoords(pos: number): { x: number, y: number } {
    return {
      x: pos % this.num * config.SMALL_UNIT,
      y: Math.floor(pos / this.num) * config.SMALL_UNIT,
    };
  }

  static getInstance(gl: WebGL2RenderingContext | WebGLRenderingContext,
                     rootId: number, total: number): Paging {
    const key = rootId + ',';
    const list = HASH[key] = HASH[key] || [];
    for(let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      if (item.hasFreePos(total)) {
        return item;
      }
    }
    const paging = new Paging(gl, config.MAX_TEXTURE_SIZE);
    list.push(paging);
    return paging;
  }
}

export default Paging;
