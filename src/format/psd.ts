import * as uuid from 'uuid';
import { Layer, readPsd, RGB, LayerMaskData } from 'ag-psd';
import {
  JArtBoard,
  JBitmap,
  JFile,
  JGroup,
  JLayer,
  JNode,
  JPage,
  JPolyline,
  JRich,
  JShapeGroup,
  JText,
  Point,
  TAG_NAME,
} from './';
import { PAGE_H as H, PAGE_W as W } from './dft';
import { CORNER_STYLE, CURVE_MODE, TEXT_ALIGN, TEXT_DECORATION } from '../style/define';
import inject, { OffScreen } from '../util/inject';
import { d2r } from '../math/geom';
import { color2rgbaInt, color2rgbaStr } from '../style/css';

export async function openAndConvertPsdBuffer(arrayBuffer: ArrayBuffer) {
  const json = readPsd(arrayBuffer, { useImageData: false });
  // console.log(json);
  const children: JNode[] = [];
  const ab = {
    tagName: TAG_NAME.ART_BOARD,
    props: {
      uuid: uuid.v4(),
      name: 'default',
      style: {
        width: json.width,
        height: json.height,
      },
      isExpanded: true,
    },
    children,
  } as JArtBoard;
  const page = {
    tagName: TAG_NAME.PAGE,
    props: {
      uuid: uuid.v4(),
      name: 'default',
      index: 0,
      rule: {
        baseX: 0,
        baseY: 0,
      },
      style: {
        width: W,
        height: H,
        visibility: 'hidden',
        scaleX: 0.5,
        scaleY: 0.5,
        transformOrigin: [0, 0],
        pointerEvents: false,
      },
    },
    children: [ab],
  } as JPage;
  if (json.children) {
    let breakMask = false;
    for (let i = 0, len = json.children.length; i < len; i++) {
      const child = json.children[i];
      const res = await convertItem(child, json.width, json.height);
      if (res) {
        if (breakMask) {
          res.props.style!.breakMask = breakMask;
          breakMask = false;
        }
        if (child.mask) {
          const m = await convertMask(child, json.width, json.height);
          if (m) {
            children.push(m);
            // 下一个child要中断不能继续mask
            breakMask = true;
          }
          if (child.mask.disabled) {
            res.props.style!.breakMask = true;
          }
        }
        children.push(res);
      }
    }
  }
  return {
    pages: [page],
    currentPageIndex: 0,
  } as JFile;
}

