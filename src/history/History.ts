import AbstractCommand from './AbstractCommand';
import MoveCommand from './MoveCommand';
import UpdateStyleCommand from './UpdateStyleCommand';
import ResizeCommand from './ResizeCommand';
import config from '../util/config';

let history: History | undefined;

function compare(a: AbstractCommand, b: AbstractCommand) {
  if (a.constructor !== b.constructor) {
    return false;
  }
  const na = a.nodes, nb = b.nodes;
  if (na.length !== nb.length) {
    return false;
  }
  for (let i = 0, len = na.length; i < len; i++) {
    if (na[i] !== nb[i]) {
      return false;
    }
  }
  if (a instanceof ResizeCommand) {
    const da = a.data, db = (b as ResizeCommand).data;
    for (let i = 0, len = da.length; i < len; i++) {
      const ia = da[i], ib = db[i];
      if (ia.controlType !== ib.controlType
        || ia.aspectRatio !== ib.aspectRatio
        || ia.fromCenter !== ib.fromCenter
        || ia.widthFromAuto !== ib.widthFromAuto
        || ia.heightFromAuto !== ib.heightFromAuto
        || ia.widthToAuto !== ib.widthToAuto
        || ia.heightToAuto !== ib.heightToAuto) {
        return false;
      }
    }
  }
  return true;
}

class History {
  commands: AbstractCommand[]; // undoList
  commandsR: AbstractCommand[]; // redoList
  readonly size: number;
  lastTime: number;

  constructor(size = 100) {
    this.commands = [];
    this.commandsR = [];
    this.size = Math.max(1, size);
    this.lastTime = 0;
  }

  addCommand(c: AbstractCommand, independence = false) {
    // 新命令清空redo队列
    this.commandsR.splice(0);
    const len = this.commands.length;
    // 非独立命令要考虑合并
    if (!independence && len > 0 && (Date.now() - this.lastTime < config.historyTime)) {
      const last = this.commands[len - 1];
      if (compare(last, c)) {
        let hasMerge = true;
        if (last instanceof MoveCommand) {
          const data = (c as MoveCommand).data;
          last.data.forEach((item, i) => {
            item.dx += data[i].dx;
            item.dy += data[i].dy;
          });
        }
        else if (last instanceof UpdateStyleCommand) {
          const data = (c as UpdateStyleCommand).data;
          last.data.forEach((item, i) => {
            item.next = data[i].next;
          });
        }
        else if (last instanceof ResizeCommand) {
          const data = (c as ResizeCommand).data;
          last.data.forEach((item, i) => {
            item.dx += data[i].dx;
            item.dy += data[i].dy;
          });
        }
        // 没命中合并的走后续普通流程
        else {
          hasMerge = false;
        }
        if (hasMerge) {
          this.lastTime = Date.now();
          return;
        }
      }
    }
    this.lastTime = Date.now();
    // 加入一条新命令，如果超过长度限制先入先出老的
    if (len >= this.size) {
      this.commands.slice(0, len - this.size + 1);
    }
    this.commands.push(c);
  }

  undo() {
    if (this.commands.length) {
      const c = this.commands.pop()!;
      c.undo();
      this.commandsR.push(c);
      return c;
    }
  }

  redo() {
    if (this.commandsR.length) {
      const c = this.commandsR.pop()!;
      c.execute();
      this.commands.push(c);
      return c;
    }
  }

  static getInstance() {
    if (!history) {
      history = new History();
    }
    return history;
  }
}

export default History;
