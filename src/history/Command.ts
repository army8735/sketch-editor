import Node from '../node/Node';

abstract class Command {
  nodes: Node[];

  constructor(nodes: Node[]) {
    this.nodes = nodes;
  }

  abstract execute(): void;

  abstract undo(): void;
}

export default Command;
