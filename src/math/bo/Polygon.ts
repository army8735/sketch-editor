import bezier from '../bezier';
import equation from '../equation';
import geom from '../geom';
import vector from '../vector';
import intersect from './intersect';
import Point from './Point';
import Segment from './Segment';

const {
  getIntersectionLineLine,
  getIntersectionBezier2Line,
  getIntersectionBezier2Bezier2,
  getIntersectionBezier2Bezier3,
  getIntersectionBezier3Line,
  getIntersectionBezier3Bezier3,
  sortIntersection,
} = intersect;

class Polygon {
  segments: Segment[];
  index: number;

  constructor(regions: number[][][], index: number) {
    this.index = index; // 属于source多边形还是clip多边形，0和1区别
    const segments: Segment[] = (this.segments = []);
    // 多边形有>=1个区域，一般是1个
    if (!Array.isArray(regions)) {
      return;
    }
    regions.forEach((vertices) => {
      // 每个区域有>=2条线段，组成封闭区域，1条肯定不行，2条必须是曲线
      if (!Array.isArray(vertices) || vertices.length < 2) {
        return;
      }
      if (vertices.length === 2 && vertices[1].length <= 2) {
        return;
      }
      let startPoint = new Point(vertices[0][0], vertices[0][1]),
        firstPoint = startPoint;
      // 根据多边形有向边，生成线段，不保持原有向，统一左下作为线段起点，如果翻转则记录个值标明
      for (let i = 1, len = vertices.length; i < len; i++) {
        const curr = vertices[i],
          l = curr.length;
        // 闭合区域，首尾顶点重复统一
        const endPoint = new Point(curr[l - 2], curr[l - 1]);
        let seg: Segment;
        if (l === 2) {
          // 长度为0的直线忽略
          if (startPoint.equal(endPoint)) {
            continue;
          }
          const coords = Point.compare(startPoint, endPoint)
            ? [endPoint, startPoint]
            : [startPoint, endPoint];
          seg = new Segment(coords, index);
          segments.push(seg);
        }
        // 曲线需确保x单调性，如果非单调，则切割为单调的多条
        else if (l === 4) {
          // 长度为0的曲线忽略
          if (
            startPoint.equal(endPoint) &&
            startPoint.x === curr[0] &&
            startPoint.y === curr[1]
          ) {
            continue;
          }
          const cPoint = new Point(curr[0], curr[1]);
          const t = bezier.getBezierMonotonicityT([startPoint, cPoint, endPoint], true) || [];
          const t2 = bezier.getBezierMonotonicityT([startPoint, cPoint, endPoint], false);
          // const t3 = bezier.getBezierMonotonicityT2([startPoint, cPoint, endPoint], true);
          // const t4 = bezier.getBezierMonotonicityT2([startPoint, cPoint, endPoint], false);
          t2?.forEach(i => {
            if (!t.includes(i)) {
              t.push(i);
            }
          });
          // t3?.forEach(i => {
          //   if (!t.includes(i)) {
          //     t.push(i);
          //   }
          // });
          // t4?.forEach(i => {
          //   if (!t.includes(i)) {
          //     t.push(i);
          //   }
          // });
          if (t.length) {
            const points: [number, number][] = [
              [startPoint.x, startPoint.y],
              [curr[0], curr[1]],
              [endPoint.x, endPoint.y],
            ];
            const curve1 = bezier.sliceBezier(
              Point.toPoints(points), 0, t[0],
            ).map(item => {
              return {
                x: Math.round(item.x),
                y: Math.round(item.y),
              };
            });
            const curve2 = bezier.sliceBezier(
              Point.toPoints(points),
              t[0],
              1,
            ).map(item => {
              return {
                x: Math.round(item.x),
                y: Math.round(item.y),
              };
            });
            const p1 = new Point(
                curve1[1].x,
                curve1[1].y,
              ),
              p2 = new Point(
                curve1[2].x,
                curve1[2].y,
              ),
              p3 = new Point(
                curve2[1].x,
                curve2[1].y,
              );
            let coords = Point.compare(startPoint, p2)
              ? [p2, p1, startPoint]
              : [startPoint, p1, p2];
            if (!startPoint.equal(p2)) {
              segments.push(new Segment(coords, index));
            }
            coords = Point.compare(p2, endPoint)
              ? [endPoint, p3, p2]
              : [p2, p3, endPoint];
            if (!endPoint.equal(p2)) {
              segments.push(new Segment(coords, index));
            }
          }
          else {
            const coords = Point.compare(startPoint, endPoint)
              ? [endPoint, cPoint, startPoint]
              : [startPoint, cPoint, endPoint];
            segments.push(new Segment(coords, index));
          }
        }
        // 3阶可能有2个单调改变t点
        else if (l === 6) {
          // 降级为2阶曲线
          if (curr[0] === curr[2] && curr[1] === curr[3]) {
            curr.splice(2, 2);
            i--;
            continue;
          }
          // 长度为0的曲线忽略
          if (
            startPoint.equal(endPoint) &&
            startPoint.x === curr[0] &&
            startPoint.y === curr[1] &&
            startPoint.x === curr[2] &&
            startPoint.y === curr[3]
          ) {
            continue;
          }
          const cPoint1 = new Point(curr[0], curr[1]),
            cPoint2 = new Point(curr[2], curr[3]);
          const t = bezier.getBezierMonotonicityT([startPoint, cPoint1, cPoint2, endPoint], true) || [];
          const t2 = bezier.getBezierMonotonicityT([startPoint, cPoint1, cPoint2, endPoint], false);
          // const t3 = bezier.getBezierMonotonicityT2([startPoint, cPoint1, cPoint2, endPoint], true);
          // const t4 = bezier.getBezierMonotonicityT2([startPoint, cPoint1, cPoint2, endPoint], false);
          t2?.forEach(i => {
            if (!t.includes(i)) {
              t.push(i);
            }
          });
          // t3?.forEach(i => {
          //   if (!t.includes(i)) {
          //     t.push(i);
          //   }
          // });
          // t4?.forEach(i => {
          //   if (!t.includes(i)) {
          //     t.push(i);
          //   }
          // });
          if (t.length) {
            const points: Array<[number, number]> = [
              [startPoint.x, startPoint.y],
              [curr[0], curr[1]],
              [curr[2], curr[3]],
              [endPoint.x, endPoint.y],
            ];
            let lastPoint = startPoint,
              lastT = 0;
            t.forEach((t) => {
              const curve = bezier.sliceBezier(
                Point.toPoints(points),
                lastT,
                t,
              ).map(item => {
                return {
                  x: Math.round(item.x),
                  y: Math.round(item.y),
                };
              });
              const p1 = new Point(
                  curve[1].x,
                  curve[1].y,
                ),
                p2 = new Point(
                  curve[2].x,
                  curve[2].y,
                ),
                p3 = new Point(
                  curve[3].x,
                  curve[3].y,
                );
              const coords = Point.compare(lastPoint, p3)
                ? [p3, p2, p1, lastPoint]
                : [lastPoint, p1, p2, p3];
              if (!lastPoint.equal(p3)) {
                segments.push(new Segment(coords, index));
              }
              lastT = t;
              lastPoint = p3;
            });
            const curve = bezier.sliceBezier(
              Point.toPoints(points),
              lastT,
              1,
            ).map(item => {
              return {
                x: Math.round(item.x),
                y: Math.round(item.y),
              };
            });
            const p1 = new Point(
                curve[1].x,
                curve[1].y,
              ),
              p2 = new Point(curve[2].x, curve[2].y);
            const coords = Point.compare(lastPoint, endPoint)
              ? [endPoint, p2, p1, lastPoint]
              : [lastPoint, p1, p2, endPoint];
            if (!lastPoint.equal(endPoint)) {
              segments.push(new Segment(coords, index));
            }
          }
          else {
            const coords = Point.compare(startPoint, endPoint)
              ? [endPoint, cPoint2, cPoint1, startPoint]
              : [startPoint, cPoint1, cPoint2, endPoint];
            segments.push(new Segment(coords, index));
          }
        }
        // 终点是下条边的起点
        startPoint = endPoint;
      }
      // 强制要求闭合，非闭合自动连直线到开始点闭合
      if (!startPoint.equal(firstPoint)) {
        const coords = Point.compare(startPoint, firstPoint)
          ? [firstPoint, startPoint]
          : [startPoint, firstPoint];
        segments.push(new Segment(coords, index));
      }
    });
  }

