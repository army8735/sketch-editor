import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { getDefaultStyle, JNode, JStyle, Override, ShapeGroupProps, TAG_NAME } from '../../format';
import bo from '../../math/bo';
import { calPoint, isE } from '../../math/matrix';
import CanvasCache from '../../refresh/CanvasCache';
import { canvasPolygon, svgPolygon } from '../../refresh/paint';
import { color2rgbaInt, color2rgbaStr } from '../../style/css';
import {
  BOOLEAN_OPERATION,
  ComputedGradient,
  ComputedPattern,
  FILL_RULE,
  GRADIENT,
  MIX_BLEND_MODE,
  PATTERN_FILL_TYPE,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
  StyleUnit, VISIBILITY,
} from '../../style/define';
import { getConic, getLinear, getRadial } from '../../style/gradient';
import { migrate, sortTempIndex } from '../../tools/node';
import inject, { OffScreen } from '../../util/inject';
import { clone } from '../../util/type';
import Group from '../Group';
import { LayoutData } from '../layout';
import Node from '../Node';
import Polyline from './Polyline';
import { RefreshLevel } from '../../refresh/level';
import { getCanvasGCO } from '../../style/mbm';
import { lineJoin } from './border';
import { getShapeGroupRect } from '../../math/bbox';

function scaleUp(points: number[][]) {
  return points.map(point => {
    return point.map(item => Math.round(item * 100));
  });
}

function scaleDown(points: number[][]) {
  return points.map(point => {
    return point.map(item => item * 0.01);
  });
}

function applyMatrixPoints(points: number[][], m: Float64Array) {
  if (m && !isE(m)) {
    const a1 = m[0],
      b1 = m[1];
    const a2 = m[4],
      b2 = m[5];
    const a4 = m[12],
      b4 = m[13];
    return points.map((item) => {
      const c1 =
        (a1 === 1 ? item[0] : item[0] * a1) + (a2 ? item[1] * a2 : 0) + a4;
      const c2 =
        (b1 === 1 ? item[0] : item[0] * b1) + (b2 ? item[1] * b2 : 0) + b4;
      if (item.length === 4 || item.length === 6) {
        const c3 =
          (a1 === 1 ? item[2] : item[2] * a1) + (a2 ? item[3] * a2 : 0) + a4;
        const c4 =
          (b1 === 1 ? item[2] : item[2] * b1) + (b2 ? item[3] * b2 : 0) + b4;
        if (item.length === 6) {
          const c5 =
            (a1 === 1 ? item[4] : item[4] * a1) + (a2 ? item[5] * a2 : 0) + a4;
          const c6 =
            (b1 === 1 ? item[4] : item[4] * b1) + (b2 ? item[5] * b2 : 0) + b4;
          return [
            c1, c2, c3, c4, c5, c6,
          ];
        }
        return [
          c1, c2, c3, c4,
        ];
      }
      else {
        return [c1, c2];
      }
    });
  }
  return points.map((item) => item.slice(0));
}

type Loader = {
  error: boolean;
  loading: boolean;
  source?: HTMLImageElement;
  width: number;
  height: number;
};

class ShapeGroup extends Group {
  props: ShapeGroupProps;
  coords?: number[][][]; // undefined初始化，结果可能是空集合则空数组
  loaders: Loader[];

  constructor(props: ShapeGroupProps, children: Node[]) {
    super(props, children);
    this.props = props;
    // this.coords = [];
    this.loaders = [];
    this.isShapeGroup = true;
  }

  override didMount() {
    this.buildPoints();
    if (!this.coords?.length) {
      return;
    }
    const rect = this._rect || this.rect;
    const { width, height } = this;
    const EPS = Group.EPS;
    // 和group的对比不同，直接用points的结果的rect
    if (Math.abs(-rect[0]) > EPS
      || Math.abs(-rect[1]) > EPS
      || Math.abs(width - rect[2]) > EPS
      || Math.abs(height - rect[3]) > EPS) {
      // 冒泡过程无需向下检测，直接向上
      this.adjustPosAndSize({
        minX: rect[0],
        minY: rect[1],
        maxX: rect[2],
        maxY: rect[3],
      });
    }
  }

  override lay(data: LayoutData) {
    super.lay(data);
    this.coords = undefined;
  }

  override clearPoints() {
    this.coords = undefined;
    this._rect = undefined;
    this._bbox = undefined;
    this.clearCache(true);
  }

