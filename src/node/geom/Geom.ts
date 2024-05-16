import { Point, Props } from '../../format';
import { RefreshLevel } from '../../refresh/level';
import { svgPolygon } from '../../refresh/paint';
import { FILL_RULE, STROKE_POSITION } from '../../style/define';
import { LayoutData } from '../layout';
import Node from '../Node';
import { lineCap, lineJoin } from './border';
import { getPointsRect } from '../../math/bbox';

export type Loader = {
  error: boolean;
  loading: boolean;
  source?: HTMLImageElement;
  width: number;
  height: number;
};

class Geom extends Node {
  coords: Point[];
  points: number[][];
  loaders: Loader[];

  constructor(props: Props) {
    super(props);
    this.isGeom = true;
    this.loaders = [];
    this.coords = [];
    this.points = [];
  }

  override lay(data: LayoutData) {
    super.lay(data);
    this.points.splice(0);
  }

  override calRepaintStyle(lv: RefreshLevel) {
    super.calRepaintStyle(lv);
    this.points.splice(0);
    this._rect = undefined;
    this._bbox = undefined;
  }

  buildPoints() {
    if (this.points.length) {
      return;
    }
    this.textureOutline.forEach((item) => item?.release());
    this.points.splice(0);
  }

  override calContent(): boolean {
    this.buildPoints();
    return (this.hasContent = this.points.length > 1);
  }

  isLine() {
    this.buildPoints();
    const points = this.points;
    return (
      points.length === 2 && points[0].length === 2 && points[1].length === 2
    );
  }

  override checkShapeChange() {
    let parent = this.parent;
    while (parent && parent.isShapeGroup) {
      parent.clearPoints();
      parent = parent.parent;
    }
  }

  toSvg(scale: number, isClosed = false) {
    this.buildPoints();
    const computedStyle = this.computedStyle;
    const points = this.points;
    const [dx, dy] = this._rect || this.rect;
    const d = svgPolygon(points, -dx, -dy) + (isClosed ? 'Z' : '');
    const fillRule =
      computedStyle.fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero';
    const { scaleX, scaleY } = computedStyle;
    let transform = '';
    if (scaleX < 0 && scaleY < 0) {
      transform += 'scale(-1,-1)';
    }
    else if (scaleX < 0) {
      transform += 'scale(-1,1)';
    }
    else if (scaleY < 0) {
      transform += 'scale(1,-1)';
    }
    const props = [
      ['d', d],
      ['fill', '#D8D8D8'],
      ['fill-rule', fillRule],
      ['stroke', '#979797'],
      ['stroke-width', (1 / scale).toString()],
    ];
    let s = `<svg width="${this.width}" height="${this.height}"`;
    if (transform) {
      s += ' transform="' + transform + '"';
    }
    s += '><path';
    props.forEach((item) => {
      s += ' ' + item[0] + '="' + item[1] + '"';
    });
    return s + '></path></svg>';
  }

  override get rect(): Float64Array {
    let res = this._rect;
    if (!res) {
      res = this._rect = new Float64Array(4);
      // 可能不存在
      this.buildPoints();
      // 可能矢量编辑过程中超过或不足原本尺寸范围
      const points = this.points;
      if (points && points.length) {
        getPointsRect(points, res);
      }
      const {
        strokeWidth,
        strokeEnable,
      } = this.computedStyle;
      let minBorder = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          minBorder = Math.max(minBorder, item);
        }
      });
      // 特殊检查，比如垂线平线，高宽可能为0，此时bbox
      const dx = res[2] - res[0];
      if (dx < minBorder) {
        const h = minBorder * 0.5;
        res[0] -= h;
        res[2] += h;
      }
      const dy = res[3] - res[1];
      if (dy < minBorder) {
        const h = minBorder * 0.5;
        res[1] -= h;
        res[3] += h;
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
        strokeLinecap,
        strokeLinejoin,
        strokeMiterlimit,
      } = this.computedStyle;
      // 所有描边最大值，影响bbox，可能链接点会超过原本的线粗范围
      let border = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          if (strokePosition[i] === STROKE_POSITION.OUTSIDE) {
            border = Math.max(border, item);
          }
          else if (strokePosition[i] === STROKE_POSITION.CENTER) {
            border = Math.max(border, item * 0.5);
          }
        }
      });
      const minX = res[0] - border;
      const minY = res[1] - border;
      const maxX = res[2] + border;
      const maxY = res[3] + border;
      // lineCap仅对非闭合首尾端点有用
      if (this.isLine()) {
        res = this._bbox = lineCap(res, border, this.points, strokeLinecap);
      }
      // 闭合看lineJoin
      else {
        res = this._bbox = lineJoin(res, border, this.points, strokeLinejoin, strokeMiterlimit);
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
