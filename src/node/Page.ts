import Node from './Node';
import Bitmap from './Bitmap';
import ArtBoard from './ArtBoard';
import Container from './Container';
import Group from './Group';
import Rect from './geom/Rect';
import { ArtBoardProps, BitmapProps, JContainer, Props } from '../format/';
import { classValue, JNode, JPage } from '../format';

function parse(json: JNode): Node | undefined {
  if (json.type === classValue.ArtBoard) {
    const children = [];
    for(let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i]);
      if(res) {
        children.push(res);
      }
    }
    return new ArtBoard(json.props as ArtBoardProps, children);
  }
  else if (json.type === classValue.Group) {
    const children = [];
    for(let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i]);
      if(res) {
        children.push(res);
      }
    }
    return new Group(json.props, children);
  }
  else if (json.type === classValue.Bitmap) {
    return new Bitmap(json.props as BitmapProps);
  }
  else if (json.type === classValue.Text) {
  }
  else if (json.type === classValue.Rect) {
    return new Rect(json.props);
  }
}

class Page extends Container {
  json?: JPage;
  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.isPage = true;
  }

  initIfNot() {
    if (this.json) {
      for(let i = 0, len = this.json.children.length; i < len; i++) {
        const res = parse(this.json.children[i]);
        if(res) {
          this.appendChild(res);
        }
      }
      this.json = undefined;
    }
  }
}

export default Page;
