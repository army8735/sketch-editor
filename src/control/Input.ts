import Text from '../node/Text';
import Root from '../node/Root';
import Listener from './Listener';
import state from './state';
import TextCommand from '../history/TextCommand';
import picker from './picker';

export default class Input {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  containerEl: HTMLDivElement;
  inputEl: HTMLInputElement;
  cursorEl: HTMLDivElement;
  node?: Text;
  ignoreBlur: HTMLElement[];
  hasBlur: boolean; // blur后再focus输入，UpdateText命令强制独立不合并，输入后取消

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;
    this.ignoreBlur = [];
    this.hasBlur = true;

    const containerEl = this.containerEl = document.createElement('div');
    containerEl.className = 'input';
    containerEl.style.position = 'absolute';
    containerEl.style.pointerEvents = 'none';
    containerEl.style.opacity = '0';
    dom.appendChild(containerEl);

    const inputEl = this.inputEl = document.createElement('input');
    inputEl.style.position = 'absolute';
    inputEl.style.left = '0px';
    inputEl.style.top = '0px';
    inputEl.style.width = '10px';
    inputEl.style.height = '100%';
    inputEl.style.boxSizing = 'content-box';
    inputEl.style.border = 'none';
    inputEl.style.pointerEvents = 'none';
    inputEl.style.opacity = '0';
    inputEl.type = 'text';
    inputEl.autocomplete = 'off';
    inputEl.spellcheck = false;
    containerEl.appendChild(inputEl);

    const onCallback = (cb: () => void) => {
      if (this.node) {
        const content = this.node._content;
        const rich = this.node.getRich();
        const cursor = this.node.getCursor();
        cb();
        this.updateCursor();
        this.showCursor();
        inputEl.value = '';
        this.listener.select.updateSelect([this.node]);
        listener.emit([Listener.TEXT_CONTENT_NODE, Listener.CURSOR_NODE], [this.node]);
        if (!this.node.nameIsFixed) {
          this.node.name = content;
        }
        this.listener.history.addCommand(new TextCommand([this.node], [{
          prev: {
            content,
            rich,
            cursor,
          },
          next: {
            content: this.node._content,
            rich: this.node.getRich(),
            cursor: this.node.getCursor(),
          },
        }]), this.hasBlur);
        this.hasBlur = false;
      }
    };
    const onInput = (s: string) => {
      if (s) {
        onCallback(() => {
          this.node?.input(s);
        });
      }
    };

    let isIme = false;
    inputEl.addEventListener('keydown', (e) => {
      const { keyCode, code } = e;
      if (this.node) {
        if (keyCode === 13 || code === 'Enter') {
          onCallback(() => {
            this.node?.enter();
          });
        }
        else if (keyCode === 8 || keyCode === 46 || code === 'Backspace' || code === 'Delete') {
          e.stopPropagation();
          onCallback(() => {
            this.node?.delete(keyCode === 46 || code === 'Delete');
          });
        }
        else if (keyCode >= 37 && keyCode <= 40 || ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(code)) {
          e.stopPropagation();
          const p = this.node.moveCursor(keyCode, e.shiftKey);
          if (e.shiftKey) {
            this.hideCursor();
          }
          else {
            this.showCursor();
            this.updateCursor(p);
          }
          listener.emit(Listener.CURSOR_NODE, [this.node]);
        }
      }
    });

    inputEl.addEventListener('input', (e) => {
      if (!isIme) {
        const s = (e as InputEvent).data;
        if (s) {
          onInput(s);
        }
      }
    });
    inputEl.addEventListener('paste', (e) => {
      e.stopPropagation(); // 不冒泡更上层的粘贴元素
      const s = e.clipboardData?.getData('text');
      if (s) {
        // onInput(s);
      }
    });
    inputEl.addEventListener('compositionstart', (e) => {
      isIme = true;
    });
    inputEl.addEventListener('compositionend', (e) => {
      isIme = false;
      const s = e.data;
      if (s) {
        onInput(s);
      }
    });

    const cursorEl = this.cursorEl = document.createElement('div');
    cursorEl.style.position = 'absolute';
    cursorEl.style.left = '0px';
    cursorEl.style.top = '0px';
    cursorEl.style.width = '10px';
    cursorEl.style.height = '100%';
    cursorEl.style.borderLeft = '1px solid #000';
    cursorEl.style.pointerEvents = 'none';
    containerEl.appendChild(cursorEl);

    cursorEl.animate([
      {
        visibility: 'visible',
        borderColor: '#000',
      },
      {
        visibility: 'visible',
        borderColor: '#FFF',
      },
      {
        visibility: 'hidden',
      },
      {
        visibility: 'hidden',
      },
    ], {
      duration: 800,
      iterations: Infinity,
    });

    // 点击外部会blur，当来自画布节点内自身且是编辑态需自动focus，还有来自textPanel（ignoreBlur）
    document.addEventListener('click', (e) => {
      if (listener.state === state.EDIT_TEXT) {
        let target = e.target as HTMLElement;
        let p = target as HTMLElement | null;
        while (p) {
          if (p === listener.dom || this.ignoreBlur.includes(p)) {
            // 防止来源input无法聚焦
            if (!['INPUT', 'SELECT'].includes(target.tagName.toUpperCase())) {
              this.focus();
            }
            return;
          }
          p = p.parentElement;
        }
        picker.aaa.push('cccc')
        // 如果不是focus的需要处理blur
        const node = this.node!;
        listener.cancelEditText();
        node.resetCursor();
        node.afterEdit();
        node.inputStyle = undefined;
      }
    });
  }

  show(node: Text, x: number, y: number) {
    this.node = node;
    this.update(x, y);
    this.focus();
    this.showCursor();
  }

  update(x: number, y: number) {
    const dpi = this.root.dpi;
    const p = this.node!.setCursorStartByAbsCoords(x * dpi, y * dpi);
    this.containerEl.style.left = p.x / dpi + 'px';
    this.containerEl.style.top = p.y / dpi + 'px';
    this.containerEl.style.height = p.h / dpi + 'px';
  }

  hide() {
    this.hideCursor();
    this.blur();
    if (this.node) {
      const empty = !this.node._content.length;
      // 删空内容后blur隐藏则是删除文字节点，需先恢复之前内容
      if (empty) {
        const history = this.listener.history;
        const last = history.commands[0];
        if (last && last instanceof TextCommand && last.nodes[0] === this.node) {
          last.undo();
        }
        this.listener.removeNode();
      }
      this.node = undefined;
    }
  }

  focus() {
    this.inputEl.focus();
  }

  blur() {
    this.inputEl.blur();
    this.hasBlur = true;
  }

  showCursor() {
    this.containerEl.style.opacity = '1';
  }

  // 选区时隐藏光标但还是focus状态（外部控制）
  hideCursor() {
    this.containerEl.style.opacity = '0';
  }

  updateCursor(p?: { x: number, y: number, h: number }) {
    p = p || this.node!.getCursorAbsCoords();
    if (p) {
      const dpi = this.root.dpi;
      this.containerEl.style.left = p.x / dpi + 'px';
      this.containerEl.style.top = p.y / dpi + 'px';
      this.containerEl.style.height = p.h / dpi + 'px';
    }
  }

  destroy() {
    this.hide();
    this.containerEl.remove();
  }
}
