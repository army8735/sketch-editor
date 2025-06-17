import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';

class PositionCommand extends AbstractCommand {
  constructor(nodes: Node[]) {
    super(nodes);
  }

  execute() {
  }

  undo() {}
}

export default PositionCommand;
