import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { Point, Override, PolylineProps, TAG_NAME, JPoint } from '../../format';
import { calSize, getPropsPoints, normalizePoints } from '../../style/css';
import {
  CURVE_MODE,
} from '../../style/define';
import Geom from './Geom';
import { getCurve, getStraight, isCornerPoint, XY } from './corner';
import { sliceBezier } from '../../math/bezier';
import { calPoint, identity, multiply, multiplyScaleX, multiplyScaleY, multiplyTranslate } from '../../math/matrix';
import { calMatrixByOrigin, calRotateZ } from '../../style/transform';

const EPS = 1e-4;

class Polyline extends Geom {
  props: PolylineProps;
  isRectangle: boolean;
  isOval: boolean;

  constructor(props: PolylineProps) {
    super(props);
    this.props = props;
    props.points.forEach(item => {
      this.points.push(normalizePoints(item));
    });
    this.isPolyline = true;
    this.isRectangle = !!props.isRectangle;
    this.isOval = !!props.isOval;
  }

  override didMount() {
    super.didMount();
    // 脏数据导致x/y不对应尺寸[0,1]重新订正
    this.checkPointsChange(true);
  }

  override buildPoints() {
    if (this.coords) {
      return;
    }
    this.textureOutline.forEach((item) => item?.release());
    this.coords = Polyline.buildPoints(this.points, this.isClosed, this.width, this.height);
  }

  // 根据abs值反向计算相对值
  reflectPoints(points: Point | Point[] = this.points) {
    const { width, height } = this;
    const pts = Array.isArray(points) ? points : [points];
    pts.forEach(item => {
      item.x = item.absX / width;
      item.y = item.absY / height;
      item.tx = item.absTx / width;
      item.ty = item.absTy / height;
      item.fx = item.absFx / width;
      item.fy = item.absFy / height;
    });
  }

  override renderCanvas(scale: number) {
    super.renderCanvas(scale);
    this.buildPoints();
    const coords = this.coords;
    if (!coords || !coords.length) {
      return;
    }
    this.renderFillStroke(scale, [coords], this.isClosed);
  }

  // 改变点后，归一化处理和影响位置尺寸计算（本身和向上）
  checkPointsChange(noUpwards = false) {
    if (this.fixedPosAndSize) {
      return;
    }
    const rect = this._rect || this.rect;
    let dx1 = rect[0],
      dy1 = rect[1],
      dx2 = rect[2] - this.width,
      dy2 = rect[3] - this.height;
    // if (this.isLine()) {
    //   return;
    // }
    // 特殊情况如3个点形成的近似水平线或垂线，rect水平/垂直方向特别小，修正不要变为0，宽高为0会导致point数据NaN
    const w = rect[2] - rect[0];
    if (w < 0.5) {
      const mid = rect[0] + w * 0.5;
      const r0 = rect[0] = mid - 0.25;
      const r1 = rect[2] = mid + 0.25;
      dx1 = r0;
      dx2 = r1 - this.width;
    }
    const h = rect[3] - rect[1];
    if (h < 0.5) {
      const mid = rect[1] + h * 0.5;
      const r0 = rect[1] = mid - 0.25;
      const r1 = rect[3] = mid + 0.25;
      dy1 = r0;
      dy2 = r1 - this.height;
    }
    // 检查真正有变化才继续，位置相对于自己原本位置为原点
    if (Math.abs(dx1) > EPS
      || Math.abs(dy1) > EPS
      || Math.abs(dx2) > EPS
      || Math.abs(dy2) > EPS)
    {
      const { style, computedStyle } = this;
      const { left, top, translateX, translateY, rotateZ, scaleX, scaleY } = computedStyle;
      if (rotateZ || scaleX !== 1 || scaleY !== 1) {
        // 先计算左上原点/右下点原始位置作为定位参考
        const p1 = { x: left + translateX, y: top + translateY };
        const p2 = { x: p1.x + this.width, y: p1.y + this.height };
        const nw = rect[2] - rect[0];
        const nh = rect[3] - rect[1];
        // 计算新的transformOrigin，目前都是中心点
        const [cx, cy] = style.transformOrigin.map((item, i) => {
          return calSize(item, i ? nh : nw);
        });
        // 用新的tfo逆旋转回去，位置可能发生了位移
        const i = identity();
        if (rect[0] || rect[1]) {
          multiplyTranslate(i, rect[0], rect[1]);
        }
        calRotateZ(i, -rotateZ);
        if (scaleX === -1) {
          multiplyScaleX(i, -1);
        }
        if (scaleY === -1) {
          multiplyScaleY(i, -1);
        }
        let m2 = calMatrixByOrigin(i, cx, cy);
        m2 = multiply(this.matrix, m2);
        const n1 = calPoint({ x: 0, y: 0 }, m2);
        const n2 = calPoint({ x: nw, y: nh }, m2);
        this.adjustPosAndSizeSelf(n1.x - p1.x, n1.y - p1.y, n2.x - p2.x, n2.y - p2.y);
      }
      // 无旋转的简单直接改变
      else {
        this.adjustPosAndSizeSelf(dx1, dy1, dx2, dy2);
      }
      this.adjustPoints(-dx1, -dy1);
      // mount过程自上而下检查不要重复向上
      if (!noUpwards) {
        this.checkPosSizeUpward();
      }
      this.coords = undefined;
    }
  }

