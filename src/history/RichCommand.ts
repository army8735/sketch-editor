import AbstractCommand from './AbstractCommand';
import Text from '../node/Text';
import { Rich } from '../format';

export type RichData = {
  prev: Rich[];
  next: Rich[];
};

class RichCommand extends AbstractCommand {
  data: RichData[];
  type: string; // 区分text-panel改的类型，比如字体、大小、颜色等等

  constructor(nodes: Text[], data: RichData[], type: string) {
    super(nodes);
    this.data = data;
    this.type = type;
  }

  execute() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      (node as Text).setRich(data[i].next);
    });
  }

  undo() {
    const { nodes, data } = this;
    nodes.forEach((node, i) => {
      (node as Text).setRich(data[i].prev);
    });
  }

  static FONT_FAMILY = 'FONT_FAMILY';
  static FONT_SIZE = 'FONT_SIZE';
  static LETTER_SPACING = 'LETTER_SPACING';
  static LINE_HEIGHT = 'LINE_HEIGHT';
  static PARAGRAPH_SPACING = 'PARAGRAPH_SPACING';
  static COLOR = 'COLOR';
  static TEXT_ALIGN = 'TEXT_ALIGN';
}

export default RichCommand;
