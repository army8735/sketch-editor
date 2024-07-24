import { JStyle } from '../format';

export type MoveStyle = Partial<Pick<JStyle, 'left' | 'right' | 'top' | 'bottom'>>;

export type MoveData = { prevStyle: MoveStyle, nextStyle: MoveStyle };

export type ResizeStyle = Partial<Pick<JStyle, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>>;

export type ResizeData = { prevStyle: ResizeStyle, nextStyle: ResizeStyle };

export type ModifyStyle = Partial<JStyle>;

export type ModifyData = { prev: ModifyStyle, next: ModifyStyle };
