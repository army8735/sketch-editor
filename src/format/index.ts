export type JFile = {
  pages: JPage[],
  imgs: Array<string>,
  fonts: Array<{ fontFamily: string, url: string }>,
};

export type JNode = {
  tagName: string,
  props: Props,
};

export type JContainer = JNode & {
  children: Array<JNode>,
};

export type JPage = JContainer & {
  tagName: TagName.Page,
};

export type JArtBoard = JContainer & {
  tagName: TagName.ArtBoard,
  props: ArtBoardProps,
};

export type JGroup = JContainer & {
  tagName: TagName.Group,
};

export type JBitmap = JContainer & {
  tagName: TagName.Bitmap,
  props: BitmapProps,
};

export type JText = JNode & {
  tagName: TagName.Text,
  props: TextProps,
};

export type JPolyline = JNode & {
  tagName: TagName.Polyline,
  props: PolylineProps,
};

export type JStyle = {
  top: number | string,
  right: number | string,
  bottom: number | string,
  left: number | string,
  width: number | string,
  height: number | string,
  lineHeight: number | 'normal',
  visible: boolean,
  fontFamily: string,
  fontSize: number,
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
    | 'thin' | 'lighter' | 'light' | 'normal' | 'medium' | 'semiBold' | 'bold' | 'extraBold' | 'black',
  fontStyle: 'normal' | 'italic' | 'oblique',
  overflow: 'visible' | 'hidden',
  backgroundColor: string | Array<number>,
  color: string | Array<number>,
  opacity: number,
  fill: Array<string | Array<number>>,
  fillEnable: Array<boolean>,
  stroke: Array<string | Array<number>>,
  strokeEnable: Array<boolean>,
  strokeWidth: Array<number>,
  letterSpacing: number,
  textAlign: string,
  translateX: number,
  translateY: number,
  scaleX: number,
  scaleY: number,
  rotateZ: number,
  transformOrigin: Array<number | string> | string,
  mixBlendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
    | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity',
  pointerEvents: boolean,
};

export function getDefaultStyle(v?: any): JStyle {
  return Object.assign({
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
    fill: [[0, 0, 0, 1]],
    fillEnable: [false],
    stroke: [[0, 0, 0, 1]],
    strokeEnable: [false],
    strokeWidth: [1],
    letterSpacing: 0,
    textAlign: 'left',
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    rotateZ: 0,
    transformOrigin: ['center', 'center'],
    mixBlendMode: 'normal',
    pointerEvents: true,
  }, v);
}

export type Props = {
  name?: string,
  uuid?: string,
  style?: object,
};

export type BitmapProps = Props & {
  src: string | undefined,
  onLoad?: Function,
  onError?: Function,
};

export type ArtBoardProps = Props & {
  hasBackgroundColor: boolean,
  resizesContent: boolean,
};

export type TextProps = Props & {
  content: string,
  textBehaviour: number,
  rich?: Array<Rich>,
};

export type Rich = {
  location: number,
  length: number,
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  fontStyle: string,
  lineHeight: number,
  letterSpacing: number,
  color: string | Array<number>,
};

export type PolylineProps = Props & {
  points: Array<Point>,
  isClosed: boolean,
};

export type Point = {
  x: number,
  y: number,
  cornerRadius: number,
  curveMode: CurveMode,
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  hasCurveFrom: boolean,
  hasCurveTo: boolean,
};

export enum TagName {
  Page = 'page',
  ArtBoard = 'artBoard',
  Group = 'group',
  Bitmap = 'bitmap',
  Text = 'text',
  Polyline = '$polyline',
}

export enum CurveMode {
  None = 0,
  Straight = 1,
  Mirrored = 2,
  Asymmetric = 3,
  Disconnected = 4
}
