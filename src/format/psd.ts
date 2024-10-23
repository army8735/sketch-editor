// @ts-ignore
import Psd from 'psd.js';
import * as uuid from 'uuid';
import {
  JArtBoard,
  JBitmap,
  JFile,
  JGroup,
  JNode,
  JPage,
  JText,
  TAG_NAME,
} from './';
import { PAGE_W as W, PAGE_H as H } from './dft';
import { TEXT_ALIGN, TEXT_DECORATION } from '../style/define';

// https://army8735.me/sketch-editor
const MY_NAMESPACE = '4d1a818c-598a-5aeb-9604-e0c40129b558';

export async function openAndConvertPsdBuffer(arrayBuffer: ArrayBuffer) {
  const data = new Uint8Array(arrayBuffer);
  const psd = new Psd(data);
  psd.parse();
  const tree = psd.tree();
  const json = tree.export();
  // console.log(json);
  // console.warn(tree);
  const doc = json.document;
  const docStr = JSON.stringify(doc);
  const children: JNode[] = [];
  const c = tree.children();
  let len = c.length;
  for (let i = len - 1; i >= 0; i--) {
    const j = json.children[i];
    const res = await convertItem(c[i], j, doc.width, doc.height);
    if (res) {
      children.push(res);
    }
  }
  children.forEach((item, i) => {
    item.props.index = (i + 1) / (children.length + 1);
  });
  const ab = {
    tagName: TAG_NAME.ART_BOARD,
    props: {
      uuid: uuid.v5(docStr + 'artBoard', MY_NAMESPACE),
      name: 'default',
      style: {
        width: doc.width,
        height: doc.height,
      },
      isExpanded: true,
    },
    children,
  } as JArtBoard;
  const page = {
    tagName: TAG_NAME.PAGE,
    props: {
      uuid: uuid.v5(docStr + 'page', MY_NAMESPACE),
      name: 'default',
      index: 0,
      rule: {
        baseX: 0,
        baseY: 0,
      },
      style: {
        width: W,
        height: H,
        visible: false,
        scaleX: 0.5,
        scaleY: 0.5,
        transformOrigin: [0, 0],
        pointerEvents: false,
      },
    },
    children: [ab],
  } as JPage;
  return {
    document: {
      uuid: uuid.v5(docStr, MY_NAMESPACE),
      assets: {
        uuid: uuid.v5(docStr + 'assets', MY_NAMESPACE),
      },
      layerStyles: {
        uuid: uuid.v5(docStr + 'layerStyles', MY_NAMESPACE),
      },
      layerTextStyles: {
        uuid: uuid.v5(docStr + 'layerTextStyles', MY_NAMESPACE),
      },
    },
    pages: [page],
    currentPageIndex: 0,
    symbolMasters: [],
  } as JFile;
}

async function convertItem(layer: any, json: any, w: number, h: number) {
  // console.log(layer, json);
  const { type, name, visible, opacity } = json;
  if (type === 'group') {
    const children: JNode[] = [];
    const c = layer.children();
    let len = c.length;
    for (let i = len - 1; i >= 0; i--) {
      const j = json.children[i];
      const res = await convertItem(c[i], j, w, h);
      if (res) {
        children.push(res);
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
        style: {
          left: '0%',
          top: '0%',
          right: '0%',
          bottom: '0%',
          mixBlendMode: json.blendingMode,
          opacity,
          visible,
        },
        isExpanded: true,
      },
      children,
    } as JGroup;
  }
  else if (type === 'layer') {
    const { text } = json;
    if (text) {
      let location = 0;
      const { alignment, colors, lengthArray, names, sizes, textDecoration } = text.font;
      const rich = (lengthArray || []).map((item: any, i: number) => {
        const length = lengthArray[i] || 0;
        const res = {
          location,
          length,
          fontFamily: names[i],
          fontSize: sizes[i],
          textAlign: {
            left: TEXT_ALIGN.LEFT,
            center: TEXT_ALIGN.CENTER,
            right: TEXT_ALIGN.RIGHT,
            justify: TEXT_ALIGN.JUSTIFY,
          }[alignment[i] as 'left' | 'center' | 'right' | 'justify'] || TEXT_ALIGN.LEFT,
          color: [
            colors[i][0],
            colors[i][1],
            colors[i][2],
            Math.floor(colors[i][3] / 255),
          ],
          textDecoration: {
            none: TEXT_DECORATION.NONE,
            underline: TEXT_DECORATION.UNDERLINE,
            through: TEXT_DECORATION.LINE_THROUGH,
          }[textDecoration[i] as 'none' | 'underline'] || TEXT_DECORATION.NONE,
        };
        location += length;
        return res;
      });
      return {
        tagName: TAG_NAME.TEXT,
        props: {
          uuid: uuid.v4(),
          name,
          style: {
            left: (json.left + json.width * 0.5) * 100 / w + '%',
            top: (json.top + json.height * 0.5) * 100 / h + '%',
            translateX: '-50%',
            translateY: '-50%',
            mixBlendMode: json.blendingMode,
            opacity,
            visible,
          },
          rich,
          content: text.value,
        },
      } as JText;
    }
    const layer2 = layer.layer;
    if (layer2.image) {
      return {
        tagName: TAG_NAME.BITMAP,
        props: {
          uuid: uuid.v4(),
          name,
          style: {
            left: json.left * 100 / w + '%',
            top: json.top * 100 / h + '%',
            right: (w - json.right) * 100 / w + '%',
            bottom: (h - json.bottom) * 100 / h + '%',
            opacity,
            visible,
          },
          src: layer2.image.toPng().src,
        },
      } as JBitmap;
    }
  }
}
