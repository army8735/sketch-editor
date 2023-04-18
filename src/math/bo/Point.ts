import intersect from './intersect';

class Point {
  x: number;
  y: number
  constructor(x: number, y: number) {
    if(Array.isArray(x)) {
      [x, y] = x;
    }
    this.x = x;
    this.y = y;
  }

  toString() {
    // return this.x.toFixed(1).replace('.0', '') + ',' + this.y.toFixed(1).replace('.0', '');
    return this.x + ',' + this.y;
  }

  equal(o: Point) {
    return this === o || this.x === o.x && this.y === o.y;
  }

  equalEps(o: Point, eps = 1e-9) {
    return Math.abs(this.x - o.x) < eps && Math.abs(this.y - o.y) < eps;
  }

  // 排序，要求a在b左即x更小，x相等a在b下，符合返回false，不符合则true
  static compare(a: Point, b: Point) {
    if(a.x > b.x) {
      return true;
    }
    return a.x === b.x && a.y > b.y;
  }

  static toPoint(point: [number, number]) {
    return { x: point[0], y: point[1] };
  }

  static toPoints(points: Array<[number, number]>) {
    return points.map(item => Point.toPoint(item));
  }
}

export default Point;