async function convertItem(layer: Layer, w: number, h: number) {
  const { name, opacity, hidden, top = 0, left = 0, bottom = 0, right = 0, effects = {} } = layer;
  // console.log(name, layer);
  const visibility = !hidden ? 'visible' : 'hidden';
  const shadow: string[] = [];
  const shadowEnable: boolean[] = [];
  const innerShadow: string[] = [];
  const innerShadowEnable: boolean[] = [];
  if (effects.dropShadow) {
    effects.dropShadow.forEach(item => {
      const color = [
        Math.floor((item.color as RGB).r),
        Math.floor((item.color as RGB).g),
        Math.floor((item.color as RGB).b),
        item.opacity ?? 1,
      ];
      const rd = d2r(item.angle || 0);
      const d = item.distance?.value || 0;
      const x = Math.acos(rd) * d || 0;
      const y = Math.sin(rd) * d || 0;
      const blur = item.size?.value || 0;
      const choke = item.choke?.value || 0;
      shadow.push(`${color2rgbaStr(color)} ${x} ${y} ${blur * (100 - choke) * 0.01} ${blur * choke * 0.01}`);
      shadowEnable.push(effects.disabled ? false : !!item.enabled);
    });
  }
  if (effects.innerShadow) {
    effects.innerShadow.forEach(item => {
      const color = [
        Math.floor((item.color as RGB).r),
        Math.floor((item.color as RGB).g),
        Math.floor((item.color as RGB).b),
        item.opacity ?? 1,
      ];
      const rd = d2r(item.angle || 0);
      const d = item.distance?.value || 0;
      const x = Math.acos(rd) * d || 0;
      const y = Math.sin(rd) * d || 0;
      const blur = item.size?.value || 0;
      const choke = item.choke?.value || 0;
      innerShadow.push(`${color2rgbaStr(color)} ${x} ${y} ${blur * (100 - choke) * 0.01} ${blur * choke * 0.01}`);
      innerShadowEnable.push(effects.disabled ? false : !!item.enabled);
    });
  }
  // 仅组有opened
  if (layer.opened !== undefined) {
    const children: JNode[] = [];
    if (layer.children) {
      let breakMask = false;
      for (let i = 0, len = layer.children.length; i < len; i++) {
        const child = layer.children[i];
        const res = await convertItem(child, w, h);
        if (res) {
          if (breakMask) {
            res.props.style!.breakMask = breakMask;
            breakMask = false;
          }
          if (child.mask) {
            const m = await convertMask(child, w, h);
            if (m) {
              children.push(m);
              // 下一个child要中断不能继续mask
              breakMask = true;
            }
            if (child.mask.disabled) {
              res.props.style!.breakMask = true;
            }
          }
          children.push(res);
        }
      }
    }
    children.forEach((item, i) => {
      item.props.index = (i + 1) / (children.length + 1);
    });
    return {
      tagName: TAG_NAME.GROUP,
      props: {
        uuid: uuid.v4(),
        name,
        isExpanded: layer.opened,
        style: {
          left: left * 100 / w + '%',
          top: top * 100 / h + '%',
          right: right * 100 / w + '%',
          bottom: bottom * 100 / h + '%',
          opacity,
          visibility,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
        },
      },
      children,
    } as JGroup;
  }
  else if (layer.text) {
    const strokeEnable: boolean[] = [];
    const stroke: Array<string | number[]> = [];
    const strokeWidth: number[] = [];
    const strokePosition: string[] = [];
    // ps里似乎不区分类型，只有文字生效
    if (effects.stroke) {
      effects.stroke.forEach(item => {
        if (item.fillType === 'color') {
          strokeEnable.push(effects.disabled ? false : !!item.enabled);
          stroke.push(color2rgbaStr([
            Math.floor((item.color as RGB).r),
            Math.floor((item.color as RGB).g),
            Math.floor((item.color as RGB).b),
            item.opacity ?? 1,
          ]));
          strokeWidth.push(item.size?.value || 1);
          strokePosition.push(item.position || 'center');
        }
      });
    }
    const transform = layer.text.transform || [1, 0, 1, 0, 0, 0];
    const rich: JRich[] = [];
    const {
      font: { name: fontFamily = inject.defaultFontFamily } = {},
      fontSize = inject.defaultFontSize,
      fauxBold,
      fauxItalic,
      autoKerning,
      kerning = 0,
      autoLeading,
      leading = 0,
      fillColor,
      // strokeColor,
      underline,
      strikethrough,
    } = layer.text.style || {};
    const { justification } = layer.text.paragraphStyle || {};
    const textDecoration: Array<'none' | 'underline' | 'line-through' | 'lineThrough'> = [];
    if (underline) {
      textDecoration.push('underline');
    }
    if (strikethrough) {
      textDecoration.push('lineThrough');
    }
    const textStyle = {
      fontFamily,
      fontSize: fontSize * transform[0],
      fontWeight: fauxBold ? 'bold' : 'normal',
      fontStyle: fauxItalic ? 'italic' : 'normal',
      letterSpacing: autoKerning ? 0 : kerning,
      textAlign: justification ? justification : 'left',
      color: color2rgbaStr(fillColor ? [
        Math.floor((fillColor as RGB).r),
        Math.floor((fillColor as RGB).g),
        Math.floor((fillColor as RGB).b),
      ] : [0, 0, 0]),
      // stroke: strokeColor ? [[
      //   Math.floor((strokeColor as RGB).r),
      //   Math.floor((strokeColor as RGB).g),
      //   Math.floor((strokeColor as RGB).b),
      // ]] : [],
      textDecoration,
      paragraphSpacing: autoLeading ? 0 : leading,
    };
    const style = {
      left: (left + (right - left) * 0.5) * 100 / w + '%',
      // right: layer.text.orientation === 'vertical' ? (w - right - (right - left) * 0.5) * 100 / w + '%' : 'auto',
      top: (top + (bottom - top) * 0.5) * 100 / h + '%',
      opacity,
      visibility,
      translateX: '-50%',
      translateY: '-50%',
      ...textStyle,
      stroke,
      strokeEnable,
      strokePosition,
      strokeWidth,
      shadow,
      shadowEnable,
      innerShadow,
      innerShadowEnable,
    };
    const { styleRuns, paragraphStyleRuns } = layer.text;
    if (styleRuns || paragraphStyleRuns) {
      let location = 0;
      const sr = (styleRuns || []).slice(0);
      const pr = (paragraphStyleRuns || []).slice(0);
      let i = 0;
      while (sr.length || pr.length) {
        if (i++ > 10) {
          break;
        }
        const res: JRich = {
          location,
          length: 1,
          fontFamily,
          fontSize: fontSize * transform[0],
          fontWeight: textStyle.fontWeight,
          fontStyle: textStyle.fontStyle,
          letterSpacing: kerning,
          lineHeight: 0,
          textAlign: justification
            ? {
              left: 'left',
              'justify-left':  'left',
              center: 'center',
              'justify-center': 'center',
              right: 'right',
              'justify-right': 'right',
              justify: 'justify',
              'justify-all': 'justify',
            }[justification] as 'left' | 'center' | 'right' | 'justify'
            : 'left',
          color: color2rgbaInt(textStyle.color),
          textDecoration: textStyle.textDecoration,
          paragraphSpacing: leading,
        };
        let len1 = -1;
        let len2 = -1;
        if (sr[0]) {
          len1 = sr[0].length;
        }
        if (pr[0]) {
          len2 = pr[0].length;
        }
        // 恰好对得上各自出队列
        if (len1 === len2) {
          location += len1;
        }
        // 有一个可能是-1为空也有可能不相等，不等正数时大的那个置为-1意为忽略
        else {
          if (len1 !== -1 && len2 !== -1) {
            if (len1 > len2) {
              len1 = -1;
            }
            else {
              len2 = -1;
            }
          }
          location += Math.max(len1, len2);
          if (len1 > -1 && pr[0]) {
            pr[0].length -= len1;
          }
          if (len2 > -1 && sr[0]) {
            sr[0].length -= len2;
          }
        }
        if (len1 > -1) {
          const { length, style } = sr.shift()!;
          res.length = length;
          if (style.font) {
            res.fontFamily = style.font.name;
          }
          if (style.fauxBold !== undefined) {
            res.fontWeight = style.fauxBold ? 'bold': 'normal';
          }
          if (style.fauxItalic !== undefined) {
            res.fontStyle = style.fauxItalic ? 'italic': 'normal';
          }
          if (style.fontSize !== undefined) {
            res.fontSize = style.fontSize;
          }
          if (style.kerning !== undefined) {
            res.letterSpacing = style.kerning;
          }
          if (style.leading !== undefined) {
            res.paragraphSpacing = style.leading;
          }
          if (style.fillColor) {
            res.color = [
              Math.floor(((style.fillColor || fillColor) as RGB).r),
              Math.floor(((style.fillColor || fillColor) as RGB).g),
              Math.floor(((style.fillColor || fillColor) as RGB).b),
            ];
          }
          if (style.strikethrough !== undefined || style.underline !== undefined) {
            const textDecoration: Array<'none' | 'underline' | 'line-through' | 'lineThrough'> = [];
            if (style.strikethrough) {
              textDecoration.push('lineThrough');
            }
            if (style.underline) {
              textDecoration.push('underline');
            }
            res.textDecoration = textDecoration;
          }
        }
        if (len2 > -1) {
          const { length, style } = pr.shift()!;
          res.length = length;
          if (style.justification) {
            res.textAlign = {
              left: 'left',
              'justify-left':  'left',
              center: 'center',
              'justify-center': 'center',
              right: 'right',
              'justify-right': 'right',
              justify: 'justify',
              'justify-all': 'justify',
            }[style.justification] as 'left' | 'center' | 'right' | 'justify';
          }
        }
        rich.push(res);
      }
    }
    return {
      tagName: TAG_NAME.TEXT,
      props: {
        uuid: uuid.v4(),
        name,
        style,
        content: layer.text.text,
        rich,
      },
    } as JText;
  }
  else if (layer.vectorOrigination && layer.vectorOrigination.keyDescriptorList.length && !layer.vectorOrigination.keyDescriptorList[0].keyShapeInvalidated) {
    const { vectorFill, vectorStroke, vectorOrigination: { keyDescriptorList } } = layer;
    const fill: Array<string | number[]> = [];
    const fillEnable: boolean[] = [];
    const fillOpacity: number[] = [];
    const fillMode: string[] = [];
    const stroke: Array<string | number[]> = [];
    const strokeEnable: boolean[] = [];
    const strokeWidth: number[] = [];
    const strokePosition: string[] = [];
    const strokeMode: string[] = [];
    if (vectorFill) {
      fill.push(color2rgbaStr([
        // @ts-ignore
        Math.floor((vectorFill.color as RGB).r),
        // @ts-ignore
        Math.floor((vectorFill.color as RGB).g),
        // @ts-ignore
        Math.floor((vectorFill.color as RGB).b),
      ]));
      fillEnable.push(vectorStroke?.fillEnabled ?? true);
      fillOpacity.push(1);
      fillMode.push('normal');
    }
    if (vectorStroke) {
      stroke.push(color2rgbaStr([
        // @ts-ignore
        Math.floor((vectorStroke.content.color as RGB).r),
        // @ts-ignore
        Math.floor((vectorStroke.content.color as RGB).g),
        // @ts-ignore
        Math.floor((vectorStroke.content.color as RGB).b),
        vectorStroke.opacity ?? 1,
      ]));
      strokeEnable.push(!!vectorStroke.strokeEnabled);
      strokeWidth.push(vectorStroke.lineWidth?.value || 1);
      strokePosition.push(vectorStroke.lineAlignment || 'center');
      strokeMode.push(vectorStroke.blendMode || 'normal');
    }
    const w2 = right - left;
    const h2 = bottom - top;
    const points: Point[] = [];
    keyDescriptorList.forEach(item => {
      const { keyOriginRRectRadii, keyOriginShapeBoundingBox } = item;
      if (keyOriginShapeBoundingBox) {
        points.push({
          x: ((keyOriginShapeBoundingBox.left.value || left) - left) / w2,
          y: ((keyOriginShapeBoundingBox.top.value || top) - top) / h2,
          cornerRadius: keyOriginRRectRadii?.topLeft.value || 0,
          curveMode: CURVE_MODE.STRAIGHT,
          cornerStyle: CORNER_STYLE.ROUNDED,
          hasCurveFrom: false,
          hasCurveTo: false,
          fx: 0,
          fy: 0,
          tx: 0,
          ty: 0,
        });
        points.push({
          x: ((keyOriginShapeBoundingBox?.right.value || right) - left) / w2,
          y: ((keyOriginShapeBoundingBox?.top.value || top) - top) / h2,
          cornerRadius: keyOriginRRectRadii?.topRight.value || 0,
          curveMode: CURVE_MODE.STRAIGHT,
          cornerStyle: CORNER_STYLE.ROUNDED,
          hasCurveFrom: false,
          hasCurveTo: false,
          fx: 0,
          fy: 0,
          tx: 0,
          ty: 0,
        });
        points.push({
          x: ((keyOriginShapeBoundingBox?.right.value || right) - left) / w2,
          y: ((keyOriginShapeBoundingBox?.bottom.value || bottom) - top) / h2,
          cornerRadius: keyOriginRRectRadii?.bottomLeft.value || 0,
          curveMode: CURVE_MODE.STRAIGHT,
          cornerStyle: CORNER_STYLE.ROUNDED,
          hasCurveFrom: false,
          hasCurveTo: false,
          fx: 0,
          fy: 0,
          tx: 0,
          ty: 0,
        });
        points.push({
          x: ((keyOriginShapeBoundingBox?.left.value || left) - left) / w2,
          y: ((keyOriginShapeBoundingBox?.bottom.value || bottom) - top) / h2,
          cornerRadius: keyOriginRRectRadii?.bottomRight.value || 0,
          curveMode: CURVE_MODE.STRAIGHT,
          cornerStyle: CORNER_STYLE.ROUNDED,
          hasCurveFrom: false,
          hasCurveTo: false,
          fx: 0,
          fy: 0,
          tx: 0,
          ty: 0,
        });
      }
    });
    return {
      tagName: keyDescriptorList.length > 1 ? TAG_NAME.SHAPE_GROUP : TAG_NAME.POLYLINE,
      props: {
        uuid: uuid.v4(),
        name,
        style: {
          left: left * 100 / w + '%',
          top: top * 100 / h + '%',
          right: (w - right) * 100 / w + '%',
          bottom: (h - bottom) * 100 / h + '%',
          opacity,
          visibility,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
          stroke,
          strokeEnable,
          strokePosition,
          strokeWidth,
          strokeMode,
          shadow,
          shadowEnable,
          innerShadow,
          innerShadowEnable,
        },
        points,
        isClosed: true,
      },
    } as JPolyline | JShapeGroup;
  }
  else if (layer.canvas) {
    return new Promise<JLayer | undefined>(resolve => {
      layer.canvas!.toBlob(blob => {
        if (blob) {
          return resolve({
            tagName: TAG_NAME.BITMAP,
            props: {
              uuid: uuid.v4(),
              name,
              style: {
                left: left * 100 / w + '%',
                top: top * 100 / h + '%',
                right: (w - right) * 100 / w + '%',
                bottom: (h - bottom) * 100 / h + '%',
                opacity,
                visibility,
                shadow,
                shadowEnable,
                innerShadow,
                innerShadowEnable,
              },
              src: URL.createObjectURL(blob),
            },
          } as JBitmap);
        }
        resolve(undefined);
      });
    });
  }
}