  override checkShapeChange() {
    let parent = this.parent;
    while (parent && parent.isShapeGroup) {
      parent.clearPoints();
      parent = parent.parent;
    }
  }

  override calContent(): boolean {
    this.buildPoints();
    return (this.hasContent = !!this.coords && this.coords.length > 0);
  }

  buildPoints() {
    if (this.coords) {
      return;
    }
    this.coords = [];
    this.textureOutline.forEach((item) => item?.release());
    const { children } = this;
    let res: number[][][] = [], first = true;
    for (let i = 0, len = children.length; i < len; i++) {
      const item = children[i];
      // 不可见的无效
      if (item.computedStyle.visibility === VISIBILITY.HIDDEN) {
        continue;
      }
      let coords;
      // shapeGroup可以包含任意内容，非矢量视作矩形，TODO 文本矢量
      if (item instanceof Polyline || item instanceof ShapeGroup) {
        item.buildPoints();
        coords = item.coords;
      }
      else {
        const { width, height } = item;
        coords = [
          [0, 0],
          [width, 0],
          [width, height],
          [0, height],
          [0, 0],
        ];
      }
      const { matrix } = item;
      if (coords && coords.length) {
        // 点要考虑matrix变换，因为是shapeGroup的直接子节点，位置可能不一样
        let p: number[][][];
        if (item instanceof ShapeGroup) {
          p = coords.map((item) =>
            scaleUp(applyMatrixPoints(item as number[][], matrix)),
          );
        }
        else {
          p = [scaleUp(applyMatrixPoints(coords as number[][], matrix))];
        }
        const booleanOperation = item.computedStyle.booleanOperation;
        if (first || !booleanOperation) {
          res = res.concat(p);
          first = false;
        }
        else {
          // TODO 连续多个bo运算中间产物优化
          if (booleanOperation === BOOLEAN_OPERATION.INTERSECT) {
            const t = bo.intersect(res, p) as number[][][];
            res = t || [];
          }
          else if (booleanOperation === BOOLEAN_OPERATION.UNION) {
            // p中可能是条直线，不能用多边形求，直接合并，将非直线提取出来进行求，直线则单独处理
            const pp: number[][][] = [],
              pl: number[][][] = [];
            p.forEach((item) => {
              if (item.length <= 2) {
                pl.push(item);
              }
              else {
                pp.push(item);
              }
            });
            if (pp.length) {
              const t = bo.union(res, pp) as number[][][];
              res = t || [];
            }
            if (pl.length) {
              res = res.concat(pl);
            }
          }
          else if (booleanOperation === BOOLEAN_OPERATION.SUBTRACT) {
            const t = bo.subtract(res, p) as number[][][];
            res = t || [];
          }
          else if (booleanOperation === BOOLEAN_OPERATION.XOR) {
            const t = bo.xor(res, p) as number[][][];
            res = t || [];
          }
        }
      }
    }
    res.forEach(item => {
      if (item.length > 1) {
        const t = scaleDown(item);
        this.coords!.push(t);
      }
    });
  }

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
      coords.forEach((item) => {
        canvasPolygon(ctx, item, scale, dx2, dy2);
      });
      ctx.closePath();
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
        else {
          if ((f as ComputedPattern).url !== undefined) {
            f = f as ComputedPattern;
            const url = f.url;
            if (url) {
              let loader = this.loaders[i];
              const cache = inject.IMG[url];
              // 已有的图像同步直接用
              if (!loader && cache) {
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
                  coords.forEach((item) => {
                    canvasPolygon(ctx, item, scale, dx2, dy2);
                  });
                  ctx2.closePath();
                  ctx2.save();
                  ctx2.clip();
                  if (f.type === PATTERN_FILL_TYPE.TILE) {
                    const ratio = f.scale ?? 1;
                    for (let i = 0, len = Math.ceil(width / ratio / loader.width); i < len; i++) {
                      for (let j = 0, len = Math.ceil(height / ratio / loader.height); j < len; j++) {
                        ctx2.drawImage(
                          loader.source!,
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
                    ctx2.drawImage(loader.source!, 0, 0, loader.width, loader.height,
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
                    ctx2.drawImage(loader.source!, 0, 0, loader.width, loader.height,
                      x + dx2, y + dy2, loader.width * sc, loader.height * sc);
                  }
                  // 记得还原
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
                inject.loadImg(url, (data: any) => {
                  // 可能会变更，所以加载完后对比下是不是当前最新的
                  if (url === (fill[i] as ComputedPattern).url) {
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
                coords.forEach((item) => {
                  canvasPolygon(ctx2, item, scale, dx2, dy2);
                });
                ctx2.closePath();
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
      // fill有opacity，设置记得还原
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // 内阴影使用canvas的能力
      const { innerShadow, innerShadowEnable } = this.computedStyle;
      if (innerShadow && innerShadow.length) {
        // 计算取偏移+spread最大值后再加上blur半径，这个尺寸扩展用以生成shadow的必要宽度
        let n = 0, hasInnerShadow = false;
        innerShadow.forEach((item, i) => {
          if (!innerShadowEnable[i]) {
            return;
          }
          hasInnerShadow = true;
          const m = (Math.max(Math.abs(item.x), Math.abs(item.x)) + item.spread) * scale;
          n = Math.max(n, m + item.blur * scale);
        });
        // 限制在图形内clip
        if (hasInnerShadow) {
          ctx.save();
          ctx.beginPath();
          coords.forEach((item) => {
            canvasPolygon(ctx, item, scale, dx2, dy2);
          });
          ctx.closePath();
          ctx.clip();
          ctx.fillStyle = '#FFF';
          // 在原本图形基础上，外围扩大n画个边框，这样奇偶使得填充在clip范围外不会显示出来，但shadow却在内可以显示
          ctx.beginPath();
          coords.forEach((item) => {
            canvasPolygon(ctx, item, scale, dx2, dy2);
          });
          canvasPolygon(ctx, [
            [-n, -n],
            [w + n, -n],
            [w + n, h + n],
            [-n, h + n],
            [-n, -n],
          ], 1, 0, 0);
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
          coords.forEach((item) => {
            canvasPolygon(ctx, item, scale, dx2, dy2);
          });
          ctx.closePath();
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
        if (Array.isArray(s)) {
          ctx.strokeStyle = color2rgbaStr(s);
          ctx.lineWidth = strokeWidth[i];
        }
        else {
          if (s.t === GRADIENT.LINEAR) {
            const gd = getLinear(s.stops, s.d, dx2, dy2, w - dx * 2, h - dy * 2);
            const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
            gd.stop.forEach((item) => {
              lg.addColorStop(item.offset!, color2rgbaStr(item.color));
            });
            ctx.strokeStyle = lg;
          }
          else if (s.t === GRADIENT.RADIAL) {
            const gd = getRadial(s.stops, s.d, dx2, dy2, w - dx * 2, h - dy * 2);
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
              ctx2.setLineDash(strokeDasharray);
              ctx2.lineCap = ctx.lineCap;
              ctx2.lineJoin = ctx.lineJoin;
              ctx2.miterLimit = ctx.miterLimit;
              ctx2.lineWidth = strokeWidth[i] * scale;
              ctx2.strokeStyle = '#F00';
              ctx2.beginPath();
              coords.forEach((item) => {
                canvasPolygon(ctx2, item, scale, dx2, dy2);
              });
              ctx2.closePath();
              if (p === STROKE_POSITION.INSIDE) {
                ctx2.lineWidth = strokeWidth[i] * 2 * scale;
                ctx2.save();
                ctx2.clip();
                ctx2.stroke();
                ctx2.restore();
              }
              else if (p === STROKE_POSITION.OUTSIDE) {
                ctx2.lineWidth = strokeWidth[i] * 2 * scale;
                ctx2.stroke();
                ctx2.save();
                ctx2.clip();
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
            const gd = getConic(s.stops, s.d, dx2, dy2, w - dx * 2, h - dy * 2);
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
          ctx2.setLineDash(strokeDasharray);
          ctx2.lineCap = ctx.lineCap;
          ctx2.lineJoin = ctx.lineJoin;
          ctx2.miterLimit = ctx.miterLimit;
          ctx2.strokeStyle = ctx.strokeStyle;
          ctx2.lineWidth = strokeWidth[i] * 2 * scale;
          ctx2.beginPath();
          coords.forEach((item) => {
            canvasPolygon(ctx2!, item, scale, dx2, dy2);
          });
        }
        else {
          ctx.lineWidth = strokeWidth[i] * scale;
        }
        if (ctx2) {
          ctx2.closePath();
        }
        if (p === STROKE_POSITION.INSIDE) {
          ctx.save();
          ctx.clip();
          ctx.stroke();
          ctx.restore();
        }
        else if (p === STROKE_POSITION.OUTSIDE) {
          ctx2!.stroke();
          ctx2!.save();
          ctx2!.clip();
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

  toSvg(max: number) {
    this.buildPoints();
    const computedStyle = this.computedStyle;
    const coords = this.coords || [];
    const matrix = new Float64Array(this.matrixWorld);
    const absCoords: number[][][] = [];
    let minX = 0, minY = 0, maxX = 0, maxY = 0;
    let isFirst = true;
    coords.forEach((list, i) => {
      const temp: number[][] = [];
      list.forEach((item, j) => {
        if (item.length === 6) {
          const t1 = calPoint({ x: item[0], y: item[1] }, matrix);
          const t2 = calPoint({ x: item[2], y: item[3] }, matrix);
          const t3 = calPoint({ x: item[4], y: item[5] }, matrix);
          temp.push([t1.x, t1.y, t2.x, t2.y, t3.x, t3.y]);
          if (isFirst) {
            isFirst = false;
            minX = Math.min(t1.x, t2.x, t3.x);
            minY = Math.min(t1.y, t2.y, t3.y);
            maxX = Math.max(t1.x, t2.x, t3.x);
            maxY = Math.max(t1.y, t2.y, t3.y);
          }
          else {
            minX = Math.min(minX, t1.x, t2.x, t3.x);
            minY = Math.min(minY, t1.y, t2.y, t3.y);
            maxX = Math.max(maxX, t1.x, t2.x, t3.x);
            maxY = Math.max(maxY, t1.y, t2.y, t3.y);
          }
        }
        else if (item.length === 4) {
          const t1 = calPoint({ x: item[0], y: item[1] }, matrix);
          const t2 = calPoint({ x: item[2], y: item[3] }, matrix);
          temp.push([t1.x, t1.y, t2.x, t2.y]);
          if (isFirst) {
            isFirst = false;
            minX = Math.min(t1.x, t2.x);
            minY = Math.min(t1.y, t2.y);
            maxX = Math.max(t1.x, t2.x);
            maxY = Math.max(t1.y, t2.y);
          }
          else {
            minX = Math.min(minX, t1.x, t2.x);
            minY = Math.min(minY, t1.y, t2.y);
            maxX = Math.max(maxX, t1.x, t2.x);
            maxY = Math.max(maxY, t1.y, t2.y);
          }
        }
        else if (item.length === 2) {
          const t = calPoint({ x: item[0], y: item[1] }, matrix);
          temp.push([t.x, t.y]);
          if (isFirst) {
            isFirst = false;
            minX = t.x;
            minY = t.y;
            maxX = t.x;
            maxY = t.y;
          }
          else {
            minX = Math.min(minX, t.x);
            minY = Math.min(minY, t.y);
            maxX = Math.max(maxX, t.x);
            maxY = Math.max(maxY, t.y);
          }
        }
      });
      if (temp.length) {
        absCoords.push(temp);
      }
    });
    const width = maxX - minX;
    const height = maxY - minY;
    let scale = 1;
    if (width >= height) {
      scale = max / width;
    }
    else {
      scale = max / height;
    }
    const fillRule =
      computedStyle.fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero';
    let s = `<svg width="${width * scale}" height="${height * scale}"><path`;
    if (absCoords.length) {
      const props = [
        ['d', ''],
        ['fill', '#D8D8D8'],
        ['fill-rule', fillRule],
        ['stroke', '#979797'],
        ['stroke-width', 1],
      ];
      absCoords.forEach(list => {
        const d = svgPolygon(list.map(item => {
          return item.map(d => d * scale);
        }), -minX * scale, -minY * scale) + 'Z';
        props[0][1] += d;
      });
      props.forEach((item) => {
        s += ' ' + item[0] + '="' + item[1] + '"';
      });
      s += '></path>';
    }
    return s + '</svg>';
  }

  // @ts-ignore
  override clone(override?: Record<string, Override[]>) {
    const props = clone(this.props);
    const oldUUid = props.uuid;
    props.uuid = uuid.v4();
    props.sourceUuid = this.props.uuid;
    const res = new ShapeGroup(props, this.children.map(item => item.clone(override)));
    res.style = clone(this.style);
    if (override && override.hasOwnProperty(oldUUid)) {
      override[oldUUid].forEach(item => {
        const { key, value } = item;
        if (key[0] === 'fill') {
          const i = parseInt(key[1]) || 0;
          props.style.fill[i] = value;
          res.style.fill[i] = { v: color2rgbaInt(value), u: StyleUnit.RGBA };
        }
      });
    }
    return res;
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.SHAPE_GROUP;
    return res;
  }

  // @ts-ignore
  override async toSketchJson(zip: JSZip): Promise<SketchFormat.ShapeGroup> {
    // @ts-ignore
    const json = await super.toSketchJson(zip) as SketchFormat.ShapeGroup;
    json._class = SketchFormat.ClassValue.ShapeGroup;
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

  override get rect(): Float64Array {
    let res = this._rect;
    if (!res) {
      res = this._rect = new Float64Array(4);
      this.buildPoints();
      // 子元素可能因为编辑模式临时超过范围
      const coords = this.coords;
      if (coords && coords.length) {
        getShapeGroupRect(coords, res);
      }
    }
    return res;
  }

  override get bbox(): Float64Array {
    let res = this._bbox;
    if (!res) {
      const rect = this._rect || this.rect;
      res = this._bbox = rect.slice(0);
      this.buildPoints();
      const {
        strokeWidth,
        strokeEnable,
        strokePosition,
        strokeLinejoin,
        strokeMiterlimit,
      } = this.computedStyle;
      // 所有描边最大值，影响bbox，可能链接点会超过原本的线粗，先用2倍弥补
      let border = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          if (strokePosition[i] === STROKE_POSITION.INSIDE) {
            // 0
          }
          else if (strokePosition[i] === STROKE_POSITION.OUTSIDE) {
            border = Math.max(border, item * 4);
          }
          else {
            // 默认中间
            border = Math.max(border, item * 0.5 * 4);
          }
        }
      });
      const minX = res[0] - border;
      const minY = res[1] - border;
      const maxX = res[2] + border;
      const maxY = res[3] + border;
      (this.coords || []).forEach(coords => {
        const t = lineJoin(res!, border, coords, strokeLinejoin, strokeMiterlimit);
        res![0] = Math.min(res![0], t[0]);
        res![1] = Math.min(res![1], t[1]);
        res![2] = Math.min(res![2], t[2]);
        res![3] = Math.min(res![3], t[3]);
      });
      res[0] = Math.min(res[0], minX);
      res[1] = Math.min(res[1], minY);
      res[2] = Math.max(res[2], maxX);
      res[3] = Math.max(res[3], maxY);
    }
    return res;
  }

  static groupAsShape(
    nodes: Node[],
    bo = BOOLEAN_OPERATION.NONE,
    props?: ShapeGroupProps,
  ) {
    if (!nodes.length) {
      return;
    }
    sortTempIndex(nodes);
    const first = nodes[0];
    const parent = first.parent!;
    // 锁定parent，如果first和nodes[1]为兄弟，first在remove后触发调整会使nodes[1]的style发生变化，migrate的操作无效
    if (parent instanceof Group) {
      parent.fixedPosAndSize = true;
    }
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      migrate(parent, item);
      item.style.booleanOperation = { v: bo, u: StyleUnit.NUMBER };
    }
    // 取第一个矢量图形的描绘属性
    let style: JStyle | undefined;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      if (item instanceof Polyline || item instanceof ShapeGroup) {
        style = item.getCssStyle();
        break;
      }
    }
    if (!style) {
      style = getDefaultStyle();
    }
    const p = Object.assign(
      {
        uuid: uuid.v4(),
        name: '形状结合',
        style: {
          left: '0%',
          top: '0%',
          right: '0%',
          bottom: '0%',
          fill: style.fill,
          fillEnable: style.fillEnable,
          fillRule: style.fillRule,
          stroke: style.stroke,
          strokeEnable: style.strokeEnable,
          strokeWidth: style.strokeWidth,
          strokePosition: style.strokePosition,
          strokeDasharray: style.strokeDasharray,
          strokeLinecap: style.strokeLinecap,
          strokeLinejoin: style.strokeLinejoin,
          strokeMiterlimit: style.strokeMiterlimit,
        },
      },
      props,
    );
    const shapeGroup = new ShapeGroup(p, []);
    shapeGroup.fixedPosAndSize = true;
    // 插入到first的后面
    first.insertAfter(shapeGroup);
    // 迁移后再remove&add，因为过程会导致parent尺寸位置变化，干扰其它节点migrate
    for (let i = 0, len = nodes.length; i < len; i++) {
      shapeGroup.appendChild(nodes[i]);
    }
    shapeGroup.fixedPosAndSize = false;
    if (parent instanceof Group) {
      parent.fixedPosAndSize = false;
    }
    shapeGroup.checkPosSizeSelf();
    return shapeGroup;
  }
}

export default ShapeGroup;
