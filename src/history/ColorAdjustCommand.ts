import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { ColorAdjustStyle } from '../format';

export type ColorAdjustData = {
  prev: ColorAdjustStyle,
  next: ColorAdjustStyle,
};

class ColorAdjustCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: ColorAdjustData[]) {
    super(nodes, data);
  }
}

export default ColorAdjustCommand;
