import Container from '../Container';
import Node from '../Node';
import ArtBoard from '../ArtBoard';
import Text from '../Text';
import { Props } from '../../format';
import { RefreshLevel } from '../../refresh/level';

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
      // 特殊更新，手动更新样式并计算，但不触发刷新，因为是在刷新过程中跟着画板当前位置计算的，避免再刷一次
      text.updateStyleData({
        translateX: rect.left,
        translateY: rect.top - 32,
      });
      text.calMatrix(RefreshLevel.TRANSLATE);
    }
  }
}

export default Overlay;
