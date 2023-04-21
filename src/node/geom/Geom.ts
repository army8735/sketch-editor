import Node from '../Node';
import { Props } from '../../format';
import { svgPolygon } from '../../refresh/paint';
import { FILL_RULE } from '../../style/define';

class Geom extends Node {
  points?: Array<Array<number>>;
  constructor(props: Props) {
    super(props);
  }

  buildPoints() {
    this.points = [];
  }

  override calContent(): boolean {
    return this.hasContent = true;
  }

  toSvg(scale: number) {
    if (!this.points) {
      this.buildPoints();
    }
    const d = svgPolygon(this.points!);
    const fillRule = this.computedStyle.fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero';
    const props = [
      ['d', d],
      ['fill', '#D8D8D8'],
      ['fill-rule', fillRule],
      ['stroke', '#979797'],
      ['stroke-width', '1'],
    ];
    let s = `<svg width="${this.width}" height="${this.height}" style="transform: scale(${scale})"><path`;
    props.forEach(item => {
      s += ' ' + item[0] + '="' + item[1] + '"';
    });
    return s + '></path></svg>';
  }
}

export default Geom;
