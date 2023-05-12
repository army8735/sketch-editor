import * as uuid from 'uuid';
import { getDefaultStyle, Props } from '../../format';
import bezier from '../../math/bezier';
import bo from '../../math/bo';
import { toPrecision } from '../../math/geom';
import { isE } from '../../math/matrix';
import CanvasCache from '../../refresh/CanvasCache';
import config from '../../refresh/config';
import { canvasPolygon, svgPolygon } from '../../refresh/paint';
import { color2rgbaStr } from '../../style/css';
import {
  BOOLEAN_OPERATION,
  FILL_RULE,
  GRADIENT,
  STROKE_LINE_CAP,
  STROKE_LINE_JOIN,
  STROKE_POSITION,
  StyleUnit,
} from '../../style/define';
import { getConic, getLinear, getRadial } from '../../style/gradient';
import { migrate, sortTempIndex } from '../../tools/node';
import inject, { OffScreen } from '../../util/inject';
import { mergeBbox } from '../../util/util';
import Group from '../Group';
import { LayoutData } from '../layout';
import Node from '../Node';
import Polyline from './Polyline';

function applyMatrixPoints(points: Array<Array<number>>, m: Float64Array) {
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
            toPrecision(c1),
            toPrecision(c2),
            toPrecision(c3),
            toPrecision(c4),
            toPrecision(c5),
            toPrecision(c6),
          ];
        }
        return [
          toPrecision(c1),
          toPrecision(c2),
          toPrecision(c3),
          toPrecision(c4),
        ];
      } else {
        return [toPrecision(c1), toPrecision(c2)];
      }
    });
  }
  return points.map((item) => item.slice(0));
}

