import opentype from '../util/opentype';

const arial: FontData = {
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
      postscriptName: 'arial',
      loaded: true,
    },
  ],
};

const KEY_INFO = 'localFonts'; // 解析过的存本地缓存，解析时间还是有些成本
const VERSION = 1;

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

const o: any = {
  KEY_INFO,
  info: {
    // family为key的信息，同一系列共享
    arial,
  },
  data: {
    // postscriptName/family为key，和info同引用，方便使用
    arial,
  },
  hasRegister(fontFamily: string) {
    return this.data.hasOwnProperty(fontFamily);
  },
  async registerLocalFonts(fonts: any[]) {
    let cacheInfo: any = {};
    if (typeof localStorage !== 'undefined') {
      cacheInfo = JSON.parse(localStorage.getItem(KEY_INFO) || '{}');
    }
    let data: any = cacheInfo.data || {};
    if (!cacheInfo.version || cacheInfo.version < VERSION) {
      data = {};
    }
    for (let i = 0, len = fonts.length; i < len; i++) {
      const font = fonts[i];
      const postscriptName = font.postscriptName.toLowerCase();
      const family = font.family;
      const familyL = family.toLowerCase();
      const style = font.style;
      // localStorage存的是this.info
      if (data.hasOwnProperty(familyL)) {
        const o: any = data[familyL];
        this.info[familyL] = this.info[familyL] || {
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
      if (!this.info.hasOwnProperty(familyL)) {
        const o: any = (this.info[familyL] = {});
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
        const r = this._cal(familyL, f);
        Object.assign(o, r);
      }
      this._register(familyL, style, postscriptName, true);
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
    const familyL = family.toLowerCase();
    const postscriptNameL = postscriptName.toLowerCase();
    // 没注册才注册
    if (!this.info.hasOwnProperty(familyL)) {
      this.info[familyL] = o;
      const r = this._cal(familyL, f);
      Object.assign(o, r);
      this._register(familyL, style, postscriptNameL, true);
      this.updateLocalStorage();
    }
    return Object.assign({
      postscriptName,
      family,
      style,
    }, this.info[familyL]);
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
    const familyL = family.toLowerCase();
    const postscriptNameL = postscriptName.toLowerCase();
    const info = this.info[familyL];
    const list = (info.list = info.list || []);
    let has = false;
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      if (item.postscriptName === postscriptNameL) {
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
        postscriptName: postscriptNameL,
        loaded,
        url,
      });
    }
    return {
      family: family,
      familyL: familyL,
      postscriptName: postscriptName,
      postscriptNameL: postscriptNameL,
      data: (this.data[familyL] = this.data[postscriptNameL] = info),
    }; // 同个字体族不同postscriptName指向一个引用
  },
  registerData(data: FontData) {
    const familyL = data.family.toLowerCase();
    if (!this.info.hasOwnProperty(familyL)) {
      this.info[familyL] = this.data[familyL] = data;
    }
    if (!this.data.hasOwnProperty(familyL)) {
      data.list.forEach((item) => {
        this._register(
          familyL,
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
    const data: any = {};
    const info = this.info;
    for (let i in info) {
      if (info.hasOwnProperty(i)) {
        const o = info[i];
        data[i] = {
          name: o.name,
          lhr: o.lhr,
          car: o.car,
          blr: o.blr,
          lgr: o.lgr,
        };
      }
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY_INFO, JSON.stringify({ version: VERSION, data }));
    }
  },
};

export default o;
