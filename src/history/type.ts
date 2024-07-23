import { JStyle } from '../format';

export type MoveStyle = Partial<Pick<JStyle, 'left' | 'right' | 'top' | 'bottom'>>;

export type MoveData = { prevStyle: MoveStyle, nextStyle: MoveStyle };

export type ResizeStyle = Partial<Pick<JStyle, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>>;

export type ResizeData = { prevStyle: ResizeStyle, nextStyle: ResizeStyle };
