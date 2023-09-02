import config from './config';
import { isFunction, isString } from './type';

const SPF = 1000 / 60;

const CANVAS: Record<string, OffscreenCanvas | HTMLCanvasElement> = {};
const SUPPORT_OFFSCREEN_CANVAS =
  typeof OffscreenCanvas === 'function' && OffscreenCanvas.prototype.getContext;

export type OffScreen = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  available: boolean;
  release: () => void;
};

function offscreenCanvas(
  width: number,
  height: number,
  key?: string,
  contextAttributes?: CanvasRenderingContext2DSettings,
): OffScreen {
  let o: any;
  if (!key) {
    o =
      !config.debug && config.offscreenCanvas && SUPPORT_OFFSCREEN_CANVAS
        ? new OffscreenCanvas(width, height)
        : document.createElement('canvas');
  } else if (!CANVAS[key]) {
    o = CANVAS[key] =
      !config.debug && config.offscreenCanvas && SUPPORT_OFFSCREEN_CANVAS
        ? new OffscreenCanvas(width, height)
        : document.createElement('canvas');
  } else {
    o = CANVAS[key];
  }
  // 防止小数向上取整
  width = Math.ceil(width);
  height = Math.ceil(height);
  o.width = width;
  o.height = height;
  if (config.debug) {
    o.style.width = width + 'px';
    o.style.height = height + 'px';
    if (key) {
      o.setAttribute('key', key);
    }
    document.body.appendChild(o);
  }
  let ctx = o.getContext('2d', contextAttributes);
  if (!ctx) {
    inject.error('Total canvas memory use exceeds the maximum limit');
  }
  return {
    canvas: o,
    ctx,
    available: true,
    release() {
      if (!this.available) {
        return;
      }
      this.available = false;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      o.width = o.height = 0;
      if (config.debug && o) {
        document.body.removeChild(o);
      }
      o = null;
    },
  };
}

const SUPPORT_FONT: any = {};
let defaultFontFamilyData: any;

const IMG: any = {};
const INIT = 0;
const LOADING = 1;
const LOADED = 2;
const FONT: any = {};
let MAX_LOAD_NUM = 0;
let imgCount = 0,
  imgQueue: any = [],
  fontCount = 0,
  fontQueue: any = [];

