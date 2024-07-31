import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { RotateZStyle } from '../format';

export type RotateData = {
  prev: RotateZStyle;
  next: RotateZStyle;
};

class RotateCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: RotateData[]) {
    super(nodes, data);
  }
}

export default RotateCommand;
