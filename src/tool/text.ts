import * as uuid from 'uuid';
import Text from '../node/Text';
import { color2hexStr } from '../style/css';
import {
  ComputedStyle,
  StyleNumValue,
  StyleUnit,
  TEXT_ALIGN,
  TEXT_VERTICAL_ALIGN
} from '../style/define';
import fontInfo from '../style/font'
import { JStyle, ResizeStyle, Rich, TextProps } from '../format';

export const SIZE_LIST = [
  6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 21, 24, 36, 48, 60, 72,
];

function putInfo(
  node: Text,
  lh: StyleNumValue,
  valid: boolean[],
  postscriptName: string[],
  fontFamily: string[],
  name: string[],
  color: string[],
  fontSize: number[],
  fontWeight: string[],
  letterSpacing: number[],
  lineHeight: number[],
  autoLineHeight: boolean[],
  paragraphSpacing: number[],
  textAlign: TEXT_ALIGN[],
  textBehaviour: TextProps['textBehaviour'][],
  obj: Rich | Pick<ComputedStyle, 'fontFamily' | 'color' | 'fontSize' | 'letterSpacing' | 'lineHeight' | 'paragraphSpacing' | 'textAlign'>,
  isRich = false,
) {
  const {
    fontFamily: ff, // 其实是postscriptName
    color: c,
    fontSize: fs,
    letterSpacing: ls,
    lineHeight: lh2,
    paragraphSpacing: ps,
    textAlign: ta,
  } = obj;
  if (!postscriptName.includes(ff)) {
    postscriptName.push(ff);
  }
  const data = fontInfo.data[ff];
  if (data) {
    // 一般都是postscriptName，但可能会出现family，统一换成字体族的名字，去除style后缀
    if (!fontFamily.includes(data.family)) {
      fontFamily.push(data.family);
      name.push(data.name);
    }
    if (!valid.includes(true)) {
      valid.push(true);
    }
    const list = data.list;
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      if (item.postscriptName === ff) {
        if (!fontWeight.includes(item.style)) {
          fontWeight.push(item.style);
        }
        break;
      }
    }
  }
  else {
    if (!fontFamily.includes(ff)) {
      fontFamily.push(ff);
      name.push(ff);
    }
    if (!valid.includes(false)) {
      valid.push(false);
    }
  }
  const cl = color2hexStr(c);
  if (!color.includes(cl)) {
    color.push(cl);
  }
  if (!fontSize.includes(fs)) {
    fontSize.push(fs);
  }
  if (!letterSpacing.includes(ls)) {
    letterSpacing.push(ls);
  }
  const auto = isRich ? !lh2 : lh.u === StyleUnit.AUTO;
  if (!autoLineHeight.includes(auto)) {
    autoLineHeight.push(auto);
  }
  if (auto && data) {
    const n = fs * data.lhr;
    if (!lineHeight.includes(n)) {
      lineHeight.push(n);
    }
  }
  else if (!lineHeight.includes(lh2)) {
    lineHeight.push(lh2);
  }
  if (!paragraphSpacing.includes(ps)) {
    paragraphSpacing.push(ps);
  }
  if (!textAlign.includes(ta)) {
    textAlign.push(ta);
  }
  const tb = getTextBehaviour(node);
  if (!textBehaviour.includes(tb)) {
    textBehaviour.push(tb);
  }
}

export function getTextBehaviour(node: Text) {
  const { left, right, top, bottom, width, height } = node.style;
  let tb: TextProps['textBehaviour'] = 'auto';
  const autoW = width.u === StyleUnit.AUTO
    && (left.u === StyleUnit.AUTO || right.u === StyleUnit.AUTO);
  const autoH = height.u === StyleUnit.AUTO
    && (top.u === StyleUnit.AUTO || bottom.u === StyleUnit.AUTO);
  if (autoW && autoH) {
  }
  else if (autoH) {
    tb = 'autoH';
  }
  else {
    tb = 'fixed';
  }
  return tb;
}

