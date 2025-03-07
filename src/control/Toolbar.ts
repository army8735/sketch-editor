import Root from '../node/Root';
import Listener from './Listener';

const selHtml = `
<div class="title" title="select"><b class="select"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="select" class="cur"><b class="select"></b><span class="name">选择</span><span class="key">V</span></li>
  <li title="hand"><b class="hand"></b><span class="name">平移画布</span><span class="key">H</span></li>
</ul>
`;

const geomHtml = `
<div class="title" title="square"><b class="square"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="square"><b class="square"></b><span class="name">矩形</span><span class="key">R</span></li>
  <li title="ellipse"><b class="ellipse"></b><span class="name">椭圆形</span><span class="key">O</span></li>
  <li title="line"><b class="line"></b><span class="name">直线</span><span class="key"></span></li>
  <li title="arrow"><b class="arrow"></b><span class="name">箭头</span><span class="key"></span></li>
  <li title="star"><b class="star"></b><span class="name">星形</span><span class="key"></span></li>
</ul>
`;

const textHtml = `<div class="title" title="text"><b class="text"></b></div>`;

const maskHtml = `
<div class="title" title="mask"><b class="mask"></b></div>
<div class="drop"></div>
<ul class="sub">
  <li title="alpha"><b class="alpha"></b><span class="name">透明度蒙版</span><span class="key">O</span></li>
  <li title="outline"><b class="outline"></b><span class="name">轮廓蒙版</span><span class="key">R</span></li>
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

    const mask = document.createElement('div');
    mask.className = 'mask item';
    mask.innerHTML = maskHtml;
    dom.appendChild(mask);

    let keep = false;
    dom.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const classList = target.classList;
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
