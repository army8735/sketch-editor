import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import JSZip from 'jszip';
import { color2rgbaStr } from '../style/color';
import {
  ExportOptions,
  JArtBoard,
  JBitmap,
  JFile,
  JFrame,
  JGraphic,
  JGroup,
  JNode,
  JPage,
  JPoint,
  JPolyline,
  JRich,
  JShapeGroup,
  JSymbolInstance,
  JSymbolMaster,
  JText,
  Override,
  TAG_NAME,
  TextProps,
} from './';
import { PAGE_H, PAGE_W } from './dft';
import font from '../style/font';
import { r2d } from '../math/geom';
import reg from '../style/reg';
import inject from '../util/inject';

// prettier-ignore
export enum ResizingConstraint {
  UNSET  = 0b111111,
  RIGHT  = 0b000001, // 1
  WIDTH  = 0b000010, // 2
  LEFT   = 0b000100, // 4
  BOTTOM = 0b001000, // 8
  HEIGHT = 0b010000, // 16
  TOP    = 0b100000, // 32
}

export async function openAndConvertSketchBuffer(arrayBuffer: ArrayBuffer) {
  const zipFile = await JSZip.loadAsync(arrayBuffer);
  return openAndConvertSketchZip(zipFile);
}

export async function openAndConvertSketchZip(zipFile: JSZip) {
  const document: SketchFormat.Document = await readJsonFile(
    zipFile,
    'document.json',
  );
  const pages: SketchFormat.Page[] = [];
  if (document.pages) {
    for (let i = 0, len = document.pages.length; i < len; i++) {
      pages[i] = await readJsonFile(zipFile, document.pages[i]._ref + '.json');
    }
  }
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
  if (!docStr) {
    return {};
  }
  return JSON.parse(docStr);
}

type Opt = {
  zipFile?: JSZip;
  user: any;
  imgSrcRecord: Record<string, string>;
};

export async function convertSketch(json: any, zipFile?: JSZip): Promise<JFile> {
  // sketch自带的字体，有fontData的才算，没有的只是个使用声明；有可能这个字体本地已经有了，可以跳过
  const fontReferences = (json.document?.fontReferences || []).filter((item: SketchFormat.FontRef) => {
    if (!item.fontData || !item.fontData._ref) {
      return false;
    }
    const postscriptName = item.postscriptNames[0];
    if (postscriptName && font.hasRegister(postscriptName)) {
      return false;
    }
    return !!postscriptName;
  });
  if (fontReferences.length) {
    await Promise.all(
      fontReferences.map((item: SketchFormat.FontRef) => {
        if (item.fontData._ref_class === 'MSFontData' && zipFile) {
          return readFontFile(item.fontData._ref, zipFile);
        }
        else if ((item.fontData._ref_class as string) === 'MSNetFontData') {
          return readNetFont(item.fontData._ref, item.postscriptNames[0]);
        }
      })
    );
  }
  const opt: Opt = {
    zipFile,
    user: json.user,
    imgSrcRecord: {},
  };
  // 外部控件
  const symbolMasters: any[] = [];
  const foreignSymbols = json.document?.foreignSymbols || [];
  for (let i = 0, len = foreignSymbols.length; i < len; i++) {
    symbolMasters[i] = await convertItem(foreignSymbols[i].symbolMaster, (i + 1) / (len + 1), opt, PAGE_W, PAGE_H);
  }
  const pages: JPage[] = [];
  if (json.pages) {
    for (let i = 0, len = json.pages.length; i < len; i++) {
      pages[i] = await convertPage(json.pages[i], (i + 1) / (len + 1), opt);
    }
  }
  const document = json.document;
  return {
    document: {
      uuid: document.do_objectID,
      assets: {
        uuid: document.assets.do_objectID,
      },
      layerStyles: {
        uuid: document.layerStyles.do_objectID,
      },
      layerTextStyles: {
        uuid: document.layerTextStyles.do_objectID,
      },
    },
    pages,
    currentPageIndex: json.document?.currentPageIndex || 0,
    symbolMasters,
  } as JFile;
}

