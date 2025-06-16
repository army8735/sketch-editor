import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';

export enum POSITION {
  BEFORE = 0,
  AFTER = 1,
  PREPEND = 2,
  APPEND = 3,
}

class PositionCommand extends AbstractCommand {
  constructor(nodes: Node[]) {
    super(nodes);
  }

  execute() {
  }

  undo() {}
}

export default PositionCommand;
