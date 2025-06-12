import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { JNode, Override, Props, TAG_NAME } from '../format';
import { Style } from '../style/define';
import Node from './Node';
import Text from './Text';
import Geom from './geom/Geom';
import { clone } from '../util/type';
import ShapeGroup from './geom/ShapeGroup';
import AbstractGroup from './AbstractGroup';

class Group extends AbstractGroup {

  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isGroup = true;
  }

  override didMount() {
    super.didMount();
    // 冒泡过程无需向下检测，直接向上
    this.adjustPosAndSize();
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

  override clone(override?: Record<string, Override[]>) {
    const props = clone(this.props);
    props.uuid = uuid.v4();
    props.sourceUuid = this.uuid;
    const res = new Group(props, this.children.map(item => item.clone(override)));
    res.style = clone(this.style);
    res.computedStyle = clone(this.computedStyle);
    return res;
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.GROUP;
    return res;
  }

  override async toSketchJson(zip: JSZip, filter?: (node: Node) => boolean): Promise<SketchFormat.Group> {
    const json = await super.toSketchJson(zip) as SketchFormat.Group;
    json._class = SketchFormat.ClassValue.Group;
    json.hasClickThrough = false;
    const list = await Promise.all(this.children.filter(item => {
      if (filter) {
        return filter(item);
      }
      return true;
    }).map(item => {
      return item.toSketchJson(zip);
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
