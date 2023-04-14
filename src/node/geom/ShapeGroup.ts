import Container from '../Container';
import { Props } from '../../format';
import Polyline from './Polyline';
import { BooleanOperation } from '../../style/define';
import bo from '../../math/bo';
import CanvasCache from '../../refresh/CanvasCache';
import { color2rgbaStr } from '../../style/css';
import { getLinear } from '../../style/gradient';
import { canvasPolygon } from '../../refresh/paint';
import { isE } from '../../math/matrix';

function applyMatrixPoints(points: Array<Array<number>>, m: Float64Array) {
  if (m && !isE(m)) {
    const a1 = m[0], b1 = m[1];
    const a2 = m[4], b2 = m[5];
    const a4 = m[12], b4 = m[13];
    return points.map(item => {
      const c1 = ((a1 === 1) ? item[0] : (item[0] * a1)) + (a2 ? (item[1] * a2) : 0) + a4;
      const c2 = ((b1 === 1) ? item[0] : (item[0] * b1)) + (b2 ? (item[1] * b2) : 0) + b4;
      if (item.length === 4 || item.length === 6) {
        const c3 = ((a1 === 1) ? item[2] : (item[2] * a1)) + (a2 ? (item[3] * a2) : 0) + a4;
        const c4 = ((b1 === 1) ? item[2] : (item[2] * b1)) + (b2 ? (item[3] * b2) : 0) + b4;
        if (item.length === 6) {
          const c5 = ((a1 === 1) ? item[4] : (item[4] * a1)) + (a2 ? (item[5] * a2) : 0) + a4;
          const c6 = ((b1 === 1) ? item[4] : (item[4] * b1)) + (b2 ? (item[5] * b2) : 0) + b4;
          return [c1, c2, c3, c4, c5, c6];
        }
        return [c1, c2, c3, c4];
      }
      else {
        return [c1, c2];
      }
    });
  }
  return points.map(item => item.slice(0));
}

class ShapeGroup extends Container {
  points?: Array<Array<Array<number>>>;

  constructor(props: Props, children: Array<Polyline | ShapeGroup>) {
    super(props, children);
    this.isShapeGroup = true;
  }

  override calContent(): boolean {
    if (!this.points) {
      this.buildPoints();
    }
    return this.hasContent = !!this.points && this.points.length > 1;
  }

  buildPoints() {
    const { children } = this;
    let res: Array<Array<Array<number>>> = [];
    for (let i = 0, len = children.length; i < len; i++) {
      const item = children[i] as (Polyline | ShapeGroup);
      if (!item.points) {
        item.buildPoints();
      }
      const { points, matrix } = item;
      if (points && points.length) {
        // 点要考虑matrix变换，因为是shapeGroup的直接子节点，位置可能不一样
        let p: Array<Array<Array<number>>>;
        if(item instanceof ShapeGroup) {
          p = points.map(item => applyMatrixPoints(item as number[][], matrix));
        }
        else {
          p = [applyMatrixPoints(points as number[][], matrix)];
        }
        if (i === 0) {
          res = res.concat(p);
        }
        else {
          const booleanOperation = item.computedStyle.booleanOperation;
          // TODO 连续多个bo运算中间产物优化
          if (booleanOperation === BooleanOperation.INTERSECT) {
            const t = bo.intersect(res, p) as number[][][];
            res = t || [];
          }
          else if (booleanOperation === BooleanOperation.UNION) {
            // 可能是条直线，不能用多边形求，直接合并
            if (p.length <= 2) {
              res = res.concat(p);
            }
            else {
              const t = bo.union(res, p) as number[][][];
              res = t || [];
            }
          }
          else if (booleanOperation === BooleanOperation.SUBTRACT) {
            const t = bo.subtract(res, p) as number[][][];
            res = t || [];
          }
          else if (booleanOperation === BooleanOperation.XOR) {
            const t = bo.xor(res, p) as number[][][];
            res = t || [];
          }
        }
      }
    }
    this.points = res;
  }

