import Root from '../node/Root';
import Listener from './Listener';
import state from './state';

const selHtml = `
<div class="ti" title="select"><b class="select"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="select" class="cur"><b class="select"></b><span class="name">选择</span><span class="key">V</span></li>
  <li title="hand"><b class="hand"></b><span class="name">平移画布</span><span class="key">H</span></li>
</ul>
`;

const geomHtml = `
<div class="ti" title="square"><b class="square"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="square"><b class="square"></b><span class="name">矩形</span><span class="key">R</span></li>
  <li title="ellipse"><b class="ellipse"></b><span class="name">椭圆形</span><span class="key">O</span></li>
  <li title="line"><b class="line"></b><span class="name">直线</span><span class="key">L</span></li>
  <li title="arrow"><b class="arrow"></b><span class="name">箭头</span></li>
  <li title="star"><b class="star"></b><span class="name">星形</span></li>
  <li class="split"></li>
  <li title="pen"><b class="pen"></b><span class="name">钢笔</span><span class="key">P</span></li>
</ul>
`;

const textHtml = `<div class="ti" title="text"><b class="text"></b></div>`;

const imageHtml = `<div class="ti" title="image"><b class="image"></b></div>`;

const maskHtml = `
<div class="ti disable" title="alpha"><b class="alpha"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="alpha" class="disable"><b class="alpha"></b><span class="name">透明度蒙版</span><span class="key">⌃</span><span class="key">⌘</span><span class="key">M</span></li>
  <li title="outline" class="disable"><b class="outline"></b><span class="name">轮廓蒙版</span></li>
</ul>
`;

const boolHtml = `
<div class="ti" title="union"><b class="union"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="union"><b class="union"></b><span class="name">联集</span></li>
  <li title="subtract"><b class="subtract"></b><span class="name">减去顶层</span></li>
  <li title="intersect"><b class="intersect"></b><span class="name">交集</span></li>
  <li title="xor"><b class="xor"></b><span class="name">差集</span></li>
  <li class="split"></li>
  <li title="flatten"><b class="flatten"></b><span class="name">拼合</span></li>
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

    const mask = document.createElement('div');
    mask.className = 'mask item';
    mask.innerHTML = maskHtml;
    dom.appendChild(mask);

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
      // div的父节点.item可能是已激活的.active，li也可能是.cur，还有可能是disable
      if (tagName === 'DIV' && target.parentElement!.classList.contains('active')
        || classList.contains('cur')) {
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
      dom.querySelector('.active')?.classList.remove('active');
      dom.querySelector('.cur')?.classList.remove('cur');
      // 直接显示的icon切换
      if (tagName === 'DIV') {
        const item = target.parentElement!;
        item.classList.add('active');
        title = target.title;
      }
      // 下拉中的icon切换
      else if (tagName === 'LI') {
        classList.add('cur');
        const item = target.parentElement!.parentElement!;
        item.classList.add('active');
        title = target.title;
        const div = item.querySelector('.ti') as HTMLElement;
        div.title = title;
        div.querySelector('b')!.className = title;
      } console.log(title)
      if (title === 'select') {
        listener.state = state.NORMAL;
        listener.dom.classList.remove('hand');
      }
      else if (title === 'hand') {
        listener.state = state.HAND;
        listener.dom.classList.add('hand');
      }
    });

    document.addEventListener('click', (e) => {
      if (keep) {
        keep = false;
        return;
      }
      dom.querySelector('.show')?.classList.remove('show');
    });
  }
}

export default Toolbar;
