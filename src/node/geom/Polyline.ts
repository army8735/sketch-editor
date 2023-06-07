import { PageProps, Point, PolylineProps } from '../../format';
import bezier from '../../math/bezier';
import { angleBySides, pointsDistance, toPrecision } from '../../math/geom';
import { calPoint, inverse4 } from '../../math/matrix';
import { unitize } from '../../math/vector';
import CanvasCache from '../../refresh/CanvasCache';
import config from '../../refresh/config';
import { RefreshLevel } from '../../refresh/level';
import { canvasPolygon } from '../../refresh/paint';
import { color2rgbaStr } from '../../style/css';
import {
  CURVE_MODE,
  FILL_RULE,
  GRADIENT,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
} from '../../style/define';
import { getConic, getLinear, getRadial } from '../../style/gradient';
import inject, { OffScreen } from '../../util/inject';
import Geom from './Geom';

function isCornerPoint(point: Point) {
  return point.curveMode === CURVE_MODE.STRAIGHT && point.cornerRadius > 0;
}

class Polyline extends Geom {
  constructor(props: PolylineProps) {
    super(props);
    this.isPolyline = true;
  }

  override buildPoints() {
    if (this.points) {
      return;
    }
    this.textureOutline?.release();
    const props = this.props as PolylineProps;
    const { width, height } = this;
    const points = props.points;
    let hasCorner = false;
    // 先算出真实尺寸，按w/h把[0,1]坐标转换
    for (let i = 0, len = points.length; i < len; i++) {
      const item = points[i];
      item.absX = (item.x || 0) * width;
      item.absY = (item.y || 0) * height;
      if (isCornerPoint(item)) {
        hasCorner = true;
      } else {
        if (item.hasCurveTo) {
          item.absTx = item.tx * width;
          item.absTy = item.ty * height;
        }
        if (item.hasCurveFrom) {
          item.absFx = item.fx * width;
          item.absFy = item.fy * height;
        }
      }
    }
    // 如果有圆角，拟合画圆
    const cache: Array<any> = [];
    if (hasCorner) {
      // 将圆角点拆分为2个顶点
      for (let i = 0, len = points.length; i < len; i++) {
        const point = points[i];
        if (!isCornerPoint(point)) {
          continue;
        }
        // 观察前后2个顶点的情况
        const prevIdx = i ? i - 1 : len - 1;
        const nextIdx = (i + 1) % len;
        const prevPoint = points[prevIdx];
        const nextPoint = points[nextIdx];
        let radius = point.cornerRadius;
        // 看前后2点是否也设置了圆角，相邻的圆角强制要求2点之间必须是直线，有一方是曲线的话走离散近似解
        const isPrevCorner = isCornerPoint(prevPoint);
        const isPrevStraight =
          isPrevCorner ||
          prevPoint.curveMode === CURVE_MODE.STRAIGHT ||
          !prevPoint.hasCurveFrom;
        const isNextCorner = isCornerPoint(nextPoint);
        const isNextStraight =
          isNextCorner ||
          nextPoint.curveMode === CURVE_MODE.STRAIGHT ||
          !nextPoint.hasCurveTo;
        // 先看最普通的直线，可以用角平分线+半径最小值约束求解
        if (isPrevStraight && isNextStraight) {
          // 2直线边长，ABC3个点，A是prev，B是curr，C是next
          const lenAB = pointsDistance(
            prevPoint.absX!,
            prevPoint.absY!,
            point.absX!,
            point.absY!,
          );
          const lenBC = pointsDistance(
            point.absX!,
            point.absY!,
            nextPoint.absX!,
            nextPoint.absY!,
          );
          const lenAC = pointsDistance(
            prevPoint.absX!,
            prevPoint.absY!,
            nextPoint.absX!,
            nextPoint.absY!,
          );
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
          const px = prevPoint.absX! - point.absX!,
            py = prevPoint.absY! - point.absY!;
          const pv = unitize(px, py);
          const nx = nextPoint.absX! - point.absX!,
            ny = nextPoint.absY! - point.absY!;
          const nv = unitize(nx, ny);
          // 相切的点
          const prevTangent = { x: pv.x * dist, y: pv.y * dist };
          prevTangent.x += points[i].absX!;
          prevTangent.y += points[i].absY!;
          const nextTangent = { x: nv.x * dist, y: nv.y * dist };
          nextTangent.x += points[i].absX!;
          nextTangent.y += points[i].absY!;
          // 计算 cubic handler 位置
          const kappa = (4 / 3) * Math.tan((Math.PI - radian) / 4);
          const prevHandle = {
            x: pv.x * -radius * kappa,
            y: pv.y * -radius * kappa,
          };
          prevHandle.x += prevTangent.x;
          prevHandle.y += prevTangent.y;
          const nextHandle = {
            x: nv.x * -radius * kappa,
            y: nv.y * -radius * kappa,
          };
          nextHandle.x += nextTangent.x;
          nextHandle.y += nextTangent.y;
          cache[i] = {
            prevTangent,
            prevHandle,
            nextTangent,
            nextHandle,
          };
        }
        // 两边只要有贝塞尔（一定是2阶），就只能用离散来逼近求圆心路径，两边中的直线则能直接求，2个圆心路径交点为所需圆心坐标
        else {
          // TODO
        }
      }
    }
    // 将圆角的2个点替换掉原本的1个点
    const temp = points.slice(0);
    for (let i = 0, len = temp.length; i < len; i++) {
      const c = cache[i];
      if (c) {
        const { prevTangent, prevHandle, nextTangent, nextHandle } = c;
        const p: Point = {
          x: 0,
          y: 0,
          cornerRadius: 0,
          cornerStyle: 0,
          curveMode: 0,
          hasCurveFrom: true,
          fx: 0,
          fy: 0,
          hasCurveTo: false,
          tx: 0,
          ty: 0,
          absX: prevTangent.x,
          absY: prevTangent.y,
          absFx: prevHandle.x,
          absFy: prevHandle.y,
          absTx: 0,
          absTy: 0,
        };
        const n: Point = {
          x: 0,
          y: 0,
          cornerRadius: 0,
          cornerStyle: 0,
          curveMode: 0,
          hasCurveFrom: false,
          fx: 0,
          fy: 0,
          hasCurveTo: true,
          tx: 0,
          ty: 0,
          absX: nextTangent.x,
          absY: nextTangent.y,
          absFx: 0,
          absFy: 0,
          absTx: nextHandle.x,
          absTy: nextHandle.y,
        };
        temp.splice(i, 1, p, n);
        i++;
        len++;
        cache.splice(i, 0, undefined);
      }
    }
    // 换算为容易渲染的方式，[cx1?, cy1?, cx2?, cy2?, x, y]，贝塞尔控制点是前面的到当前的，保留4位小数防止精度问题
    const first = temp[0];
    const p: Array<number> = [first.absX!, first.absY!];
    const res: Array<Array<number>> = [p],
      len = temp.length;
    for (let i = 1; i < len; i++) {
      const item = temp[i];
      const prev = temp[i - 1];
      const p: Array<number> = [
        toPrecision(item.absX!),
        toPrecision(item.absY!),
      ];
      if (item.hasCurveTo) {
        p.unshift(toPrecision(item.absTx!), toPrecision(item.absTy!));
      }
      if (prev.hasCurveFrom) {
        p.unshift(toPrecision(prev.absFx!), toPrecision(prev.absFy!));
      }
      res.push(p);
    }
    // 闭合
    if ((this.props as PolylineProps).isClosed) {
      const last = temp[len - 1];
      const p: Array<number> = [
        toPrecision(first.absX!),
        toPrecision(first.absY!),
      ];
      if (first.hasCurveTo) {
        p.unshift(toPrecision(first.absTx!), toPrecision(first.absTy!));
      }
      if (last.hasCurveFrom) {
        p.unshift(toPrecision(last.absFx!), toPrecision(last.absFy!));
      }
      res.push(p);
    }
    this.points = res;
  }

