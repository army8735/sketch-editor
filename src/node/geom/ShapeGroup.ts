import * as uuid from 'uuid';
import { getDefaultStyle, JNode, Override, Props, TAG_NAME } from '../../format';
import bezier from '../../math/bezier';
import bo from '../../math/bo';
import { isE } from '../../math/matrix';
import CanvasCache from '../../refresh/CanvasCache';
import config from '../../refresh/config';
import { canvasPolygon, svgPolygon } from '../../refresh/paint';
import { color2rgbaStr } from '../../style/css';
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
  StyleUnit,
} from '../../style/define';
import { getConic, getLinear, getRadial } from '../../style/gradient';
import { migrate, sortTempIndex } from '../../tools/node';
import inject, { OffScreen } from '../../util/inject';
import { mergeBbox, clone } from '../../util/util';
import Group from '../Group';
import { LayoutData } from '../layout';
import Node from '../Node';
import Polyline from './Polyline';
import { RefreshLevel } from '../../refresh/level';
import { getCanvasGCO } from '../../style/mbm';
import { lineJoin } from './line';

function scaleUp(points: Array<Array<number>>) {
  return points.map(point => {
    return point.map(item => Math.round(item * 100));
  });
}

function scaleDown(points: Array<Array<number>>) {
  return points.map(point => {
    return point.map(item => item * 0.01);
  });
}

