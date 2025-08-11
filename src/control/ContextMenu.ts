import Listener from './Listener';
import { version } from '../../package.json';
import state from './state';
import AbstractGroup from '../node/AbstractGroup';
import { MASK, VISIBILITY } from '../style/define';
import SymbolInstance from '../node/SymbolInstance';

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
  <div class="item next">前置一层</div>
  <div class="item prev">后置一层</div>
  <div class="split"></div>
  <div class="item lock">锁定<span></span>个图层</div>
  <div class="item un-lock">解锁<span></span>个图层</div>
  <div class="item hide">隐藏<span></span>个图层</div>
  <div class="item show">显示<span></span>个图层</div>
  <div class="split"></div>
  <div class="item mask">
    <span class="checked">✅</span>用作蒙版 <b class="arrow"></b>
    <div class="sub">
      <div class="item outline-mask"><span class="checked">✅</span>轮廓蒙版</div>
      <div class="item alpha-mask"><span class="checked">✅</span>透明度蒙版</div>
      <div class="item gray-mask"><span class="checked">✅</span>灰度蒙版</div>
      <div class="item alpha-with-mask"><span class="checked">✅</span>透明内容蒙版</div>
      <div class="item gray-with-mask"><span class="checked">✅</span>灰度内容蒙版</div>
    </div>
  </div>
  <div class="item break-mask"><span class="checked">✅</span>忽略底层蒙版</div>
  <div class="split"></div>
  <div class="item un-bind">与控件解绑</div>
  <div class="split"></div>
  <div class="item scale-up">放大</div>
  <div class="item scale-down">缩小</div>
  <div class="split"></div>
  <div class="item ok">确定</div>
  <div class="item version">版本 ${version}</div>
