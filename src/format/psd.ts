import * as uuid from 'uuid';
import { Layer, readPsd, RGB } from 'ag-psd';
import { JArtBoard, JBitmap, JFile, JGroup, JLayer, JNode, JPage, JText, Rich, TAG_NAME, } from './';
import { PAGE_H as H, PAGE_W as W } from './dft';
import { TEXT_ALIGN, TEXT_DECORATION } from '../style/define';
import inject from '../util/inject';
import { d2r } from '../math/geom';
import { color2rgbaStr } from '../style/css';

export async function openAndConvertPsdBuffer(arrayBuffer: ArrayBuffer) {
  const json = readPsd(arrayBuffer, { useImageData: false });
  console.log(json);
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
    for (let i = 0, len = json.children.length; i < len; i++) {
      const j = json.children[i];
      const res = await convertItem(json.children[i], json.width, json.height);
      if (res) {
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
  console.log(name, layer);
  const visibility = !hidden ? 'visible' : 'hidden';
  const strokeEnable: boolean[] = [];
  const stroke: Array<string | number[]> = [];
  const strokeWidth: number[] = [];
  const strokePosition: string[] = [];
  const shadow: string[] = [];
  const shadowEnable: boolean[] = [];
  const innerShadow: string[] = [];
  const innerShadowEnable: boolean[] = [];
  // ps里似乎不区分类型，统一加上，反正只有文字和矢量会生效
  if (effects.stroke) {
    effects.stroke.forEach(item => {
      if (item.fillType === 'color') {
        strokeEnable.push(!!item.enabled);
        stroke.push([
          Math.floor((item.color as RGB).r),
          Math.floor((item.color as RGB).g),
          Math.floor((item.color as RGB).b),
          item.opacity ?? 1,
        ]);
        strokeWidth.push(item.size?.value || 1);
        strokePosition.push(item.position || 'center');
      }
    });
  }
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
      shadow.push(`${color2rgbaStr(color)} ${x} ${y} ${blur * (100 - choke)} ${blur * choke}`);
      shadowEnable.push(!!item.enabled);
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
      innerShadow.push(`${color2rgbaStr(color)} ${x} ${y} ${blur * (100 - choke)} ${blur * choke}`);
      innerShadowEnable.push(!!item.enabled);
    });
  }
  // 仅组有opened
  if (layer.opened !== undefined) {
    const children: JNode[] = [];
    if (layer.children) {
      for (let i = 0, len = layer.children.length; i < len; i++) {
        const res = await convertItem(layer.children[i], w, h);
        if (res) {
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
    const rich: Rich[] = [];
    const {
      font: { name: fontFamily = inject.defaultFontFamily } = {},
      fontSize = inject.defaultFontSize,
      fauxBold,
      fauxItalic,
      kerning = 0,
      leading = 0,
      fillColor,
      // strokeColor,
      underline,
      strikethrough,
    } = layer.text.style || {};
    const { justification } = layer.text.paragraphStyle || {};
    const textDecoration: string[] = [];
    if (underline) {
      textDecoration.push('underline');
    }
    if (strikethrough) {
      textDecoration.push('lineThrough');
    }
    const textStyle = {
      fontFamily,
      fontSize,
      fontWeight: fauxBold ? 'bold' : 'normal',
      fontStyle: fauxItalic ? 'italic' : 'normal',
      letterSpacing: kerning,
      textAlign: justification ? justification : 'left',
      color: fillColor ? [
        Math.floor((fillColor as RGB).r),
        Math.floor((fillColor as RGB).g),
        Math.floor((fillColor as RGB).b),
      ] : [0, 0, 0],
      // stroke: strokeColor ? [[
      //   Math.floor((strokeColor as RGB).r),
      //   Math.floor((strokeColor as RGB).g),
      //   Math.floor((strokeColor as RGB).b),
      // ]] : [],
      textDecoration,
      paragraphSpacing: leading,
    };
    const style = {
      left: (left + (right - left) * 0.5) * 100 / w + '%',
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
        const res = {
          location,
          length: 1,
          fontFamily,
          fontSize,
          fontWeight: textStyle.fontWeight,
          fontStyle: textStyle.fontStyle,
          letterSpacing: kerning,
          lineHeight: 0,
          textAlign: justification
            ? {
              left: TEXT_ALIGN.LEFT,
              'justify-left':  TEXT_ALIGN.LEFT,
              center: TEXT_ALIGN.CENTER,
              'justify-center':  TEXT_ALIGN.CENTER,
              right: TEXT_ALIGN.RIGHT,
              'justify-right':  TEXT_ALIGN.RIGHT,
              justify: TEXT_ALIGN.JUSTIFY,
              'justify-all': TEXT_ALIGN.JUSTIFY,
            }[justification]
            : TEXT_ALIGN.LEFT,
          color: textStyle.color,
          textDecoration: textStyle.textDecoration.map(item => {
            return {
              'underline': TEXT_DECORATION.UNDERLINE,
              'lineThrough': TEXT_DECORATION.LINE_THROUGH,
            }[item] as TEXT_DECORATION;
          }),
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
            const textDecoration: TEXT_DECORATION[] = [];
            if (style.strikethrough) {
              textDecoration.push(TEXT_DECORATION.LINE_THROUGH);
            }
            if (style.underline) {
              textDecoration.push(TEXT_DECORATION.UNDERLINE);
            }
            res.textDecoration = textDecoration;
          }
        }
        if (len2 > -1) {
          const { length, style } = pr.shift()!;
          res.length = length;
          if (style.justification) {
            res.textAlign = {
              left: TEXT_ALIGN.LEFT,
              'justify-left':  TEXT_ALIGN.LEFT,
              center: TEXT_ALIGN.CENTER,
              'justify-center':  TEXT_ALIGN.CENTER,
              right: TEXT_ALIGN.RIGHT,
              'justify-right':  TEXT_ALIGN.RIGHT,
              justify: TEXT_ALIGN.JUSTIFY,
              'justify-all': TEXT_ALIGN.JUSTIFY,
            }[style.justification];
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
                stroke,
                strokeEnable,
                strokePosition,
                strokeWidth,
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
