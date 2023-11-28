import Tile from './Tile';
import Page from '../node/Page';

let dft: TileManager;
const hash = new WeakMap<Page, TileManager>();

class TileManager {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  data: Tile[][][]; // 一维存scale缩放，二和三维存Tile数据，即原本二维平面坐标数据映射为二维数组，再多加一维scale

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl;
    this.data = [];
  }

  // 根据考虑了dpi的坐标和数量，找到data中对应的矩阵数据结构范围
  active(scale: number, x: number, y: number, nw: number, nh: number) {
    if (this === dft || !nw || !nh) {
      return [];
    }
    const table = this.data[scale] = this.data[scale] || [];
    const res: Tile[] = [];
    // 不存在则新建，第一次进入时
    if (!table.length) {
      for (let i = 0; i < nh; i++) {
        const list: Tile[] = [];
        for (let j = 0; j < nw; j++) {
          const tile = new Tile(this.gl, x + j * Tile.UNIT, y + i * Tile.UNIT, Tile.UNIT);
          list.push(tile);
          res.push(tile);
        }
        table.push(list);
      }
    }
    // 否则查找到对应的索引，由于是矩阵结构，直接就能计算出来
    else {
      let first = table[0][0];
      const dx = x - first.x;
      const dy = y - first.y;
      let ox = Math.round(dx / Tile.UNIT); // 肯定是整数，怕精度奇葩问题
      let oy = Math.round(dy / Tile.UNIT);
      // console.warn(dx,dy,ox,oy,',',x,y,first.x,first.y);
      // console.table(table.map(item => (item || []).map(item => item.toString())))
      // 可能比之前的位置更小（左上），先填满
      while (oy < 0) {
        table.unshift([new Tile(this.gl, first.x, first.y - Tile.UNIT, Tile.UNIT)]);
        first = table[0][0];
        oy++;
      }
      while (ox < 0) {
        for (let i = 0, len = table.length; i < len; i++) {
          const list = table[i] = table[i] || [];
          if (list.length) {
            const tile = list[0];
            list.unshift(new Tile(this.gl, tile.x - Tile.UNIT, tile.y, Tile.UNIT));
          }
        }
        ox++;
      }
      // console.table(table.map(item => (item || []).map(item => item.toString())))
      // 位置更大的话直接向右下找，其它情况上面已归零
      for (let i = oy; i < oy + nh; i++) {
        const list: Tile[] = table[i] = table[i] || [];
        for (let j = ox; j < ox + nw; j++) {
          if (list[j]) {
            res.push(list[j]);
          } else {
            const tile = new Tile(this.gl, x + j * Tile.UNIT, y + i * Tile.UNIT, Tile.UNIT);
            list.push(tile);
            res.push(tile);
          }
        }
      }
      // console.table(table.map(item => (item || []).map(item => item.toString())))
    }
    return res;
  }

  static getSingleInstance(gl: WebGLRenderingContext | WebGL2RenderingContext, page?: Page) {
    // 无page时的默认实现，不进行缓存，外部不感知
    if (!page) {
      return dft = dft || new TileManager(gl);
    }
    if (!hash.has(page)) {
      hash.set(page, new TileManager(gl));
    }
    return hash.get(page)!;
  }

  static UNIT = Tile.UNIT;
}

export default TileManager;
