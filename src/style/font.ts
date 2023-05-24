import opentype from '../util/opentype.js';

const arial = {
  lhr: 1.14990234375, // 默认line-height ratio，(67+1854+434)/2048
  // car: 1.1171875, // content-area ratio，(1854+434)/2048
  blr: 0.9052734375, // base-line ratio，1854/2048
  // mdr: 0.64599609375, // middle ratio，(1854-1062/2)/2048
  lgr: 0.03271484375, // line-gap ratio，67/2048，默认0
};

const KEY_INFO = 'LOCAL_FONTS_INFO'; // 解析过的存本地缓存，解析时间还是有些成本

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
    return this.info.hasOwnProperty(fontFamily);
  },
  async registerLocalFonts(fonts: any) {
    const cacheInfo = JSON.parse(localStorage.getItem(KEY_INFO) || '{}');
    for (let k in fonts) {
      if (fonts.hasOwnProperty(k)) {
        const font = fonts[k];
        const postscriptName = font.postscriptName.toLowerCase();
        const family = font.family.toLowerCase();
        const style = font.style.toLowerCase();
        // localStorage存的是this.info
        if (cacheInfo.hasOwnProperty(family)) {
          const o: any = cacheInfo[family];
          this.info[family] = this.info[family] || {
            name: o.name,
            family,
            lhr: o.lhr,
            blr: o.blr,
            lgr: o.lgr,
          };
        }
        // 没有cache则用opentype读取
        if (!this.info.hasOwnProperty(family)) {
          const o: any = this.info[family] = this.data[family] = {};
          const blob = await font.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const f: any = opentype.parse(arrayBuffer);
          if (f && f.name && f.name.fontFamily) {
            o.name = f.name.fontFamily.zh;
          }
          o.name = o.name || family; // 中文名字
          o.family = family;
          let spread = 0;
          // Times, Helvetica, Courier，3个特殊字体偏移，逻辑来自webkit历史
          // 查看字体发现非推荐标准，先统一取osx的hhea字段，然后ascent做整体15%放大
          // https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/coretext/FontCoreText.cpp#L173
          if (['times', 'helvetica', 'courier'].indexOf(family) > -1) {
            spread = Math.round((f.ascent + f.descent) * 0.15);
          }
          o.lhr = (f.ascent + spread + f.descent + f.lineGap) / f.emSquare;
          o.blr = (f.ascent + spread) / f.emSquare;
          o.lgr = f.lineGap / f.emSquare;
          cacheInfo[family] = {
            name: o.name,
            lhr: o.lhr,
            blr: o.blr,
            lgr: o.lgr,
          };
        }
        const o = this.info[family];
        o.enable = true;
        o.styles = o.styles || [];
        if (o.styles.indexOf(style) === -1) {
          o.styles.push(style);
        }
        o.postscriptNames = o.postscriptNames || [];
        if (o.postscriptNames.indexOf(postscriptName) === -1) {
          o.postscriptNames.push(postscriptName);
        }
        this.data[family] = this.data[postscriptName] = o; // 同个字体族不同postscriptName指向一个引用
      }
    }
    localStorage.setItem(KEY_INFO, JSON.stringify(cacheInfo));
  },
};


export default o;
