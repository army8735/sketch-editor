import opentype from '../util/opentype';
import inject from '../util/inject';

const Arial: FontData = {
  name: 'Arial',
  family: 'Arial',
  lhr: 1.14990234375, // 默认line-height ratio，(67+1854+434)/2048
  car: 1.1171875, // content-area ratio，(1854+434)/2048
  blr: 0.9052734375, // base-line ratio，1854/2048
  // mdr: 0.64599609375, // middle ratio，(1854-1062/2)/2048，去掉x-height的一半
  lgr: 0.03271484375, // line-gap ratio，67/2048，默认0
  list: [
    {
      style: 'Regular',
      postscriptName: 'Arial',
      loaded: true,
    },
  ],
};

const KEY_INFO = 'localFonts'; // 解析过的存本地缓存，解析时间还是有些成本
const VERSION = 2;

export type FontData = {
  family: string; // 保持大小写
  name: string; // 优先中文
  lhr: number;
  blr: number;
  car: number;
  lgr: number;
  list: {
    style: string;
    postscriptName: string;
    loaded: boolean;
    url?: string;
  }[];
};

// family为key的信息，同一系列共享
const info: Record<string, FontData> = { Arial };
// postscriptName/family为key，和info同引用，方便使用
const data: Record<string, FontData> = { Arial };

const o = {
  KEY_INFO,
  info,
  data,
  hasRegister(fontFamily: string) {
    return data.hasOwnProperty(fontFamily);
  },
  async registerLocalFonts(fonts?: any[]) {
    if (!fonts) {
      fonts = await inject.loadLocalFonts() || [];
    }
    let cacheInfo: any = {};
    if (typeof localStorage !== 'undefined') {
      cacheInfo = JSON.parse(localStorage.getItem(KEY_INFO) || '{}');
    }
    let cache: any = cacheInfo.data || {};
    if (!cacheInfo.version || cacheInfo.version < VERSION) {
      cache = {};
    }
    for (let i = 0, len = fonts!.length; i < len; i++) {
      const font = fonts![i];
      const postscriptName = font.postscriptName;
      const family = font.family;
      const style = font.style;
      // localStorage存的是this.info
      if (cache.hasOwnProperty(family)) {
        const o: any = cache[family];
        info[family] = info[family] || {
          name: o.name,
          family: family, // 保持大小写
          lhr: o.lhr,
          car: o.car,
          blr: o.blr,
          lgr: o.lgr,
          list: [],
        };
      }
      // 没有cache则用opentype读取
      if (!info.hasOwnProperty(family)) {
        const o = info[family] = {
          name: '',
          family: '',
          lhr: 0,
          car: 0,
          blr: 0,
          lgr: 0,
          list: [],
        };
        const blob = await font.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const f: any = opentype.parse(arrayBuffer);
        if (f && f.name) {
          o.name =
            f.name.preferredFamily?.zh ||
            f.name.preferredFamily?.en ||
            f.name.fontFamily?.zh;
        }
        o.name = o.name || family; // 中文名字
        o.family = family;
        const r = this._cal(family, f);
        Object.assign(o, r);
      }
      this._register(family, style, postscriptName, true);
    }
    this.updateLocalStorage();
  },
  registerAb(ab: ArrayBuffer) {
    const o: any = {};
    const f: any = opentype.parse(ab);
    if (f && f.name) {
      o.family = f.name.preferredFamily?.en || f.name.fontFamily?.en;
      o.name =
        f.name.preferredFamily?.zh ||
        f.name.preferredFamily?.en ||
        f.name.fontFamily?.zh ||
        o.family;
    }
    // 没有信息无效
    const family = o.family;
    const style = f.name.preferredSubfamily?.en || f.name.fontSubfamily?.en;
    const postscriptName = f.name.postScriptName?.en;
    if (!family || !style || !postscriptName) {
      return;
    }
    if (this.hasRegister(postscriptName)) {
      return;
    }
    if (!info.hasOwnProperty(family)) {
      const r = this._cal(family, f);
      Object.assign(o, r);
      o.list = [];
      info[family] = o;
    }
    this._register(family, style, postscriptName, true);
    inject.loadArrayBufferFont(postscriptName, ab);
  },
  _cal(family: string, f: any) {
    let spread = 0;
    // Times, Helvetica, Courier，3个特殊字体偏移，逻辑来自webkit历史
    // 查看字体发现非推荐标准，先统一取osx的hhea字段，然后ascent做整体15%放大
    // https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/coretext/FontCoreText.cpp#L182
    if (['times', 'helvetica', 'courier'].indexOf(family.toLowerCase()) > -1) {
      spread = Math.round((f.ascent + f.descent) * 0.15);
    }
    const lhr = (f.ascent + spread + f.descent + f.lineGap) / f.emSquare;
    const car = (f.ascent + spread + f.descent) / f.emSquare;
    const blr = (f.ascent + spread) / f.emSquare;
    const lgr = f.lineGap / f.emSquare;
    return {
      lhr,
      car,
      blr,
      lgr,
    };
  },
  _register(
    family: string,
    style: string,
    postscriptName: string,
    loaded: boolean,
    url?: string,
  ) {
    const o = info[family];
    const list = o.list = (o.list || []);
    let has = false;
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      if (item.postscriptName === postscriptName) {
        has = true;
        if (loaded) {
          item.loaded = true;
        }
        break;
      }
    }
    if (!has) {
      list.push({
        style,
        postscriptName,
        loaded,
        url,
      });
    }
    return {
      family: family,
      postscriptName: postscriptName,
      data: (data[family] = data[postscriptName] = o),
    }; // 同个字体族不同postscriptName指向一个引用
  },
  registerData(fd: FontData) {
    const family = fd.family;
    if (!info.hasOwnProperty(family)) {
      info[family] = fd;
    }
    if (!data.hasOwnProperty(family)) {
      fd.list.forEach((item) => {
        this._register(
          family,
          item.style,
          item.postscriptName,
          item.loaded,
          item.url,
        );
      });
      this.updateLocalStorage();
    }
  },
  updateLocalStorage() {
    const cache: any = {};
    for (let i in info) {
      if (info.hasOwnProperty(i)) {
        const o = info[i];
        cache[i] = {
          name: o.name,
          lhr: o.lhr,
          car: o.car,
          blr: o.blr,
          lgr: o.lgr,
        };
      }
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY_INFO, JSON.stringify({ version: VERSION, data: cache }));
    }
  },
};

export default o;
