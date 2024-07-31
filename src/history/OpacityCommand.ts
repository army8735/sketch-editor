import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { OpacityStyle } from '../format';

export type OpacityData = {
  prev: OpacityStyle;
  next: OpacityStyle;
};

class OpacityCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: OpacityData[]) {
    super(nodes, data);
  }
}

export default OpacityCommand;
