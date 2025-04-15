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
import config from '../util/config';
import contextMenu from './contextMenu';
import { MASK, VISIBILITY } from '../style/define';
import { TextProps } from '../format';

function genNodeTree(node: Node, lv: number, ignoreChild = false) {
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
  dl.setAttribute('lv', lv.toString());
  const dt = document.createElement('dt');
  if (lv > 3) {
    dt.style.paddingLeft = (lv - 3) * config.treeLvPadding + 'px';
  }
  // 特殊的矢量小标预览
  if (node instanceof Geom || node instanceof ShapeGroup) {
    const svg = node.toSvg(12);
    s += `<span class="type geom">` + svg + '</span>';
  }
  else {
    s += `<span class="type ${type}"></span>`;
  }
  s += `<span class="name" title="${node.props.name || ''}">${node.props.name || ''}</span>`;
  if (!(node instanceof ArtBoard)) {
    if (node.props.isLocked) {
      s += `<span class="lock"></span>`;
    }
    s += `<span class="visible ${node.computedStyle.visibility === VISIBILITY.VISIBLE ? 't' : ''}"></span>`;
  }
  dt.innerHTML = s;
  dl.appendChild(dt);
  if (ignoreChild) {
    return dl;
  }
  // 递归children
  if (node instanceof Container) {
    const children = node.children;
    if (children.length) {
      for (let i = children.length - 1; i >= 0; i--) {
        const dd = document.createElement('dd');
        dd.appendChild(genNodeTree(children[i], lv + 1));
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
  silence: boolean;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;
    this.silence = false;

    // 可能存在，如果不存在就侦听改变，切换页面同样侦听
    const page = root.getCurPage();
    if (page) {
      this.init();
    }

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
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            dl.parentElement!.remove();
          }
        }
      });
    });
    listener.on(Listener.ADD_NODE, (nodes: Node[], selected?: Node[]) => {
      nodes.forEach((item) => {
        const res = genNodeTree(item, item.struct.lv);
        const dd = document.createElement('dd');
        dd.appendChild(res);
        const prev = item.prev?.props.uuid;
        if (prev) {
          const dl = dom.querySelector(`dl[uuid="${prev}"]`);
          if (dl) {
            const sibling = dl.parentElement!;
            sibling.before(dd);
          }
        }
        else {
          const uuid = item.parent!.props.uuid;
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            dl.appendChild(dd);
          }
        }
      });
      this.select(selected || nodes);
    });
    listener.on([Listener.GROUP_NODE, Listener.BOOL_GROUP_NODE], (groups: Group[], nodes: Node[][]) => {
      groups.forEach((group, i) => {
        const res = genNodeTree(group, group.struct.lv, true);
        const dd = document.createElement('dd');
        dd.appendChild(res);
        nodes[i].slice(0).reverse().forEach(item => {
          const uuid = item.props.uuid;
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            // 本身lv变化
            const lv = item.struct.lv;
            dl.setAttribute('lv', lv.toString());
            const dt2 = dl.querySelector('dt')!;
            dt2.style.paddingLeft = (lv - 3) * config.treeLvPadding + 'px';
            const list = dl.querySelectorAll('dl');
            // 所有子节点
            list.forEach(item => {
              const dt3 = item.firstChild as HTMLElement;
              const lv = item.getAttribute('lv')!;
              item.setAttribute('lv', (+lv + 1).toString());
              dt3.style.paddingLeft = (+lv + 1 - 3) * config.treeLvPadding + 'px';
            });
            res.appendChild(dl.parentElement!);
          }
        });
        const prev = group.prev?.props.uuid;
        if (prev) {
          const dl = dom.querySelector(`dl[uuid="${prev}"]`);
          if (dl) {
            const sibling = dl.parentElement!;
            sibling.before(dd);
          }
        }
        else {
          const uuid = group.parent!.props.uuid;
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            dl.appendChild(dd);
          }
        }
      });
      this.select(groups);
    });
    listener.on([Listener.UN_GROUP_NODE, Listener.UN_BOOL_GROUP_NODE], (nodes: Node[][], groups: Group[]) => {
      nodes.forEach((items, i) => {
        const uuid = groups[i].props.uuid;
        if (uuid) {
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            const dd = dl.parentElement!;
            const fragment = document.createDocumentFragment();
            items.slice(0).reverse().forEach(item => {
              const uuid2 = item.props.uuid;
              if (uuid2) {
                const dl2 = dom.querySelector(`dl[uuid="${uuid2}"]`);
                if (dl2) {
                  // 本身lv变化
                  const lv = item.struct.lv;
                  dl2.setAttribute('lv', lv.toString());
                  const dt2 = dl2.querySelector('dt')!;
                  dt2.style.paddingLeft = (lv - 3) * config.treeLvPadding + 'px';
                  const list = dl2.querySelectorAll('dl');
                  // 所有子节点
                  list.forEach(item => {
                    const dt3 = item.firstChild as HTMLElement;
                    const lv = item.getAttribute('lv')!;
                    item.setAttribute('lv', (+lv - 1).toString());
                    dt3.style.paddingLeft = (+lv - 1 - 3) * config.treeLvPadding + 'px';
                  });
                  fragment.appendChild(dl2.parentElement!);
                }
              }
            });
            dd.before(fragment);
            dd.remove();
          }
        }
      });
      const list: Node[] = [];
      nodes.forEach(item => {
        list.push(...item);
      });
      this.select(list);
    });
    listener.on(Listener.MASK_NODE, (nodes: Node[]) => {
      nodes.forEach(item => {
        const uuid = item.props.uuid;
        if (uuid) {
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            let dd = dl.parentElement!;
            let next = item.next;
            // 将后续节点的显示被遮罩箭头改变
            while (next) {
              if (next.computedStyle.breakMask || next.computedStyle.maskMode) {
                break;
              }
              dd = dd.previousElementSibling as HTMLElement;
              const dt = dd.firstElementChild!.firstElementChild as HTMLElement;
              const mask = dt.querySelector('.mask');
              if (item.computedStyle.maskMode === MASK.NONE) {
                if (mask) {
                  mask.remove();
                }
              }
              else {
                if (!mask) {
                  const span = document.createElement('span');
                  span.classList.add('mask');
                  dt.prepend(span);
                }
              }
              next = next.next;
            }
          }
        }
      });
    });
    listener.on(Listener.BREAK_MASK_NODE, (nodes: Node[]) => {
      nodes.forEach(item => {
        const uuid = item.props.uuid;
        if (uuid) {
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            // 先改变自己的显示被遮罩箭头
            const dt = dl.firstElementChild as HTMLElement;
            const mask = dt.querySelector('.mask');
            if (item.computedStyle.breakMask) {
              if (mask) {
                mask.remove();
              }
            }
            else if (item.mask) {
              if (!mask) {
                const span = document.createElement('span');
                span.classList.add('mask');
                dt.prepend(span);
              }
            }
            // 后续节点的
            let dd = dl.parentElement!;
            let next = item.next;
            while (next) {
              if (next.computedStyle.breakMask || next.computedStyle.maskMode) {
                break;
              }
              dd = dd.previousElementSibling as HTMLElement;
              const dt = dd.firstElementChild!.firstElementChild as HTMLElement;
              const mask = dt.querySelector('.mask');
              if (item.computedStyle.breakMask) {
                if (mask) {
                  mask.remove();
                }
              }
              else {
                if (!mask) {
                  const span = document.createElement('span');
                  span.classList.add('mask');
                  dt.prepend(span);
                }
              }
              next = next.next;
            }
          }
        }
      });
    });
    listener.on(Listener.RENAME_NODE, (nodes: Node[]) => {
      nodes.forEach((item) => {
        const uuid = item.props.uuid;
        if (uuid) {
          const name = dom.querySelector(`dl[uuid="${uuid}"] .name`) as HTMLElement;
          if (name) {
            name.title = name.innerText = item.props.name || '';
          }
        }
      });
    });
    listener.on(Listener.LOCK_NODE, (nodes: Node[]) => {
      nodes.forEach((item) => {
        const uuid = item.props.uuid;
        if (uuid) {
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            const dt = dl.firstElementChild as HTMLElement;
            const lock = dt.querySelector('.lock');
            if (item.props.isLocked) {
              if (!lock) {
                const span = document.createElement('span');
                span.classList.add('lock');
                (dt.querySelector('.name') as HTMLElement).after(span);
              }
            }
            else {
              if (lock) {
                lock.remove();
              }
            }
          }
        }
      });
    });
    listener.on(Listener.VISIBLE_NODE, (nodes: Node[]) => {
      nodes.forEach((item) => {
        const uuid = item.props.uuid;
        if (uuid) {
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            const visible = dl.querySelector('.visible') as HTMLElement;
            const classList = visible.classList;
            if (item.computedStyle.visibility === VISIBILITY.VISIBLE) {
              classList.add('t');
            }
            else {
              classList.remove('t');
            }
          }
        }
      });
    });
    listener.on(Listener.ART_BOARD_NODE, (nodes: Node[]) => {
      nodes.forEach((item) => {
        const uuid = item.props.uuid;
        if (uuid) {
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            // 本身lv变化
            const lv = item.struct.lv;
            dl.setAttribute('lv', lv.toString());
            const dt = dl.querySelector('dt')!;
            dt.style.paddingLeft = (lv - 3) * config.treeLvPadding + 'px';
            const dd = dl.parentElement!;
            dd.remove();
            const prev = item.prev;
            const next = item.next;
            if (prev) {
              const uuid2 = prev.props.uuid;
              if (uuid2) {
                const dl2 = dom.querySelector(`dl[uuid="${uuid2}"]`);
                if (dl2) {
                  dl2.parentElement!.before(dd);
                }
              }
            }
            else if (next) {
              const uuid2 = next.props.uuid;
              if (uuid2) {
                const dl2 = dom.querySelector(`dl[uuid="${uuid2}"]`);
                if (dl2) {
                  dl2.parentElement!.after(dd);
                }
              }
            }
            else {
              const uuid2 = item.parent!.props.uuid;
              if (uuid2) {
                const dl2 = dom.querySelector(`dl[uuid="${uuid2}"]`);
                if (dl2) {
                  dl2.parentElement!.appendChild(dd);
                }
              }
            }
          }
        }
      });
    });
    listener.on(Listener.TEXT_CONTENT_NODE, (nodes: Node[]) => {
      nodes.forEach(item => {
        const uuid = item.props.uuid;
        if (uuid) {
          const name = dom.querySelector(`dl[uuid="${uuid}"] dt .name`) as HTMLElement;
          if (name) {
            const { nameIsFixed } = (item as Text).props as TextProps;
            const content = (item as Text).content;
            if (!nameIsFixed) {
              name.innerText = content;
              name.title = content;
            }
          }
        }
      });
    });

    dom.addEventListener('selectstart', (e) => {
      e.preventDefault();
    });

    const onActive = (dl: HTMLElement, isRightButton = false) => {
      const dt = dl.querySelector('dt')!;
      const actives = dom.querySelectorAll('dt.active');
      if (actives.length === 1 && actives[0] === dt) {
        return;
      }
      const uuid = dl.getAttribute('uuid');
      if (uuid) {
        const node = root.refs[uuid];
        if (node) {
          // 特殊右键规则，已选不减
          if (isRightButton) {
            const selected = listener.selected.slice(0);
            const i = selected.indexOf(node);
            if (i === -1) {
              selected.splice(0);
              selected.push(node);
            }
            listener.active(selected);
          }
          // 多选，但要排除父子规则，已选择子祖父全忽略，已选择祖父再选子依旧忽略祖父
          else if (listener.metaKey) {
            const selected = listener.selected.slice(0);
            const i = selected.indexOf(node);
            if (i > -1) {
              selected.splice(i, 1);
            }
            else {
              for (let i = selected.length - 1; i >= 0; i--) {
                const item = selected[i];
                if (node.isParent(item)) {
                  selected.splice(i, 1);
                }
                else if (node.isChild(item)) {
                  return;
                }
              }
              selected.push(node);
            }
            listener.active(selected);
          }
          // 单选
          else {
            listener.active([node]);
          }
        }
      }
      actives.forEach((item) => {
        item.classList.remove('active');
      });
      listener.selected.forEach(item => {
        const uuid = item.props.uuid;
        if (uuid) {
          const dt = dom.querySelector(`dl[uuid="${uuid}"] dt`);
          if (dt) {
            dt.classList.add('active');
          }
        }
      });
    };

    dom.addEventListener('click', (e) => {
      this.silence = true;
      const target = e.target as HTMLElement;
      const classList = target.classList;
      const isDt = target.tagName.toUpperCase() === 'DT';
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
            listener.visible(classList.contains('t') ? 'hidden' : 'visible', [node]);
          }
        }
      }
      else if (classList.contains('lock')) {
        const dl = target.parentElement!.parentElement!;
        const uuid = dl.getAttribute('uuid');
        if (uuid) {
          const node = root.refs[uuid];
          listener.lock(false, [node]);
        }
        target.remove();
      }
      else if (classList.contains('name') || classList.contains('type') || isDt) {
        const dl = isDt ? target.parentElement! : target.parentElement!.parentElement!;
        onActive(dl);
      }
      else {
        listener.active([]);
      }
      this.silence = false;
    });

    const onChange = (target: HTMLInputElement) => {
      const v = target.value;
      const uuid = target.parentElement!.parentElement!.getAttribute('uuid')!;
      const node = root.refs[uuid];
      const name = target.nextSibling as HTMLElement;
      target.remove();
      name.style.display = 'block';
      if (node) {
        listener.rename([v], [node]);
      }
    };

    dom.addEventListener('dblclick', (e) => {
      const target = e.target as HTMLElement;
      const classList = target.classList;
      if (classList.contains('name')) {
        target.style.display = 'none';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = target.innerText;
        target.parentElement!.insertBefore(input, target);
        input.focus();

        let did = false;

        input.onblur = () => {
          if (!did) {
            did = true;
            onChange(input);
          }
        };
        input.onkeydown = (e) => {
          const { keyCode, code } = e;
          if (keyCode === 27 || code === 'Escape') {
            e.stopPropagation();
            if (!did) {
              did = true;
              onChange(input);
            }
          }
          else if (keyCode === 13 || code === 'Enter') {
            if (!did) {
              did = true;
              onChange(input);
            }
          }
        };
        input.onchange = () => {
          if (!did) {
            did = true;
            onChange(input);
          }
        };
      }
    });

    dom.addEventListener('mousemove', (e) => {
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

    dom.addEventListener('mouseleave', () => {
      listener.select.hideHover();
    });

    dom.addEventListener('contextmenu', (e) => {
      if (listener.options.disabled?.contextMenu) {
        return;
      }
      e.preventDefault();
      this.silence = true;
      const target = e.target as HTMLElement;
      const classList = target.classList;
      const isDt = target.tagName.toUpperCase() === 'DT';
      if (classList.contains('name') || classList.contains('type') || isDt) {
        const dl = isDt ? target.parentElement! : target.parentElement!.parentElement!;
        onActive(dl, true);
      }
      this.silence = false;
      contextMenu.showTree(e.pageX, e.pageY, this.listener);
    });
  }

  init() {
    this.dom.innerHTML = '';
    const dl = document.createElement('dl');
    this.dom.appendChild(dl);
    const page = this.root.getCurPage();
    if (page) {
      dl.setAttribute('uuid', page.props.uuid);
      const children = page.children;
      if (!children.length) {
        return;
      }
      const fragment = new DocumentFragment();
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        const res = genNodeTree(child, child.struct.lv);
        const dd = document.createElement('dd');
        dd.appendChild(res);
        fragment.appendChild(dd);
      }
      dl.appendChild(fragment);
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
    nodes.forEach(item => {
      const dt = this.dom.querySelector(`dl[uuid="${item.props.uuid}"] dt`);
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
        if (!this.silence) {
          // @ts-ignore
          dt.scrollIntoViewIfNeeded ? dt.scrollIntoViewIfNeeded() : dt.scrollIntoView();
        }
      }
    });
  }
}
