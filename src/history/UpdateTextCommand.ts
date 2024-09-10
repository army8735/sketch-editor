import AbstractCommand from './AbstractCommand';
import Text, { Cursor } from '../node/Text';
import { Rich } from '../format';

export type UpdateTextData = {
  prev: {
    content: string;
    rich: Rich[];
    cursor: Cursor;
  };
  next: {
    content: string;
    rich: Rich[];
    cursor: Cursor;
  };
};

class UpdateTextCommand extends AbstractCommand {
  data: UpdateTextData[];

  constructor(nodes: Text[], data: UpdateTextData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      (node as Text).cursor = data[i].next.cursor;
      (node as Text).content = data[i].next.content;
      (node as Text).setRich(data[i].next.rich);
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      (node as Text).cursor = data[i].prev.cursor;
      (node as Text).content = data[i].prev.content;
      (node as Text).setRich(data[i].prev.rich);
    });
  }
}

export default UpdateTextCommand;
