import { createTexture } from '../gl/webgl';

const HASH: any = {};

class TextureCache {
  gl: WebGL2RenderingContext | WebGLRenderingContext;
  available: boolean;
  texture:  WebGLTexture;

  constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, texture: WebGLTexture) {
    this.gl = gl;
    this.available = true;
    this.texture = texture;
  }

  release() {
    if (!this.available) {
      return;
    }
    this.available = false;
    this.gl.deleteTexture(this.texture);
  }

  releaseImg(url: string) {
    if (!this.available) {
      return;
    }
    this.available = false;
    const o = HASH[url];
    o.count--;
    if (!o.count) {
      // 此时无引用计数可清空且释放texture
      delete HASH[url];
      this.gl.deleteTexture(this.texture);
    }
  }

  static getInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, canvas: HTMLCanvasElement) {
    const texture = createTexture(gl, 0, canvas);
    return new TextureCache(gl, texture);
  }

  static getImgInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, canvas: HTMLCanvasElement, url: string) {
    if (HASH.hasOwnProperty(url)) {
      const o = HASH[url];
      o.count++;
      return new TextureCache(gl, HASH[url].value);
    }
    const texture = createTexture(gl, 0, canvas);
    HASH[url] = {
      value: texture,
      count: 1,
    };
    return new TextureCache(gl, texture);
  }

  static getEmptyInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, w: number, h: number) {
    const texture = createTexture(gl, 0, undefined, w, h);
    return new TextureCache(gl, texture);
  }
}

export default TextureCache;