  // 根据y坐标排序，生成有序线段列表，再扫描求交
  selfIntersect() {
    const list = genHashXList(this.segments);
    this.segments = findIntersection(list, false, false, false);
  }

  toString() {
    return this.segments.map((item) => item.toString());
  }

  reset(index: number) {
    this.index = index;
    this.segments.forEach((seg) => {
      seg.belong = index;
      seg.otherCoincide = 0;
      seg.otherFill[0] = seg.otherFill[1] = false;
    });
    return this;
  }

  // 2个非自交的多边形互相判断相交，依旧是扫描线算法，2个多边形统一y排序，但要分别出属于哪个多边形，因为只和对方测试相交
  static intersect2(
    polyA: Polygon,
    polyB: Polygon,
    isIntermediateA: boolean,
    isIntermediateB: boolean,
  ) {
    if (!polyA.segments.length || !polyB.segments.length) {
      return;
    }

    const list = genHashXList(polyA.segments.concat(polyB.segments));
    const segments = findIntersection(
      list,
      true,
      isIntermediateA,
      isIntermediateB,
    );
    polyA.segments = segments.filter((item) => item.belong === 0);
    polyB.segments = segments.filter((item) => item.belong === 1);
  }

  /**
   * 以Bentley-Ottmann算法为原理，为每个顶点设计事件，按x升序、y升序遍历所有顶点的事件
   * 每条线段边有2个顶点即2个事件，左下为start，右上为end
   * 同顶点优先end，start相同则对比线段谁后面的y更小（向量法），其实就是对比非共点部分的y大小
   * 维护一个活跃边列表ael，同样保证x升序、y升序，start事件线段进入ael，end离开
   * ael中相邻的线段说明上下相互接壤，接壤一侧则内外填充性一致
   * 最下面的边（含第一条）可直接得知下方填充性（下面没有了一定是多边形外部），再推测出上方
   * 其余的边根据自己下方相邻即可确定填充性
   */
  static annotate2(
    polyA: Polygon,
    polyB: Polygon,
    isIntermediateA: boolean,
    isIntermediateB: boolean,
  ) {
    const list = genHashXYList(polyA.segments.concat(polyB.segments));
    const aelA: Segment[] = [],
      aelB: Segment[] = [],
      hashA: any = {},
      hashB: any = {};
    // 算法3遍循环，先注释a多边形的边自己内外性，再b的边自己内外性，最后一起注释对方的内外性
    // 因数据结构合在一起，所以2遍循环可以完成，先注释a和b的自己，再一遍对方
    list.forEach((item) => {
      const { isStart, seg } = item;
      const belong = seg.belong;
      // 连续操作时，已有的中间结果可以跳过
      if (
        (belong === 0 && isIntermediateA) ||
        (belong === 1 && isIntermediateB)
      ) {
        return;
      }
      const ael: Segment[] = belong === 0 ? aelA : aelB,
        hash = belong === 0 ? hashA : hashB;
      if (isStart) {
        // console.log(seg.toString());
        // 自己重合的线段只考虑第一条，其它剔除
        if (seg.myCoincide) {
          const hc = seg.toHash();
          if (hash.hasOwnProperty(hc)) {
            return;
          }
          hash[hc] = true;
        }
        // 下面没有线段了，底部边，上方填充下方空白（除非是偶次重复段，上下都空白，奇次和单线相同）
        if (!ael.length) {
          if (seg.myCoincide) {
            seg.myFill[0] = seg.myCoincide % 2 === 0;
          }
          else {
            seg.myFill[0] = true;
          }
          ael.push(seg);
        }
        else {
          // 插入到ael正确的位置，按照x升序、y升序
          const len = ael.length,
            top = ael[len - 1];
          const isAboveLast = segAboveCompare(seg, top);
          // 比ael栈顶还高在最上方
          if (isAboveLast) {
            seg.myFill[1] = top.myFill[0];
            if (seg.myCoincide) {
              seg.myFill[0] =
                seg.myCoincide % 2 === 0 ? !seg.myFill[1] : seg.myFill[1];
            }
            else {
              seg.myFill[0] = !seg.myFill[1];
            }
            ael.push(seg);
          }
          // 不高且只有1个则在最下方
          else if (len === 1) {
            if (seg.myCoincide) {
              seg.myFill[0] = seg.myCoincide % 2 === 0;
            }
            else {
              seg.myFill[0] = true;
            }
            ael.unshift(seg);
          }
          else {
            // 遍历，尝试对比是否在ael栈中相邻2条线段之间
            for (let i = len - 2; i >= 0; i--) {
              const curr = ael[i];
              const isAbove = segAboveCompare(seg, curr);
              if (isAbove) {
                seg.myFill[1] = curr.myFill[0];
                if (seg.myCoincide) {
                  seg.myFill[0] =
                    seg.myCoincide % 2 === 0 ? !seg.myFill[1] : seg.myFill[1];
                }
                else {
                  seg.myFill[0] = !seg.myFill[1];
                }
                ael.splice(i + 1, 0, seg);
                break;
              }
              else if (i === 0) {
                if (seg.myCoincide) {
                  seg.myFill[0] = seg.myCoincide % 2 === 0;
                }
                else {
                  seg.myFill[0] = true;
                }
                ael.unshift(seg);
              }
            }
          }
        }
        // console.warn(seg.toString());
      }
      else {
        const i = ael.indexOf(seg);
        // 一般肯定有，重合线段会剔除不进ael
        if (i > -1) {
          ael.splice(i, 1);
        }
      }
    });
    // 注释对方，除了重合线直接使用双方各自的注释拼接，普通线两边的对方内外性相同，根据是否在里面inside确定结果
    // inside依旧看自己下方的线段上方情况，不同的是要看下方的线和自己belong是否相同，再确定取下方above的值
    const ael: Segment[] = [],
      hash: any = {};
    list.forEach((item) => {
      const { isStart, seg } = item;
      const belong = seg.belong;
      if (isStart) {
        // console.log(seg.toString());
        // 自重合或者它重合统一只保留第一条线
        if (seg.myCoincide || seg.otherCoincide) {
          const hc = seg.toHash();
          if (hash.hasOwnProperty(hc)) {
            return;
          }
          hash[hc] = true;
        }
        let inside = false;
        if (!ael.length) {
          inside = false;
          ael.push(seg);
        }
        else {
          const len = ael.length,
            top = ael[len - 1];
          const isAboveLast = segAboveCompare(seg, top);
          if (isAboveLast) {
            if (top.belong === belong) {
              inside = top.otherFill[0];
            }
            else {
              inside = top.myFill[0];
            }
            ael.push(seg);
          }
          else if (len === 1) {
            ael.unshift(seg);
          }
          else {
            for (let i = len - 2; i >= 0; i--) {
              const curr = ael[i];
              const isAbove = segAboveCompare(seg, curr);
              if (isAbove) {
                // 如果在自己的下方线和自己同色，则取下方线的另外色上填充
                if (curr.belong === belong) {
                  inside = curr.otherFill[0];
                }
                // 否则取下方线的下方色上填充
                else {
                  inside = curr.myFill[0];
                }
                ael.splice(i + 1, 0, seg);
                break;
              }
              // 比最下方的还要下，说明自己是新的最下方的线
              else if (i === 0) {
                ael.unshift(seg);
              }
            }
          }
        }
        // 重合线的otherFill直接引用指向对方myFill，不能普通计算
        if (!seg.otherCoincide) {
          seg.otherFill[0] = inside;
          seg.otherFill[1] = inside;
        }
        // console.warn(seg.toString());
      }
      else {
        const i = ael.indexOf(seg);
        if (i > -1) {
          ael.splice(i, 1);
        }
      }
    });
  }
}

