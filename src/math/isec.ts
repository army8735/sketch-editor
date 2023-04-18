import equation from './equation';
import vector from './vector';

type Point = {
  x: number,
  y: number,
};

type Point3 = {
  x: number,
  y: number,
  z: number,
};

const getRoots = equation.getRoots;
const { unitize3, crossProduct3, dotProduct3, isParallel3, length3 } = vector;

// 两个三次方程组的数值解.9阶的多项式方程,可以最多有9个实根(两个S形曲线的情况)
// 两个三次方程组无法解析表示，只能数值计算
// 参考：https://mat.polsl.pl/sjpam/zeszyty/z6/Silesian_J_Pure_Appl_Math_v6_i1_str_155-176.pdf
const TOLERANCE = 1e-6;
const ACCURACY = 6;

/**
 * 获取求导之后的系数
 * @param coefs
 */
function getDerivativeCoefs(coefs: Array<number>) {
  const derivative = [];
  for (let i = 1; i < coefs.length; i++) {
    derivative.push(i * coefs[i]);
  }
  return derivative;
}

/**
 * 评估函数
 * @param x
 * @param coefs
 * @return {number}
 */
function evaluate(x: number, coefs: Array<number>) {
  let result = 0;
  for (let i = coefs.length - 1; i >= 0; i--) {
    result = result * x + coefs[i];
  }
  return result;
}

function bisection(min: number, max: number, coefs: Array<number>) {
  let minValue = evaluate(min, coefs);
  let maxValue = evaluate(max, coefs);
  let result;
  if (Math.abs(minValue) <= TOLERANCE) {
    result = min;
  }
  else if (Math.abs(maxValue) <= TOLERANCE) {
    result = max;
  }
  else if (minValue * maxValue <= 0) {
    const tmp1 = Math.log(max - min);
    const tmp2 = Math.LN10 * ACCURACY;
    const iters = Math.ceil((tmp1 + tmp2) / Math.LN2);
    for (let i = 0; i < iters; i++) {
      result = 0.5 * (min + max);
      const value = evaluate(result, coefs);

      if (Math.abs(value) <= TOLERANCE) {
        break;
      }

      if (value * minValue < 0) {
        max = result;
        maxValue = value;
      }
      else {
        min = result;
        minValue = value;
      }
    }

  }
  return result;
}

function getRootsInInterval(min: number, max: number, coefs: Array<number>) {
  // console.log('getRootsInInterval', coefs);
  const roots = [];
  let root;
  const degree = coefs.length - 1;
  if (degree === 1) {
    root = bisection(min, max, coefs);
    if (root !== undefined) {
      roots.push(root);
    }
  }
  else {
    const derivativeCoefs = getDerivativeCoefs(coefs);
    const droots = getRootsInInterval(min, max, derivativeCoefs);

    if (droots.length > 0) {
      // find root on [min, droots[0]]
      root = bisection(min, droots[0], coefs);
      if (root !== undefined) {
        roots.push(root);
      }
      // find root on [droots[i],droots[i+1]] for 0 <= i <= count-2
      for (let i = 0; i <= droots.length - 2; i++) {
        root = bisection(droots[i], droots[i + 1], coefs);
        if (root !== undefined) {
          roots.push(root);
        }
      }

      // find root on [droots[count-1],xmax]
      root = bisection(droots[droots.length - 1], max, coefs);
      if (root !== undefined) {
        roots.push(root);
      }
    }
    else {
      // polynomial is monotone on [min,max], has at most one root
      root = bisection(min, max, coefs);
      if (root !== undefined) {
        roots.push(root);
      }
    }
  }
  return roots;
}

/**
 * 二阶贝塞尔曲线 与 二阶贝塞尔曲线 交点
 * @return {[]}
 */
function intersectBezier2Bezier2(ax1: number, ay1: number, ax2: number, ay2: number, ax3: number, ay3: number,
                                 bx1: number, by1: number, bx2: number, by2: number, bx3: number, by3: number) {
  let c12, c11, c10;
  let c22, c21, c20;

  const result = [];

  c12 = {
    x: ax1 - 2 * ax2 + ax3,
    y: ay1 - 2 * ay2 + ay3,
  };

  c11 = {
    x: 2 * ax2 - 2 * ax1,
    y: 2 * ay2 - 2 * ay1,
  };
  c10 = { x: ax1, y: ay1 };
  c22 = {
    x: bx1 - 2 * bx2 + bx3,
    y: by1 - 2 * by2 + by3,
  };
  c21 = {
    x: 2 * bx2 - 2 * bx1,
    y: 2 * by2 - 2 * by1,
  };
  c20 = { x: bx1, y: by1 };

  let coefs;

  if (c12.y === 0) {
    const v0 = c12.x * (c10.y - c20.y);
    const v1 = v0 - c11.x * c11.y;
    // let v2 = v0 + v1;
    const v3 = c11.y * c11.y;

    coefs = [
      c12.x * c22.y * c22.y,
      2 * c12.x * c21.y * c22.y,
      c12.x * c21.y * c21.y - c22.x * v3 - c22.y * v0 - c22.y * v1,
      -c21.x * v3 - c21.y * v0 - c21.y * v1,
      (c10.x - c20.x) * v3 + (c10.y - c20.y) * v1
    ].reverse();
  }
  else {
    const v0 = c12.x * c22.y - c12.y * c22.x;
    const v1 = c12.x * c21.y - c21.x * c12.y;
    const v2 = c11.x * c12.y - c11.y * c12.x;
    const v3 = c10.y - c20.y;
    const v4 = c12.y * (c10.x - c20.x) - c12.x * v3;
    const v5 = -c11.y * v2 + c12.y * v4;
    const v6 = v2 * v2;
    coefs = [
      v0 * v0,
      2 * v0 * v1,
      (-c22.y * v6 + c12.y * v1 * v1 + c12.y * v0 * v4 + v0 * v5) / c12.y,
      (-c21.y * v6 + c12.y * v1 * v4 + v1 * v5) / c12.y,
      (v3 * v6 + v4 * v5) / c12.y
    ].reverse();
  }

  const roots = getRoots(coefs);

  for (let i = 0; i < roots.length; i++) {
    const s = roots[i];

    if (0 <= s && s <= 1) {
      const xRoots = getRoots([c12.x, c11.x, c10.x - c20.x - s * c21.x - s * s * c22.x].reverse());

      const yRoots = getRoots([c12.y, c11.y, c10.y - c20.y - s * c21.y - s * s * c22.y].reverse());

      if (xRoots.length > 0 && yRoots.length > 0) {
        const TOLERANCE = 1e-4;

        checkRoots:
          for (let j = 0; j < xRoots.length; j++) {
            const xRoot = xRoots[j];

            if (0 <= xRoot && xRoot <= 1) {
              for (let k = 0; k < yRoots.length; k++) {
                if (Math.abs(xRoot - yRoots[k]) < TOLERANCE) {
                  const x = c22.x * s * s + c21.x * s + c20.x;
                  const y = c22.y * s * s + c21.y * s + c20.y;
                  result.push({ x, y, t: xRoot });
                  // result.push(c22.multiply(s * s).add(c21.multiply(s).add(c20)));
                  break checkRoots;
                }
              }
            }
          }
      }
    }
  }
  return result;
}

