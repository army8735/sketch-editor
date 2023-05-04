import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import JSZip from 'jszip';
import { calNormalLineHeight, color2hexStr } from '../style/css';
import {
  JArtBoard,
  JBitmap,
  JFile,
  JGroup,
  JNode,
  JPage,
  JPolyline,
  JShapeGroup,
  JText,
  Point,
  Rich,
  TagName,
} from './';

// prettier-ignore
enum ResizingConstraint {
  UNSET =  0b111111,
  RIGHT =  0b000001, // 1
  WIDTH =  0b000010, // 2
  LEFT =   0b000100, // 4
  BOTTOM = 0b001000, // 8
  HEIGHT = 0b010000, // 16
  TOP =    0b100000, // 32
}

// const subFontFamilyReg = /-(Regular|Medium|Semibold|Bold|Thin|Normal|Light|Lighter)/ig;

export async function openAndConvertSketchBuffer(arrayBuffer: ArrayBuffer) {
  let zipFile: JSZip;
  try {
    zipFile = await JSZip.loadAsync(arrayBuffer);
  } catch (err) {
    alert(
      'Sorry!\nThis is not a zip file. It may be created by an old version sketch app.',
    );
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
  return await convertSketch(
    {
      document,
      pages,
      meta,
      user,
    },
    zipFile,
  );
}

async function readJsonFile(zipFile: JSZip, filename: string) {
  const docStr = await zipFile.file(filename)?.async('string');
  return JSON.parse(docStr!);
}

type Opt = {
  imgs: Array<string>;
  imgHash: any;
  fonts: Array<{ fontFamily: string; url: string }>;
  fontHash: any;
  zipFile: JSZip;
  user: any;
};

export async function convertSketch(json: any, zipFile: JSZip): Promise<JFile> {
  console.log('sketch', json);
  const imgs: Array<string> = [],
    imgHash: any = {};
  const fonts: Array<{ fontFamily: string; url: string }> = [],
    fontHash: any = {};
  const pages = await Promise.all(
    json.pages.map((page: SketchFormat.Page) => {
      return convertPage(page, {
        imgs,
        imgHash,
        fonts,
        fontHash,
        zipFile,
        user: json.user,
      });
    }),
  );
  return {
    pages,
    imgs,
    fonts: [],
  };
}

async function convertPage(page: SketchFormat.Page, opt: Opt): Promise<JPage> {
  // sketch的Page没有尺寸，固定100
  const W = 100,
    H = 100;
  const children = await Promise.all(
    page.layers.map((layer: SketchFormat.AnyLayer) => {
      return convertItem(layer, opt, W, H);
    }),
  );
  let x = 0,
    y = 0,
    zoom = 1;
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
    tagName: TagName.Page,
    props: {
      uuid: page.do_objectID,
      name: page.name,
      style: {
        width: W,
        height: H,
        visible: false,
        translateX: x,
        translateY: y,
        scaleX: zoom,
        scaleY: zoom,
        transformOrigin: [0, 0],
        pointerEvents: false,
      },
      isLocked: false,
      isExpanded: false,
    },
    children: children.filter((item) => item),
  } as JPage;
}

