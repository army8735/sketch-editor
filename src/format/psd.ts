import * as uuid from 'uuid';
import { Layer, readPsd, RGB, RGBA, FRGB, Color } from 'ag-psd';
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
  JStyle,
  JText,
  JPoint,
  TAG_NAME,
} from './';
import { PAGE_H as H, PAGE_W as W } from './dft';
import inject, { OffScreen } from '../util/inject';
import { d2r } from '../math/geom';
import { normalizeColor } from '../style/css';
import { color2rgbaInt, color2rgbaStr } from '../style/color';
import { getLinearCoords } from '../style/gradient';
import { toPrecision } from '../math';

export async function openAndConvertPsdBuffer(arrayBuffer: ArrayBuffer) {
  const json = readPsd(arrayBuffer, { useImageData: false });
  // console.log(json);
  const children: JNode[] = [];
  const ab = {
    tagName: TAG_NAME.ART_BOARD,
    props: {
      uuid: uuid.v4(),
      name: '画板',
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
      name: '页面 1',
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
      const child = json.children[i];
      let res = await convertItem(child, json.width, json.height);
      if (res) {
        if (child.mask) {
          const m = await convertMask(child, json.width, json.height);
          if (m) {
            res = wrapMask(res, m);
          }
          if (!child.clipping) {
            res.props.style!.breakMask = true;
          }
        }
        // clipping表明被前面兄弟mask，注意是可以连续多个
        if (child.clipping && children.length) {
          for (let j = i - 1; j >= 0; j--) {
            const child = json.children[j];
            if (!child.clipping) {
              const d = i - j;
              const m = children[children.length - d];
              if (m) {
                m.props.style!.maskMode = 'alpha-with';
              }
              break;
            }
          }
        }
        children.push(res);
      }
    }
  }
  else if (json.canvas) {
    const o = await new Promise<JLayer | undefined>(resolve => {
      json.canvas!.toBlob(blob => {
        if (blob) {
          return resolve({
            tagName: TAG_NAME.BITMAP,
            props: {
              uuid: uuid.v4(),
              name: '截图',
              style: {
                left: '0%',
                top: '0%',
                right: '0%',
                bottom: '0%',
              },
              src: URL.createObjectURL(blob),
            },
          } as JBitmap);
        }
        resolve(undefined);
      });
    });
    if (o) {
      children.push(o);
    }
  }
  return {
    pages: [page],
    currentPageIndex: 0,
  } as JFile;
}

