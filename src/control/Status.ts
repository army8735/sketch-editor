import Node from '../node/Node';

export default class Status {
  currentStatus: number;
  metaKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  spaceKey: boolean;
  node: Node | undefined;

  constructor(n: number = Status.NONE) {
    this.currentStatus = n;
    this.metaKey = false;
    this.shiftKey = false;
    this.ctrlKey = false;
    this.altKey = false;
    this.spaceKey = false;
  }

  static NONE = 0;
}
