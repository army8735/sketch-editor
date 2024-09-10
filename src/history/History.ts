import AbstractCommand from './AbstractCommand';
import MoveCommand from './MoveCommand';
import UpdateStyleCommand from './UpdateStyleCommand';
import ResizeCommand from './ResizeCommand';
import UpdateRichCommand from './UpdateRichCommand';
import UpdateTextCommand from './UpdateTextCommand';
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
  if (a instanceof UpdateRichCommand) {
    if (a.type !== (b as UpdateRichCommand).type) {
      return false;
    }
    const da = a.data, db = (b as UpdateRichCommand).data;
    for (let i = 0, len = da.length; i < len; i++) {
      const ia = da[i], ib = db[i];
      if (ia.prev.length !== ib.prev.length) {
        return false;
      }
      for (let j = 0; j < ia.prev.length; j++) {
        const ra = ia.prev[j], rb = ib.prev[j];
        if (ra.location !== rb.location || ra.length !== rb.length) {
          return false;
        }
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
    // 非独立命令要考虑合并，除了文字输入不看时间间隔外，其它都要；文字输入外部控制independence（blur后再focus第一次）
    if (!independence && len > 0) {
      const last = this.commands[len - 1];
      const isInTime = Date.now() - this.lastTime < config.historyTime;
      const isEditText = last instanceof UpdateTextCommand && c instanceof UpdateTextCommand;
      if ((isInTime || isEditText) && compare(last, c)) {
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
        else if (last instanceof UpdateRichCommand) {
          const data = (c as UpdateRichCommand).data;
          last.data.forEach((item, i) => {
            item.next = data[i].next;
          });
        }
        else if (last instanceof UpdateTextCommand) {
          const data = (c as UpdateTextCommand).data;
          last.data.forEach((item, i) => {
            item.next = data[i].next;
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
