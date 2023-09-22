export default {
  position: /(([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?[pxremvwhina%]*)|(left|top|right|bottom|center)){1,2}/ig,
  gradient: /\b(\w+)-?gradient\s*\((.+)\)/i,
  img: /(?:\burl\((['"]?)(.*?)\1\))|(?:\b((data:)))/i,
  blur: /(gauss|motion|radial|background)\s*\((.+)\)/i,
  color: /(?:#[a-f\d]{3,8})|(?:rgba?\s*\(.+?\))/i,
  number: /([-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[-+]?\d+)?)[pxremvwhina%]*/ig,
};