function intersectBezier3Bezier3(ax1: number, ay1: number, ax2: number, ay2: number, ax3: number, ay3: number, ax4: number, ay4: number,
                                 bx1: number, by1: number, bx2: number, by2: number, bx3: number, by3: number, bx4: number, by4: number) {
  let c13, c12, c11, c10; // 三阶系数
  let c23, c22, c21, c20;

  const result = [];

  c13 = {
    x: -ax1 + 3 * ax2 - 3 * ax3 + ax4,
    y: -ay1 + 3 * ay2 - 3 * ay3 + ay4,
  };

  c12 = {
    x: 3 * ax1 - 6 * ax2 + 3 * ax3,
    y: 3 * ay1 - 6 * ay2 + 3 * ay3,
  };

  c11 = {
    x: -3 * ax1 + 3 * ax2,
    y: -3 * ay1 + 3 * ay2,
  };

  c10 = { x: ax1, y: ay1 };

  c23 = {
    x: -bx1 + 3 * bx2 - 3 * bx3 + bx4,
    y: -by1 + 3 * by2 - 3 * by3 + by4,
  };

  c22 = {
    x: 3 * bx1 - 6 * bx2 + 3 * bx3,
    y: 3 * by1 - 6 * by2 + 3 * by3,
  };

  c21 = {
    x: -3 * bx1 + 3 * bx2,
    y: -3 * by1 + 3 * by2,
  };

  c20 = { x: bx1, y: by1 };

  const c10x2 = c10.x * c10.x;
  const c10x3 = c10.x * c10.x * c10.x;
  const c10y2 = c10.y * c10.y;
  const c10y3 = c10.y * c10.y * c10.y;
  const c11x2 = c11.x * c11.x;
  const c11x3 = c11.x * c11.x * c11.x;
  const c11y2 = c11.y * c11.y;
  const c11y3 = c11.y * c11.y * c11.y;
  const c12x2 = c12.x * c12.x;
  const c12x3 = c12.x * c12.x * c12.x;
  const c12y2 = c12.y * c12.y;
  const c12y3 = c12.y * c12.y * c12.y;
  const c13x2 = c13.x * c13.x;
  const c13x3 = c13.x * c13.x * c13.x;
  const c13y2 = c13.y * c13.y;
  const c13y3 = c13.y * c13.y * c13.y;
  const c20x2 = c20.x * c20.x;
  const c20x3 = c20.x * c20.x * c20.x;
  const c20y2 = c20.y * c20.y;
  const c20y3 = c20.y * c20.y * c20.y;
  const c21x2 = c21.x * c21.x;
  const c21x3 = c21.x * c21.x * c21.x;
  const c21y2 = c21.y * c21.y;
  const c22x2 = c22.x * c22.x;
  const c22x3 = c22.x * c22.x * c22.x;
  const c22y2 = c22.y * c22.y;
  const c23x2 = c23.x * c23.x;
  const c23x3 = c23.x * c23.x * c23.x;
  const c23y2 = c23.y * c23.y;
  const c23y3 = c23.y * c23.y * c23.y;

  const coefs = [-c13x3 * c23y3 + c13y3 * c23x3 - 3 * c13.x * c13y2 * c23x2 * c23.y +
  3 * c13x2 * c13.y * c23.x * c23y2,
    -6 * c13.x * c22.x * c13y2 * c23.x * c23.y + 6 * c13x2 * c13.y * c22.y * c23.x * c23.y + 3 * c22.x * c13y3 * c23x2 -
    3 * c13x3 * c22.y * c23y2 - 3 * c13.x * c13y2 * c22.y * c23x2 + 3 * c13x2 * c22.x * c13.y * c23y2,
    -6 * c21.x * c13.x * c13y2 * c23.x * c23.y - 6 * c13.x * c22.x * c13y2 * c22.y * c23.x + 6 * c13x2 * c22.x * c13.y * c22.y * c23.y +
    3 * c21.x * c13y3 * c23x2 + 3 * c22x2 * c13y3 * c23.x + 3 * c21.x * c13x2 * c13.y * c23y2 - 3 * c13.x * c21.y * c13y2 * c23x2 -
    3 * c13.x * c22x2 * c13y2 * c23.y + c13x2 * c13.y * c23.x * (6 * c21.y * c23.y + 3 * c22y2) + c13x3 * (-c21.y * c23y2 -
      2 * c22y2 * c23.y - c23.y * (2 * c21.y * c23.y + c22y2)),
    c11.x * c12.y * c13.x * c13.y * c23.x * c23.y - c11.y * c12.x * c13.x * c13.y * c23.x * c23.y + 6 * c21.x * c22.x * c13y3 * c23.x +
    3 * c11.x * c12.x * c13.x * c13.y * c23y2 + 6 * c10.x * c13.x * c13y2 * c23.x * c23.y - 3 * c11.x * c12.x * c13y2 * c23.x * c23.y -
    3 * c11.y * c12.y * c13.x * c13.y * c23x2 - 6 * c10.y * c13x2 * c13.y * c23.x * c23.y - 6 * c20.x * c13.x * c13y2 * c23.x * c23.y +
    3 * c11.y * c12.y * c13x2 * c23.x * c23.y - 2 * c12.x * c12y2 * c13.x * c23.x * c23.y - 6 * c21.x * c13.x * c22.x * c13y2 * c23.y -
    6 * c21.x * c13.x * c13y2 * c22.y * c23.x - 6 * c13.x * c21.y * c22.x * c13y2 * c23.x + 6 * c21.x * c13x2 * c13.y * c22.y * c23.y +
    2 * c12x2 * c12.y * c13.y * c23.x * c23.y + c22x3 * c13y3 - 3 * c10.x * c13y3 * c23x2 + 3 * c10.y * c13x3 * c23y2 +
    3 * c20.x * c13y3 * c23x2 + c12y3 * c13.x * c23x2 - c12x3 * c13.y * c23y2 - 3 * c10.x * c13x2 * c13.y * c23y2 +
    3 * c10.y * c13.x * c13y2 * c23x2 - 2 * c11.x * c12.y * c13x2 * c23y2 + c11.x * c12.y * c13y2 * c23x2 - c11.y * c12.x * c13x2 * c23y2 +
    2 * c11.y * c12.x * c13y2 * c23x2 + 3 * c20.x * c13x2 * c13.y * c23y2 - c12.x * c12y2 * c13.y * c23x2 -
    3 * c20.y * c13.x * c13y2 * c23x2 + c12x2 * c12.y * c13.x * c23y2 - 3 * c13.x * c22x2 * c13y2 * c22.y +
    c13x2 * c13.y * c23.x * (6 * c20.y * c23.y + 6 * c21.y * c22.y) + c13x2 * c22.x * c13.y * (6 * c21.y * c23.y + 3 * c22y2) +
    c13x3 * (-2 * c21.y * c22.y * c23.y - c20.y * c23y2 - c22.y * (2 * c21.y * c23.y + c22y2) - c23.y * (2 * c20.y * c23.y + 2 * c21.y * c22.y)),
    6 * c11.x * c12.x * c13.x * c13.y * c22.y * c23.y + c11.x * c12.y * c13.x * c22.x * c13.y * c23.y + c11.x * c12.y * c13.x * c13.y * c22.y * c23.x -
    c11.y * c12.x * c13.x * c22.x * c13.y * c23.y - c11.y * c12.x * c13.x * c13.y * c22.y * c23.x - 6 * c11.y * c12.y * c13.x * c22.x * c13.y * c23.x -
    6 * c10.x * c22.x * c13y3 * c23.x + 6 * c20.x * c22.x * c13y3 * c23.x + 6 * c10.y * c13x3 * c22.y * c23.y + 2 * c12y3 * c13.x * c22.x * c23.x -
    2 * c12x3 * c13.y * c22.y * c23.y + 6 * c10.x * c13.x * c22.x * c13y2 * c23.y + 6 * c10.x * c13.x * c13y2 * c22.y * c23.x +
    6 * c10.y * c13.x * c22.x * c13y2 * c23.x - 3 * c11.x * c12.x * c22.x * c13y2 * c23.y - 3 * c11.x * c12.x * c13y2 * c22.y * c23.x +
    2 * c11.x * c12.y * c22.x * c13y2 * c23.x + 4 * c11.y * c12.x * c22.x * c13y2 * c23.x - 6 * c10.x * c13x2 * c13.y * c22.y * c23.y -
    6 * c10.y * c13x2 * c22.x * c13.y * c23.y - 6 * c10.y * c13x2 * c13.y * c22.y * c23.x - 4 * c11.x * c12.y * c13x2 * c22.y * c23.y -
    6 * c20.x * c13.x * c22.x * c13y2 * c23.y - 6 * c20.x * c13.x * c13y2 * c22.y * c23.x - 2 * c11.y * c12.x * c13x2 * c22.y * c23.y +
    3 * c11.y * c12.y * c13x2 * c22.x * c23.y + 3 * c11.y * c12.y * c13x2 * c22.y * c23.x - 2 * c12.x * c12y2 * c13.x * c22.x * c23.y -
    2 * c12.x * c12y2 * c13.x * c22.y * c23.x - 2 * c12.x * c12y2 * c22.x * c13.y * c23.x - 6 * c20.y * c13.x * c22.x * c13y2 * c23.x -
    6 * c21.x * c13.x * c21.y * c13y2 * c23.x - 6 * c21.x * c13.x * c22.x * c13y2 * c22.y + 6 * c20.x * c13x2 * c13.y * c22.y * c23.y +
    2 * c12x2 * c12.y * c13.x * c22.y * c23.y + 2 * c12x2 * c12.y * c22.x * c13.y * c23.y + 2 * c12x2 * c12.y * c13.y * c22.y * c23.x +
    3 * c21.x * c22x2 * c13y3 + 3 * c21x2 * c13y3 * c23.x - 3 * c13.x * c21.y * c22x2 * c13y2 - 3 * c21x2 * c13.x * c13y2 * c23.y +
    c13x2 * c22.x * c13.y * (6 * c20.y * c23.y + 6 * c21.y * c22.y) + c13x2 * c13.y * c23.x * (6 * c20.y * c22.y + 3 * c21y2) +
    c21.x * c13x2 * c13.y * (6 * c21.y * c23.y + 3 * c22y2) + c13x3 * (-2 * c20.y * c22.y * c23.y - c23.y * (2 * c20.y * c22.y + c21y2) -
      c21.y * (2 * c21.y * c23.y + c22y2) - c22.y * (2 * c20.y * c23.y + 2 * c21.y * c22.y)),
    c11.x * c21.x * c12.y * c13.x * c13.y * c23.y + c11.x * c12.y * c13.x * c21.y * c13.y * c23.x + c11.x * c12.y * c13.x * c22.x * c13.y * c22.y -
    c11.y * c12.x * c21.x * c13.x * c13.y * c23.y - c11.y * c12.x * c13.x * c21.y * c13.y * c23.x - c11.y * c12.x * c13.x * c22.x * c13.y * c22.y -
    6 * c11.y * c21.x * c12.y * c13.x * c13.y * c23.x - 6 * c10.x * c21.x * c13y3 * c23.x + 6 * c20.x * c21.x * c13y3 * c23.x +
    2 * c21.x * c12y3 * c13.x * c23.x + 6 * c10.x * c21.x * c13.x * c13y2 * c23.y + 6 * c10.x * c13.x * c21.y * c13y2 * c23.x +
    6 * c10.x * c13.x * c22.x * c13y2 * c22.y + 6 * c10.y * c21.x * c13.x * c13y2 * c23.x - 3 * c11.x * c12.x * c21.x * c13y2 * c23.y -
    3 * c11.x * c12.x * c21.y * c13y2 * c23.x - 3 * c11.x * c12.x * c22.x * c13y2 * c22.y + 2 * c11.x * c21.x * c12.y * c13y2 * c23.x +
    4 * c11.y * c12.x * c21.x * c13y2 * c23.x - 6 * c10.y * c21.x * c13x2 * c13.y * c23.y - 6 * c10.y * c13x2 * c21.y * c13.y * c23.x -
    6 * c10.y * c13x2 * c22.x * c13.y * c22.y - 6 * c20.x * c21.x * c13.x * c13y2 * c23.y - 6 * c20.x * c13.x * c21.y * c13y2 * c23.x -
    6 * c20.x * c13.x * c22.x * c13y2 * c22.y + 3 * c11.y * c21.x * c12.y * c13x2 * c23.y - 3 * c11.y * c12.y * c13.x * c22x2 * c13.y +
    3 * c11.y * c12.y * c13x2 * c21.y * c23.x + 3 * c11.y * c12.y * c13x2 * c22.x * c22.y - 2 * c12.x * c21.x * c12y2 * c13.x * c23.y -
    2 * c12.x * c21.x * c12y2 * c13.y * c23.x - 2 * c12.x * c12y2 * c13.x * c21.y * c23.x - 2 * c12.x * c12y2 * c13.x * c22.x * c22.y -
    6 * c20.y * c21.x * c13.x * c13y2 * c23.x - 6 * c21.x * c13.x * c21.y * c22.x * c13y2 + 6 * c20.y * c13x2 * c21.y * c13.y * c23.x +
    2 * c12x2 * c21.x * c12.y * c13.y * c23.y + 2 * c12x2 * c12.y * c21.y * c13.y * c23.x + 2 * c12x2 * c12.y * c22.x * c13.y * c22.y -
    3 * c10.x * c22x2 * c13y3 + 3 * c20.x * c22x2 * c13y3 + 3 * c21x2 * c22.x * c13y3 + c12y3 * c13.x * c22x2 +
    3 * c10.y * c13.x * c22x2 * c13y2 + c11.x * c12.y * c22x2 * c13y2 + 2 * c11.y * c12.x * c22x2 * c13y2 -
    c12.x * c12y2 * c22x2 * c13.y - 3 * c20.y * c13.x * c22x2 * c13y2 - 3 * c21x2 * c13.x * c13y2 * c22.y +
    c12x2 * c12.y * c13.x * (2 * c21.y * c23.y + c22y2) + c11.x * c12.x * c13.x * c13.y * (6 * c21.y * c23.y + 3 * c22y2) +
    c21.x * c13x2 * c13.y * (6 * c20.y * c23.y + 6 * c21.y * c22.y) + c12x3 * c13.y * (-2 * c21.y * c23.y - c22y2) +
    c10.y * c13x3 * (6 * c21.y * c23.y + 3 * c22y2) + c11.y * c12.x * c13x2 * (-2 * c21.y * c23.y - c22y2) +
    c11.x * c12.y * c13x2 * (-4 * c21.y * c23.y - 2 * c22y2) + c10.x * c13x2 * c13.y * (-6 * c21.y * c23.y - 3 * c22y2) +
    c13x2 * c22.x * c13.y * (6 * c20.y * c22.y + 3 * c21y2) + c20.x * c13x2 * c13.y * (6 * c21.y * c23.y + 3 * c22y2) +
    c13x3 * (-2 * c20.y * c21.y * c23.y - c22.y * (2 * c20.y * c22.y + c21y2) - c20.y * (2 * c21.y * c23.y + c22y2) -
      c21.y * (2 * c20.y * c23.y + 2 * c21.y * c22.y)),
    -c10.x * c11.x * c12.y * c13.x * c13.y * c23.y + c10.x * c11.y * c12.x * c13.x * c13.y * c23.y + 6 * c10.x * c11.y * c12.y * c13.x * c13.y * c23.x -
    6 * c10.y * c11.x * c12.x * c13.x * c13.y * c23.y - c10.y * c11.x * c12.y * c13.x * c13.y * c23.x + c10.y * c11.y * c12.x * c13.x * c13.y * c23.x +
    c11.x * c11.y * c12.x * c12.y * c13.x * c23.y - c11.x * c11.y * c12.x * c12.y * c13.y * c23.x + c11.x * c20.x * c12.y * c13.x * c13.y * c23.y +
    c11.x * c20.y * c12.y * c13.x * c13.y * c23.x + c11.x * c21.x * c12.y * c13.x * c13.y * c22.y + c11.x * c12.y * c13.x * c21.y * c22.x * c13.y -
    c20.x * c11.y * c12.x * c13.x * c13.y * c23.y - 6 * c20.x * c11.y * c12.y * c13.x * c13.y * c23.x - c11.y * c12.x * c20.y * c13.x * c13.y * c23.x -
    c11.y * c12.x * c21.x * c13.x * c13.y * c22.y - c11.y * c12.x * c13.x * c21.y * c22.x * c13.y - 6 * c11.y * c21.x * c12.y * c13.x * c22.x * c13.y -
    6 * c10.x * c20.x * c13y3 * c23.x - 6 * c10.x * c21.x * c22.x * c13y3 - 2 * c10.x * c12y3 * c13.x * c23.x + 6 * c20.x * c21.x * c22.x * c13y3 +
    2 * c20.x * c12y3 * c13.x * c23.x + 2 * c21.x * c12y3 * c13.x * c22.x + 2 * c10.y * c12x3 * c13.y * c23.y - 6 * c10.x * c10.y * c13.x * c13y2 * c23.x +
    3 * c10.x * c11.x * c12.x * c13y2 * c23.y - 2 * c10.x * c11.x * c12.y * c13y2 * c23.x - 4 * c10.x * c11.y * c12.x * c13y2 * c23.x +
    3 * c10.y * c11.x * c12.x * c13y2 * c23.x + 6 * c10.x * c10.y * c13x2 * c13.y * c23.y + 6 * c10.x * c20.x * c13.x * c13y2 * c23.y -
    3 * c10.x * c11.y * c12.y * c13x2 * c23.y + 2 * c10.x * c12.x * c12y2 * c13.x * c23.y + 2 * c10.x * c12.x * c12y2 * c13.y * c23.x +
    6 * c10.x * c20.y * c13.x * c13y2 * c23.x + 6 * c10.x * c21.x * c13.x * c13y2 * c22.y + 6 * c10.x * c13.x * c21.y * c22.x * c13y2 +
    4 * c10.y * c11.x * c12.y * c13x2 * c23.y + 6 * c10.y * c20.x * c13.x * c13y2 * c23.x + 2 * c10.y * c11.y * c12.x * c13x2 * c23.y -
    3 * c10.y * c11.y * c12.y * c13x2 * c23.x + 2 * c10.y * c12.x * c12y2 * c13.x * c23.x + 6 * c10.y * c21.x * c13.x * c22.x * c13y2 -
    3 * c11.x * c20.x * c12.x * c13y2 * c23.y + 2 * c11.x * c20.x * c12.y * c13y2 * c23.x + c11.x * c11.y * c12y2 * c13.x * c23.x -
    3 * c11.x * c12.x * c20.y * c13y2 * c23.x - 3 * c11.x * c12.x * c21.x * c13y2 * c22.y - 3 * c11.x * c12.x * c21.y * c22.x * c13y2 +
    2 * c11.x * c21.x * c12.y * c22.x * c13y2 + 4 * c20.x * c11.y * c12.x * c13y2 * c23.x + 4 * c11.y * c12.x * c21.x * c22.x * c13y2 -
    2 * c10.x * c12x2 * c12.y * c13.y * c23.y - 6 * c10.y * c20.x * c13x2 * c13.y * c23.y - 6 * c10.y * c20.y * c13x2 * c13.y * c23.x -
    6 * c10.y * c21.x * c13x2 * c13.y * c22.y - 2 * c10.y * c12x2 * c12.y * c13.x * c23.y - 2 * c10.y * c12x2 * c12.y * c13.y * c23.x -
    6 * c10.y * c13x2 * c21.y * c22.x * c13.y - c11.x * c11.y * c12x2 * c13.y * c23.y - 2 * c11.x * c11y2 * c13.x * c13.y * c23.x +
    3 * c20.x * c11.y * c12.y * c13x2 * c23.y - 2 * c20.x * c12.x * c12y2 * c13.x * c23.y - 2 * c20.x * c12.x * c12y2 * c13.y * c23.x -
    6 * c20.x * c20.y * c13.x * c13y2 * c23.x - 6 * c20.x * c21.x * c13.x * c13y2 * c22.y - 6 * c20.x * c13.x * c21.y * c22.x * c13y2 +
    3 * c11.y * c20.y * c12.y * c13x2 * c23.x + 3 * c11.y * c21.x * c12.y * c13x2 * c22.y + 3 * c11.y * c12.y * c13x2 * c21.y * c22.x -
    2 * c12.x * c20.y * c12y2 * c13.x * c23.x - 2 * c12.x * c21.x * c12y2 * c13.x * c22.y - 2 * c12.x * c21.x * c12y2 * c22.x * c13.y -
    2 * c12.x * c12y2 * c13.x * c21.y * c22.x - 6 * c20.y * c21.x * c13.x * c22.x * c13y2 - c11y2 * c12.x * c12.y * c13.x * c23.x +
    2 * c20.x * c12x2 * c12.y * c13.y * c23.y + 6 * c20.y * c13x2 * c21.y * c22.x * c13.y + 2 * c11x2 * c11.y * c13.x * c13.y * c23.y +
    c11x2 * c12.x * c12.y * c13.y * c23.y + 2 * c12x2 * c20.y * c12.y * c13.y * c23.x + 2 * c12x2 * c21.x * c12.y * c13.y * c22.y +
    2 * c12x2 * c12.y * c21.y * c22.x * c13.y + c21x3 * c13y3 + 3 * c10x2 * c13y3 * c23.x - 3 * c10y2 * c13x3 * c23.y +
    3 * c20x2 * c13y3 * c23.x + c11y3 * c13x2 * c23.x - c11x3 * c13y2 * c23.y - c11.x * c11y2 * c13x2 * c23.y +
    c11x2 * c11.y * c13y2 * c23.x - 3 * c10x2 * c13.x * c13y2 * c23.y + 3 * c10y2 * c13x2 * c13.y * c23.x - c11x2 * c12y2 * c13.x * c23.y +
    c11y2 * c12x2 * c13.y * c23.x - 3 * c21x2 * c13.x * c21.y * c13y2 - 3 * c20x2 * c13.x * c13y2 * c23.y + 3 * c20y2 * c13x2 * c13.y * c23.x +
    c11.x * c12.x * c13.x * c13.y * (6 * c20.y * c23.y + 6 * c21.y * c22.y) + c12x3 * c13.y * (-2 * c20.y * c23.y - 2 * c21.y * c22.y) +
    c10.y * c13x3 * (6 * c20.y * c23.y + 6 * c21.y * c22.y) + c11.y * c12.x * c13x2 * (-2 * c20.y * c23.y - 2 * c21.y * c22.y) +
    c12x2 * c12.y * c13.x * (2 * c20.y * c23.y + 2 * c21.y * c22.y) + c11.x * c12.y * c13x2 * (-4 * c20.y * c23.y - 4 * c21.y * c22.y) +
    c10.x * c13x2 * c13.y * (-6 * c20.y * c23.y - 6 * c21.y * c22.y) + c20.x * c13x2 * c13.y * (6 * c20.y * c23.y + 6 * c21.y * c22.y) +
    c21.x * c13x2 * c13.y * (6 * c20.y * c22.y + 3 * c21y2) + c13x3 * (-2 * c20.y * c21.y * c22.y - c20y2 * c23.y -
      c21.y * (2 * c20.y * c22.y + c21y2) - c20.y * (2 * c20.y * c23.y + 2 * c21.y * c22.y)),
    -c10.x * c11.x * c12.y * c13.x * c13.y * c22.y + c10.x * c11.y * c12.x * c13.x * c13.y * c22.y + 6 * c10.x * c11.y * c12.y * c13.x * c22.x * c13.y -
    6 * c10.y * c11.x * c12.x * c13.x * c13.y * c22.y - c10.y * c11.x * c12.y * c13.x * c22.x * c13.y + c10.y * c11.y * c12.x * c13.x * c22.x * c13.y +
    c11.x * c11.y * c12.x * c12.y * c13.x * c22.y - c11.x * c11.y * c12.x * c12.y * c22.x * c13.y + c11.x * c20.x * c12.y * c13.x * c13.y * c22.y +
    c11.x * c20.y * c12.y * c13.x * c22.x * c13.y + c11.x * c21.x * c12.y * c13.x * c21.y * c13.y - c20.x * c11.y * c12.x * c13.x * c13.y * c22.y -
    6 * c20.x * c11.y * c12.y * c13.x * c22.x * c13.y - c11.y * c12.x * c20.y * c13.x * c22.x * c13.y - c11.y * c12.x * c21.x * c13.x * c21.y * c13.y -
    6 * c10.x * c20.x * c22.x * c13y3 - 2 * c10.x * c12y3 * c13.x * c22.x + 2 * c20.x * c12y3 * c13.x * c22.x + 2 * c10.y * c12x3 * c13.y * c22.y -
    6 * c10.x * c10.y * c13.x * c22.x * c13y2 + 3 * c10.x * c11.x * c12.x * c13y2 * c22.y - 2 * c10.x * c11.x * c12.y * c22.x * c13y2 -
    4 * c10.x * c11.y * c12.x * c22.x * c13y2 + 3 * c10.y * c11.x * c12.x * c22.x * c13y2 + 6 * c10.x * c10.y * c13x2 * c13.y * c22.y +
    6 * c10.x * c20.x * c13.x * c13y2 * c22.y - 3 * c10.x * c11.y * c12.y * c13x2 * c22.y + 2 * c10.x * c12.x * c12y2 * c13.x * c22.y +
    2 * c10.x * c12.x * c12y2 * c22.x * c13.y + 6 * c10.x * c20.y * c13.x * c22.x * c13y2 + 6 * c10.x * c21.x * c13.x * c21.y * c13y2 +
    4 * c10.y * c11.x * c12.y * c13x2 * c22.y + 6 * c10.y * c20.x * c13.x * c22.x * c13y2 + 2 * c10.y * c11.y * c12.x * c13x2 * c22.y -
    3 * c10.y * c11.y * c12.y * c13x2 * c22.x + 2 * c10.y * c12.x * c12y2 * c13.x * c22.x - 3 * c11.x * c20.x * c12.x * c13y2 * c22.y +
    2 * c11.x * c20.x * c12.y * c22.x * c13y2 + c11.x * c11.y * c12y2 * c13.x * c22.x - 3 * c11.x * c12.x * c20.y * c22.x * c13y2 -
    3 * c11.x * c12.x * c21.x * c21.y * c13y2 + 4 * c20.x * c11.y * c12.x * c22.x * c13y2 - 2 * c10.x * c12x2 * c12.y * c13.y * c22.y -
    6 * c10.y * c20.x * c13x2 * c13.y * c22.y - 6 * c10.y * c20.y * c13x2 * c22.x * c13.y - 6 * c10.y * c21.x * c13x2 * c21.y * c13.y -
    2 * c10.y * c12x2 * c12.y * c13.x * c22.y - 2 * c10.y * c12x2 * c12.y * c22.x * c13.y - c11.x * c11.y * c12x2 * c13.y * c22.y -
    2 * c11.x * c11y2 * c13.x * c22.x * c13.y + 3 * c20.x * c11.y * c12.y * c13x2 * c22.y - 2 * c20.x * c12.x * c12y2 * c13.x * c22.y -
    2 * c20.x * c12.x * c12y2 * c22.x * c13.y - 6 * c20.x * c20.y * c13.x * c22.x * c13y2 - 6 * c20.x * c21.x * c13.x * c21.y * c13y2 +
    3 * c11.y * c20.y * c12.y * c13x2 * c22.x + 3 * c11.y * c21.x * c12.y * c13x2 * c21.y - 2 * c12.x * c20.y * c12y2 * c13.x * c22.x -
    2 * c12.x * c21.x * c12y2 * c13.x * c21.y - c11y2 * c12.x * c12.y * c13.x * c22.x + 2 * c20.x * c12x2 * c12.y * c13.y * c22.y -
    3 * c11.y * c21x2 * c12.y * c13.x * c13.y + 6 * c20.y * c21.x * c13x2 * c21.y * c13.y + 2 * c11x2 * c11.y * c13.x * c13.y * c22.y +
    c11x2 * c12.x * c12.y * c13.y * c22.y + 2 * c12x2 * c20.y * c12.y * c22.x * c13.y + 2 * c12x2 * c21.x * c12.y * c21.y * c13.y -
    3 * c10.x * c21x2 * c13y3 + 3 * c20.x * c21x2 * c13y3 + 3 * c10x2 * c22.x * c13y3 - 3 * c10y2 * c13x3 * c22.y + 3 * c20x2 * c22.x * c13y3 +
    c21x2 * c12y3 * c13.x + c11y3 * c13x2 * c22.x - c11x3 * c13y2 * c22.y + 3 * c10.y * c21x2 * c13.x * c13y2 -
    c11.x * c11y2 * c13x2 * c22.y + c11.x * c21x2 * c12.y * c13y2 + 2 * c11.y * c12.x * c21x2 * c13y2 + c11x2 * c11.y * c22.x * c13y2 -
    c12.x * c21x2 * c12y2 * c13.y - 3 * c20.y * c21x2 * c13.x * c13y2 - 3 * c10x2 * c13.x * c13y2 * c22.y + 3 * c10y2 * c13x2 * c22.x * c13.y -
    c11x2 * c12y2 * c13.x * c22.y + c11y2 * c12x2 * c22.x * c13.y - 3 * c20x2 * c13.x * c13y2 * c22.y + 3 * c20y2 * c13x2 * c22.x * c13.y +
    c12x2 * c12.y * c13.x * (2 * c20.y * c22.y + c21y2) + c11.x * c12.x * c13.x * c13.y * (6 * c20.y * c22.y + 3 * c21y2) +
    c12x3 * c13.y * (-2 * c20.y * c22.y - c21y2) + c10.y * c13x3 * (6 * c20.y * c22.y + 3 * c21y2) +
    c11.y * c12.x * c13x2 * (-2 * c20.y * c22.y - c21y2) + c11.x * c12.y * c13x2 * (-4 * c20.y * c22.y - 2 * c21y2) +
    c10.x * c13x2 * c13.y * (-6 * c20.y * c22.y - 3 * c21y2) + c20.x * c13x2 * c13.y * (6 * c20.y * c22.y + 3 * c21y2) +
    c13x3 * (-2 * c20.y * c21y2 - c20y2 * c22.y - c20.y * (2 * c20.y * c22.y + c21y2)),
    -c10.x * c11.x * c12.y * c13.x * c21.y * c13.y + c10.x * c11.y * c12.x * c13.x * c21.y * c13.y + 6 * c10.x * c11.y * c21.x * c12.y * c13.x * c13.y -
    6 * c10.y * c11.x * c12.x * c13.x * c21.y * c13.y - c10.y * c11.x * c21.x * c12.y * c13.x * c13.y + c10.y * c11.y * c12.x * c21.x * c13.x * c13.y -
    c11.x * c11.y * c12.x * c21.x * c12.y * c13.y + c11.x * c11.y * c12.x * c12.y * c13.x * c21.y + c11.x * c20.x * c12.y * c13.x * c21.y * c13.y +
    6 * c11.x * c12.x * c20.y * c13.x * c21.y * c13.y + c11.x * c20.y * c21.x * c12.y * c13.x * c13.y - c20.x * c11.y * c12.x * c13.x * c21.y * c13.y -
    6 * c20.x * c11.y * c21.x * c12.y * c13.x * c13.y - c11.y * c12.x * c20.y * c21.x * c13.x * c13.y - 6 * c10.x * c20.x * c21.x * c13y3 -
    2 * c10.x * c21.x * c12y3 * c13.x + 6 * c10.y * c20.y * c13x3 * c21.y + 2 * c20.x * c21.x * c12y3 * c13.x + 2 * c10.y * c12x3 * c21.y * c13.y -
    2 * c12x3 * c20.y * c21.y * c13.y - 6 * c10.x * c10.y * c21.x * c13.x * c13y2 + 3 * c10.x * c11.x * c12.x * c21.y * c13y2 -
    2 * c10.x * c11.x * c21.x * c12.y * c13y2 - 4 * c10.x * c11.y * c12.x * c21.x * c13y2 + 3 * c10.y * c11.x * c12.x * c21.x * c13y2 +
    6 * c10.x * c10.y * c13x2 * c21.y * c13.y + 6 * c10.x * c20.x * c13.x * c21.y * c13y2 - 3 * c10.x * c11.y * c12.y * c13x2 * c21.y +
    2 * c10.x * c12.x * c21.x * c12y2 * c13.y + 2 * c10.x * c12.x * c12y2 * c13.x * c21.y + 6 * c10.x * c20.y * c21.x * c13.x * c13y2 +
    4 * c10.y * c11.x * c12.y * c13x2 * c21.y + 6 * c10.y * c20.x * c21.x * c13.x * c13y2 + 2 * c10.y * c11.y * c12.x * c13x2 * c21.y -
    3 * c10.y * c11.y * c21.x * c12.y * c13x2 + 2 * c10.y * c12.x * c21.x * c12y2 * c13.x - 3 * c11.x * c20.x * c12.x * c21.y * c13y2 +
    2 * c11.x * c20.x * c21.x * c12.y * c13y2 + c11.x * c11.y * c21.x * c12y2 * c13.x - 3 * c11.x * c12.x * c20.y * c21.x * c13y2 +
    4 * c20.x * c11.y * c12.x * c21.x * c13y2 - 6 * c10.x * c20.y * c13x2 * c21.y * c13.y - 2 * c10.x * c12x2 * c12.y * c21.y * c13.y -
    6 * c10.y * c20.x * c13x2 * c21.y * c13.y - 6 * c10.y * c20.y * c21.x * c13x2 * c13.y - 2 * c10.y * c12x2 * c21.x * c12.y * c13.y -
    2 * c10.y * c12x2 * c12.y * c13.x * c21.y - c11.x * c11.y * c12x2 * c21.y * c13.y - 4 * c11.x * c20.y * c12.y * c13x2 * c21.y -
    2 * c11.x * c11y2 * c21.x * c13.x * c13.y + 3 * c20.x * c11.y * c12.y * c13x2 * c21.y - 2 * c20.x * c12.x * c21.x * c12y2 * c13.y -
    2 * c20.x * c12.x * c12y2 * c13.x * c21.y - 6 * c20.x * c20.y * c21.x * c13.x * c13y2 - 2 * c11.y * c12.x * c20.y * c13x2 * c21.y +
    3 * c11.y * c20.y * c21.x * c12.y * c13x2 - 2 * c12.x * c20.y * c21.x * c12y2 * c13.x - c11y2 * c12.x * c21.x * c12.y * c13.x +
    6 * c20.x * c20.y * c13x2 * c21.y * c13.y + 2 * c20.x * c12x2 * c12.y * c21.y * c13.y + 2 * c11x2 * c11.y * c13.x * c21.y * c13.y +
    c11x2 * c12.x * c12.y * c21.y * c13.y + 2 * c12x2 * c20.y * c21.x * c12.y * c13.y + 2 * c12x2 * c20.y * c12.y * c13.x * c21.y +
    3 * c10x2 * c21.x * c13y3 - 3 * c10y2 * c13x3 * c21.y + 3 * c20x2 * c21.x * c13y3 + c11y3 * c21.x * c13x2 - c11x3 * c21.y * c13y2 -
    3 * c20y2 * c13x3 * c21.y - c11.x * c11y2 * c13x2 * c21.y + c11x2 * c11.y * c21.x * c13y2 - 3 * c10x2 * c13.x * c21.y * c13y2 +
    3 * c10y2 * c21.x * c13x2 * c13.y - c11x2 * c12y2 * c13.x * c21.y + c11y2 * c12x2 * c21.x * c13.y - 3 * c20x2 * c13.x * c21.y * c13y2 +
    3 * c20y2 * c21.x * c13x2 * c13.y,
    c10.x * c10.y * c11.x * c12.y * c13.x * c13.y - c10.x * c10.y * c11.y * c12.x * c13.x * c13.y + c10.x * c11.x * c11.y * c12.x * c12.y * c13.y -
    c10.y * c11.x * c11.y * c12.x * c12.y * c13.x - c10.x * c11.x * c20.y * c12.y * c13.x * c13.y + 6 * c10.x * c20.x * c11.y * c12.y * c13.x * c13.y +
    c10.x * c11.y * c12.x * c20.y * c13.x * c13.y - c10.y * c11.x * c20.x * c12.y * c13.x * c13.y - 6 * c10.y * c11.x * c12.x * c20.y * c13.x * c13.y +
    c10.y * c20.x * c11.y * c12.x * c13.x * c13.y - c11.x * c20.x * c11.y * c12.x * c12.y * c13.y + c11.x * c11.y * c12.x * c20.y * c12.y * c13.x +
    c11.x * c20.x * c20.y * c12.y * c13.x * c13.y - c20.x * c11.y * c12.x * c20.y * c13.x * c13.y - 2 * c10.x * c20.x * c12y3 * c13.x +
    2 * c10.y * c12x3 * c20.y * c13.y - 3 * c10.x * c10.y * c11.x * c12.x * c13y2 - 6 * c10.x * c10.y * c20.x * c13.x * c13y2 +
    3 * c10.x * c10.y * c11.y * c12.y * c13x2 - 2 * c10.x * c10.y * c12.x * c12y2 * c13.x - 2 * c10.x * c11.x * c20.x * c12.y * c13y2 -
    c10.x * c11.x * c11.y * c12y2 * c13.x + 3 * c10.x * c11.x * c12.x * c20.y * c13y2 - 4 * c10.x * c20.x * c11.y * c12.x * c13y2 +
    3 * c10.y * c11.x * c20.x * c12.x * c13y2 + 6 * c10.x * c10.y * c20.y * c13x2 * c13.y + 2 * c10.x * c10.y * c12x2 * c12.y * c13.y +
    2 * c10.x * c11.x * c11y2 * c13.x * c13.y + 2 * c10.x * c20.x * c12.x * c12y2 * c13.y + 6 * c10.x * c20.x * c20.y * c13.x * c13y2 -
    3 * c10.x * c11.y * c20.y * c12.y * c13x2 + 2 * c10.x * c12.x * c20.y * c12y2 * c13.x + c10.x * c11y2 * c12.x * c12.y * c13.x +
    c10.y * c11.x * c11.y * c12x2 * c13.y + 4 * c10.y * c11.x * c20.y * c12.y * c13x2 - 3 * c10.y * c20.x * c11.y * c12.y * c13x2 +
    2 * c10.y * c20.x * c12.x * c12y2 * c13.x + 2 * c10.y * c11.y * c12.x * c20.y * c13x2 + c11.x * c20.x * c11.y * c12y2 * c13.x -
    3 * c11.x * c20.x * c12.x * c20.y * c13y2 - 2 * c10.x * c12x2 * c20.y * c12.y * c13.y - 6 * c10.y * c20.x * c20.y * c13x2 * c13.y -
    2 * c10.y * c20.x * c12x2 * c12.y * c13.y - 2 * c10.y * c11x2 * c11.y * c13.x * c13.y - c10.y * c11x2 * c12.x * c12.y * c13.y -
    2 * c10.y * c12x2 * c20.y * c12.y * c13.x - 2 * c11.x * c20.x * c11y2 * c13.x * c13.y - c11.x * c11.y * c12x2 * c20.y * c13.y +
    3 * c20.x * c11.y * c20.y * c12.y * c13x2 - 2 * c20.x * c12.x * c20.y * c12y2 * c13.x - c20.x * c11y2 * c12.x * c12.y * c13.x +
    3 * c10y2 * c11.x * c12.x * c13.x * c13.y + 3 * c11.x * c12.x * c20y2 * c13.x * c13.y + 2 * c20.x * c12x2 * c20.y * c12.y * c13.y -
    3 * c10x2 * c11.y * c12.y * c13.x * c13.y + 2 * c11x2 * c11.y * c20.y * c13.x * c13.y + c11x2 * c12.x * c20.y * c12.y * c13.y -
    3 * c20x2 * c11.y * c12.y * c13.x * c13.y - c10x3 * c13y3 + c10y3 * c13x3 + c20x3 * c13y3 - c20y3 * c13x3 -
    3 * c10.x * c20x2 * c13y3 - c10.x * c11y3 * c13x2 + 3 * c10x2 * c20.x * c13y3 + c10.y * c11x3 * c13y2 +
    3 * c10.y * c20y2 * c13x3 + c20.x * c11y3 * c13x2 + c10x2 * c12y3 * c13.x - 3 * c10y2 * c20.y * c13x3 - c10y2 * c12x3 * c13.y +
    c20x2 * c12y3 * c13.x - c11x3 * c20.y * c13y2 - c12x3 * c20y2 * c13.y - c10.x * c11x2 * c11.y * c13y2 +
    c10.y * c11.x * c11y2 * c13x2 - 3 * c10.x * c10y2 * c13x2 * c13.y - c10.x * c11y2 * c12x2 * c13.y + c10.y * c11x2 * c12y2 * c13.x -
    c11.x * c11y2 * c20.y * c13x2 + 3 * c10x2 * c10.y * c13.x * c13y2 + c10x2 * c11.x * c12.y * c13y2 +
    2 * c10x2 * c11.y * c12.x * c13y2 - 2 * c10y2 * c11.x * c12.y * c13x2 - c10y2 * c11.y * c12.x * c13x2 + c11x2 * c20.x * c11.y * c13y2 -
    3 * c10.x * c20y2 * c13x2 * c13.y + 3 * c10.y * c20x2 * c13.x * c13y2 + c11.x * c20x2 * c12.y * c13y2 - 2 * c11.x * c20y2 * c12.y * c13x2 +
    c20.x * c11y2 * c12x2 * c13.y - c11.y * c12.x * c20y2 * c13x2 - c10x2 * c12.x * c12y2 * c13.y - 3 * c10x2 * c20.y * c13.x * c13y2 +
    3 * c10y2 * c20.x * c13x2 * c13.y + c10y2 * c12x2 * c12.y * c13.x - c11x2 * c20.y * c12y2 * c13.x + 2 * c20x2 * c11.y * c12.x * c13y2 +
    3 * c20.x * c20y2 * c13x2 * c13.y - c20x2 * c12.x * c12y2 * c13.y - 3 * c20x2 * c20.y * c13.x * c13y2 + c12x2 * c20y2 * c12.y * c13.x
  ].reverse();

  const roots = getRootsInInterval(0, 1, coefs);

  for (let i = 0; i < roots.length; i++) {
    const s = roots[i];
    const xRoots = getRoots([c13.x, c12.x, c11.x, c10.x - c20.x - s * c21.x - s * s * c22.x - s * s * s * c23.x].reverse());
    const yRoots = getRoots([c13.y,
      c12.y,
      c11.y,
      c10.y - c20.y - s * c21.y - s * s * c22.y - s * s * s * c23.y].reverse());

    if (xRoots.length > 0 && yRoots.length > 0) {
      const TOLERANCE = 1e-4;

      checkRoots:
        for (let j = 0; j < xRoots.length; j++) {
          const xRoot = xRoots[j];

          if (0 <= xRoot && xRoot <= 1) {
            for (let k = 0; k < yRoots.length; k++) {
              if (Math.abs(xRoot - yRoots[k]) < TOLERANCE) {
                const x = c23.x * s * s * s + c22.x * s * s + c21.x * s + c20.x;
                const y = c23.y * s * s * s + c22.y * s * s + c21.y * s + c20.y;
                result.push({ x, y, t: xRoot });
                break checkRoots;
              }
            }
          }
        }
    }
  }
  return result;
}

