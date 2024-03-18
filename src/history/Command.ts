abstract class Command {
  abstract execute(): void;

  abstract undo(): void;
}

export default Command;
