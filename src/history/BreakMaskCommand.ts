import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { BreakMaskStyle } from '../format';

export type BreakMaskData = {
  prev: BreakMaskStyle;
  next: BreakMaskStyle;
};

class BreakMaskCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: BreakMaskData[]) {
    super(nodes, data);
  }
}

export default BreakMaskCommand;
