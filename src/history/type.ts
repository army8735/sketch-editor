import { JStyle } from '../format';
import { ComputedStyle } from '../style/define';

export type MoveStyle = Partial<Pick<JStyle, 'left' | 'right' | 'top' | 'bottom'>>;

export type MoveComputedStyle = Partial<Pick<ComputedStyle, 'left' | 'right' | 'top' | 'bottom'>>;

export type MoveData = {
  prevStyle: MoveStyle;
  nextStyle: MoveStyle;
  prevComputedStyle: MoveComputedStyle;
  nextComputedStyle: MoveComputedStyle;
  dx: number;
  dy: number;
};

export type ResizeStyle = Partial<Pick<JStyle, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>>;

export type ResizeData = { prevStyle: ResizeStyle, nextStyle: ResizeStyle };
