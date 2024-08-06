import Node from '../node/Node';
import UpdateStyleCommand from './UpdateStyleCommand';
import { ShadowStyle } from '../format';

export type ShadowData = {
  prev: ShadowStyle,
  next: ShadowStyle,
};

class UpdateShadowCommand extends UpdateStyleCommand {
  constructor(nodes: Node[], data: ShadowData[]) {
    super(nodes, data);
  }
}

export default UpdateShadowCommand;
