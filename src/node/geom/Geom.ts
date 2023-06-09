import { Props } from '../../format';
import bezier from '../../math/bezier';
import { RefreshLevel } from '../../refresh/level';
import { svgPolygon } from '../../refresh/paint';
import { FILL_RULE, STROKE_POSITION } from '../../style/define';
import { mergeBbox } from '../../util/util';
import { LayoutData } from '../layout';
import Node from '../Node';

class Geom extends Node {
  points?: Array<Array<number>>;
  static isLine(node: Node) {
    if (node instanceof Geom) {
      return node.isLine();
    }
    return false;
  }
  constructor(props: Props) {
    super(props);
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
      const { strokeWidth, strokeEnable, strokePosition } = this.computedStyle;
      // 所有描边最大值，影响bbox，可能链接点会超过原本的线粗，先用4倍弥补
      let border = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          if (strokePosition[i] === STROKE_POSITION.INSIDE) {
            // 0
          } else if (strokePosition[i] === STROKE_POSITION.OUTSIDE) {
            border = Math.max(border, item * 4);
          } else {
            // 默认中间
            border = Math.max(border, item * 0.5 * 4);
          }
        }
      });
      res[0] -= border;
      res[1] -= border;
      res[2] += border;
      res[3] += border;
    }
    return res;
  }
}

export default Geom;