export function getTextInfo(nodes: Text[]) {
  const valid: boolean[] = [];
  const postscriptName: string[] = [];
  const fontFamily: string[] = [];
  const name: string[] = [];
  const color: string[] = [];
  const fontSize: number[] = [];
  const letterSpacing: number[] = [];
  const lineHeight: number[] = [];
  const autoLineHeight: boolean[] = [];
  const paragraphSpacing: number[] = [];
  const textAlign: TEXT_ALIGN[] = [];
  const textVerticalAlign: TEXT_VERTICAL_ALIGN[] = [];
  const textBehaviour: TextProps['textBehaviour'][] = [];
  const fontWeight: string[] = [];
  for (let i = 0, len = nodes.length; i < len; i++) {
    const node = nodes[i];
    const { rich, style, computedStyle } = node;
    if (!textVerticalAlign.includes(computedStyle.textVerticalAlign)) {
      textVerticalAlign.push(computedStyle.textVerticalAlign);
    }
    const { lineHeight: lh } = style;
    // 一般都是有rich，除非手动构造数据
    if (rich && rich.length) {
      for (let i = 0, len = rich.length; i < len; i++) {
        putInfo(
          node,
          lh,
          valid,
          postscriptName,
          fontFamily,
          name,
          color,
          fontSize,
          fontWeight,
          letterSpacing,
          lineHeight,
          autoLineHeight,
          paragraphSpacing,
          textAlign,
          textBehaviour,
          rich[i],
          true,
        );
      }
      continue;
    }
    // 非富文本
    putInfo(
      node,
      lh,
      valid,
      postscriptName,
      fontFamily,
      name,
      color,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      autoLineHeight,
      paragraphSpacing,
      textAlign,
      textBehaviour,
      computedStyle,
    );
  }
  let fontWeightList: { label: string, value: string  }[] = [];
  if (fontFamily.length === 1) {
    fontWeightList = getFontWeightList(fontFamily[0]);
  }
  return {
    valid,
    postscriptName,
    fontFamily,
    name,
    fontWeight,
    fontWeightList,
    color,
    fontSize,
    autoLineHeight,
    lineHeight,
    letterSpacing,
    paragraphSpacing,
    textAlign,
    textVerticalAlign,
    textBehaviour,
  };
}

// 传入postscriptName，也可以是fontFamily，同一字体族不同weight的
export function getFontWeightList(postscriptName: string): { label: string, value: string }[] {
  const data = fontInfo.data[postscriptName];
  if (data) {
    return data.list.map((item: any) => {
      return {
        label: item.style,
        value: item.postscriptName,
      };
    });
  }
  return [];
}

export function getEditTextInfo(node: Text) {
  const valid: boolean[] = [];
  const postscriptName: string[] = [];
  const fontFamily: string[] = [];
  const name: string[] = [];
  const color: string[] = [];
  const fontSize: number[] = [];
  const letterSpacing: number[] = [];
  const lineHeight: number[] = [];
  const autoLineHeight: boolean[] = [];
  const paragraphSpacing: number[] = [];
  const textAlign: TEXT_ALIGN[] = [];
  const textVerticalAlign: TEXT_VERTICAL_ALIGN[] = [node.computedStyle.textVerticalAlign];
  const textBehaviour: TextProps['textBehaviour'][] = [];
  const fontWeight: string[] = [];
  const richList = node.getCursorRich();
  const { lineHeight: lh } = node.style;
  for (let i = 0, len = richList.length; i < len; i++) {
    putInfo(
      node,
      lh,
      valid,
      postscriptName,
      fontFamily,
      name,
      color,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      autoLineHeight,
      paragraphSpacing,
      textAlign,
      textBehaviour,
      richList[i],
      true,
    );
  }
  let fontWeightList: { label: string, value: string  }[] = [];
  if (fontFamily.length === 1) {
    fontWeightList = getFontWeightList(fontFamily[0]);
  }
  return {
    valid,
    postscriptName,
    fontFamily,
    name,
    fontWeight,
    fontWeightList,
    color,
    fontSize,
    autoLineHeight,
    lineHeight,
    letterSpacing,
    paragraphSpacing,
    textAlign,
    textVerticalAlign,
    textBehaviour,
  };
}

