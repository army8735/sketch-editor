import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { Props, TAG_NAME } from '../format';
import AbstractFrame from './AbstractFrame';
import Node from './Node';

class Frame extends AbstractFrame {
  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.isFrame = true;
  }

  override toJson() {
    const res = super.toJson();
    res.tagName = TAG_NAME.FRAME;
    return res;
  }

  override async toSketchJson(zip: JSZip, blobHash?: Record<string, string>) {
    const json = await super.toSketchJson(zip, blobHash) as SketchFormat.Group;
    json._class = SketchFormat.ClassValue.Group;
    json.hasClickThrough = false;
    // @ts-ignore
    json.groupBehavior = 1;
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

export default Frame;
