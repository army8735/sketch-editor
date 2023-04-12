import Geom from './Geom';
import { CurveMode, Point, PolylineProps } from '../../format';
import CanvasCache from '../../refresh/CanvasCache';
import { color2rgbaStr } from '../../style/css';
import { canvasPolygon } from '../../refresh/paint';
import { getLinear } from '../../style/gradient';
import { angleBySides, pointsDistance, h } from '../../math/geom';
import { unitize } from '../../math/vector';

function isCornerPoint(point: Point) {
  return point.curveMode === CurveMode.Straight && point.cornerRadius > 0;
}

class Polyline extends Geom {
  points?: Array<Array<number>>;
  constructor(props: PolylineProps) {
    super(props);
  }

  private buildPoints() {
    const props = this.props as PolylineProps;
    const { width, height } = this;
    const temp: Array<any> = [];
    const points = props.points;
    let hasCorner = false;
    // 先算出真实尺寸，按w/h把[0,1]坐标转换
    for (let i = 0, len = points.length; i < len; i++) {
      const item = points[i];
      const res: any = {
        x: item.x * width,
        y: item.y * height,
      };
      if (isCornerPoint(item)) {
        hasCorner = true;
      }
      else {
        if (item.hasCurveTo) {
          res.tx = item.tx * width;
          res.ty = item.ty * height;
        }
        if (item.hasCurveFrom) {
          res.fx = item.fx * width;
          res.fy = item.fy * height;
        }
      }
      temp.push(res);
    }
    // 如果有圆角，拟合画圆
    if (hasCorner) {
      // 倒序将圆角点拆分为2个顶点
      for (let len = points.length, i = len - 1; i >= 0; i--) {
        const point = points[i];
        if (!isCornerPoint(point)) {
          continue;
        }
        // 观察前后2个顶点的情况
        const prevIdx = i ? (i - 1) : (len - 1);
        const nextIdx = (i + 1) % len;
        const prevPoint = points[prevIdx];
        const nextPoint = points[nextIdx];
        let radius = point.cornerRadius;
        // 看前后2点是否也设置了圆角，相邻的圆角强制要求2点之间必须是直线，有一方是曲线的话走离散近似解
        const isPrevCorner = isCornerPoint(prevPoint);
        const isPrevStraight = isPrevCorner
          || prevPoint.curveMode === CurveMode.Straight
          || !prevPoint.hasCurveFrom;
        const isNextCorner = isCornerPoint(nextPoint);
        const isNextStraight = isNextCorner
          || nextPoint.curveMode === CurveMode.Straight
          || !nextPoint.hasCurveTo;
        // 先看最普通的直线，可以用角平分线+半径最小值约束求解
        if (isPrevStraight && isNextStraight) {
          // 2直线边长，ABC3个点，A是prev，B是curr，C是next
          const lenAB = pointsDistance(prevPoint.x * width, prevPoint.y * height, point.x * width, point.y * height);
          const lenBC = pointsDistance(point.x * width, point.y * height, nextPoint.x * width, nextPoint.y * height);
          const lenAC = pointsDistance(prevPoint.x * width, prevPoint.y * height, nextPoint.x * width, nextPoint.y * height);
          // 三点之间的夹角
          const radian = angleBySides(lenAC, lenAB, lenBC);
          // 计算切点距离
          const tangent = Math.tan(radian * 0.5);
          let dist = radius / tangent;
          // 校准 dist，用户设置的 cornerRadius 可能太大，而实际显示 cornerRadius 受到 AB BC 两边长度限制。
          // 如果 B C 端点设置了 cornerRadius，可用长度减半
          const minDist = Math.min(
            isPrevCorner ? lenAB * 0.5 : lenAB,
            isNextCorner ? lenBC * 0.5 : lenBC,
          );
          if (dist > minDist) {
            dist = minDist;
            radius = dist * tangent;
          }
          // 方向向量
          const px = prevPoint.x - point.x, py = prevPoint.y - point.y;
          const pv = unitize(px, py);
          const nx = nextPoint.x - point.x, ny = nextPoint.y - point.y;
          const nv = unitize(nx, ny);
          // 相切的点
          const prevTangent = { x: pv.x * dist, y: pv.y * dist };
          prevTangent.x += temp[i].x;
          prevTangent.y += temp[i].y;
          const nextTangent = { x: nv.x * dist, y: nv.y * dist };
          nextTangent.x += temp[i].x;
          nextTangent.y += temp[i].y;
          // 计算 cubic handler 位置
          const kappa = h(radian);
          const prevHandle = { x: pv.x * -radius * kappa, y: pv.y * -radius * kappa };
          prevHandle.x += prevTangent.x;
          prevHandle.y += prevTangent.y;
          const nextHandle = { x: nv.x * -radius * kappa, y: nv.y * -radius * kappa };
          nextHandle.x += nextTangent.x;
          nextHandle.y += nextTangent.y;
          // 删除当前顶点，替换为3阶贝塞尔曲线
          temp.splice(i, 1, {
            x: prevTangent.x,
            y: prevTangent.y,
            fx: prevHandle.x,
            fy: prevHandle.y,
          }, {
            x: nextTangent.x,
            y: nextTangent.y,
            tx: nextHandle.x,
            ty: nextHandle.y,
          });
        }
        // 两边只要有贝塞尔（一定是2阶），就只能用离散来逼近求圆心路径，两边中的直线则能直接求，2个圆心路径交点为所需圆心坐标
        else {
          // TODO
        }
      }
    }
    // 换算为容易渲染的方式，[cx1?, cy1?, cx2?, cy2?, x, y]，贝塞尔控制点是前面的到当前的
    const first = temp[0];
    const p = [first.x, first.y];
    const res = [p], len = temp.length;
    for (let i = 1; i < len; i++) {
      const item = temp[i];
      const prev = temp[i - 1];
      const p = [item.x, item.y];
      if (item.tx !== undefined) {
        p.unshift(item.tx, item.ty);
      }
      if (prev.fx !== undefined) {
        p.unshift(prev.fx, prev.fy);
      }
      res.push(p);
    }
    // 闭合
    if (props.isClosed) {
      const last = temp[len - 1];
      const p = [first.x, first.y];
      if (first.tx !== undefined) {
        p.unshift(first.tx, first.ty);
      }
      if (last.fx !== undefined) {
        p.unshift(last.fx, last.fy);
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
      canvasPolygon(ctx, points, -x, -y);
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
      canvasPolygon(ctx, points, -x, -y);
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
