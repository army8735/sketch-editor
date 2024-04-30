import Node from '../node/Node';
import Root from '../node/Root';
import Geom from '../node/geom/Geom';
import ShapeGroup from '../node/geom/ShapeGroup';
import ArtBoard from '../node/ArtBoard';
import SymbolInstance from '../node/SymbolInstance';
import SymbolMaster from '../node/SymbolMaster';
import Group from '../node/Group';
import Bitmap from '../node/Bitmap';
import Text from '../node/Text';
import Slice from '../node/Slice';
import Container from '../node/Container';
import Listener from './Listener';

function genNodeTree(node: Node) {
  const type = getNodeType(node);
  const dl = document.createElement('dl');
  const classNames = ['layer'];
  if (node instanceof SymbolInstance) {
    classNames.push('symbol-instance');
  }
  if (node instanceof SymbolMaster) {
    classNames.push('symbol-master');
  }
  if (node.props.isExpanded) {
    classNames.push('expand');
  }
  let s = '';
  if (node instanceof Container) {
    classNames.push('container');
    s += '<span class="arrow"></span>';
  }
  if (node.mask) {
    s += '<span class="mask"></span>';
  }
  dl.className = classNames.join(' ');
  dl.setAttribute('uuid', node.props.uuid);
  const dt = document.createElement('dt');
  // 特殊的矢量小标预览
  if (node instanceof Geom || node instanceof ShapeGroup) {
    const rect = node.rect;
    const width = rect[2] - rect[0];
    const height = rect[3] - rect[1];
    if (!width || !height) {
      s += '<svg class="geom" width="12" height="12"><path d="M0,0L10,0L10,10L0,10L0,0ZM4,4L12,4L12,12L4,12,L4,4Z" fill="#D8D8D8" fill-rule="evenodd" stroke="#979797" stroke-width="1"></path></svg>';
    }
    else {
      let scale, x = 0, y = 0;
      if (width >= height) {
        scale = 12 / width;
        y = (12 - height * scale) * 0.5;
      }
      else {
        scale = 12 / height;
        x = (12 - width * scale) * 0.5;
      }
      const svg = node.toSvg(scale).replace('<svg', `<svg style="transform:translate(${x + 2}px, ${y + 2}px)scale(${scale})"`);
      s += `<span class="geom">` + svg + '</span>';
    }
  }
  else {
    s += `<span class="type ${type}"></span>`;
  }
  s += `<span class="name">${node.props.name || ''}</span>`;
  if (!(node instanceof ArtBoard)) {
    s += `<span class="visible ${node.computedStyle.visible ? 't' : ''}"></span>`;
  }
  dt.innerHTML = s;
  dl.appendChild(dt);
  // 递归children
  if (node instanceof Container) {
    const children = node.children;
    if (children.length) {
      for (let i = children.length - 1; i >= 0; i--) {
        const dd = document.createElement('dd');
        dd.appendChild(genNodeTree(children[i]));
        dl.appendChild(dd);
      }
    }
  }
  return dl;
}

function getNodeType(node: Node) {
  let type = 'default';
  if (node instanceof SymbolInstance) {
    type = 'symbol-instance';
  }
  else if (node instanceof SymbolMaster) {
    type = 'symbol-master';
  }
  else if (node instanceof ArtBoard) {
    type = 'art-board';
  }
  else if (node instanceof Group) {
    type = 'group';
  }
  else if (node instanceof Bitmap) {
    type = 'bitmap';
  }
  else if (node instanceof Text) {
    type = 'text';
  }
  else if (node instanceof Geom) {
    type = 'geom';
  }
  else if (node instanceof ShapeGroup) {
    type = 'shape-group';
  }
  else if (node instanceof Slice) {
    type = 'slice';
  }
  return type;
}

export default class Tree {
  root: Root;
  dom: HTMLElement;
  listener: Listener;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    // 可能存在，如果不存在就侦听改变，切换页面同样侦听
    const page = root.getCurPage();
    if (page) {
      this.init();
    }
    root.on(Root.PAGE_CHANGED, () => {
      this.init();
    });

