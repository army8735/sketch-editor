import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import {
  JNode,
  JFile,
  JPage,
  JArtBoard,
  JGroup,
  JBitmap,
  JText,
  JPolyline,
  classValue,
  Rich,
} from './';
import { calNormalLineHeight } from '../style/css';

enum ResizingConstraint {
  UNSET =  0b111111,
  RIGHT =  0b000001,
  WIDTH =  0b000010,
  LEFT =   0b000100,
  BOTTOM = 0b001000,
  HEIGHT = 0b010000,
  TOP =    0b100000,
}

const subFontFamilyReg = /-(Regular|Medium|Semibold|Bold|Thin|Normal|Light|Lighter)/ig;

export async function openAndConvertSketchBuffer(arrayBuffer: ArrayBuffer) {
  let zipFile: JSZip;
  try {
    zipFile = await JSZip.loadAsync(arrayBuffer);
  } catch (err) {
    alert('Sorry!\nThis is not a zip file. It may be created by an old version sketch app.');
    throw err;
  }
  const document: SketchFormat.Document = await readJsonFile(
    zipFile,
    'document.json',
  );
  const pages: SketchFormat.Page[] = [];
  await Promise.all(
    document.pages.map((page: { _ref: string }) => {
      return readJsonFile(zipFile, page._ref + '.json').then((pageJson) => {
        pages.push(pageJson);
      });
    }),
  );
  const meta = await readJsonFile(zipFile, 'meta.json');
  const user = await readJsonFile(zipFile, 'user.json');
  return await convertSketch({
    document,
    pages,
    meta,
    user,
  }, zipFile);
}

async function readJsonFile(zipFile: JSZip, filename: string) {
  const docStr = await zipFile.file(filename)?.async('string');
  return JSON.parse(docStr!);
}

type Opt = {
  imgs: Array<string>,
  imgHash: any;
  fonts: Array<{ fontFamily: string, url: string }>,
  fontHash: any,
  zipFile: JSZip,
  user: any,
}

async function convertSketch(json: any, zipFile: JSZip): Promise<JFile> {
  console.log('sketch', json);
  const imgs: Array<string> = [], imgHash: any = {};
  const fonts: Array<{ fontFamily: string, url: string }> = [], fontHash: any = {};
  const pages = await Promise.all(
    json.pages.map((page: any) => {
      return convertPage(page, {
        imgs,
        imgHash,
        fonts,
        fontHash,
        zipFile,
        user: json.user,
      });
    })
  );
  return {
    pages,
    imgs,
    fonts: [],
  };
}

async function convertPage(page: any, opt: Opt): Promise<JPage> {
  const children = await Promise.all(
    page.layers.map((layer: any) => {
      return convertItem(layer, opt, page.frame.width, page.frame.height);
    })
  );
  let x = 0, y = 0, zoom = 1;
  const ua = opt.user[page.do_objectID];
  if (ua) {
    const { scrollOrigin, zoomValue } = ua;
    if (scrollOrigin) {
      const match = /\{(\d+),\s*(\d+)\}/.exec(scrollOrigin);
      if (match) {
        x = parseFloat(match[1]) || 0;
        y = parseFloat(match[2]) || 0;
      }
    }
    if (zoomValue) {
      zoom = zoomValue;
    }
  }
  return {
    type: classValue.Page,
    props: {
      name: page.name,
      uuid: page.do_objectID,
      style: {
        left: page.frame.x, // sketch的page的位置尺寸固定为0
        top: page.frame.y,
        width: page.frame.width,
        height: page.frame.height,
        visible: false,
        translateX: x,
        translateY: y,
        scaleX: zoom,
        scaleY: zoom,
        transformOrigin: [0, 0],
        pointerEvents: false,
      },
    },
    children,
  } as JPage;
}