function applyMatrixPoints(points: Array<Array<number>>, m: Float64Array) {
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
      } else {
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
  points?: number[][][];
  loaders: Loader[];

  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isShapeGroup = true;
    this.loaders = [];
  }

  override lay(data: LayoutData) {
    super.lay(data);
    this.points = undefined;
  }

  override checkSizeChange() {
    super.checkSizeChange();
    this.points = undefined;
  }

  override clearPoints() {
    this.points = undefined;
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
    return (this.hasContent = !!this.points && !!this.points.length);
  }

  buildPoints() {
    if (this.points) {
      return;
    }
    this.textureOutline?.release();
    const { children } = this;
    let res: number[][][] = [], first = true;
    for (let i = 0, len = children.length; i < len; i++) {
      const item = children[i];
      // 不可见的无效
      if (!item.computedStyle.visible) {
        continue;
      }
      let points;
      // shapeGroup可以包含任意内容，非矢量视作矩形，TODO 文本矢量
      if (item instanceof Polyline || item instanceof ShapeGroup) {
        item.buildPoints();
        points = item.points;
      } else {
        const { width, height } = item;
        points = [
          [0, 0],
          [width, 0],
          [width, height],
          [0, height],
          [0, 0],
        ];
      }
      const { matrix } = item;
      if (points && points.length) {
        // 点要考虑matrix变换，因为是shapeGroup的直接子节点，位置可能不一样
        let p: number[][][];
        if (item instanceof ShapeGroup) {
          p = points.map((item) =>
            scaleUp(applyMatrixPoints(item as number[][], matrix)),
          );
        } else {
          p = [scaleUp(applyMatrixPoints(points as number[][], matrix))];
        }
        const booleanOperation = item.computedStyle.booleanOperation;
        if (first || !booleanOperation) {
          res = res.concat(p);
          first = false;
        } else {
          // TODO 连续多个bo运算中间产物优化
          if (booleanOperation === BOOLEAN_OPERATION.INTERSECT) {
            const t = bo.intersect(res, p) as number[][][];
            res = t || [];
          } else if (booleanOperation === BOOLEAN_OPERATION.UNION) {
            // p中可能是条直线，不能用多边形求，直接合并，将非直线提取出来进行求，直线则单独处理
            const pp: number[][][] = [],
              pl: number[][][] = [];
            p.forEach((item) => {
              if (item.length <= 2) {
                pl.push(item);
              } else {
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
          } else if (booleanOperation === BOOLEAN_OPERATION.SUBTRACT) {
            const t = bo.subtract(res, p) as number[][][];
            res = t || [];
          } else if (booleanOperation === BOOLEAN_OPERATION.XOR) {
            const t = bo.xor(res, p) as number[][][];
            res = t || [];
          }
        }
      }
    }
    this.points = res.map(o => scaleDown(o));
  }

  override renderCanvas(scale: number) {
    super.renderCanvas(scale);
    this.buildPoints();
    const points = this.points!;
    const bbox = this._bbox || this.bbox;
    const x = bbox[0],
      y = bbox[1];
    let w = bbox[2] - x,
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
    w *= scale;
    h *= scale;
    const canvasCache = (this.canvasCache = CanvasCache.getInstance(
      w,
      h,
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
    if (scale !== 1) {
      ctx.setLineDash(strokeDasharray.map((i) => i * scale));
    } else {
      ctx.setLineDash(strokeDasharray);
    }
    ctx.setLineDash(strokeDasharray);
    ctx.beginPath();
    points.forEach((item) => {
      canvasPolygon(ctx, item, scale, dx, dy);
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
      } else {
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
              if (!loader.error && !loader.loading) {
                const width = this.width;
                const height = this.height;
                const wc = width * scale;
                const hc = height * scale;
                // 裁剪到范围内，不包含边框，即矢量本身的内容范围，本来直接在原画布即可，但chrome下clip+mbm有问题，不得已用离屏
                const os = inject.getOffscreenCanvas(w, h);
                const ctx2 = os.ctx;
                ctx2.beginPath();
                points.forEach((item) => {
                  canvasPolygon(ctx, item, scale, dx, dy);
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
                        dx + i * loader.width * scale * ratio,
                        dy + j * loader.height * scale * ratio,
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
                    x + dx, y + dy, loader.width * sc, loader.height * sc);
                }
                else if (f.type === PATTERN_FILL_TYPE.STRETCH) {
                  ctx2.drawImage(loader.source!, dx, dy, wc, hc);
                }
                else if (f.type === PATTERN_FILL_TYPE.FIT) {
                  const sx = wc / loader.width;
                  const sy = hc / loader.height;
                  const sc = Math.min(sx, sy);
                  const x = (loader.width * sc - wc) * -0.5;
                  const y = (loader.height * sc - hc) * -0.5;
                  ctx2.drawImage(loader.source!, 0, 0, loader.width, loader.height,
                    x + dx, y + dy, loader.width * sc, loader.height * sc);
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
            }
            else {
              loader = this.loaders[i] = this.loaders[i] || {
                error: false,
                loading: true,
                width: 0,
                height: 0,
                source: undefined,
              };
              inject.measureImg(url, (data: any) => {
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
                }
              });
            }
          }
          continue;
        } else {
          f = f as ComputedGradient;
          if (f.t === GRADIENT.LINEAR) {
            const gd = getLinear(f.stops, f.d, dx, dy, w - dx * 2, h - dy * 2);
            const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
            gd.stop.forEach((item) => {
              lg.addColorStop(item.offset!, color2rgbaStr(item.color));
            });
            ctx.fillStyle = lg;
          }
          else if (f.t === GRADIENT.RADIAL) {
            const gd = getRadial(f.stops, f.d, dx, dy, w - dx * 2, h - dy * 2);
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
              points.forEach((item) => {
                canvasPolygon(ctx2, item, scale, dx, dy);
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
            const gd = getConic(f.stops, f.d, dx, dy, w - dx * 2, h - dy * 2);
            const cg = ctx.createConicGradient(gd.angle, gd.cx, gd.cy);
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
      } else {
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
        points.forEach((item) => {
          canvasPolygon(ctx, item, scale, dx, dy);
        });
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = '#FFF';
        // 在原本图形基础上，外围扩大n画个边框，这样奇偶使得填充在clip范围外不会显示出来，但shadow却在内可以显示
        ctx.beginPath();
        points.forEach((item) => {
          canvasPolygon(ctx, item, scale, dx, dy);
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
        points.forEach((item) => {
          canvasPolygon(ctx, item, scale, dx, dy);
        });
        ctx.closePath();
      }
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
      } else {
        if (s.t === GRADIENT.LINEAR) {
          const gd = getLinear(s.stops, s.d, dx, dy, w - dx * 2, h - dy * 2);
          const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
          gd.stop.forEach((item) => {
            lg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.strokeStyle = lg;
        } else if (s.t === GRADIENT.RADIAL) {
          const gd = getRadial(s.stops, s.d, dx, dy, w - dx * 2, h - dy * 2);
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
            points.forEach((item) => {
              canvasPolygon(ctx2, item, scale, dx, dy);
            });
            ctx2.closePath();
            if (p === STROKE_POSITION.INSIDE) {
              ctx2.lineWidth = strokeWidth[i] * 2 * scale;
              ctx2.save();
              ctx2.clip();
              ctx2.stroke();
              ctx2.restore();
            } else if (p === STROKE_POSITION.OUTSIDE) {
              ctx2.lineWidth = strokeWidth[i] * 2 * scale;
              ctx2.stroke();
              ctx2.save();
              ctx2.clip();
              ctx2.globalCompositeOperation = 'destination-out';
              ctx2.strokeStyle = '#FFF';
              ctx2.stroke();
              ctx2.restore();
            } else {
              ctx2.stroke();
            }
            ctx2.fillStyle = rg;
            ctx2.globalCompositeOperation = 'source-in';
            ctx2.setTransform(m[0], m[1], m[4], m[5], m[12], m[13]);
            ctx2.fillRect(0, 0, w, h);
            ctx.drawImage(ellipse.canvas, 0, 0);
            ellipse.release();
            continue;
          } else {
            ctx.strokeStyle = rg;
          }
        } else if (s.t === GRADIENT.CONIC) {
          const gd = getConic(s.stops, s.d, dx, dy, w - dx * 2, h - dy * 2);
          const cg = ctx.createConicGradient(gd.angle, gd.cx, gd.cy);
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
      } else if (p === STROKE_POSITION.OUTSIDE) {
        os = inject.getOffscreenCanvas(w, h);
        ctx2 = os.ctx;
        ctx2.setLineDash(strokeDasharray);
        ctx2.lineCap = ctx.lineCap;
        ctx2.lineJoin = ctx.lineJoin;
        ctx2.miterLimit = ctx.miterLimit;
        ctx2.strokeStyle = ctx.strokeStyle;
        ctx2.lineWidth = strokeWidth[i] * 2 * scale;
        ctx2.beginPath();
        points.forEach((item) => {
          canvasPolygon(ctx2!, item, scale, dx, dy);
        });
      } else {
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
    // 还原
    ctx.globalCompositeOperation = 'source-over';
  }

  toSvg(scale: number) {
    this.buildPoints();
    const computedStyle = this.computedStyle;
    const fillRule =
      computedStyle.fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero';
    let s = `<svg width="${this.width}" height="${this.height}">`;
    const points = this.points!;
    if (points.length) {
      const props = [
        ['d', ''],
        ['fill', '#D8D8D8'],
        ['fill-rule', fillRule],
        ['stroke', '#979797'],
        ['stroke-width', (1 / scale).toString()],
      ];
      points.forEach(item => {
        const d = svgPolygon(item) + 'Z';
        props[0][1] += d;
      });
      s += '<path';
      props.forEach((item) => {
        s += ' ' + item[0] + '="' + item[1] + '"';
      });
      s += '></path>';
    }
    return s + '</svg>';
  }

  override clone(override?: Record<string, Override>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    const res = new ShapeGroup(props, this.children.map(item => item.clone(override)));
    res.style = clone(this.style);
    return res;
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.SHAPE_GROUP;
    return res;
  }

  override get rect(): Float64Array {
    let res = this._rect;
    if (!res) {
      res = this._rect = new Float64Array(4);
      // 可能不存在
      this.buildPoints();
      // 子元素可能因为编辑模式临时超过范围
      const points = this.points;
      if (points && points.length) {
        const first = points[0][0];
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
        res[0] = xa;
        res[1] = ya;
        res[2] = xa;
        res[3] = ya;
        for (let i = 0, len = points.length; i < len; i++) {
          const item = points[i];
          for (let j = 0, len = item.length; j < len; j++) {
            // first已经处理过了
            if (!i && !j) {
              continue;
            }
            const item2 = item[j];
            // 每个区域的第一个特殊处理
            if (!j) {
              if (item2.length === 4) {
                xa = item2[2];
                ya = item2[3];
              } else if (item2.length === 6) {
                xa = item2[4];
                ya = item2[5];
              } else {
                xa = item2[0];
                ya = item2[1];
              }
              mergeBbox(res, xa, ya, xa, ya);
              continue;
            }
            let xb: number, yb: number;
            if (item2.length === 4) {
              xb = item2[2];
              yb = item2[3];
              const b = bezier.bboxBezier(xa, ya, item2[0], item2[1], xb, yb);
              mergeBbox(res, b[0], b[1], b[2], b[3]);
            } else if (item2.length === 6) {
              xb = item2[4];
              yb = item2[5];
              const b = bezier.bboxBezier(
                xa,
                ya,
                item2[0],
                item2[1],
                item2[2],
                item2[3],
                xb,
                yb,
              );
              mergeBbox(res, b[0], b[1], b[2], b[3]);
            } else {
              xb = item2[0];
              yb = item2[1];
              mergeBbox(res, xb, yb, xb, yb);
            }
            xa = xb;
            ya = yb;
          }
        }
      }
    }
    return res;
  }

  override get bbox(): Float64Array {
    let res = this._bbox;
    if (!res) {
      const rect = this._rect || this.rect;
      res = this._bbox = rect.slice(0);
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
          } else if (strokePosition[i] === STROKE_POSITION.OUTSIDE) {
            border = Math.max(border, item * 4);
          } else {
            // 默认中间
            border = Math.max(border, item * 0.5 * 4);
          }
        }
      });
      this.points!.forEach(points => {
        const t = lineJoin(res!, border, points, strokeLinejoin, strokeMiterlimit);
        res![0] = Math.min(res![0], t[0]);
        res![1] = Math.min(res![1], t[1]);
        res![2] = Math.min(res![2], t[2]);
        res![3] = Math.min(res![3], t[3]);
      });
    }
    return res;
  }

  static groupAsShape(
    nodes: Node[],
    bo = BOOLEAN_OPERATION.NONE,
    props?: Props,
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
    let style;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      if (item instanceof Polyline || item instanceof ShapeGroup) {
        style = item.getComputedStyle(true);
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
    shapeGroup.checkSizeChange();
    return shapeGroup;
  }
}

export default ShapeGroup;
