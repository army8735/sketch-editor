import Group from '../node/Group';
import Listener from './Listener';
import { MASK, VISIBILITY } from '../style/define';
import { version } from '../../package.json';
import State from './State';

let canvasDiv: HTMLElement;

const htmlCanvas = `
  <div class="item group">编组选择对象</div>
  <div class="item un-group">解除编组</div>
  <div class="item select-all">选择全部</div>
  <div class="split"></div>
  <div class="item cut">剪切</div>
  <div class="item copy">复制</div>
  <div class="item paste">粘贴</div>
  <div class="split"></div>
  <div class="item remove">删除</div>
  <div class="split"></div>
  <div class="item lock">锁定<span></span>个图层</div>
  <div class="item un-lock">解锁<span></span>个图层</div>
  <div class="item hide">隐藏<span></span>个图层</div>
  <div class="item show">显示<span></span>个图层</div>
  <div class="split"></div>
  <div class="item mask">
    <span class="checked">✅</span>用作蒙版 <b class="arrow"></b>
    <div class="sub">
      <div class="item outline-mask"><span class="checked">✅</span>轮廓模版</div>
      <div class="item alpha-mask"><span class="checked">✅</span>透明度模版</div>
    </div>
  </div>
  <div class="item break-mask"><span class="checked">✅</span>忽略底层蒙版</div>
  <div class="split"></div>
  <div class="item scale-up">放大</div>
  <div class="item scale-down">缩小</div>
  <div class="split"></div>
  <div class="item ok">确定</div>
  <div class="item version">版本 ${version}</div>
`;

function init(listener: Listener) {
  if (!canvasDiv) {
    canvasDiv = document.createElement('div');
    document.body.appendChild(canvasDiv);
    // 点击自动关闭，外部或者子项都可，但点自身不关闭，因为有padding或者不可点击的项视为点自己
    document.addEventListener('click', (e) => {
      if (e.target !== canvasDiv) {
        if (hide()) {
          listener.emit(Listener.CONTEXT_MENU, false, canvasDiv);
        }
      }
    });
    document.addEventListener('visibilitychange', (e) => {
      if (document.visibilityState === 'hidden') {
        if (hide()) {
          listener.emit(Listener.CONTEXT_MENU, false, canvasDiv);
        }
      }
    });
    canvasDiv.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const classList = target.classList;
      // 菜单空白处忽略任何动作不冒泡触发
      if (target === canvasDiv) {
        e.stopPropagation();
      }
      else if (classList.contains('group')) {
        listener.group();
      }
      else if (classList.contains('un-group')) {
        listener.unGroup();
      }
      else if (classList.contains('select-all')) {
        listener.selectAll();
      }
      else if (classList.contains('scale-up') || classList.contains('scale-down')) {
        listener.zoom(classList.contains('scale-up') ? 2 : 0.5);
      }
      else if (classList.contains('mask') || classList.contains('outline-mask')) {
        if (canvasDiv.classList.contains('outline')) {
          listener.mask('none');
        }
        else {
          listener.mask('outline');
        }
      }
      else if (classList.contains('alpha-mask')) {
        if (canvasDiv.classList.contains('alpha')) {
          listener.mask('none');
        }
        else {
          listener.mask('alpha');
        }
      }
      else if (classList.contains('break-mask')) {
        if (canvasDiv.classList.contains('break')) {
          listener.breakMask(false);
        }
        else {
          listener.breakMask(true);
        }
      }
      else if (classList.contains('lock')) {
        listener.lock(true);
      }
      else if (classList.contains('un-lock')) {
        listener.lock(false);
      }
      else if (classList.contains('hide')) {
        listener.visible('hidden');
      }
      else if (classList.contains('show')) {
        listener.visible('visible');
      }
      else if (classList.contains('remove')) {
        listener.remove();
      }
      else if (classList.contains('cut') || classList.contains('copy')) {
        listener.clone();
        if (classList.contains('cut') && !listener.options.disabled?.remove) {
          listener.remove();
        }
      }
      else if (classList.contains('paste')) {
        listener.paste();
      }
      else if (classList.contains('ok')) {
        listener.state = State.NORMAL;
      }
    });
  }
  canvasDiv.innerHTML = htmlCanvas;
  canvasDiv.className = 'sketch-editor-context-menu';
}

function hide() {
  if (canvasDiv && canvasDiv.style.display === 'block') {
    canvasDiv.style.display = 'none';
    return true;
  }
  return false;
}

export default {
  showCanvas(x: number, y: number, listener: Listener) {
    init(listener);
    const classList = canvasDiv.classList;
    const nodes = listener.selected;
    if (nodes.length > 1) {
      classList.add('multi');
    }
    else if (nodes.length === 1) {
      const node = nodes[0];
      if (node instanceof Group) {
        classList.add('single-group');
      }
      else {
        classList.add('single');
      }
    }
    else {
      classList.add('empty');
    }
    if (listener.clones.length) {
      classList.remove('no-clone');
    }
    else {
      classList.add('no-clone');
    }
    let hasMask = nodes.filter(item => item.computedStyle.maskMode);
    if (hasMask.length) {
      let outline = nodes.filter(item => item.computedStyle.maskMode === MASK.OUTLINE);
      if (outline.length) {
        classList.add('outline');
      }
      else {
        classList.add('alpha');
      }
    }
    let hasBreakMask = nodes.filter(item => item.computedStyle.breakMask);
    if (hasBreakMask.length) {
      classList.add('break');
    }
    let hasLocked = nodes.filter(item => item.props.isLocked);
    if (hasLocked.length === nodes.length) {
      classList.add('locked');
      canvasDiv.querySelector('.un-lock span')!.innerHTML = hasLocked.length.toString();
    }
    else {
      canvasDiv.querySelector('.lock span')!.innerHTML = nodes.length.toString();
    }
    let hasHidden = nodes.filter(item => item.computedStyle.visibility === VISIBILITY.HIDDEN);
    if (hasHidden.length === nodes.length) {
      classList.add('hidden');
      canvasDiv.querySelector('.show span')!.innerHTML = hasHidden.length.toString();
    }
    else {
      canvasDiv.querySelector('.hide span')!.innerHTML = nodes.length.toString();
    }
    canvasDiv.style.left = x + 'px';
    canvasDiv.style.top = y + 'px';
    canvasDiv.style.display = 'block';
    listener.emit(Listener.CONTEXT_MENU, true, canvasDiv);
  },
  showTree(x: number, y: number, listener: Listener) {
    this.showCanvas(x, y, listener);
  },
  showOk(x: number, y: number, listener: Listener) {
    init(listener);
    const classList = canvasDiv.classList;
    classList.add('only-ok');
    canvasDiv.style.left = x + 'px';
    canvasDiv.style.top = y + 'px';
    canvasDiv.style.display = 'block';
    listener.emit(Listener.CONTEXT_MENU, true, canvasDiv);
  },
  hide,
};