function intersectBezier2Bezier3(ax1: number, ay1: number, ax2: number, ay2: number, ax3: number, ay3: number,
                                 bx1: number, by1: number, bx2: number, by2: number, bx3: number, by3: number, bx4: number, by4: number) {
  let c12, c11, c10;
  let c23, c22, c21, c20;
  const result = [];

  c12 = {
    x: ax1 - 2 * ax2 + ax3,
    y: ay1 - 2 * ay2 + ay3,
  };

  c11 = {
    x: 2 * ax2 - 2 * ax1,
    y: 2 * ay2 - 2 * ay1,
  };
  c10 = { x: ax1, y: ay1 };

  c23 = {
    x: -bx1 + 3 * bx2 - 3 * bx3 + bx4,
    y: -by1 + 3 * by2 - 3 * by3 + by4,
  };

  c22 = {
    x: 3 * bx1 - 6 * bx2 + 3 * bx3,
    y: 3 * by1 - 6 * by2 + 3 * by3,
  };

  c21 = {
    x: -3 * bx1 + 3 * bx2,
    y: -3 * by1 + 3 * by2,
  };

  c20 = { x: bx1, y: by1 };

  const c10x2 = c10.x * c10.x;
  const c10y2 = c10.y * c10.y;
  const c11x2 = c11.x * c11.x;
  const c11y2 = c11.y * c11.y;
  const c12x2 = c12.x * c12.x;
  const c12y2 = c12.y * c12.y;
  const c20x2 = c20.x * c20.x;
  const c20y2 = c20.y * c20.y;
  const c21x2 = c21.x * c21.x;
  const c21y2 = c21.y * c21.y;
  const c22x2 = c22.x * c22.x;
  const c22y2 = c22.y * c22.y;
  const c23x2 = c23.x * c23.x;
  const c23y2 = c23.y * c23.y;

  const coefs = [
    -2 * c12.x * c12.y * c23.x * c23.y + c12x2 * c23y2 + c12y2 * c23x2,
    -2 * c12.x * c12.y * c22.x * c23.y - 2 * c12.x * c12.y * c22.y * c23.x + 2 * c12y2 * c22.x * c23.x +
    2 * c12x2 * c22.y * c23.y,
    -2 * c12.x * c21.x * c12.y * c23.y - 2 * c12.x * c12.y * c21.y * c23.x - 2 * c12.x * c12.y * c22.x * c22.y +
    2 * c21.x * c12y2 * c23.x + c12y2 * c22x2 + c12x2 * (2 * c21.y * c23.y + c22y2),
    2 * c10.x * c12.x * c12.y * c23.y + 2 * c10.y * c12.x * c12.y * c23.x + c11.x * c11.y * c12.x * c23.y +
    c11.x * c11.y * c12.y * c23.x - 2 * c20.x * c12.x * c12.y * c23.y - 2 * c12.x * c20.y * c12.y * c23.x -
    2 * c12.x * c21.x * c12.y * c22.y - 2 * c12.x * c12.y * c21.y * c22.x - 2 * c10.x * c12y2 * c23.x -
    2 * c10.y * c12x2 * c23.y + 2 * c20.x * c12y2 * c23.x + 2 * c21.x * c12y2 * c22.x -
    c11y2 * c12.x * c23.x - c11x2 * c12.y * c23.y + c12x2 * (2 * c20.y * c23.y + 2 * c21.y * c22.y),
    2 * c10.x * c12.x * c12.y * c22.y + 2 * c10.y * c12.x * c12.y * c22.x + c11.x * c11.y * c12.x * c22.y +
    c11.x * c11.y * c12.y * c22.x - 2 * c20.x * c12.x * c12.y * c22.y - 2 * c12.x * c20.y * c12.y * c22.x -
    2 * c12.x * c21.x * c12.y * c21.y - 2 * c10.x * c12y2 * c22.x - 2 * c10.y * c12x2 * c22.y +
    2 * c20.x * c12y2 * c22.x - c11y2 * c12.x * c22.x - c11x2 * c12.y * c22.y + c21x2 * c12y2 +
    c12x2 * (2 * c20.y * c22.y + c21y2),
    2 * c10.x * c12.x * c12.y * c21.y + 2 * c10.y * c12.x * c21.x * c12.y + c11.x * c11.y * c12.x * c21.y +
    c11.x * c11.y * c21.x * c12.y - 2 * c20.x * c12.x * c12.y * c21.y - 2 * c12.x * c20.y * c21.x * c12.y -
    2 * c10.x * c21.x * c12y2 - 2 * c10.y * c12x2 * c21.y + 2 * c20.x * c21.x * c12y2 -
    c11y2 * c12.x * c21.x - c11x2 * c12.y * c21.y + 2 * c12x2 * c20.y * c21.y,
    -2 * c10.x * c10.y * c12.x * c12.y - c10.x * c11.x * c11.y * c12.y - c10.y * c11.x * c11.y * c12.x +
    2 * c10.x * c12.x * c20.y * c12.y + 2 * c10.y * c20.x * c12.x * c12.y + c11.x * c20.x * c11.y * c12.y +
    c11.x * c11.y * c12.x * c20.y - 2 * c20.x * c12.x * c20.y * c12.y - 2 * c10.x * c20.x * c12y2 +
    c10.x * c11y2 * c12.x + c10.y * c11x2 * c12.y - 2 * c10.y * c12x2 * c20.y -
    c20.x * c11y2 * c12.x - c11x2 * c20.y * c12.y + c10x2 * c12y2 + c10y2 * c12x2 +
    c20x2 * c12y2 + c12x2 * c20y2].reverse();

  const roots = getRootsInInterval(0, 1, coefs);
  // console.log(roots);

  for (let i = 0; i < roots.length; i++) {
    const s = roots[i];
    const xRoots = getRoots([c12.x,
      c11.x,
      c10.x - c20.x - s * c21.x - s * s * c22.x - s * s * s * c23.x].reverse());
    const yRoots = getRoots([c12.y,
      c11.y,
      c10.y - c20.y - s * c21.y - s * s * c22.y - s * s * s * c23.y].reverse());
    //
    // console.log('xRoots', xRoots);
    //
    // console.log('yRoots', yRoots);

    if (xRoots.length > 0 && yRoots.length > 0) {
      const TOLERANCE = 1e-4;

      checkRoots:
        for (let j = 0; j < xRoots.length; j++) {
          const xRoot = xRoots[j];

          if (0 <= xRoot && xRoot <= 1) {
            for (let k = 0; k < yRoots.length; k++) {
              if (Math.abs(xRoot - yRoots[k]) < TOLERANCE) {

                const x = c23.x * s * s * s + c22.x * s * s + c21.x * s + c20.x;
                const y = c23.y * s * s * s + c22.y * s * s + c21.y * s + c20.y;
                result.push({ x, y, t: xRoot });
                break checkRoots;
              }
            }
          }
        }
    }
  }
  return result;
}

