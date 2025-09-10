import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { Override, SymbolInstanceProps, SymbolMasterProps, TAG_NAME } from '../format';
import SymbolMaster from './SymbolMaster';
import AbstractFrame from './AbstractFrame';
import Node from './Node';
import { color2gl } from '../style/color';
import { DISPLAY, StyleUnit } from '../style/define';
import { LayoutData } from './layout';
import { normalize } from '../style/css';
import { RefreshLevel } from '../refresh/level';

class SymbolInstance extends AbstractFrame {
  symbolMaster: SymbolMaster;
  scale: number;

  constructor(props: SymbolInstanceProps, symbolMaster: SymbolMaster) {
    const overrideValues = props.overrideValues || {};
    const children = symbolMaster.children.map(item => item.cloneAndLink(overrideValues));
    super(props, children);
    // 复用sm的布局样式
    const style = this.style;
    style.display = Object.assign({}, symbolMaster.style.display);
    style.flexDirection = Object.assign({}, symbolMaster.style.flexDirection);
    style.justifyContent = Object.assign({}, symbolMaster.style.justifyContent);
    style.overflow = Object.assign({}, symbolMaster.style.overflow);
    this.isSymbolInstance = true;
    this.symbolMaster = symbolMaster;
    this.scale = props.scale || 1;
    symbolMaster.addSymbolInstance(this);
  }

  override lay(data: LayoutData) {
    const style = this.style;
    const { display } = style;
    // 第一次添加时如果是flex，使用sm的尺寸，sm一定都在page上，可以计算获得尺寸
    if (!this.isMounted && display.v === DISPLAY.BOX) {
      this.symbolMaster.calReflowStyle();
      if (style.left.u !== StyleUnit.AUTO) {
        style.right = { v: 0, u : StyleUnit.AUTO };
      }
      else if (style.right.u !== StyleUnit.AUTO) {
        style.left = { v: 0, u : StyleUnit.AUTO };
      }
      style.width = {
        v: this.symbolMaster.width,
        u: StyleUnit.PX,
      };
    }
    super.lay(data);
  }

  override didMount() {
    super.didMount();
    const { display } = this.style;
    const style = this.props.style;
    // 老版智能布局如果尺寸不一致再重新布局一次，一般是字体原因导致，直接child文字内容引发排版调整后再触发这里
    if (display.v === DISPLAY.BOX && style) {
      const source = normalize({
        left: style.left,
        right: style.right,
        width: style.width,
        top: style.top,
        bottom: style.bottom,
        height: style.height,
      });
      Object.assign(this.style, source);
      this.refresh(RefreshLevel.REFLOW);
    }
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
    return this.hasContent = this.symbolMaster.includeBackgroundColorInInstance && this.symbolMaster.hasContent;
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
