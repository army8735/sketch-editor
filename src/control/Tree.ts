import Node from '../node/Node';
import Root from '../node/Root';
import Geom from '../node/geom/Geom';
import Page from '../node/Page';
import ShapeGroup from '../node/geom/ShapeGroup';
import ArtBoard from '../node/ArtBoard';
import SymbolInstance from '../node/SymbolInstance';
import SymbolMaster from '../node/SymbolMaster';
import Group from '../node/Group';
import Bitmap from '../node/Bitmap';
import Text from '../node/Text';
import Slice from '../node/Slice';
import Frame from '../node/Frame';
import Graphic from '../node/Graphic';
import Container from '../node/Container';
import Listener from './Listener';
import config from '../util/config';
import contextMenu from './contextMenu';
import state from './state';
import { MASK, VISIBILITY } from '../style/define';
import PositionCommand, { position } from '../history/PositionCommand';

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
  if (node.isExpanded) {
    classNames.push('expand');
  }
  let s = '';
  if (node instanceof Container) {
    s += '<span class="arrow"></span>';
  }
  if (node.mask) {
    s += '<span class="mask"></span>';
  }
  dl.className = classNames.join(' ');
  dl.setAttribute('uuid', node.uuid);
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
  s += `<span class="name" title="${node.name || ''}">${node.name || ''}</span>`;
  if (!(node instanceof ArtBoard)) {
    if (node.isLocked) {
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
  else if (node instanceof Frame) {
    type = 'frame';
  }
  else if (node instanceof Graphic) {
    type = 'graphic';
  }
  return type;
}

export default class Tree {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  silence: boolean;
  position: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;
    this.silence = false;
    const position = this.position = document.createElement('div');
    position.className = 'position';
    dom.appendChild(position);

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

    const removeNode = (node: Node) => {
      const uuid = node.uuid;
      if (uuid) {
        const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
        if (dl) {
          dl.parentElement!.remove();
        }
      }
    };
    // listener.on(Listener.REMOVE_NODE, (nodes: Node[]) => {
    //   nodes.forEach((item) => {
    //     removeNode(item);
    //   });
    // });
    root.on(Root.WILL_REMOVE_DOM, (node) => {
      removeNode(node);
    });

    const addNode = (node: Node) => {
      // 新增页面时，删除老页面
      if (node instanceof Page) {
        this.init();
        return;
      }
      const res = genNodeTree(node, node.struct.lv);
      const dd = document.createElement('dd');
      dd.appendChild(res);
      const prev = node.prev?.uuid;
      if (prev) {
        const dl = dom.querySelector(`dl[uuid="${prev}"]`);
        if (dl) {
          const sibling = dl.parentElement!;
          sibling.before(dd);
        }
      }
      else {
        const uuid = node.parent!.uuid;
        const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
        if (dl) {
          dl.appendChild(dd);
        }
      }
    }
    // listener.on(Listener.ADD_NODE, (nodes: Node[]) => {
    //   nodes.forEach((item) => {
    //     addNode(item);
    //   });
    // });
    root.on(Root.DID_ADD_DOM, (node) => {
      addNode(node);
    });

    // listener.on([Listener.GROUP_NODE, Listener.BOOL_GROUP_NODE], (groups: Group[], nodes: Node[][]) => {
    //   groups.forEach((group, i) => {
    //     const res = genNodeTree(group, group.struct.lv, true);
    //     const dd = document.createElement('dd');
    //     dd.appendChild(res);
    //     nodes[i].slice(0).reverse().forEach(item => {
    //       const uuid = item.uuid;
    //       const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
    //       if (dl) {
    //         // 本身lv变化
    //         const lv = item.struct.lv;
    //         dl.setAttribute('lv', lv.toString());
    //         const dt2 = dl.querySelector('dt')!;
    //         dt2.style.paddingLeft = (lv - 3) * config.treeLvPadding + 'px';
    //         const list = dl.querySelectorAll('dl');
    //         // 所有子节点
    //         list.forEach(item => {
    //           const dt3 = item.firstChild as HTMLElement;
    //           const lv = item.getAttribute('lv')!;
    //           item.setAttribute('lv', (+lv + 1).toString());
    //           dt3.style.paddingLeft = (+lv + 1 - 3) * config.treeLvPadding + 'px';
    //         });
    //         res.appendChild(dl.parentElement!);
    //       }
    //     });
    //     const prev = group.prev?.uuid;
    //     if (prev) {
    //       const dl = dom.querySelector(`dl[uuid="${prev}"]`);
    //       if (dl) {
    //         const sibling = dl.parentElement!;
    //         sibling.before(dd);
    //       }
    //     }
    //     else {
    //       const uuid = group.parent!.uuid;
    //       const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
    //       if (dl) {
    //         dl.appendChild(dd);
    //       }
    //     }
    //   });
    // });
    //
    // listener.on([Listener.UN_GROUP_NODE, Listener.UN_BOOL_GROUP_NODE], (nodes: Node[][], groups: Group[]) => {
    //   nodes.forEach((items, i) => {
    //     const uuid = groups[i].uuid;
    //     if (uuid) {
    //       const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
    //       if (dl) {
    //         const dd = dl.parentElement!;
    //         const fragment = document.createDocumentFragment();
    //         items.slice(0).reverse().forEach(item => {
    //           const uuid2 = item.uuid;
    //           if (uuid2) {
    //             const dl2 = dom.querySelector(`dl[uuid="${uuid2}"]`);
    //             if (dl2) {
    //               // 本身lv变化
    //               const lv = item.struct.lv;
    //               dl2.setAttribute('lv', lv.toString());
    //               const dt2 = dl2.querySelector('dt')!;
    //               dt2.style.paddingLeft = (lv - 3) * config.treeLvPadding + 'px';
    //               const list = dl2.querySelectorAll('dl');
    //               // 所有子节点
    //               list.forEach(item => {
    //                 const dt3 = item.firstChild as HTMLElement;
    //                 const lv = item.getAttribute('lv')!;
    //                 item.setAttribute('lv', (+lv - 1).toString());
    //                 dt3.style.paddingLeft = (+lv - 1 - 3) * config.treeLvPadding + 'px';
    //               });
    //               fragment.appendChild(dl2.parentElement!);
    //             }
    //           }
    //         });
    //         dd.before(fragment);
    //         dd.remove();
    //       }
    //     }
    //   });
    // });

    listener.on(Listener.MASK_NODE, (nodes: Node[]) => {
      nodes.forEach(item => {
        const uuid = item.uuid;
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
        const uuid = item.uuid;
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
        const uuid = item.uuid;
        if (uuid) {
          const name = dom.querySelector(`dl[uuid="${uuid}"] .name`) as HTMLElement;
          if (name) {
            name.title = name.innerText = item.name || '';
          }
        }
      });
    });

    listener.on(Listener.LOCK_NODE, (nodes: Node[]) => {
      nodes.forEach((item) => {
        const uuid = item.uuid;
        if (uuid) {
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            const dt = dl.firstElementChild as HTMLElement;
            const lock = dt.querySelector('.lock');
            if (item.isLocked) {
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
        const uuid = item.uuid;
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
        const uuid = item.uuid;
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
              const uuid2 = prev.uuid;
              if (uuid2) {
                const dl2 = dom.querySelector(`dl[uuid="${uuid2}"]`);
                if (dl2) {
                  dl2.parentElement!.before(dd);
                }
              }
            }
            else if (next) {
              const uuid2 = next.uuid;
              if (uuid2) {
                const dl2 = dom.querySelector(`dl[uuid="${uuid2}"]`);
                if (dl2) {
                  dl2.parentElement!.after(dd);
                }
              }
            }
            else {
              const uuid2 = item.parent!.uuid;
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
        const uuid = item.uuid;
        if (uuid) {
          const name = dom.querySelector(`dl[uuid="${uuid}"] dt .name`) as HTMLElement;
          if (name) {
            const { nameIsFixed } = item;
            const content = (item as Text).content;
            if (!nameIsFixed) {
              name.innerText = content;
              name.title = content;
            }
          }
        }
      });
    });

    listener.on([Listener.FLATTEN_NODE, Listener.UN_FLATTEN_NODE], (add: Node[], remove: Node[]) => {
      add.forEach((item, i) => {
        const res = genNodeTree(item, item.struct.lv);
        const dd = document.createElement('dd');
        dd.appendChild(res);
        const uuid = remove[i].uuid;
        const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
        // 肯定有，替换掉
        if (dl) {
          const sibling = dl.parentElement!;
          sibling.before(dd);
          sibling.remove();
        }
      });
    });

    listener.on(Listener.PREV_NODE, (nodes: Node[], prev: (Node | undefined)[]) => {
      nodes.forEach((item, i) => {
        const uuid = item.uuid;
        if (uuid) {
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            const dd = dl.parentElement!;
            const n = prev[i];
            const uuid2 = n?.uuid;
            if (uuid2) {
              const dl2 = dom.querySelector(`dl[uuid="${uuid2}"]`);
              if (dl2) {
                const dd2 = dl2.parentElement!;
                dd.before(dd2);
                if (!item.mask) {
                  dl.querySelector('.mask')?.remove();
                }
              }
            }
          }
        }
      });
    });

    listener.on(Listener.NEXT_NODE, (nodes: Node[], next: (Node | undefined)[]) => {
      nodes.forEach((item, i) => {
        const uuid = item.uuid;
        if (uuid) {
          const dl = dom.querySelector(`dl[uuid="${uuid}"]`);
          if (dl) {
            const dd = dl.parentElement!;
            const uuid2 = next[i]?.uuid;
            if (uuid2) {
              const dl2 = dom.querySelector(`dl[uuid="${uuid2}"]`);
              if (dl2) {
                const dd2 = dl2.parentElement!;
                dd.after(dd2);
                if (item.mask) {
                  const m = dl.querySelector('.mask');
                  if (!m) {
                    const span = document.createElement('span');
                    span.className = 'mask';
                    dl.querySelector('dt')?.prepend(span);
                  }
                }
              }
            }
          }
        }
      });
    });

    // 防止拖拽过程中选择文本
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
        const uuid = item.uuid;
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
            const isExpanded = node.isExpanded = !node.isExpanded;
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

    let dragTarget: HTMLElement[] = [];
    let paddingLeft = 0;
    let originX = 0;
    let originY = 0;
    let height = 0;
    let startX = 0;
    let startY = 0;
    let isMouseMove = false;
    let positionData: {
      el: HTMLElement;
      ps: position; // 下方before上方，非dom的顺序
    } | undefined;
    dom.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || listener.state !== state.NORMAL) {
        return;
      }
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toUpperCase();
      let dt: HTMLElement | undefined;
      if (tagName === 'SPAN') {
        dt = target.parentElement!;
      }
      else if (tagName === 'DT') {
        dt = target;
      }
      // 肯定有，预防下
      if (!dt) {
        return;
      }
      // 按下当前的，所有已选跟随拖拽
      if (dt.classList.contains('active')) {
        dom.querySelectorAll('dt.active').forEach(item => {
          dragTarget.push(item.parentElement!);
        });
      }
      // 否则只拖拽按下的
      else {
        dragTarget.push(dt.parentElement!);
      }
      if (dragTarget.length) {
        const o = dom.getBoundingClientRect();
        originX = o.left;
        originY = o.top;
        startX = e.clientX;
        startY = e.clientY;
        height = dom.querySelector('dt')!.offsetHeight;
        paddingLeft = parseInt(window.getComputedStyle(dom).paddingLeft) || 0;
      }
    });

    dom.addEventListener('mousemove', (e) => {
      let target = e.target as HTMLElement;
      // 鼠标发生了x和y移动，防止轻微抖动
      if (dragTarget.length && !isMouseMove) {
        if (e.clientX - startX && e.clientY - startY || Math.abs(e.clientY - startY) > 1) {
          isMouseMove = true;
          dragTarget.forEach(item => {
            item.classList.add('drag');
          });
        }
      }
      // 拖拽节点
      if (isMouseMove) {
        position.style.display = 'none';
        dom.querySelector('dl.active')?.classList.remove('active');
        // 计算获取当前鼠标hover的dl节点，肯定有，防止异常判断非空
        const tagName = target.tagName.toUpperCase();
        const { scrollTop, scrollLeft } = this.dom;
        let dl: HTMLElement | undefined;
        if (tagName === 'SPAN') {
          dl = target.parentElement!.parentElement!;
        }
        else if (tagName === 'DT') {
          dl = target.parentElement!;
        }
        // 有限高度情况下，拖出dl了，只会是最上边或最下边
        else if (tagName === 'DIV') {
          const dl = dom.querySelector('dl') as HTMLElement;
          const o = dl.getBoundingClientRect();
          if (e.offsetY >= dl.offsetHeight + scrollTop) {
            position.style.top = o.top - originY + dl.offsetHeight + scrollTop + 'px';
            positionData = {
              el: dl,
              ps: 'before',
            };
          }
          else {
            position.style.top = o.top - originY + scrollTop + 'px';
            positionData = {
              el: dl,
              ps: 'after',
            };
          }
          position.style.left = '0%';
          position.style.display = 'block';
        }
        if (dl) {
          // 本身的位置直接忽略，也不能拖到自己的子节点，有子节点的只有Group/ShapeGroup/ArtBoard
          let temp = dl;
          while (temp && temp !== dom) {
            if (dragTarget.includes(temp)) {
              positionData = undefined;
              return;
            }
            // dl的parent是dd，再parent才是父级dl
            temp = temp.parentElement!;
            if (temp === dom) {
              break;
            }
            temp = temp.parentElement!;
          }
          const uuid = dl.getAttribute('uuid');
          if (!uuid) {
            positionData = undefined;
            return;
          }
          const node = root.refs[uuid];
          if (!node) {
            positionData = undefined;
            return;
          }
          let needX = false;
          // 鼠标在组上，以1/3线上代表目标位置前，以2/3线下代表目标位置后，中间代表其内（首子节点）
          if (node instanceof Container) {
            if (e.offsetY > height * 0.33) {
              // 自动展开这个组
              if (!node.isExpanded) {
                node.isExpanded = true;
                dl.classList.add('expand');
              }
            }
            if (e.offsetY >= height * 0.67) {
              dl.classList.add('active');
              const dl2 = dl.querySelector('dl') as HTMLElement;
              // 如果组有首子节点，以它为基准视为其后即append，一般不会有空组
              if (dl2) {
                const o = dl2.getBoundingClientRect();
                position.style.top = o.top - originY + scrollTop + 'px';
                const dt2 = dl2.querySelector('dt') as HTMLElement;
                position.style.left = (parseInt(dt2.style.paddingLeft) || 0) + paddingLeft + 'px';
                positionData = {
                  el: dl,
                  ps: 'append',
                };
              }
              // 特殊的空组，视为组前普通处理，一般不会有空组
              else {
                const o = dl.getBoundingClientRect();
                position.style.top = o.top - originY + dl.offsetHeight + scrollTop + 'px';
                const dt = dl.querySelector('dt') as HTMLElement;
                position.style.left = (parseInt(dt.style.paddingLeft) || 0) + paddingLeft + 'px';
                const dd = dl.parentElement!;
                if (!dd.nextElementSibling) {
                  needX = true;
                }
                positionData = {
                  el: dl,
                  ps: 'before',
                };
              }
              position.style.display = 'block';
            }
            else if (e.offsetY <= height * 0.33) {
              dl.parentElement!.parentElement!.classList.add('active');
              const o = dl.getBoundingClientRect();
              position.style.top = o.top - originY + scrollTop + 'px';
              const dt = dl.querySelector('dt') as HTMLElement;
              position.style.left = (parseInt(dt.style.paddingLeft) || 0) + paddingLeft + 'px';
              position.style.display = 'block';
              positionData = {
                el: dl,
                ps: 'after',
              };
            }
            else {
              dl.classList.add('active');
              positionData = {
                el: dl,
                ps: 'append',
              };
            }
          }
          // 鼠标在叶子节点上，以中线区分上下代表目标位置组的前后
          else {
            const dd = dl.parentElement!;
            dd.parentElement!.classList.add('active');
            const o = dl.getBoundingClientRect();
            const dt = dl.querySelector('dt') as HTMLElement;
            position.style.left = (parseInt(dt.style.paddingLeft) || 0) + paddingLeft + 'px';
            if (e.offsetY >= height * 0.5) {
              position.style.top = o.top - originY + height + scrollTop + 'px';
              if (!dd.nextElementSibling) {
                needX = true;
              }
              positionData = {
                el: dl,
                ps: 'before',
              };
            }
            else {
              position.style.top = o.top - originY + scrollTop + 'px';
              positionData = {
                el: dl,
                ps: 'after',
              };
            }
            position.style.display = 'block';
          }
          // 当指向位置处于组的末尾没有next节点时，需要查看x的位置决定在哪一层
          if (needX) {
            dom.querySelector('dl.active')?.classList.remove('active');
            const x = e.clientX - originX - paddingLeft + scrollLeft;
            let temp = dl;
            while (temp && temp !== dom) {
              // 往上查找到比这一级group的left大的位置
              const dt = temp.querySelector('dt') as HTMLElement;
              if (x >= parseInt(dt.style.paddingLeft)) {
                dl = temp;
                dl.parentElement!.parentElement!.classList.add('active');
                positionData = {
                  el: dl,
                  ps: 'before',
                };
                break;
              }
              // dl的parent是dd，再parent才是父级dl
              temp = temp.parentElement!;
              if (temp === dom) {
                dl = dom.querySelector('dl') as HTMLElement;
                positionData = {
                  el: dl,
                  ps: 'before',
                };
                break;
              }
              temp = temp.parentElement!;
            }
            const dt = dl.querySelector('dt') as HTMLElement;
            position.style.left = (parseInt(dt.style.paddingLeft) || 0) + paddingLeft + 'px';
          }
        }
      }
      // 未拖拽是hover
      else {
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
      }
    });

    dom.addEventListener('mouseup', (e) => {
      // 发生了拖动，尝试进行节点移动
      if (isMouseMove && positionData && dragTarget.length) {
        let min = -1;
        // 先查找最小lv，为了将所有节点按照tree显示的上下顺序排列，需要找到同lv下先后顺序（子节点向上找父节点作为代表）
        const nodes = dragTarget.map(item => {
          const lv = parseInt(item.getAttribute('lv')!);
          if (min === -1) {
            min = lv;
          }
          else {
            min = Math.min(min, lv);
          }
          const uuid = item.getAttribute('uuid');
          if (uuid) {
            return root.refs[uuid];
          }
        }).filter(item => item) as Node[];
        // 未知异常，uuid不存在或对不上节点
        if (nodes.length !== dragTarget.length) {
          throw new Error('Drag node not exist');
        }
        // 获取所有节点不同lv下的index数据，从最小lv到自己lv的index列表，每个node可能lv不同导致数量不同
        const data = nodes.map((item, i) => {
          let n = item;
          let lv = n.struct.lv;
          const index: { lv: number, index: number }[] = [];
          while (lv >= min) {
            index.unshift({
              lv,
              index: n.index,
            });
            n = n.parent!;
            lv = n.struct.lv;
          }
          return {
            node: item,
            el: dragTarget[i],
            index,
          };
        });
        // 先排序，按照tree展示的上下顺序，从下到上
        data.sort((a, b) => {
          const ia = a.index;
          const ib = b.index;
          // 相同lv部分对比index
          for (let i = 0, len = Math.min(ia.length, ib.length); i < len; i++) {
            if (ia[i].index !== ib[i].index) {
              return ia[i].index - ib[i].index;
            }
          }
          // 不相同部分一定是一方是另一方的子节点，但这种情况是选不了的
          throw new Error('Unknown index exception');
        });
        // 检测是否是全相邻节点，全相邻时拖拽到这些节点旁是无效忽略的
        let isAllSibling = true;
        for (let i = 1, len = data.length; i < len; i++) {
          if (data[i].node.prev !== data[i - 1].node) {
            isAllSibling = false;
            break;
          }
        }
        let ignore = false;
        if (isAllSibling) {
          for (let i = 0, len = data.length; i < len; i++) {
            const item = data[i];
            // 前面已经防止拖拽自身了，这里兜底再次判断
            if (item.el === positionData.el && (positionData.ps === 'before' || positionData.ps === 'after')) {
              ignore = true;
              break;
            }
          }
          if (!ignore) {
            const first = data[0];
            const last = data[data.length - 1];
            if (first.el.parentElement!.nextElementSibling === positionData.el.parentElement && positionData.ps === 'after') {
              ignore = true;
            }
            else if (last.el.parentElement!.previousElementSibling === positionData.el.parentElement && positionData.ps === 'before') {
              ignore = true;
            }
          }
        }
        if (!ignore) {
          const uuid = positionData.el.getAttribute('uuid');
          let target: Node | undefined;
          // 一定有，以防万一预防
          if (uuid) {
            target = root.refs[uuid];
          }
          if (!target) {
            throw new Error('Unknown exception target');
          }
          const { ps, el } = positionData;
          const positionCommand = new PositionCommand(
            data.map(item => item.node),
            data.map((item) => {
              let sel: HTMLElement;
              let sps: position;
              const el = item.el;
              const dd = el.parentElement!;
              // 最后一个节点没有next了，dom中表现是没有prev的dd节点而是父节点的dt，需忽略
              if (dd.previousElementSibling && dd.previousElementSibling.tagName !== 'DT') {
                sel = dd.previousElementSibling as HTMLElement;
                sps = 'before';
              }
              else if (dd.nextElementSibling) {
                sel = dd.nextElementSibling as HTMLElement;
                sps = 'after';
              }
              else {
                sel = dd.parentElement!;
                sps = 'append';
              }
              return {
                el,
                sel,
                sps,
              };
            }),
            target,
            el,
            ps,
          );
          positionCommand.execute();
          listener.history.addCommand(positionCommand);
          listener.emit(Listener.POSITION_NODE, data.map(item => item.node));
          const nodes = data.map(item => item.node);
          listener.active(nodes);
        }
      }
      dragTarget.forEach(item => {
        item.classList.remove('drag');
      });
      dragTarget = [];
      isMouseMove = false;
      positionData = undefined;
      dom.querySelector('dl.active')?.classList.remove('active');
      position.style.display = 'none';
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
    this.dom.querySelector('dl')?.remove();
    const dl = document.createElement('dl');
    const page = this.root.getCurPage();
    if (page) {
      dl.setAttribute('uuid', page.uuid);
      const children = page.children;
      if (!children.length) {
        return;
      }
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        const res = genNodeTree(child, child.struct.lv);
        const dd = document.createElement('dd');
        dd.appendChild(res);
        dl.appendChild(dd);
      }
    }
    this.dom.appendChild(dl);
  }

  hover(node: Node) {
    const lastDt = this.dom.querySelector('dt.hover');
    const uuid = node.uuid;
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
      if (!item.uuid) {
        return;
      }
      const dt = this.dom.querySelector(`dl[uuid="${item.uuid}"] dt`);
      if (dt) {
        let dl = dt.parentElement;
        while (dl) {
          // 自动向上展开，自己不展开
          if (dl.nodeName === 'DL' && dl !== dt.parentElement) {
            dl.classList.add('expand');
            const uuid = dl.getAttribute('uuid');
            if (uuid) {
              const node = this.root.refs[uuid];
              if (node) {
                node.isExpanded = true;
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
