import Container from '../Container';
import Node from '../Node';
import ArtBoard from '../ArtBoard';
import Text from '../Text';
import { getDefaultStyle, Props } from '../../format';

class Overlay extends Container {
  artBoard: Container;
  abList: Array<{ ab: ArtBoard, text: Text }>;
  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.artBoard = new Container({
      style: getDefaultStyle({
        width: '100%',
        height: '100%',
        pointerEvents: false,
      }),
    }, []);
    this.appendChild(this.artBoard);
    this.abList = [];
  }

  setArtBoard(list: Array<ArtBoard>) {
    this.artBoard.clearChildren();
    this.abList.splice(0);
    for (let i = 0, len = list.length; i < len; i++) {
      const ab = list[i];
      const rect = ab.getBoundingClientRect();
      const text = new Text({
        style: getDefaultStyle({
          fontSize: 24,
          color: '#777',
          translateX: rect.left,
          translateY: rect.top - 32,
        }),
      }, ab.props.name || '画板');
      this.artBoard.appendChild(text);
      this.abList.push({ ab, text });
    }
  }
}

export default Overlay;