async function convertPage(page: SketchFormat.Page, index: number, opt: Opt): Promise<JPage> {
  let x = 0;
  let y = 0;
  let zoom = 1;
  const ua = opt.user[page.do_objectID];
  if (ua) {
    const { scrollOrigin, zoomValue } = ua;
    if (scrollOrigin) {
      const match = /\{([+-.\d]+),\s*([+-.\d]+)}/.exec(scrollOrigin);
      if (match) {
        x = parseFloat(match[1]) || 0;
        y = parseFloat(match[2]) || 0;
      }
    }
    if (zoomValue) {
      zoom = zoomValue;
    }
  }
  const dx = page.horizontalRulerData?.base || 0;
  const dy = page.verticalRulerData?.base || 0;
  const children: JNode[] = [];
  for (let i = 0, len = page.layers.length; i < len; i++) {
    const res = await convertItem(page.layers[i], (i + 1) / (len + 1), opt, PAGE_W, PAGE_H, dx, dy);
    if (res) {
      children.push(res);
    }
  }
  return {
    tagName: TAG_NAME.PAGE,
    props: {
      uuid: page.do_objectID,
      name: page.name,
      nameIsFixed: page.nameIsFixed,
      index,
      constrainProportions: page.frame.constrainProportions || false,
      style: {
        width: PAGE_W,
        height: PAGE_H,
        visibility: 'hidden',
        translateX: x + dx * zoom,
        translateY: y + dy * zoom,
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
  index: number,
  opt: Opt,
  w: number,
  h: number,
  dx = 0,
  dy = 0,
  inGraphic = false,
): Promise<JNode | undefined> {
  let width: number | string = layer.frame.width || 0.5;
  let height: number | string = layer.frame.height || 0.5;
  let translateX: number | string = layer.frame.x || 0;
  let translateY: number | string = layer.frame.y || 0;
  translateX -= dx;
  translateY -= dy;
  if (w < 0) {
    w = 0;
  }
  if (h < 0) {
    h = 0;
  }
  // sketch不会出现非正数，但人工可能修改，sketch对此做了兼容转换
  if (width < 0) {
    translateX += width;
    width = Math.abs(width);
  }
  if (height < 0) {
    translateY += height;
    height = Math.abs(height);
  }
  const visibility = layer.isVisible ? 'visible' : 'hidden';
  const opacity = layer.style?.contextSettings?.opacity ?? 1;
  const rotateZ = -layer.rotation;
  let scaleX = layer.isFlippedHorizontal ? -1 : 1;
  let scaleY = layer.isFlippedVertical ? -1 : 1;
  if (layer._class === SketchFormat.ClassValue.SymbolInstance && layer.scale && layer.scale !== 1) {
    // console.log(layer)
    // scaleX *= layer.scale;
    // scaleY *= layer.scale;
    // const w = width / layer.scale;
    // const h = height / layer.scale;
    // const dw = w - width;
    // const dh = h - height;
    // translateX -= dw * 0.5;
    // translateY -= dh * 0.5;
    // width = w;
    // height = h;
  }
  // 渲染无关的锁定/展开/固定宽高比
  const isLocked = layer.isLocked;
  const isExpanded =
    layer.layerListExpandedType === SketchFormat.LayerListExpanded.Expanded;
  const constrainProportions = layer.frame.constrainProportions;
  // 导出配置
  const exportOptions = {
    exportFormats: layer.exportOptions?.exportFormats?.map(item => {
      return {
        fileFormat: item.fileFormat || 'png',
        scale: item.scale || 1,
      };
    }) || [],
  } as ExportOptions;
  // artBoard也是固定尺寸和page一样，但x/y用translate代替，symbolMaster类似但多了symbolID
  if (layer._class === SketchFormat.ClassValue.Artboard || layer._class === SketchFormat.ClassValue.SymbolMaster) {
    const children: JNode[] = [];
    for (let i = 0, len = layer.layers?.length; i < len; i++) {
      const res = await convertItem(layer.layers[i], (i + 1) / (len + 1), opt, width as number, height as number);
      if (res) {
        children.push(res);
      }
    }
    const hasBackgroundColor = layer.hasBackgroundColor;
    const backgroundColor = hasBackgroundColor
      ? [
        Math.floor(layer.backgroundColor.red * 255),
        Math.floor(layer.backgroundColor.green * 255),
        Math.floor(layer.backgroundColor.blue * 255),
        layer.backgroundColor.alpha,
      ]
      : [255, 255, 255, 1];
    if (layer._class === SketchFormat.ClassValue.SymbolMaster) {
      const symbolId = layer.symbolID;
      const includeBackgroundColorInInstance = layer.includeBackgroundColorInInstance;
      return {
        tagName: TAG_NAME.SYMBOL_MASTER,
        props: {
          uuid: layer.do_objectID,
          name: layer.name,
          nameIsFixed: layer.nameIsFixed,
          constrainProportions,
          hasBackgroundColor,
          resizesContent: layer.resizesContent,
          symbolId,
          includeBackgroundColorInInstance,
          exportOptions,
          style: {
            width, // 画板始终相对于page的原点，没有百分比单位
            height,
            visibility,
            opacity,
            translateX,
            translateY,
            rotateZ,
            backgroundColor,
          },
          isLocked,
          isExpanded,
        },
        children: children.filter((item) => item),
      } as JSymbolMaster;
    }
    const includeBackgroundColorInExport = layer.includeBackgroundColorInExport;
    return {
      tagName: TAG_NAME.ART_BOARD,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        nameIsFixed: layer.nameIsFixed,
        constrainProportions,
        hasBackgroundColor,
        resizesContent: layer.resizesContent,
        includeBackgroundColorInExport,
        exportOptions,
        style: {
          width, // 画板始终相对于page的原点，没有百分比单位
          height,
          visibility,
          opacity,
          translateX,
          translateY,
          rotateZ,
          backgroundColor,
        },
        isLocked,
        isExpanded,
      },
      children: children.filter((item) => item),
    } as JArtBoard;
  }
  // 其它子元素都有布局规则约束，需模拟计算出类似css的absolute定位
  let left: number | string = 0;
  let top: number | string = 0;
  let right: number | string = 'auto';
  let bottom: number | string = 'auto';
  let resizingConstraint = layer.resizingConstraint ^ ResizingConstraint.UNSET;
  // 2025新版sketch的宽高位置，采用独立的4个变量来代替老的resizingConstraint
  // @ts-ignore
  const { horizontalPins, verticalPins, horizontalSizing, verticalSizing } = layer;
  let isVer2025 = false;
  if (horizontalPins !== undefined || verticalPins !== undefined || horizontalSizing !== undefined || verticalSizing !== undefined) {
    isVer2025 = true;
    resizingConstraint = 0;
    // 水平固定left+right是5，left是1，right是4，空是0
    if (horizontalPins === 5) {
      resizingConstraint |= ResizingConstraint.LEFT;
      resizingConstraint |= ResizingConstraint.RIGHT;
    }
    else if (horizontalPins === 4) {
      resizingConstraint |= ResizingConstraint.RIGHT;
    }
    else if (horizontalPins === 1) {
      resizingConstraint |= ResizingConstraint.LEFT;
    }
    if (verticalPins === 5) {
      resizingConstraint |= ResizingConstraint.TOP;
      resizingConstraint |= ResizingConstraint.BOTTOM;
    }
    else if (verticalPins === 4) {
      resizingConstraint |= ResizingConstraint.BOTTOM;
    }
    else if (horizontalPins === 1) {
      resizingConstraint |= ResizingConstraint.TOP;
    }
    // 尺寸0是固定，1是自适应（仅文字有），3是相对
    if (horizontalSizing === 0) {
      resizingConstraint |= ResizingConstraint.WIDTH;
    }
    if (verticalSizing === 0) {
      resizingConstraint |= ResizingConstraint.HEIGHT;
    }
    // 新版Graphic的子节点强制left+right百分比，但Text特殊有固定尺寸，会在后面自己判断
    if (inGraphic) {
      resizingConstraint = 0;
    }
  }
  // left
  if (resizingConstraint & ResizingConstraint.LEFT) {
    left = translateX;
    // left+right忽略width
    if (resizingConstraint & ResizingConstraint.RIGHT) {
      right = w - translateX - width;
      width = 'auto';
    }
    // left+width，默认right就是auto啥也不做
    else if (resizingConstraint & ResizingConstraint.WIDTH) {
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
    // top+height，bottom是auto
    else if (resizingConstraint & ResizingConstraint.HEIGHT) {
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
  // 兜底防止生成数据不合法
  if (!w || w < 0) {
    if (left !== 'auto') {
      left = '0%';
    }
    if (right !== 'auto') {
      right = '0%';
    }
  }
  if (!h || h < 0) {
    if (top !== 'auto') {
      top = '0%';
    }
    if (bottom !== 'auto') {
      bottom = '0%';
    }
  }
  // 遮罩转换
  let maskMode = 'none';
  const { hasClippingMask, clippingMaskMode } = layer;
  if (hasClippingMask) {
    if (clippingMaskMode) {
      maskMode = 'alpha';
    }
    else {
      maskMode = 'outline';
    }
  }
  const breakMask = layer.shouldBreakMaskChain;
  // 模糊，新版sketch从style.blur变成style.blurs数组
  let blur = 'none';
  // @ts-ignore
  if (layer.style && (layer.style.blur?.isEnabled || layer.style.blurs && layer.style.blurs.length && layer.style.blurs[0].isEnabled)) {
    // @ts-ignore
    const b = layer.style.blur?.isEnabled ? layer.style.blur : layer.style.blurs[0];
    const type = b.type;
    if (type === SketchFormat.BlurType.Gaussian) {
      blur = `gauss(${b.radius}px)`;
    }
    else if (type === SketchFormat.BlurType.Background) {
      blur = `background(${b.radius}px) saturation(${(b.saturation || 0) * 100}%)`;
    }
    else if (type === SketchFormat.BlurType.Zoom) {
      const center = b.center.match(reg.number) || ['0.5', '0.5'];
      const p = center.map((item: string) => {
        return parseFloat(item) * 100 + '%';
      });
      blur = `radial(${b.radius}px) center(${p[0]}, ${p[1]})`;
    }
    else if (type === SketchFormat.BlurType.Motion) {
      blur = `motion(${b.radius}px) angle(${(b.motionAngle || 0) * -1})`;
    }
  }
  // 颜色调整
  let hueRotate = 0;
  let saturate = 1;
  let brightness = 1;
  let contrast = 1;
  const colorControls = layer.style?.colorControls;
  if (colorControls && colorControls.isEnabled) {
    if (colorControls.hue) {
      hueRotate = r2d(colorControls.hue);
    }
    saturate = colorControls.saturation;
    if (colorControls.brightness) {
      brightness = colorControls.brightness + 1;
    }
    contrast = colorControls.contrast;
  }
  // 混合模式
  const blend = layer.style?.contextSettings?.blendMode;
  const mixBlendMode = getBlendMode(blend);
  // 阴影
  const shadow: string[] = [];
  const shadowEnable: boolean[] = [];
  const innerShadow: string[] = [];
  const innerShadowEnable: boolean[] = [];
  const shadows = layer.style?.shadows;
  if (shadows) {
    shadows.forEach((item) => {
      const color = [
        Math.floor(item.color.red * 255),
        Math.floor(item.color.green * 255),
        Math.floor(item.color.blue * 255),
        item.color.alpha,
      ];
      shadow.push(`${color2rgbaStr(color)} ${item.offsetX} ${item.offsetY} ${item.blurRadius} ${item.spread} `);
      shadowEnable.push(item.isEnabled);
    });
  }
  const innerShadows = layer.style?.innerShadows;
  if (innerShadows) {
    innerShadows.forEach((item) => {
      const color = [
        Math.floor(item.color.red * 255),
        Math.floor(item.color.green * 255),
        Math.floor(item.color.blue * 255),
        item.color.alpha,
      ];
      innerShadow.push(`${color2rgbaStr(color)} ${item.offsetX} ${item.offsetY} ${item.blurRadius} ${item.spread}`);
      innerShadowEnable.push(item.isEnabled);
    });
  }
  if (layer._class === SketchFormat.ClassValue.SymbolInstance) {
    const {
      fill,
      fillEnable,
      fillOpacity,
    } = await geomStyle(layer, opt);
    const overrideValues = await convertOverrideValues(layer.overrideValues, opt);
    return {
      tagName: TAG_NAME.SYMBOL_INSTANCE,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        nameIsFixed: layer.nameIsFixed,
        index,
        constrainProportions,
        symbolId: layer.symbolID,
        scale: layer.scale,
        overrideValues,
        exportOptions,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visibility,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
        },
        isLocked,
        isExpanded,
      },
    } as JSymbolInstance;
  }
  if (layer._class === SketchFormat.ClassValue.Group) {
    // @ts-ignore
    const groupBehavior = layer.groupBehavior;
    const children: JNode[] = [];
    for (let i = 0, len = layer.layers?.length; i < len; i++) {
      const res = await convertItem(layer.layers[i], (i + 1) / (len + 1), opt, layer.frame.width, layer.frame.height, 0, 0, groupBehavior === 2);
      if (res) {
        children.push(res);
      }
    }
    const {
      fill,
      fillEnable,
      fillOpacity,
      fillMode,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
    } = await geomStyle(layer, opt);
    if (groupBehavior === 1 || groupBehavior === 2) {
      // @ts-ignore
      const includeBackgroundColorInExport = layer.includeBackgroundColorInExport;
      // @ts-ignore
      const clippingBehavior = layer.clippingBehavior;
      // @ts-ignore
      const corners = layer.style?.corners;
      let borderTopLeftRadius = 0;
      let borderTopRightRadius = 0;
      let borderBottomLeftRadius = 0;
      let borderBottomRightRadius = 0;
      if (corners && (corners.style === 0 || corners.style === 1) && Array.isArray(corners.radii)) {
        borderTopLeftRadius = corners.radii[0] || 0;
        if (corners.radii.length > 1) {
          borderTopRightRadius = corners.radii[1] || 0;
          borderBottomRightRadius = corners.radii[2] || 0;
          borderBottomLeftRadius = corners.radii[3] || 0;
        }
        else {
          borderBottomRightRadius = borderBottomLeftRadius = borderTopRightRadius = borderTopLeftRadius;
        }
      }
      return {
        tagName: groupBehavior === 1 ? TAG_NAME.FRAME : TAG_NAME.GRAPHIC,
        props: {
          uuid: layer.do_objectID,
          name: layer.name,
          nameIsFixed: layer.nameIsFixed,
          index,
          constrainProportions,
          includeBackgroundColorInExport,
          exportOptions,
          style: {
            left,
            top,
            right,
            bottom,
            width,
            height,
            visibility,
            opacity,
            fill,
            fillEnable,
            fillOpacity,
            fillMode,
            stroke,
            strokeEnable,
            strokeWidth,
            strokePosition,
            strokeMode,
            strokeDasharray,
            strokeLinecap,
            strokeLinejoin,
            strokeMiterlimit,
            translateX,
            translateY,
            scaleX,
            scaleY,
            rotateZ,
            mixBlendMode,
            maskMode,
            breakMask,
            blur,
            shadow,
            shadowEnable,
            innerShadow,
            innerShadowEnable,
            overflow: clippingBehavior === 2 ? 'visible' : 'hidden',
            borderTopLeftRadius,
            borderTopRightRadius,
            borderBottomLeftRadius,
            borderBottomRightRadius,
          },
          isLocked,
          isExpanded,
        },
        children: children.filter((item) => item),
      } as JFrame | JGraphic;
    }
    return {
      tagName: TAG_NAME.GROUP,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        nameIsFixed: layer.nameIsFixed,
        index,
        constrainProportions,
        exportOptions,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visibility,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
        },
        isLocked,
        isExpanded,
      },
      children: children.filter((item) => item),
    } as JGroup;
  }
  if (layer._class === SketchFormat.ClassValue.Bitmap) {
    let src = '';
    if (layer.image._ref_class === 'MSImageData') {
      src = await readImageFile(layer.image._ref, opt);
    }
    else if ((layer.image._ref_class as string) === 'MSNetworkImage') {
      src = layer.image._ref;
    }
    const {
      fill,
      fillEnable,
      fillOpacity,
      fillMode,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
    } = await geomStyle(layer, opt);
    return {
      tagName: TAG_NAME.BITMAP,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        nameIsFixed: layer.nameIsFixed,
        index,
        constrainProportions,
        exportOptions,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visibility,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
          stroke,
          strokeEnable,
          strokeWidth,
          strokePosition,
          strokeMode,
          strokeDasharray,
          strokeLinecap,
          strokeLinejoin,
          strokeMiterlimit,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
          hueRotate,
          saturate,
          brightness,
          contrast,
        },
        isLocked,
        isExpanded,
        src,
      },
    } as JBitmap;
  }
  if (layer._class === SketchFormat.ClassValue.Text) {
    let tb = layer.textBehaviour || SketchFormat.TextBehaviour.Flexible;
    // 2025新版sketch没有textBehaviour，模拟之
    if (isVer2025) {
      if (verticalSizing === 0 || verticalSizing === 3) {
        tb = SketchFormat.TextBehaviour.FixedWidthAndHeight;
      }
      else if (horizontalSizing === 0 || horizontalSizing === 3) {
        tb = SketchFormat.TextBehaviour.Fixed;
      }
    }
    let textBehaviour: TextProps['textBehaviour'];
    /**
     * sketch独有，优先级高于ResizingConstraint，指明文本框的对齐方式。
     * sketch中自动宽的文本不能左右固定只能最多一方，因此都是translate:-50%的中心对齐。
     * 看似冗余，但因为编辑器字体的不确定性，在别处打开时需保留最初的文本框尺寸位置，
     * 所以传入，并在初始化时考虑translate:-50%的计算居中对齐。
     */
    if (tb === SketchFormat.TextBehaviour.Flexible) {
      textBehaviour = 'auto';
      // 左右类型，是固定宽度，width无用但保留
      if (left !== 'auto' && right !== 'auto') {
        right = 'auto';
        // 左右类型变成自动宽，矫正left和translateX
        const l = parseFloat(left.toString());
        if (/%$/.test(left.toString())) {
          left = l + layer.frame.width * 50 / w + '%';
        }
        else {
          left = l + layer.frame.width * 0.5;
        }
        translateX = '-50%';
      }
      width = layer.frame.width;
      // 单左或右，宽度有用，左右都是auto，宽度有用
      // 上下同
      if (top !== 'auto' && bottom !== 'auto') {
        bottom = 'auto';
        const t = parseFloat(top.toString());
        if (/%$/.test(top.toString())) {
          top = t + layer.frame.height * 50 / h + '%';
        }
        else {
          top = t + layer.frame.height * 0.5;
        }
        translateY = '-50%';
      }
      height = layer.frame.height;
    }
    else if (tb === SketchFormat.TextBehaviour.Fixed) {
      textBehaviour = 'autoH';
      if (top !== 'auto' && bottom !== 'auto') {
        bottom = 'auto';
        const t = parseFloat(top.toString());
        if (/%$/.test(top.toString())) {
          top = t + layer.frame.height * 50 / h + '%';
        }
        else {
          top = t + layer.frame.height * 0.5;
        }
        translateY = '-50%';
      }
      height = layer.frame.height;
    }
    // FixedWidthAndHeight啥也不干，等同普通节点的固定宽高，脏数据不太可能，也认为是固定尺寸
    else if (tb === SketchFormat.TextBehaviour.FixedWidthAndHeight) {
      textBehaviour = 'fixed';
    }
    const { string, attributes } = layer.attributedString;
    const rich: JRich[] = attributes.length
      ? attributes.map((item: any) => {
        const {
          location,
          length,
          attributes: {
            MSAttributedStringFontAttribute: {
              attributes: { name = inject.defaultFontFamily, size: fontSize = inject.defaultFontSize } = {},
            } = {},
            MSAttributedStringColorAttribute: { red = 0, green = 0, blue = 0, alpha = 1 } = {},
            kerning = 0,
            underlineStyle = SketchFormat.UnderlineStyle.None,
            strikethroughStyle = SketchFormat.StrikethroughStyle.None,
            paragraphStyle: {
              alignment = 0,
              maximumLineHeight = 0,
              paragraphSpacing = 0,
            } = {},
          },
        } = item;
        const textDecoration: Array<'none' | 'underline' | 'line-through' | 'lineThrough'> = [];
        if (underlineStyle !== SketchFormat.UnderlineStyle.None) {
          textDecoration.push('underline');
        }
        if (strikethroughStyle !== SketchFormat.StrikethroughStyle.None) {
          textDecoration.push('lineThrough');
        }
        return {
          location: parseInt(location) || 0,
          length: parseInt(length) || 0,
          fontFamily: name,
          fontSize,
          fontWeight: 400, // 无用写死
          fontStyle: 'normal', // 同
          letterSpacing: kerning,
          textAlign: ['left', 'right', 'center', 'justify'][alignment || 0],
          textDecoration,
          lineHeight: maximumLineHeight,
          paragraphSpacing,
          color: [
            Math.floor(red * 255),
            Math.floor(green * 255),
            Math.floor(blue * 255),
            alpha,
          ],
        } as JRich;
      })
      : [];
    const MSAttributedStringFontAttribute =
      layer.style?.textStyle?.encodedAttributes?.MSAttributedStringFontAttribute
        ?.attributes;
    const fontSize = MSAttributedStringFontAttribute?.size || rich[0]?.fontSize || inject.defaultFontSize;
    const fontFamily = MSAttributedStringFontAttribute?.name || rich[0]?.fontFamily || inject.defaultFontFamily;
    const paragraphStyle =
      layer.style?.textStyle?.encodedAttributes?.paragraphStyle;
    const lineHeight = paragraphStyle?.maximumLineHeight || 'normal';
    const { underlineStyle = 0, strikethroughStyle = 0, kerning: letterSpacing = 0, MSAttributedStringColorAttribute } = layer.style?.textStyle?.encodedAttributes || {};
    let textAlign = paragraphStyle?.alignment !== undefined
      ? ['left', 'right', 'center', 'justify'][paragraphStyle.alignment || 0]
      : (rich[0]?.textAlign ?? 'left');
    const verticalAlignment = layer.style?.textStyle?.verticalAlignment;
    const textVerticalAlign = ['top', 'middle', 'bottom'][verticalAlignment || 0];
    const textDecoration: Array<'none' | 'underline' | 'line-through' | 'lineThrough'> = [];
    if (underlineStyle !== SketchFormat.UnderlineStyle.None) {
      textDecoration.push('underline');
    }
    if (underlineStyle && strikethroughStyle !== SketchFormat.StrikethroughStyle.None) {
      textDecoration.push('lineThrough');
    }
    const paragraphSpacing = paragraphStyle?.paragraphSpacing || 0;
    const color = MSAttributedStringColorAttribute
      ? [
        Math.floor(MSAttributedStringColorAttribute.red * 255),
        Math.floor(MSAttributedStringColorAttribute.green * 255),
        Math.floor(MSAttributedStringColorAttribute.blue * 255),
        MSAttributedStringColorAttribute.alpha,
      ]
      : (rich[0]?.color || [0, 0, 0, 1]);
    // 保持一致
    if (rich[0] && rich[0].textAlign !== textAlign) {
      textAlign = rich[0].textAlign;
    }
    const {
      fill,
      fillEnable,
      fillOpacity,
      fillMode,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
      styleId,
    } = await geomStyle(layer, opt);
    return {
      tagName: TAG_NAME.TEXT,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        nameIsFixed: layer.nameIsFixed,
        index,
        constrainProportions,
        textBehaviour,
        styleId,
        exportOptions,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visibility,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
          stroke,
          strokeEnable,
          strokeWidth,
          strokePosition,
          strokeMode,
          strokeDasharray,
          strokeLinecap,
          strokeLinejoin,
          strokeMiterlimit,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          fontSize,
          fontFamily,
          color,
          textAlign,
          textVerticalAlign,
          textDecoration,
          letterSpacing,
          lineHeight,
          paragraphSpacing,
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
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
    const points: JPoint[] = layer.points.map((item: any) => {
      const point = parseStrPoint(item.point);
      const curveFrom = parseStrPoint(item.curveFrom);
      const curveTo = parseStrPoint(item.curveTo);
      let curveMode = 'none' as JPoint['curveMode'];
      if (item.curveMode === SketchFormat.CurveMode.Straight) {
        curveMode = 'straight';
      }
      else if (item.curveMode === SketchFormat.CurveMode.Mirrored) {
        curveMode = 'mirrored';
      }
      else if (item.curveMode === SketchFormat.CurveMode.Asymmetric) {
        curveMode = 'asymmetric';
      }
      else if (item.curveMode === SketchFormat.CurveMode.Disconnected) {
        curveMode = 'disconnected';
      }
      return {
        x: point.x,
        y: point.y,
        cornerRadius: item.cornerRadius,
        curveMode,
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
      fillOpacity,
      fillMode,
      fillRule,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
      styleId,
    } = await geomStyle(layer, opt);
    return {
      tagName: TAG_NAME.POLYLINE,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        nameIsFixed: layer.nameIsFixed,
        index,
        constrainProportions,
        points,
        isClosed: layer.isClosed,
        isRectangle: layer._class === 'rectangle',
        isOval: layer._class === 'oval',
        styleId,
        exportOptions,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visibility,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
          fillRule,
          stroke,
          strokeEnable,
          strokeWidth,
          strokePosition,
          strokeMode,
          strokeDasharray,
          strokeLinecap,
          strokeLinejoin,
          strokeMiterlimit,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          booleanOperation:
            ['union', 'subtract', 'intersect', 'xor'][layer.booleanOperation] ||
            'none',
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
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
      fillOpacity,
      fillMode,
      fillRule,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeMode,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
      styleId,
    } = await geomStyle(layer, opt);
    const children: JNode[] = [];
    for (let i = 0, len = layer.layers?.length; i < len; i++) {
      const res = await convertItem(layer.layers[i], (i + 1) / (len + 1), opt, layer.frame.width, layer.frame.height);
      if (res) {
        children.push(res);
      }
    }
    return {
      tagName: TAG_NAME.SHAPE_GROUP,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        nameIsFixed: layer.nameIsFixed,
        index,
        constrainProportions,
        styleId,
        exportOptions,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visibility,
          opacity,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
          fillRule,
          stroke,
          strokeEnable,
          strokeWidth,
          strokePosition,
          strokeMode,
          strokeDasharray,
          strokeLinecap,
          strokeLinejoin,
          strokeMiterlimit,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          booleanOperation:
            ['union', 'subtract', 'intersect', 'xor'][layer.booleanOperation] ||
            'none',
          mixBlendMode,
          maskMode,
          breakMask,
          blur,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
        },
        isLocked,
        isExpanded,
      },
      children,
    } as JShapeGroup;
  }
  if (layer._class === SketchFormat.ClassValue.Slice) {
    return {
      tagName: TAG_NAME.SLICE,
      props: {
        uuid: layer.do_objectID,
        name: layer.name,
        nameIsFixed: layer.nameIsFixed,
        index,
        constrainProportions,
        exportOptions,
        style: {
          left,
          top,
          right,
          bottom,
          width,
          height,
          visibility,
          opacity,
          translateX,
          translateY,
          scaleX,
          scaleY,
          rotateZ,
          breakMask,
        },
        isLocked,
      },
    };
  }
  inject.error(layer);
}