`;

class ContextMenu {
  dom: HTMLElement;
  keep: boolean;
  hasInit: boolean;
  listener: Listener;
  onClick: (e: MouseEvent) => void;
  onVisibleChange: (e: Event) => void;

  constructor(listener: Listener) {
    this.dom = document.createElement('div');
    this.keep = false;
    this.hasInit = false;
    this.listener = listener;
    this.onClick = (e) => {
      if (this.keep) {
        this.keep = false;
        return;
      }
      if (this.hide()) {
        listener.emit(Listener.CONTEXT_MENU, false, this.dom);
      }
    };
    this.onVisibleChange = (e) => {
      if (document.visibilityState === 'hidden') {
        if (this.hide()) {
          listener.emit(Listener.CONTEXT_MENU, false, this.dom);
        }
      }
    };
  }

  init() {
    this.dom.className = 'sketch-editor-context-menu';
    if (this.hasInit) {
      return;
    }
    this.hasInit = true;
    this.dom.innerHTML = htmlCanvas;
    const listener = this.listener;
    this.dom.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const classList = target.classList;
      // 菜单空白处忽略任何动作不冒泡触发
      if (target === this.dom) {
        this.keep = true;
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
        if (this.dom.classList.contains('outline')) {
          listener.mask('none');
        }
        else {
          listener.mask('outline');
        }
      }
      else if (classList.contains('alpha-mask')) {
        if (this.dom.classList.contains('alpha')) {
          listener.mask('none');
        }
        else {
          listener.mask('alpha');
        }
      }
      else if (classList.contains('gray-mask')) {
        if (this.dom.classList.contains('gray')) {
          listener.mask('none');
        }
        else {
          listener.mask('gray');
        }
      }
      else if (classList.contains('alpha-with')) {
        if (this.dom.classList.contains('alpha-with')) {
          listener.mask('none');
        }
        else {
          listener.mask('alpha-with');
        }
      }
      else if (classList.contains('gray-with')) {
        if (this.dom.classList.contains('gray-with')) {
          listener.mask('none');
        }
        else {
          listener.mask('gray-with');
        }
      }
      else if (classList.contains('break-mask')) {
        if (this.dom.classList.contains('break')) {
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
        listener.removeNode();
      }
      else if (classList.contains('cut') || classList.contains('copy')) {
        listener.clone();
        if (classList.contains('cut') && !listener.options.disabled?.remove) {
          listener.removeNode();
        }
      }
      else if (classList.contains('paste')) {
        listener.paste();
      }
      else if (classList.contains('ok')) {
        if (listener.state === state.EDIT_GEOM) {
          listener.cancelEditGeom();
        }
        else if (listener.state === state.EDIT_GRADIENT) {
          listener.cancelEditGradient();
        }
        listener.state = state.NORMAL;
      }
      else if (classList.contains('prev')) {
        listener.prev();
      }
      else if (classList.contains('next')) {
        listener.next();
      }
      else if (classList.contains('un-bind')) {
        listener.unBind();
      }
    });
    document.body.appendChild(this.dom);
    document.addEventListener('click', this.onClick);
    document.addEventListener('visibilitychange', this.onVisibleChange);
  }

  hide() {
    if (this.dom.style.display === 'block') {
      this.dom.style.display = 'none';
      // 还原
      this.dom.className = 'sketch-editor-context-menu';
      return true;
    }
    return false;
  }

  showCanvas(x: number, y: number) {
    this.init();
    const listener = this.listener;
    const classList = this.dom.classList;
    const nodes = listener.selected;
    if (nodes.length > 1) {
      classList.add('multi');
    }
    else if (nodes.length === 1) {
      const node = nodes[0];
      if (node instanceof AbstractGroup) {
        classList.add('single-group');
      }
      else if (node instanceof SymbolInstance) {
        classList.add('single-si');
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
    const hasMask = nodes.filter(item => item.computedStyle.maskMode);
    if (hasMask.length) {
      const outline = nodes.filter(item => item.computedStyle.maskMode === MASK.OUTLINE);
      const alpha = nodes.filter(item => item.computedStyle.maskMode === MASK.ALPHA);
      const gray = nodes.filter(item => item.computedStyle.maskMode === MASK.GRAY);
      const alphaWith = nodes.filter(item => item.computedStyle.maskMode === MASK.ALPHA_WITH);
      const grayWith = nodes.filter(item => item.computedStyle.maskMode === MASK.GRAY_WITH);
      if (outline.length) {
        classList.add('outline');
      }
      else if (alpha.length) {
        classList.add('alpha');
      }
      else if (gray.length) {
        classList.add('gray');
      }
      else if (alphaWith.length) {
        classList.add('alpha-with');
      }
      else if (grayWith.length) {
        classList.add('gray-with');
      }
    }
    const hasBreakMask = nodes.filter(item => item.computedStyle.breakMask);
    if (hasBreakMask.length) {
      classList.add('break');
    }
    const hasLocked = nodes.filter(item => item.isLocked);
    if (hasLocked.length === nodes.length) {
      classList.add('locked');
      this.dom.querySelector('.un-lock span')!.innerHTML = hasLocked.length.toString();
    }
    else {
      this.dom.querySelector('.lock span')!.innerHTML = nodes.length.toString();
    }
    const hasHidden = nodes.filter(item => item.computedStyle.visibility === VISIBILITY.HIDDEN);
    if (hasHidden.length === nodes.length) {
      classList.add('hidden');
      this.dom.querySelector('.show span')!.innerHTML = hasHidden.length.toString();
    }
    else {
      this.dom.querySelector('.hide span')!.innerHTML = nodes.length.toString();
    }
    const hasPrev = nodes.every(item => item.prev);
    if (!hasPrev) {
      classList.add('no-prev');
    }
    const hasNext = nodes.every(item => item.next);
    if (!hasNext) {
      classList.add('no-next');
    }
    this.dom.style.left = x + 'px';
    this.dom.style.top = y + 'px';
    this.dom.style.display = 'block';
    listener.emit(Listener.CONTEXT_MENU, true, this.dom);
  }

  showTree(x: number, y: number) {
    this.init();
    this.showCanvas(x, y);
    const classList = this.dom.classList;
    classList.add('only-tree');
  }

  showOk(x: number, y: number) {
    this.init();
    const classList = this.dom.classList;
    classList.add('only-ok');
    this.dom.style.left = x + 'px';
    this.dom.style.top = y + 'px';
    this.dom.style.display = 'block';
    this.listener.emit(Listener.CONTEXT_MENU, true, this.dom);
  }

  destroy() {
    document.removeEventListener('click', this.onClick);
    document.removeEventListener('visibilitychange', this.onVisibleChange);
    this.dom.remove();
  }
}

export default ContextMenu;
