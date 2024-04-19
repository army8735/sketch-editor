import { Props } from '../../format';
import { RefreshLevel } from '../../refresh/level';
import ArtBoard from '../ArtBoard';
import Container from '../Container';
import Node from '../Node';
import SymbolMaster from '../SymbolMaster';
import Text from '../Text';
import { calPoint } from '../../math/matrix';

class Overlay extends Container {
  artBoards: Container;
  artBoardList: Array<{ artBoard: ArtBoard; text: Text }>;

  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.artBoards = new Container(
      {
        name: 'overlay-artBoards',
        uuid: '',
        style: {
          width: '100%',
          height: '100%',
          pointerEvents: false,
        },
      },
      [],
    );
    this.appendChild(this.artBoards);
    this.artBoardList = [];
  }

  setArtBoard(list: Array<ArtBoard>) {
    this.artBoards.clearChildren();
    this.artBoardList.splice(0);
    for (let i = 0, len = list.length; i < len; i++) {
      const artBoard = list[i];
      const name = 'overlay-' + (artBoard.props.name || '画板');
      const color = artBoard instanceof SymbolMaster ? '#b6e' : '#777';
      const text = new Text({
        name,
        uuid: '',
        style: {
          fontSize: 24,
          color,
        },
        content: artBoard.props.name || '画板',
      });
      this.artBoards.appendChild(text);
      this.artBoardList.push({ artBoard, text });
    }
  }

  updateArtBoard(artBoard: ArtBoard) {
    const list = this.artBoardList;
    for (let i = 0, len = list.length; i < len; i++) {
      if (list[i].artBoard === artBoard) {
        list[i].text.content = artBoard.props.name || '画板';
        break;
      }
    }
  }

  update() {
    const artBoardList = this.artBoardList;
    for (let i = 0, len = artBoardList.length; i < len; i++) {
      const { artBoard, text } = artBoardList[i];
      const rect = artBoard._rect || artBoard.rect;
      const t = calPoint({ x: rect[0], y: rect[1]}, artBoard.matrixWorld);
      // 特殊更新，手动更新样式并计算，但不触发刷新，因为是在刷新过程中跟着画板当前位置计算的，避免再刷一次
      const res = text.updateStyleData({
        translateX: t.x,
        translateY: t.y - 32,
      });
      if (res.length) {
        text.calMatrix(RefreshLevel.TRANSLATE);
      }
    }
  }
}

export default Overlay;
