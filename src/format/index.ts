import {
  CURVE_MODE,
  TEXT_ALIGN,
  TEXT_DECORATION,
} from '../style/define';
import { DEFAULT_STYLE } from './dft';

export type JFile = {
  document?: {
    uuid: string;
    assets?: {
      uuid: string;
    };
    layerStyles?: {
      uuid: string;
    };
    layerTextStyles?: {
      uuid: string;
    };
  };
  pages: JPage[];
  currentPageIndex?: number;
  symbolMasters?: JSymbolMaster[];
};

export type JNode = {
  tagName: string;
  props: Props;
};

export type JContainer = JNode & {
  children: JNode[];
};

export type JPage = JContainer & {
  tagName: TAG_NAME.PAGE;
  props: PageProps;
};

export type JArtBoard = JContainer & {
  tagName: TAG_NAME.ART_BOARD;
  props: ArtBoardProps;
};

export type JSymbolMaster = JContainer & {
  tagName: TAG_NAME.SYMBOL_MASTER;
  props: SymbolMasterProps;
};

export type JSymbolInstance = JNode & {
  tagName: TAG_NAME.SYMBOL_INSTANCE;
  props: SymbolInstanceProps;
};

export type JGroup = JContainer & {
  tagName: TAG_NAME.GROUP;
};

export type JShapeGroup = JContainer & {
  tagName: TAG_NAME.SHAPE_GROUP;
  props: ShapeGroupProps,
};

export type JFrame = JContainer & {
  tagName: TAG_NAME.FRAME;
  includeBackgroundColorInExport?: boolean;
};

export type JGraphic = JContainer & {
  tagName: TAG_NAME.GRAPHIC;
  includeBackgroundColorInExport?: boolean;
};

export type JBitmap = JContainer & {
  tagName: TAG_NAME.BITMAP;
  props: BitmapProps;
};

export type JText = JNode & {
  tagName: TAG_NAME.TEXT;
  props: TextProps;
};

export type JPolyline = JNode & {
  tagName: TAG_NAME.POLYLINE;
  props: PolylineProps;
};

export type JLayer = JNode
  | JContainer
  | JPage
  | JArtBoard
  | JSymbolMaster
  | JSymbolInstance
  | JGroup
  | JShapeGroup
  | JFrame
  | JBitmap
  | JText
  | JPolyline;

export type JStyle = {
  top: number | string;
  right: number | string;
  bottom: number | string;
  left: number | string;
  width: number | string;
  height: number | string;
  lineHeight: number | 'normal';
  visibility: 'visible' | 'hidden';
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  fontStyle: 'normal' | 'italic' | 'oblique';
  backgroundColor: string | number[];
  color: string | number[];
  opacity: number;
  fill: Array<string | number[]>;
  fillOpacity: number[];
  fillEnable: boolean[];
  fillMode: string[];
  fillRule: 'nonzero' | 'evenodd';
  stroke: Array<string | number[]>;
  strokeEnable: boolean[];
  strokeWidth: number[];
  strokePosition: Array<'center' | 'inside' | 'outside'>;
  strokeMode: string[];
  strokeDasharray: number[];
  strokeLinecap: 'butt' | 'round' | 'square';
  strokeLinejoin: 'miter' | 'round' | 'bevel';
  strokeMiterlimit: number;
  letterSpacing: number;
  paragraphSpacing: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textVerticalAlign: 'top' | 'middle' | 'bottom';
  textDecoration: Array<'none' | 'underline' | 'line-through' | 'lineThrough'>;
  translateX: string | number;
  translateY: string | number;
  scaleX: number;
  scaleY: number;
  rotateZ: number;
  transformOrigin:
    | Array<number | 'left' | 'right' | 'top' | 'bottom' | 'center'>
    | string;
  matrix?: Float64Array | number[];
  booleanOperation: 'none' | 'union' | 'subtract' | 'intersect' | 'xor';
  mixBlendMode:
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten'
    | 'color-dodge'
    | 'colorDodge'
    | 'color-burn'
    | 'colorBurn'
    | 'hard-light'
    | 'hardLight'
    | 'soft-light'
    | 'softLight'
    | 'difference'
    | 'exclusion'
    | 'hue'
    | 'saturation'
    | 'color'
    | 'luminosity';
  pointerEvents: boolean;
  maskMode: 'none' | 'outline' | 'alpha' | 'gray' | 'alpha-with' | 'gray-with';
  breakMask: boolean;
  blur: string;
  shadow: string[];
  shadowEnable: boolean[];
  innerShadow: string[];
  innerShadowEnable: boolean[];
  hueRotate: number | string;
  saturate: number | string;
  brightness: number | string;
  contrast: number | string;
};

