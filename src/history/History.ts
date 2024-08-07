import AbstractCommand from './AbstractCommand';

let history: History | undefined;

class History {
  commands: AbstractCommand[]; // undoList
  commandsR: AbstractCommand[]; // redoList
  readonly size: number;

  constructor(size = 100) {
    this.commands = [];
    this.commandsR = [];
    this.size = size;
  }

  addCommand(c: AbstractCommand) {
    const len = this.commands.length;
    // 加入一条新命令，如果超过长度限制先入先出老的
    if (len >= this.size) {
      this.commands.slice(0, len - this.size + 1);
    }
    this.commands.push(c);
    // 新命令清空redo队列
    this.commandsR.splice(0);
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
