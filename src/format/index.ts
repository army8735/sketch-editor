import { CORNER_STYLE, CURVE_MODE, TEXT_ALIGN } from '../style/define';

export type JFile = {
  pages: JPage[];
  currentPageIndex: number;
  imgs: Array<string>;
};

export type JNode = {
  tagName: string;
  props: Props;
};

export type JContainer = JNode & {
  children: Array<JNode>;
};

export type JPage = JContainer & {
  tagName: TagName.Page;
  props: PageProps;
};

export type JArtBoard = JContainer & {
  tagName: TagName.ArtBoard;
  props: ArtBoardProps;
};

export type JGroup = JContainer & {
  tagName: TagName.Group;
};

export type JShapeGroup = JContainer & {
  tagName: TagName.ShapeGroup;
};

export type JBitmap = JContainer & {
  tagName: TagName.Bitmap;
  props: BitmapProps;
};

export type JText = JNode & {
  tagName: TagName.Text;
  props: TextProps;
};

export type JPolyline = JNode & {
  tagName: TagName.Polyline;
  props: PolylineProps;
};

export type JStyle = {
  top: number | string;
  right: number | string;
  bottom: number | string;
  left: number | string;
  width: number | string;
  height: number | string;
  lineHeight: number | 'normal';
  visible: boolean;
  fontFamily: string;
  fontSize: number;
  fontWeight:
    | 100
    | 200
    | 300
    | 400
    | 500
    | 600
    | 700
    | 800
    | 900
    | 'thin'
    | 'lighter'
    | 'light'
    | 'normal'
    | 'medium'
    | 'semiBold'
    | 'bold'
    | 'extraBold'
    | 'black';
  fontStyle: 'normal' | 'italic' | 'oblique';
  overflow: 'visible' | 'hidden';
  backgroundColor: string | Array<number>;
  color: string | Array<number>;
  opacity: number;
  fill: Array<string | Array<number>>;
  fillOpacity: number[];
  fillEnable: boolean[];
  fillRule: number;
  stroke: Array<string | Array<number>>;
  strokeEnable: boolean[];
  strokeWidth: number[];
  strokePosition: Array<'center' | 'inside' | 'outside'>;
  strokeDasharray: number[];
  strokeLinecap: 'butt' | 'round' | 'square';
  strokeLinejoin: 'miter' | 'round' | 'bevel';
  strokeMiterlimit: number;
  letterSpacing: number;
  paragraphSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotateZ: number;
  transformOrigin: Array<number | 'left' | 'right' | 'top' | 'bottom' | 'center'> | string;
  booleanOperation: 'none' | 'union' | 'subtract' | 'intersect' | 'xor';
  mixBlendMode:
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten'
    | 'color-dodge'
    | 'color-burn'
    | 'hard-light'
    | 'soft-light'
    | 'difference'
    | 'exclusion'
    | 'hue'
    | 'saturation'
    | 'color'
    | 'luminosity';
  pointerEvents: boolean;
  maskMode: 'none' | 'outline' | 'alpha';
  breakMask: boolean;
  blur: string;
  shadow: string[];
  shadowEnable: boolean[];
  innerShadow: string[];
  innerShadowEnable: boolean[];
};

export function getDefaultStyle(v?: Partial<JStyle>): JStyle {
  return Object.assign(
    {
      left: 0,
      top: 0,
      right: 'auto',
      bottom: 'auto',
      width: 'auto',
      height: 'auto',
      lineHeight: 'normal',
      fontFamily: 'arial',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: 'normal',
      visible: true,
      overflow: 'visible',
      backgroundColor: [0, 0, 0, 0],
      color: [0, 0, 0, 1],
      opacity: 1,
      fill: [],
      fillOpacity: [],
      fillEnable: [],
      fillRule: 0,
      stroke: [],
      strokeEnable: [],
      strokeWidth: [],
      strokePosition: [],
      strokeDasharray: [],
      strokeLinecap: 'butt',
      strokeLinejoin: 'miter',
      strokeMiterlimit: 0,
      letterSpacing: 0,
      paragraphSpacing: 0,
      textAlign: 'left',
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotateZ: 0,
      transformOrigin: ['center', 'center'],
      booleanOperation: 'none',
      mixBlendMode: 'normal',
      pointerEvents: true,
      maskMode: 'none',
      breakMask: false,
      blur: 'none',
      shadow: [],
      shadowEnable: [],
      innerShadow: [],
      innerShadowEnable: [],
    },
    v,
  );
}

export type Props = {
  name?: string;
  uuid?: string;
  style?: object;
  constrainProportions?: boolean;
  isLocked?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
};

export type PageProps = Props & {
  rule: {
    baseX: number;
    baseY: number;
  };
};

export type BitmapProps = Props & {
  src: string | undefined;
  onLoad?: () => void;
  onError?: () => void;
};

export type ArtBoardProps = Props & {
  hasBackgroundColor: boolean;
  resizesContent: boolean;
};

export type TextProps = Props & {
  content: string;
  rich?: Array<Rich>;
};

export type Rich = {
  location: number;
  length: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number; // 用不到，只会改postscriptName
  fontStyle: string; // 同
  lineHeight: number;
  textAlign: TEXT_ALIGN;
  letterSpacing: number;
  paragraphSpacing: number;
  color: string | number[];
};

export type PolylineProps = Props & {
  points: Array<Point>;
  isClosed: boolean;
  constrainProportions: boolean;
  fixedRadius: number;
  pointRadiusBehaviour: POINTS_RADIUS_BEHAVIOUR;
  isRectangle: boolean;
  isOval: boolean;
};

export type Point = {
  x: number;
  y: number;
  cornerRadius: number;
  cornerStyle: CORNER_STYLE;
  curveMode: CURVE_MODE;
  fx: number; // from控制点
  fy: number;
  tx: number; // to控制点
  ty: number;
  hasCurveFrom: boolean;
  hasCurveTo: boolean;
  absX?: number; // 算上宽高的绝对像素值
  absY?: number;
  absFx?: number;
  absFy?: number;
  absTx?: number;
  absTy?: number;
  dspX?: number; // 算上宽高和相对于AP的matrix的值，展示在面板上
  dspY?: number;
  dspFx?: number;
  dspFy?: number;
  dspTx?: number;
  dspTy?: number;
};

export enum TagName {
  Page = 'page',
  ArtBoard = 'artBoard',
  SymbolMaster = 'symbolMaster',
  Group = 'group',
  ShapeGroup = '$shapeGroup',
  Bitmap = 'bitmap',
  Text = 'text',
  Polyline = '$polyline',
}

export enum POINTS_RADIUS_BEHAVIOUR {
  DISABLED = -1,
  LEGACY = 0,
  ROUNDED = 1,
  SMOOTH = 2,
}
