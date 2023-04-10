class TextBox {
  x = 0;
  y = 0;
  w = 0;
  lineHeight = 0;
  baseline = 0;
  str: string;
  font: string;

  constructor(x: number, y: number, w: number, lineHeight: number, baseline: number,
              str: string, font: string) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.str = str;
    this.lineHeight = lineHeight;
    this.baseline = baseline;
    this.font = font;
  }
}

export default TextBox;
