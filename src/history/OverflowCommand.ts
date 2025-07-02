import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { OverflowStyle } from '../format';

export type OverflowData = {
  prev: OverflowStyle;
  next: OverflowStyle;
};

class OverflowCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: OverflowData[]) {
    super(nodes, data);
  }
}

export default OverflowCommand;
