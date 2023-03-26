import Node from '../node/Node';
import Bitmap from '../node/Bitmap';
import { createTexture } from '../gl/webgl';

const HASH: any = {};

class TextureCache {
  texture:  WebGLTexture;

  constructor(texture: WebGLTexture) {
    this.texture = texture;
  }

  static getInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, node: Node) {
    const { offscreen } = node.canvasCache!;
    const texture = createTexture(gl, 0, offscreen.canvas);
    return new TextureCache(texture);
  }

  static getImgInstance(gl: WebGL2RenderingContext | WebGLRenderingContext, node: Bitmap) {
    if (!node.loader.onlyImg) {
      throw new Error('Need an onlyImg');
    }
    const url = node.src!;
    if (HASH.hasOwnProperty(url)) {
      const o = HASH[url];
      o.count++;
      return new TextureCache(HASH[url].value);
    }
    const { offscreen } = node.canvasCache!;
    const texture = createTexture(gl, 0, offscreen.canvas);
    HASH[url] = {
      value: texture,
      count: 1,
    };
    return new TextureCache(texture);
  }
}

export default TextureCache;
