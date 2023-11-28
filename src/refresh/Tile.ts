import { createTexture } from '../gl/webgl';
import Node from '../node/Node';

const UNIT = 256; // 高清方案下尺寸要*2=512
let uuid = 0;

class Tile {
  uuid: number;
  available: boolean; // 延迟初始化创建纹理，可能tile为空不需要创建
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
    this.uuid = uuid++;
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

  // 引用清空，重绘清空为防止多次无效在第一次绘制时候做
  clean() {
    this.count = 0;
    this.complete = false;
    const list = this.nodes.splice(0);
    list.forEach(item => item.removeTile(this));
    return list;
  }

  add(node: Node) {
    if (this.nodes.indexOf(node) === -1) {
      this.nodes.push(node);
      node.addTile(this);
      this.count++;
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
      this.count--;
      this.complete = false;
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
    this.count = 0;
    // this.nodes.splice(0);
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
      this.texture = undefined;
    }
  }

  toString() {
    return this.uuid + ',' + this.x + ',' + this.y;
  }

  static UNIT = UNIT;

  static clean(list: Tile[]) {
    list.forEach(item => item.clean());
  }
}

export default Tile;
