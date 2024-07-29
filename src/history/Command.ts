import Node from '../node/Node';

abstract class Command {
  nodes: Node[];

  protected constructor(nodes: Node[]) {
    this.nodes = nodes;
  }

  abstract execute(): void;

  abstract undo(): void;
}

export default Command;