/**
 * 求交，分为2大块，1是自相交，需要考虑一定精度误差，相交的点如果离原本顶点很近，就认为不相交，
 * 这种情况一般出现在两条共点线段上，曲线尤甚，不能认为它们相交，此时eps误差可以传一个小精度数值如1e-9。
 * 2是互交，误差考虑要谨慎，如果还是1e-9，会被忽略然后在注释颜色那里出错，此时eps应该考虑0
 */
function findIntersection(
  list: any,
  compareBelong: boolean,
  isIntermediateA: boolean,
  isIntermediateB: boolean,
) {
  // 从左到右扫描，按x坐标排序，相等按y，边会进入和离开扫描线各1次，在扫描线中的边为活跃边，维护1个活跃边列表，新添加的和老的求交
  const ael: Segment[] = [],
    delList: Segment[] = [],
    segments: Segment[] = [];
  while (list.length) {
    if (delList.length) {
      delList.splice(0).forEach((seg) => {
        const i = ael.indexOf(seg);
        if (i > -1) {
          ael.splice(i, 1);
        }
        if (!seg.isDeleted) {
          segments.push(seg);
        }
      });
    }

    const { x, arr } = list.shift();
    while (arr.length) {
      const seg = arr.shift();
      // 被切割的老线段无效
      if (seg.isDeleted) {
        continue;
      }
      const belong = seg.belong,
        bboxA = seg.bbox;
      // 第2次访问边是离开活动，考虑删除
      if (seg.isVisited) {
        // console.warn(x, 'isVisited', seg.toString());
        // console.log(ael.map(item => item.toString()));
        // 可能是垂线不能立刻删除，所以等到下次活动x再删除，因为会出现极端情况刚进来就出去，和后面同y的重合
        if (bboxA[0] !== bboxA[2] || seg.coords.length !== 2) {
          const i = ael.indexOf(seg);
          if (i > -1) {
            ael.splice(i, 1);
          }
          if (!seg.isDeleted) {
            segments.push(seg);
          }
        }
        else {
          delList.push(seg);
        }
        seg.isVisited = false; // 还原以备后面逻辑重复利用
        // console.log(ael.map(item => item.toString()));
      }
      // 第1次访问边一定是进入活动，求交
      else {
        // console.warn(x, 'first', seg.toString());
        // console.log(ael.map(item => item.toString()));
        // 和asl里的边求交，如果被分割，新生成的存入asl和hash，老的线段无需再进入asl
        if (ael.length) {
          const coordsA = seg.coords,
            lenA = coordsA.length;
          const { x: ax1, y: ay1 } = coordsA[0];
          const { x: ax2, y: ay2 } = coordsA[1];
          for (let i = 0; i < ael.length; i++) {
            const item = ael[i];
            // 被切割的老线段无效，注意seg切割过程中可能变成删除
            if (item.isDeleted || seg.isDeleted) {
              continue;
            }
            // 互交所属belong不同才进行检测，自交则不检查belong
            if (compareBelong && item.belong === belong) {
              continue;
            }
            // bbox相交才考虑真正计算，加速
            const bboxB = item.bbox,
              coordsB = item.coords,
              lenB = coordsB.length;
            let isSourceReverted = false; // 求交可能a、b线主从互换，公式要求a的阶数>=b的
            if (isRectsOverlap(bboxA, bboxB, lenA, lenB)) {
              // 完全重合简化，同矩形的线myFill共享，对方矩形互换otherFill
              if (lenA === lenB && seg.equal(item)) {
                if (compareBelong) {
                  // 因为一定不自交，所以重合线不会被分割
                  seg.otherCoincide++;
                  item.otherCoincide++;
                  seg.otherFill = item.myFill;
                  item.otherFill = seg.myFill;
                }
                else {
                  seg.myCoincide++;
                  item.myCoincide++;
                  seg.myFill = item.myFill;
                }
                continue;
              }
              const { x: bx1, y: by1 } = coordsB[0];
              const { x: bx2, y: by2 } = coordsB[1];
              let inters, overs;
              // a是直线
              if (lenA === 2) {
                // b是直线
                if (lenB === 2) {
                  const d =
                    (by2 - by1) * (ax2 - ax1) - (bx2 - bx1) * (ay2 - ay1);
                  // 平行检查是否重合，否则求交
                  if (d === 0) {
                    // 垂线特殊，y=kx+b没法求
                    if (ax1 === ax2) {
                      if (ax1 === bx1 && ax2 === bx2) {
                        overs = checkOverlapLine(
                          ax1,
                          ay1,
                          ax2,
                          ay2,
                          seg,
                          bx1,
                          by1,
                          bx2,
                          by2,
                          item,
                          true,
                        );
                      }
                    }
                    else {
                      // 水平线默认k是0
                      let k1 = 0;
                      let k2 = 0;
                      if (ay2 !== ay1) {
                        k1 = (ax2 - ax1) / (ay2 - ay1);
                      }
                      if (by2 !== by1) {
                        k2 = (bx2 - bx1) / (by2 - by1);
                      }
                      const b1 = ay1 - k1 * ax1;
                      const b2 = by1 - k2 * bx1;
                      if (b1 === b2) {
                        overs = checkOverlapLine(
                          ax1,
                          ay1,
                          ax2,
                          ay2,
                          seg,
                          bx1,
                          by1,
                          bx2,
                          by2,
                          item,
                          false,
                        );
                      }
                    }
                  }
                  else {
                    inters = getIntersectionLineLine(
                      ax1,
                      ay1,
                      ax2,
                      ay2,
                      bx1,
                      by1,
                      bx2,
                      by2,
                    );
                  }
                }
                // b是曲线
                else {
                  const { x: bx3, y: by3 } = coordsB[2];
                  // b是2阶曲线
                  if (lenB === 3) {
                    inters = getIntersectionBezier2Line(
                      bx1,
                      by1,
                      bx2,
                      by2,
                      bx3,
                      by3,
                      ax1,
                      ay1,
                      ax2,
                      ay2,
                    );
                    isSourceReverted = true;
                  }
                  // b是3阶曲线
                  else {
                    const { x: bx4, y: by4 } = coordsB[3];
                    inters = getIntersectionBezier3Line(
                      bx1,
                      by1,
                      bx2,
                      by2,
                      bx3,
                      by3,
                      bx4,
                      by4,
                      ax1,
                      ay1,
                      ax2,
                      ay2,
                    );
                    isSourceReverted = true;
                  }
                }
              }
              // a是曲线
              else {
                const { x: ax3, y: ay3 } = coordsA[2];
                // a是2阶曲线
                if (lenA === 3) {
                  // b是直线
                  if (lenB === 2) {
                    inters = getIntersectionBezier2Line(
                      ax1,
                      ay1,
                      ax2,
                      ay2,
                      ax3,
                      ay3,
                      bx1,
                      by1,
                      bx2,
                      by2,
                    );
                  }
                  // b是曲线
                  else {
                    const { x: bx3, y: by3 } = coordsB[2];
                    // b是2阶曲线
                    if (lenB === 3) {
                      overs = checkOverlapBezier(seg, item);
                      if (!overs) {
                        inters = getIntersectionBezier2Bezier2(
                          ax1,
                          ay1,
                          ax2,
                          ay2,
                          ax3,
                          ay3,
                          bx1,
                          by1,
                          bx2,
                          by2,
                          bx3,
                          by3,
                        );
                      }
                    }
                    // b是3阶曲线
                    else {
                      const { x: bx4, y: by4 } = coordsB[3];
                      inters = getIntersectionBezier2Bezier3(
                        ax1,
                        ay1,
                        ax2,
                        ay2,
                        ax3,
                        ay3,
                        bx1,
                        by1,
                        bx2,
                        by2,
                        bx3,
                        by3,
                        bx4,
                        by4,
                      );
                    }
                  }
                }
                // a是3阶曲线
                else {
                  const { x: ax4, y: ay4 } = coordsA[3];
                  // b是直线
                  if (lenB === 2) {
                    inters = getIntersectionBezier3Line(
                      ax1,
                      ay1,
                      ax2,
                      ay2,
                      ax3,
                      ay3,
                      ax4,
                      ay4,
                      bx1,
                      by1,
                      bx2,
                      by2,
                    );
                  }
                  // b是曲线
                  else {
                    const { x: bx3, y: by3 } = coordsB[2];
                    // b是2阶曲线
                    if (lenB === 3) {
                      inters = getIntersectionBezier2Bezier3(
                        bx1,
                        by1,
                        bx2,
                        by2,
                        bx3,
                        by3,
                        ax1,
                        ay1,
                        ax2,
                        ay2,
                        ax3,
                        ay3,
                        ax4,
                        ay4,
                      );
                      isSourceReverted = true;
                    }
                    // b是3阶曲线
                    else {
                      overs = checkOverlapBezier(seg, item);
                      if (!overs) {
                        const { x: bx4, y: by4 } = coordsB[3];
                        inters = getIntersectionBezier3Bezier3(
                          ax1,
                          ay1,
                          ax2,
                          ay2,
                          ax3,
                          ay3,
                          ax4,
                          ay4,
                          bx1,
                          by1,
                          bx2,
                          by2,
                          bx3,
                          by3,
                          bx4,
                          by4,
                        );
                      }
                    }
                  }
                }
              }
              // 有重合的，重合线段已经求好，直接使用
              if (overs) {
                // console.log('overs', i, overs, '\n', seg.toString(), '\n', item.toString())
                seg.isDeleted = item.isDeleted = true;
                activeNewSeg(segments, list, ael, x, overs.ra);
                activeNewSeg(segments, list, ael, x, overs.rb);
                ael.splice(i, 1);
                break;
              }
              // 有交点，确保原先线段方向顺序（x升序、y升序），各自依次切割，x右侧新线段也要存入list
              else if (inters && inters.length) {
                // 精度取整并去重结果
                /**
                 * 特殊检查，当只有一方需要切割时，说明交点在另一方端点上，但是由于精度问题，导致这个点坐标不和那个端点数据一致，
                 * 且进一步为了让点的引用一致，也应该直接使用这个已存在的端点易用
                 * 另外可能交点就是二者共同的端点，此时认为相连而不是相交
                 */
                for (let i = inters.length - 1; i >= 0; i--) {
                  const pt = inters[i];
                  if (pt.point.equal(coordsA[0])) {
                    if (pt.point.equal(coordsB[0])) {
                      inters.splice(i, 1);
                    }
                    else if (pt.point.equal(coordsB[lenB - 1])) {
                      inters.splice(i, 1);
                    }
                    else {
                      pt.point = coordsA[0];
                    }
                  }
                  else if (pt.point.equal(coordsA[lenA - 1])) {
                    if (pt.point.equal(coordsB[0])) {
                      inters.splice(i, 1);
                    }
                    else if (pt.point.equal(coordsB[lenB - 1])) {
                      inters.splice(i, 1);
                    }
                    else {
                      pt.point = coordsA[lenA - 1];
                    }
                  }
                  else if (pt.point.equal(coordsB[0])) {
                    pt.point = coordsB[0];
                  }
                  else if (pt.point.equal(coordsB[lenB - 1])) {
                    pt.point = coordsB[lenB - 1];
                  }
                }
                if (inters.length) {
                  // console.log('inters', i, inters.map(item => {
                  //   return item.point.toString() + ' ' + item.toSource + ',' + item.toClip;
                  // }), '\n', seg.toString(), '\n', item.toString());
                  const pa = sortIntersection(inters!, !isSourceReverted);
                  // console.log(pa.length === 1 ? pa[0] : pa);
                  const pb = sortIntersection(inters!, isSourceReverted);
                  // console.log(pb.length === 1 ? pb[0] : pb);
                  let ra = sliceSegment(seg, pa, isIntermediateA && belong === 0);
                  // console.log('ra', ra.map(item => item.toString()));
                  let rb = sliceSegment(item, pb, isIntermediateB && belong === 1);
                  // console.log('rb', rb.map(item => item.toString()));
                  // 新切割的线段继续按照坐标存入列表以及ael，为后续求交
                  if (ra.length) {
                    activeNewSeg(segments, list, ael, x, ra);
                  }
                  // 老的线段被删除无效了，踢出ael，防止seg没被分割
                  if (rb.length) {
                    activeNewSeg(segments, list, ael, x, rb);
                    ael.splice(i--, 1);
                  }
                  if (ra.length) {
                    break;
                  }
                }
              }
            }
          }
        }
        // 不相交切割才进入ael
        if (!seg.isDeleted) {
          ael.push(seg);
          seg.isVisited = true;
        }
        // console.log(ael.map(item => item.toString()));
      }
    }
  }
  // 最后面的线
  delList.forEach((seg) => {
    if (!seg.isDeleted && segments.indexOf(seg) === -1) {
      segments.push(seg);
    }
  });
  // 最后面新产生的竖线可能不进扫描循环
  ael.forEach((seg) => {
    if (!seg.isDeleted && segments.indexOf(seg) === -1) {
      segments.push(seg);
    }
  });
  // 最后再过滤一遍，因为新生成的切割线可能会被再次切割变成删除的无效线段
  return segments.filter((item) => !item.isDeleted);
}

