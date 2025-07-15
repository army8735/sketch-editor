import AbstractCommand from './AbstractCommand';
import Node from '../node/Node';
import { ExportFormats } from '../format';

export type ExportData = {
  prev: ExportFormats[];
  next: ExportFormats[];
};

class ExportCommand extends AbstractCommand {
  data: ExportData[];

  constructor(nodes: Node[], data: ExportData[]) {
    super(nodes);
    this.data = data;
  }

  execute() {
    const data = this.data;
    this.nodes.forEach((node, i) => {
      node.exportOptions.exportFormats = data[i].next;
    });
  }

  undo() {
    const data = this.data;
    this.nodes.forEach((node, i) => {
      node.exportOptions.exportFormats = data[i].prev;
    });
  }
}

export default ExportCommand;