export async function convertFill(item: SketchFormat.Fill, opt: Opt) {
  if (item.fillType === SketchFormat.FillType.Pattern) {
    let url = '';
    const image = item.image!;
    if (image._ref_class === 'MSImageData') {
      url = await readImageFile(image._ref, opt);
    }
    else if ((image._ref_class as string) === 'MSNetworkImage') {
      url = image._ref;
    }
    const type = ['tile', 'fill', 'stretch', 'fit'][item.patternFillType];
    const scale = item.patternTileScale;
    return `url(${url}) ${type} ${scale * 100}%`;
  }
  else if (item.fillType === SketchFormat.FillType.Gradient) {
    const g = item.gradient;
    const from = parseStrPoint(g.from);
    const to = parseStrPoint(g.to);
    const stops = g.stops.map((item) => {
      const color = color2rgbaStr([
        Math.floor(item.color.red * 255),
        Math.floor(item.color.green * 255),
        Math.floor(item.color.blue * 255),
        item.color.alpha,
      ]);
      return color + ' ' + item.position * 100 + '%';
    });
    if (g.gradientType === SketchFormat.GradientType.Linear) {
      return `linearGradient(${from.x} ${from.y} ${to.x} ${to.y},${stops.join(
        ',',
      )})`;
    }
    else if (g.gradientType === SketchFormat.GradientType.Radial) {
      const ellipseLength = g.elipseLength;
      return `radialGradient(${from.x} ${from.y} ${to.x} ${to.y} ${ellipseLength},${stops.join(',')})`;
    }
    else if (g.gradientType === SketchFormat.GradientType.Angular) {
      return `conicGradient(${0.5} ${0.5} ${0.5} ${0.5},${stops.join(
        ',',
      )})`;
    }
    else {
      throw new Error('Unknown gradient');
    }
  }
  else {
    return [
      Math.floor(item.color.red * 255),
      Math.floor(item.color.green * 255),
      Math.floor(item.color.blue * 255),
      item.color.alpha,
    ];
  }
}