  override renderCanvas() {
    super.renderCanvas();
    if (!this.points) {
      this.buildPoints();
    }
    const points = this.points!;
    const bbox = this._bbox || this.bbox;
    const x = bbox[0], y = bbox[1], w = bbox[2] - x, h = bbox[3] - y;
    const canvasCache = this.canvasCache = CanvasCache.getInstance(w, h, x, y);
    canvasCache.available = true;
    const ctx = canvasCache.offscreen.ctx;
    const {
      fill,
      fillEnable,
      stroke,
      strokeEnable,
      strokeWidth,
      strokeDasharray,
    } = this.computedStyle;
    ctx.setLineDash(strokeDasharray);
    // 先下层的fill
    for (let i = 0, len = fill.length; i < len; i++) {
      if (!fillEnable[i]) {
        continue;
      }
      const f = fill[i];
      if (Array.isArray(f)) {
        if (!f[3]) {
          continue;
        }
        ctx.fillStyle = color2rgbaStr(f);
      }
      else {
        const gd = getLinear(f.stops, f.d, 0, 0, this.width, this.height, -x, -y);
        const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
        gd.stop.forEach(item => {
          lg.addColorStop(item[1]!, color2rgbaStr(item[0]));
        });
        ctx.fillStyle = lg;
      }
      points.forEach(item => {
        canvasPolygon(ctx, item, -x, -y);
        ctx.closePath();
      });
      ctx.fill();
    }
    // 再上层的stroke
    for (let i = 0, len = stroke.length; i < len; i++) {
      if (!strokeEnable[i] || !strokeWidth[i]) {
        continue;
      }
      const s = stroke[i];
      if (Array.isArray(s)) {
        ctx.strokeStyle = color2rgbaStr(s);
        ctx.lineWidth = strokeWidth[i];
      }
      else {
        const gd = getLinear(s.stops, s.d, 0, 0, this.width, this.height, -x, -y);
        const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
        gd.stop.forEach(item => {
          lg.addColorStop(item[1]!, color2rgbaStr(item[0]));
        });
        ctx.fillStyle = lg;
      }
      points.forEach(item => {
        canvasPolygon(ctx, item, -x, -y);
        ctx.closePath();
      });
      ctx.stroke();
    }
  }

  override get bbox(): Float64Array {
    if (!this._bbox) {
      const bbox = this._bbox = super.bbox;
      // 可能不存在
      if (!this.points) {
        this.buildPoints();
      }
      const { strokeWidth, strokeEnable } = this.computedStyle;
      // 所有描边最大值，影响bbox
      let half = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          half = Math.max(half, item * 0.5);
        }
      });
      const points = this.points;
      if (points && points.length) {
        const first = points[0][0];
        let xa: number, ya: number;
        if (first.length === 4) {
          xa = first[2];
          ya = first[3];
        }
        else if (first.length === 6) {
          xa = first[4];
          ya = first[5];
        }
        else {
          xa = first[0];
          ya = first[1];
        }
        bbox[0] = Math.min(bbox[0], xa - half);
        bbox[1] = Math.min(bbox[1], ya - half);
        bbox[2] = Math.max(bbox[2], xa + half);
        bbox[3] = Math.max(bbox[3], ya + half);
        for (let i = 0, len = points.length; i < len; i++) {
          const item = points[i];
          for (let j = 0, len = item.length; j < len; j++) {
            if (!i && !j) {
              continue;
            }
            let item2 = item[j];
            let xb: number, yb: number;
            if (item.length === 4) {
            }
            else if (item.length === 6) {
            }
            else {
              xb = item2[0];
              yb = item2[1];
              bbox[0] = Math.min(bbox[0], xb - half);
              bbox[1] = Math.min(bbox[1], yb - half);
              bbox[2] = Math.max(bbox[2], xb + half);
              bbox[3] = Math.max(bbox[3], yb + half);
            }
            xa = xb!;
            ya = yb!;
          }
        }
      }
    }
    return this._bbox;
  }
}

export default ShapeGroup;
