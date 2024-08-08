import Node from '../node/Node';

abstract class AbstractCommand {
  nodes: Node[];

  protected constructor(nodes: Node[]) {
    this.nodes = nodes;
  }

  abstract execute(): void;

  abstract undo(): void;
}

export default AbstractCommand;
