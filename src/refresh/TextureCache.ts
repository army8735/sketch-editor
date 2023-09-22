import { createTexture } from '../gl/webgl';

const HASH: any = {};

class TextureCache {
  gl: WebGL2RenderingContext | WebGLRenderingContext;
  available: boolean;
  texture:  WebGLTexture;
  bbox: Float64Array;

  constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, texture: WebGLTexture, bbox: Float64Array) {
    this.gl = gl;
    this.available = true;
    this.texture = texture;
    this.bbox = bbox;
  }

  release() {
    if (!this.available) {
      return;
    }
    this.available = false;
    this.gl.deleteTexture(this.texture);
  }

  releaseImg(id: string, url: string) {
    if (!this.available) {
      return;
    }
    this.available = false;
    const o = HASH[id];
    const item = o[url];
    item.count--;
    if (!item.count) {
      // 此时无引用计数可清空且释放texture
      delete o[url];
      this.gl.deleteTexture(this.texture);
    }
  }

  static getInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, canvas: HTMLCanvasElement, bbox: Float64Array) {
    const texture = createTexture(gl, 0, canvas);
    return new TextureCache(gl, texture, bbox);
  }

  static getImgInstance(id: string, gl: WebGL2RenderingContext | WebGLRenderingContext, canvas: HTMLCanvasElement, url: string, bbox: Float64Array) {
    if (HASH.hasOwnProperty(id)) {
      const o = HASH[id];
      if (o.hasOwnProperty(url)) {
        const item = o[url];
        item.count++;
        return new TextureCache(gl, item.value, bbox);
      }
    }
    const texture = createTexture(gl, 0, canvas);
    const item = HASH[id] = HASH[id] || {};
    item[url] = {
      value: texture,
      count: 1,
    };
    return new TextureCache(gl, texture, bbox);
  }

  static getEmptyInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, bbox: Float64Array, scale = 1) {
    const texture = createTexture(gl, 0, undefined, (bbox[2] - bbox[0]) * scale, (bbox[3] - bbox[1]) * scale);
    return new TextureCache(gl, texture, bbox);
  }

  static getTextureInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, texture: WebGLTexture, bbox: Float64Array) {
    return new TextureCache(gl, texture, bbox);
  }
}

export default TextureCache;
