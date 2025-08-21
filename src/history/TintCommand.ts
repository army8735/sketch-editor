import Group from '../node/Group';
import { FillStyle } from '../format';
import UpdateStyleCommand from './UpdateStyleCommand';

export type TintData = {
  prev: FillStyle,
  next: FillStyle,
  index: number,
};

class FillCommand extends UpdateStyleCommand {
  constructor(nodes: Group[], data: TintData[]) {
    super(nodes, data);
  }
}

export default FillCommand;
