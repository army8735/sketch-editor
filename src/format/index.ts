export type JFile = {
  pages: JPage[],
  imgs: Array<string>,
  fonts: Array<{ fontFamily: string, url: string }>,
};

export type JNode = {
  type: string,
  name: string,
  props: Props,
};

export type JContainer = JNode & {
  children: Array<JNode>,
};

export type JPage = JContainer & {
  type: classValue.Page,
};

export type JArtBoard = JContainer & {
  type: classValue.ArtBoard,
  props: ArtBoardProps,
};

export type JGroup = JContainer & {
  type: classValue.Group,
};

export type JBitmap = JContainer & {
  type: classValue.Bitmap,
  props: BitmapProps;
};

export type JText = JNode & {
  type: classValue.Text,
};

export type JRect = JNode & {
  type: classValue.Rect,
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
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 'normal' | 'bold' |  'bolder' | 'lighter',
  fontStyle: 'normal' | 'italic' | 'oblique',
  overflow: 'visible' | 'hidden',
  color: string | Array<number>,
  opacity: number,
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
    visible: true,
    overflow: 'visible',
    fontFamily: 'arial',
    fontSize: 16,
    fontWeight: 400,
    fontStyle: 'normal',
    backgroundColor: [0, 0, 0, 0],
    opacity: 1,
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
  style: JStyle,
};

export type BitmapProps = Props & {
  src: string | undefined,
  onLoad?: Function,
  onError?: Function,
};

export type ArtBoardProps = Props & {
  backgroundColor: Array<number>,
};

export enum classValue {
  Page = 'Page',
  ArtBoard = 'ArtBoard',
  Group = 'Group',
  Bitmap = 'Bitmap',
  Text = 'Text',
  Rect = 'Rect',
}