  private adjustPoints(dx: number, dy: number) {
    const { width, height } = this;
    const points = this.points;
    points.forEach((point) => {
      point.absX += dx;
      point.absY += dy;
      point.absFx += dx;
      point.absFy += dy;
      point.absTx += dx;
      point.absTy += dy;
      point.x = point.absX / width;
      point.y = point.absY / height;
      point.fx = point.absFx / width;
      point.fy = point.absFy / height;
      point.tx = point.absTx / width;
      point.ty = point.absTy / height;
    });
  }

  toSvg(scale: number) {
    return super.toSvg(scale, this.isClosed);
  }

  override cloneProps() {
    const props = super.cloneProps() as PolylineProps;
    props.points = this.points.map(item => getPropsPoints(item));
    props.isClosed = this.isClosed;
    return props;
  }

  override clone() {
    const props = this.cloneProps();
    const res = new Polyline(props);
    return res;
  }

  override cloneAndLink(overrides?: Record<string, Override[]>) {
    const props = this.cloneProps();
    const oldUUid = this.uuid;
    if (overrides && overrides.hasOwnProperty(oldUUid)) {
      overrides[oldUUid].forEach(item => {
        const { key, value } = item;
        if (key[0] === 'fill') {
          const i = parseInt(key[1]) || 0;
          props.style!.fill![i] = value;
        }
        else if (key[0] === 'stroke') {
          const i = parseInt(key[1]) || 0;
          props.style!.stroke![i] = value;
        }
      });
    }
    const res = new Polyline(props);
    return res;
  }

  override toJson() {
    const res = super.toJson();
    res.tagName = TAG_NAME.POLYLINE;
    (res.props as PolylineProps).points = this.points.map(item => {
      return {
        x: item.x,
        y: item.y,
        cornerRadius: item.cornerRadius,
        curveMode: ['none', 'straight', 'mirrored', 'asymmetric', 'disconnected'][item.curveMode] || 'none',
        fx: item.fx,
        fy: item.fy,
        tx: item.tx,
        ty: item.ty,
        hasCurveFrom: item.hasCurveFrom,
        hasCurveTo: item.hasCurveTo,
      };
    }) as JPoint[];
    (res.props as PolylineProps).isRectangle = this.isRectangle;
    (res.props as PolylineProps).isOval = this.isOval;
    return res;
  }