// 给定交点列表分割线段，ps切割点需排好顺序从头到尾，切割后的线段坐标需特别注意，
// 因为精度的问题，可能切割点并不是十分严格的在线段上，从而造成不是按x增量排序的
function sliceSegment(seg: Segment, ps: { point: Point, t: number }[], isIntermediate: boolean) {
  const res: Segment[] = [];
  if (!ps.length) {
    return res;
  }
  const belong = seg.belong,
    coords = seg.coords,
    len = coords.length;
  let startPoint = coords[0];
  let lastT = 0;
  // 多个点可能截取多条，最后一条保留只修改数据，其它新生成
  ps.forEach((item) => {
    const point = item.point,
      t = item.t;
    // 和端点相同忽略
    if (point.equal(startPoint)) {
      return;
    }
    let ns: Segment;
    if (len === 2) {
      if (Point.compare(startPoint, point)) {
        ns = new Segment([point, startPoint], belong);
      }
      else {
        ns = new Segment([startPoint, point], belong);
      }
    }
    else if (len === 3) {
      const c = bezier.sliceBezier(coords, lastT, t).map(item => {
        return {
          x: Math.round(item.x),
          y: Math.round(item.y),
        };
      });
      if (Point.compare(startPoint, point)) {
        ns = new Segment(
          [
            point,
            new Point(c[1].x, c[1].y),
            startPoint,
          ],
          belong,
        );
      }
      else {
        ns = new Segment(
          [
            startPoint,
            new Point(c[1].x, c[1].y),
            point,
          ],
          belong,
        );
      }
    }
    else if (len === 4) {
      const c = bezier.sliceBezier(coords, lastT, t).map(item => {
        return {
          x: Math.round(item.x),
          y: Math.round(item.y),
        };
      });
      if (Point.compare(startPoint, point)) {
        ns = new Segment(
          [
            point,
            new Point(c[2].x, c[2].y),
            new Point(c[1].x, c[1].y),
            startPoint,
          ],
          belong,
        );
      }
      else {
        ns = new Segment(
          [
            startPoint,
            new Point(c[1].x, c[1].y),
            new Point(c[2].x, c[2].y),
            point,
          ],
          belong,
        );
      }
    }
    // 连续操作的中间结果已有自己内外性，截取时需继承
    if (isIntermediate) {
      ns!.myFill[0] = seg.myFill[0];
      ns!.myFill[1] = seg.myFill[1];
    }
    startPoint = point;
    res.push(ns!);
    lastT = t;
  });
  // 最后一条
  let ns: Segment;
  if (!startPoint.equal(coords[coords.length - 1])) {
    if (len === 2) {
      if (Point.compare(startPoint, coords[1])) {
        ns = new Segment([coords[1], startPoint], belong);
      }
      else {
        ns = new Segment([startPoint, coords[1]], belong);
      }
    }
    else if (len === 3) {
      const c = bezier.sliceBezier(coords, lastT, 1).map(item => {
        return {
          x: Math.round(item.x),
          y: Math.round(item.y),
        };
      });
      if (Point.compare(startPoint, coords[2])) {
        ns = new Segment(
          [
            coords[2],
            new Point(c[1].x, c[1].y),
            startPoint,
          ],
          belong,
        );
      }
      else {
        ns = new Segment(
          [
            startPoint,
            new Point(c[1].x, c[1].y),
            coords[2],
          ],
          belong,
        );
      }
    }
    else if (len === 4) {
      const c = bezier.sliceBezier(coords, lastT, 1).map(item => {
        return {
          x: Math.round(item.x),
          y: Math.round(item.y),
        };
      });
      if (Point.compare(startPoint, coords[3])) {
        ns = new Segment(
          [
            coords[3],
            new Point(c[2].x, c[2].y),
            new Point(c[1].x, c[1].y),
            startPoint,
          ],
          belong,
        );
      }
      else {
        ns = new Segment(
          [
            startPoint,
            new Point(c[1].x, c[1].y),
            new Point(c[2].x, c[2].y),
            coords[3],
          ],
          belong,
        );
      }
    }
    if (isIntermediate) {
      ns!.myFill[0] = seg.myFill[0];
      ns!.myFill[1] = seg.myFill[1];
    }
    res.push(ns!);
  }
  // 老的打标失效删除，只有1条说明裁剪无效
  if (res.length > 1) {
    seg.isDeleted = true;
    return res;
  }
  return [];
  // res.length && (seg.isDeleted = true);
  // return res;
}

