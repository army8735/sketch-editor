import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';

class PositionCommand extends AbstractCommand {
  constructor(nodes: Node[]) {
    super(nodes);
  }

  execute() {
  }

  undo() {}

  static operate(nodes: Node[], target: Node, list: HTMLElement[], el: HTMLElement, ps: 'before' | 'after' | 'append') {
    // const el = nodes.map(item => )
  }
}

export default PositionCommand;
