import Node from './Node';
import Bitmap from './Bitmap';
import ArtBoard from './ArtBoard';
import Container from './Container';
import Group from './Group';
import Text from './Text';
import Polyline from './geom/Polyline';
import ShapeGroup from './geom/ShapeGroup';
import {
  Props,
  ArtBoardProps,
  BitmapProps,
  JContainer,
  PolylineProps,
  TextProps,
} from '../format/';
import { TagName, JNode, JPage } from '../format';

function parse(json: JNode): Node | undefined {
  if (json.tagName === TagName.ArtBoard) {
    const children = [];
    for(let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i]);
      if(res) {
        children.push(res);
      }
    }
    return new ArtBoard(json.props as ArtBoardProps, children);
  }
  else if (json.tagName === TagName.Group) {
    const children = [];
    for(let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i]);
      if(res) {
        children.push(res);
      }
    }
    return new Group(json.props, children);
  }
  else if (json.tagName === TagName.Bitmap) {
    return new Bitmap(json.props as BitmapProps);
  }
  else if (json.tagName === TagName.Text) {
    return new Text(json.props as TextProps);
  }
  else if (json.tagName === TagName.Polyline) {
    return new Polyline(json.props as PolylineProps);
  }
  else if (json.tagName === TagName.ShapeGroup) {
    const children = [];
    for(let i = 0, len = (json as JContainer).children.length; i < len; i++) {
      const res = parse((json as JContainer).children[i]) as (Polyline | ShapeGroup);
      if(res) {
        children.push(res);
      }
    }
    return new ShapeGroup(json.props, children);
  }
}

class Page extends Container {
  json?: JPage;
  constructor(props: Props, children: Array<Node>) {
    super(props, children);
    this.isPage = true;
    this.page = this;
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