    listener.on(Listener.HOVER_NODE, (node: Node) => {
      this.hover(node);
    });
    listener.on(Listener.UN_HOVER_NODE, () => {
      this.unHover();
    });
    listener.on(Listener.SELECT_NODE, (nodes: Node[]) => {
      this.select(nodes);
    });
    listener.on(Listener.REMOVE_NODE, (nodes: Node[]) => {
      nodes.forEach((item) => {
        const uuid = item.props.uuid;
        if (uuid) {
          const dl = this.dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            dl.parentElement!.remove();
          }
        }
      });
    });

    this.dom.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const classList = target.classList;
      if (classList.contains('arrow')) {
        const dl = target.parentElement!.parentElement!;
        const uuid = dl.getAttribute('uuid');
        if (uuid) {
          const node = root.refs[uuid];
          if (node) {
            const isExpanded = node.props.isExpanded = !node.props.isExpanded;
            if (isExpanded) {
              dl.classList.add('expand');
            }
            else {
              dl.classList.remove('expand');
            }
          }
        }
      }
      else if (classList.contains('visible')) {
        const dl = target.parentElement!.parentElement!;
        const uuid = dl.getAttribute('uuid');
        if (uuid) {
          const node = root.refs[uuid];
          if (node) {
            const isVisible = node.computedStyle.visible;
            node.updateStyle({
              visible: !isVisible,
            });
            if (isVisible) {
              classList.remove('t');
            }
            else {
              classList.add('t');
            }
          }
        }
      }
      else if (classList.contains('name') || classList.contains('type')) {
        const actives = this.dom.querySelectorAll('dt.active');
        actives.forEach((item) => {
          item.classList.remove('active');
        });
        const dl = target.parentElement!.parentElement!;
        const dt = dl.querySelector('dt')!;
        dt.classList.add('active');
        const uuid = dl.getAttribute('uuid');
        if (uuid) {
          const node = root.refs[uuid];
          if (node) {
            listener.active([node]);
          }
        }
      }
    });

    this.dom.addEventListener('mousemove', (e) => {
      let target = e.target as HTMLElement;
      if (target.nodeName === 'SPAN') {
        target = target.parentElement!;
      }
      const dl = target.parentElement!;
      const uuid = dl.getAttribute('uuid');
      if (uuid) {
        const node = root.refs[uuid];
        if (node) {
          listener.select.showHover(node);
          return;
        }
      }
      listener.select.hideHover();
    });

    this.dom.addEventListener('mouseleave', () => {
      listener.select.hideHover();
    });
  }

  init() {
    this.dom.innerHTML = '';
    const page = this.root.getCurPage();
    if (page) {
      const children = page.children;
      if (!children.length) {
        return;
      }
      const fragment = new DocumentFragment();
      for (let i = children.length - 1; i >= 0; i--) {
        fragment.appendChild(genNodeTree(children[i]));
      }
      this.dom.appendChild(fragment);
    }
  }

  hover(node: Node) {
    const lastDt = this.dom.querySelector('dt.hover');
    const uuid = node.props.uuid;
    if (uuid) {
      const dt = this.dom.querySelector(`dl[uuid="${uuid}"] dt`);
      if (dt) {
        dt.classList.add('hover');
        if (dt !== lastDt && lastDt) {
          lastDt.classList.remove('hover');
        }
      }
    }
  }

  unHover() {
    const dt = this.dom.querySelector('dt.hover');
    if (dt) {
      dt.classList.remove('hover');
    }
  }

  select(nodes: Node[]) {
    const dt = this.dom.querySelectorAll('dt.active');
    dt.forEach((item) => {
      item.classList.remove('active');
    });
    if (nodes.length) {
      const dt = this.dom.querySelector(`dl[uuid="${nodes[0].props.uuid}"] dt`);
      if (dt) {
        let dl = dt.parentElement;
        while (dl) {
          if (dl.nodeName === 'DL') {
            dl.classList.add('expand');
            const uuid = dl.getAttribute('uuid');
            if (uuid) {
              const node = this.root.refs[uuid];
              if (node) {
                node.props.isExpanded = true;
              }
            }
          }
          if (dl === this.dom) {
            break;
          }
          dl = dl.parentElement;
        }
        dt.classList.add('active');
        dt.scrollIntoView();
      }
    }
  }
}