async function convertItem(layer: any, opt: Opt, w: number, h: number): Promise<JNode | undefined> {
  let width = layer.frame.width;
  let height = layer.frame.height;
  let translateX = layer.frame.x;
  let translateY = layer.frame.y;
  let visible = layer.isVisible;
  let opacity = layer.style.contextSettings.opacity;
  let rotateZ = -layer.rotation;
  // artBoard也是固定尺寸和page一样，但x/y用translate代替
  if (layer._class === SketchFormat.ClassValue.Artboard) {
    const children = await Promise.all(
      layer.layers.map((child: any) => {
        return convertItem(child, opt, layer.frame.width, layer.frame.height);
      })
    );
    const hasBackgroundColor = layer.hasBackgroundColor;
    const backgroundColor = hasBackgroundColor ? [
      Math.floor(layer.backgroundColor.r * 255),
      Math.floor(layer.backgroundColor.g * 255),
      Math.floor(layer.backgroundColor.b * 255),
      layer.backgroundColor.a,
    ] : [255, 255, 255, 1];
    return {
      type: classValue.ArtBoard,
      props: {
        name: layer.name,
        uuid: layer.do_objectID,
        hasBackgroundColor,
        resizesContent: layer.resizesContent,
        style: {
          width, // 画板始终相对于page的原点，没有百分比单位
          height,
          visible,
          opacity,
          translateX,
          translateY,
          rotateZ,
          overflow: 'hidden',
          backgroundColor,
        },
      },
      children,
    } as JArtBoard;
  }
  // 其它子元素都有布局规则约束，需模拟计算出类似css的absolute定位
  const resizingConstraint = layer.resizingConstraint ^ ResizingConstraint.UNSET;
  let left: number | string = 0,
    top: number | string = 0,
    right: number | string = 'auto',
    bottom: number | string = 'auto';
  // 需根据父容器尺寸计算
  if (resizingConstraint) {
    // left
    if (resizingConstraint & ResizingConstraint.LEFT) {
      left = translateX;
      // left+right忽略width
      if (resizingConstraint & ResizingConstraint.RIGHT) {
        right = w - translateX - width;
        width = 'auto';
      }
      // left+width
      else if (resizingConstraint & ResizingConstraint.WIDTH) {
        // 默认right就是auto啥也不做
      }
      // 仅left，right是百分比忽略width
      else {
        right = (w - translateX - width) * 100 / w + '%';
        width = 'auto';
      }
      translateX = 0;
    }
    // right
    else if (resizingConstraint & ResizingConstraint.RIGHT) {
      right = w - translateX - width;
      // left+right忽略width
      if (resizingConstraint & ResizingConstraint.LEFT) {
        left = translateX;
        width = 'auto';
      }
      // right+width
      else if (resizingConstraint & ResizingConstraint.WIDTH) {
        left = 'auto';
      }
      // 仅right，left是百分比忽略width
      else {
        left = translateX * 100 / w + '%';
        width = 'auto';
      }
      translateX = 0;
    }
    // 左右都不固定
    else {
      // 仅固定宽度，以中心点占left的百分比
      if (resizingConstraint & ResizingConstraint.WIDTH) {
        left = (translateX + width * 0.5) * 100 / w + '%';
        translateX = '-50%';
      }
      // 左右皆为百分比
      else {
        left = translateX * 100 / w + '%';
        right = (w - translateX - width) * 100 / w + '%';
        translateX = 0;
        width = 'auto';
      }
    }
    // top
    if (resizingConstraint & ResizingConstraint.TOP) {
      top = translateY;
      // top+bottom忽略height
      if (resizingConstraint & ResizingConstraint.BOTTOM) {
        bottom = h - translateY - height;
        height = 'auto';
      }
      // top+height
      else if (resizingConstraint & ResizingConstraint.HEIGHT) {
        // 默认啥也不做
      }
      // 仅top，bottom是百分比忽略height
      else {
        bottom = (h - translateY - height) * 100 / h + '%';
        height = 'auto';
      }
      translateY = 0;
    }
    // bottom
    else if (resizingConstraint & ResizingConstraint.BOTTOM) {
      bottom = h - translateY - height;
      // top+bottom忽略height
      if (resizingConstraint & ResizingConstraint.TOP) {
        top = translateY
        height = 'auto';
      }
      // bottom+height
      else if (resizingConstraint & ResizingConstraint.HEIGHT) {
        top = 'auto';
      }
      // 仅bottom，top是百分比忽略height
      else {
        top = translateY * 100 / h + '%';
        height = 'auto';
      }
      translateY = 0;
    }
    // 上下都不固定
    else {
      // 仅固定高度，以中心点占top的百分比
      if (resizingConstraint & ResizingConstraint.HEIGHT) {
        top = (translateY + height * 0.5) * 100 / h + '%';
        translateY = '-50%';
      }
      // 上下皆为百分比
      else {
        top = translateY * 100 / h + '%';
        bottom = (h - translateY - height) * 100 / h + '%';
        translateY = 0;
        height = 'auto';
      }
    }
  }
  // 未设置则上下左右都是百分比
  else {
    left = translateX * 100 / w + '%';
    right = (w - translateX - width) * 100 / w + '%';
    translateX = 0;
    width = 'auto';
    top = translateY * 100 / h + '%';
    bottom = (h - translateY - height) * 100 / h + '%';
    translateY = 0;
    height = 'auto';
  }
  if (layer._class === SketchFormat.ClassValue.Group) {
    const children = await Promise.all(
      layer.layers.map((child: any) => {
        return convertItem(child, opt, layer.frame.width, layer.frame.height);
      })
    );
    return {
      type: classValue.Group,
      props: {
        name: layer.name,
        uuid: layer.do_objectID,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          translateX,
          translateY,
          rotateZ,
        },
      },
      children,
    } as JGroup;
  }
  if (layer._class === SketchFormat.ClassValue.Bitmap) {
    const index = await readImageFile(layer.image._ref, opt);
    return {
      type: classValue.Bitmap,
      props: {
        name: layer.name,
        uuid: layer.do_objectID,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          translateX,
          translateY,
          rotateZ,
        },
        src: index,
      },
    } as JBitmap;
  }
  if (layer._class === SketchFormat.ClassValue.Text) {
    const textBehaviour = layer.textBehaviour;
    if (textBehaviour === SketchFormat.TextBehaviour.Flexible) {
      width = 'auto';
      height = 'auto';
    }
    else if (textBehaviour === SketchFormat.TextBehaviour.Fixed) {
      // 可能width是auto（left+right），也可能是left+width
      height = 'auto';
    }
    else if (textBehaviour === SketchFormat.TextBehaviour.FixedWidthAndHeight) {
      // 啥也不干
    }
    const { string, attributes } = layer.attributedString;
    const rich = attributes.length ? attributes.map((item: any) => {
      const {
        location,
        length,
        attributes: {
          MSAttributedStringFontAttribute: { attributes: { name, size: fontSize, } },
          MSAttributedStringColorAttribute: { red, green, blue, alpha },
          kerning,
          paragraphStyle: { maximumLineHeight = 0 } = {},
        },
      } = item;
      const fontFamily = name.replace(subFontFamilyReg, '');
      const res = {
        location,
        length,
        fontFamily,
        fontSize,
        fontWeight: 400,
        fontStyle: 'normal',
        letterSpacing: kerning,
        lineHeight: maximumLineHeight,
        color: [
          Math.floor(red * 255),
          Math.floor(green * 255),
          Math.floor(blue * 255),
          alpha,
        ],
      } as Rich;
      // 自动行高
      if (!maximumLineHeight) {
        res.lineHeight = calNormalLineHeight(res);
      }
      return res;
    }) : undefined;
    const MSAttributedStringFontAttribute = layer.style?.textStyle?.encodedAttributes?.MSAttributedStringFontAttribute?.attributes;
    const fontSize = MSAttributedStringFontAttribute ? MSAttributedStringFontAttribute.size : undefined;
    const fontFamily = MSAttributedStringFontAttribute ? MSAttributedStringFontAttribute.name.replace(subFontFamilyReg, '') : undefined;
    const paragraphStyle = layer.style?.textStyle?.encodedAttributes?.paragraphStyle;
    const alignment = paragraphStyle?.alignment;
    const lineHeight = paragraphStyle?.maximumLineHeight;
    const textAlign = ['left', 'center', 'right', 'justify'][alignment || 0];
    const letterSpacing = layer.style?.textStyle?.encodedAttributes?.kerning;
    const MSAttributedStringColorAttribute = layer.style?.textStyle?.encodedAttributes?.MSAttributedStringColorAttribute;
    const color = MSAttributedStringColorAttribute ? [
      Math.floor(MSAttributedStringColorAttribute.red * 255),
      Math.floor(MSAttributedStringColorAttribute.green * 255),
      Math.floor(MSAttributedStringColorAttribute.blue * 255),
      MSAttributedStringColorAttribute.alpha,
    ] : undefined;
    return {
      type: classValue.Text,
      props: {
        name: layer.name,
        uuid: layer.do_objectID,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          translateX,
          translateY,
          rotateZ,
          overflow: 'hidden',
          fontSize,
          fontFamily,
          color,
          textAlign,
          letterSpacing,
          lineHeight,
        },
        content: string,
        rich,
      },
    } as JText;
  }
  if (layer._class === SketchFormat.ClassValue.Rectangle) {
    const points = layer.points.map((item: any) => {
      const point = parseStrPoint(item.point);
      const curveFrom = parseStrPoint(item.curveFrom);
      const curveTo = parseStrPoint(item.curveTo);
      return {
        x: point.x,
        y: point.y,
        cornerRadius: item.cornerRadius,
        curveMode: item.curveMode,
        hasCurveFrom: item.hasCurveFrom,
        hasCurveTo: item.hasCurveTo,
        fx: curveFrom.x,
        fy: curveFrom.y,
        tx: curveTo.x,
        ty: curveTo.y,
      };
    });
    return {
      type: classValue.Polyline,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        points,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          translateX,
          translateY,
          rotateZ,
        },
      },
    } as JPolyline;
  }
  else {
    console.error(layer);
  }
}

