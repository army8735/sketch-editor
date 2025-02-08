import { GeomProps } from '../../format';
import { RefreshLevel } from '../../refresh/level';
import { svgPolygon } from '../../refresh/paint';
import { FILL_RULE, STROKE_POSITION } from '../../style/define';
import { LayoutData } from '../layout';
import Node from '../Node';
import { lineCap, lineJoin } from './border';
import { getPointsRect } from '../../math/bbox';
import { calPoint } from '../../math/matrix';

export type Loader = {
  error: boolean;
  loading: boolean;
  source?: HTMLImageElement;
  width: number;
  height: number;
};

class Geom extends Node {
  coords?: number[][];
  loaders: Loader[];

  constructor(props: GeomProps) {
    super(props);
    this.isGeom = true;
    this.loaders = [];
  }

  override lay(data: LayoutData) {
    super.lay(data);
    this.coords = undefined;
  }

  override calRepaintStyle(lv: RefreshLevel) {
    super.calRepaintStyle(lv);
    this.coords = undefined;
    this._rect = undefined;
    this._bbox = undefined;
    this._bbox2 = undefined;
    this._filterBbox = undefined;
    this._filterBbox2 = undefined;
    this.tempBbox = undefined;
  }

  buildPoints() {
    if (this.coords) {
      return;
    }
    this.textureOutline.forEach((item) => item?.release());
    this.coords = [];
  }

  override calContent(): boolean {
    this.buildPoints();
    return (this.hasContent = !!this.coords && this.coords.length > 1);
  }

  isLine() {
    this.buildPoints();
    const coords = this.coords;
    return (
      !!coords && coords.length === 2 && coords[0].length === 2 && coords[1].length === 2
    );
  }

  override checkShapeChange() {
    let parent = this.parent;
    while (parent && parent.isShapeGroup) {
      parent.clearPoints();
      parent = parent.parent;
    }
  }

  override refresh(lv: RefreshLevel = RefreshLevel.REPAINT, cb?: (sync: boolean) => void) {
    if (lv >= RefreshLevel.REPAINT) {
      this.coords = undefined;
    }
    super.refresh(lv, cb);
  }

  toSvg(max: number, isClosed = false) {
    this.buildPoints();
    const computedStyle = this.computedStyle;
    const coords = this.coords || [];
    const matrix = new Float64Array(this.matrixWorld);
    const absCoords: number[][] = [];
    let minX = 0, minY = 0, maxX = 0, maxY = 0;
    let isFirst = true;
    coords.forEach((item, i) => {
      if (item.length === 6) {
        const t1 = calPoint({ x: item[0], y: item[1] }, matrix);
        const t2 = calPoint({ x: item[2], y: item[3] }, matrix);
        const t3 = calPoint({ x: item[4], y: item[5] }, matrix);
        absCoords.push([t1.x, t1.y, t2.x, t2.y, t3.x, t3.y]);
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
        absCoords.push([t1.x, t1.y, t2.x, t2.y]);
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
        absCoords.push([t.x, t.y]);
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
    const width = (maxX - minX) || 1;
    const height = (maxY - minY) || 1;
    let scale = 1;
    if (width >= height) {
      scale = max / width;
    }
    else {
      scale = max / height;
    }
    let d = svgPolygon(absCoords.map(item => {
      return item.map(d => d * scale);
    }), -minX * scale, -minY * scale);
    if (d && isClosed) {
      d += 'Z';
    }
    const fillRule =
      computedStyle.fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero';
    const props = [
      ['d', d],
      ['fill', '#D8D8D8'],
      ['fill-rule', fillRule],
      ['stroke', '#979797'],
      ['stroke-width', 1],
    ];
    let s = `<svg width="${width * scale}" height="${height * scale}"><path`;
    props.forEach((item) => {
      s += ' ' + item[0] + '="' + item[1] + '"';
    });
    return s + '></path></svg>';
  }

  override get rect() {
    let res = this._rect;
    if (!res) {
      res = this._rect = new Float64Array(4);
      // 可能不存在
      this.buildPoints();
      // 可能矢量编辑过程中超过或不足原本尺寸范围
      const coords = this.coords;
      if (coords && coords.length) {
        getPointsRect(coords, res);
      }
    }
    return res;
  }

  override get bbox() {
    let res = this._bbox;
    if (!res) {
      const rect = this._rect || this.rect;
      res = this._bbox = rect.slice(0);
      this.buildPoints();
      const {
        strokeWidth,
        strokeEnable,
        strokePosition,
        strokeLinecap,
        strokeLinejoin,
        strokeMiterlimit,
      } = this.computedStyle;
      const isClosed = (this.props as GeomProps).isClosed;
      // 所有描边最大值，影响bbox，可能链接点会超过原本的线粗范围
      let border = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          // line很特殊，没有粗细高度，描边固定等同于center
          if (strokePosition[i] === STROKE_POSITION.OUTSIDE && isClosed) {
            border = Math.max(border, item);
          }
          else if (strokePosition[i] === STROKE_POSITION.CENTER || !isClosed) {
            border = Math.max(border, item * 0.5);
          }
        }
      });
      const minX = res[0] - border;
      const minY = res[1] - border;
      const maxX = res[2] + border;
      const maxY = res[3] + border;
      // lineCap仅对非闭合首尾端点有用
      if (isClosed) {
        res = this._bbox = lineCap(res, border, this.coords || [], strokeLinecap);
      }
      // 闭合看lineJoin
      else {
        res = this._bbox = lineJoin(res, border, this.coords || [], strokeLinejoin, strokeMiterlimit);
      }
      res[0] = Math.min(res[0], minX);
      res[1] = Math.min(res[1], minY);
      res[2] = Math.max(res[2], maxX);
      res[3] = Math.max(res[3], maxY);
    }
    return res;
  }
}

export default Geom;
