import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { MaskModeStyle } from '../format';

export type MaskModeData = {
  prev: MaskModeStyle;
  next: MaskModeStyle;
};

class MaskModeCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: MaskModeData[]) {
    super(nodes, data);
  }
}

export default MaskModeCommand;
