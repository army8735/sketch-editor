import {
  CORNER_STYLE,
  CURVE_MODE,
  TEXT_ALIGN,
  TEXT_BEHAVIOUR,
  TEXT_DECORATION,
} from '../style/define';

export type JFile = {
  document: {
    uuid: string;
    assets: {
      uuid: string;
    };
    layerStyles: {
      uuid: string;
    };
    layerTextStyles: {
      uuid: string;
    };
  };
  pages: JPage[];
  currentPageIndex: number;
  symbolMasters: JSymbolMaster[];
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
  translateX: number;
  translateY: number;
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
  hueRotate: number;
  saturate: number;
  brightness: number;
  contrast: number;
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
      backgroundColor: [0, 0, 0, 0],
      color: [0, 0, 0, 1],
      opacity: 1,
      fill: [],
      fillOpacity: [],
      fillEnable: [],
      fillMode: [],
      fillRule: 'nonzero',
      stroke: [],
      strokeEnable: [],
      strokeWidth: [],
      strokePosition: [],
      strokeMode: [],
      strokeDasharray: [],
      strokeLinecap: 'butt',
      strokeLinejoin: 'miter',
      strokeMiterlimit: 0,
      letterSpacing: 0,
      paragraphSpacing: 0,
      textAlign: 'left',
      textVerticalAlign: 'top',
      textDecoration: [],
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
      hueRotate: 0,
      saturate: 1,
      brightness: 1,
      contrast: 1,
    },
    v,
  );
}

export type Props = {
  name?: string;
  uuid: string;
  style?: any;
  constrainProportions?: boolean;
  isLocked?: boolean;
  isExpanded?: boolean;
  isSelected?: boolean;
};

export type RootProps = Props & {
  dpi: number;
  assets: {
    uuid: string;
  };
  layerStyles: {
    uuid: string;
  };
  layerTextStyles: {
    uuid: string;
  };
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

export type SymbolMasterProps = ArtBoardProps & {
  symbolId: string;
  includeBackgroundColorInInstance: boolean;
};

export type SymbolInstanceProps = Props & {
  symbolId: string;
  overrideValues: { name: string; value: string }[];
};

export type TextProps = Props & {
  content: string;
  rich?: Rich[];
  textBehaviour?: TEXT_BEHAVIOUR;
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
  textDecoration: TEXT_DECORATION[];
  letterSpacing: number;
  paragraphSpacing: number;
  color: string | number[];
};

export type PolylineProps = Props & {
  points: Point[];
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
}

export enum POINTS_RADIUS_BEHAVIOUR {
  DISABLED = -1,
  LEGACY = 0,
  ROUNDED = 1,
  SMOOTH = 2,
}

export type Override = {
  property: string;
  value: string;
};