  deletePoint(point: Point) {
    const props = this.props as PolylineProps;
    const points = props.points;
    const i = points.indexOf(point);
    if (i > -1) {
      points.splice(i, 1);
      this.points = undefined;
      this.refresh();
    }
  }

  addPoint(point: Point, index: number) {
    const props = this.props as PolylineProps;
    const points = props.points;
    points.splice(index, 0, point);
    this.points = undefined;
    this.refresh();
  }

  override renderCanvas(scale: number) {
    super.renderCanvas(scale);
    this.buildPoints();
    const points = this.points!;
    const bbox = this._bbox || this.bbox;
    const x = bbox[0],
      y = bbox[1],
      w = bbox[2] - x,
      h = bbox[3] - y;
    // 暂时这样防止超限，TODO 超大尺寸
    while (
      w * scale > config.MAX_TEXTURE_SIZE ||
      h * scale > config.MAX_TEXTURE_SIZE
      ) {
      if (scale <= 1) {
        break;
      }
      scale = scale >> 1;
    }
    if (
      w * scale > config.MAX_TEXTURE_SIZE ||
      h * scale > config.MAX_TEXTURE_SIZE
    ) {
      return;
    }
    const dx = -x * scale,
      dy = -y * scale;
    const canvasCache = (this.canvasCache = CanvasCache.getInstance(
      w * scale,
      h * scale,
      dx,
      dy,
    ));
    canvasCache.available = true;
    const ctx = canvasCache.offscreen.ctx;
    const {
      fill,
      fillOpacity,
      fillRule,
      fillEnable,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
    } = this.computedStyle;
    if (scale !== 1) {
      ctx.setLineDash(strokeDasharray.map((i) => i * scale));
    } else {
      ctx.setLineDash(strokeDasharray);
    }
    // 先下层的fill
    for (let i = 0, len = fill.length; i < len; i++) {
      if (!fillEnable[i]) {
        continue;
      }
      const f = fill[i]; console.log(f);
      if (Array.isArray(f)) {
        if (!f[3]) {
          continue;
        }
        ctx.fillStyle = color2rgbaStr(f);
      } else {
        if (f.t === GRADIENT.LINEAR) {
          const gd = getLinear(
            f.stops,
            f.d,
            dx,
            dy,
            this.width * scale,
            this.height * scale,
          );
          const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
          gd.stop.forEach((item) => {
            lg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.fillStyle = lg;
        } else if (f.t === GRADIENT.RADIAL) {
          const gd = getRadial(
            f.stops,
            f.d,
            dx,
            dy,
            this.width * scale,
            this.height * scale,
          );
          const rg = ctx.createRadialGradient(
            gd.cx,
            gd.cy,
            0,
            gd.cx,
            gd.cy,
            gd.total,
          );
          gd.stop.forEach((item) => {
            rg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.fillStyle = rg;
        } else if (f.t === GRADIENT.CONIC) {
          const gd = getConic(
            f.stops,
            f.d,
            dx,
            dy,
            this.width * scale,
            this.height * scale,
          );
          const cg = ctx.createConicGradient(gd.angle, gd.cx, gd.cy);
          gd.stop.forEach((item) => {
            cg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.fillStyle = cg;
        }
      }
      ctx.beginPath();
      canvasPolygon(ctx, points, scale, dx, dy);
      if ((this.props as PolylineProps).isClosed) {
        ctx.closePath();
      }
      // fill有opacity，设置记得还原
      ctx.globalAlpha = fillOpacity[i];
      ctx.fill(fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero');
      ctx.globalAlpha = 1;
    }
    // 线帽设置
    if (strokeLinecap === STROKE_LINE_CAP.ROUND) {
      ctx.lineCap = 'round';
    } else if (strokeLinecap === STROKE_LINE_CAP.SQUARE) {
      ctx.lineCap = 'square';
    } else {
      ctx.lineCap = 'butt';
    }
    if (strokeLinejoin === STROKE_LINE_JOIN.ROUND) {
      ctx.lineJoin = 'round';
    } else if (strokeLinejoin === STROKE_LINE_JOIN.BEVEL) {
      ctx.lineJoin = 'bevel';
    } else {
      ctx.lineJoin = 'miter';
    }
    ctx.miterLimit = strokeMiterlimit * scale;
    // 再上层的stroke
    for (let i = 0, len = stroke.length; i < len; i++) {
      if (!strokeEnable[i] || !strokeWidth[i]) {
        continue;
      }
      const s = stroke[i];
      // 颜色
      if (Array.isArray(s)) {
        ctx.strokeStyle = color2rgbaStr(s);
      }
      // 或者渐变
      else {
        if (s.t === GRADIENT.LINEAR) {
          const gd = getLinear(s.stops, s.d, -x, -y, this.width, this.height);
          const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
          gd.stop.forEach((item) => {
            lg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.strokeStyle = lg;
        } else if (s.t === GRADIENT.RADIAL) {
          const gd = getRadial(s.stops, s.d, -x, -y, this.width, this.height);
          const rg = ctx.createRadialGradient(
            gd.cx,
            gd.cy,
            0,
            gd.cx,
            gd.cy,
            gd.total,
          );
          gd.stop.forEach((item) => {
            rg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.strokeStyle = rg;
        } else if (s.t === GRADIENT.CONIC) {
          const gd = getConic(
            s.stops,
            s.d,
            dx,
            dy,
            this.width * scale,
            this.height * scale,
          );
          const cg = ctx.createConicGradient(gd.angle, gd.cx, gd.cy);
          gd.stop.forEach((item) => {
            cg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.strokeStyle = cg;
        }
      }
      // 注意canvas只有居中描边，内部需用clip模拟，外部比较复杂需离屏擦除
      const p = strokePosition[i];
      let os: OffScreen | undefined, ctx2: CanvasRenderingContext2D | undefined;
      if (p === STROKE_POSITION.INSIDE) {
        ctx.lineWidth = strokeWidth[i] * 2 * scale;
        ctx.beginPath();
        canvasPolygon(ctx, points, scale, dx, dy);
      } else if (p === STROKE_POSITION.OUTSIDE) {
        os = inject.getOffscreenCanvas(w, h, 'outsideStroke');
        ctx2 = os.ctx;
        ctx2.setLineDash(strokeDasharray);
        ctx2.lineCap = ctx.lineCap;
        ctx2.lineJoin = ctx.lineJoin;
        ctx2.miterLimit = ctx.miterLimit * scale;
        ctx2.strokeStyle = ctx.strokeStyle;
        ctx2.lineWidth = strokeWidth[i] * 2 * scale;
        ctx2.beginPath();
        canvasPolygon(ctx2, points, scale, dx, dy);
      } else {
        ctx.lineWidth = strokeWidth[i] * scale;
        ctx.beginPath();
        canvasPolygon(ctx, points, scale, dx, dy);
      }
      if ((this.props as PolylineProps).isClosed) {
        if (ctx2) {
          ctx2.closePath();
        } else {
          ctx.closePath();
        }
      }
      if (p === STROKE_POSITION.INSIDE) {
        ctx.save();
        ctx.clip();
        ctx.stroke();
        ctx.restore();
      } else if (p === STROKE_POSITION.OUTSIDE) {
        ctx2!.stroke();
        ctx2!.save();
        ctx2!.clip();
        ctx2!.globalCompositeOperation = 'destination-out';
        ctx2!.strokeStyle = '#FFF';
        ctx2!.stroke();
        ctx2!.restore();
        ctx.drawImage(os!.canvas, 0, 0);
        os!.release();
      } else {
        ctx.stroke();
      }
    }
  }

  override getFrameProps() {
    const res = super.getFrameProps();
    res.isLine = this.isLine();
    this.buildPoints();
    const points = (this.props as PolylineProps).points;
    if (res.isLine) {
      res.length = Math.sqrt(
        Math.pow(points[1].absX! - points[0].absY!, 2) +
        Math.pow(points[1].absX! - points[0].absY!, 2),
      );
    }
    const m = res.matrix;
    points.forEach((item) => {
      const p = calPoint(
        { x: item.absX! - res.baseX, y: item.absY! - res.baseY },
        m,
      );
      item.dspX = p.x;
      item.dspY = p.y;
      if (item.hasCurveFrom) {
        const p = calPoint(
          { x: item.absFx! - res.baseX, y: item.absFy! - res.baseY },
          m,
        );
        item.dspFx = p.x;
        item.dspFy = p.y;
      }
      if (item.hasCurveTo) {
        const p = calPoint(
          { x: item.absTx! - res.baseX, y: item.absTy! - res.baseY },
          m,
        );
        item.dspTx = p.x;
        item.dspTy = p.y;
      }
    });
    res.points = points;
    return res;
  }

  // 改变坐标，基于相对于artBoard/page的面板展示坐标，matrix是getFrameProps()相对ap矩阵
  updatePointsBaseOnAP(points: Point[], matrix: Float64Array) {
    if (!points.length) {
      return points;
    }
    const list = (this.props as PolylineProps).points;
    const { width, height } = this;
    // 逆向还原矩阵和归一化点坐标
    const i = inverse4(matrix);
    let baseX = 0,
      baseY = 0;
    if (!this.artBoard) {
      baseX = (this.page?.props as PageProps).rule.baseX;
      baseY = (this.page?.props as PageProps).rule.baseY;
    }
    points.forEach((point) => {
      if (list.indexOf(point) === -1) {
        throw new Error('Can not update non-existent point');
      }
      const p = calPoint({ x: point.dspX! + baseX, y: point.dspY! + baseY }, i);
      point.absX = p.x;
      point.absY = p.y;
      point.x = p.x / width;
      point.y = p.y / height;
      if (point.hasCurveFrom) {
        const p = calPoint(
          { x: point.dspFx! + baseX, y: point.dspFy! + baseY },
          i,
        );
        point.absFx = p.x;
        point.absFy = p.y;
        point.fx = p.x / width;
        point.fy = p.y / height;
      }
      if (point.hasCurveTo) {
        const p = calPoint(
          { x: point.dspTx! + baseX, y: point.dspTy! + baseY },
          i,
        );
        point.absTx = p.x;
        point.absTy = p.y;
        point.tx = p.x / width;
        point.ty = p.y / height;
      }
    });
    this.root?.addUpdate(
      this,
      [],
      RefreshLevel.REPAINT,
      false,
      false,
      undefined,
    );
    return points;
  }

  // updatePointBaseOnAP()改变点坐标后，归一化处理和影响位置尺寸
  checkPointsChange() {
    const old = this._rect || this.rect;
    this.buildPoints();
    const points = this.points!;
    const first = points[0];
    let xa: number, ya: number;
    if (first.length === 4) {
      xa = first[2];
      ya = first[3];
    } else if (first.length === 6) {
      xa = first[4];
      ya = first[5];
    } else {
      xa = first[0];
      ya = first[1];
    }
    const rect = new Float64Array([xa, ya, xa, ya]);
    for (let i = 1, len = points.length; i < len; i++) {
      const item = points[i];
      let xb: number, yb: number;
      if (item.length === 4) {
        xb = item[2];
        yb = item[3];
        const b = bezier.bboxBezier(xa, ya, item[0], item[1], xb, yb);
        rect[0] = Math.min(rect[0], b[0]);
        rect[1] = Math.min(rect[1], b[1]);
        rect[2] = Math.max(rect[2], b[2]);
        rect[3] = Math.max(rect[3], b[3]);
      } else if (item.length === 6) {
        xb = item[4];
        yb = item[5];
        const b = bezier.bboxBezier(
          xa,
          ya,
          item[0],
          item[1],
          item[2],
          item[3],
          xb,
          yb,
        );
        rect[0] = Math.min(rect[0], b[0]);
        rect[1] = Math.min(rect[1], b[1]);
        rect[2] = Math.max(rect[2], b[2]);
        rect[3] = Math.max(rect[3], b[3]);
      } else {
        xb = item[0];
        yb = item[1];
        rect[0] = Math.min(rect[0], xb);
        rect[1] = Math.min(rect[1], yb);
        rect[2] = Math.max(rect[2], xb);
        rect[3] = Math.max(rect[3], yb);
      }
      xa = xb!;
      ya = yb!;
    }
    const dx = rect[0],
      dy = rect[1],
      dw = rect[2] - old[2],
      dh = rect[3] - old[3];
    // 检查真正有变化，位置相对于自己原本位置为原点
    if (dx || dy || dw || dh) {
      this.adjustPosAndSizeSelf(dx, dy, dw, dh);
      this.adjustPoints(dx, dy);
      this.checkPosSizeUpward();
    }
  }

  private adjustPoints(dx: number, dy: number) {
    const { width, height } = this;
    const points = (this.props as PolylineProps).points;
    points.forEach((point) => {
      point.x = (point.absX! - dx) / width;
      point.y = (point.absY! - dy) / height;
    });
  }

  toSvg(scale: number) {
    return super.toSvg(scale, (this.props as PolylineProps).isClosed);
  }
}

export default Polyline;
