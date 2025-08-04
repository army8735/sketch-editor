import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import Node from './Node';
import { Props, TAG_NAME } from '../format';

class Slice extends Node {
  constructor(props: Props) {
    super(props);
    this.isSlice = true;
  }

  override clone(filter?: (node: Node) => boolean) {
    const props = this.cloneProps();
    const res = new Slice(props);
    return res;
  }

  override calContent() {
    return this.hasContent = false;
  }

  override toJson() {
    const res = super.toJson();
    res.tagName = TAG_NAME.SLICE;
    return res;
  }

  override async toSketchJson(zip: JSZip, blobHash?: Record<string, string>) {
    const json = await super.toSketchJson(zip, blobHash) as SketchFormat.Slice;
    json._class = SketchFormat.ClassValue.Slice;
    return json;
  }
}

export default Slice;