async function convertItem(
  layer: SketchFormat.AnyLayer,
  opt: Opt,
  w: number,
  h: number,
): Promise<JNode | undefined> {
  let width: number | string = layer.frame.width;
  let height: number | string = layer.frame.height;
  let translateX: number | string = layer.frame.x;
  let translateY: number | string = layer.frame.y;
  const visible = layer.isVisible;
  const opacity = layer.style?.contextSettings?.opacity || 1;
  const rotateZ = -layer.rotation;
  const scaleX = layer.isFlippedHorizontal ? -1 : 1;
  const scaleY = layer.isFlippedVertical ? -1 : 1;
  // artBoard也是固定尺寸和page一样，但x/y用translate代替
  if (layer._class === SketchFormat.ClassValue.Artboard) {
    const children = await Promise.all(
      layer.layers.map((child: SketchFormat.AnyLayer) => {
        return convertItem(child, opt, layer.frame.width, layer.frame.height);
      }),
    );
    const hasBackgroundColor = layer.hasBackgroundColor;
    const backgroundColor = hasBackgroundColor
      ? [
        Math.floor(layer.backgroundColor.red * 255),
        Math.floor(layer.backgroundColor.green * 255),
        Math.floor(layer.backgroundColor.blue * 255),
        layer.backgroundColor.alpha,
      ]
      : [255, 255, 255, 1];
    return {
      tagName: TagName.ArtBoard,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
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
        isLocked: false,
        isExpanded: false,
      },
      children: children.filter((item) => item),
    } as JArtBoard;
  }
  // 其它子元素都有布局规则约束，需模拟计算出类似css的absolute定位
  const resizingConstraint =
    layer.resizingConstraint ^ ResizingConstraint.UNSET;
  let left: number | string = 0,
    top: number | string = 0,
    right: number | string = 'auto',
    bottom: number | string = 'auto';
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
      right = ((w - translateX - width) * 100) / w + '%';
      width = 'auto';
    }
    translateX = 0;
  }
  // right
  else if (resizingConstraint & ResizingConstraint.RIGHT) {
    right = w - translateX - width;
    // right+width
    if (resizingConstraint & ResizingConstraint.WIDTH) {
      left = 'auto';
    }
    // 仅right，left是百分比忽略width
    else {
      left = (translateX * 100) / w + '%';
      width = 'auto';
    }
    translateX = 0;
  }
  // 左右都不固定
  else {
    // 仅固定宽度，以中心点占left的百分比
    if (resizingConstraint & ResizingConstraint.WIDTH) {
      left = ((translateX + width * 0.5) * 100) / w + '%';
      translateX = '-50%';
    }
    // 左右皆为百分比
    else {
      left = (translateX * 100) / w + '%';
      right = ((w - translateX - width) * 100) / w + '%';
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
      bottom = ((h - translateY - height) * 100) / h + '%';
      height = 'auto';
    }
    translateY = 0;
  }
  // bottom
  else if (resizingConstraint & ResizingConstraint.BOTTOM) {
    bottom = h - translateY - height;
    // bottom+height
    if (resizingConstraint & ResizingConstraint.HEIGHT) {
      top = 'auto';
    }
    // 仅bottom，top是百分比忽略height
    else {
      top = (translateY * 100) / h + '%';
      height = 'auto';
    }
    translateY = 0;
  }
  // 上下都不固定
  else {
    // 仅固定高度，以中心点占top的百分比
    if (resizingConstraint & ResizingConstraint.HEIGHT) {
      top = ((translateY + height * 0.5) * 100) / h + '%';
      translateY = '-50%';
    }
    // 上下皆为百分比
    else {
      top = (translateY * 100) / h + '%';
      bottom = ((h - translateY - height) * 100) / h + '%';
      translateY = 0;
      height = 'auto';
    }
  }
  // 遮罩转换
  let maskMode = 'none';
  const { hasClippingMask, clippingMaskMode } = layer;
  if (hasClippingMask) {
    if (clippingMaskMode) {
      maskMode = 'alpha';
    } else {
      maskMode = 'outline';
    }
  }
  const breakMask = layer.shouldBreakMaskChain;
  const isLocked = layer.isLocked;
  const isExpanded =
    layer.layerListExpandedType === SketchFormat.LayerListExpanded.Expanded;
  if (layer._class === SketchFormat.ClassValue.Group) {
    const children = await Promise.all(
      layer.layers.map((child: SketchFormat.AnyLayer) => {
        return convertItem(child, opt, layer.frame.width, layer.frame.height);
      }),
    );
    return {
      tagName: TagName.Group,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
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
          scaleX,
          scaleY,
          rotateZ,
          maskMode,
          breakMask,
        },
        isLocked,
        isExpanded,
      },
      children: children.filter((item) => item),
    } as JGroup;
  }
  if (layer._class === SketchFormat.ClassValue.Bitmap) {
    let index;
    if (layer.image._ref_class === 'MSImageData') {
      index = await readImageFile(layer.image._ref, opt);
    } else if ((layer.image._ref_class as any) === 'MSNetworkImage') {
      index = await readNetworkImage(layer.image._ref, opt);
    }
    return {
      tagName: TagName.Bitmap,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
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
          scaleX,
          scaleY,
          rotateZ,
          maskMode,
          breakMask,
        },
        isLocked,
        isExpanded,
        src: index,
      },
    } as JBitmap;
  }
  if (layer._class === SketchFormat.ClassValue.Text) {
    const textBehaviour = layer.textBehaviour;
    if (textBehaviour === SketchFormat.TextBehaviour.Flexible) {
      width = 'auto';
      height = 'auto';
    } else if (textBehaviour === SketchFormat.TextBehaviour.Fixed) {
      // 可能width是auto（left+right），也可能是left+width
      height = 'auto';
    } else if (
      textBehaviour === SketchFormat.TextBehaviour.FixedWidthAndHeight
    ) {
      // 啥也不干
    }
    const { string, attributes } = layer.attributedString;
    const rich = attributes.length
      ? attributes.map((item: any) => {
        const {
          location,
          length,
          attributes: {
            MSAttributedStringFontAttribute: {
              attributes: { name, size: fontSize },
            },
            MSAttributedStringColorAttribute: { red, green, blue, alpha },
            kerning = 0,
            paragraphStyle: { maximumLineHeight = 0 } = {},
          },
        } = item;
        const fontFamily = name;
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
      })
      : undefined;
    const MSAttributedStringFontAttribute =
      layer.style?.textStyle?.encodedAttributes?.MSAttributedStringFontAttribute
        ?.attributes;
    const fontSize = MSAttributedStringFontAttribute
      ? MSAttributedStringFontAttribute.size
      : 16;
    const fontFamily = MSAttributedStringFontAttribute
      ? MSAttributedStringFontAttribute.name
      : 'arial';
    const paragraphStyle =
      layer.style?.textStyle?.encodedAttributes?.paragraphStyle;
    const alignment = paragraphStyle?.alignment;
    const lineHeight = paragraphStyle?.maximumLineHeight || 'normal';
    const textAlign = ['left', 'right', 'center', 'justify'][alignment || 0];
    const letterSpacing =
      layer.style?.textStyle?.encodedAttributes?.kerning || 0;
    const MSAttributedStringColorAttribute =
      layer.style?.textStyle?.encodedAttributes
        ?.MSAttributedStringColorAttribute;
    const color = MSAttributedStringColorAttribute
      ? [
        Math.floor(MSAttributedStringColorAttribute.red * 255),
        Math.floor(MSAttributedStringColorAttribute.green * 255),
        Math.floor(MSAttributedStringColorAttribute.blue * 255),
        MSAttributedStringColorAttribute.alpha,
      ]
      : [0, 0, 0, 1];
    return {
      tagName: TagName.Text,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
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
          scaleX,
          scaleY,
          rotateZ,
          overflow: 'hidden',
          fontSize,
          fontFamily,
          color,
          textAlign,
          letterSpacing,
          lineHeight,
          maskMode,
          breakMask,
        },
        isLocked,
        isExpanded,
        content: string,
        rich,
      },
    } as JText;
  }
  if (
    layer._class === SketchFormat.ClassValue.Rectangle ||
    layer._class === SketchFormat.ClassValue.Oval ||
    layer._class === SketchFormat.ClassValue.Star ||
    layer._class === SketchFormat.ClassValue.Triangle ||
    layer._class === SketchFormat.ClassValue.Polygon ||
    layer._class === SketchFormat.ClassValue.ShapePath
  ) {
    const points: Array<Point> = layer.points.map((item: any) => {
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
    const {
      fill,
      fillEnable,
      fillRule,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
    } = geomStyle(layer);
    return {
      tagName: TagName.Polyline,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        points,
        isClosed: layer.isClosed,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          fill,
          fillEnable,
          fillRule,
          stroke,
          strokeEnable,
          strokeWidth,
          strokePosition,
          strokeDasharray,
          strokeLinecap,
          strokeLinejoin,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          booleanOperation:
            ['union', 'subtract', 'intersect', 'xor'][layer.booleanOperation] ||
            'none',
          maskMode,
          breakMask,
        },
        isLocked,
        isExpanded,
      },
    } as JPolyline;
  }
  if (layer._class === SketchFormat.ClassValue.ShapeGroup) {
    const {
      fill,
      fillEnable,
      fillRule,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
    } = geomStyle(layer);
    const children = await Promise.all(
      layer.layers.map((child: SketchFormat.AnyLayer) => {
        return convertItem(child, opt, layer.frame.width, layer.frame.height);
      }),
    );
    return {
      tagName: TagName.ShapeGroup,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visible,
          opacity,
          fill,
          fillEnable,
          fillRule,
          stroke,
          strokeEnable,
          strokeWidth,
          strokePosition,
          strokeDasharray,
          strokeLinecap,
          strokeLinejoin,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          booleanOperation:
            ['union', 'subtract', 'intersect', 'xor'][layer.booleanOperation] ||
            'none',
          maskMode,
          breakMask,
        },
        isLocked,
        isExpanded,
      },
      children,
    } as JShapeGroup;
  }
  console.error(layer);
}

