import Root from '../node/Root';
import Page from '../node/Page';
import Listener from './Listener';

export default class PageList {
  root: Root;
  dom: HTMLElement;
  listener: Listener;
  ul: HTMLElement;

  constructor(root: Root, dom: HTMLElement, listener: Listener) {
    this.root = root;
    this.dom = dom;
    this.listener = listener;

    const page = root.getCurPage();
    const pageContainer = root.pageContainer;
    const ul = this.ul = document.createElement('ul');
    pageContainer.children.forEach(item => {
      const li = document.createElement('li');
      li.title = item.name || '';
      li.setAttribute('uuid', item.uuid);
      li.innerHTML = item.name || '';
      if (page && item === page) {
        li.className = 'active';
      }
      ul.appendChild(li);
    });
    dom.appendChild(ul);

    dom.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const classList = target.classList;
      if (!classList.contains('active')) {
        ul.querySelector('.active')?.classList.remove('active');
        classList.add('active');
        const uuid = target.getAttribute('uuid');
        if (uuid) {
          const page = root.refs[uuid] as Page;
          if (page) {
            const i = pageContainer.children.indexOf(page);
            if (i > -1) {
              root.setPageIndex(i);
              listener.active([]);
            }
          }
        }
      }
    });
  }

  destroy() {
    this.ul.remove();
  }
};
