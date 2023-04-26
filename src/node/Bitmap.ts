import Node from './Node';
import { BitmapProps } from '../format';
import inject from '../util/inject';
import { isFunction } from '../util/type';
import { LayoutData } from './layout';
import { RefreshLevel } from '../refresh/level';
import CanvasCache from '../refresh/CanvasCache';
import TextureCache from '../refresh/TextureCache';
import config from '../refresh/config';

type Loader = {
  error: boolean,
  loading: boolean,
  src?: string,
  source?: HTMLImageElement,
  width: number,
  height: number,
  onlyImg: boolean,
};

class Bitmap extends Node {
  _src: string;
  loader: Loader;

  constructor(props: BitmapProps) {
    super(props);
    const src = this._src = props.src || '';
    this.loader = {
      error: false,
      loading: false,
      src,
      width: 0,
      height: 0,
      onlyImg: true,
    };
    if (!src) {
      this.loader.error = true;
    }
    else {
      const isBase64 = /^data:image\/(\w+);base64,/.test(src);
      if (isBase64) {
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
          if (src === this.loader.src) {
            if (res.success) {
              if (isFunction(props.onLoad)) {
                props.onLoad!();
              }
            }
            else {
              if (isFunction(props.onError)) {
                props.onError!();
              }
            }
          }
        });
      }
      else if (cache.state === inject.LOADED) {
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

  override lay(data: LayoutData) {
    super.lay(data);
    const src = this.loader.src;
    if (src) {
      const cache = inject.IMG[src];
      if (!cache || cache.state === inject.LOADING) {
        if (!this.loader.loading) {
          this.loadAndRefresh();
        }
      }
      else if (cache && cache.state === inject.LOADED) {
        this.loader.loading = false;
        if (cache.success) {
          this.loader.source = cache.source;
          this.loader.width = cache.width;
          this.loader.height = cache.height;
        }
        else {
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
    loader.loading = true;
    inject.measureImg(loader.src, (data: any) => {
      // 还需判断url，防止重复加载时老的替换新的，失败走error绘制
      if (data.url === loader.src) {
        loader.loading = false;
        if (data.success) {
          loader.source = data.source;
          loader.width = data.width;
          loader.height = data.height;
          if (!this.isDestroyed) {
            this.root!.addUpdate(this, [], RefreshLevel.REPAINT, false, false, undefined);
          }
        }
        else {
          loader.error = true;
        }
      }
    });
  }

  override calContent(): boolean {
    let res = super.calContent();
    const { loader } = this;
    if (res) {
      loader.onlyImg = false;
    }
    else {
      loader.onlyImg = true;
      if (loader.source) {
        res = true;
      }
    }
    return this.hasContent = res;
  }

  override renderCanvas(scale: number) {
    const { loader } = this;
    if (loader.onlyImg) {
      this.canvasCache?.releaseImg(this._src);
      // 尺寸使用图片原始尺寸
      let w = loader.width, h = loader.height;
      if (w > config.MAX_TEXTURE_SIZE || h > config.MAX_TEXTURE_SIZE) {
        if (w > h) {
          w = config.MAX_TEXTURE_SIZE;
          h *= config.MAX_TEXTURE_SIZE / w;
        }
        else if (w < h) {
          h = config.MAX_TEXTURE_SIZE;
          w *= config.MAX_TEXTURE_SIZE / h;
        }
        else {
          w = h = config.MAX_TEXTURE_SIZE;
        }
      }
      const canvasCache = this.canvasCache = CanvasCache.getImgInstance(w, h, this.src);
      canvasCache.available = true;
      // 第一张图像才绘制，图片解码到canvas上
      if (canvasCache.getCount(this._src) === 1) {
        canvasCache.offscreen.ctx.drawImage(loader.source!, 0, 0);
      }
    }
    else {
      super.renderCanvas(scale);
    }
  }

  override genTexture(gl: WebGL2RenderingContext | WebGLRenderingContext, scale: number, scaleIndex: number) {
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
        this.textureCache[scaleIndex] = this.textureTarget[scaleIndex] = this.textureCache[0]
          = TextureCache.getImgInstance(gl, canvasCache.offscreen.canvas, this._src, (this._bbox || this.bbox).slice(0));
        canvasCache.releaseImg(this._src);
      }
    }
    else {
      super.genTexture(gl, scale, scaleIndex);
    }
  }

  override clearCache(includeSelf = false) {
    const { loader } = this;
    if (loader.onlyImg) {
      if (includeSelf) {
        this.textureCache.forEach(item => item?.releaseImg(this._src));
      }
      this.textureTotal.forEach(item => item?.release());
      this.textureMask.forEach(item => item?.release());
    }
    else {
      super.clearCache(includeSelf);
    }
  }

  get src() {
    return this._src;
  }

  set src(v: string) {
    this.src = v;
    const loader = this.loader;
    if (v === loader.src || this.isDestroyed || !v && loader.error) {
      if (v && v !== loader.src) {
        loader.src = v;
        inject.measureImg(v, (res: any) => {
          if (loader.src === v) {
            const { onLoad, onError } = this.props as BitmapProps;
            if (res.success) {
              if (onLoad && isFunction(onLoad)) {
                onLoad();
              }
            }
            else {
              if (onError && isFunction(onError)) {
                onError();
              }
            }
          }
        });
      }
      return;
    }
    loader.src = v;
    this.loadAndRefresh();
  }
}

export default Bitmap;
