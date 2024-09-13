import Node from '../node/Node';
import { StrokeStyle } from '../format';
import UpdateStyleCommand from './UpdateStyleCommand';

export type StrokeData = {
  prev: StrokeStyle,
  next: StrokeStyle,
};

class StrokeCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: StrokeData[]) {
    super(nodes, data);
  }
}

export default StrokeCommand;