function intersectBezier2Line(ax1: number, ay1: number, ax2: number, ay2: number, ax3: number, ay3: number,
                              bx1: number, by1: number, bx2: number, by2: number) {
  let c2, c1, c0;
  let cl, n;
  const isV = bx1 === bx2;
  const isH = by1 === by2;
  let result = [];

  const minbx = Math.min(bx1, bx2);
  const minby = Math.min(by1, by2);
  const maxbx = Math.max(bx1, bx2);
  const maxby = Math.max(by1, by2);

  const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
  const lerp = (a: Point, b: Point, t: number) => ({
    x: a.x - (a.x - b.x) * t,
    y: a.y - (a.y - b.y) * t,
    t,
  });

  c2 = {
    x: ax1 - 2 * ax2 + ax3,
    y: ay1 - 2 * ay2 + ay3,
  };
  c1 = {
    x: -2 * ax1 + 2 * ax2,
    y: -2 * ay1 + 2 * ay2,
  };
  c0 = { x: ax1, y: ay1 };

  n = { x: by1 - by2, y: bx2 - bx1 };
  cl = bx1 * by2 - bx2 * by1;

  // console.log('intersectBezier2Line', n, c0, c1, c2, cl);

  const coefs = [dot(n, c2), dot(n, c1), dot(n, c0) + cl].reverse();

  // console.log('intersectBezier2Line coefs', coefs);

  const roots = getRoots(coefs);

  // console.log('intersectBezier2Line roots', roots);

  for (let i = 0; i < roots.length; i++) {
    const t = roots[i];

    if (0 <= t && t <= 1) {
      const p4 = lerp({ x: ax1, y: ay1 }, { x: ax2, y: ay2 }, t);
      const p5 = lerp({ x: ax2, y: ay2 }, { x: ax3, y: ay3 }, t);

      const p6 = lerp(p4, p5, t);
      // console.log('p4, p5, p6', p4, p5, p6);

      if (bx1 === bx2) {
        if (minby <= p6.y && p6.y <= maxby) {
          result.push(p6);
        }
      }
      else if (by1 === by2) {
        if (minbx <= p6.x && p6.x <= maxbx) {
          result.push(p6);
        }
      }
      else if (p6.x >= minbx && p6.y >= minby && p6.x <= maxbx && p6.y <= maxby) {
        result.push(p6);
      }
    }
  }
  if (isH || isV) {
    result.forEach(item => {
      if (isV) {
        if (item.x < minbx) {
          item.x = minbx;
        }
        else if (item.x > maxbx) {
          item.x = maxbx;
        }
      }
      else {
        if (item.y < minby) {
          item.y = minby;
        }
        else if (item.y > maxby) {
          item.y = maxby;
        }
      }
    });
  }
  return result;
}