// 相交的线段slice成多条后，老的删除，新的考虑添加进扫描列表和活动边列表，根据新的是否在范围内
function activeNewSeg(
  segments: Segment[],
  list: any[],
  ael: Segment[],
  x: number,
  ns: Segment[],
) {
  ns.forEach((seg) => {
    const coords = seg.coords;
    const p1 = coords[0];
    const p2 = coords[coords.length - 1];
    let x1 = p1.x, x2 = p2.x;
    if (x1 > x2) {
      [x1, x2] = [x2, x1];
    }
    // 活跃x之前无相交判断意义，除了竖线，因为非竖线发生过相交的话不会再交了，竖线则有可能再次被别的左侧端点交
    if (x2 <= x && x1 !== x2) {
      segments.push(seg);
      return;
    }
    // 竖线很特殊，需判断之前是否存在，有可能会重复
    if (x1 === x2) {
      for (let i = ael.length - 1; i >= 0; i--) {
        const item = ael[i];
        if (seg.equal(item) && !item.isDeleted) {
          if (seg.belong === item.belong) {
            item.myCoincide++;
          }
          else {
            item.otherCoincide++;
          }
          return;
        }
      }
    }
    // 按顺序放在list的正确位置，可能x1已经过去不需要加入了，但要考虑ael
    let i = 0;
    if (x1 < x) {
      seg.isVisited = true;
      ael.push(seg);
    }
    // 特殊情况，形成的新的竖线恰好是末尾
    else if (!list.length) {
      ael.push(seg);
    }
    else {
      for (let len = list.length; i < len; i++) {
        const item = list[i];
        const lx = item.x;
        if (x1 === lx) {
          item.arr.push(seg);
          // 特例，新的竖线正好是当前x
          if (x1 === x2 && x1 === x) {
            ael.push(seg);
          }
          break;
        }
        // 新的插入
        if (x1 < lx) {
          const temp = {
            x: x1,
            arr: [seg],
          };
          // 特例，新的竖线正好是当前x
          if (x1 === x2 && x1 === x) {
            ael.push(seg);
          }
          list.splice(i, 0, temp);
          break;
        }
      }
    }
    // x2一定会加入
    for (let len = list.length; i < len; i++) {
      const item = list[i];
      const lx = item.x;
      if (x2 === lx) {
        // 访问过的尽可能排在前面早出栈，减少对比次数
        item.arr.unshift(seg);
        break;
      }
      if (x2 < lx) {
        const temp = {
          x: x2,
          arr: [seg],
        };
        list.splice(i, 0, temp);
        break;
      }
    }
  });
}

