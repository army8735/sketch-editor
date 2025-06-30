import { Props } from '../../format';
import { RefreshLevel } from '../../refresh/level';
import { calPoint } from '../../math/matrix';
import ArtBoard from '../ArtBoard';
import Container from '../Container';
import Node from '../Node';
import SymbolMaster from '../SymbolMaster';
import Text from '../Text';
import AbstractFrame from '../AbstractFrame';

class Overlay extends Container {
  nameContainer: Container; // artboard,frame,graphic
  list: { node: ArtBoard | AbstractFrame, text: Text }[];

  constructor(props: Props, children: Node[]) {
    super(props, children);
    this.nameContainer = new Container(
      {
        name: 'overlay-name-container',
        uuid: '',
        index: 0,
        style: {
          width: '100%',
          height: '100%',
          pointerEvents: false,
        },
      },
      [],
    );
    this.appendChild(this.nameContainer);
    this.list = [];
  }

  setList(list: (ArtBoard | AbstractFrame)[]) {
    this.nameContainer.clearChildren();
    this.list.splice(0);
    for (let i = 0, len = list.length; i < len; i++) {
      const node = list[i];
      const name = 'overlay-' + (node.name || '画板');
      const color = node instanceof SymbolMaster ? '#b6e' : '#777';
      const text = new Text({
        name,
        uuid: '',
        index: 0,
        style: {
          fontSize: 24,
          color,
        },
        content: node.name || '画板',
      });
      this.nameContainer.appendChild(text);
      this.list.push({ node, text });
    }
  }

  updateList(node: ArtBoard | AbstractFrame) {
    const list = this.list;
    for (let i = 0, len = list.length; i < len; i++) {
      if (list[i].node === node) {
        list[i].text.content = node.name || '画板';
        break;
      }
    }
  }

  removeList(node: ArtBoard | AbstractFrame) {
    const list = this.list;
    for (let i = 0, len = list.length; i < len; i++) {
      if (list[i].node === node) {
        list.splice(i, 1);
        this.nameContainer.removeChild(this.nameContainer.children[i]);
        break;
      }
    }
  }

  update() {
    const list = this.list;
    for (let i = 0, len = list.length; i < len; i++) {
      const { node, text } = list[i];
      const rect = node._rect || node.rect;
      const t = calPoint({ x: rect[0], y: rect[1]}, node.matrixWorld);
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