/**
 *
 *    (-P1+3P2-3P3+P4)t^3 + (3P1-6P2+3P3)t^2 + (-3P1+3P2)t + P1
 *        /\                     /\                /\        /\
 *        ||                     ||                ||        ||
 *        c3                     c2                c1        c0
 */
function intersectBezier3Line(ax1: number, ay1: number, ax2: number, ay2: number, ax3: number, ay3: number, ax4: number, ay4: number,
                              bx1: number, by1: number, bx2: number, by2: number) {
  let c3, c2, c1, c0;
  let cl, n;
  const isV = bx1 === bx2;
  const isH = by1 === by2;
  const result = [];

  const minbx = Math.min(bx1, bx2);
  const minby = Math.min(by1, by2);
  const maxbx = Math.max(bx1, bx2);
  const maxby = Math.max(by1, by2);

  const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
  const lerp = (a: Point, b: Point, t: number) => ({
    x: a.x - (a.x - b.x) * t,
    y: a.y - (a.y - b.y) * t,
    t,
  });

  c3 = {
    x: -ax1 + 3 * ax2 - 3 * ax3 + ax4,
    y: -ay1 + 3 * ay2 - 3 * ay3 + ay4,
  };
  c2 = {
    x: 3 * ax1 - 6 * ax2 + 3 * ax3,
    y: 3 * ay1 - 6 * ay2 + 3 * ay3,
  };
  c1 = {
    x: -3 * ax1 + 3 * ax2,
    y: -3 * ay1 + 3 * ay2,
  };
  c0 = { x: ax1, y: ay1 };

  n = { x: by1 - by2, y: bx2 - bx1 };
  cl = bx1 * by2 - bx2 * by1;

  const coefs = [
    cl + dot(n, c0),
    dot(n, c1),
    dot(n, c2),
    dot(n, c3),
  ];

  const roots = getRoots(coefs);

  for (let i = 0; i < roots.length; i++) {
    const t = roots[i];

    if (0 <= t && t <= 1) {
      const p5 = lerp({ x: ax1, y: ay1 }, { x: ax2, y: ay2 }, t);
      const p6 = lerp({ x: ax2, y: ay2 }, { x: ax3, y: ay3 }, t);
      const p7 = lerp({ x: ax3, y: ay3 }, { x: ax4, y: ay4 }, t);
      const p8 = lerp(p5, p6, t);
      const p9 = lerp(p6, p7, t);
      const p10 = lerp(p8, p9, t);

      if (bx1 === bx2) {
        if (minby <= p10.y && p10.y <= maxby) {
          result.push(p10);
        }
      }
      else if (by1 === by2) {
        if (minbx <= p10.x && p10.x <= maxbx) {
          result.push(p10);
        }
      }
      else if (p10.x >= minbx && p10.y >= minby && p10.x <= maxbx && p10.y <= maxby) {
        result.push(p10);
      }
    }
  }
  if (isH || isV) {
    result.forEach(item => {
      if (isV) {
        if (item.x < minbx) {
          item.x = minbx;
        }
        else if (item.x > maxbx) {
          item.x = maxbx;
        }
      }
      else {
        if (item.y < minby) {
          item.y = minby;
        }
        else if (item.y > maxby) {
          item.y = maxby;
        }
      }
    });
  }
  return result;
}

