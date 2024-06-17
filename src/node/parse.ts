import {
  JNode,
  SymbolMasterProps,
  SymbolInstanceProps,
  TAG_NAME,
  ArtBoardProps,
  BitmapProps,
  JContainer,
  PolylineProps,
  ShapeGroupProps,
  TextProps,
  JSymbolMaster,
  JGroup,
  JSymbolInstance,
  JLayer,
} from '../format/';
import ArtBoard from './ArtBoard';
import Bitmap from './Bitmap';
import Polyline from './geom/Polyline';
import ShapeGroup from './geom/ShapeGroup';
import Group from './Group';
import Node from './Node';
import SymbolMaster from './SymbolMaster';
import Text from './Text';
import SymbolInstance from './SymbolInstance';
import Slice from './Slice';
import Root from './Root';

export function parse(json: JLayer, root?: Root): Node | undefined {
  const tagName = json.tagName;
  if (tagName === TAG_NAME.ART_BOARD || tagName === TAG_NAME.SYMBOL_MASTER) {
    const children = [];
    for (let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i], root);
      if (res) {
        children.push(res);
      }
    }
    if (tagName === TAG_NAME.SYMBOL_MASTER) {
      const props = json.props as SymbolMasterProps;
      const symbolId = props.symbolId;
      /**
       * 初始化前会先生成所有SymbolMaster的实例，包含内部和外部的，并存到root的symbolMasters下
       * 后续进入控件页面时，页面是延迟初始化的，从json生成Node实例时，直接取缓存即可
       */
      return root?.symbolMasters[symbolId] || new SymbolMaster(props, children);
    }
    return new ArtBoard(json.props as ArtBoardProps, children);
  }
  else if (tagName === TAG_NAME.SYMBOL_INSTANCE) {
    const props = json.props as SymbolInstanceProps;
    const symbolId = props.symbolId;
    const sm = root?.symbolMasters[symbolId];
    // 应该有，前置逻辑保证被递归引用的maters先分析，可能人工或bug造成缺数据
    if (sm) {
      return new SymbolInstance(props, sm);
    }
  }
  else if (tagName === TAG_NAME.GROUP) {
    const children = [];
    for (let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i], root);
      if (res) {
        children.push(res);
      }
    }
    return new Group(json.props, children);
  }
  else if (tagName === TAG_NAME.BITMAP) {
    return new Bitmap(json.props as BitmapProps);
  }
  else if (tagName === TAG_NAME.TEXT) {
    return new Text(json.props as TextProps);
  }
  else if (tagName === TAG_NAME.POLYLINE) {
    return new Polyline(json.props as PolylineProps);
  }
  else if (tagName === TAG_NAME.SHAPE_GROUP) {
    const children = [];
    for (let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i], root);
      if (res) {
        children.push(res);
      }
    }
    return new ShapeGroup(json.props as ShapeGroupProps, children);
  }
  else if (tagName === TAG_NAME.SLICE) {
    return new Slice(json.props);
  }
}

export function sortSymbolMasters(list: JSymbolMaster[]) {
  // 递归遍历分析依赖
  const hash: Record<string, string> = {};
  list.forEach(item => {
    const id = item.props.symbolId;
    scan(id, item.children || [], hash);
  });
  list.sort((a, b) => {
    const id1 = a.props.symbolId;
    const id2 = b.props.symbolId;
    if (hash[id1] === id2) {
      return -1;
    }
    else if (hash[id2] === id1) {
      return 1;
    }
    return 0;
  });
  return list;
}

function scan(id: string, children: JNode[], hash: Record<string, string>) {
  children.forEach(item => {
    if (item.tagName === TAG_NAME.SYMBOL_MASTER) {
      const id2 = (item as JSymbolMaster).props.symbolId;
      hash[id2] = id;
      scan(id2, (item as JSymbolMaster).children || [], hash);
    }
    else if (item.tagName === TAG_NAME.SYMBOL_INSTANCE) {
      hash[(item as JSymbolInstance).props.symbolId] = id;
    }
    else if (item.tagName === TAG_NAME.GROUP) {
      const cd = (item as JGroup).children || [];
      scan(id, cd, hash);
    }
  });
}

export default {
  parse,
  sortSymbolMasters,
};
