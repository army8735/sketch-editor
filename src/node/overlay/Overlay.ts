import Container from '../Container';
import Node from '../Node';
import ArtBoard from '../ArtBoard';
import Text from '../Text';
import { Props } from '../../format';

class Overlay extends Container {
  artBoards: Container;
  abList: Array<{ ab: ArtBoard, text: Text }>;
  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.artBoards = new Container({
      style: {
        width: '100%',
        height: '100%',
        pointerEvents: false,
      },
    }, []);
    this.appendChild(this.artBoards);
    this.abList = [];
  }

  setArtBoard(list: Array<ArtBoard>) {
    this.artBoards.clearChildren();
    this.abList.splice(0);
    for (let i = 0, len = list.length; i < len; i++) {
      const ab = list[i];
      const text = new Text({
        style: {
          fontSize: 24,
          color: '#777',
          visible: false,
        },
        content: ab.props.name || '画板',
      });
      this.artBoards.appendChild(text);
      this.abList.push({ ab, text });
    }
  }

  update() {
    const abList = this.abList;
    for (let i = 0, len = abList.length; i < len; i++) {
      const { ab, text } = abList[i];
      const rect = ab.getBoundingClientRect();
      text.updateStyle({
        visible: true,
        translateX: rect.left,
        translateY: rect.top - 32,
      });
    }
  }
}

export default Overlay;