export async function geomStyle(layer: SketchFormat.AnyLayer, opt: Opt) {
  const {
    borders,
    borderOptions,
    fills,
    windingRule,
    miterLimit: strokeMiterlimit,
    do_objectID: styleId,
  } = layer.style || {};
  const fill: Array<string | number[]> = [];
  const fillEnable: boolean[] = [];
  const fillOpacity: number[] = [];
  const fillMode: string[] = [];
  if (fills) {
    for (let i = 0, len = fills.length; i < len; i++) {
      const item = fills[i];
      const f = await convertFill(item, opt);
      fill.push(f!);
      fillEnable.push(item.isEnabled);
      fillOpacity.push(item.contextSettings?.opacity ?? 1);
      const blend = item.contextSettings?.blendMode;
      fillMode.push(getBlendMode(blend));
    }
  }
  const stroke: Array<string | number[]> = [];
  const strokeEnable: boolean[] = [];
  const strokeWidth: number[] = [];
  const strokePosition: string[] = [];
  const strokeMode: string[] = [];
  if (borders) {
    for (let i = 0, len = borders.length; i < len; i++) {
      const item = borders[i];
      if (item.fillType === SketchFormat.FillType.Gradient) {
        const g = item.gradient;
        const from = parseStrPoint(g.from);
        const to = parseStrPoint(g.to);
        const stops = g.stops.map((item) => {
          const color = color2rgbaStr([
            Math.floor(item.color.red * 255),
            Math.floor(item.color.green * 255),
            Math.floor(item.color.blue * 255),
            item.color.alpha,
          ]);
          return color + ' ' + item.position * 100 + '%';
        });
        if (g.gradientType === SketchFormat.GradientType.Linear) {
          stroke.push(
            `linearGradient(${from.x} ${from.y} ${to.x} ${to.y},${stops.join(
              ',',
            )})`,
          );
        }
        else if (g.gradientType === SketchFormat.GradientType.Radial) {
          const ellipseLength = g.elipseLength;
          stroke.push(
            `radialGradient(${from.x} ${from.y} ${to.x} ${
              to.y
            } ${ellipseLength},${stops.join(',')})`,
          );
        }
        else if (g.gradientType === SketchFormat.GradientType.Angular) {
          stroke.push(
            `conicGradient(${from.x} ${from.y} ${to.x} ${to.y},${stops.join(
              ',',
            )})`,
          );
        }
        else {
          throw new Error('Unknown gradient');
        }
      }
      else {
        stroke.push([
          Math.floor(item.color.red * 255),
          Math.floor(item.color.green * 255),
          Math.floor(item.color.blue * 255),
          item.color.alpha,
        ]);
      }
      strokeEnable.push(item.isEnabled);
      strokeWidth.push(item.thickness || 0);
      if (item.position === SketchFormat.BorderPosition.Inside) {
        strokePosition.push('inside');
      }
      else if (item.position === SketchFormat.BorderPosition.Outside) {
        strokePosition.push('outside');
      }
      else {
        strokePosition.push('center');
      }
      const blend = item.contextSettings?.blendMode;
      strokeMode.push(getBlendMode(blend));
    }
  }
  const strokeDasharray: number[] = [];
  let strokeLinecap = 'butt',
    strokeLinejoin = 'miter';
  if (borderOptions) {
    borderOptions.dashPattern.forEach((item) => {
      strokeDasharray.push(item);
    });
    if (borderOptions.lineCapStyle === SketchFormat.LineCapStyle.Round) {
      strokeLinecap = 'round';
    }
    else if (
      borderOptions.lineCapStyle === SketchFormat.LineCapStyle.Projecting
    ) {
      strokeLinecap = 'square';
    }
    if (borderOptions.lineJoinStyle === SketchFormat.LineJoinStyle.Round) {
      strokeLinejoin = 'round';
    }
    else if (
      borderOptions.lineJoinStyle === SketchFormat.LineJoinStyle.Bevel
    ) {
      strokeLinejoin = 'bevel';
    }
  }
  return {
    fill,
    fillEnable,
    fillOpacity,
    fillMode,
    fillRule: windingRule === SketchFormat.WindingRule.EvenOdd ? 'evenodd' : 'nonzero',
    stroke,
    strokeEnable,
    strokeWidth,
    strokePosition,
    strokeMode,
    strokeDasharray,
    strokeLinecap,
    strokeLinejoin,
    strokeMiterlimit,
    styleId,
  };
}

