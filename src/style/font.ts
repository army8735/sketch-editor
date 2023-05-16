import opentype from '../util/opentype.js';

const arial = {
  lhr: 1.14990234375, // 默认line-height ratio，(67+1854+434)/2048
  // car: 1.1171875, // content-area ratio，(1854+434)/2048
  blr: 0.9052734375, // base-line ratio，1854/2048
  // mdr: 0.64599609375, // middle ratio，(1854-1062/2)/2048
  lgr: 0.03271484375, // line-gap ratio，67/2048，默认0
  styles: [],
  postscriptNames: [],
};

const KEY = 'LOCAL_FONTS'; // 解析过的存本地缓存，解析时间还是有些成本

const o: any = {
  info: { // family为key的信息，同一系列共享
    arial,
    // Times, Helvetica, Courier，3个特殊字体偏移，逻辑来自webkit历史
    // 查看字体发现非推荐标准，先统一取osx的hhea字段，然后ascent做整体15%放大
    // https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/coretext/FontCoreText.cpp#L173
  },
  data: { // postscriptName为key，和family同引用，方便使用
    arial,
  },
  hasRegister(fontFamily: string) {
    return this.info.hasOwnProperty(fontFamily);
  },
  async registerLocalFonts(fonts: any) {
    const cache = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (let k in fonts) {
      if (fonts.hasOwnProperty(k)) {
        const font = fonts[k];
        const postscriptName = font.postscriptName.toLowerCase();
        // localStorage存的是this.data
        if (cache.hasOwnProperty(postscriptName)) {
          const o = this.data[postscriptName] = cache[postscriptName];
          const family = o.family;
          if (!this.info.hasOwnProperty(family)) {
            this.info[family] = o;
          }
          continue;
        }
        const family = font.family.toLowerCase();
        const style = font.style.toLowerCase();
        if (!this.info.hasOwnProperty(family)) {
          const o: any = this.info[family] = {
            styles: [],
            postscriptNames: [],
          };
          const blob = await font.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const f: any = opentype.parse(arrayBuffer);
          if (f && f.name && f.name.fontFamily) {
            o.name = f.name.fontFamily.zh;
          }
          o.name = o.name || family; // 中文名字
          o.family = family;
          let spread = 0;
          if (['times', 'helvetica', 'courier'].indexOf(family) > -1) {
            spread = Math.round((f.ascent + f.descent) * 0.15);
          }
          o.lhr = (f.ascent + spread + f.descent + f.lineGap) / f.emSquare;
          o.blr = (f.ascent + spread) / f.emSquare;
          o.lgr = f.lineGap / f.emSquare;
        }
        const o = this.info[family];
        o.styles.push(style);
        o.postscriptNames.push(postscriptName);
        cache[postscriptName] = this.data[postscriptName] = this.info[family];
      }
    }
    localStorage.setItem(KEY, JSON.stringify(cache));
  },
};

export default o;