async function convertMask(layer: Layer, w: number, h: number) {
  const { top = 0, left = 0, bottom = 0, right = 0, canvas } = layer.mask!;
  if (!canvas) {
    return;
  }
  let canvas2 = canvas;
  let oc: OffScreen;
  // psd的遮罩和图层是一样大的，如果四周是白色会省略，需填充
  if (top > layer.top! || left > layer.left! || right < layer.right! || bottom < layer.bottom!) {
    const w = layer.right! - layer.left!;
    const h = layer.bottom! - layer.top!;
    oc = inject.getOffscreenCanvas(w, h);
    canvas2 = oc.canvas;
    oc.ctx.fillStyle = '#FFF';
    if (top > layer.top!) {
      oc.ctx.fillRect(0, 0, w, top - layer.top!);
    }
    if (bottom < layer.bottom!) {
      oc.ctx.fillRect(0, bottom, w, layer.bottom! - bottom);
    }
    if (left > layer.left!) {
      oc.ctx.fillRect(0, 0, left - layer.left!, h);
    }
    if (right < layer.right!) {
      oc.ctx.fillRect(right, 0, layer.right! - right, h);
    }
    oc.ctx.drawImage(canvas, left - layer.left!, top - layer.top!);
  }
  return new Promise<JLayer | undefined>(resolve => {
    canvas2!.toBlob(blob => {
      if (oc) {
        oc.release();
      }
      if (blob) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.title = layer.name!;
        document.body.appendChild(img);
        return resolve({
          tagName: TAG_NAME.BITMAP,
          props: {
            uuid: uuid.v4(),
            name: layer.name,
            style: {
              left: layer.left! * 100 / w + '%',
              top: layer.top! * 100 / h + '%',
              right: (w - layer.right!) * 100 / w + '%',
              bottom: (h - layer.bottom!) * 100 / h + '%',
              maskMode: 'gray',
            },
            src: URL.createObjectURL(blob),
          },
        } as JBitmap);
      }
      resolve(undefined);
    });
  });
}