function parseStrPoint(s: string) {
  const res = /{(.+),\s*(.+)}/.exec(s || '');
  if (!res) {
    return { x: 0, y: 0 };
  }
  return { x: parseFloat(res[1]) || 0, y: parseFloat(res[2]) || 0 };
}

async function readImageFile(filename: string, opt: Opt) {
  if (!filename || !opt.zipFile) {
    return '';
  }
  if (opt.imgSrcRecord.hasOwnProperty(filename)) {
    return opt.imgSrcRecord[filename];
  }
  let file = opt.zipFile.file(filename);
  if (!file) {
    file = opt.zipFile.file(filename);
    if (!file) {
      inject.error(`image not exist: >>>${filename}<<<`);
      return '';
    }
  }
  const ab = await file.async('arraybuffer');
  const uint8View = new Uint8Array(ab);
  let isPdf = false;
  // https://en.wikipedia.org/wiki/Magic_number_(programming)#Magic_numbers_in_files
  if (uint8View[0] === 0x25 && uint8View[1] === 0x50 && uint8View[2] === 0x44 && uint8View[3] === 0x46) {
    isPdf = true;
  }
  if (!ab.byteLength) {
    inject.error(`image is empty: >>>${filename}<<<`);
    return '';
  }
  let img: HTMLImageElement;
  if (isPdf) {
    try {
      img = await inject.loadArrayBufferPdf(ab);
    }
    catch(e) {
      inject.error(e);
      return '';
    }
  }
  else {
    try {
      img = await inject.loadArrayBufferImg(ab);
    }
    catch (e) {
      inject.error(e);
      return '';
    }
  }
  // nodejs环境下，使用node-canvas创建的img无src，暂时用原本url代替
  const src = img.src || ('blob:file://' + filename);
  inject.IMG[src] = {
    success: true,
    state: inject.LOADED,
    width: img.width,
    height: img.height,
    source: img,
    url: src,
  };
  opt.imgSrcRecord[filename] = src;
  return src;
}