// 按x升序将所有线段组成一个垂直扫描线列表，求交用，y方向不用管
function genHashXList(segments: Segment[]) {
  const hashX: any = {};
  segments.forEach((seg) => {
    const coords = seg.coords;
    const p1 = coords[0];
    const p2 = coords[coords.length - 1];
    let min = p1.x, max = p2.x;
    if (min > max) {
      [min, max] = [max, min];
    }
    putHashX(hashX, min, seg);
    putHashX(hashX, max, seg);
  });
  const list: Array<{ x: number; arr: Segment[] }> = [];
  Object.keys(hashX).forEach((x) =>
    list.push({
      x: parseFloat(x),
      arr: hashX[x],
    }),
  );
  return list.sort(function (a, b) {
    return a.x - b.x;
  });
}

// 每个线段会放2次，开始点和结束点，哪怕x相同，第1次是开始用push，第2次结束unshift，这样离开时排在前面
function putHashX(hashX: any, x: number, seg: Segment) {
  const list = (hashX[x] = hashX[x] || []);
  if (seg.isVisited) {
    list.unshift(seg);
    seg.isVisited = false;
  }
  else {
    list.push(seg);
    seg.isVisited = true;
  }
}

// 按x升序将所有线段组成一个垂直扫描线列表，y方向也需要判断
function genHashXYList(segments: Segment[]) {
  const hashXY: any = {};
  segments.forEach((seg) => {
    const coords = seg.coords,
      l = coords.length;
    const start = coords[0],
      end = coords[l - 1];
    putHashXY(hashXY, start.x, start.y, seg, true);
    putHashXY(hashXY, end.x, end.y, seg, false);
  });
  const listX: Array<{
    x: number;
    arr: Array<{ y: number; arr: Array<{ isStart: boolean; seg: Segment }> }>;
  }> = [];
  Object.keys(hashXY).forEach((x) => {
    const hashY = hashXY[x];
    const listY: Array<{
      y: number;
      arr: Array<{ isStart: boolean; seg: Segment }>;
    }> = [];
    Object.keys(hashY).forEach((y) => {
      const arr = hashY[y].sort(function (
        a: {
          isStart: boolean;
          seg: Segment;
        },
        b: {
          isStart: boolean;
          seg: Segment;
        },
      ) {
        // end优先于start先触发
        if (a.isStart !== b.isStart) {
          return a.isStart ? 1 : -1;
        }
        // start点相同看谁在上谁在下，下方在前，比y极大值，因为start相同又不相交，所以上方的y极值更大
        if (a.isStart) {
          return segAboveCompare(a.seg, b.seg) ? 1 : -1;
        }
        return 0;
        // end点相同无所谓，其不参与运算，因为每次end线段先出栈ael
      });
      // console.log(x, y, arr.map(item => item.isStart + ', ' + item.seg.toString()));
      listY.push({
        y: parseFloat(y),
        arr,
      });
    });
    listX.push({
      x: parseFloat(x),
      arr: listY.sort(function (a, b) {
        return a.y - b.y;
      }),
    });
  });
  listX.sort(function (a, b) {
    return a.x - b.x;
  });
  let list: Array<{ isStart: boolean; seg: Segment }> = [];
  listX.forEach((item) => {
    item.arr.forEach((item) => {
      list = list.concat(item.arr);
    });
  });
  return list;
}

