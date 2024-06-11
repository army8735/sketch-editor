import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { JNode, Override, PageProps, Point, PolylineProps, TAG_NAME } from '../../format';
import { calPoint, inverse4 } from '../../math/matrix';
import CanvasCache from '../../refresh/CanvasCache';
import { canvasPolygon } from '../../refresh/paint';
import { color2rgbaStr } from '../../style/css';
import {
  ComputedGradient,
  ComputedPattern,
  CURVE_MODE,
  FILL_RULE,
  GRADIENT,
  MIX_BLEND_MODE,
  PATTERN_FILL_TYPE,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
} from '../../style/define';
import { getConic, getLinear, getRadial } from '../../style/gradient';
import inject, { OffScreen } from '../../util/inject';
import { clone } from '../../util/util';
import Geom from './Geom';
import { RefreshLevel } from '../../refresh/level';
import { getCanvasGCO } from '../../style/mbm';
import { getCurve, getStraight, isCornerPoint, XY } from './corner';
import { sliceBezier } from '../../math/bezier';

class Polyline extends Geom {
  props: PolylineProps;

  constructor(props: PolylineProps) {
    super(props);
    this.props = props;
    this.points = clone(props.points || []);
    this.isPolyline = true;
  }

  override buildPoints() {
    if (this.coords) {
      return;
    }
    this.textureOutline.forEach((item) => item?.release());
    this.coords = [];
    const { width, height } = this;
    const points = this.points;
    if (!points.length) {
      return;
    }
    let hasCorner = false;
    // 先算出真实尺寸，按w/h把[0,1]坐标转换
    for (let i = 0, len = points.length; i < len; i++) {
      const item = points[i];
      item.absX = (item.x || 0) * width;
      item.absY = (item.y || 0) * height;
      if (isCornerPoint(item)) {
        hasCorner = true;
      }
      else {
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
    const cache: Array<{
      prevTangent: XY,
      prevHandle: XY,
      nextTangent: XY,
      nextHandle: XY,
      t1?: number,
      t2?: number,
    } | undefined> = [];
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
          cache[i] = getStraight(prevPoint, point, nextPoint, isPrevCorner, isNextCorner, radius);
        }
        // 两边只要有贝塞尔（一定是2阶），就只能用离散来逼近求圆心路径，2个圆心路径交点为所需圆心坐标
        else {
          cache[i] = getCurve(prevPoint, point, nextPoint, isPrevCorner, isNextCorner, radius);
        }
      }
    }
    // 将圆角的2个点替换掉原本的1个点
    const temp = clone(points);
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
        // 前后如果是曲线，需用t计算截取，改变控制点即可
        if (c.t1) {
          const prev = temp[(i + len - 1) % len];
          const curve = sliceBezier([
            { x: prev.absX!, y: prev.absY! },
            { x: prev.absFx!, y: prev.absFy! },
            { x: temp[i].absX!, y: temp[i].absY! },
          ], 0, c.t1);
          prev.absFx = curve[1].x;
          prev.absFy = curve[1].y;
        }
        if (c.t2) {
          const next = temp[(i + 1) % len];
          const curve = sliceBezier([
            { x: next.absX!, y: next.absY! },
            { x: next.absTx!, y: next.absTy! },
            { x: temp[i].absX!, y: temp[i].absY! },
          ], 0, 1 - c.t2);
          next.absTx = curve[1].x;
          next.absTy = curve[1].y;
        }
        // 插入新点注意索引
        temp.splice(i, 1, p, n);
        i++;
        len++;
        cache.splice(i, 0, undefined);
      }
    }
    // 换算为容易渲染的方式，[cx1?, cy1?, cx2?, cy2?, x, y]，贝塞尔控制点是前面的到当前的
    const first = temp[0];
    const p: number[] = [
      first.absX!,
      first.absY!,
    ];
    const res: number[][] = [p],
      len = temp.length;
    for (let i = 1; i < len; i++) {
      const item = temp[i];
      const prev = temp[i - 1];
      const p: number[] = [
        item.absX!,
        item.absY!,
      ];
      if (item.hasCurveTo) {
        p.unshift(item.absTx!, item.absTy!);
      }
      if (prev.hasCurveFrom) {
        p.unshift(prev.absFx!, prev.absFy!);
      }
      res.push(p);
    }
    // 闭合
    if (this.props.isClosed) {
      const last = temp[len - 1];
      const p: number[] = [
        first.absX!,
        first.absY!,
      ];
      if (first.hasCurveTo) {
        p.unshift(first.absTx!, first.absTy!);
      }
      if (last.hasCurveFrom) {
        p.unshift(last.absFx!, last.absFy!);
      }
      res.push(p);
    }
    this.coords.push(...res);
  }

  // deletePoint(point: Point | number) {
  //   const props = this.props;
  //   const points = props.points;
  //   if (typeof point === 'number') {
  //     points.splice(point, 1);
  //     this.points = undefined;
  //     // this.checkPointsChange();
  //     this.refresh();
  //     return;
  //   }
  //   const i = points.indexOf(point);
  //   if (i > -1) {
  //     points.splice(i, 1);
  //     this.points = undefined;
  //     // this.checkPointsChange();
  //     this.refresh();
  //   }
  // }
  //
  // addPoint(point: Point, index: number) {
  //   const props = this.props;
  //   const points = props.points;
  //   points.splice(index, 0, point);
  //   this.points = undefined;
  //   // this.checkPointsChange();
  //   this.refresh();
  // }
  //
  // modifyPoint() {
  //   this.points = undefined;
  //   // this.checkPointsChange();
  //   this.refresh();
  // }

  override renderCanvas(scale: number) {
    super.renderCanvas(scale);
    this.buildPoints();
    const coords = this.coords;
    if (!coords || !coords.length) {
      return;
    }
    const bbox = this._bbox2 || this.bbox2;
    const x = bbox[0],
      y = bbox[1];
    let w = bbox[2] - x,
      h = bbox[3] - y;
    const dx = -x * scale,
      dy = -y * scale;
    w *= scale;
    h *= scale;
    const canvasCache = (this.canvasCache = CanvasCache.getInstance(w, h, dx, dy));
    canvasCache.available = true;
    const {
      fill,
      fillOpacity,
      fillRule,
      fillEnable,
      fillMode,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
    } = this.computedStyle;
    const isLine = this.isLine();
    const list = canvasCache.list;
    for (let i = 0, len = list.length; i < len; i++) {
      const { x, y, os: { ctx } } = list[i];
      const dx2 = -x;
      const dy2 = -y;
      if (scale !== 1) {
        ctx.setLineDash(strokeDasharray.map((i) => i * scale));
      }
      else {
        ctx.setLineDash(strokeDasharray);
      }
      ctx.beginPath();
      canvasPolygon(ctx, coords, scale, dx2, dy2);
      if (this.props.isClosed) {
        ctx.closePath();
      }
      // 先下层的fill
      for (let i = 0, len = fill.length; i < len; i++) {
        if (!fillEnable[i] || !fillOpacity[i]) {
          continue;
        }
        let f = fill[i];
        // 椭圆的径向渐变无法直接完成，用mask来模拟，即原本用纯色填充，然后离屏绘制渐变并用matrix模拟椭圆，再合并
        let ellipse: OffScreen | undefined;
        const mode = fillMode[i];
        ctx.globalAlpha = fillOpacity[i];
        if (Array.isArray(f)) {
          if (!f[3]) {
            continue;
          }
          ctx.fillStyle = color2rgbaStr(f);
        }
        // 非纯色
        else {
          // 图像填充
          if ((f as ComputedPattern).url !== undefined) {
            f = f as ComputedPattern;
            const url = f.url;
            if (url) {
              let loader = this.loaders[i];
              const cache = inject.IMG[url];
              // 已有的图像同步直接用
              if (!loader && cache && cache.source) {
                loader = this.loaders[i] = {
                  error: false,
                  loading: false,
                  width: cache.width,
                  height: cache.height,
                  source: cache.source,
                };
              }
              if (loader) {
                if (!loader.error && !loader.loading && loader.source) {
                  const width = this.width;
                  const height = this.height;
                  const wc = width * scale;
                  const hc = height * scale;
                  // 裁剪到范围内，不包含边框，即矢量本身的内容范围，本来直接在原画布即可，但chrome下clip+mbm有问题，不得已用离屏
                  const os = inject.getOffscreenCanvas(w, h);
                  const ctx2 = os.ctx;
                  ctx2.beginPath();
                  canvasPolygon(ctx2, coords, scale, dx2, dy2);
                  if (this.props.isClosed) {
                    ctx2.closePath();
                  }
                  ctx2.save();
                  ctx2.clip();
                  if (f.type === PATTERN_FILL_TYPE.TILE) {
                    const ratio = f.scale ?? 1;
                    for (let i = 0, len = Math.ceil(width / ratio / loader.width); i < len; i++) {
                      for (let j = 0, len = Math.ceil(height / ratio / loader.height); j < len; j++) {
                        ctx2.drawImage(
                          loader.source,
                          dx2 + i * loader.width * scale * ratio,
                          dy2 + j * loader.height * scale * ratio,
                          loader.width * scale * ratio,
                          loader.height * scale * ratio,
                        );
                      }
                    }
                  }
                  else if (f.type === PATTERN_FILL_TYPE.FILL) {
                    const sx = wc / loader.width;
                    const sy = hc / loader.height;
                    const sc = Math.max(sx, sy);
                    const x = (loader.width * sc - wc) * -0.5;
                    const y = (loader.height * sc - hc) * -0.5;
                    ctx2.drawImage(loader.source, 0, 0, loader.width, loader.height,
                      x + dx2, y + dy2, loader.width * sc, loader.height * sc);
                  }
                  else if (f.type === PATTERN_FILL_TYPE.STRETCH) {
                    ctx2.drawImage(loader.source!, dx2, dy2, wc, hc);
                  }
                  else if (f.type === PATTERN_FILL_TYPE.FIT) {
                    const sx = wc / loader.width;
                    const sy = hc / loader.height;
                    const sc = Math.min(sx, sy);
                    const x = (loader.width * sc - wc) * -0.5;
                    const y = (loader.height * sc - hc) * -0.5;
                    ctx2.drawImage(loader.source, 0, 0, loader.width, loader.height,
                      x + dx2, y + dy2, loader.width * sc, loader.height * sc);
                  }
                  // 记得还原
                  ctx2.restore();
                  if (mode !== MIX_BLEND_MODE.NORMAL) {
                    ctx.globalCompositeOperation = getCanvasGCO(mode);
                  }
                  ctx.drawImage(os.canvas, 0, 0);
                  if (mode !== MIX_BLEND_MODE.NORMAL) {
                    ctx.globalCompositeOperation = 'source-over';
                  }
                  os.release();
                }
                else if (!loader.error && !loader.loading) {
                  this.root!.imgLoadingCount++;
                }
              }
              else {
                this.root!.imgLoadingCount++;
                loader = this.loaders[i] = this.loaders[i] || {
                  error: false,
                  loading: true,
                  width: 0,
                  height: 0,
                  source: undefined,
                };
                inject.measureImg(url, (data: any) => {
                  // 可能会变更，所以加载完后对比下是不是当前最新的
                  if (url === (fill[i] as ComputedPattern)?.url) {
                    loader.loading = false;
                    if (data.success) {
                      loader.error = false;
                      loader.source = data.source;
                      loader.width = data.width;
                      loader.height = data.height;
                      if (!this.isDestroyed) {
                        this.root!.addUpdate(
                          this,
                          [],
                          RefreshLevel.REPAINT,
                          false,
                          false,
                          undefined,
                        );
                      }
                    }
                    else {
                      loader.error = true;
                    }
                    this.root!.imgLoadingCount--;
                  }
                });
              }
            }
            continue;
          }
          // 渐变
          else {
            f = f as ComputedGradient;
            if (f.t === GRADIENT.LINEAR) {
              const gd = getLinear(f.stops, f.d, dx2, dy2, w - dx * 2, h - dy * 2);
              const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
              gd.stop.forEach((item) => {
                lg.addColorStop(item.offset!, color2rgbaStr(item.color));
              });
              ctx.fillStyle = lg;
            }
            else if (f.t === GRADIENT.RADIAL) {
              const gd = getRadial(f.stops, f.d, dx2, dy2, w - dx * 2, h - dy * 2);
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
              // 椭圆渐变，由于有缩放，用clip确定绘制范围，然后缩放长短轴绘制椭圆
              const m = gd.matrix;
              if (m) {
                ellipse = inject.getOffscreenCanvas(w, h);
                const ctx2 = ellipse.ctx;
                ctx2.beginPath();
                canvasPolygon(ctx2, coords, scale, dx2, dy2);
                if (this.props.isClosed) {
                  ctx2.closePath();
                }
                ctx2.clip();
                ctx2.fillStyle = rg;
                ctx2.setTransform(m[0], m[1], m[4], m[5], m[12], m[13]);
                ctx2.fill(fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero');
              }
              else {
                ctx.fillStyle = rg;
              }
            }
            else if (f.t === GRADIENT.CONIC) {
              const gd = getConic(f.stops, f.d, dx2, dy2, w - dx * 2, h - dy * 2);
              const cg = ctx.createConicGradient(gd.angle, gd.cx + dx2, gd.cy + dy2);
              gd.stop.forEach((item) => {
                cg.addColorStop(item.offset!, color2rgbaStr(item.color));
              });
              ctx.fillStyle = cg;
            }
          }
        }
        if (mode !== MIX_BLEND_MODE.NORMAL) {
          ctx.globalCompositeOperation = getCanvasGCO(mode);
        }
        if (ellipse) {
          ctx.drawImage(ellipse.canvas, 0, 0);
          ellipse.release();
        }
        else {
          ctx.fill(fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero');
        }
        if (mode !== MIX_BLEND_MODE.NORMAL) {
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      // fill有opacity和mode，设置记得还原
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // 内阴影使用canvas的能力
      const { innerShadow, innerShadowEnable } = this.computedStyle;
      if (innerShadow && innerShadow.length) {
        let hasInnerShadow = false;
        // 计算取偏移+spread最大值后再加上blur半径，这个尺寸扩展用以生成shadow的必要宽度
        let n = 0;
        innerShadow.forEach((item, i) => {
          if (!innerShadowEnable[i]) {
            return;
          }
          hasInnerShadow = true;
          const m =
            (Math.max(Math.abs(item.x), Math.abs(item.y)) + item.spread) * scale;
          n = Math.max(n, m + item.blur * scale);
        });
        if (hasInnerShadow) {
          // 限制在图形内clip
          ctx.save();
          ctx.beginPath();
          canvasPolygon(ctx, coords, scale, dx2, dy2);
          if (this.props.isClosed) {
            ctx.closePath();
          }
          ctx.clip();
          ctx.fillStyle = '#FFF';
          // 在原本图形基础上，外围扩大n画个边框，这样奇偶使得填充在clip范围外不会显示出来，但shadow却在内可以显示
          ctx.beginPath();
          canvasPolygon(ctx, coords, scale, dx2, dy2);
          canvasPolygon(
            ctx,
            [
              [-n, -n],
              [w + n, -n],
              [w + n, h + n],
              [-n, h + n],
              [-n, -n],
            ],
            1,
            dx2,
            dy2,
          );
          ctx.closePath();
          innerShadow.forEach((item, i) => {
            if (!innerShadowEnable[i]) {
              return;
            }
            ctx.shadowOffsetX = item.x * scale;
            ctx.shadowOffsetY = item.y * scale;
            ctx.shadowColor = color2rgbaStr(item.color);
            ctx.shadowBlur = item.blur * scale;
            ctx.fill('evenodd');
          });
          ctx.restore();
          // 还原给stroke用
          ctx.beginPath();
          canvasPolygon(ctx, coords, scale, dx2, dy2);
          if (this.props.isClosed) {
            ctx.closePath();
          }
        }
      }
      // 线帽设置
      if (strokeLinecap === STROKE_LINE_CAP.ROUND) {
        ctx.lineCap = 'round';
      }
      else if (strokeLinecap === STROKE_LINE_CAP.SQUARE) {
        ctx.lineCap = 'square';
      }
      else {
        ctx.lineCap = 'butt';
      }
      if (strokeLinejoin === STROKE_LINE_JOIN.ROUND) {
        ctx.lineJoin = 'round';
      }
      else if (strokeLinejoin === STROKE_LINE_JOIN.BEVEL) {
        ctx.lineJoin = 'bevel';
      }
      else {
        ctx.lineJoin = 'miter';
      }
      ctx.miterLimit = strokeMiterlimit;
      // 再上层的stroke
      for (let i = 0, len = stroke.length; i < len; i++) {
        if (!strokeEnable[i] || !strokeWidth[i]) {
          continue;
        }
        const s = stroke[i];
        const p = strokePosition[i];
        ctx.globalCompositeOperation = getCanvasGCO(strokeMode[i]);
        // 颜色
        if (Array.isArray(s)) {
          ctx.strokeStyle = color2rgbaStr(s);
        }
        // 或者渐变
        else {
          if (s.t === GRADIENT.LINEAR) {
            const gd = getLinear(s.stops, s.d, dx2, dy2, w - dx2 * 2, h - dy2 * 2);
            const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
            gd.stop.forEach((item) => {
              lg.addColorStop(item.offset!, color2rgbaStr(item.color));
            });
            ctx.strokeStyle = lg;
          }
          else if (s.t === GRADIENT.RADIAL) {
            const gd = getRadial(s.stops, s.d, dx2, dy2, w - dx2 * 2, h - dy2 * 2);
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
            // 椭圆渐变，由于有缩放，先离屏绘制白色stroke记a，再绘制变换的结果整屏fill记b，b混合到a上用source-in即可只显示重合的b
            const m = gd.matrix;
            if (m) {
              const ellipse = inject.getOffscreenCanvas(w, h);
              const ctx2 = ellipse.ctx;
              ctx2.setLineDash(ctx.getLineDash());
              ctx2.lineCap = ctx.lineCap;
              ctx2.lineJoin = ctx.lineJoin;
              ctx2.miterLimit = ctx.miterLimit;
              ctx2.lineWidth = strokeWidth[i] * scale;
              ctx2.strokeStyle = '#FFF';
              ctx2.beginPath();
              canvasPolygon(ctx2, coords, scale, dx2, dy2);
              if (this.props.isClosed) {
                ctx2.closePath();
              }
              if (p === STROKE_POSITION.INSIDE) {
                ctx2.lineWidth = strokeWidth[i] * 2 * scale;
                ctx2.save();
                if (!isLine) {
                  ctx2.clip();
                }
                ctx2.stroke();
                ctx2.restore();
              }
              else if (p === STROKE_POSITION.OUTSIDE) {
                ctx2.lineWidth = strokeWidth[i] * 2 * scale;
                ctx2.stroke();
                ctx2.save();
                if (!isLine) {
                  ctx2.clip();
                }
                ctx2.globalCompositeOperation = 'destination-out';
                ctx2.strokeStyle = '#FFF';
                ctx2.stroke();
                ctx2.restore();
              }
              else {
                ctx2.stroke();
              }
              ctx2.fillStyle = rg;
              ctx2.globalCompositeOperation = 'source-in';
              ctx2.setTransform(m[0], m[1], m[4], m[5], m[12], m[13]);
              ctx2.fillRect(0, 0, w, h);
              ctx.drawImage(ellipse.canvas, 0, 0);
              ellipse.release();
              continue;
            }
            else {
              ctx.strokeStyle = rg;
            }
          }
          else if (s.t === GRADIENT.CONIC) {
            const gd = getConic(s.stops, s.d, dx2, dy2, w - dx2 * 2, h - dy2 * 2);
            const cg = ctx.createConicGradient(gd.angle, gd.cx + dx2, gd.cy + dy2);
            gd.stop.forEach((item) => {
              cg.addColorStop(item.offset!, color2rgbaStr(item.color));
            });
            ctx.strokeStyle = cg;
          }
        }
        // 注意canvas只有居中描边，内部需用clip模拟，外部比较复杂需离屏擦除
        let os: OffScreen | undefined, ctx2: CanvasRenderingContext2D | undefined;
        if (p === STROKE_POSITION.INSIDE) {
          ctx.lineWidth = strokeWidth[i] * 2 * scale;
        }
        else if (p === STROKE_POSITION.OUTSIDE) {
          os = inject.getOffscreenCanvas(w, h);
          ctx2 = os.ctx;
          ctx2.setLineDash(ctx.getLineDash());
          ctx2.lineCap = ctx.lineCap;
          ctx2.lineJoin = ctx.lineJoin;
          ctx2.miterLimit = ctx.miterLimit;
          ctx2.strokeStyle = ctx.strokeStyle;
          ctx2.lineWidth = strokeWidth[i] * 2 * scale;
          ctx2.beginPath();
          canvasPolygon(ctx2, coords, scale, dx2, dy2);
        }
        else {
          ctx.lineWidth = strokeWidth[i] * scale;
        }
        if (this.props.isClosed) {
          if (ctx2) {
            ctx2.closePath();
          }
        }
        if (p === STROKE_POSITION.INSIDE) {
          ctx.save();
          if (!isLine) {
            ctx.clip();
          }
          ctx.stroke();
          ctx.restore();
        }
        else if (p === STROKE_POSITION.OUTSIDE) {
          ctx2!.stroke();
          ctx2!.save();
          if (!isLine) {
            ctx2!.clip();
          }
          ctx2!.globalCompositeOperation = 'destination-out';
          ctx2!.strokeStyle = '#FFF';
          ctx2!.stroke();
          ctx2!.restore();
          ctx.drawImage(os!.canvas, dx2 - dx, dy2 - dy);
          os!.release();
        }
        else {
          ctx.stroke();
        }
      }
      // 还原
      ctx.globalCompositeOperation = 'source-over';
    }
    // list.forEach((item) => {
    //   item.os.canvas.toBlob(blob => {
    //     if (blob) {
    //       const img = document.createElement('img');
    //       img.src = URL.createObjectURL(blob);
    //       document.body.appendChild(img);
    //     }
    //   });
    // });
  }

  // 改变坐标，基于相对于artBoard/page的面板展示坐标，matrix是getFrameProps()相对ap矩阵
  updatePointsBaseOnAP(points: Point[], matrix: Float64Array) {
    if (!points.length) {
      return points;
    }
    const list = this.props.points;
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
    this.refresh();
    return points;
  }

  // 改变点后，归一化处理和影响位置尺寸计算（本身和向上）
  checkPointsChange() {
    this._rect = undefined;
    this._bbox = undefined;
    const rect = this.rect;
    const dx = rect[0],
      dy = rect[1],
      dw = rect[2] - this.width,
      dh = rect[3] - this.height;
    // 检查真正有变化，位置相对于自己原本位置为原点
    if (dx || dy || dw || dh) {
      this.adjustPosAndSizeSelf(dx, dy, dw, dh);
      this.adjustPoints(dx, dy);
      this.checkPosSizeUpward();
    }
  }

  private adjustPoints(dx: number, dy: number) {
    const { width, height } = this;
    const points = this.points;
    points.forEach((point) => {
      point.x = (point.absX! - dx) / width;
      point.y = (point.absY! - dy) / height;
      if (point.hasCurveFrom) {
        point.fx = (point.absFx! - dx) / width;
        point.fy = (point.absFy! - dy) / height;
      }
      if (point.hasCurveTo) {
        point.tx = (point.absTx! - dx) / width;
        point.ty = (point.absTy! - dy) / height;
      }
    });
    this.points.splice(0);
  }

  toSvg(scale: number) {
    return super.toSvg(scale, this.props.isClosed);
  }

  override clone(override?: Record<string, Override>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    props.sourceUuid = this.props.uuid;
    const res = new Polyline(props);
    res.style = clone(this.style);
    res.computedStyle = clone(this.computedStyle);
    if (override) {
    }
    return res;
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.POLYLINE;
    return res;
  }

  override async toSketchJson(zip: JSZip): Promise<SketchFormat.ShapePath> {
    const json = await super.toSketchJson(zip) as SketchFormat.ShapePath;
    json._class = SketchFormat.ClassValue.ShapePath;
    json.isClosed = this.props.isClosed;
    json.points = this.points.map(item => {
      return {
        _class: 'curvePoint',
        cornerRadius: item.cornerRadius,
        cornerStyle: [
          SketchFormat.CornerStyle.Rounded,
          SketchFormat.CornerStyle.RoundedInverted,
          SketchFormat.CornerStyle.Angled,
          SketchFormat.CornerStyle.Squared,
        ][item.cornerStyle || 0],
        curveMode: [
          SketchFormat.CurveMode.None,
          SketchFormat.CurveMode.Straight,
          SketchFormat.CurveMode.Mirrored,
          SketchFormat.CurveMode.Asymmetric,
          SketchFormat.CurveMode.Disconnected,
        ][item.curveMode || 0],
        hasCurveFrom: item.hasCurveFrom,
        hasCurveTo: item.hasCurveTo,
        curveFrom: '{' + item.fx + ', ' + item.fy + '}',
        curveTo: '{' + item.tx + ', ' + item.ty + '}',
        point: '{' + item.x + ', ' + item.y + '}',
      };
    });
    return json;
  }

  override destroy() {
    if (this.isDestroyed) {
      return;
    }
    const root = this.root;
    super.destroy();
    if (root) {
      this.loaders.forEach(item => {
        if (item.loading) {
          root.imgLoadingCount--;
          item.loading = false;
        }
      });
    }
  }

  // getAllBezierCurves(): Array<{ x: number; y: number }>[] {
  //   const result: Array<{ x: number; y: number }>[] = [];
  //   const points = this.getFrameProps().points;
  //   const w = this.width;
  //   const h = this.height;
  //   // 非闭合
  //   for (let i = 0; i < points.length - 1; i++) {
  //     const curve: Array<{ x: number; y: number }> = [];
  //     result.push(curve);
  //     curve.push(
  //       {
  //         x: w * points[i].x,
  //         y: h * points[i].y,
  //       },
  //       {
  //         x: w * (points[i].hasCurveFrom ? points[i].fx : points[i].x),
  //         y: h * (points[i].hasCurveFrom ? points[i].fy : points[i].y),
  //       },
  //       {
  //         x:
  //           w *
  //           (points[i + 1].hasCurveFrom ? points[i + 1].tx : points[i + 1].x),
  //         y:
  //           h *
  //           (points[i + 1].hasCurveFrom ? points[i + 1].ty : points[i + 1].y),
  //       },
  //       {
  //         x: w * points[i + 1].x,
  //         y: h * points[i + 1].y,
  //       },
  //     );
  //   }
  //
  //   if (this.props.isClosed) {
  //     const index = points.length - 1;
  //     result.push([
  //       {
  //         x: w * points[index].x,
  //         y: h * points[index].y,
  //       },
  //       {
  //         x:
  //           w *
  //           (points[index].hasCurveFrom ? points[index].fx : points[index].x),
  //         y:
  //           h *
  //           (points[index].hasCurveFrom ? points[index].fy : points[index].y),
  //       },
  //       {
  //         x: w * (points[0].hasCurveFrom ? points[0].tx : points[0].x),
  //         y: h * (points[0].hasCurveFrom ? points[0].ty : points[0].y),
  //       },
  //       {
  //         x: w * points[0].x,
  //         y: h * points[0].y,
  //       },
  //     ]);
  //   }
  //
  //   return result;
  // }
}

export default Polyline;
