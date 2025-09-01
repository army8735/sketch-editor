import {
  ArtBoardProps,
  BitmapProps,
  JContainer,
  JFrame,
  JGraphic,
  JGroup,
  JLayer,
  JNode,
  JSymbolInstance,
  JSymbolMaster,
  PolylineProps,
  ShapeGroupProps,
  SymbolInstanceProps,
  SymbolMasterProps,
  TAG_NAME,
  TextProps,
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
import Frame from './Frame';
import Graphic from './Graphic';

export function parse(json: JLayer, root: Root): Node | undefined {
  const tagName = json.tagName;
  if (tagName === TAG_NAME.SYMBOL_MASTER) {
    const props = json.props as SymbolMasterProps;
    const symbolId = props.symbolId;
    // 解析page前第一次收集所有page上的sm初始化
    if (!root.symbolMasters[symbolId]) {
      const children = [];
      const cd = (json as JContainer).children || [];
      for (let i = 0, len = cd.length; i < len; i++) {
        const res = parse(cd[i], root);
        if (res) {
          children.push(res);
        }
      }
      root.symbolMasters[symbolId] = new SymbolMaster(props, children);
    }
    return root.symbolMasters[symbolId];
  }
  else if (tagName === TAG_NAME.ART_BOARD
    || tagName === TAG_NAME.GROUP
    || tagName === TAG_NAME.SHAPE_GROUP
    || tagName === TAG_NAME.FRAME
    || tagName === TAG_NAME.GRAPHIC) {
    const children = [];
    const cd = (json as JContainer).children || [];
    for (let i = 0, len = cd.length; i < len; i++) {
      const res = parse(cd[i], root);
      if (res) {
        children.push(res);
      }
    }
    if (tagName === TAG_NAME.ART_BOARD) {
      return new ArtBoard(json.props as ArtBoardProps, children);
    }
    else if (tagName === TAG_NAME.GROUP) {
      return new Group(json.props, children);
    }
    else if (tagName === TAG_NAME.SHAPE_GROUP) {
      return new ShapeGroup(json.props as ShapeGroupProps, children);
    }
    else if (tagName === TAG_NAME.FRAME) {
      return new Frame(json.props, children);
    }
    else if (tagName === TAG_NAME.GRAPHIC) {
      return new Graphic(json.props, children);
    }
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
  else if (tagName === TAG_NAME.BITMAP) {
    return new Bitmap(json.props as BitmapProps);
  }
  else if (tagName === TAG_NAME.TEXT) {
    return new Text(json.props as TextProps);
  }
  else if (tagName === TAG_NAME.POLYLINE) {
    return new Polyline(json.props as PolylineProps);
  }
  else if (tagName === TAG_NAME.SLICE) {
    return new Slice(json.props);
  }
}

export function sortSymbolMasters(list: JSymbolMaster[]) {
  // 递归遍历分析依赖
  const depHash: Record<string, string[]> = {};
  const symbolHash: Record<string, JSymbolMaster> = {};
  list.forEach((item, i) => {
    const id = item.props.symbolId;
    scan(id, item.children || [], depHash);
    symbolHash[id] = item;
  });
  const recordHash: Record<string, boolean> = {};
  // 将被依赖放在list前面，不能使用自带的sort，因为可能会产生优化遗漏掉比较，需要手动遍历一遍
  const res: JSymbolMaster[] = [];
  list.forEach(item => {
    const id = item.props.symbolId;
    if (recordHash[id]) {
      return;
    }
    let depList = depHash[id];
    const temp: JSymbolMaster[] = [];
    // 深度遍历
    while (depList && depList.length) {
      const o = symbolHash[depList.shift()!];
      // 一般不可能，除非脏数据，兜底
      if (!o) {
        continue;
      }
      const id = o.props.symbolId;
      if (recordHash[id]) {
        continue;
      }
      recordHash[id] = true;
      // 被依赖的放在temp前面，最终按顺序存入res结果
      temp.unshift(o);
      if (depHash[id]) {
        depList.unshift(...depHash[id]);
      }
    }
    if (temp.length) {
      res.push(...temp);
    }
    // 不可能，除非脏数据循环依赖，兜底
    if (recordHash[id]) {
      return;
    }
    recordHash[id] = true;
    res.push(item);
  });
  return res;
}

/**
 * 所有的symbolMaster递归分析，找到symbolInstance的时候，记录个依赖关系到hash中，
 * 形成k->v：symbolMaster->symbolInstance[]，即sm包含的si子节点们。
 */
function scan(id: string, children: JNode[], hash: Record<string, string[]>) {
  children.forEach(item => {
    // symbolMaster包含symbolMaster，一般不会出现，兜底
    if (item.tagName === TAG_NAME.SYMBOL_MASTER) {
      const id2 = (item as JSymbolMaster).props.symbolId;
      if (id2) {
        hash[id] = hash[id] || [];
        hash[id].push(id2);
      }
      scan(id2, (item as JSymbolMaster).children || [], hash);
    }
    else if (item.tagName === TAG_NAME.SYMBOL_INSTANCE) {
      const id2 = (item as JSymbolInstance).props.symbolId;
      if (id2) {
        hash[id] = hash[id] || [];
        hash[id].push(id2);
      }
    }
    else if (item.tagName === TAG_NAME.GROUP) {
      const cd = (item as JGroup).children || [];
      scan(id, cd, hash);
    }
    else if (item.tagName === TAG_NAME.FRAME) {
      const cd = (item as JFrame).children || [];
      scan(id, cd, hash);
    }
    else if (item.tagName === TAG_NAME.GRAPHIC) {
      const cd = (item as JGraphic).children || [];
      scan(id, cd, hash);
    }
  });
}

export default {
  parse,
  sortSymbolMasters,
};
