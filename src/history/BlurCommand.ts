import Node from '../node/Node';
import { BlurStyle } from '../format';
import UpdateStyleCommand from './UpdateStyleCommand';

export type BlurData = {
  prev: BlurStyle,
  next: BlurStyle,
};

class BlurCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: BlurData[]) {
    super(nodes, data);
  }
}

export default BlurCommand;
