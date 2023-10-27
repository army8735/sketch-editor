import { Props } from '../../format';
import bezier from '../../math/bezier';
import { RefreshLevel } from '../../refresh/level';
import { svgPolygon } from '../../refresh/paint';
import { FILL_RULE, STROKE_POSITION } from '../../style/define';
import { mergeBbox } from '../../util/util';
import { LayoutData } from '../layout';
import Node from '../Node';
import { lineCap, lineJoin } from './line';

class Geom extends Node {
  points?: number[][];

  constructor(props: Props) {
    super(props);
    this.isGeom = true;
  }

  override lay(data: LayoutData) {
    super.lay(data);
    this.points = undefined;
  }

  override calRepaintStyle(lv: RefreshLevel) {
    super.calRepaintStyle(lv);
    this.points = undefined;
    this._rect = undefined;
    this._bbox = undefined;
  }

  buildPoints() {
    if (this.points) {
      return;
    }
    this.textureOutline?.release();
    this.points = [];
  }

  override calContent(): boolean {
    this.buildPoints();
    return (this.hasContent = !!this.points && this.points.length > 1);
  }

  isLine() {
    this.buildPoints();
    const points = this.points || [];
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
    const d = svgPolygon(this.points!) + (isClosed ? 'Z' : '');
    const fillRule =
      computedStyle.fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero';
    const props = [
      ['d', d],
      ['fill', '#D8D8D8'],
      ['fill-rule', fillRule],
      ['stroke', '#979797'],
      ['stroke-width', (1 / scale).toString()],
    ];
    let s = `<svg width="${this.width}" height="${this.height}"><path`;
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
      const points = this.points!;
      if (points && points.length) {
        const first = points[0];
        let xa: number, ya: number;
        if (first.length === 4) {
          xa = first[2];
          ya = first[3];
        } else if (first.length === 6) {
          xa = first[4];
          ya = first[5];
        } else {
          xa = first[0];
          ya = first[1];
        }
        res[0] = xa;
        res[1] = ya;
        res[2] = xa;
        res[3] = ya;
        for (let i = 1, len = points.length; i < len; i++) {
          const item = points[i];
          let xb: number, yb: number;
          if (item.length === 4) {
            xb = item[2];
            yb = item[3];
            const b = bezier.bboxBezier(xa, ya, item[0], item[1], xb, yb);
            mergeBbox(res, b[0], b[1], b[2], b[3]);
          } else if (item.length === 6) {
            xb = item[4];
            yb = item[5];
            const b = bezier.bboxBezier(
              xa,
              ya,
              item[0],
              item[1],
              item[2],
              item[3],
              xb,
              yb,
            );
            mergeBbox(res, b[0], b[1], b[2], b[3]);
          } else {
            xb = item[0];
            yb = item[1];
            mergeBbox(res, xb, yb, xb, yb);
          }
          xa = xb;
          ya = yb;
        }
      }
    }
    return res;
  }

  override get bbox(): Float64Array {
    let res = this._bbox;
    if (!res) {
      const rect = this._rect || this.rect;
      res = this._bbox = rect.slice(0);
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
          } else if (strokePosition[i] === STROKE_POSITION.CENTER) {
            border = Math.max(border, item * 0.5);
          }
        }
      });
      // lineCap仅对非闭合首尾端点有用
      if (this.isLine()) {
        res = this._bbox = lineCap(res, border, this.points!, strokeLinecap);
      }
      // 闭合看lineJoin
      else {
        res = this._bbox = lineJoin(res, border, this.points!, strokeLinejoin, strokeMiterlimit);
      }
    }
    return res;
  }
}

export default Geom;
