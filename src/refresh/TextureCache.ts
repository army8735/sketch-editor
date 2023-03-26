import Node from '../node/Node';
import Bitmap from '../node/Bitmap';
import { createTexture } from '../gl/webgl';

const HASH: any = {};

class TextureCache {
  ratioX: number; // 特殊纯位图使用，可能不按照1：1原始纹理尺寸渲染，不用scale做，而是顶点计算用缩放做
  ratioY: number;
  texture:  WebGLTexture;

  constructor(texture: WebGLTexture, ratioX: number, ratioY: number) {
    this.ratioX = ratioX;
    this.ratioY = ratioY;
    this.texture = texture;
  }

  static getInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, node: Node) {
    const { offscreen } = node.canvasCache!;
    const texture = createTexture(gl, 0, offscreen.canvas);
    return new TextureCache(texture, 1, 1);
  }

  static getImgInstance(gl: WebGL2RenderingContext | WebGLRenderingContext,
                        node: Bitmap, ratioX = 1, ratioY = 1) {
    if (!node.loader.onlyImg) {
      throw new Error('Need an onlyImg');
    }
    const url = node.src!;
    if (HASH.hasOwnProperty(url)) {
      const o = HASH[url];
      o.count++;
      return new TextureCache(HASH[url].value, ratioX, ratioY);
    }
    const { offscreen } = node.canvasCache!;
    const texture = createTexture(gl, 0, offscreen.canvas);
    HASH[url] = {
      value: texture,
      count: 1,
    };
    return new TextureCache(texture, ratioX, ratioY);
  }
}

export default TextureCache;
