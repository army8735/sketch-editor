import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { FlipHStyle } from '../format';

export type FlipHData = {
  prev: FlipHStyle;
  next: FlipHStyle;
};

class FlipHCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: FlipHData[]) {
    super(nodes, data);
  }
}

export default FlipHCommand;
