// @ts-ignore
import Psd from 'psd.js';
import * as uuid from 'uuid';
import {
  JFile,
  JGroup,
  JNode,
  JText,
  TAG_NAME,
} from './';
import { PAGE_W as W, PAGE_H as H } from './dft';

// https://army8735.me/sketch-editor
const MY_NAMESPACE = '4d1a818c-598a-5aeb-9604-e0c40129b558';

export async function openAndConvertPsdBuffer(arrayBuffer: ArrayBuffer) {
  const data = new Uint8Array(arrayBuffer);
  const psd = new Psd(data);
  psd.parse();
  const tree = psd.tree();
  const json = tree.export();
  console.log(json);
  console.warn(tree);
  const document = JSON.stringify(json.document);
  const children: JNode[] = [];
  const c = tree.children();
  const len = c.length;
  for (let i = len - 1; i >= 0; i--) {
    const res = await convertItem(c[i], json.children[i], (len - i) / (len + 1), json.document.width, json.document.height);
    if (res) {
      children.push(res);
    }
  }
  const page = {
    tagName: TAG_NAME.PAGE,
    props: {
      uuid: uuid.v5(document + 'page', MY_NAMESPACE),
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
        transformOrigin: [0, 0],
        pointerEvents: false,
      },
    },
    children,
  };
  return {
    document: {
      uuid: uuid.v5(document, MY_NAMESPACE),
      assets: {
        uuid: uuid.v5(document + 'assets', MY_NAMESPACE),
      },
      layerStyles: {
        uuid: uuid.v5(document + 'layerStyles', MY_NAMESPACE),
      },
      layerTextStyles: {
        uuid: uuid.v5(document + 'layerTextStyles', MY_NAMESPACE),
      },
    },
    pages: [page],
    currentPageIndex: 0,
    symbolMasters: [],
  } as JFile;
}

async function convertItem(layer: any, json: any, index: number, w: number, h: number) {
  console.log(layer, index, w, h, json);
  if (json.type === 'group') {
    const children: JNode[] = [];
    const c = layer.children();
    const len = c.length;
    for (let i = len - 1; i >= 0; i--) {
      const res = await convertItem(c[i], json.children[i], (len - i) / (len + 1), json.width, json.height);
      if (res) {
        children.push(res);
      }
    }
    return {
      tagName: TAG_NAME.GROUP,
      props: {
        uuid: uuid.v4(),
        name: json.name,
        index,
        style: {},
      },
      children,
    } as JGroup;
  }
  else if (json.type === 'layer') {
    if (json.text) {
      return {
        tagName: TAG_NAME.TEXT,
        props: {
          uuid: uuid.v4(),
          name: json.name,
          index,
          style: {},
        },
      } as JText;
    }
  }
}