function putHashXY(
  hashXY: any,
  x: number,
  y: number,
  seg: Segment,
  isStart: boolean,
) {
  const hash = (hashXY[x] = hashXY[x] || {});
  const list = (hash[y] = hash[y] || []);
  list.push({
    isStart,
    seg,
  });
}

// pt在线段left -> right的上方或线上
function pointAboveOrOnLine(pt: Point, left: Point, right: Point) {
  const { x, y } = pt;
  const { x: x1, y: y1 } = left;
  const { x: x2, y: y2 } = right;
  return vector.crossProduct(x1 - x, y1 - y, x2 - x, y2 - y) >= 0;
}

// a是否在b的上边，取x相同部分看y大小，只有start点事件时才判断
function segAboveCompare(segA: Segment, segB: Segment) {
  const ca = segA.coords,
    cb = segB.coords;
  const la = ca.length,
    lb = cb.length;
  const a1 = ca[0],
    b1 = cb[0];
  // 两条直线用向量积判断，注意开始点是否相同即可
  if (la === 2 && lb === 2) {
    const a2 = ca[1],
      b2 = cb[1];
    if (a1.equal(b1)) {
      return pointAboveOrOnLine(a2, b1, b2);
    }
    else {
      return pointAboveOrOnLine(a1, b1, b2);
    }
  }
  // a是竖线的话，另外一条（一定是曲线）如果相连，特殊判断看在左在右，注意相连不可能出现a首b尾的情况
  if (la === 2 && a1.x === ca[1].x) {
    if (a1.equal(b1)) {
      // b只可能首相连，尾的会end优先出栈进不来
      return true;
    }
    else if (ca[la - 1].equal(b1)) {
      return true;
    }
    else if (ca[la - 1].equal(cb[lb - 1])) {
      return false;
    }
  }
  // b是竖线同上，但只可能a和b首相连
  if (lb === 2 && b1.x === cb[1].x) {
    if (a1.equal(b1)) {
      return false;
    }
  }
  // 如果有曲线，取二者x共同的区域部分[x1, x3]，以及区域中点x2，这3个点不可能都重合，一定会有某点的y比较大小
  const x1 = Math.max(a1.x, b1.x),
    x3 = Math.min(ca[la - 1].x, cb[lb - 1].x),
    x2 = x1 + (x3 - x1) * 0.5;
  if (!a1.equal(b1)) {
    const y1 = getYByX(ca, x1)!,
      y2 = getYByX(cb, x1)!;
    if (y1 !== y2) {
      return y1 > y2;
    }
  }
  const y1 = getYByX(ca, x2)!,
    y2 = getYByX(cb, x2)!;
  if (y1 !== y2) {
    return y1 > y2;
  }
  // 一般开始点和中间点就不会相同了，否则就是重合或相交，这里末尾点再判断下兜个底，曲线曾经出现过一个特例，末尾点判断的上下性反了，所以放在最后
  if (!ca[la - 1].equal(cb[lb - 1])) {
    const y1 = getYByX(ca, x3)!,
      y2 = getYByX(cb, x3)!;
    if (y1 !== y2) {
      return y1 > y2;
    }
  }
  return false;
}

// 根据x的值解得t后获取y，由于线段已经x单调，所以解只会有1个而非多个
function getYByX(coords: Point[], x: number) {
  const len = coords.length;
  if (x === coords[0].x) {
    return coords[0].y;
  }
  if (x === coords[len - 1].x) {
    return coords[len - 1].y;
  }
  if (len === 2) {
    if (coords[0].y === coords[1].y) {
      return coords[0].y;
    }
    const p = (x - coords[0].x) / (coords[1].x - coords[0].x);
    return coords[0].y + p * (coords[1].y - coords[0].y);
  }
  else if (len === 3) {
    const t = equation
      .getRoots([
        coords[0].x - x,
        2 * (coords[1].x - coords[0].x),
        coords[2].x + coords[0].x - 2 * coords[1].x,
      ])
      .filter((i) => i >= 0 && i <= 1);
    return bezier.getPointByT(coords, t[0])!.y;
  }
  else if (len === 4) {
    const t = equation
      .getRoots([
        coords[0].x - x,
        3 * (coords[1].x - coords[0].x),
        3 * (coords[2].x + coords[0].x - 2 * coords[1].x),
        coords[3].x + 3 * coords[1].x - coords[0].x - 3 * coords[2].x,
      ])
      .filter((i) => i >= 0 && i <= 1);
    return bezier.getPointByT(coords, t[0])!.y;
  }
}

function isRectsOverlap(
  bboxA: number[],
  bboxB: number[],
  lenA: number,
  lenB: number,
) {
  if (lenA === 2 && lenB === 2) {
    // 2条垂线特殊考虑，此时x范围都是0，只能比较y
    if (
      bboxA[0] === bboxA[2] &&
      bboxB[0] === bboxB[2] &&
      bboxA[0] === bboxA[2]
    ) {
      if (bboxA[1] >= bboxB[3] || bboxB[1] >= bboxA[3]) {
        return false;
      }
      return true;
    }
    // 2条水平线也是
    if (
      bboxA[1] === bboxA[3] &&
      bboxB[1] === bboxB[3] &&
      bboxA[1] === bboxA[3]
    ) {
      if (bboxA[0] >= bboxB[2] || bboxB[0] >= bboxA[2]) {
        return false;
      }
      return true;
    }
  }
  return geom.isRectsOverlap(
    bboxA[0],
    bboxA[1],
    bboxA[2],
    bboxA[3],
    bboxB[0],
    bboxB[1],
    bboxB[2],
    bboxB[3],
    true,
  );
}