export function getDefaultStyle(v?: Partial<JStyle>): JStyle {
  return Object.assign({}, DEFAULT_STYLE, v);
}

export type Props = {
  name?: string;
  nameIsFixed?: boolean;
  uuid: string;
  sourceUuid?: string;
  index?: number;
  style?: Partial<JStyle>;
  constrainProportions?: boolean;
  isLocked?: boolean;
  isExpanded?: boolean;
  styleId?: string;
};

export type GeomProps = Props & {
  isClosed: boolean;
};

export type RootProps = Props & {
  dpi?: number;
  assets?: {
    uuid: string;
  };
  layerStyles?: {
    uuid: string;
  };
  layerTextStyles?: {
    uuid: string;
  };
  contextAttributes?: any,
};

export type PageProps = Props & {
  rule?: {
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
  hasBackgroundColor?: boolean;
  resizesContent?: boolean;
  includeBackgroundColorInExport?: boolean;
};

export type SymbolMasterProps = ArtBoardProps & {
  symbolId: string;
  includeBackgroundColorInInstance?: boolean;
};

export type SymbolInstanceProps = Props & {
  symbolId: string;
  overrideValues?: Record<string, Override[]>;
};

export type TextProps = Props & {
  content: string;
  rich?: JRich[];
  textBehaviour?: 'auto' | 'autoH' | 'fixed'; // sketch中特有，考虑字体的不确定性，记录原始文本框的大小位置对齐以便初始化
};

export type JRich = Omit<Rich, 'textAlign' | 'textDecoration' | 'color'> & Pick<JStyle, 'textAlign' | 'textDecoration' | 'color'>;

export type Rich = {
  location: number;
  length: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string; // 用不到，只会改postscriptName
  fontStyle: string; // 同
  lineHeight: number;
  textAlign: TEXT_ALIGN;
  textDecoration: TEXT_DECORATION[];
  letterSpacing: number;
  paragraphSpacing: number;
  color: number[];
};

export type PolylineProps = GeomProps & {
  points: JPoint[];
  isRectangle?: boolean;
  isOval?: boolean;
};

export type ShapeGroupProps = Props & {
};

export type JPoint = {
  x: number;
  y: number;
  cornerRadius: number;
  curveMode: 'none' | 'straight' | 'mirrored' | 'asymmetric' | 'disconnected';
  fx: number; // from控制点
  fy: number;
  tx: number; // to控制点
  ty: number;
  hasCurveFrom: boolean;
  hasCurveTo: boolean;
};

export type Point = Omit<JPoint, 'curveMode'> & {
  curveMode: CURVE_MODE;
  absX: number; // 算上宽高的绝对像素值
  absY: number;
  absFx: number;
  absFy: number;
  absTx: number;
  absTy: number;
  dspX: number; // 绝对值和相对于AP的matrix的值，展示在面板上
  dspY: number;
  dspFx: number;
  dspFy: number;
  dspTx: number;
  dspTy: number;
};

export enum TAG_NAME {
  PAGE = 'page',
  ART_BOARD = 'artBoard',
  SYMBOL_MASTER = 'symbolMaster',
  SYMBOL_INSTANCE = 'symbolInstance',
  GROUP = 'group',
  BITMAP = 'bitmap',
  TEXT = 'text',
  SLICE = 'slice',
  SHAPE_GROUP = '$shapeGroup',
  POLYLINE = '$polyline',
  FRAME = 'frame',
  GRAPHIC = 'graphic',
}

export type Override = {
  key: string[];
  value: string;
};

export type ResizeStyle = Partial<Pick<JStyle, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height' | 'scaleX' | 'scaleY'>>;

export type VerticalAlignStyle = Pick<JStyle, 'textVerticalAlign'>;

export type OpacityStyle = Pick<JStyle, 'opacity'>;

export type RotateZStyle = Pick<JStyle, 'rotateZ'>;

export type ShadowStyle = Pick<JStyle, 'shadow' | 'shadowEnable'>;

export type BlurStyle = Pick<JStyle, 'blur'>;

export type ColorAdjustStyle = Pick<JStyle, 'hueRotate' | 'saturate' | 'brightness' | 'contrast'>;

export type ModifyRichStyle = Partial<Omit<Rich, 'location' | 'length'>>;

export type FillStyle = Pick<JStyle, 'fill' | 'fillOpacity' | 'fillEnable'>;

export type StrokeStyle = Pick<JStyle, 'stroke' | 'strokeEnable' | 'strokePosition' | 'strokeWidth'>;

export type MaskModeStyle = Pick<JStyle, 'maskMode'>;

export type BreakMaskStyle = Pick<JStyle, 'breakMask'>;

export type VisibleStyle = Pick<JStyle, 'visibility'>;

export default {
  TAG_NAME,
  getDefaultStyle,
};
