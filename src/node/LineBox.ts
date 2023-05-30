import TextBox from './TextBox';

class LineBox {
  y: number;
  w: number;
  h: number;
  index: number; // 位于整个Text字符串的索引
  list: TextBox[];
  startEnter: boolean;
  endEnter: boolean;

  constructor(y: number, h: number, index: number, startEnter: boolean) {
    this.y = y;
    this.w = 0;
    this.h = h;
    this.index = index;
    this.list = [];
    this.startEnter = startEnter;
    this.endEnter = false;
  }

  add(textBox: TextBox) {
    this.list.push(textBox);
    this.w += textBox.w;
  }

  verticalAlign() {
    const { baseline, list } = this;
    for (let i = 0, len = list.length; i < len; i++) {
      const textBox = list[i];
      const b = textBox.baseline;
      if (b !== baseline) {
        const d = baseline - b;
        textBox.y += d;
      }
    }
  }

  offsetX(n: number) {
    const list = this.list;
    for (let i = 0, len = list.length; i < len; i++) {
      list[i].x += n;
    }
  }

  get size() {
    return this.list.length;
  }

  get baseline(): number {
    let n = 0;
    const list = this.list;
    for (let i = 0, len = list.length; i < len; i++) {
      n = Math.max(n, list[i].baseline);
    }
    return n;
  }

  get lineHeight(): number {
    const list = this.list;
    if (list.length) {
      let n = 0;
      for (let i = 0, len = list.length; i < len; i++) {
        n = Math.max(n, list[i].lineHeight);
      }
      return n;
    }
    return this.h;
  }
}

export default LineBox;
