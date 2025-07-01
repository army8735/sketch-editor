import Root from '../node/Root';
import Node from '../node/Node';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';
import Listener from './Listener';
import state from './state';
import { BOOLEAN_OPERATION } from '../style/define';
import picker from './picker';
import inject from '../util/inject';

const selHtml = `
<div class="ti" title="select"><b class="select"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="select" class="cur"><b class="select"></b><span class="name">选择</span><span class="key">V</span></li>
  <li title="hand"><b class="hand"></b><span class="name">平移画布</span><span class="key">H</span></li>
</ul>
`;

const geomHtml = `
<div class="ti" title="rect"><b class="rect"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="rect"><b class="rect"></b><span class="name">矩形</span><span class="key">R</span></li>
  <li title="oval"><b class="oval"></b><span class="name">椭圆形</span><span class="key">O</span></li>
  <li title="round"><b class="round"></b><span class="name">圆角矩形</span><span class="key">U</span></li>
  <li title="line"><b class="line"></b><span class="name">直线</span><span class="key">L</span></li>
<!--  <li title="arrow"><b class="arrow"></b><span class="name">箭头</span></li>-->
  <li title="triangle"><b class="triangle"></b><span class="name">三角形</span></li>
<!--  <li title="star"><b class="star"></b><span class="name">星形</span></li>-->
<!--  <li class="split"></li>-->
<!--  <li title="pen"><b class="pen"></b><span class="name">矢量</span><span class="key">P</span></li>-->
</ul>
`;

const textHtml = `<div class="ti" title="text"><b class="text"></b></div>`;

const imageHtml = `<div class="ti" title="image"><b class="image"></b><input type="file" accept="image/*"/></div>`;

const maskHtml = `
<div class="ti disable" title="alpha"><b class="alpha"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="alpha" class="disable"><b class="alpha"></b><span class="name">透明度蒙版</span><span class="key">⌃</span><span class="key">⌘</span><span class="key">M</span></li>
  <li title="outline" class="disable"><b class="outline"></b><span class="name">轮廓蒙版</span></li>
</ul>
`;

const boolHtml = `
<div class="ti disable readonly" title="union"><b class="union"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="union" class="disable readonly"><b class="union"></b><span class="name">联集</span></li>
  <li title="subtract" class="disable readonly"><b class="subtract"></b><span class="name">减去顶层</span></li>
  <li title="intersect" class="disable readonly"><b class="intersect"></b><span class="name">交集</span></li>
  <li title="xor" class="disable readonly"><b class="xor"></b><span class="name">差集</span></li>
  <li class="split"></li>
  <li title="flatten" class="disable readonly"><b class="flatten"></b><span class="name">路径合并</span></li>
</ul>
`;

class Toolbar {
  root: Root;
  dom: HTMLElement;
  listener: Listener;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    const sel = document.createElement('div');
    sel.className = 'sel item active';
    sel.innerHTML = selHtml;
    dom.appendChild(sel);

    const geom = document.createElement('div');
    geom.className = 'geom item';
    geom.innerHTML = geomHtml;
    dom.appendChild(geom);

    const text = document.createElement('div');
    text.className = 'text item';
    text.innerHTML = textHtml;
    dom.appendChild(text);

    const image = document.createElement('div');
    image.className = 'img item';
    image.innerHTML = imageHtml;
    dom.appendChild(image);

    // const mask = document.createElement('div');
    // mask.className = 'mask item';
    // mask.innerHTML = maskHtml;
    // dom.appendChild(mask);

    const bool = document.createElement('div');
    bool.className = 'bool item';
    bool.innerHTML = boolHtml;
    dom.appendChild(bool);