function checkOverlapLine(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  segA: Segment,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
  segB: Segment,
  isV: boolean,
) {
  const ra = [],
    rb = [];
  const coordsA = segA.coords,
    coordsB = segB.coords;
  if ((ax1 < bx1 && !isV) || (ay1 < by1 && isV)) {
    ra.push(new Segment([coordsA[0], coordsB[0]], segA.belong));
    if ((ax2 < bx2 && !isV) || (ay2 < by2 && isV)) {
      ra.push(new Segment([coordsB[0], coordsA[1]], segA.belong));
      rb.push(new Segment([coordsB[0], coordsA[1]], segB.belong));
      rb.push(new Segment([coordsA[1], coordsB[1]], segB.belong));
    }
    else if ((ax2 === bx2 && !isV) || (ay2 === by2 && isV)) {
      ra.push(new Segment([coordsB[0], coordsB[1]], segA.belong));
      rb.push(new Segment([coordsB[0], coordsB[1]], segB.belong));
    }
    else {
      ra.push(new Segment([coordsB[0], coordsB[1]], segA.belong));
      rb.push(new Segment([coordsB[0], coordsB[1]], segB.belong));
      ra.push(new Segment([coordsB[1], coordsA[1]], segA.belong));
    }
  }
  // 不会出现完全重合即ax2 == bx2
  else if ((ax1 === bx1 && !isV) || (ay1 === by1 && isV)) {
    if ((ax2 < bx2 && !isV) || (ay2 < by2 && isV)) {
      ra.push(new Segment([coordsA[0], coordsA[1]], segA.belong));
      rb.push(new Segment([coordsA[0], coordsA[1]], segB.belong));
      rb.push(new Segment([coordsA[1], coordsB[1]], segB.belong));
    }
    else {
      ra.push(new Segment([coordsB[0], coordsB[1]], segA.belong));
      ra.push(new Segment([coordsB[1], coordsA[1]], segA.belong));
      rb.push(new Segment([coordsB[0], coordsB[1]], segB.belong));
    }
  }
  // ax1 > bx1
  else {
    rb.push(new Segment([coordsB[0], coordsA[0]], segB.belong));
    if ((ax2 < bx2 && !isV) || (ay2 < by2 && isV)) {
      ra.push(new Segment([coordsA[0], coordsA[1]], segA.belong));
      rb.push(new Segment([coordsA[0], coordsA[1]], segB.belong));
      rb.push(new Segment([coordsA[1], coordsB[1]], segB.belong));
    }
    else if ((ax2 === bx2 && !isV) || (ay2 === by2 && isV)) {
      ra.push(new Segment([coordsA[0], coordsA[1]], segA.belong));
      rb.push(new Segment([coordsA[0], coordsA[1]], segB.belong));
    }
    else {
      ra.push(new Segment([coordsA[0], coordsB[1]], segA.belong));
      rb.push(new Segment([coordsA[0], coordsB[1]], segB.belong));
      ra.push(new Segment([coordsB[1], coordsA[1]], segA.belong));
    }
  }
  return {
    ra,
    rb,
  };
}

function checkOverlapBezier(segA: Segment, segB: Segment) {
  const ca = segA.coords,
    la = ca.length;
  const cb = segB.coords,
    lb = cb.length;
  const firstA = ca[0],
    firstB = cb[0],
    lastA = ca[la - 1],
    lastB = cb[lb - 1];
  const t1 = bezier.getPointT(ca, firstB.x, firstB.y);
  const t2 = bezier.getPointT(ca, lastB.x, lastB.y);
  const t3 = bezier.getPointT(cb, firstA.x, firstA.y);
  const t4 = bezier.getPointT(cb, lastA.x, lastA.y);
  // console.warn(segA.toString());console.warn(segB.toString());
  // console.log(t1, t2, t3, t4);
  const l1 = t1.length,
    l2 = t2.length,
    l3 = t3.length,
    l4 = t4.length;
  /**
   * 重合有3种情况，对应4个t（每方各2个）的情况不同：
   * a. 一个包含另外一个，这样其中一方t为空，另一方t为2个即两个端点各1
   * b. 一对端点重合另外一侧包含，比上面的t多1个即空的那方t多1
   * c. 普通部分重合，每方各有1个t
   */
  const conditionA =
    (l1 === 1 && l2 === 1 && l3 === 0 && l4 === 0) ||
    (l1 === 0 && l2 === 0 && l3 === 1 && l4 === 1);
  const conditionB =
    (l1 === 1 && l2 === 1 && l3 + l4 === 1) ||
    (l1 + l2 === 1 && l3 === 1 && l4 === 1);
  const conditionC = l1 + l2 === 1 && l3 + l4 === 1;
  if (conditionA || conditionB || conditionC) {
    const startA = l1 ? t1[0] : 0;
    const endA = l2 ? t2[0] : 1;
    const a = bezier.sliceBezier(ca, startA, endA);
    const startB = l3 ? t3[0] : 0;
    const endB = l4 ? t4[0] : 1;
    const b = bezier.sliceBezier(cb, startB, endB);
    // console.log(startA, endA, startB, endB);
    // 确定重合之后就是截取，重合一定出现在左右的中间部分，这样只要分别判断左右两端是否需要各自裁剪即可
    if (equalBezier(a, b)) {
      const over = a.map((item) => new Point(item.x, item.y));
      // console.log(over);
      const ra = [],
        rb = [];
      if (startA > 0) {
        const s = bezier.sliceBezier(ca, 0, startA);
        const arr = [segA.coords[0], new Point(s[1].x, s[1].y), segB.coords[0]];
        if (la === 4) {
          arr.splice(2, 0, new Point(s[2].x, s[2].y));
        }
        ra.push(new Segment(arr, segA.belong));
      }
      ra.push(new Segment(over, segA.belong)); // 重合的部分
      if (endA < 1) {
        const s = bezier.sliceBezier(ca, endA, 1);
        const arr = [
          segB.coords[lb - 1],
          new Point(s[1].x, s[1].y),
          segA.coords[la - 1],
        ];
        if (la === 4) {
          arr.splice(2, 0, new Point(s[2].x, s[2].y));
        }
        ra.push(new Segment(arr, segA.belong));
      }
      if (startB > 0) {
        const s = bezier.sliceBezier(cb, 0, startB);
        const arr = [segB.coords[0], new Point(s[1].x, s[1].y), segA.coords[0]];
        if (lb === 4) {
          arr.splice(2, 0, new Point(s[2].x, s[2].y));
        }
        rb.push(new Segment(arr, segB.belong));
      }
      rb.push(new Segment(over, segB.belong)); // 重合的部分
      if (endB < 1) {
        const s = bezier.sliceBezier(cb, endB, 1);
        const arr = [
          segA.coords[la - 1],
          new Point(s[1].x, s[1].y),
          segB.coords[lb - 1],
        ];
        if (lb === 4) {
          arr.splice(2, 0, new Point(s[2].x, s[2].y));
        }
        rb.push(new Segment(arr, segB.belong));
      }
      // console.log(ra.map(item => item.toString()));
      // console.log(rb.map(item => item.toString()));
      return {
        ra,
        rb,
      };
    }
  }
}

function equalBezier(
  a: Array<{ x: number; y: number }>,
  b: Array<{ x: number; y: number }>,
) {
  for (let i = 0, len = a.length; i < len; i++) {
    const ai = a[i],
      bi = b[i];
    if (Math.abs(ai.x - bi.x) > 1e-9 || Math.abs(ai.y - bi.y) > 1e-9) {
      return false;
    }
  }
  return true;
}

export default Polygon;
