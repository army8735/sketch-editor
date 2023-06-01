class TextBox {
  x: number;
  y: number;
  w: number;
  lineHeight: number;
  baseline: number;
  index: number; // 位于整个Text字符串的索引
  str: string;
  font: string;
  letterSpacing: string;

  constructor(
    x: number,
    y: number,
    w: number,
    lineHeight: number,
    baseline: number,
    index: number,
    str: string,
    font: string,
    letterSpacing: string,
  ) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.lineHeight = lineHeight;
    this.baseline = baseline;
    this.index = index;
    this.str = str;
    this.font = font;
    this.letterSpacing = letterSpacing;
  }
}

export default TextBox;
