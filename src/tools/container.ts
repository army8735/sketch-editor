import Node from '../node/Node';
import Container from '../node/Container';
import { clone } from '../util/type';
import { StyleUnit } from '../style/define';
import { RemoveData } from '../history/RemoveCommand';

/**
 * 将child移动到parent内，并且保持原本的尺寸位置（相对于老parent的绝对计算值），
 * 用已有计算的computedStyle来赋值style定位新的parent，完成后根据style的原有单位换算style的新值。
 */
export function appendWithPosAndSize(node: Node, data: RemoveData) {
  const { style, computedStyle } = node;
  const { x, y, parent } = data;
  // 原始单位记录下来
  const top = clone(style.top);
  const right = clone(style.right);
  const bottom = clone(style.bottom);
  const left = clone(style.left);
  const width = clone(style.width);
  const height = clone(style.height);
  // 统一用左上+宽高来新定位
  style.left = {
    v: x,
    u: StyleUnit.PX,
  };
  style.right = {
    v: 0,
    u: StyleUnit.AUTO,
  };
  style.top = {
    v: y,
    u: StyleUnit.PX,
  };
  style.bottom = {
    v: 0,
    u: StyleUnit.AUTO,
  };
  style.width = {
    v: computedStyle.width,
    u: StyleUnit.PX,
  };
  style.height = {
    v: computedStyle.height,
    u: StyleUnit.PX,
  };
  appendWithIndex(parent, node);
  // 还原style原本的单位，需要重算一遍数值不能直接用已有的，因为%的情况parent可能发生了尺寸变化
  if (left.u === StyleUnit.PERCENT) {
    style.left = {
      v: computedStyle.left * 100 / parent.width,
      u: StyleUnit.PERCENT,
    };
  }
  else if (left.u === StyleUnit.PX) {
    style.left = {
      v: computedStyle.left,
      u: StyleUnit.PX,
    };
  }
  else if (left.u === StyleUnit.AUTO) {
    style.left = {
      v: 0,
      u: StyleUnit.AUTO,
    };
  }
  if (right.u === StyleUnit.PERCENT) {
    style.right = {
      v: computedStyle.right * 100 / parent.width,
      u: StyleUnit.PERCENT,
    };
  }
  else if (right.u === StyleUnit.PX) {
    style.right = {
      v: computedStyle.right,
      u: StyleUnit.PX,
    };
  }
  else if (right.u === StyleUnit.AUTO) {
    style.right = {
      v: 0,
      u: StyleUnit.AUTO,
    };
  }
  if (top.u === StyleUnit.PERCENT) {
    style.top = {
      v: computedStyle.top * 100 / parent.height,
      u: StyleUnit.PERCENT,
    };
  }
  else if (top.u === StyleUnit.PX) {
    style.top = {
      v: computedStyle.top,
      u: StyleUnit.PX,
    };
  }
  else if (top.u === StyleUnit.AUTO) {
    style.top = {
      v: 0,
      u: StyleUnit.AUTO,
    };
  }
  if (bottom.u === StyleUnit.PERCENT) {
    style.bottom = {
      v: computedStyle.bottom * 100 / parent.height,
      u: StyleUnit.PERCENT,
    };
  }
  else if (bottom.u === StyleUnit.PX) {
    style.bottom = {
      v: computedStyle.bottom,
      u: StyleUnit.PX,
    };
  }
  else if (bottom.u === StyleUnit.AUTO) {
    style.bottom = {
      v: 0,
      u: StyleUnit.AUTO,
    };
  }
  if (width.u === StyleUnit.PERCENT) {
    style.width = {
      v: computedStyle.width * 100 / parent.width,
      u: StyleUnit.PERCENT,
    };
  }
  else if (width.u === StyleUnit.PX) {
    style.width = {
      v: computedStyle.width,
      u: StyleUnit.PX,
    };
  }
  else if (width.u === StyleUnit.AUTO) {
    style.width = {
      v: 0,
      u: StyleUnit.AUTO,
    };
  }
  if (height.u === StyleUnit.PERCENT) {
    style.height = {
      v: computedStyle.height * 100 / parent.height,
      u: StyleUnit.PERCENT,
    };
  }
  else if (height.u === StyleUnit.PX) {
    style.height = {
      v: computedStyle.height,
      u: StyleUnit.PX,
    };
  }
  else if (height.u === StyleUnit.AUTO) {
    style.height = {
      v: 0,
      u: StyleUnit.AUTO,
    };
  }
}

export function appendWithIndex(parent: Container, node: Node) {
  // 利用小数索引找到正确的位置
  const children = parent.children;
  if (!children.length) {
    parent.appendChild(node);
  }
  else {
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      if (node.props.index < child.props.index) {
        child.insertBefore(node);
        break;
      }
      // 直到最后也没有
      else if (i === len - 1) {
        parent.appendChild(node);
        break;
      }
    }
  }
}

export default {
  appendWithPosAndSize,
  appendWithIndex,
};
