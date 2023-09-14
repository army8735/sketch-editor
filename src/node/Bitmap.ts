import * as uuid from 'uuid';
import { BitmapProps, Override } from '../format';
import CanvasCache from '../refresh/CanvasCache';
import config from '../refresh/config';
import { RefreshLevel } from '../refresh/level';
import { canvasPolygon } from '../refresh/paint';
import TextureCache from '../refresh/TextureCache';
import { color2rgbaStr } from '../style/css';
import inject from '../util/inject';
import { isFunction } from '../util/type';
import { clone } from '../util/util';
import { LayoutData } from './layout';
import Node from './Node';

type Loader = {
  error: boolean;
  loading: boolean;
  source?: HTMLImageElement;
  width: number;
  height: number;
  onlyImg: boolean;
};

class Bitmap extends Node {
  _src: string;
  loader: Loader;

  constructor(props: BitmapProps) {
    super(props);
    this.isBitmap = true;
    const src = (this._src = props.src || '');
    this.loader = {
      error: false,
      loading: false,
      width: 0,
      height: 0,
      onlyImg: true,
    };
    if (!src) {
      this.loader.error = true;
    } else {
      const isBlob = /^blob:/.test(src);
      if (isBlob) {
        // fetch('https://karas.alipay.com/api/uploadbase64', {
        //   method: 'post',
        //   headers: {
        //     Accept: 'application/json',
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     data: src,
        //     quality: 1,
        //   }),
        // }).then(res => res.json()).then(res => {
        //   if (res.success) {
        //     this.src = res.url;
        //   }
        // });
      }
      const cache = inject.IMG[src];
      if (!cache) {
        inject.measureImg(src, (res: any) => {
          // 可能会变更，所以加载完后对比下是不是当前最新的
          if (src === this._src) {
            if (res.success) {
              if (isFunction(props.onLoad)) {
                props.onLoad!();
              }
            } else {
              if (isFunction(props.onError)) {
                props.onError!();
              }
            }
          }
        });
      } else if (cache.state === inject.LOADED) {
        if (cache.success) {
          this.loader.source = cache.source;
          this.loader.width = cache.source.width;
          this.loader.height = cache.source.height;
        } else {
          this.loader.error = true;
        }
      }
    }
  }

  override lay(data: LayoutData) {
    super.lay(data);
    const src = this._src;
    const loader = this.loader;
    if (src) {
      const cache = inject.IMG[src];
      if (!cache || cache.state === inject.LOADING) {
        if (!loader.loading) {
          this.loadAndRefresh();
        }
      } else if (cache && cache.state === inject.LOADED) {
        loader.loading = false;
        if (cache.success) {
          this.loader.source = cache.source;
          this.loader.width = cache.width;
          this.loader.height = cache.height;
        } else {
          this.loader.error = true;
        }
      }
    }
  }

  private loadAndRefresh() {
    // 加载前先清空之前可能遗留的老数据
    const loader = this.loader;
    loader.source = undefined;
    loader.error = false;
    if (!this.isDestroyed) {
      // 先置空图片
      this.root!.addUpdate(
        this,
        [],
        RefreshLevel.REPAINT,
        false,
        false,
        undefined,
      );
      loader.loading = true;
      inject.measureImg(this._src, (data: any) => {
        // 还需判断url，防止重复加载时老的替换新的，失败走error绘制
        if (data.url === this._src) {
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
          } else {
            loader.error = true;
          }
        }
      });
    }
  }

  override calContent(): boolean {
    let res = super.calContent();
    const { loader } = this;
    if (res) {
      loader.onlyImg = false;
    } else {
      loader.onlyImg = true;
      if (loader.source) {
        res = true;
      }
    }
    return (this.hasContent = res);
  }

  override renderCanvas(scale: number) {
    const { loader } = this;
    if (loader.onlyImg) {
      this.canvasCache?.releaseImg(this._src);
      // 尺寸使用图片原始尺寸
      let w = loader.width,
        h = loader.height;
      if (w > config.MAX_TEXTURE_SIZE || h > config.MAX_TEXTURE_SIZE) {
        if (w > h) {
          w = config.MAX_TEXTURE_SIZE;
          h *= config.MAX_TEXTURE_SIZE / w;
        } else if (w < h) {
          h = config.MAX_TEXTURE_SIZE;
          w *= config.MAX_TEXTURE_SIZE / h;
        } else {
          w = h = config.MAX_TEXTURE_SIZE;
        }
      }
      const canvasCache = (this.canvasCache = CanvasCache.getImgInstance(
        w,
        h,
        this._src,
      ));
      canvasCache.available = true;
      const ctx = canvasCache.offscreen.ctx;
      // 第一张图像才绘制，图片解码到canvas上
      if (canvasCache.getCount(this._src) === 1) {
        ctx.drawImage(loader.source!, 0, 0);
      }
      const { innerShadow, innerShadowEnable } = this.computedStyle;
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
        canvasPolygon(
          ctx,
          [
            [0, 0],
            [w, 0],
            [w, h],
            [0, h],
            [0, 0],
          ],
          1,
          0,
          0,
        );
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = '#FFF';
        // 在原本图形基础上，外围扩大n画个边框，这样奇偶使得填充在clip范围外不会显示出来，但shadow却在内可以显示
        ctx.beginPath();
        canvasPolygon(
          ctx,
          [
            [0, 0],
            [w, 0],
            [w, h],
            [0, h],
            [0, 0],
          ],
          1,
          0,
          0,
        );
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
          0,
          0,
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
    } else {
      super.renderCanvas(scale);
    }
  }

  override genTexture(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    scale: number,
    scaleIndex: number,
  ) {
    const { loader } = this;
    if (loader.onlyImg) {
      // 注意图片共享一个实例
      const target = this.textureCache[0];
      if (target && target.available) {
        this.textureCache[scaleIndex] = this.textureTarget[scaleIndex] = target;
        return;
      }
      this.renderCanvas(scale);
      const canvasCache = this.canvasCache;
      if (canvasCache?.available) {
        this.textureCache[scaleIndex] =
          this.textureTarget[scaleIndex] =
            this.textureCache[0] =
              TextureCache.getImgInstance(
                gl,
                canvasCache.offscreen.canvas,
                this._src,
                (this._rect || this.rect).slice(0),
              );
        canvasCache.releaseImg(this._src);
      }
    } else {
      super.genTexture(gl, scale, scaleIndex);
    }
  }

  override clearCache(includeSelf = false) {
    const { loader } = this;
    if (loader.onlyImg) {
      if (includeSelf) {
        this.textureCache.forEach((item) => item?.releaseImg(this._src));
      }
      this.textureTarget.splice(0);
      // total是本身无需
      this.textureFilter.forEach((item) => item?.release());
      this.textureMask.forEach((item) => item?.release());
    } else {
      super.clearCache(includeSelf);
    }
  }

  override clone(override: Record<string, Override>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    props.src = this._src;
    const res = new Bitmap(props);
    res.style = clone(this.style);
    return res;
  }

  get src() {
    return this._src;
  }

  set src(v: string) {
    if (this._src === v) {
      return;
    }
    this._src = v;
    this.loadAndRefresh();
  }
}

export default Bitmap;
