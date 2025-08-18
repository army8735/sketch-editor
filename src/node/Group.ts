import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { Override, Props, TAG_NAME } from '../format';
import { Style } from '../style/define';
import Node from './Node';
import Text from './Text';
import Geom from './geom/Geom';
import ShapeGroup from './geom/ShapeGroup';
import AbstractGroup from './AbstractGroup';

class Group extends AbstractGroup {

  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isGroup = true;
  }

  override updateFormatStyle(style: Partial<Style>, cb?: ((sync: boolean) => void), noRefresh = false) {
    const res = super.updateFormatStyle(style, cb, noRefresh);
    const keys = res.keys;
    if (keys.includes('fill') || keys.includes('fillEnable') || keys.includes('fillOpacity')) {
      const root = this.root!;
      const struct = this.struct;
      const total = struct.total;
      const structs = root.structs;
      let i = structs.indexOf(struct);
      if (i > -1) {
        i++;
        for(let len = i + total; i < len; i++) {
          const node = structs[i].node;
          if (node instanceof Text || node instanceof Geom || node instanceof ShapeGroup) {
            node.clearTint();
            // 如果节点有mask、filter，需清理重新生成，同时向上清理total
            if (node.mask) {
              node.mask.clearMask();
            }
            node.clearCache();
            node.clearCacheUpward();
          }
        }
      }
    }
    return res;
  }

  override clone(filter?: (node: Node) => boolean) {
    const props = this.cloneProps();
    const children = filter ? this.children.filter(filter) : this.children;
    const res = new Group(props, children.map(item => item.clone(filter)));
    return res;
  }

  override cloneAndLink(overrides?: Record<string, Override[]>) {
    const props = this.cloneProps();
    const res = new Group(props, this.children.map(item => item.cloneAndLink(overrides)));
    return res;
  }

  override toJson() {
    const res = super.toJson();
    res.tagName = TAG_NAME.GROUP;
    return res;
  }

  override async toSketchJson(zip: JSZip, blobHash?: Record<string, string>) {
    const json = await super.toSketchJson(zip, blobHash) as SketchFormat.Group;
    json._class = SketchFormat.ClassValue.Group;
    json.hasClickThrough = false;
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

export default Group;
