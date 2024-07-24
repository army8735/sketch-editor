import { JStyle, Rich } from '../format';

export type MoveStyle = Partial<Pick<JStyle, 'left' | 'right' | 'top' | 'bottom'>>;

export type MoveData = { prev: MoveStyle, next: MoveStyle };

export type ResizeStyle = Partial<Pick<JStyle, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>>;

export type ResizeData = { prev: ResizeStyle, next: ResizeStyle };

export type ModifyStyle = Partial<JStyle>;

export type ModifyData = { prev: ModifyStyle, next: ModifyStyle };

export type VerticalAlignStyle = Pick<JStyle, 'textVerticalAlign'>;

export type VerticalAlignData = { prev: VerticalAlignStyle, next: VerticalAlignStyle };

export type ModifyRichStyle = Pick<Rich, 'location' | 'length'> & Partial<Rich>;

export type ModifyRichData = { prev: Rich[], next: Rich[] };
