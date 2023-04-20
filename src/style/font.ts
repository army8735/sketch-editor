const o: any = {
  info: {
    arial: {
      lhr: 1.14990234375, // 默认line-height ratio，(67+1854+434)/2048
      // car: 1.1171875, // content-area ratio，(1854+434)/2048
      blr: 0.9052734375, // base-line ratio，1854/2048
      // mdr: 0.64599609375, // middle ratio，(1854-1062/2)/2048
      lgr: 0.03271484375, // line-gap ratio，67/2048，默认0
    },
    // Times, Helvetica, Courier，3个特殊字体偏移，逻辑来自webkit历史
    // 查看字体发现非推荐标准，先统一取osx的hhea字段，然后ascent做整体15%放大
    // https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/coretext/FontCoreText.cpp#L173
    helvetica: {
      lhr: 1.14990234375, // ((1577 + Round((1577 + 471) * 0.15)) + 471) / 2048
      blr: 0.919921875, // (1577 + Round((1577 + 471) * 0.15)) / 2048
    },
    verdana: {
      lhr: 1.21533203125, // (0+2059+430)/2048
      blr: 1.00537109375, // 2059/2048
    },
    tahoma: {
      lhr: 1.20703125, // (0+2049+423)/2048
      blr: 1.00048828125, // 2049/2048
    },
    georgia: {
      lhr: 1.13623046875, // (0+1878+449)/2048
      blr: 0.9169921875, // 1878/2048
    },
    'courier new': {
      lhr: 1.1328125, // (0+1705+615)/2048
      blr: 0.83251953125, // 1705/2048
    },
    'pingfang sc': {
      lhr: 1.4, // (0+1060+340)/1000
      blr: 1.06, // 1060/1000
    },
    simsun: {
      lhr: 1.4, // (0+1060+340)/1000
      blr: 1.06,
    },
    dinpro: {
      lhr: 1.288, // (10+1041+237)/1000
      blr: 1.041, // 1041/1000
      lgr: 0.01, // 10/1000
    },
  },
  hasRegister(fontFamily: string) {
    return this.info.hasOwnProperty(fontFamily) && this.info[fontFamily].hasOwnProperty('lhr');
  },
  hasLoaded(fontFamily: string) {
    return this.info.hasOwnProperty(fontFamily) && this.info[fontFamily].success;
  },
};

o.info['宋体'] = o.info.simsun;
[
  'pingfang',
  'pingfangsc',
  'pingfangsc-ultralight', // 极细
  'pingfangsc-medium', // 中黑
  'pingfangsc-regular', // 常规
  'pingfangsc-semibold', // 中粗
  'pingfangsc-bold', // 粗
  'pingfangsc-thin', // 细
  'pingfangsc-light', // 纤细
].forEach(k => {
  o.info[k] = o.info['pingfang sc'];
});
[
  'dinpro-medium', // 中黑
  'dinpro-regular', // 常规
  'dinpro-semibold', // 中粗
  'dinpro-bold', // 粗
  'dinpro-thin', // 细
  'dinpro-light', // 纤细
].forEach(k => {
  o.info[k] = o.info['dinpro'];
});

export default o;