  override async toSketchJson(zip: JSZip) {
    const json = await super.toSketchJson(zip) as SketchFormat.ShapePath;
    json._class = SketchFormat.ClassValue.ShapePath;
    json.isClosed = this.isClosed;
    json.points = this.points.map(item => {
      return {
        _class: 'curvePoint',
        cornerRadius: item.cornerRadius,
        curveMode: [
          SketchFormat.CurveMode.None,
          SketchFormat.CurveMode.Straight,
          SketchFormat.CurveMode.Mirrored,
          SketchFormat.CurveMode.Asymmetric,
          SketchFormat.CurveMode.Disconnected,
        ][item.curveMode || 0],
        hasCurveFrom: item.hasCurveFrom,
        hasCurveTo: item.hasCurveTo,
        curveFrom: '{' + item.fx + ', ' + item.fy + '}',
        curveTo: '{' + item.tx + ', ' + item.ty + '}',
        point: '{' + item.x + ', ' + item.y + '}',
        cornerStyle: 0, // 疑似无用但不写报错
      };
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

  static get EPS() {
    return EPS;
  }

  static buildPoints(points: Point[], isClosed: boolean, width = 1, height = 1) {
    if (!points.length) {
      return [];
    }
    const coords = [];
    let hasCorner = false;
    // 先算出真实尺寸，按w/h把[0,1]坐标转换
    for (let i = 0, len = points.length; i < len; i++) {
      const item = points[i];
      item.absX = (item.x || 0) * width;
      item.absY = (item.y || 0) * height;
      item.absTx = item.tx * width;
      item.absTy = item.ty * height;
      item.absFx = item.fx * width;
      item.absFy = item.fy * height;
      if (isCornerPoint(item)) {
        hasCorner = true;
      }
    }
    // 如果有圆角，拟合画圆
    const cache: Array<{
      prevTangent: XY,
      prevHandle: XY,
      nextTangent: XY,
      nextHandle: XY,
      t1?: number,
      t2?: number,
    } | undefined> = [];
    if (hasCorner) {
      // 将圆角点拆分为2个顶点
      for (let i = 0, len = points.length; i < len; i++) {
        const point = points[i];
        if (!isCornerPoint(point)) {
          continue;
        }
        // 观察前后2个顶点的情况
        const prevIdx = i ? i - 1 : len - 1;
        const nextIdx = (i + 1) % len;
        const prevPoint = points[prevIdx];
        const nextPoint = points[nextIdx];
        let radius = point.cornerRadius;
        // 看前后2点是否也设置了圆角，相邻的圆角强制要求2点之间必须是直线，有一方是曲线的话走离散近似解
        const isPrevCorner = isCornerPoint(prevPoint);
        const isPrevStraight =
          isPrevCorner ||
          prevPoint.curveMode === CURVE_MODE.STRAIGHT ||
          !prevPoint.hasCurveFrom;
        const isNextCorner = isCornerPoint(nextPoint);
        const isNextStraight =
          isNextCorner ||
          nextPoint.curveMode === CURVE_MODE.STRAIGHT ||
          !nextPoint.hasCurveTo;
        // 先看最普通的直线，可以用角平分线+半径最小值约束求解
        if (isPrevStraight && isNextStraight) {
          cache[i] = getStraight(prevPoint, point, nextPoint, isPrevCorner, isNextCorner, radius);
        }
        // 两边只要有贝塞尔（一定是2阶），就只能用离散来逼近求圆心路径，2个圆心路径交点为所需圆心坐标
        else {
          cache[i] = getCurve(prevPoint, point, nextPoint, isPrevCorner, isNextCorner, radius);
        }
      }
    }
    // 将圆角的2个点替换掉原本的1个点
    const temp = points.map(item => Object.assign({}, item));
    for (let i = 0, len = temp.length; i < len; i++) {
      const c = cache[i];
      if (c) {
        const { prevTangent, prevHandle, nextTangent, nextHandle } = c;
        const p: Point = {
          x: 0,
          y: 0,
          cornerRadius: 0,
          curveMode: CURVE_MODE.NONE,
          hasCurveFrom: true,
          fx: 0,
          fy: 0,
          hasCurveTo: false,
          tx: 0,
          ty: 0,
          absX: prevTangent.x,
          absY: prevTangent.y,
          absFx: prevHandle.x,
          absFy: prevHandle.y,
          absTx: 0,
          absTy: 0,
          dspX: 0,
          dspY: 0,
          dspFx: 0,
          dspFy: 0,
          dspTx: 0,
          dspTy: 0,
        };
        const n: Point = {
          x: 0,
          y: 0,
          cornerRadius: 0,
          curveMode: CURVE_MODE.NONE,
          hasCurveFrom: false,
          fx: 0,
          fy: 0,
          hasCurveTo: true,
          tx: 0,
          ty: 0,
          absX: nextTangent.x,
          absY: nextTangent.y,
          absFx: 0,
          absFy: 0,
          absTx: nextHandle.x,
          absTy: nextHandle.y,
          dspX: 0,
          dspY: 0,
          dspFx: 0,
          dspFy: 0,
          dspTx: 0,
          dspTy: 0,
        };
        // 前后如果是曲线，需用t计算截取，改变控制点即可
        if (c.t1) {
          const prev = temp[(i + len - 1) % len];
          const curve = sliceBezier([
            { x: prev.absX, y: prev.absY },
            { x: prev.absFx, y: prev.absFy },
            { x: temp[i].absX, y: temp[i].absY },
          ], 0, c.t1);
          prev.absFx = curve[1].x;
          prev.absFy = curve[1].y;
        }
        if (c.t2) {
          const next = temp[(i + 1) % len];
          const curve = sliceBezier([
            { x: next.absX, y: next.absY },
            { x: next.absTx, y: next.absTy },
            { x: temp[i].absX, y: temp[i].absY },
          ], 0, 1 - c.t2);
          next.absTx = curve[1].x;
          next.absTy = curve[1].y;
        }
        // 插入新点注意索引
        temp.splice(i, 1, p, n);
        i++;
        len++;
        cache.splice(i, 0, undefined);
      }
    }
    // 换算为容易渲染的方式，[cx1?, cy1?, cx2?, cy2?, x, y]，贝塞尔控制点是前面的到当前的
    const first = temp[0];
    const p: number[] = [
      first.absX,
      first.absY,
    ];
    coords.push(p);
    const len = temp.length;
    for (let i = 1; i < len; i++) {
      const item = temp[i];
      const prev = temp[i - 1];
      const p: number[] = [
        item.absX,
        item.absY,
      ];
      if (item.hasCurveTo) {
        p.unshift(item.absTx, item.absTy);
      }
      if (prev.hasCurveFrom) {
        p.unshift(prev.absFx, prev.absFy);
      }
      coords.push(p);
    }
    // 闭合
    if (isClosed) {
      const last = temp[len - 1];
      const p: number[] = [
        first.absX,
        first.absY,
      ];
      if (first.hasCurveTo) {
        p.unshift(first.absTx, first.absTy);
      }
      if (last.hasCurveFrom) {
        p.unshift(last.absFx, last.absFy);
      }
      coords.push(p);
    }
    return coords;
  }
}

export default Polyline;
