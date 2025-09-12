import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { SymbolMasterProps, TAG_NAME } from '../format';
import AbstractFrame from './AbstractFrame';
import Node from './Node';
import SymbolInstance from './SymbolInstance';
import { RefreshLevel } from '../refresh/level';
import { LayoutData } from './layout';

class SymbolMaster extends AbstractFrame {
  includeBackgroundColorInInstance: boolean;
  symbolInstances: SymbolInstance[];
  hasLayout: boolean;

  constructor(props: SymbolMasterProps, children: Array<Node>) {
    super(props, children);
    this.includeBackgroundColorInInstance = !!props.includeBackgroundColorInInstance;
    this.isSymbolMaster = true;
    this.symbolInstances = [];
    // 会首先作为依赖出现，先计算自己是否有内容，这样symbolInstance里渲染时才有背景色
    this.calRepaintStyle(RefreshLevel.NONE);
    this.calContent();
    this.hasLayout = false;
  }

  /**
   * 特殊判断，因为智能布局si依赖sm的布局，sm可能不在page中或者是外部sm，或者sm在si后面还未布局，
   * 所以si在布局前都会检测一遍让sm提前先布局，但可能出现多个si依赖同一个sm，或者sm在si前已经布局过了，
   * 所以为了必要的提前布局且只布局一次不重复计算，hasLayout用在这里，另外addUpdate()更新时，
   * 如果牵扯到布局，也需要将hasLayout置false
   */
  override layout(data: LayoutData) {
    if (this.hasLayout) {
      return;
    }
    this.hasLayout = true;
    super.layout(data);
  }

  addSymbolInstance(item: SymbolInstance) {
    if (this.symbolInstances.indexOf(item) === -1) {
      this.symbolInstances.push(item);
    }
  }

  removeSymbolInstance(item: SymbolInstance) {
    const i = this.symbolInstances.indexOf(item);
    if (i > -1) {
      this.symbolInstances.splice(i, 1);
    }
  }

  override cloneProps() {
    const props = super.cloneProps() as SymbolMasterProps;
    props.includeBackgroundColorInInstance = this.includeBackgroundColorInInstance;
    return props;
  }

  override clone(filter?: (node: Node) => boolean) {
    const props = this.cloneProps();
    const children = filter ? this.children.filter(filter) : this.children;
    const res = new SymbolMaster(props, children.map(item => item.clone(filter)));
    return res;
  }

  override toJson() {
    const res = super.toJson();
    res.tagName = TAG_NAME.SYMBOL_MASTER;
    return res;
  }

  override async toSketchJson(zip: JSZip, blobHash?: Record<string, string>) {
    const json = await super.toSketchJson(zip, blobHash) as SketchFormat.SymbolMaster;
    json._class = SketchFormat.ClassValue.SymbolMaster;
    json.symbolID = (this.props as SymbolMasterProps).symbolId;
    const list = await Promise.all(this.children.map(item => {
      return item.toSketchJson(zip, blobHash);
    }));
    json.layers = list.map(item => {
      return item as SketchFormat.Group |
        SketchFormat.Oval |
        SketchFormat.Polygon |
        SketchFormat.Rectangle |
        SketchFormat.ShapePath |
        SketchFormat.Star |
        SketchFormat.Triangle |
        SketchFormat.ShapeGroup |
        SketchFormat.Text |
        SketchFormat.SymbolInstance |
        SketchFormat.Slice |
        SketchFormat.Hotspot |
        SketchFormat.Bitmap;
    });
    return json;
  }
}

export default SymbolMaster;
