import Tile from './Tile';
import Page from '../node/Page';

type DATA = {
  scale: number;
  table: Tile[][]; // 原本二维平面坐标数据映射为二维数组
};

class TileManager {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  hash: WeakMap<Page, DATA[]>;
  data: DATA[]; // scale从小到大

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl;
    this.hash = new WeakMap();
    this.data = [];
  }

  setPage(page: Page) {
    if (this.hash.has(page)) {
      this.data = this.hash.get(page)!;
    } else {
      this.data = [];
      this.hash.set(page, this.data);
    }
  }

  // 根据考虑了dpi的坐标和数量，找到data中对应的矩阵数据结构范围
  active(scale: number, x: number, y: number, nw: number, nh: number) {
    if (!nw || !nh) {
      return [];
    }
    const size = Math.round(Tile.UNIT / scale);
    // const table = this.data[scale] = this.data[scale] || [];
    const table = this.getTable(scale);
    const res: Tile[] = [];
    // 不存在则新建，第一次进入时
    if (!table.length) {
      for (let i = 0; i < nh; i++) {
        const list: Tile[] = [];
        for (let j = 0; j < nw; j++) {
          const tile = new Tile(this.gl, x + j * size, y + i * size, size);
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
      let ox = Math.round(dx / size); // 肯定是整数，怕精度奇葩问题
      let oy = Math.round(dy / size);
      // console.warn(dx,dy,ox,oy,',',x,y,first.x,first.y);
      // console.table(table.map(item => (item || []).map(item => item.toString())))
      // 可能比之前的位置更小（左上），先填满
      while (oy < 0) {
        table.unshift([new Tile(this.gl, first.x, first.y - size, size)]);
        first = table[0][0];
        oy++;
      }
      while (ox < 0) {
        for (let i = 0, len = table.length; i < len; i++) {
          const list = table[i] = table[i] || [];
          if (list.length) {
            const tile = list[0];
            list.unshift(new Tile(this.gl, tile.x - size, tile.y, size));
          }
        }
        ox++;
      }
      first = table[0][0];
      // console.table(table.map(item => (item || []).map(item => item.toString())))
      // 位置更大的话直接向右下找，其它情况上面已归零
      for (let i = oy; i < oy + nh; i++) {
        const list: Tile[] = table[i] = table[i] || [];
        for (let j = ox; j < ox + nw; j++) {
          if (list[j]) {
            res.push(list[j]);
          } else {
            const tile = new Tile(this.gl, first.x + j * size, first.y + i * size, size);
            list[j] = tile;
            // 防止发生跳跃（比如先右移，再下移，可能左下角会空一格没有初始化导致索引错误）
            for (let k = j - 1; k >= 0; k--) {
              if (list[k]) {
                break;
              }
              list[k] = new Tile(this.gl, first.x + k * size, first.y + i * size, size);
            }
            res.push(tile);
          }
        }
      }
      // console.table(table.map(item => (item || []).map(item => item.toString())))
    }
    return res;
  }

  getTable(scale: number) {
    // 按scale从小到大顺序找，插入在正确的位置
    for (let i = 0, len = this.data.length; i < len; i++) {
      const item = this.data[i];
      if (item.scale === scale) {
        return item.table;
      }
      if (item.scale > scale) {
        const data = {
          scale,
          table: [],
        } as DATA;
        this.data.splice(i, 0, data);
        return data.table;
      }
    }
    // 找不到插入在末尾
    const data = {
      scale,
      table: [],
    } as DATA;
    this.data.push(data);
    return data.table;
  }

  getDowngrade(scale: number, x: number, y: number) {
    for (let i = 0, len = this.data.length; i < len; i++) {
      const item = this.data[i];
      if (item.scale === scale) {
        // 先找小的，其中裁剪一部分渲染，可能模糊
        for (let j = i - 1; j >= 0; j--) {
          const { scale: scale2, table } = this.data[j];
          for (let i = 0, len = table.length; i < len; i++) {
            const list = table[i];
            if (list.length) {
              const first = list[0];
              if (first.y === y || first.y < y && first.y + first.size > y) {
                for (let j = 0, len = list.length; j < len; j++) {
                  const item2 = list[j];
                  if ((item2.x === x || item2.x < x && item2.x + item2.size > x) && item2.available && item2.count) {
                    return [{
                      scale: scale2,
                      tile: item2,
                    }];
                  }
                  else if (item2.x > x) {
                    break;
                  }
                }
              } else if (first.y > y) {
                break;
              }
            }
          }
        }
        // 再看大的，但可能不完整需要多块拼合
        for (let j = i + 1; j < len; j++) {
          const { scale: scale2, table } = this.data[j];
          const s = Tile.UNIT / scale;
          const res: Array<{
            scale: number,
            tile: Tile,
          }> = [];
          for (let i = 0, len = table.length; i < len; i++) {
            const list = table[i];
            if (list.length) {
              const first = list[0];
              if (first.y >= y && first.y < y + s) {
                for (let j = 0, len = list.length; j < len; j++) {
                  const item2 = list[j];
                  if (item2.x >= x && item2.x < x + s && item2.available && item2.count) {
                    res.push({
                      scale: scale2,
                      tile: item2,
                    });
                  } else if (item2.x >= x + s) {
                    break;
                  }
                }
              } else if (first.y >= y + s) {
                break;
              }
            }
          }
          if (res.length) {
            return res;
          }
        }
        break;
      }
    }
  }
}

export default TileManager;