function parseStrPoint(s: string) {
  const res = /{(.+),\s*(.+)}/.exec(s);
  if (!res) {
    throw new Error('Unknown point: ' + s);
  }
  return { x: parseFloat(res[1]), y: parseFloat(res[2]) };
}

async function readImageFile(filename: string, opt: Opt) {
  if (!/\.\w+$/.test(filename)) {
    filename = `${ filename }.png`;
  }
  if (opt.imgHash.hasOwnProperty(filename)) {
    return opt.imgHash[filename];
  }
  const file = opt.zipFile.file(filename);
  if (!file) {
    console.error(`image not exist: >>>${ filename }<<<`);
    return -1;
  }
  let base64 = await file.async('base64');
  if (!/^data:image\//.test(base64)) {
    if (filename.endsWith('.png')) {
      base64 = 'data:image/png;base64,' + base64;
    }
    else if (filename.endsWith('.gif')) {
      base64 = 'data:image/gif;base64,' + base64;
    }
    else if (filename.endsWith('.jpg')) {
      base64 = 'data:image/jpg;base64,' + base64;
    }
    else if (filename.endsWith('.jpeg')) {
      base64 = 'data:image/jpeg;base64,' + base64;
    }
    else if (filename.endsWith('.webp')) {
      base64 = 'data:image/webp;base64,' + base64;
    }
    else if (filename.endsWith('.bmp')) {
      base64 = 'data:image/bmp;base64,' + base64;
    }
  }
  const index = opt.imgs.length;
  opt.imgs.push(base64);
  return index;
}
