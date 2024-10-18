import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';

export type ConstrainProportionData = {
  prev: boolean;
  next: boolean;
};

class ConstrainProportionCommand extends AbstractCommand {
  data: ConstrainProportionData[];

  constructor(nodes: Node[], data: ConstrainProportionData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.props.constrainProportions = data[i].next;
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      node.props.constrainProportions = data[i].prev;
    });
  }
}

export default ConstrainProportionCommand;