function geomStyle(layer: SketchFormat.AnyLayer) {
  const {
    borders,
    borderOptions,
    fills,
    windingRule,
    miterLimit: strokeMiterlimit,
  } = layer.style || {};
  const fill: Array<string | Array<number>> = [],
    fillEnable: Array<boolean> = [];
  if (fills) {
    fills.forEach((item: SketchFormat.Fill) => {
      if (item.fillType === SketchFormat.FillType.Gradient) {
        const g = item.gradient;
        const from = parseStrPoint(g.from);
        const to = parseStrPoint(g.to);
        const stops = g.stops.map((item) => {
          const color = color2hexStr([
            Math.floor(item.color.red * 255),
            Math.floor(item.color.green * 255),
            Math.floor(item.color.blue * 255),
            item.color.alpha,
          ]);
          return color + ' ' + item.position * 100 + '%';
        });
        if (g.gradientType === SketchFormat.GradientType.Linear) {
          fill.push(
            `linearGradient(${from.x} ${from.y} ${to.x} ${to.y},${stops.join(
              ',',
            )})`,
          );
        } else if (g.gradientType === SketchFormat.GradientType.Radial) {
          const ellipseLength = g.elipseLength;
          fill.push(
            `radialGradient(${from.x} ${from.y} ${to.x} ${
              to.y
            } ${ellipseLength},${stops.join(',')})`,
          );
        } else if (g.gradientType === SketchFormat.GradientType.Angular) {
        } else {
          throw new Error('Unknown gradient');
        }
      } else {
        fill.push([
          Math.floor(item.color.red * 255),
          Math.floor(item.color.green * 255),
          Math.floor(item.color.blue * 255),
          item.color.alpha,
        ]);
      }
      fillEnable.push(item.isEnabled);
    });
  }
  const stroke: Array<Array<number>> = [],
    strokeEnable: Array<boolean> = [],
    strokeWidth: Array<number> = [],
    strokePosition: Array<string> = [];
  if (borders) {
    borders.forEach((item: SketchFormat.Border) => {
      stroke.push([
        Math.floor(item.color.red * 255),
        Math.floor(item.color.green * 255),
        Math.floor(item.color.blue * 255),
        item.color.alpha,
      ]);
      strokeEnable.push(item.isEnabled);
      strokeWidth.push(item.thickness || 0);
      if (item.position === SketchFormat.BorderPosition.Inside) {
        strokePosition.push('inside');
      } else if (item.position === SketchFormat.BorderPosition.Outside) {
        strokePosition.push('outside');
      } else {
        strokePosition.push('center');
      }
    });
  }
  const strokeDasharray: Array<number> = [];
  let strokeLinecap = 'butt',
    strokeLinejoin = 'miter';
  if (borderOptions) {
    borderOptions.dashPattern.forEach((item) => {
      strokeDasharray.push(item);
    });
    if (borderOptions.lineCapStyle === SketchFormat.LineCapStyle.Round) {
      strokeLinecap = 'round';
    } else if (
      borderOptions.lineCapStyle === SketchFormat.LineCapStyle.Projecting
    ) {
      strokeLinecap = 'square';
    }
    if (borderOptions.lineJoinStyle === SketchFormat.LineJoinStyle.Round) {
      strokeLinejoin = 'round';
    } else if (
      borderOptions.lineJoinStyle === SketchFormat.LineJoinStyle.Bevel
    ) {
      strokeLinejoin = 'bevel';
    }
  }
  return {
    fill,
    fillEnable,
    fillRule: windingRule,
    stroke,
    strokeEnable,
    strokeWidth,
    strokePosition,
    strokeDasharray,
    strokeLinecap,
    strokeLinejoin,
    strokeMiterlimit,
  };
}