    let keep = false;
    dom.addEventListener('click', (e) => {
      let target = e.target as HTMLElement;
      let tagName = target.tagName.toUpperCase();
      let classList = target.classList;
      // 下拉菜单展示
      if (classList.contains('drop')) {
        const item = target.parentElement!;
        if (item.classList.contains('show')) {
          item.classList.remove('show');
        }
        else {
          dom.querySelector('.show')?.classList.remove('show');
          item.classList.add('show');
        }
        keep = true;
        return;
      }
      // 节点统一到div（直接显示的icon）或li（下拉展示的icon）上
      if (classList.contains('name') || classList.contains('key')) {
        target = target.parentElement as HTMLElement;
        tagName = 'LI';
        classList = target.classList;
      }
      else if (tagName === 'B') {
        target = target.parentElement as HTMLElement;
        tagName = target.tagName.toUpperCase();
        classList = target.classList;
      }
      // 特殊的input file
      else if (tagName === 'INPUT') {
        target = target.parentElement as HTMLElement;
        tagName = target.tagName.toUpperCase();
        classList = target.classList;
      }
      // div的父节点.item可能是已激活的.active，li也可能是.cur，还有可能是disable
      if (tagName === 'DIV' && target.parentElement!.classList.contains('active')
        || classList.contains('cur')) {
        keep = true;
        return;
      }
      // 禁止特殊处理
      if (classList.contains('disable') || target.parentElement!.classList.contains('disable')) {
        keep = true;
        return;
      }
      // 罕见情况点到每个项上，padding的原因
      if (classList.contains('item')) {
        target = target.querySelector('div') as HTMLElement;
        tagName = target.tagName.toUpperCase();
        classList = target.classList;
      }

      let title = '';
      // bool和mask等按钮readonly不是按下激活的，点击后原本激活的依旧保持激活，其它按钮按下需取消已激活的（不包含mask）
      if (!classList.contains('readonly')) {
        dom.querySelector('.active')?.classList.remove('active');
        dom.querySelector('.cur')?.classList.remove('cur');
      }
      // 面板上直接显示的icon切换
      if (tagName === 'DIV') {
        title = target.title;
        const item = target.parentElement!;
        if (!classList.contains('readonly')) {
          item.classList.add('active');
        }
      }
      // 下拉中的icon切换
      else if (tagName === 'LI') {
        title = target.title;
        const item = target.parentElement!.parentElement!;
        // bool和mask等按钮
        if (!classList.contains('readonly')) {
          classList.add('cur');
          item.classList.add('active');
          const div = item.querySelector('.ti') as HTMLElement;
          div.title = title;
          div.querySelector('b')!.className = title;
        }
      }
      // console.log(title)
      listener.dom.classList.remove('hand');
      listener.dom.classList.remove('text');

      const prev = listener.state;
      if (title === 'select') {
        listener.state = state.NORMAL;
      }
      else if (title === 'hand') {
        listener.state = state.HAND;
        listener.dom.classList.add('hand');
      }
      else if (title === 'text') {
        listener.state = state.ADD_TEXT;
        listener.dom.classList.add('add-text');
        listener.select.hideSelect();
      }
      else if (title === 'union' || title === 'subtract' || title === 'intersect' || title === 'xor') {
        listener.state = state.NORMAL;
        listener.boolGroup(title);
      }
      else if (title === 'flatten') {
        listener.state = state.NORMAL;
        listener.flatten();
      }
      else if (title === 'rect') {
        listener.state = state.ADD_RECT;
        listener.dom.classList.add('add-rect');
        listener.select.hideSelect();
      }
      else if (title === 'round') {
        listener.state = state.ADD_ROUND;
        listener.dom.classList.add('add-round');
        listener.select.hideSelect();
      }
      else if (title === 'oval') {
        listener.state = state.ADD_OVAL;
        listener.dom.classList.add('add-oval');
        listener.select.hideSelect();
      }
      else if (title === 'line') {
        listener.state = state.ADD_LINE;
        listener.dom.classList.add('add-line');
        listener.select.hideSelect();
      }
      else if (title === 'triangle') {
        listener.state = state.ADD_TRIANGLE;
        listener.dom.classList.add('add-triangle');
        listener.select.hideSelect();
      }
      else if (title === 'star') {
        listener.state = state.ADD_STAR;
        listener.dom.classList.add('add-star');
        listener.select.hideSelect();
      }
      else if (title === 'arrow') {}
      else if (title === 'pen') {
        listener.state = state.ADD_GEOM;
        listener.dom.classList.add('add-geom');
        listener.select.hideSelect();
      }

      if (prev !== listener.state) {
        listener.emit(Listener.STATE_CHANGE, prev, listener.state);
      }
    });

    function reInput() {
      image.querySelector('input')?.remove();
      image.querySelector('div')!.innerHTML += '<input type="file" accept="image/*"/>';
    }

