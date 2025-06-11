import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { BitmapProps, JNode, Override, TAG_NAME } from '../format';
import CanvasCache from '../refresh/CanvasCache';
import { RefreshLevel } from '../refresh/level';
import { canvasPolygon } from '../refresh/paint';
import TextureCache from '../refresh/TextureCache';
import { color2rgbaStr } from '../style/css';
import {
  ComputedGradient,
  ComputedPattern,
  GRADIENT,
  MIX_BLEND_MODE,
  PATTERN_FILL_TYPE,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
} from '../style/define';
import { getConic, getLinear, getRadial } from '../style/gradient';
import { getCanvasGCO } from '../style/mbm';
import inject, { OffScreen } from '../util/inject';
import { clone } from '../util/type';
import Node from './Node';

type Loader = {
  error: boolean;
  loading: boolean;
  url: string;
  source?: HTMLImageElement;
  width: number;
  height: number;
};

class Bitmap extends Node {
  _src: string;
  loader: Loader;
  loaders: Loader[];
  onlyImg: boolean;

  constructor(props: BitmapProps) {
    super(props);
    this.isBitmap = true;
    this.onlyImg = true;
    const src = (this._src = props.src || '');
    this.loader = {
      error: false,
      loading: false,
      url: src,
      width: 0,
      height: 0,
    };
    this.loaders = [];
    if (!src) {
      this.loader.error = true;
    }
    else {
      const cache = inject.IMG[src];
      if (cache && cache.state === inject.LOADED) {
        if (cache.success) {
          this.loader.source = cache.source;
          this.loader.width = cache.source.width;
          this.loader.height = cache.source.height;
        }
        else {
          this.loader.error = true;
        }
      }
    }
  }

  override didMount() {
    super.didMount();
    const src = this.src;
    const isBlob = /^blob:/.test(src);
    if (isBlob) {
      inject.uploadImgSrc(src).then(res => {
        if (res) {
          const cache = inject.IMG[src];
          // 复用
          if (cache && cache.state === inject.LOADED) {
            inject.IMG[res] = cache;
          }
          this.src = res;
        }
      });
    }
  }

