import Node from './Node';
import Container from './Container';
import { Props } from '../format/';
// import { LayoutData, mergeBbox, resetBbox, assignBbox } from '../node/layout';

class Group extends Container {
  children: Array<Node>;

  constructor(name: string, props: Props, children: Array<Node>) {
    super(name, props, children);
    this.children = children;
  }

  // layout(container: Container, data: LayoutData) {
  //   if (this.isDestroyed) {
  //     return;
  //   }
  //   super.layout(container, data);
  //
  //   // group自动尺寸
  //   const { children, bbox } = this;
  //   if (!children.length) {
  //     resetBbox(bbox);
  //     return;
  //   }
  //   assignBbox(bbox, children[0].bbox);
  //   for (let i = 1, len = children.length; i < len; i++) {
  //     mergeBbox(bbox, children[i].bbox);
  //   }
  //   this.x = bbox[0];
  //   this.y = bbox[1];
  //   this.width = bbox[2] - bbox[0];
  //   this.height = bbox[3] - bbox[1];
  // }


}

export default Group;