    dom.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === 'INPUT') {
        const file = target.files && target.files[0];
        if (file) {
          listener.state = state.ADD_IMG;
          listener.dom.classList.add('add-img');
          listener.select.hideSelect();
          const reader = new FileReader();
          reader.onload = function() {
            const ab = reader.result as ArrayBuffer;
            inject.loadArrayBufferImg(ab).then(res => {
              res.title = file.name;
              res.className = 'img';
              res.style.maxWidth = '100px';
              res.style.maxHeight = '100px';
              listener.img = res;
              listener.imgWidth = res.width;
              listener.imgHeight = res.height;
              listener.dom.appendChild(res);
              reInput();
            });
          };
          reader.readAsArrayBuffer(file);
        }
        else {
          reset();
          reInput();
        }
      }
    });

    dom.addEventListener('cancel', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === 'INPUT') {
        reset();
      }
    });

    document.addEventListener('click', (e) => {
      if (keep) {
        keep = false;
        return;
      }
      dom.querySelector('.show')?.classList.remove('show');
    });

    listener.on(Listener.STATE_CHANGE, (prev: state, next: state) => {
      if (next === state.NORMAL || prev === state.ADD_TEXT && next === state.EDIT_TEXT) {
        dom.querySelector('.active')?.classList.remove('active');
        dom.querySelector('.sel.item')?.classList.add('active');
        dom.querySelector('.sel.item .ti')?.setAttribute('title', 'select');
        const b = sel.querySelector('.ti b') as HTMLElement;
        if (b) {
          b.className = 'select';
        }
        sel.querySelector('.cur')?.classList.remove('cur');
        sel.querySelector('[title="select"]')?.classList.add('cur');
      }
    });

    listener.on(Listener.SELECT_NODE, (nodes: (Node | Polyline | ShapeGroup)[]) => {
      let countPolyline = 0;
      let countShapeGroup = 0;
      let hasBooleanOperation = false;
      // polyline的布尔运算显示，需要有2+个且都是polyline
      for (let i = 0, len = nodes.length; i < len; i++) {
        const node = nodes[i];
        if (node instanceof Polyline) {
          countPolyline++;
        }
        else if (node instanceof ShapeGroup) {
          countShapeGroup++;
          if (!hasBooleanOperation) {
            hasBooleanOperation = scanShapeGroupChildrenBooleanOperation(node);
          }
        }
        else {
          break;
        }
      }
      if (countPolyline > 1 && countPolyline === nodes.length) {
        bool.querySelectorAll('.disable').forEach(item => {
          item.classList.remove('disable');
        });
      }
      else {
        bool.querySelectorAll('.ti, li[title]').forEach(item => {
          item.classList.add('disable');
        });
      }
      // shapeGroup的路径合并显示，需要所选都是shapeGroup，且shapeGroup孩子有布尔运算
      if (countShapeGroup && countShapeGroup === nodes.length && hasBooleanOperation) {
        bool.querySelector('li[title="flatten"]')?.classList.remove('disable');
      }
      else {
        bool.querySelector('li[title="flatten"]')?.classList.add('disable');
      }

      // let outline = 0;
      // let alpha = 0;
      // for (let i = 0, len = nodes.length; i < len; i++) {
      //   const { computedStyle } = nodes[i];
      //   if (computedStyle.maskMode === MASK.OUTLINE) {
      //     outline++;
      //   }
      //   else if (computedStyle.maskMode === MASK.ALPHA) {
      //     alpha++;
      //   }
      // }
    });

    function clear() {
      dom.querySelector('.active')?.classList.remove('active');
      dom.querySelector('.cur')?.classList.remove('cur');
    }

    listener.on(Listener.SHORTCUT_KEY, (keyCode: number, code: string) => {
      if (picker.isShow()) {
        picker.hide();
      }
      listener.dom.classList.remove('hand');
      listener.dom.classList.remove('add-text');
      listener.dom.classList.remove('add-rect');
      listener.dom.classList.remove('add-oval');
      listener.dom.classList.remove('add-round');
      listener.dom.classList.remove('add-triangle');
      listener.dom.classList.remove('add-star');
      listener.dom.classList.remove('add-geom');
      clear();
      if (keyCode === 86 || code === 'KeyV' || keyCode === 72 || code === 'KeyH') {}
      else {
        listener.cancelEditGeom();
        listener.cancelEditGradient();
        listener.select.hideSelect();
      }

      if (keyCode === 86 || code === 'KeyV') {
        listener.state = state.NORMAL;
        sel.classList.add('active');
        const div = sel.querySelector('.ti') as HTMLElement;
        div.title = 'select';
        (div.querySelector('b') as HTMLElement).className = 'select';
        sel.querySelector('.sub [title="select"]')?.classList.add('cur');
      }
      else if (keyCode === 72 || code === 'KeyH') {
        listener.state = state.HAND;
        listener.dom.classList.add('hand');
        sel.classList.add('active');
        const div = sel.querySelector('.ti') as HTMLElement;
        div.title = 'hand';
        (div.querySelector('b') as HTMLElement).className = 'hand';
        sel.querySelector('.sub [title="hand"]')?.classList.add('cur');
      }
      else if (keyCode === 82 || code === 'KeyR') {
        listener.state = state.ADD_RECT;
        listener.dom.classList.add('add-rect');
        geom.classList.add('active');
        const div = geom.querySelector('.ti') as HTMLElement;
        div.title = 'rect';
        (div.querySelector('b') as HTMLElement).className = 'rect';
        geom.querySelector('.sub [title="rect"]')?.classList.add('cur');
      }
      else if (keyCode === 79 || code === 'KeyO') {
        listener.state = state.ADD_OVAL;
        listener.dom.classList.add('add-oval');
        geom.classList.add('active');
        const div = geom.querySelector('.ti') as HTMLElement;
        div.title = 'oval';
        (div.querySelector('b') as HTMLElement).className = 'oval';
        geom.querySelector('.sub [title="oval"]')?.classList.add('cur');
      }
      else if (keyCode === 85 || code === 'KeyU') {
        listener.state = state.ADD_ROUND;
        listener.dom.classList.add('add-round');
        geom.classList.add('active');
        const div = geom.querySelector('.ti') as HTMLElement;
        div.title = 'round';
        (div.querySelector('b') as HTMLElement).className = 'round';
        geom.querySelector('.sub [title="round"]')?.classList.add('cur');
      }
      else if (keyCode === 76 || code === 'KeyL') {
        listener.state = state.ADD_LINE;
        listener.dom.classList.add('add-line');
        geom.classList.add('active');
        const div = geom.querySelector('.ti') as HTMLElement;
        div.title = 'line';
        (div.querySelector('b') as HTMLElement).className = 'line';
        geom.querySelector('.sub [title="line"]')?.classList.add('cur');
      }
      else if (keyCode === 80 || code === 'KeyP') {
        listener.state = state.ADD_GEOM;
        listener.dom.classList.add('add-geom');
        geom.classList.add('active');
        const div = geom.querySelector('.ti') as HTMLElement;
        div.title = 'pen';
        (div.querySelector('b') as HTMLElement).className = 'pen';
        geom.querySelector('.sub [title="pen"]')?.classList.add('cur');
      }
      else if (keyCode === 84 || code === 'KeyT') {
        listener.state = state.ADD_TEXT;
        listener.dom.classList.add('add-text');
        text.classList.add('active');
      }
    });

    // 添加状态按下esc后取消添加返回至普通状态，按钮也要随之变化
    function reset() {
      clear();
      sel.classList.add('active');
      const div = sel.querySelector('.ti') as HTMLElement;
      div.title = 'select';
      (div.querySelector('b') as HTMLElement).className = 'select';
      sel.querySelector('.sub [title="select"]')?.classList.add('cur');
      if (listener.selected.length) {
        listener.select.showSelectNotUpdate();
      }
    }
    listener.on(Listener.CANCEL_ADD_ESC, reset);
  }
}

function scanShapeGroupChildrenBooleanOperation(shapeGroup: ShapeGroup) {
  const scan = (children: Node[]): boolean => {
    let has = false;
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      if (child.computedStyle.booleanOperation !== BOOLEAN_OPERATION.NONE) {
        has = true;
        break;
      }
      if (child instanceof ShapeGroup) {
        has = scan(child.children);
        if (has) {
          break;
        }
      }
    }
    return has;
  };
  return scan(shapeGroup.children);
}

export default Toolbar;
