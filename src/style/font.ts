import opentype from '../util/opentype';

const arial = {
  name: 'Arial',
  family: 'Arial',
  lhr: 1.14990234375, // 默认line-height ratio，(67+1854+434)/2048
  // car: 1.1171875, // content-area ratio，(1854+434)/2048
  blr: 0.9052734375, // base-line ratio，1854/2048
  // mdr: 0.64599609375, // middle ratio，(1854-1062/2)/2048
  lgr: 0.03271484375, // line-gap ratio，67/2048，默认0
};

const KEY_INFO = 'LOCAL_FONTS_INFO'; // 解析过的存本地缓存，解析时间还是有些成本

export type fontData = {
  family: string; // 保持大小写
  name: string; // 优先中文
  lhr: number;
  blr: number;
  lgr: number;
  list: [
    {
      style: string;
      postscriptName: string;
      loaded: boolean;
      url?: string;
    },
  ];
};

const o: any = {
  info: {
    // family为key的信息，同一系列共享
    arial,
  },
  data: {
    // postscriptName为key，和family同引用，方便使用
    arial,
  },
  hasRegister(fontFamily: string) {
    return this.data.hasOwnProperty(fontFamily);
  },
  async registerLocalFonts(fonts: any) {
    const cacheInfo = JSON.parse(localStorage.getItem(KEY_INFO) || '{}');
    for (let k in fonts) {
      if (fonts.hasOwnProperty(k)) {
        const font = fonts[k];
        const postscriptName = font.postscriptName.toLowerCase();
        const family = font.family;
        const familyL = family.toLowerCase();
        const style = font.style;
        // localStorage存的是this.info
        if (cacheInfo.hasOwnProperty(familyL)) {
          const o: any = cacheInfo[familyL];
          this.info[familyL] = this.info[familyL] || {
            name: o.name,
            family: family, // 保持大小写
            lhr: o.lhr,
            blr: o.blr,
            lgr: o.lgr,
            list: [],
          };
        }
        // 没有cache则用opentype读取
        if (!this.info.hasOwnProperty(familyL)) {
          const o: any = (this.info[familyL] = this.data[familyL] = {});
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
          cacheInfo[familyL] = {
            name: o.name,
            lhr: r.lhr,
            blr: r.blr,
            lgr: r.lgr,
          };
        }
        this._register(familyL, style, postscriptName, true);
      }
    }
    localStorage.setItem(KEY_INFO, JSON.stringify(cacheInfo));
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
    let family = o.family;
    let style = f.name.preferredSubfamily?.en || f.name.fontSubfamily?.en;
    let postscriptName = f.name.postScriptName?.en;
    if (!family || !style || !postscriptName) {
      return;
    }
    family = family.toLowerCase();
    postscriptName = postscriptName.toLowerCase();
    if (!this.info.hasOwnProperty(family)) {
      this.info[family] = o;
      const r = this._cal(family, f);
      Object.assign(o, r);
    }
    return this._register(family, style, postscriptName, true);
  },
  _cal(family: string, f: any) {
    let spread = 0;
    // Times, Helvetica, Courier，3个特殊字体偏移，逻辑来自webkit历史
    // 查看字体发现非推荐标准，先统一取osx的hhea字段，然后ascent做整体15%放大
    // https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/coretext/FontCoreText.cpp#L173
    if (['times', 'helvetica', 'courier'].indexOf(family.toLowerCase()) > -1) {
      spread = Math.round((f.ascent + f.descent) * 0.15);
    }
    const lhr = (f.ascent + spread + f.descent + f.lineGap) / f.emSquare;
    const blr = (f.ascent + spread) / f.emSquare;
    const lgr = f.lineGap / f.emSquare;
    return {
      lhr,
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
    const psL = postscriptName.toLowerCase();
    const o = this.info[familyL];
    const list = (o.list = o.list || []);
    let has = false;
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      if (item.postscriptName === psL) {
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
        postscriptName: psL,
        loaded,
        url,
      });
    }
    return (this.data[familyL] = this.data[psL] = o); // 同个字体族不同postscriptName指向一个引用
  },
  registerData(data: fontData) {
    const familyL = data.family.toLowerCase();
    if (!this.info.hasOwnProperty(familyL)) {
      this.info[familyL] = data;
    }
    data.list.forEach((item) => {
      this._register(
        familyL,
        item.style,
        item.postscriptName,
        item.loaded,
        item.url,
      );
    });
  },
};

export default o;