async function readFontFile(filename: string, zipFile: JSZip) {
  const file = zipFile.file(filename);
  if (!file) {
    inject.error(`font not exist: >>>${filename}<<<`);
    return;
  }
  const ab = await file.async('arraybuffer');
  font.registerAb(ab);
}

async function readNetFont(url: string, postscriptName: string) {
  if (font.hasRegister(postscriptName)) {
    return;
  }
  return new Promise<void>((resolve, reject) => {
    fetch(url).then((res) => res.arrayBuffer()).then(ab => {
      font.registerAb(ab);
      resolve();
    }).catch(() => {
      reject();
    });
  });
}

function getBlendMode(blend: SketchFormat.BlendMode = SketchFormat.BlendMode.Normal) {
  let blendMode = 'normal';
  if (blend === SketchFormat.BlendMode.Darken) {
    blendMode = 'darken';
  }
  else if (blend === SketchFormat.BlendMode.Multiply) {
    blendMode = 'multiply';
  }
  else if (blend === SketchFormat.BlendMode.ColorBurn) {
    blendMode = 'color-burn';
  }
  else if (blend === SketchFormat.BlendMode.Lighten) {
    blendMode = 'lighten';
  }
  else if (blend === SketchFormat.BlendMode.Screen) {
    blendMode = 'screen';
  }
  else if (blend === SketchFormat.BlendMode.ColorDodge) {
    blendMode = 'color-dodge';
  }
  else if (blend === SketchFormat.BlendMode.Overlay) {
    blendMode = 'overlay';
  }
  else if (blend === SketchFormat.BlendMode.SoftLight) {
    blendMode = 'soft-light';
  }
  else if (blend === SketchFormat.BlendMode.HardLight) {
    blendMode = 'hard-light';
  }
  else if (blend === SketchFormat.BlendMode.Difference) {
    blendMode = 'difference';
  }
  else if (blend === SketchFormat.BlendMode.Exclusion) {
    blendMode = 'exclusion';
  }
  else if (blend === SketchFormat.BlendMode.Hue) {
    blendMode = 'hue';
  }
  else if (blend === SketchFormat.BlendMode.Saturation) {
    blendMode = 'saturation';
  }
  else if (blend === SketchFormat.BlendMode.Color) {
    blendMode = 'color';
  }
  else if (blend === SketchFormat.BlendMode.Luminosity) {
    blendMode = 'luminosity';
  }
  else if (blend === SketchFormat.BlendMode.PlusDarker) {
    // blendMode = 'plus-darker';
  }
  else if (blend === SketchFormat.BlendMode.PlusLighter) {
    // blendMode = 'plus-lighter';
  }
  return blendMode;
}