function parseStrPoint(s: string) {
  const res = /{(.+),\s*(.+)}/.exec(s);
  if (!res) {
    throw new Error('Unknown point: ' + s);
  }
  return { x: parseFloat(res[1]), y: parseFloat(res[2]) };
}

async function readNetworkImage(src: string, opt: Opt) {
  if (opt.imgHash.hasOwnProperty(src)) {
    return opt.imgHash[src];
  }
  const index = opt.imgs.length;
  opt.imgs.push(src);
  return index;
}

async function readImageFile(filename: string, opt: Opt) {
  if (!/\.\w+$/.test(filename)) {
    filename = `${filename}.png`;
  }
  if (opt.imgHash.hasOwnProperty(filename)) {
    return opt.imgHash[filename];
  }
  const file = opt.zipFile.file(filename);
  if (!file) {
    console.error(`image not exist: >>>${filename}<<<`);
    return -1;
  }
  let base64 = await file.async('base64');
  if (!/^data:image\//.test(base64)) {
    if (filename.endsWith('.png')) {
      base64 = 'data:image/png;base64,' + base64;
    } else if (filename.endsWith('.gif')) {
      base64 = 'data:image/gif;base64,' + base64;
    } else if (filename.endsWith('.jpg')) {
      base64 = 'data:image/jpg;base64,' + base64;
    } else if (filename.endsWith('.jpeg')) {
      base64 = 'data:image/jpeg;base64,' + base64;
    } else if (filename.endsWith('.webp')) {
      base64 = 'data:image/webp;base64,' + base64;
    } else if (filename.endsWith('.bmp')) {
      base64 = 'data:image/bmp;base64,' + base64;
    }
  }
  const index = opt.imgs.length;
  opt.imgs.push(base64);
  return index;
}
