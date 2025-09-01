import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { Override, SymbolInstanceProps, SymbolMasterProps, TAG_NAME } from '../format';
import SymbolMaster from './SymbolMaster';
import AbstractFrame from './AbstractFrame';
import Node from './Node';
import { color2gl } from '../style/color';

class SymbolInstance extends AbstractFrame {
  symbolMaster: SymbolMaster;
  scale: number;

  constructor(props: SymbolInstanceProps, symbolMaster: SymbolMaster) {
    const overrideValues = props.overrideValues || {};
    const children = symbolMaster.children.map(item => item.cloneAndLink(overrideValues));
    super(props, children);
    this.isSymbolInstance = true;
    this.symbolMaster = symbolMaster;
    this.scale = props.scale || 1;
    symbolMaster.addSymbolInstance(this);
  }

  // 特殊，使用同一个sm，没法filter，因为禁止修改
  override clone(filter?: (node: Node) => boolean) {
    const props = this.cloneProps() as SymbolInstanceProps;
    const res = new SymbolInstance(props, this.symbolMaster);
    return res;
  }

  override cloneAndLink(overrides?: Record<string, Override[]>) {
    const props = this.cloneProps() as SymbolInstanceProps;
    const oldUUid = this.uuid;
    if (overrides && overrides.hasOwnProperty(oldUUid)) {
      overrides[oldUUid].forEach(item => {
        const { key, value } = item;
        if (key[0] === 'fill') {
          props.style!.fill = [value];
        }
      });
    }
    props.overrideValues = overrides;
    const res = new SymbolInstance(props, this.symbolMaster);
    return res;
  }

  // 背景色渲染使用sm的
  override calContent() {
    return this.hasContent = this.symbolMaster.hasContent;
  }

  override renderCanvas(scale: number) {
    super.renderCanvas(scale, this.symbolMaster.computedStyle);
  }

  override toJson() {
    const res = super.toJson();
    res.tagName = TAG_NAME.SYMBOL_INSTANCE;
    return res;
  }

  override async toSketchJson(zip: JSZip, blobHash?: Record<string, string>) {
    const json = await super.toSketchJson(zip, blobHash) as SketchFormat.SymbolInstance;
    json._class = SketchFormat.ClassValue.SymbolInstance;
    json.symbolID = (this.symbolMaster.props as SymbolMasterProps).symbolId;
    json.overrideValues = [];
    const ov = (this.props as SymbolInstanceProps).overrideValues;
    for (let uuid in ov) {
      if (ov.hasOwnProperty(uuid)) {
        const list = ov[uuid];
        list.forEach(item => {
          const { key, value } = item;
          if (key[0] === 'content') {
            json.overrideValues.push({
              _class: SketchFormat.ClassValue.OverrideValue,
              value,
              overrideName: uuid + '_stringValue',
            });
          }
          else if (key[0] === 'fontSize') {
            json.overrideValues.push({
              _class: SketchFormat.ClassValue.OverrideValue,
              value: value.toString(),
              overrideName: uuid + '_textSize',
            });
          }
          else if (key[0] === 'color') {
            const c = color2gl(value);
            json.overrideValues.push({
              _class: SketchFormat.ClassValue.OverrideValue,
              value: {
                // @ts-ignore
                _class: SketchFormat.ClassValue.Color,
                red: c[0],
                green: c[1],
                blue: c[2],
                alpha: c[3],
              },
              overrideName: uuid + '_textColor',
            });
          }
          else if (key[0] === 'fill') {
            const c = color2gl(value);
            json.overrideValues.push({
              _class: SketchFormat.ClassValue.OverrideValue,
              value: {
                // @ts-ignore
                _class: SketchFormat.ClassValue.Color,
                red: c[0],
                green: c[1],
                blue: c[2],
                alpha: c[3],
              },
              overrideName: uuid + '_color:' + key.join('-'),
            });
          }
          else if (key[0] === 'stroke') {
            const c = color2gl(value);
            json.overrideValues.push({
              _class: SketchFormat.ClassValue.OverrideValue,
              value: {
                // @ts-ignore
                _class: SketchFormat.ClassValue.Color,
                red: c[0],
                green: c[1],
                blue: c[2],
                alpha: c[3],
              },
              overrideName: uuid + '_color:border-' + key.slice(1).join('-'),
            });
          }
        });
      }
    }
    return json;
  }
}

export default SymbolInstance;