async function convertItem(layer: Layer, w: number, h: number) {
  const { name, opacity, hidden, top = 0, left = 0, bottom = 0, right = 0, effects = {}, blendMode, canvas } = layer;
  // console.log(name, layer);
  const visibility = !hidden ? 'visible' : 'hidden';
  const shadow: string[] = [];
  const shadowEnable: boolean[] = [];
  const innerShadow: string[] = [];
  const innerShadowEnable: boolean[] = [];
  const fill: Array<string | number[]> = []; // 颜色叠加，比如Bitmap或Group的tint叠加填充
  const fillEnable: boolean[] = [];
  const fillOpacity: number[] = [];
  const fillMode: string[] = [];
  const canvasPromise = new Promise<JLayer | undefined>(resolve => {
    if (!canvas) {
      return resolve(undefined);
    }
    canvas.toBlob(blob => {
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
              mixBlendMode: blendMode,
              fill,
              fillEnable,
              fillOpacity,
              fillMode,
            },
            src: URL.createObjectURL(blob),
          },
        } as JBitmap);
      }
      resolve(undefined);
    });
  });
  if (effects.dropShadow) {
    for (let i = effects.dropShadow.length - 1; i >= 0; i--) {
      const item = effects.dropShadow[i];
      const color = [
        ...convertColor(item.color),
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
    }
  }
  if (effects.innerShadow) {
    for (let i = effects.innerShadow.length - 1; i >= 0; i--) {
      const item = effects.innerShadow[i];
      const color = [
        ...convertColor(item.color),
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
    }
  }
  if (effects.solidFill) {
    for (let i = effects.solidFill.length - 1; i >= 0; i--) {
      const item = effects.solidFill[i];
      fill.push([
        ...convertColor(item.color),
        item.opacity ?? 1,
      ]);
      fillEnable.push(!!item.enabled);
      fillOpacity.push(item.opacity ?? 1);
      fillMode.push(item.blendMode || 'normal');
    }
  }
  // 仅组有opened
  if (layer.opened !== undefined) {
    const children: JNode[] = [];
    if (layer.children) {
      for (let i = 0, len = layer.children.length; i < len; i++) {
        const child = layer.children[i];
        let res = await convertItem(child, w, h);
        if (res) {
          if (child.mask) {
            const m = await convertMask(child, w, h);
            if (m) {
              res = wrapMask(res, m);
            }
            if (!child.clipping) {
              res.props.style!.breakMask = true;
            }
          }
          // clipping表明被前面兄弟mask，注意是可以连续多个
          if (child.clipping && children.length) {
            for (let j = i - 1; j >= 0; j--) {
              const child = layer.children[j];
              if (!child.clipping) {
                const d = i - j;
                const m = children[children.length - d];
                if (m) {
                  m.props.style!.maskMode = 'alpha-with';
                }
                break;
              }
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
          mixBlendMode: blendMode,
          fill,
          fillEnable,
          fillOpacity,
          fillMode,
        },
      },
      children,
    } as JGroup;
  }
  else if (layer.text) {
    // 路径字体转图片
    if (layer.text.textPath && layer.text.textPath.bezierCurve) {
      return canvasPromise;
    }
    const strokeEnable: boolean[] = [];
    const stroke: Array<string | number[]> = [];
    const strokeWidth: number[] = [];
    const strokePosition: string[] = [];
    // ps里似乎不区分类型，只有文字生效
    if (effects.stroke) {
      for (let i = effects.stroke.length - 1; i >= 0; i--) {
        const item = effects.stroke[i];
        if (item.fillType === 'color') {
          strokeEnable.push(effects.disabled ? false : !!item.enabled);
          stroke.push(color2rgbaStr([
            ...convertColor(item.color),
            item.opacity ?? 1,
          ]));
          strokeWidth.push(item.size?.value || 1);
          strokePosition.push(item.position || 'center');
        }
      }
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
    const textDecoration: JStyle['textDecoration'] = [];
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
      color: color2rgbaStr(fillColor ? convertColor(fillColor) : [0, 0, 0]),
      textDecoration,
      lineHeight: autoLeading ? 0 : leading * transform[0],
      paragraphSpacing: 0,
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
      mixBlendMode: blendMode,
      fill,
      fillEnable,
      fillOpacity,
      fillMode,
    };
    const { styleRuns, paragraphStyleRuns } = layer.text;
    if (styleRuns || paragraphStyleRuns) {
      let location = 0;
      const sr = (styleRuns || []).slice(0);
      const pr = (paragraphStyleRuns || []).slice(0);
      let i = 0;
      while (sr.length || pr.length) {
        const res: JRich = {
          location,
          length: 1,
          fontFamily,
          fontSize: fontSize * transform[0],
          fontWeight: textStyle.fontWeight,
          fontStyle: textStyle.fontStyle,
          letterSpacing: kerning,
          lineHeight: autoLeading ? 0 : leading * transform[0],
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
            }[justification] as JStyle['textAlign']
            : 'left',
          color: color2rgbaInt(textStyle.color),
          textDecoration: textStyle.textDecoration,
          paragraphSpacing: 0,
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
            res.fontSize = style.fontSize * transform[0];
          }
          if (!style.autoKerning && style.kerning !== undefined) {
            res.letterSpacing = style.kerning;
          }
          if (!style.autoLeading && style.leading !== undefined) {
            res.lineHeight = style.leading * transform[0];
          }
          if (style.fillColor) {
            res.color = convertColor(style.fillColor || fillColor);
          }
          if (style.strikethrough !== undefined || style.underline !== undefined) {
            const textDecoration: JStyle['textDecoration'] = [];
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
            }[style.justification] as JStyle['textAlign'];
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
  else if (layer.vectorOrigination && layer.vectorOrigination.keyDescriptorList.length === 1 && !layer.vectorOrigination.keyDescriptorList[0].keyShapeInvalidated) {
    const { vectorFill, vectorStroke, vectorOrigination: { keyDescriptorList } } = layer;
    const stroke: Array<string | number[]> = [];
    const strokeEnable: boolean[] = [];
    const strokeWidth: number[] = [];
    const strokePosition: string[] = [];
    const strokeMode: string[] = [];
    // 矢量和ps的颜色叠加应该互斥
    if (vectorFill) {
      if (vectorFill.type === 'color') {
        fill.push(color2rgbaStr(convertColor(vectorFill.color)));
      }
      else if (vectorFill.type === 'solid') {
        const { angle = 0, colorStops, opacityStops, style, reverse, align } = vectorFill;
        let scale = vectorFill.scale ?? 1;
        let s = '';
        if (style === 'linear') {
          let deg = angle + 90;
          // 对齐是标准css外接圆，否则自己算
          if ((align !== false || deg % 90 === 0) && scale === 1) {
            if (reverse) {
              if (deg >= 0) {
                deg -= 180;
              }
              else {
                deg += 180;
              }
            }
            s = `linear-gradient(${deg}deg, `;
          }
          else {
            const { x1, y1, x2, y2 } = getLinearCoords(deg, 0, 0, w, h);
            const d = [
              toPrecision(x1 / w * scale),
              toPrecision(y1 / h * scale),
              toPrecision(x2 / w * scale),
              toPrecision(y2 / h * scale),
            ];
            s = `linear-gradient(${d.join(' ')}, `;
          }
          scale = 1;
        }
        // ps是到closest-side圆形
        else if (style === 'radial') {
          s = 'radial-gradient(0.5 0.5 ';
          if (w >= h) {
            s += (w + h) * 0.5 / w + ' 1, ';
          }
          else {
            s += '1 ' + (w + h) * 0.5 / h + ', ';
          }
        }
        else if (style === 'angle') {
          s = 'conic-gradient(';
          scale = 1;
        }
        // 不支持
        else {
          if (canvas) {
            return canvasPromise;
          }
          return;
        }
        const stops: { color: number[], offset: number }[] = [];
        colorStops.forEach((stop, i) => {
          stops.push({
            color: [
              ...convertColor(stop.color),
              opacityStops[i]?.opacity ?? 1,
            ],
            offset: stop.location * scale,
          });
        });
        // conic时ps可以调整起始角度，影响每个stop的offset
        if (style === 'angle' && angle) {
          const offset = angle / 360;
          stops.forEach((stop) => {
            stop.offset -= offset;
          });
          const first = stops[0];
          const last = stops[stops.length - 1];
          if (first.offset > 0 && last.offset > 1) {
            const prev = stops[stops.length - 2];
            const p = (1 - prev.offset) / (last.offset - prev.offset);
            const color = last.color.slice(0);
            const pa = prev.color[3] ?? 1;
            const la = last.color[3] ?? 1;
            last.color = normalizeColor([
              prev.color[0] + (last.color[0] - prev.color[0]) * p,
              prev.color[1] + (last.color[1] - prev.color[1]) * p,
              prev.color[2] + (last.color[2] - prev.color[2]) * p,
              pa + (la - pa) * p,
            ]);
            last.offset = 1;
            stops.unshift({
              color,
              offset: Math.max(0, first.offset - 1e-8),
            });
          }
          else if (first.offset < 0 && last.offset < 1) {
            const next = stops[1];
            const p = -first.offset / (next.offset - first.offset);
            const color = first.color.slice(0);
            const fa = first.color[3] ?? 1;
            const na = next.color[3] ?? 1;
            first.color = normalizeColor([
              first.color[0] + (next.color[0] - first.color[0]) * p,
              first.color[1] + (next.color[1] - first.color[1]) * p,
              first.color[2] + (next.color[2] - first.color[2]) * p,
              fa + (na - fa) * p,
            ]);
            first.offset = 1;
            stops.push({
              color,
              offset: Math.min(1, last.offset + 1e-8),
            });
          }
        }
        stops.forEach((stop, i) => {
          if (i) {
            s += ', ';
          }
          s += color2rgbaStr(stop.color) + ' ' + stop.offset * 100 + '%';
        });
        s += ')';
        fill.push(s);
      }
      fillEnable.push(vectorStroke?.fillEnabled ?? true);
      fillOpacity.push(1);
      fillMode.push('normal');
    }
    if (vectorStroke) {
      stroke.push(color2rgbaStr([
        // @ts-ignore
        ...convertColor(vectorStroke.content?.color),
        vectorStroke.opacity ?? 1,
      ]));
      strokeEnable.push(!!vectorStroke.strokeEnabled);
      strokeWidth.push(vectorStroke.lineWidth?.value || 1);
      strokePosition.push(vectorStroke.lineAlignment || 'center');
      strokeMode.push(vectorStroke.blendMode || 'normal');
    }
    const w2 = right - left;
    const h2 = bottom - top;
    const points: JPoint[] = [];
    keyDescriptorList.forEach(item => {
      const { keyOriginRRectRadii, keyOriginShapeBoundingBox } = item;
      if (keyOriginShapeBoundingBox) {
        points.push({
          x: ((keyOriginShapeBoundingBox.left.value || left) - left) / w2,
          y: ((keyOriginShapeBoundingBox.top.value || top) - top) / h2,
          cornerRadius: keyOriginRRectRadii?.topLeft.value || 0,
          curveMode: 'straight',
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
          curveMode: 'straight',
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
          curveMode: 'straight',
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
          curveMode: 'straight',
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
      tagName: TAG_NAME.POLYLINE,
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
          mixBlendMode: blendMode,
        },
        points,
        isClosed: true,
      },
    } as JPolyline | JShapeGroup;
  }
  else if (canvas) {
    return canvasPromise;
  }
}

async function convertMask(layer: Layer, w: number, h: number) {
  const { top = 0, left = 0, bottom = 0, right = 0, canvas, defaultColor } = layer.mask!;
  if (!canvas) {
    return;
  }
  let canvas2 = canvas;
  let oc: OffScreen;
  // psd的遮罩和图层是一样大的，如果四周是白色会省略，需填充
  if (top > layer.top! || left > layer.left! || right < layer.right! || bottom < layer.bottom!) {
    const w2 = layer.right! - layer.left!;
    const h2 = layer.bottom! - layer.top!;
    oc = inject.getOffscreenCanvas(w2, h2);
    canvas2 = oc.canvas;
    if (defaultColor) {
      oc.ctx.fillStyle = color2rgbaStr([defaultColor, defaultColor, defaultColor]);
      if (top > layer.top!) {
        oc.ctx.fillRect(0, 0, w2, top - layer.top!);
      }
      if (bottom < layer.bottom!) {
        oc.ctx.fillRect(0, bottom - layer.top!, w2, layer.bottom! - bottom);
      }
      if (left > layer.left!) {
        oc.ctx.fillRect(0, 0, left - layer.left!, h2);
      }
      if (right < layer.right!) {
        oc.ctx.fillRect(right - layer.left!, 0, layer.right! - right, h2);
      }
    }
    oc.ctx.drawImage(canvas, left - layer.left!, top - layer.top!);
  }
  return new Promise<JLayer | undefined>(resolve => {
    canvas2!.toBlob(blob => {
      if (oc) {
        oc.release();
      }
      if (blob) {
        // const img = document.createElement('img');
        // img.src = URL.createObjectURL(blob);
        // img.title = layer.name!;
        // document.body.appendChild(img);
        return resolve({
          tagName: TAG_NAME.BITMAP,
          props: {
            uuid: uuid.v4(),
            name: layer.name + ' mask',
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

function wrapMask(res: JNode, m: JNode) {
  const style = res.props.style!;
  const group = {
    tagName: TAG_NAME.GROUP,
    props: {
      uuid: uuid.v4(),
      name: res.props.name,
      isExpanded: true,
      style: {
        left: style.left,
        top: style.top,
        right: style.right,
        bottom: style.bottom,
        // mixBlendMode: style.mixBlendMode,
      },
    },
    children: [
      m,
      res,
    ],
  } as JGroup;
  style.left = 0;
  style.top = 0;
  style.right = 0;
  style.bottom = 0;
  res.props.name += ' origin';
  const styleM = m.props.style!;
  styleM.left = 0;
  styleM.top = 0;
  styleM.right = 0;
  styleM.bottom = 0;
  if (style.mixBlendMode) {
    styleM.mixBlendMode = style.mixBlendMode;
  }
  delete style.mixBlendMode;
  return group;
}

function convertColor(color?: Color) {
  if (!color) {
    return [0, 0, 0];
  }
  if ((color as any).hasOwnProperty('a')) {
    [
      (color as RGBA).r,
      (color as RGBA).g,
      (color as RGBA).b,
      (color as RGBA).a,
    ];
  }
  else if ((color as any).hasOwnProperty('fr')) {
    return [
      (color as FRGB).fr * 255,
      (color as FRGB).fg * 255,
      (color as FRGB).fb * 255,
    ];
  }
  return [
    (color as RGB).r,
    (color as RGB).g,
    (color as RGB).b,
  ];
}
