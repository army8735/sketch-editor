import { createTexture } from '../gl/webgl';
import Node from '../node/Node';

const UNIT = 256; // 高清方案下尺寸要*2=512

class Tile {
  available: boolean;
  count: number; // tile目前已绘多少节点
  nodes: Node[];
  complete: boolean; // 是否绘制完备所有节点
  x: number;
  y: number;
  size: number;
  gl: WebGL2RenderingContext | WebGLRenderingContext;
  texture: WebGLTexture | undefined;
  bbox: Float64Array; // 相对于page的坐标，没有旋转所以只算2个顶点即可

  constructor(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    x: number,
    y: number,
    size: number,
  ) {
    this.available = false;
    this.complete = false;
    this.count = 0;
    this.nodes = [];
    this.x = x;
    this.y = y;
    this.size = size;
    this.gl = gl;
    this.bbox = new Float64Array([0, 0, 0, 0]);
  }

  init(dpi = 1) {
    if (!this.available) {
      this.available = true;
      this.complete = false;
      this.count = 0;
      this.texture = createTexture(this.gl, 0, undefined, UNIT * dpi, UNIT * dpi);
    }
  }

  clear(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    if (this.texture) {
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        this.texture,
        0,
      );
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
    }
    this.count = 0;
    this.nodes.splice(0);
  }

  add(node: Node) {
    if (this.nodes.indexOf(node) === -1) {
      this.nodes.push(node);
    }
  }

  has(node: Node) {
    return this.nodes.indexOf(node) > -1;
  }

  updateTex(texture: WebGLTexture) {
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
    }
    this.texture = texture;
  }

  destroy() {
    this.available = false;
    this.complete = false;
    this.count = 0;
    this.nodes.splice(0);
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
      this.texture = undefined;
    }
  }

  static UNIT = UNIT;

  /**
   * 当前page缩放程度后对应的unit，一定范围内（2的倍数）scale是不变的整数，unit也不变。
   * 在scale为1时正好1:1，scale放大时unit要反而变小，scale变小则unit变大。
   * scale
   */
  static scaleUnit(scale: number) {}
}

export default Tile;