class ShapeGroup extends Group {
  points?: Array<Array<Array<number>>>;

  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.isShapeGroup = true;
  }

  override lay(data: LayoutData) {
    super.lay(data);
    this.points = undefined;
  }

  override checkSizeChange() {
    super.checkSizeChange();
    this.points = undefined;
  }

  override clearPoints() {
    this.points = undefined;
    this._bbox = undefined;
    this.clearCache(true);
  }

  override calContent(): boolean {
    this.buildPoints();
    return (this.hasContent = !!this.points && !!this.points.length);
  }

  buildPoints() {
    if (this.points) {
      return;
    }
    this.textureOutline?.release();
    const { children } = this;
    let res: Array<Array<Array<number>>> = [];
    for (let i = 0, len = children.length; i < len; i++) {
      const item = children[i];
      let points;
      // shapeGroup可以包含任意内容，非矢量视作矩形，TODO 文本矢量
      if (item instanceof Polyline || item instanceof ShapeGroup) {
        item.buildPoints();
        points = item.points;
      } else {
        const { width, height } = item;
        points = [
          [0, 0],
          [width, 0],
          [width, height],
          [0, height],
          [0, 0],
        ];
      }
      const { matrix } = item;
      if (points && points.length) {
        // 点要考虑matrix变换，因为是shapeGroup的直接子节点，位置可能不一样
        let p: Array<Array<Array<number>>>;
        if (item instanceof ShapeGroup) {
          p = points.map((item) =>
            applyMatrixPoints(item as number[][], matrix),
          );
        } else {
          p = [applyMatrixPoints(points as number[][], matrix)];
        }
        const booleanOperation = item.computedStyle.booleanOperation;
        if (i === 0 || !booleanOperation) {
          res = res.concat(p);
        } else {
          // TODO 连续多个bo运算中间产物优化
          if (booleanOperation === BOOLEAN_OPERATION.INTERSECT) {
            const t = bo.intersect(res, p) as number[][][];
            res = t || [];
          } else if (booleanOperation === BOOLEAN_OPERATION.UNION) {
            // p中可能是条直线，不能用多边形求，直接合并，将非直线提取出来进行求，直线则单独处理
            const pp: Array<Array<Array<number>>> = [],
              pl: Array<Array<Array<number>>> = [];
            p.forEach((item) => {
              if (item.length <= 2) {
                pl.push(item);
              } else {
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
          } else if (booleanOperation === BOOLEAN_OPERATION.SUBTRACT) {
            const t = bo.subtract(res, p) as number[][][];
            res = t || [];
          } else if (booleanOperation === BOOLEAN_OPERATION.XOR) {
            const t = bo.xor(res, p) as number[][][];
            res = t || [];
          }
        }
      }
    }
    this.points = res;
  }

  override renderCanvas(scale: number) {
    super.renderCanvas(scale);
    this.buildPoints();
    const points = this.points!;
    const bbox = this._bbox || this.bbox;
    const x = bbox[0],
      y = bbox[1],
      w = bbox[2] - x,
      h = bbox[3] - y;
    // 暂时这样防止超限，TODO 超大尺寸
    while (
      w * scale > config.MAX_TEXTURE_SIZE ||
      h * scale > config.MAX_TEXTURE_SIZE
      ) {
      if (scale <= 1) {
        break;
      }
      scale = scale >> 1;
    }
    if (
      w * scale > config.MAX_TEXTURE_SIZE ||
      h * scale > config.MAX_TEXTURE_SIZE
    ) {
      return;
    }
    const dx = -x * scale,
      dy = -y * scale;
    const canvasCache = (this.canvasCache = CanvasCache.getInstance(
      w * scale,
      h * scale,
      dx,
      dy,
    ));
    canvasCache.available = true;
    const ctx = canvasCache.offscreen.ctx;
    const {
      fill,
      fillEnable,
      fillRule,
      stroke,
      strokeEnable,
      strokeWidth,
      strokePosition,
      strokeDasharray,
      strokeLinecap,
      strokeLinejoin,
      strokeMiterlimit,
    } = this.computedStyle;
    if (scale !== 1) {
      ctx.setLineDash(strokeDasharray.map((i) => i * scale));
    } else {
      ctx.setLineDash(strokeDasharray);
    }
    ctx.setLineDash(strokeDasharray);
    // 先下层的fill
    for (let i = 0, len = fill.length; i < len; i++) {
      if (!fillEnable[i]) {
        continue;
      }
      const f = fill[i];
      if (Array.isArray(f)) {
        if (!f[3]) {
          continue;
        }
        ctx.fillStyle = color2rgbaStr(f);
      } else {
        if (f.t === GRADIENT.LINEAR) {
          const gd = getLinear(
            f.stops,
            f.d,
            dx,
            dy,
            this.width * scale,
            this.height * scale,
          );
          const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
          gd.stop.forEach((item) => {
            lg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.fillStyle = lg;
        } else if (f.t === GRADIENT.RADIAL) {
          const gd = getRadial(
            f.stops,
            f.d,
            dx,
            dy,
            this.width * scale,
            this.height * scale,
          );
          const rg = ctx.createRadialGradient(
            gd.cx,
            gd.cy,
            0,
            gd.cx,
            gd.cy,
            gd.total,
          );
          gd.stop.forEach((item) => {
            rg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.fillStyle = rg;
        } else if (f.t === GRADIENT.CONIC) {
          const gd = getConic(
            f.stops,
            f.d,
            dx,
            dy,
            this.width * scale,
            this.height * scale,
          );
          const cg = ctx.createConicGradient(gd.angle, gd.cx, gd.cy);
          gd.stop.forEach((item) => {
            cg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.fillStyle = cg;
        }
      }
      points.forEach((item) => {
        canvasPolygon(ctx, item, scale, dx, dy);
        ctx.closePath();
      });
      ctx.fill(fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero');
    }
    // 线帽设置
    if (strokeLinecap === STROKE_LINE_CAP.ROUND) {
      ctx.lineCap = 'round';
    } else if (strokeLinecap === STROKE_LINE_CAP.SQUARE) {
      ctx.lineCap = 'square';
    } else {
      ctx.lineCap = 'butt';
    }
    if (strokeLinejoin === STROKE_LINE_JOIN.ROUND) {
      ctx.lineJoin = 'round';
    } else if (strokeLinejoin === STROKE_LINE_JOIN.BEVEL) {
      ctx.lineJoin = 'bevel';
    } else {
      ctx.lineJoin = 'miter';
    }
    ctx.miterLimit = strokeMiterlimit * scale;
    // 再上层的stroke
    for (let i = 0, len = stroke.length; i < len; i++) {
      if (!strokeEnable[i] || !strokeWidth[i]) {
        continue;
      }
      const s = stroke[i];
      if (Array.isArray(s)) {
        ctx.strokeStyle = color2rgbaStr(s);
        ctx.lineWidth = strokeWidth[i];
      } else {
        if (s.t === GRADIENT.LINEAR) {
          const gd = getLinear(s.stops, s.d, -x, -y, this.width, this.height);
          const lg = ctx.createLinearGradient(gd.x1, gd.y1, gd.x2, gd.y2);
          gd.stop.forEach((item) => {
            lg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.strokeStyle = lg;
        } else if (s.t === GRADIENT.RADIAL) {
          const gd = getRadial(s.stops, s.d, -x, -y, this.width, this.height);
          const rg = ctx.createRadialGradient(
            gd.cx,
            gd.cy,
            0,
            gd.cx,
            gd.cy,
            gd.total,
          );
          gd.stop.forEach((item) => {
            rg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.strokeStyle = rg;
        } else if (s.t === GRADIENT.CONIC) {
          const gd = getConic(
            s.stops,
            s.d,
            dx,
            dy,
            this.width * scale,
            this.height * scale,
          );
          const cg = ctx.createConicGradient(gd.angle, gd.cx, gd.cy);
          gd.stop.forEach((item) => {
            cg.addColorStop(item.offset!, color2rgbaStr(item.color));
          });
          ctx.fillStyle = cg;
        }
      }
      // 注意canvas只有居中描边，内部需用clip模拟，外部比较复杂需离屏擦除
      const p = strokePosition[i];
      let os: OffScreen | undefined, ctx2: CanvasRenderingContext2D | undefined;
      if (p === STROKE_POSITION.INSIDE) {
        ctx.lineWidth = strokeWidth[i] * 2 * scale;
        points.forEach((item) => {
          canvasPolygon(ctx, item, scale, dx, dy);
          ctx.closePath();
        });
      } else if (p === STROKE_POSITION.OUTSIDE) {
        os = inject.getOffscreenCanvas(w, h, 'outsideStroke');
        ctx2 = os.ctx;
        ctx2.setLineDash(strokeDasharray);
        ctx2.lineCap = ctx.lineCap;
        ctx2.lineJoin = ctx.lineJoin;
        ctx2.miterLimit = ctx.miterLimit * scale;
        ctx2.strokeStyle = ctx.strokeStyle;
        ctx2.lineWidth = strokeWidth[i] * 2 * scale;
        points.forEach((item) => {
          canvasPolygon(ctx2!, item, scale, dx, dy);
          ctx2!.closePath();
        });
      } else {
        ctx.lineWidth = strokeWidth[i] * scale;
        points.forEach((item) => {
          canvasPolygon(ctx, item, scale, dx, dy);
          ctx.closePath();
        });
      }
      if (ctx2) {
        ctx2.closePath();
      } else {
        ctx.closePath();
      }
      if (p === STROKE_POSITION.INSIDE) {
        ctx.save();
        ctx.clip();
        ctx.stroke();
        ctx.restore();
      } else if (p === STROKE_POSITION.OUTSIDE) {
        ctx2!.stroke();
        ctx2!.save();
        ctx2!.clip();
        ctx2!.globalCompositeOperation = 'destination-out';
        ctx2!.strokeStyle = '#FFF';
        ctx2!.stroke();
        ctx2!.restore();
        ctx.drawImage(os!.canvas, 0, 0);
        os!.release();
      } else {
        ctx.stroke();
      }
    }
  }

  toSvg(scale: number) {
    this.buildPoints();
    const computedStyle = this.computedStyle;
    const fillRule =
      computedStyle.fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero';
    let s = `<svg width="${this.width}" height="${this.height}">`;
    this.points!.forEach((item) => {
      const d = svgPolygon(item) + 'Z';
      const props = [
        ['d', d],
        ['fill', '#D8D8D8'],
        ['fill-rule', fillRule],
        ['stroke', '#979797'],
        ['stroke-width', (1 / scale).toString()],
      ];
      s += '<path';
      props.forEach((item) => {
        s += ' ' + item[0] + '="' + item[1] + '"';
      });
      s += '></path>';
    });
    return s + '</svg>';
  }

  override get bbox(): Float64Array {
    if (!this._bbox) {
      const bbox = (this._bbox = super.bbox);
      // 可能不存在
      this.buildPoints();
      const { strokeWidth, strokeEnable, strokePosition } = this.computedStyle;
      // 所有描边最大值，影响bbox，可能链接点会超过原本的线粗，先用4倍弥补
      let border = 0;
      strokeWidth.forEach((item, i) => {
        if (strokeEnable[i]) {
          if (strokePosition[i] === STROKE_POSITION.CENTER) {
            border = Math.max(border, item * 0.5 * 4);
          } else if (strokePosition[i] === STROKE_POSITION.INSIDE) {
            // 0
          } else if (strokePosition[i] === STROKE_POSITION.OUTSIDE) {
            border = Math.max(border, item * 4);
          }
        }
      });
      // 子元素可能因为编辑模式临时超过范围
      const points = this.points;
      if (points && points.length) {
        const first = points[0][0];
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
        mergeBbox(bbox, xa - border, ya - border, xa + border, ya + border);
        for (let i = 0, len = points.length; i < len; i++) {
          const item = points[i];
          for (let j = 0, len = item.length; j < len; j++) {
            // first已经处理过了
            if (!i && !j) {
              continue;
            }
            const item2 = item[j];
            // 每个区域的第一个特殊处理
            if (!j) {
              if (item2.length === 4) {
                xa = item2[2];
                ya = item2[3];
              } else if (item2.length === 6) {
                xa = item2[4];
                ya = item2[5];
              } else {
                xa = item2[0];
                ya = item2[1];
              }
              mergeBbox(
                bbox,
                xa - border,
                ya - border,
                xa + border,
                ya + border,
              );
              continue;
            }
            let xb: number, yb: number;
            if (item2.length === 4) {
              xb = item2[2];
              yb = item2[3];
              const b = bezier.bboxBezier(xa, ya, item2[0], item2[1], xb, yb);
              mergeBbox(
                bbox,
                b[0] - border,
                b[1] - border,
                b[2] + border,
                b[3] + border,
              );
            } else if (item2.length === 6) {
              xb = item2[4];
              yb = item2[5];
              const b = bezier.bboxBezier(
                xa,
                ya,
                item2[0],
                item2[1],
                item2[2],
                item2[3],
                xb,
                yb,
              );
              mergeBbox(
                bbox,
                b[0] - border,
                b[1] - border,
                b[2] + border,
                b[3] + border,
              );
            } else {
              xb = item2[0];
              yb = item2[1];
              mergeBbox(
                bbox,
                xb - border,
                yb - border,
                xb + border,
                yb + border,
              );
            }
            xa = xb;
            ya = yb;
          }
        }
      }
    }
    return this._bbox;
  }

  static groupAsShape(
    nodes: Node[],
    bo = BOOLEAN_OPERATION.NONE,
    props?: Props,
  ) {
    if (!nodes.length) {
      return;
    }
    sortTempIndex(nodes);
    const first = nodes[0];
    let prev = first.prev;
    while (prev && nodes.indexOf(prev) > -1) {
      prev = prev.prev;
    }
    let next = first.next;
    while (next && nodes.indexOf(next) > -1) {
      next = next.next;
    }
    const zoom = first.getZoom();
    const parent = first.parent!;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      migrate(parent, zoom, item);
      if (i) {
        item.style.booleanOperation = { v: bo, u: StyleUnit.NUMBER };
      }
    }
    // 取第一个矢量图形的描绘属性
    let style;
    for (let i = 0, len = nodes.length; i < len; i++) {
      const item = nodes[i];
      if (item instanceof Polyline || item instanceof ShapeGroup) {
        style = item.getComputedStyle(true);
        break;
      }
    }
    if (!style) {
      style = getDefaultStyle();
    }
    const p = Object.assign(
      {
        uuid: uuid.v4(),
        name: '形状结合',
        style: {
          left: '0%',
          top: '0%',
          right: '0%',
          bottom: '0%',
          fill: style.fill,
          fillEnable: style.fillEnable,
          fillRule: style.fillRule,
          stroke: style.stroke,
          strokeEnable: style.strokeEnable,
          strokeWidth: style.strokeWidth,
          strokePosition: style.strokePosition,
          strokeDasharray: style.strokeDasharray,
          strokeLinecap: style.strokeLinecap,
          strokeLinejoin: style.strokeLinejoin,
          strokeMiterlimit: style.strokeMiterlimit,
        },
      },
      props,
    );
    const shapeGroup = new ShapeGroup(p, nodes);
    // 插入到first的原本位置，有prev/next优先使用定位
    if (prev) {
      prev.insertAfter(shapeGroup);
    } else if (next) {
      next.insertBefore(shapeGroup);
    }
    // 没有prev/next则parent原本只有一个节点
    else {
      parent.appendChild(shapeGroup);
    }
    shapeGroup.checkSizeChange();
    return shapeGroup;
  }
}

export default ShapeGroup;
