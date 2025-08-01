import * as uuid from 'uuid';
import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { Override, ShapeGroupProps, TAG_NAME } from '../../format';
import bo from '../../math/bo';
import { calPoint, isE } from '../../math/matrix';
import { svgPolygon } from '../../refresh/paint';
import { color2rgbaInt } from '../../style/color';
import {
  BOOLEAN_OPERATION,
  FILL_RULE,
  STROKE_POSITION,
  StyleUnit,
  VISIBILITY,
} from '../../style/define';
import { clone } from '../../util/type';
import { LayoutData } from '../layout';
import Node from '../Node';
import Polyline from './Polyline';
import AbstractGroup from '../AbstractGroup';
import { RefreshLevel } from '../../refresh/level';
import { lineJoin } from './border';
import { getShapeGroupRect } from '../../math/bbox';

function scaleUp(points: number[][]) {
  return points.map(point => {
    return point.map(item => Math.round(item * 100));
  });
}

function scaleDown(points: number[][]) {
  return points.map(point => {
    return point.map(item => item * 0.01);
  });
}

function applyMatrixPoints(points: number[][], m: Float64Array) {
  if (m && !isE(m)) {
    const a1 = m[0],
      b1 = m[1];
    const a2 = m[4],
      b2 = m[5];
    const a4 = m[12],
      b4 = m[13];
    return points.map((item) => {
      const c1 =
        (a1 === 1 ? item[0] : item[0] * a1) + (a2 ? item[1] * a2 : 0) + a4;
      const c2 =
        (b1 === 1 ? item[0] : item[0] * b1) + (b2 ? item[1] * b2 : 0) + b4;
      if (item.length === 4 || item.length === 6) {
        const c3 =
          (a1 === 1 ? item[2] : item[2] * a1) + (a2 ? item[3] * a2 : 0) + a4;
        const c4 =
          (b1 === 1 ? item[2] : item[2] * b1) + (b2 ? item[3] * b2 : 0) + b4;
        if (item.length === 6) {
          const c5 =
            (a1 === 1 ? item[4] : item[4] * a1) + (a2 ? item[5] * a2 : 0) + a4;
          const c6 =
            (b1 === 1 ? item[4] : item[4] * b1) + (b2 ? item[5] * b2 : 0) + b4;
          return [
            c1, c2, c3, c4, c5, c6,
          ];
        }
        return [
          c1, c2, c3, c4,
        ];
      }
      else {
        return [c1, c2];
      }
    });
  }
  return points.map((item) => item.slice(0));
}

class ShapeGroup extends AbstractGroup {
  props: ShapeGroupProps;
  coords?: number[][][]; // undefined初始化，结果可能是空集合则空数组

  constructor(props: ShapeGroupProps, children: Node[]) {
    super(props, children);
    this.props = props;
    this.loaders = [];
    this.isShapeGroup = true;
  }

  override didMount() {
    super.didMount();
    this.buildPoints();
    if (!this.coords?.length) {
      return;
    }
    const rect = this._rect || this.rect;
    const { width, height } = this;
    const EPS = AbstractGroup.EPS;
    // 和group的对比不同，直接用points的结果的rect
    if (Math.abs(rect[0]) > EPS
      || Math.abs(rect[1]) > EPS
      || Math.abs(width - rect[2]) > EPS
      || Math.abs(height - rect[3]) > EPS) {
      // 冒泡过程无需向下检测，直接向上
      this.adjustPosAndSize({
        minX: rect[0],
        minY: rect[1],
        maxX: rect[2],
        maxY: rect[3],
      });
    }
  }

  override lay(data: LayoutData) {
    super.lay(data);
    this.coords = undefined;
  }

  clearPoints() {
    this.coords = undefined;
    this._rect = undefined;
    this._bbox = undefined;
    this.clearCache(true);
  }

  clearPointsUpward() {
    this.clearPoints();
    let parent = this.parent;
    while (parent && parent instanceof ShapeGroup) {
      parent.clearPoints();
      parent = parent.parent;
    }
  }

  override calContent() {
    this.buildPoints();
    return (this.hasContent = !!this.coords && this.coords.length > 0);
  }

