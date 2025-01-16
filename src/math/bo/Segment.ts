import Point from './Point';

let uuid = 0;

class Segment {
  uuid: number;
  coords: Point[];
  belong: number;
  myFill: [boolean, boolean];
  otherFill: [boolean, boolean];
  myCoincide: number;
  otherCoincide: number;
  isVisited: boolean;
  isDeleted: boolean;
  bbox: number[];

  constructor(coords: Point[], belong: number) {
    this.uuid = uuid++;
    const first = coords[0];
    if (coords.length > 2) {
      // 截取过程中曲线可能分成很小一截的水平/垂直直线，这里去除一下
      let equalX = true, equalY = true;
      for (let i = 1, len = coords.length; i < len; i++) {
        const item = coords[i];
        if (item.x !== first.x) {
          equalX = false;
        }
        if (item.y !== first.y) {
          equalY = false;
        }
        if (!equalX && !equalY) {
          break;
        }
      }
      if (equalX || equalY) {
        coords.splice(1, coords.length - 2);
      }
      // 斜线中如果控制点在线上，也视为直线
      else {
        const end = coords[coords.length - 1];
        const tan = (end.y - first.y) / (end.x - first.x);
        let equal = true;
        for (let i = 1; i < coords.length - 1; i++) {
          const mid = coords[i];
          const t = (mid.y - first.y) / (mid.x - first.x);
          if (isNaN(tan) || isNaN(t)) {
            if (tan !== t) {
              equal = false;
              break;
            }
          }
          else if (tan === Infinity || tan === -Infinity) {
            if (tan !== t) {
              equal = false;
              break;
            }
          }
          else {
            if (Math.abs(t - tan) > 1e-9) {
              equal = false;
              break;
            }
          }
        }
        if (equal) {
          coords.splice(1, coords.length - 2);
        }
      }
    }
    // 控制点如果和端点重合，视为无效
    if (coords.length > 2) {
      if (coords[1].x === first.x && coords[1].y === first.y) {
        coords.splice(1, 1);
      }
    }
    if (coords.length > 2) {
      const l = coords.length;
      const end = coords[l - 1];
      if (coords[l - 2].x === end.x && coords[l - 2].y === end.y) {
        coords.splice(l - 2, 1);
      }
    }
    this.coords = coords;
    this.belong = belong; // 属于source多边形还是clip多边形，0和1区别
    this.bbox = this.calBbox();
    this.myFill = [false, false]; // 自己的上下内外性
    this.otherFill = [false, false]; // 对方的上下内外性
    this.myCoincide = 0; // 自己重合次数
    this.otherCoincide = 0; // 对方重合次数
    this.isVisited = false; // 扫描求交时用到
    this.isDeleted = false; // 相交裁剪老的线段会被删除
  }

  calBbox() {
    const coords = this.coords, l = coords.length;
    const a = coords[0], b = coords[l - 1];
    // 由于曲线已经x/y单调，直接看两端即可
    const x1 = Math.min(a.x, b.x);
    const y1 = Math.min(a.y, b.y);
    const x2 = Math.max(a.x, b.x);
    const y2 = Math.max(a.y, b.y);
    return [x1, y1, x2, y2];
  }

  // 线段边逆序
  reverse() {
    this.coords.reverse();
  }

  equal(o: Segment) {
    const ca = this.coords, cb = o.coords;
    if (ca.length !== cb.length) {
      return false;
    }
    for (let i = 0, len = ca.length; i < len; i++) {
      if (!ca[i].equal(cb[i])) {
        return false;
      }
    }
    return true;
  }

  toHash() {
    return this.coords.map(item => item.toString()).join(' ');
  }

  toString() {
    return this.uuid
      + ' ' + this.belong
      + ' ' + this.myCoincide + '' + this.otherCoincide
      + ' ' + (this.isVisited ? 'v' : 'n') + (this.isDeleted ? 'd' : 'n')
      + ' ' + this.myFill.map(i => i ? 1 : 0).join('')
      + this.otherFill.map(i => i ? 1 : 0).join('')
      + ' ' + this.toHash();
  }
}

export default Segment;
