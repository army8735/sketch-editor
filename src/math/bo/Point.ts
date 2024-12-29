class Point {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  toString() {
    // return this.x.toFixed(1).replace('.0', '') + ',' + this.y.toFixed(1).replace('.0', '');
    return this.x + ',' + this.y;
  }

  equal(o: Point) {
    return this === o || (this.x === o.x && this.y === o.y);
  }

  equalEps(o: Point, eps = 1e-2) {
    return this === o ||
      Math.abs(this.x * 100 - o.x * 100) <= eps * 100 && Math.abs(this.y * 100 - o.y * 100) <= eps * 100;
  }

  add(p: Point) {
    this.x += p.x;
    this.y += p.y;

    return this;
  }

  minus(p: Point) {
    this.x -= p.x;
    this.y -= p.y;

    return this;
  }

  scale(n: number) {
    this.x *= n;
    this.y *= n;

    return this;
  }

  // 排序，要求a在b左即x更小，x相等a在b下，符合返回false，不符合则true
  static compare(a: Point, b: Point) {
    if (a.x > b.x) {
      return true;
    }
    return a.x === b.x && a.y > b.y;
  }

  static toPoint(point: [number, number]) {
    return { x: point[0], y: point[1] };
  }

  static toPoints(points: Array<[number, number]>) {
    return points.map((item) => Point.toPoint(item));
  }
}

export default Point;