  buildPoints() {
    if (this.coords) {
      return;
    }
    this.coords = [];
    this.textureOutline.forEach((item) => item?.release());
    const { children } = this;
    let res: number[][][] = [], first = true;
    for (let i = 0, len = children.length; i < len; i++) {
      const item = children[i];
      // 不可见的无效
      if (item.computedStyle.visibility === VISIBILITY.HIDDEN) {
        continue;
      }
      let coords;
      // shapeGroup可以包含任意内容，非矢量视作矩形，TODO 文本矢量
      if (item instanceof Polyline || item instanceof ShapeGroup) {
        item.buildPoints();
        coords = item.coords;
      }
      else {
        const { width, height } = item;
        coords = [
          [0, 0],
          [width, 0],
          [width, height],
          [0, height],
          [0, 0],
        ];
      }
      const { matrix } = item;
      if (coords && coords.length) {
        // 点要考虑matrix变换，因为是shapeGroup的直接子节点，位置可能不一样
        let p: number[][][];
        if (item instanceof ShapeGroup) {
          p = coords.map((item) =>
            scaleUp(applyMatrixPoints(item as number[][], matrix)),
          );
        }
        else {
          p = [scaleUp(applyMatrixPoints(coords as number[][], matrix))];
        }
        const booleanOperation = item.computedStyle.booleanOperation;
        if (first || !booleanOperation) {
          res = res.concat(p);
          first = false;
        }
        else {
          // TODO 连续多个bo运算中间产物优化
          if (booleanOperation === BOOLEAN_OPERATION.INTERSECT) {
            const t = bo.intersect(res, p) as number[][][];
            res = t || [];
          }
          else if (booleanOperation === BOOLEAN_OPERATION.UNION) {
            // p中可能是条直线，不能用多边形求，直接合并，将非直线提取出来进行求，直线则单独处理
            const pp: number[][][] = [],
              pl: number[][][] = [];
            p.forEach((item) => {
              if (item.length <= 2) {
                pl.push(item);
              }
              else {
                pp.push(item);
              }
            });
            if (pp.length) {
              const t = bo.union(res, pp) as number[][][];
              res = t || [];
            }
            if (pl.length) {
              res = res.concat(pl);
            }
          }
          else if (booleanOperation === BOOLEAN_OPERATION.SUBTRACT) {
            const t = bo.subtract(res, p) as number[][][];
            res = t || [];
          }
          else if (booleanOperation === BOOLEAN_OPERATION.XOR) {
            const t = bo.xor(res, p) as number[][][];
            res = t || [];
          }
        }
      }
    }
    res.forEach(item => {
      if (item.length > 1) {
        const t = scaleDown(item);
        this.coords!.push(t);
      }
    });
  }

  override renderCanvas(scale: number) {
    super.renderCanvas(scale);
    this.buildPoints();
    const coords = this.coords;
    if (!coords || !coords.length) {
      return;
    }
    this.renderFillStroke(scale, coords, true);
  }

  override refresh(lv: RefreshLevel = RefreshLevel.REPAINT, cb?: ((sync: boolean) => void) | boolean, noRefresh = false) {
    if (lv >= RefreshLevel.REPAINT) {
      this.coords = undefined;
    }
    super.refresh(lv, cb, noRefresh);
  }

  toSvg(max: number) {
    this.buildPoints();
    const computedStyle = this.computedStyle;
    const coords = this.coords || [];
    const matrix = new Float64Array(this.matrixWorld);
    const absCoords: number[][][] = [];
    let minX = 0, minY = 0, maxX = 0, maxY = 0;
    let isFirst = true;
    coords.forEach((list, i) => {
      const temp: number[][] = [];
      list.forEach((item, j) => {
        if (item.length === 6) {
          const t1 = calPoint({ x: item[0], y: item[1] }, matrix);
          const t2 = calPoint({ x: item[2], y: item[3] }, matrix);
          const t3 = calPoint({ x: item[4], y: item[5] }, matrix);
          temp.push([t1.x, t1.y, t2.x, t2.y, t3.x, t3.y]);
          if (isFirst) {
            isFirst = false;
            minX = Math.min(t1.x, t2.x, t3.x);
            minY = Math.min(t1.y, t2.y, t3.y);
            maxX = Math.max(t1.x, t2.x, t3.x);
            maxY = Math.max(t1.y, t2.y, t3.y);
          }
          else {
            minX = Math.min(minX, t1.x, t2.x, t3.x);
            minY = Math.min(minY, t1.y, t2.y, t3.y);
            maxX = Math.max(maxX, t1.x, t2.x, t3.x);
            maxY = Math.max(maxY, t1.y, t2.y, t3.y);
          }
        }
        else if (item.length === 4) {
          const t1 = calPoint({ x: item[0], y: item[1] }, matrix);
          const t2 = calPoint({ x: item[2], y: item[3] }, matrix);
          temp.push([t1.x, t1.y, t2.x, t2.y]);
          if (isFirst) {
            isFirst = false;
            minX = Math.min(t1.x, t2.x);
            minY = Math.min(t1.y, t2.y);
            maxX = Math.max(t1.x, t2.x);
            maxY = Math.max(t1.y, t2.y);
          }
          else {
            minX = Math.min(minX, t1.x, t2.x);
            minY = Math.min(minY, t1.y, t2.y);
            maxX = Math.max(maxX, t1.x, t2.x);
            maxY = Math.max(maxY, t1.y, t2.y);
          }
        }
        else if (item.length === 2) {
          const t = calPoint({ x: item[0], y: item[1] }, matrix);
          temp.push([t.x, t.y]);
          if (isFirst) {
            isFirst = false;
            minX = t.x;
            minY = t.y;
            maxX = t.x;
            maxY = t.y;
          }
          else {
            minX = Math.min(minX, t.x);
            minY = Math.min(minY, t.y);
            maxX = Math.max(maxX, t.x);
            maxY = Math.max(maxY, t.y);
          }
        }
      });
      if (temp.length) {
        absCoords.push(temp);
      }
    });
    const width = maxX - minX;
    const height = maxY - minY;
    let scale = 1;
    if (width && height) {
      if (width >= height) {
        scale = max / width;
      }
      else {
        scale = max / height;
      }
    }
    const fillRule =
      computedStyle.fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero';
    let s = `<svg width="${width * scale}" height="${height * scale}"><path`;
    if (absCoords.length) {
      const props = [
        ['d', ''],
        ['fill', '#D8D8D8'],
        ['fill-rule', fillRule],
        ['stroke', '#979797'],
        ['stroke-width', 1],
      ];
      absCoords.forEach(list => {
        const d = svgPolygon(list.map(item => {
          return item.map(d => d * scale);
        }), -minX * scale, -minY * scale) + 'Z';
        props[0][1] += d;
      });
      props.forEach((item) => {
        s += ' ' + item[0] + '="' + item[1] + '"';
      });
      s += '></path>';
    }
    return s + '</svg>';
  }