/**
 * 3d直线交点，允许误差，传入4个顶点坐标
 * limitToFiniteSegment可传0、1、2、3，默认0是不考虑点是否在传入的顶点组成的线段上
 * 1为限制在p1/p2线段，2为限制在p3/p4线段，3为都限制
 */
function intersectLineLine3(p1: Point3, p2: Point3, p3: Point3, p4: Point3, limitToFiniteSegment = 0, tolerance = 1e-9) {
  const p13 = subtractPoint(p1, p3);
  const p43 = subtractPoint(p4, p3);
  const p21 = subtractPoint(p2, p1);
  const d1343 = p13.x * p43.x + p13.y * p43.y + p13.z * p43.z;
  const d4321 = p43.x * p21.x + p43.y * p21.y + p43.z * p21.z;
  const d1321 = p13.x * p21.x + p13.y * p21.y + p13.z * p21.z;
  const d4343 = p43.x * p43.x + p43.y * p43.y + p43.z * p43.z;
  const d2121 = p21.x * p21.x + p21.y * p21.y + p21.z * p21.z;
  const denom = d2121 * d4343 - d4321 * d4321;
  if (Math.abs(denom) < tolerance) {
    return;
  }
  const numer = d1343 * d4321 - d1321 * d4343;
  const mua = numer / denom;
  const mub = (d1343 + d4321 * mua) / d4343;
  const pa = {
    x: p1.x + mua * p21.x,
    y: p1.y + mua * p21.y,
    z: p1.z + mua * p21.z,
  };
  const pb = {
    x: p3.x + mub * p43.x,
    y: p3.y + mub * p43.y,
    z: p3.z + mub * p43.z,
  };
  const distance = distanceTo(pa, pb);
  if (distance > tolerance) {
    return;
  }
  const intersectPt: any = divide(addPoint(pa, pb), 2);
  if (!limitToFiniteSegment) {
    return intersectPt;
  }
  let paramA = closestParam(intersectPt, p1, p2);
  let paramB = closestParam(intersectPt, p3, p4);
  if (paramA < 0 && Math.abs(paramA) < 1e-9) {
    paramA = 0;
  }
  else if (paramA > 1 && paramA - 1 < 1e-9) {
    paramA = 1;
  }
  if (paramB < 0 && Math.abs(paramB) < 1e-9) {
    paramB = 0;
  }
  else if (paramB > 1 && paramB - 1 < 1e-9) {
    paramB = 1;
  }
  intersectPt.pa = paramA;
  intersectPt.pb = paramB;
  if (limitToFiniteSegment === 1 && paramA >= 0 && paramA <= 1) {
    return intersectPt;
  }
  if (limitToFiniteSegment === 2 && paramB >= 0 && paramB <= 1) {
    return intersectPt;
  }
  if (limitToFiniteSegment === 3 && paramA >= 0 && paramA <= 1 && paramB >= 0 && paramB <= 1) {
    return intersectPt;
  }
}

