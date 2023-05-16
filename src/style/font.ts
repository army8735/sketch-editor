import opentype from '../util/opentype.js';

const o: any = {
  info: {
    // 兜底
    arial: {
      lhr: 1.14990234375, // 默认line-height ratio，(67+1854+434)/2048
      // car: 1.1171875, // content-area ratio，(1854+434)/2048
      blr: 0.9052734375, // base-line ratio，1854/2048
      // mdr: 0.64599609375, // middle ratio，(1854-1062/2)/2048
      lgr: 0.03271484375, // line-gap ratio，67/2048，默认0
      styles: [],
    },
    // Times, Helvetica, Courier，3个特殊字体偏移，逻辑来自webkit历史
    // 查看字体发现非推荐标准，先统一取osx的hhea字段，然后ascent做整体15%放大
    // https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/coretext/FontCoreText.cpp#L173
  },
  hasRegister(fontFamily: string) {
    return this.info.hasOwnProperty(fontFamily);
  },
  async registerLocalFonts(fonts: any) {
    for (let k in fonts) {
      if (fonts.hasOwnProperty(k)) {
        const font = fonts[k];
        const postscriptName = font.postscriptName.toLowerCase();
        const family = font.family.toLowerCase();
        const style = font.style.toLowerCase();
        if (!this.info.hasOwnProperty(family)) {
          const o: any = this.info[family] = {
            styles: [],
          };
          const blob = await font.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const f: any = opentype.parse(arrayBuffer);
          if (f && f.name && f.name.fontFamily) {
            o.name = f.name.fontFamily.zh || f.name.fontFamily.en;
          }
          if (['times', 'helvetica', 'courier'].indexOf(family) > -1) {
            const spread = Math.round((f.ascent + f.descent) * 0.15);
            o.lhr = (f.ascent + spread + f.descent + f.lineGap) / f.emSquare;
            o.blr = (f.ascent + spread) / f.emSquare;
          }
          else {
            o.lhr = (f.ascent + f.descent + f.lineGap) / f.emSquare;
            o.blr = f.ascent / f.emSquare;
          }
          o.lgr = f.lineGap / f.emSquare;
        }
        this.info[family].styles.push(style);
        this.info[postscriptName] = this.info[family];
      }
    }
  },
};

export default o;
