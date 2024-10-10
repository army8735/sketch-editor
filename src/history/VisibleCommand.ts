import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { VisibleStyle } from '../format';

export type VisibleData = {
  prev: VisibleStyle;
  next: VisibleStyle;
};

class VisibleCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: VisibleData[]) {
    super(nodes, data);
  }
}

export default VisibleCommand;
