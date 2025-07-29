import { createTexture } from '../gl/webgl';
import Node from '../node/Node';

let UNIT = 512; // 如果256则高清方案下尺寸要*2
let uuid = 0;

class Tile {
  uuid: number;
  available: boolean; // 延迟初始化创建纹理，可能tile为空不需要创建
  nodes: Node[];
  complete: boolean; // 是否绘制完备所有节点
  needClear: boolean; // 是否需要清除重绘
  x: number;
  y: number;
  size: number;
  gl: WebGL2RenderingContext | WebGLRenderingContext;
  texture: WebGLTexture | undefined;
  bbox: Float64Array; // 相对于画布的坐标，没有旋转所以只算2个顶点即可
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  constructor(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    x: number,
    y: number,
    size: number,
  ) {
    this.uuid = uuid++;
    this.available = false;
    this.complete = false;
    this.needClear = false;
    this.nodes = [];
    this.x = x;
    this.y = y;
    this.size = size;
    this.gl = gl;
    this.bbox = new Float64Array([0, 0, 0, 0]);
    this.x1 = this.y1 = -1;
    this.x2 = this.y2 = 1;
  }

  init(dpi = 1) {
    if (!this.available) {
      this.available = true;
      this.complete = false;
      this.texture = createTexture(this.gl, 0, undefined, UNIT * dpi, UNIT * dpi);
    }
  }

  // 引用清空，重绘清空为防止多次无效在第一次绘制时候做
  clean() {
    this.complete = false;
    const list = this.nodes.splice(0);
    if (list.length) {
      this.needClear = true;
    }
    list.forEach(item => item.removeTile(this));
  }

  add(node: Node) {
    if (this.nodes.indexOf(node) === -1) {
      this.nodes.push(node);
      node.addTile(this);
    }
  }

  has(node: Node) {
    return this.nodes.indexOf(node) > -1;
  }

  remove(node: Node) {
    const i = this.nodes.indexOf(node);
    if (i > -1) {
      this.nodes.splice(i, 1);
      node.removeTile(this);
      this.complete = false;
      // 删除后这个tile需要清空重绘
      this.needClear = true;
      this.clean();
    }
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
    this.clean();
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
      this.texture = undefined;
    }
  }

  toString() {
    return this.uuid + ': ' + this.available + ',' + this.complete + '; '
      + this.x + ',' + this.y + ',' + (this.x + UNIT) + ',' + (this.y + UNIT)
      + '; ' + this.bbox.map(item => Math.round(item)).join(',');
  }

  get count() {
    return this.nodes.length;
  }

  static get UNIT() {
    return UNIT;
  };

  static set UNIT(v: number) {
    let n = v;
    let count = 0;
    while (n > 0) {
      n >>= 1;
      count++;
    }
    n = 0;
    while (count > 0) {
      count--;
      n <<= 1;
    }
    if (n < 32) {
      throw new Error('The UNIT of Tile muse be a power of 2 and the minimum is 32');
    }
    UNIT = n;
  }
}

export default Tile;