export function setTextBehaviour(node: Text, behaviour: TextProps['textBehaviour']) {
  const next: ResizeStyle = {};
  const style = node.getStyle();
  const { left, right, top, bottom, width, height } = style;
  if (behaviour === 'auto') {
    // width不自动时设置为auto
    if (width.u !== StyleUnit.AUTO) {
      next.width = 'auto';
    }
    // height不自动时设置为auto
    if (height.u !== StyleUnit.AUTO) {
      next.height = 'auto';
    }
    // 如果left和right都不是auto，需要将一方设置为auto，优先保证px单位，都是px是优先保证left
    if (left.u !== StyleUnit.AUTO && right.u !== StyleUnit.AUTO) {
      if (left.u === StyleUnit.PX) {
        next.right = 'auto';
      }
      else if (right.u === StyleUnit.PX) {
        next.left = 'auto';
      }
      else {
        next.right = 'auto';
      }
    }
    // 如果top和bottom都不是auto，需要将一方设置为auto，优先保证px单位，都是px是优先保证top
    if (top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO) {
      if (top.u === StyleUnit.PX) {
        next.bottom = 'auto';
      }
      else if (bottom.u === StyleUnit.PX) {
        next.top = 'auto';
      }
      else {
        next.bottom = 'auto';
      }
    }
  }
  else if (behaviour === 'autoH') {
    // width不固定时设置为固定px，但要排除left和right都是PX的情况
    if (width.u !== StyleUnit.PX && !(left.u === StyleUnit.PX && right.u === StyleUnit.PX)) {
      next.width = node.width;
    }
    // height不自动时设置为auto
    if (height.u !== StyleUnit.AUTO) {
      next.height = 'auto';
    }
    // 如果left和right都不是auto，需要将一方设置为auto，优先保证px单位因为那是靠边固定，两边都是px不动
    if (left.u !== StyleUnit.AUTO && right.u !== StyleUnit.AUTO && !(left.u === StyleUnit.PX && right.u === StyleUnit.PX)) {
      if (left.u === StyleUnit.PX) {
        if (right.u === StyleUnit.PERCENT) {
          next.right = 'auto';
        }
      }
      else if (right.u === StyleUnit.PX) {
        if (left.u === StyleUnit.PERCENT) {
          next.left = 'auto';
        }
      }
      else {
        next.right = 'auto';
      }
    }
    // 如果top和bottom都不是auto，需要将一方设置为auto，优先保证px单位，都是px是优先保证top
    if (top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO) {
      if (top.u === StyleUnit.PX) {
        next.bottom = 'auto';
      }
      else if (bottom.u === StyleUnit.PX) {
        next.top = 'auto';
      }
      else {
        next.bottom = 'auto';
      }
    }
  }
  else if (behaviour === 'fixed') {
    // width不固定时设置为固定px，但要排除left和right都是PX的情况
    if (width.u !== StyleUnit.PX && !(left.u === StyleUnit.PX && right.u === StyleUnit.PX)) {
      next.width = node.width;
    }
    // height同上
    if (height.u !== StyleUnit.PX && !(top.u === StyleUnit.PX && bottom.u === StyleUnit.PX)) {
      next.height = node.height;
    }
    // 如果left和right都不是auto，需要将一方设置为auto，优先保证px单位因为那是靠边固定，两边都是px不动
    if (left.u !== StyleUnit.AUTO && right.u !== StyleUnit.AUTO && !(left.u === StyleUnit.PX && right.u === StyleUnit.PX)) {
      if (left.u === StyleUnit.PX) {
        if (right.u === StyleUnit.PERCENT) {
          next.right = 'auto';
        }
      }
      else if (right.u === StyleUnit.PX) {
        if (left.u === StyleUnit.PERCENT) {
          next.left = 'auto';
        }
      }
      else {
        next.right = 'auto';
      }
    }
    // top和bottom同上
    if (top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO && !(top.u === StyleUnit.PX && bottom.u === StyleUnit.PX)) {
      if (top.u === StyleUnit.PX) {
        if (bottom.u === StyleUnit.PERCENT) {
          next.bottom = 'auto';
        }
      }
      else if (bottom.u === StyleUnit.PX) {
        if (top.u === StyleUnit.PERCENT) {
          next.top = 'auto';
        }
      }
      else {
        next.bottom = 'auto';
      }
    }
  }
  node.startSizeChange();
  node.updateStyle(next);
  node.endSizeChange(style);
  node.checkPosSizeUpward();
}

export function createText(content: string, style?: Partial<JStyle>) {
  return new Text({
    uuid: uuid.v4(),
    name: content,
    index: 0,
    style: {
      ...style,
      fontFamily: 'Arial',
      fontStyle: 'normal',
      fontWeight: 400,
      fontSize: 16,
      lineHeight: 0,
      textAlign: 'left',
      textDecoration: [],
      letterSpacing: 0,
      paragraphSpacing: 0,
      color: '#000',
    },
    content,
    rich: [{
      location: 0,
      length: 4,
      ...style,
      fontFamily: 'Arial',
      fontStyle: 'normal',
      fontWeight: 400,
      fontSize: 16,
      lineHeight: 0,
      textAlign: 'left',
      textDecoration: [],
      letterSpacing: 0,
      paragraphSpacing: 0,
      color: '#000',
    }],
    textBehaviour: 'auto',
  });
}

export default {
  SIZE_LIST,
  getTextInfo,
  getEditTextInfo,
  getTextBehaviour,
  setTextBehaviour,
  getFontWeightList,
  createText,
};
