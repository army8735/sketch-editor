import Node from '../node/Node';
import { FillStyle } from '../format';
import UpdateStyleCommand from './UpdateStyleCommand';

export type FillData = {
  prev: FillStyle,
  next: FillStyle,
};

class FillCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: FillData[]) {
    super(nodes, data);
  }
}

export default FillCommand;