export function toSketchColor(color: number[], obj?: SketchFormat.Color): SketchFormat.Color {
  if (obj) {
    obj.alpha = color[3];
    obj.red = color[0] / 255;
    obj.green = color[1] / 255;
    obj.blue = color[2] / 255;
    return obj;
  }
  return {
    _class: 'color',
    alpha: color[3],
    red: color[0] / 255,
    green: color[1] / 255,
    blue: color[2] / 255,
  };
}

async function convertOverrideValues(overrideValues: SketchFormat.OverrideValue[], opt: Opt) {
  const hash: Record<string, Override[]> = {};
  for (let i = 0, len = overrideValues.length; i < len; i++) {
    const item = overrideValues[i];
    const [uuid, property] = item.overrideName.split('_');
    const [type, k] = property.split(':');
    const key = (k || type).split('-');
    let value = item.value as string;
    if (key[0] === 'stringValue') {
      key[0] = 'content';
    }
    else if (key[0] === 'fill') {
      if (type === 'color') {
        // @ts-ignore
        value = await convertFill({ color: value } as SketchFormat.Fill, opt);
        value = color2rgbaStr(value);
      }
    }
    const o = hash[uuid] = hash[uuid] || [];
    o.push({
      key, // 默认开头props.style可省略
      value,
    });
  }
  return hash;
}
