import Command from './Command';

let history: History | undefined;

class History {
  commands: Command[]; // undoList
  commandsR: Command[]; // redoList
  readonly size: number;

  constructor(size = 100) {
    this.commands = [];
    this.commandsR = [];
    this.size = size;
  }

  addCommand(c: Command) {
    const len = this.commands.length;
    if (len >= this.size) {
      this.commands.slice(0, len - this.size + 1);
    }
    this.commands.push(c);
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
