import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { FlipVStyle } from '../format';

export type FlipVData = {
  prev: FlipVStyle;
  next: FlipVStyle;
};

class FlipVCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: FlipVData[]) {
    super(nodes, data);
  }
}

export default FlipVCommand;