const inject = {
  requestAnimationFrame(cb: FrameRequestCallback): number {
    if (!cb) {
      return -1;
    }
    let res;
    if (typeof requestAnimationFrame !== 'undefined') {
      inject.requestAnimationFrame = requestAnimationFrame.bind(null);
      res = requestAnimationFrame(cb);
    } else {
      res = setTimeout(cb, SPF);
      inject.requestAnimationFrame = function (cb) {
        return setTimeout(cb, SPF);
      };
    }
    return res;
  },
  cancelAnimationFrame(id: number) {
    let res;
    if (typeof cancelAnimationFrame !== 'undefined') {
      inject.cancelAnimationFrame = cancelAnimationFrame.bind(null);
      res = cancelAnimationFrame(id);
    } else {
      res = clearTimeout(id);
      inject.cancelAnimationFrame = function (id) {
        return clearTimeout(id);
      };
    }
    return res;
  },
  now() {
    if (typeof performance !== 'undefined') {
      inject.now = function () {
        return Math.floor(performance.now());
      };
      return Math.floor(performance.now());
    }
    inject.now = Date.now.bind(Date);
    return Date.now();
  },
  hasOffscreenCanvas(key: string) {
    return key && CANVAS.hasOwnProperty(key);
  },
  getOffscreenCanvas(
    width: number,
    height: number,
    key?: string,
    contextAttributes?: CanvasRenderingContext2DSettings,
  ) {
    return offscreenCanvas(width, height, key, contextAttributes);
  },
  isWebGLTexture(o: any) {
    if (o && typeof WebGLTexture !== 'undefined') {
      return o instanceof WebGLTexture;
    }
  },
  defaultFontFamily: 'arial',
  getFontCanvas() {
    return inject.getOffscreenCanvas(
      16,
      16,
      '__$$CHECK_SUPPORT_FONT_FAMILY$$__',
      { willReadFrequently: true },
    );
  },
  checkSupportFontFamily(ff: string) {
    ff = ff.toLowerCase();
    // 强制arial兜底
    if (ff === this.defaultFontFamily) {
      return true;
    }
    if (SUPPORT_FONT.hasOwnProperty(ff)) {
      return SUPPORT_FONT[ff];
    }
    let canvas = inject.getFontCanvas();
    let context = canvas.ctx;
    context.textAlign = 'center';
    context.fillStyle = '#000';
    context.textBaseline = 'middle';
    if (!defaultFontFamilyData) {
      context.clearRect(0, 0, 16, 16);
      context.font = '16px ' + this.defaultFontFamily;
      context.fillText('a', 8, 8);
      defaultFontFamilyData = context.getImageData(0, 0, 16, 16).data;
    }
    context.clearRect(0, 0, 16, 16);
    if (/\s/.test(ff)) {
      ff = '"' + ff.replace(/"/g, '\\"') + '"';
    }
    context.font = '16px ' + ff + ',' + this.defaultFontFamily;
    context.fillText('a', 8, 8);
    let data = context.getImageData(0, 0, 16, 16).data;
    for (let i = 0, len = data.length; i < len; i++) {
      if (defaultFontFamilyData[i] !== data[i]) {
        return (SUPPORT_FONT[ff] = true);
      }
    }
    return (SUPPORT_FONT[ff] = false);
  },
  FONT,
  loadFont(
    fontFamily: string,
    url?: string | ((cache: any) => void),
    cb?: (cache: any) => void,
  ) {
    if (isFunction(url)) {
      // @ts-ignore
      cb = url;
      url = fontFamily;
    }
    if (Array.isArray(url)) {
      if (!url.length) {
        return cb && cb(null);
      }
      let count = 0;
      let len = url.length;
      let list: any = [];
      url.forEach((item, i) => {
        inject.loadFont(item.fontFamily, item.url, function (cache: any) {
          list[i] = cache;
          if (++count === len) {
            cb && cb(list);
          }
        });
      });
      return;
    } else if (!url || !isString(url)) {
      inject.error('Load font invalid: ' + url);
      cb &&
      cb({
        state: LOADED,
        success: false,
        url,
      });
      return;
    }
    let cache = (FONT[url as string] = FONT[url as string] || {
      state: INIT,
      task: [],
    });
    if (cache.state === LOADED) {
      cb && cb(cache);
    } else if (cache.state === LOADING) {
      cb && cache.task.push(cb);
    } else {
      cache.state = LOADING;
      cb && cache.task.push(cb);
      if (MAX_LOAD_NUM > 0 && fontCount >= MAX_LOAD_NUM) {
        fontQueue.push({
          fontFamily,
          url,
        });
        return;
      }
      fontCount++;
      function load(fontFamily: string, url: string | ArrayBuffer, cache: any) {
        if (url instanceof ArrayBuffer) {
          success(url);
        } else {
          let request = new XMLHttpRequest();
          request.open('get', url, true);
          request.responseType = 'arraybuffer';
          request.onload = function () {
            if (request.response) {
              success(request.response);
            } else {
              error();
            }
          };
          request.onerror = error;
          request.send();
        }

        function success(ab: ArrayBuffer) {
          let f = new FontFace(fontFamily, ab);
          f.load()
            .then(function () {
              if (typeof document !== 'undefined') {
                document.fonts.add(f);
              }
              cache.state = LOADED;
              cache.success = true;
              cache.url = url;
              cache.arrayBuffer = ab;
              let list = cache.task.splice(0);
              list.forEach((cb: (cache: any) => void) => cb(cache));
            })
            .catch(error);
          fontCount++;
          if (fontQueue.length) {
            let o = fontQueue.shift();
            load(o.fontFamily, o.url, FONT[o.url]);
          }
        }

        function error() {
          cache.state = LOADED;
          cache.success = false;
          cache.url = url;
          let list = cache.task.splice(0);
          list.forEach((cb: (cache: any) => void) => cb(cache));
          fontCount--;
          if (fontQueue.length) {
            let o = fontQueue.shift();
            load(o.fontFamily, o.url, FONT[o.url]);
          }
        }
      }
      load(fontFamily, url as string, cache);
    }
  },
  IMG,
  INIT,
  LOADED,
  LOADING,
  get MAX_LOAD_NUM(): number {
    return MAX_LOAD_NUM;
  },
  set MAX_LOAD_NUM(v: number) {
    // @ts-ignore
    MAX_LOAD_NUM = parseInt(v) || 0;
  },
  measureImg(
    url: string | undefined | Array<string>,
    cb?: (cache: any) => void,
  ) {
    if (Array.isArray(url)) {
      if (!url.length) {
        return cb && cb(null);
      }
      let count = 0;
      let len = url.length;
      let list: any = [];
      url.forEach((item, i) => {
        inject.measureImg(item, function (cache: any) {
          list[i] = cache;
          if (++count === len) {
            cb && cb(list);
          }
        });
      });
      return;
    } else if (!url || !isString(url)) {
      inject.error('Measure img invalid: ' + url);
      cb &&
      cb({
        state: LOADED,
        success: false,
        url,
      });
      return;
    }
    let cache = (IMG[url] = IMG[url] || {
      state: INIT,
      task: [],
    });
    if (cache.state === LOADED) {
      cb && cb(cache);
    } else if (cache.state === LOADING) {
      cb && cache.task.push(cb);
    } else {
      cache.state = LOADING;
      cb && cache.task.push(cb);
      if (MAX_LOAD_NUM > 0 && imgCount >= MAX_LOAD_NUM) {
        imgQueue.push(url);
        return;
      }
      imgCount++;
      function load(url: string, cache: any) {
        let img = new Image();
        img.onload = function () {
          cache.state = LOADED;
          cache.success = true;
          cache.width = img.width;
          cache.height = img.height;
          cache.source = img;
          cache.url = url;
          let list = cache.task.splice(0);
          list.forEach((cb: (cache: any) => void) => {
            cb(cache);
          });
          imgCount--;
          if (imgQueue.length) {
            let o = imgQueue.shift();
            load(o, IMG[o]);
          }
        };
        img.onerror = function () {
          cache.state = LOADED;
          cache.success = false;
          cache.url = url;
          let list = cache.task.splice(0);
          list.forEach((cb: (cache: any) => void) => cb(cache));
          imgCount--;
          if (imgQueue.length) {
            let o = imgQueue.shift();
            load(o, cache);
          }
        };
        if (url.substr(0, 5) !== 'data:') {
          let host = /^(?:\w+:)?\/\/([^/:]+)/.exec(url);
          if (host) {
            if (
              typeof location === 'undefined' ||
              location.hostname !== host[1]
            ) {
              img.crossOrigin = 'anonymous';
            }
          }
        }
        img.src = url;
        if (config.debug && typeof document !== 'undefined') {
          document.body.appendChild(img);
        }
      }
      load(url, cache);
    }
  },
  log(s: any) {
    console.log(s);
  },
  warn(s: any) {
    console.warn(s);
  },
  error(s: any) {
    console.error(s);
  },
};

export default inject;
