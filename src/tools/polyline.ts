import * as uuid from 'uuid';
import { Point, POINTS_RADIUS_BEHAVIOUR } from '../format';
import Polyline from '../node/geom/Polyline';
import { CORNER_STYLE, CURVE_MODE } from '../style/define';

export function createLine(x1: number, y1: number, x2: number, y2: number) {
  const w = Math.abs(x1 - x2);
  const h = Math.abs(y1 - y2);
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);

  const points = [
    {
      x: (x1 - x) / w,
      y: (y1 - y) / h,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
    {
      x: (x2 - x) / w,
      y: (y2 - y) / h,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
  ];

  return createPolyline(x, y, w, h, '直线', points);
}

export function createStar(x: number, y: number, w: number, h: number) {
  const points = [
    {
      x: 0.5,
      y: 0.75,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
    {
      x: 0.2061073738537635,
      y: 0.9045084971874737,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
    {
      x: 0.2622358709262116,
      y: 0.5772542485937369,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
    {
      x: 0.02447174185242318,
      y: 0.3454915028125264,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
    {
      x: 0.35305368692688166,
      y: 0.29774575140626314,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
    {
      x: 0.5,
      y: 0,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
    {
      x: 0.6469463130731182,
      y: 0.29774575140626314,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
    {
      x: 0.9755282581475768,
      y: 0.34549150281252616,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
    {
      x: 0.7377641290737884,
      y: 0.5772542485937368,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
    {
      x: 0.7938926261462367,
      y: 0.9045084971874736,
      fx: 0,
      fy: 0,
      tx: 0,
      ty: 0,
      cornerRadius: 0,
      cornerStyle: 0,
      curveMode: 1,
      hasCurveFrom: false,
      hasCurveTo: false,
    },
  ];

  return createPolyline(x, y, w, h, '星形', points);
}

export function createOval(x: number, y: number, w: number, h: number) {
  const t = 0.2238576251,
    f = 0.7761423749,
    polyType = 'oval';
  const top: Point = {
    x: 0.5,
    y: 0,
    fx: t,
    fy: 0,
    tx: f,
    ty: 0,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.MIRRORED,
    hasCurveFrom: true,
    hasCurveTo: true,
  };
  const left: Point = {
    x: 0,
    y: 0.5,
    fx: 0,
    fy: f,
    tx: 0,
    ty: t,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.MIRRORED,
    hasCurveFrom: true,
    hasCurveTo: true,
  };
  const bottom: Point = {
    x: 0.5,
    y: 1,
    fx: f,
    fy: 1,
    tx: t,
    ty: 1,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.MIRRORED,
    hasCurveFrom: true,
    hasCurveTo: true,
  };
  const right: Point = {
    x: 1,
    y: 0.5,
    fx: 1,
    fy: t,
    tx: 1,
    ty: f,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.MIRRORED,
    hasCurveFrom: true,
    hasCurveTo: true,
  };

  return createPolyline(
    x,
    y,
    w,
    h,
    '椭圆形',
    [top, left, bottom, right],
    polyType,
  );
}

export function createTriangle(x: number, y: number, w: number, h: number) {
  const topLeft: Point = {
    x: 0.5,
    y: 0,
    fx: 0,
    fy: 0,
    tx: 0,
    ty: 0,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.STRAIGHT,
    hasCurveFrom: false,
    hasCurveTo: false,
  };
  const bottomLeft: Point = {
    x: 0,
    y: 1,
    fx: 0,
    fy: 0,
    tx: 0,
    ty: 0,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.STRAIGHT,
    hasCurveFrom: false,
    hasCurveTo: false,
  };
  const bottomRight: Point = {
    x: 1,
    y: 1,
    fx: 0,
    fy: 0,
    tx: 0,
    ty: 0,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.STRAIGHT,
    hasCurveFrom: false,
    hasCurveTo: false,
  };

  return createPolyline(x, y, w, h, '三角形', [
    topLeft,
    bottomLeft,
    bottomRight,
  ]);
}

export function createRect(x: number, y: number, w: number, h: number) {
  // 椭圆为一个矩形4条边中点作为贝塞尔曲线的位置点，from和to点距离为边长点一半
  const topLeft: Point = {
    x: 0,
    y: 0,
    fx: 0,
    fy: 0,
    tx: 0,
    ty: 0,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.STRAIGHT,
    hasCurveFrom: false,
    hasCurveTo: false,
  };
  const bottomLeft: Point = {
    x: 0,
    y: 1,
    fx: 0,
    fy: 0,
    tx: 0,
    ty: 0,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.STRAIGHT,
    hasCurveFrom: false,
    hasCurveTo: false,
  };
  const bottomRight: Point = {
    x: 1,
    y: 1,
    fx: 0,
    fy: 0,
    tx: 0,
    ty: 0,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.STRAIGHT,
    hasCurveFrom: false,
    hasCurveTo: false,
  };
  const topRight: Point = {
    x: 1,
    y: 0,
    fx: 0,
    fy: 0,
    tx: 0,
    ty: 0,
    cornerRadius: 0,
    cornerStyle: CORNER_STYLE.ROUNDED,
    curveMode: CURVE_MODE.STRAIGHT,
    hasCurveFrom: false,
    hasCurveTo: false,
  };

  return createPolyline(x, y, w, h, '矩形', [
    topLeft,
    bottomLeft,
    bottomRight,
    topRight,
  ]);
}

function createPolyline(
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  points: Point[],
  polyType?: string,
) {
  return new Polyline({
    uuid: uuid.v4(),
    name,
    style: {
      left: x,
      top: y,
      width: w,
      height: h,
      fill: ['#d8d8d8'],
      fillEnable: [true],
      fillOpacity: [1],
      strokeEnable: [true],
      stroke: ['#979797'],
      strokeWidth: [1],
      strokePosition: ['center'],
    },
    points,
    isClosed: true,
    constrainProportions: false,
    fixedRadius: 0,
    pointRadiusBehaviour: POINTS_RADIUS_BEHAVIOUR.SMOOTH,
    isRectangle: false,
    isLocked: false,
    isExpanded: false,
    isOval: polyType === 'oval',
  });
}
