import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { VerticalAlignStyle } from '../format';

export type VerticalAlignData = {
  prev: VerticalAlignStyle;
  next: VerticalAlignStyle;
};

class VerticalAlignCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: VerticalAlignData[]) {
    super(nodes, data);
  }
}

export default VerticalAlignCommand;