  // @ts-ignore
  override clone(override?: Record<string, Override[]>) {
    const props = clone(this.props);
    const oldUUid = props.uuid;
    props.uuid = uuid.v4();
    props.sourceUuid = oldUUid;
    const res = new ShapeGroup(props, this.children.map(item => item.clone(override)));
    res.style = clone(this.style);
    if (override && override.hasOwnProperty(oldUUid)) {
      override[oldUUid].forEach(item => {
        const { key, value } = item;
        if (key[0] === 'fill') {
          const i = parseInt(key[1]) || 0;
          props.style.fill[i] = value;
          res.style.fill[i] = { v: color2rgbaInt(value), u: StyleUnit.RGBA };
        }
      });
    }
    return res;
  }

  override toJson() {
    const res = super.toJson();
    res.tagName = TAG_NAME.SHAPE_GROUP;
    return res;
  }

  // @ts-ignore
  override async toSketchJson(zip: JSZip, blobHash?: Record<string, string>) {
    // @ts-ignore
    const json = await super.toSketchJson(zip) as SketchFormat.ShapeGroup;
    json._class = SketchFormat.ClassValue.ShapeGroup;
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

  override destroy() {
    if (this.isDestroyed) {
      return;
    }
    const root = this.root;
    super.destroy();
    if (root) {
      this.loaders.forEach(item => {
        if (item.loading) {
          root.imgLoadingCount--;
          item.loading = false;
        }
      });
    }
  }

  override get rect(): Float64Array {
    let res = this._rect;
    if (!res) {
      res = this._rect = new Float64Array(4);
      this.buildPoints();
      // 子元素可能因为编辑模式临时超过范围
      const coords = this.coords;
      if (coords && coords.length) {
        getShapeGroupRect(coords, res);
      }
    }
    return res;
  }

  override get bbox(): Float64Array {
    let res = this._bbox;
    if (!res) {
      const rect = this._rect || this.rect;
      res = this._bbox = rect.slice(0);
      this.buildPoints();
      const {
        strokeWidth,
        strokeEnable,
        strokePosition,
        strokeLinejoin,
        strokeMiterlimit,
      } = this.computedStyle;
      // 所有描边最大值，影响bbox，可能链接点会超过原本的线粗，先用2倍弥补
      let border = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          if (strokePosition[i] === STROKE_POSITION.INSIDE) {
            // 0
          }
          else if (strokePosition[i] === STROKE_POSITION.OUTSIDE) {
            border = Math.max(border, item * 4);
          }
          else {
            // 默认中间
            border = Math.max(border, item * 0.5 * 4);
          }
        }
      });
      const minX = res[0] - border;
      const minY = res[1] - border;
      const maxX = res[2] + border;
      const maxY = res[3] + border;
      (this.coords || []).forEach(coords => {
        const t = lineJoin(res!, border, coords, strokeLinejoin, strokeMiterlimit);
        res![0] = Math.min(res![0], t[0]);
        res![1] = Math.min(res![1], t[1]);
        res![2] = Math.min(res![2], t[2]);
        res![3] = Math.min(res![3], t[3]);
      });
      res[0] = Math.min(res[0], minX);
      res[1] = Math.min(res[1], minY);
      res[2] = Math.max(res[2], maxX);
      res[3] = Math.max(res[3], maxY);
    }
    return res;
  }
}

export default ShapeGroup;