function subtractPoint(p1: Point3, p2: Point3) {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z,
  };
}

function distanceTo(a: Point3, b: Point3) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
}

function addPoint(a: Point3, b: Point3) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

function divide(p: Point3, t: number) {
  const n = 1 / t;
  return {
    x: p.x * n,
    y: p.y * n,
    z: p.z * n,
  };
}

function closestParam(p: Point3, from: Point3, to: Point3) {
  const startToP = subtractPoint(p, from);
  const startToEnd = subtractPoint(to, from);
  const startEnd2 = dotProduct3(startToEnd.x, startToEnd.y, startToEnd.z, startToEnd.x, startToEnd.y, startToEnd.z);
  const startEnd_startP = dotProduct3(startToEnd.x, startToEnd.y, startToEnd.z, startToP.x, startToP.y, startToP.z);
  return startEnd_startP / startEnd2;
}

/**
 * 平面相交线，传入2个平面的各3个顶点，返回2点式
 */
function intersectPlanePlane(p1: Point3, p2: Point3, p3: Point3, p4: Point3, p5: Point3, p6: Point3) {
  const v1 = unitize3(
    p2.x - p1.x,
    p2.y - p1.y,
    p2.z - p1.z,
  ), v2 = unitize3(
    p3.x - p1.x,
    p3.y - p1.y,
    p3.z - p1.z,
  ), v4 = unitize3(
    p5.x - p4.x,
    p5.y - p4.y,
    p5.z - p4.z,
  ), v5 = unitize3(
    p6.x - p4.x,
    p6.y - p4.y,
    p6.z - p4.z,
  );
  const t1 = crossProduct3(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
  const v3 = unitize3(t1.x, t1.y, t1.z);
  const t2 = crossProduct3(v4.x, v4.y, v4.z, v5.x, v5.y, v5.z);
  const v6 = unitize3(t2.x, t2.y, t2.z);
  if (isParallel3(v3.x, v3.y, v3.z, v6.x, v6.y, v6.z)) {
    return null;
  }
  const normal = crossProduct3(v6.x, v6.y, v6.z, v3.x, v3.y, v3.z);
  const p7 = addPoint(v1, v4);
  // planeC
  const v9 = unitize3(normal.x, normal.y, normal.z);
  // 3平面相交
  const a1 = v3.x, b1 = v3.y, c1 = v3.z, d1 = -a1 * p1.x - b1 * p1.y - c1 * p1.z;
  const a2 = v6.x, b2 = v6.y, c2 = v6.z, d2 = -a2 * p4.x - b2 * p4.y - c2 * p4.z;
  const a3 = v9.x, b3 = v9.y, c3 = v9.z, d3 = -a3 * p7.x - b3 * p7.y - c3 * p7.z;
  const mb = [-d1, -d2, -d3];
  const det = a1 * (b2 * c3 - c2 * b3) - b1 * (a2 * c3 - c2 * a3) + c1 * (a2 * b3 - b2 * a3);
  if (Math.abs(det) < 1e-9) {
    return null;
  }
  const invDet = 1 / det;
  const v11 = invDet * (b2 * c3 - c2 * b3);
  const v12 = invDet * (c1 * b3 - b1 * c3);
  const v13 = invDet * (b1 * c2 - c1 * b2);
  const v21 = invDet * (c2 * a3 - a2 * c3);
  const v22 = invDet * (a1 * c3 - c1 * a3);
  const v23 = invDet * (c1 * a2 - a1 * c2);
  const v31 = invDet * (a2 * b3 - b2 * a3);
  const v32 = invDet * (b1 * a3 - a1 * b3);
  const v33 = invDet * (a1 * b2 - b1 * a2);
  const x = v11 * mb[0] + v12 * mb[1] + v13 * mb[2];
  const y = v21 * mb[0] + v22 * mb[1] + v23 * mb[2];
  const z = v31 * mb[0] + v32 * mb[1] + v33 * mb[2];
  const point = { x, y, z };
  return [
    point,
    addPoint(point, v9),
  ];
}

// 点是否在线段上，注意误差
function pointOnLine3(p: Point3, p1: Point3, p2: Point3) {
  const v1x = p1.x - p.x, v1y = p1.y - p.y, v1z = p1.z - p.z;
  const v2x = p2.x - p.x, v2y = p2.y - p.y, v2z = p2.z - p.z;
  const c = crossProduct3(v1x, v1y, v1z, v2x, v2y, v2z);
  return length3(c.x, c.y, c.z) < 1e-9;
}

export default {
  intersectBezier2Line, // 二阶贝塞尔曲线 与 直线
  intersectBezier3Line, // 三阶贝塞尔曲线 与 直线
  intersectBezier2Bezier2, // 二阶贝塞尔曲线 与 二阶贝塞尔曲线
  intersectBezier3Bezier3, // 三阶贝塞尔曲线 与 三阶贝塞尔曲线
  intersectBezier2Bezier3, // 二阶贝塞尔曲线 与 三阶贝塞尔曲线
  intersectLineLine3,
  intersectPlanePlane,
  pointOnLine3,
}
