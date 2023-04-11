import Geom from './Geom';
import { PolylineProps } from '../../format';
import CanvasCache from '../../refresh/CanvasCache';
import { color2rgbaStr } from '../../style/css';

class Polyline extends Geom {
  points?: Array<Array<number>>;
  constructor(props: PolylineProps) {
    super(props);
  }

  private buildPoints() {
    const props = this.props as PolylineProps;
    const { width, height } = this;
    const temp = [];
    const points = props.points;
    // 先算出真实尺寸，按w/h把[0,1]坐标转换
    for (let i = 0, len = points.length; i < len; i++) {
      const item = points[i];
      temp.push({
        x: item.x * width,
        y: item.y * height,
        cornerRadius: item.cornerRadius,
        curveMode: item.curveMode,
        hasCurveFrom: item.hasCurveFrom,
        hasCurveTo: item.hasCurveTo,
        fx: item.fx * width,
        fy: item.fy * height,
        tx: item.tx * width,
        ty: item.ty * height,
      });
    }
    // 换算为容易渲染的方式，[cx1?, cy1?, cx2?, cy2?, x, y]，贝塞尔控制点是前面的到当前的
    const first = temp[0];
    const p = [first.x, first.y];
    const res = [p], len = temp.length;
    for (let i = 1; i < len; i++) {
      const item = temp[i];
      const prev = temp[i - 1];
      const p = [item.x, item.y];
      if (item.hasCurveTo) {
        p.unshift(item.tx, item.ty);
      }
      if (prev.hasCurveFrom) {
        p.push(prev.fx, prev.fy);
      }
      res.push(p);
    }
    // 闭合
    if (props.isClosed) {
      const last = temp[len - 1];
      const p = [first.x, first.y];
      if (last.hasCurveTo) {
        p.push(last.tx, last.ty);
      }
      if (first.hasCurveFrom) {
        p.push(first.fx, first.fy);
      }
      res.push(p);
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
    } = this.computedStyle;
    const num = fill.length;
    for (let i = 0; i < num; i++) {
      const hasFill = fillEnable[i] && fill[i][3];
      const hasStroke = strokeEnable[i] && stroke[i][3] && strokeWidth[i];
      if (hasFill || hasStroke) {
        if (hasFill) {
          ctx.fillStyle = color2rgbaStr(fill[i]);
        }
        if (hasStroke) {
          ctx.strokeStyle = color2rgbaStr(stroke[i]);
          ctx.lineWidth = strokeWidth[i];
        }
        ctx.beginPath();
        const first = points[0];
        let xa, ya; // 起始点
        if (first.length === 4) {}
        else if (first.length === 6) {}
        else {
          xa = first[0] - x;
          ya = first[1] - y;
          ctx.moveTo(first[0] - x, first[1] - y);
        }
        for (let j = 1, len = points.length; j < len; j++) {
          const item = points[j];
          if (item.length === 4) {}
          else if (item.length === 6) {}
          else {
            const xb = item[0] - x, yb = item[1] - y;
            ctx.lineTo(xb, yb);
            // 自动闭合
            if (j === len - 1 && xa === ya && xb === yb) {
              ctx.closePath();
            }
          }
        }
        if (hasFill) {
          ctx.fill();
        }
        if (hasStroke) {
          ctx.stroke();
        }
      }
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
      const points = this.points!;
      const first = points[0];
      let xa, ya;
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
      for (let i = 1, len = points.length; i < len; i++) {
        const item = points[i];
        let xb, yb;
        if (item.length === 4) {}
        else if (item.length === 6) {}
        else {
          xb = item[0];
          yb = item[1];
          bbox[0] = Math.min(bbox[0], xb - half);
          bbox[1] = Math.min(bbox[1], yb - half);
          bbox[2] = Math.max(bbox[2], xb + half);
          bbox[3] = Math.max(bbox[3], yb + half);
        }
        xa = xb;
        ya = yb;
      }
    }
    return this._bbox;
  }
}

export default Polyline;