  loadAndRefresh() {
    // 加载前先清空之前可能遗留的老数据
    const loader = this.loader;
    if (loader.loading && loader.url === this._src) {
      return;
    }
    const { error, source } = loader;
    loader.source = undefined;
    loader.error = false;
    if (!this.isDestroyed) {
      const root = this.root!;
      const cache = inject.IMG[this._src];
      if (cache && cache.state === inject.LOADED) {
        if (cache.success && cache.source) {
          loader.source = cache.source;
          loader.width = cache.width;
          loader.height = cache.height;
        }
        else {
          loader.error = true;
        }
        this.root!.addUpdate(
          this,
          [],
          RefreshLevel.REPAINT,
          false,
          false,
          undefined,
        );
        return;
      }
      // 可能会多次连续触发更改图片url，判断状态只记录一次
      if (!loader.loading) {
        root.imgLoadingCount++;
      }
      // 先置空图片，除非目前本身就是空的
      if (error || source) {
        root.addUpdate(
          this,
          [],
          RefreshLevel.REPAINT,
          false,
          false,
          undefined,
        );
      }
      loader.loading = true;
      inject.loadImg(this._src, (data: any) => {
        // 还需判断url，防止重复加载时老的替换新的，失败走error绘制
        if (data.url === this._src) {
          root.imgLoadingCount--;
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
            if (!this.isDestroyed) {
              this.root!.addUpdate(
                this,
                [],
                RefreshLevel.NONE,
                false,
                false,
                undefined,
              );
            }
          }
        }
      });
    }
  }

  checkLoader() {
    const loader = this.loader;
    if (!loader.loading && !loader.source && !loader.error) {
      return true;
    }
    return false;
  }

  override calContent(): boolean {
    const {
      fill,
      fillOpacity,
      fillEnable,
      stroke,
      strokeEnable,
      strokeWidth,
      innerShadow,
      innerShadowEnable,
    } = this.computedStyle;
    this.onlyImg = true;
    for (let i = 0, len = fill.length; i < len; i++) {
      if (!fillEnable[i] || !fillOpacity[i]) {
        continue;
      }
      this.onlyImg = false;
      break;
    }
    if (this.onlyImg) {
      for (let i = 0, len = stroke.length; i < len; i++) {
        if (!strokeEnable[i] || !strokeWidth[i]) {
          continue;
        }
        this.onlyImg = false;
        break;
      }
    }
    if (this.onlyImg) {
      for (let i = 0, len = innerShadow.length; i < len; i++) {
        if (!innerShadowEnable[i]) {
          continue;
        }
        this.onlyImg = false;
        break;
      }
    }
    return (this.hasContent = !!this.loader.source);
  }

  override renderCanvas(scale: number) {
    const { loader, computedStyle } = this;
    // 纯图片共用一个canvas的cache
    if (this.onlyImg) {
      this.canvasCache?.releaseImg(this._src);
      // 尺寸使用图片原始尺寸
      const w = loader.width,
        h = loader.height;
      const canvasCache = (this.canvasCache = CanvasCache.getImgInstance(
        w,
        h,
        this._src,
      ));
      canvasCache.available = true;
      // 第一张图像才绘制，图片解码到canvas上
      if (canvasCache.getCount(this._src) === 1) {
        const list = canvasCache.list;
        for (let i = 0, len = list.length; i < len; i++) {
          const { x, y, os } = list[i];
          os.ctx.drawImage(loader.source!, -x, -y);
          // os.canvas.toBlob(blob => {
          //   if (blob) {
          //     const img = document.createElement('img');
          //     img.title = 'img' + i;
          //     img.src = URL.createObjectURL(blob);
          //     document.body.appendChild(img);
          //   }
          // });
        }
      }
    }
    // 带fill/stroke/innerShadow的则不能共用一个canvas的cache
    else {
      super.renderCanvas(scale);
      const bbox = this._bbox2 || this.bbox2;
      const x = bbox[0],
        y = bbox[1];
      let w = bbox[2] - x,
        h = bbox[3] - y;
      const rect = this._rect || this.rect;
      let iw = rect[2] - rect[0],
        ih = rect[3] - rect[1];
      const dx = -x * scale,
        dy = -y * scale;
      w *= scale;
      h *= scale;
      const canvasCache = (this.canvasCache = CanvasCache.getInstance(w, h, dx, dy));
      canvasCache.available = true;
      const {
        fill,
        fillOpacity,
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
        innerShadow,
        innerShadowEnable,
      } = computedStyle;
      const list = canvasCache.list;
      for (let i = 0, len = list.length; i < len; i++) {
        const { x, y, os: { ctx, canvas } } = list[i];
        const dx2 = -x;
        const dy2 = -y;
        ctx.drawImage(loader.source!, dx2, dy2, iw * scale, ih * scale);
        if (scale !== 1) {
          ctx.setLineDash(strokeDasharray.map((i) => i * scale));
        }
        else {
          ctx.setLineDash(strokeDasharray);
        }
        const points = [
          [0, 0],
          [iw, 0],
          [iw, ih],
          [0, ih],
          [0, 0],
        ];
        ctx.beginPath();
        canvasPolygon(ctx, points, scale, dx2, dy2);
        ctx.closePath();
        /**
         * 图像的fill很特殊，填充和原始图片呈混合，类似mask的效果，这时用source-atop，
         * fill便能只显示和底层位图重合的地方；
         * 如果再算上fillMode，会同时出现2个混合，需借助离屏来完成，离屏先绘制fill，
         * 再用destination-atop画底层位图，主画布修改gco为fillMode即可
         */
        // 先下层的fill
        for (let i = 0, len = fill.length; i < len; i++) {
          if (!fillEnable[i] || !fillOpacity[i]) {
            continue;
          }
          // 椭圆的径向渐变无法直接完成，用mask来模拟，即原本用纯色填充，然后离屏绘制渐变并用matrix模拟椭圆，再合并
          let ellipse: OffScreen | undefined;
          let f = fill[i];
          // fill的blend需用特殊离屏，因为canvas的gco只能设置单一，位图的fill需同时和底层做混合
          let blend: OffScreen | undefined;
          const mode = fillMode[i];
          if (mode !== MIX_BLEND_MODE.NORMAL) {
            blend = inject.getOffscreenCanvas(w, h);
          }
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
            if ((f as ComputedPattern).url) {
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
                    url,
                    width: cache.width,
                    height: cache.height,
                    source: cache.source,
                  };
                }
                const img = inject.IMG[url];
                if (loader) {
                  // 离屏绘出fill图片，然后先在离屏上应用混合原始图像mask，再主画布应用mode
                  if (!loader.error && !loader.loading) {
                    const os = blend || inject.getOffscreenCanvas(w, h);
                    const ctx2 = os.ctx;
                    if (f.type === PATTERN_FILL_TYPE.TILE) {
                      const ratio = f.scale ?? 1;
                      for (
                        let i = 0,
                          len = Math.ceil(iw / ratio / loader.width);
                        i < len;
                        i++
                      ) {
                        for (
                          let j = 0,
                            len = Math.ceil(ih / ratio / loader.height);
                          j < len;
                          j++
                        ) {
                          ctx2.drawImage(
                            img.source!,
                            dx2 + i * img.width * scale * ratio,
                            dy2 + j * img.height * scale * ratio,
                            img.width * scale * ratio,
                            img.height * scale * ratio,
                          );
                        }
                      }
                    }
                    else if (f.type === PATTERN_FILL_TYPE.FILL) {
                      const sx = iw * scale / img.width;
                      const sy = ih * scale / img.height;
                      const sc = Math.max(sx, sy);
                      const x = (img.width * sc - iw * scale) * -0.5;
                      const y = (img.height * sc - ih * scale) * -0.5;
                      ctx2.drawImage(
                        img.source!,
                        0,
                        0,
                        img.width,
                        img.height,
                        x + dx2,
                        y + dy2,
                        img.width * sc,
                        img.height * sc,
                      );
                    }
                    else if (f.type === PATTERN_FILL_TYPE.STRETCH) {
                      ctx2.drawImage(img.source!, dx2, dy2, iw * scale, ih * scale);
                    }
                    else if (f.type === PATTERN_FILL_TYPE.FIT) {
                      const sx = iw * scale / img.width;
                      const sy = ih * scale / img.height;
                      const sc = Math.min(sx, sy);
                      const x = (img.width * sc - iw * scale) * -0.5;
                      const y = (img.height * sc - ih * scale) * -0.5;
                      ctx2.drawImage(
                        img.source!,
                        0,
                        0,
                        img.width,
                        img.height,
                        x + dx2,
                        y + dy2,
                        img.width * sc,
                        img.height * sc,
                      );
                    }
                    // 离屏上以主画布作为mask保留相同部分
                    ctx2.globalCompositeOperation = 'destination-atop';
                    ctx2.drawImage(canvas, 0, 0);
                    // 记得还原
                    if (mode !== MIX_BLEND_MODE.NORMAL) {
                      ctx.globalCompositeOperation = getCanvasGCO(mode);
                    }
                    ctx.drawImage(os.canvas, 0, 0);
                    if (mode !== MIX_BLEND_MODE.NORMAL) {
                      ctx.globalCompositeOperation = 'source-atop';
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
                  inject.loadImg(url, (data: any) => {
                    // 可能会变或者删除，判断一致
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
                  lg.addColorStop(item.offset, color2rgbaStr(item.color));
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
                  rg.addColorStop(item.offset, color2rgbaStr(item.color));
                });
                // 椭圆渐变，由于有缩放，用clip确定绘制范围，然后缩放长短轴绘制椭圆
                const m = gd.matrix;
                if (m) {
                  ellipse = inject.getOffscreenCanvas(w, h);
                  const ctx2 = ellipse.ctx;
                  ctx2.beginPath();
                  canvasPolygon(ctx2, points, scale, dx2, dy2);
                  ctx2.closePath();
                  ctx2.clip();
                  ctx2.fillStyle = rg;
                  ctx2.setTransform(m[0], m[1], m[4], m[5], m[12], m[13]);
                  ctx2.fill();
                }
                else {
                  ctx.fillStyle = rg;
                }
              }
              else if (f.t === GRADIENT.CONIC) {
                const gd = getConic(f.stops, f.d, dx2, dy2, w - dx * 2, h - dy * 2);
                const cg = ctx.createConicGradient(gd.angle, gd.cx + dx2, gd.cy + dy2);
                gd.stop.forEach((item) => {
                  cg.addColorStop(item.offset, color2rgbaStr(item.color));
                });
                ctx.fillStyle = cg;
              }
            }
          }
          if (ellipse) {
            if (blend) {
              const ctx2 = blend.ctx;
              ctx2.drawImage(ellipse.canvas, 0, 0);
              // 类似mask的混合保留和位图重合的地方
              ctx2.globalCompositeOperation = 'destination-atop';
              ctx2.drawImage(canvas, 0, 0);
              // 主画布应用fillMode
              ctx.globalCompositeOperation = getCanvasGCO(mode);
              ctx.drawImage(blend.canvas, 0, 0);
              blend.release();
            }
            else {
              ctx.globalCompositeOperation = 'source-atop';
              ctx.drawImage(ellipse.canvas, 0, 0);
            }
            ellipse.release();
          }
          // 矩形区域无需考虑fillRule
          else {
            if (blend) {
              const ctx2 = blend.ctx;
              ctx2.fillStyle = ctx.fillStyle;
              // 画出满屏fill
              ctx2.beginPath();
              canvasPolygon(ctx2, points, scale, dx2, dy2);
              ctx2.closePath();
              ctx2.fill();
              // 类似mask的混合保留和位图重合的地方
              ctx2.globalCompositeOperation = 'destination-atop';
              ctx2.drawImage(canvas, 0, 0);
              // 主画布应用fillMode
              ctx.globalCompositeOperation = getCanvasGCO(mode);
              ctx.drawImage(blend.canvas, 0, 0);
              blend.release();
            }
            else {
              ctx.globalCompositeOperation = 'source-atop';
              ctx.fill();
            }
          }
        }
        // fill有opacity和mode，设置记得还原
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-atop';
        // 内阴影使用canvas的能力
        if (innerShadow && innerShadow.length) {
          // 计算取偏移+spread最大值后再加上blur半径，这个尺寸扩展用以生成shadow的必要宽度
          let n = 0;
          innerShadow.forEach((item, i) => {
            if (!innerShadowEnable[i]) {
              return;
            }
            const m = Math.max(Math.abs(item.x), Math.abs(item.y)) + item.spread;
            n = Math.max(n, m + item.blur);
          });
          ctx.save();
          ctx.beginPath();
          canvasPolygon(ctx, points, scale, dx2, dx2);
          ctx.closePath();
          ctx.clip();
          ctx.fillStyle = '#FFF';
          // 在原本图形基础上，外围扩大n画个边框，这样奇偶使得填充在clip范围外不会显示出来，但shadow却在内可以显示
          ctx.beginPath();
          canvasPolygon(ctx, points, scale, dx2, dx2);
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
            dx2,
          );
          ctx.closePath();
          innerShadow.forEach((item, i) => {
            if (!innerShadowEnable[i]) {
              return;
            }
            ctx.shadowOffsetX = item.x;
            ctx.shadowOffsetY = item.y;
            ctx.shadowColor = color2rgbaStr(item.color);
            ctx.shadowBlur = item.blur;
            ctx.fill('evenodd');
          });
          ctx.restore();
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
        ctx.miterLimit = strokeMiterlimit * scale;
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
              const gd = getLinear(s.stops, s.d, dx2, dy2, w - dx * 2, h - dy * 2);
              const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
              gd.stop.forEach((item) => {
                lg.addColorStop(item.offset, color2rgbaStr(item.color));
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
                rg.addColorStop(item.offset, color2rgbaStr(item.color));
              });
              // 椭圆渐变，由于有缩放，先离屏绘制白色stroke记a，再绘制变换的结果整屏fill记b，b混合到a上用source-in即可只显示重合的b
              const m = gd.matrix;
              if (m) {
                const ellipse = inject.getOffscreenCanvas(w, h);
                const ctx2 = ellipse.ctx;
                ctx2.setLineDash(ctx.getLineDash());
                ctx2.lineCap = ctx.lineCap;
                ctx2.lineJoin = ctx.lineJoin;
                ctx2.miterLimit = ctx.miterLimit * scale;
                ctx2.lineWidth = strokeWidth[i] * scale;
                ctx2.strokeStyle = '#FFF';
                ctx2.beginPath();
                canvasPolygon(ctx2, points, scale, dx2, dy2);
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
                cg.addColorStop(item.offset, color2rgbaStr(item.color));
              });
              ctx.strokeStyle = cg;
            }
          }
          // 注意canvas只有居中描边，内部需用clip模拟，外部比较复杂需离屏擦除
          let os: OffScreen | undefined,
            ctx2: CanvasRenderingContext2D | undefined;
          if (p === STROKE_POSITION.INSIDE) {
            ctx.lineWidth = strokeWidth[i] * 2 * scale;
          }
          else if (p === STROKE_POSITION.OUTSIDE) {
            os = inject.getOffscreenCanvas(w, h);
            ctx2 = os.ctx;
            ctx2.setLineDash(ctx.getLineDash());
            ctx2.lineCap = ctx.lineCap;
            ctx2.lineJoin = ctx.lineJoin;
            ctx2.miterLimit = ctx.miterLimit * scale;
            ctx2.strokeStyle = ctx.strokeStyle;
            ctx2.lineWidth = strokeWidth[i] * 2 * scale;
            ctx2.beginPath();
            canvasPolygon(ctx2, points, scale, dx2, dy2);
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
    }
  }

  override genTexture(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    scale: number,
    scaleIndex: number,
  ) {
    if (!this.loader.source) {
      return;
    }
    if (this.onlyImg) {
      // 注意图片共享一个实例
      const target = this.textureCache[0];
      if (target && target.available) {
        this.textureCache[scaleIndex] = this.textureTarget[scaleIndex] = target;
        return;
      }
      const uuid = this.root!.uuid;
      const rect = (this._rect || this.rect).slice(0);
      rect[0] = Math.floor(rect[0]);
      rect[1] = Math.floor(rect[1]);
      rect[2] = Math.ceil(rect[2]);
      rect[3] = Math.ceil(rect[3]);
      if (TextureCache.hasImgInstance(uuid, this._src)) {
        this.textureCache[scaleIndex] =
          this.textureTarget[scaleIndex] =
            this.textureCache[0] =
              TextureCache.getImgInstance(
                uuid,
                gl,
                this._src,
                rect,
              );
        return;
      }
      this.renderCanvas(scale);
      const canvasCache = this.canvasCache;
      if (canvasCache?.available) {
        this.textureCache[scaleIndex] =
          this.textureTarget[scaleIndex] =
            this.textureCache[0] =
              TextureCache.getImgInstance(
                uuid,
                gl,
                this._src,
                rect,
                canvasCache,
              );
        canvasCache.releaseImg(this._src);
      }
    }
    else {
      super.genTexture(gl, scale, scaleIndex);
    }
  }

  override clearCache(includeSelf = false) {
    if (this.onlyImg) {
      if (includeSelf) {
        this.textureCache.forEach((item) =>
          item?.releaseImg(this.root!.uuid, this._src),
        );
      }
      this.textureTarget.splice(0);
      // total是本身无需
      this.textureFilter.forEach((item) => item?.release());
      this.textureMask.forEach((item) => item?.release());
    }
    else {
      super.clearCache(includeSelf);
    }
  }

  override clone(override?: Record<string, Override[]>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    props.sourceUuid = this.uuid;
    props.src = this._src;
    const res = new Bitmap(props);
    res.style = clone(this.style);
    res.computedStyle = clone(this.computedStyle);
    if (override) {
    }
    return res;
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.BITMAP;
    return res;
  }

  override async toSketchJson(zip: JSZip): Promise<SketchFormat.Bitmap> {
    const json = await super.toSketchJson(zip) as SketchFormat.Bitmap;
    json._class = SketchFormat.ClassValue.Bitmap;
    json.image = {
      _class: 'MSJSONFileReference',
      _ref_class: 'MSImageData',
      _ref: '',
    };
    json.fillReplacesImage = false;
    const imagesZip = zip.folder('images');
    if (imagesZip) {
      const res = await fetch(this._src);
      const blob = res.blob();
      const url = (this.props as BitmapProps).md5 || this.uuid || uuid.v4();
      imagesZip.file(url, blob);
      json.image._ref = 'images/' + url;
    }
    return json;
  }

  override destroy() {
    if (this.isDestroyed) {
      return;
    }
    const root = this.root;
    super.destroy();
    const loader = this.loader;
    if (loader.loading && root) {
      root.imgLoadingCount--;
      loader.loading = false;
    }
  }

  get src() {
    return this._src;
  }

  set src(v: string) {
    if (this._src === v) {
      return;
    }
    this.clearCache(true);
    this._src = v;
    this.loadAndRefresh();
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
      } = this.computedStyle;
      // 所有描边最大值，影响bbox，可能链接点会超过原本的线粗范围
      let border = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          if (strokePosition[i] === STROKE_POSITION.OUTSIDE) {
            border = Math.max(border, item);
          }
          else if (strokePosition[i] === STROKE_POSITION.CENTER) {
            border = Math.max(border, item * 0.5);
          }
        }
      });
      res[0] -= border;
      res[1] -= border;
      res[2] += border;
      res[3] += border;
    }
    return res;
  }
}

export default Bitmap;
