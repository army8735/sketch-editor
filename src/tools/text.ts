import Text from '../node/Text';
import { color2hexStr } from '../style/css';
import { StyleNumValue, StyleUnit, TEXT_ALIGN } from '../style/define';
import fontInfo from '../style/font';
import { JStyle } from '../format';

export enum TEXT_BEHAVIOUR {
  AUTO = 0,
  FIXED_W = 1,
  FIXED_W_H = 2,
}

export const SIZE_LIST = [
  6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 21, 24, 36, 48, 60, 72,
];

function putData(
  left: StyleNumValue,
  right: StyleNumValue,
  top: StyleNumValue,
  bottom: StyleNumValue,
  width: StyleNumValue,
  height: StyleNumValue,
  lh: StyleNumValue,
  valid: boolean[],
  fontFamily: string[],
  name: string[],
  color: string[],
  fontSize: number[],
  letterSpacing: number[],
  lineHeight: number[],
  autoLineHeight: boolean[],
  paragraphSpacing: number[],
  textAlign: TEXT_ALIGN[],
  textBehaviour: TEXT_BEHAVIOUR[],
  obj: any,
) {
  const {
    fontFamily: ff,
    color: c,
    fontSize: fs,
    letterSpacing: ls,
    lineHeight: lh2,
    paragraphSpacing: ps,
    textAlign: ta,
  } = obj;
  const ff2 = ff.toLowerCase();
  const o = fontInfo.data[ff2];
  if (o) {
    if (!fontFamily.includes(ff2)) {
      fontFamily.push(ff2);
      name.push(o.name);
    }
    valid.push(true);
  }
  else {
    if (!fontFamily.includes(ff2)) {
      fontFamily.push(ff2);
      name.push(ff2);
    }
    valid.push(false);
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
  if (!lineHeight.includes(lh2)) {
    lineHeight.push(lh2);
  }
  const auto = lh.u === StyleUnit.AUTO;
  if (!autoLineHeight.includes(auto)) {
    autoLineHeight.push(auto);
  }
  if (!paragraphSpacing.includes(ps)) {
    paragraphSpacing.push(ps);
  }
  if (!textAlign.includes(ta)) {
    textAlign.push(ta);
  }
  let tb = TEXT_BEHAVIOUR.AUTO;

  const autoW = width.u === StyleUnit.AUTO
    && (left.u === StyleUnit.AUTO || right.u === StyleUnit.AUTO);
  const autoH = height.u === StyleUnit.AUTO
    && (top.u === StyleUnit.AUTO || bottom.u === StyleUnit.AUTO);
  if (autoW && autoH) {
  }
  else if (autoH) {
    tb = TEXT_BEHAVIOUR.FIXED_W;
  }
  else {
    tb = TEXT_BEHAVIOUR.FIXED_W_H;
  }
  if (!textBehaviour.includes(tb)) {
    textBehaviour.push(tb);
  }
}

export function getData(nodes: Text[]) {
  const valid: boolean[] = [];
  const fontFamily: string[] = [];
  const name: string[] = [];
  const color: string[] = [];
  const fontSize: number[] = [];
  const letterSpacing: number[] = [];
  const lineHeight: number[] = [];
  const autoLineHeight: boolean[] = [];
  const paragraphSpacing: number[] = [];
  const textAlign: TEXT_ALIGN[] = [];
  const textBehaviour: TEXT_BEHAVIOUR[] = [];
  for (let i = 0, len = nodes.length; i < len; i++) {
    const { rich, style, computedStyle } = nodes[i];
    const { left, right, top, bottom, width, height, lineHeight: lh } = style;
    if (rich && rich.length) {
      for (let i = 0, len = rich.length; i < len; i++) {
        putData(
          left,
          right,
          top,
          bottom,
          width,
          height,
          lh,
          valid,
          fontFamily,
          name,
          color,
          fontSize,
          letterSpacing,
          lineHeight,
          autoLineHeight,
          paragraphSpacing,
          textAlign,
          textBehaviour,
          rich[i],
        );
      }
      continue;
    }
    putData(
      left,
      right,
      top,
      bottom,
      width,
      height,
      lh,
      valid,
      fontFamily,
      name,
      color,
      fontSize,
      letterSpacing,
      lineHeight,
      autoLineHeight,
      paragraphSpacing,
      textAlign,
      textBehaviour,
      computedStyle,
    );
  }
  const { fontWeight, fontWeightList } = getWeight(fontFamily);
  return {
    valid,
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
    textBehaviour,
  };
}

function getWeight(fontFamily: string[]) {
  let fontWeight: string[] = [];
  const fontWeightList: Array<{ label: string; value: string }> = [];
  fontFamily.forEach(ff => {
    const data = fontInfo.data[ff.toLowerCase()];
    if (data) {
      const list = data.list;
      for (let i = 0, len = list.length; i < len; i++) {
        const item = list[i];
        fontWeightList.push({ label: item.style, value: item.postscriptName });
        if (item.postscriptName === ff.toLowerCase()) {
          if (!fontWeight.includes(item.style)) {
            fontWeight.push(item.style);
          }
        }
      }
    }
  });
  if (!fontWeight.length) {
    fontWeight.push('Regular'); // 不支持的字体默认Regular
  }
  return { fontWeight, fontWeightList };
}

export function getEditData(node: Text) {
  const { rich, style } = node;
  // 一般不可能，有内容都会有个rich内容，这里兜个底，只有1个rich也复用逻辑
  if (!rich.length) {
    return getData([node]);
  }
  const valid: boolean[] = [];
  const fontFamily: string[] = [];
  const name: string[] = [];
  const color: string[] = [];
  const fontSize: number[] = [];
  const letterSpacing: number[] = [];
  const lineHeight: number[] = [];
  const autoLineHeight: boolean[] = [];
  const paragraphSpacing: number[] = [];
  const textAlign: TEXT_ALIGN[] = [];
  const textBehaviour: TEXT_BEHAVIOUR[] = [];
  const richList = node.getCursorRich();
  const { left, right, top, bottom, width, height, lineHeight: lh } = style;
  for (let i = 0, len = richList.length; i < len; i++) {
    putData(
      left,
      right,
      top,
      bottom,
      width,
      height,
      lh,
      valid,
      fontFamily,
      name,
      color,
      fontSize,
      letterSpacing,
      lineHeight,
      autoLineHeight,
      paragraphSpacing,
      textAlign,
      textBehaviour,
      richList[i],
    );
  }
  const { fontWeight, fontWeightList } = getWeight(fontFamily);
  return {
    valid,
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
    textBehaviour,
  };
}

type UB = {
  prev: Partial<JStyle>,
  next: Partial<JStyle>,
};

export function updateBehaviour(node: Text, behaviour: TEXT_BEHAVIOUR) {
  const prev: Partial<JStyle> = {};
  const next: Partial<JStyle> = {};
  const { style, computedStyle, parent } = node;
  const { left, right, top, bottom, width, height } = style;
  if (behaviour === TEXT_BEHAVIOUR.AUTO) {
    // width不自动时设置为auto
    if (width.u !== StyleUnit.AUTO) {
      if (width.u === StyleUnit.PX) {
        prev.width = width.v;
      }
      else if (width.u === StyleUnit.PERCENT) {
        prev.width = width.v * 0.01 + '%';
      }
      next.width = 'auto';
    }
    // height不自动时设置为auto
    if (height.u !== StyleUnit.AUTO) {
      if (height.u === StyleUnit.PX) {
        prev.height = height.v;
      }
      else if (height.u === StyleUnit.PERCENT) {
        prev.height = height.v * 0.01 + '%';
      }
      next.height = 'auto';
    }
    // 如果left和right都不是auto，需要将一方设置为auto，优先保证px单位，都是px是优先保证left
    if (left.u !== StyleUnit.AUTO && right.u !== StyleUnit.AUTO) {
      if (left.u === StyleUnit.PX) {
        if (right.u === StyleUnit.PX) {
          prev.right = right.v;
        }
        else if (right.u === StyleUnit.PERCENT) {
          prev.right = right.v * 0.01 + '%';
        }
        next.right = 'auto';
      }
      else if (right.u === StyleUnit.PX) {
        if (left.u === StyleUnit.PERCENT) {
          prev.left = left.v * 0.01 + '%';
        }
        next.left = 'auto';
      }
      else {
        if (right.u === StyleUnit.PERCENT) {
          prev.right = right.v * 0.01 + '%';
        }
        next.right = 'auto';
      }
    }
    // 如果top和bottom都不是auto，需要将一方设置为auto，优先保证px单位，都是px是优先保证top
    if (top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO) {
      if (top.u === StyleUnit.PX) {
        if (bottom.u === StyleUnit.PX) {
          prev.bottom = bottom.v;
        }
        else if (bottom.u === StyleUnit.PERCENT) {
          prev.bottom = bottom.v * 0.01 + '%';
        }
        next.bottom = 'auto';
      }
      else if (bottom.u === StyleUnit.PX) {
        if (top.u === StyleUnit.PERCENT) {
          prev.top = top.v * 0.01 + '%';
        }
        next.top = 'auto';
      }
      else {
        if (bottom.u === StyleUnit.PERCENT) {
          prev.bottom = bottom.v * 0.01 + '%';
        }
        next.bottom = 'auto';
      }
    }
  }
  else if (behaviour === TEXT_BEHAVIOUR.FIXED_W) {
    // width不固定时设置为固定px，但要排除left和right都是PX的情况
    if (width.u !== StyleUnit.PX && !(left.u === StyleUnit.PX && right.u === StyleUnit.PX)) {
      if (width.u === StyleUnit.AUTO) {
        prev.width = 'auto';
      }
      else if (width.u === StyleUnit.PERCENT) {
        prev.width = width.v * 0.01 + '%';
      }
      next.width = node.width;
    }
    // height不自动时设置为auto
    if (height.u !== StyleUnit.AUTO) {
      if (height.u === StyleUnit.PX) {
        prev.height = height.v;
      }
      else if (height.u === StyleUnit.PERCENT) {
        prev.height = height.v * 0.01 + '%';
      }
      next.height = 'auto';
    }
    // 如果left和right都不是auto，需要将一方设置为auto，优先保证px单位因为那是靠边固定，两边都是px不动
    if (left.u !== StyleUnit.AUTO && right.u !== StyleUnit.AUTO && !(left.u === StyleUnit.PX && right.u === StyleUnit.PX)) {
      if (left.u === StyleUnit.PX) {
        if (right.u === StyleUnit.PERCENT) {
          prev.right = right.v * 0.01 + '%';
          next.right = 'auto';
        }
      }
      else if (right.u === StyleUnit.PX) {
        if (left.u === StyleUnit.PERCENT) {
          prev.left = right.v * 0.01 + '%';
          next.left = 'auto';
        }
      }
      else {
        prev.right = right.v * 0.01 + '%';
        next.right = 'auto';
      }
    }
    // 如果top和bottom都不是auto，需要将一方设置为auto，优先保证px单位，都是px是优先保证top
    if (top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO) {
      if (top.u === StyleUnit.PX) {
        if (bottom.u === StyleUnit.PX) {
          prev.bottom = bottom.v;
        }
        else if (bottom.u === StyleUnit.PERCENT) {
          prev.bottom = bottom.v * 0.01 + '%';
        }
        next.bottom = 'auto';
      }
      else if (bottom.u === StyleUnit.PX) {
        if (top.u === StyleUnit.PERCENT) {
          prev.top = top.v * 0.01 + '%';
        }
        next.top = 'auto';
      }
      else {
        if (bottom.u === StyleUnit.PERCENT) {
          prev.bottom = bottom.v * 0.01 + '%';
        }
        next.bottom = 'auto';
      }
    }
  }
  else if (behaviour === TEXT_BEHAVIOUR.FIXED_W_H) {
    // width不固定时设置为固定px，但要排除left和right都是PX的情况
    if (width.u !== StyleUnit.PX && !(left.u === StyleUnit.PX && right.u === StyleUnit.PX)) {
      if (width.u === StyleUnit.AUTO) {
        prev.width = 'auto';
      }
      else if (width.u === StyleUnit.PERCENT) {
        prev.width = width.v * 0.01 + '%';
      }
      next.width = node.width;
    }
    // height同上
    if (height.u !== StyleUnit.PX && !(top.u === StyleUnit.PX && bottom.u === StyleUnit.PX)) {
      if (height.u === StyleUnit.AUTO) {
        prev.height = 'auto';
      }
      else if (height.u === StyleUnit.PERCENT) {
        prev.height = height.v * 0.01 + '%';
      }
      next.height = node.height;
    }
    // 如果left和right都不是auto，需要将一方设置为auto，优先保证px单位因为那是靠边固定，两边都是px不动
    if (left.u !== StyleUnit.AUTO && right.u !== StyleUnit.AUTO && !(left.u === StyleUnit.PX && right.u === StyleUnit.PX)) {
      if (left.u === StyleUnit.PX) {
        if (right.u === StyleUnit.PERCENT) {
          prev.right = right.v * 0.01 + '%';
          next.right = 'auto';
        }
      }
      else if (right.u === StyleUnit.PX) {
        if (left.u === StyleUnit.PERCENT) {
          prev.left = right.v * 0.01 + '%';
          next.left = 'auto';
        }
      }
      else {
        prev.right = right.v * 0.01 + '%';
        next.right = 'auto';
      }
    }
    // top和bottom同上
    if (top.u !== StyleUnit.AUTO && bottom.u !== StyleUnit.AUTO && !(top.u === StyleUnit.PX && bottom.u === StyleUnit.PX)) {
      if (top.u === StyleUnit.PX) {
        if (bottom.u === StyleUnit.PERCENT) {
          prev.bottom = bottom.v * 0.01 + '%';
          next.bottom = 'auto';
        }
      }
      else if (bottom.u === StyleUnit.PX) {
        if (top.u === StyleUnit.PERCENT) {
          prev.top = bottom.v * 0.01 + '%';
          next.top = 'auto';
        }
      }
      else {
        prev.bottom = bottom.v * 0.01 + '%';
        next.bottom = 'auto';
      }
    }
  }
  node.startSizeChange();
  node.updateStyle(next);
  node.endSizeChange(node.style);
  node.checkPosSizeUpward();
  return { prev, next };
}

export default {
  TEXT_BEHAVIOUR,
  SIZE_LIST,
  getData,
  getEditData,
  updateBehaviour,
};
