import Root from '../node/Root';
import Page from '../node/Page';

export default class PageList {
  root: Root;
  dom: HTMLElement;

  constructor(root: Root, dom: HTMLElement) {
    this.root = root;
    this.dom = dom;

    const page = root.getCurPage();
    const pageContainer = root.pageContainer;
    const ul = document.createElement('ul');
    let s = '';
    pageContainer.children.forEach(item => {
      const li = document.createElement('li');
      li.title = item.props.name || '';
      li.setAttribute('uuid', item.props.uuid);
      li.innerHTML = item.props.name || '';
      if (page && item === page) {
        li.className = 'active';
      }
      ul.appendChild(li);
    });
    dom.innerHTML = '';
    dom.appendChild(ul);

    ul.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const classList = target.classList;
      if (!classList.contains('active')) {
        ul.querySelector('.active')?.classList.remove('active');
        classList.add('active');
        const uuid = target.getAttribute('uuid');
        if (uuid) {
          const page = root.refs[uuid];
          if (page) {
            const i = pageContainer.children.indexOf(page);
            if (i > -1) {
              root.setPageIndex(i);
            }
          }
        }
      }
    });

    root.on(Root.PAGE_CHANGED, (page: Page) => {});
  }
};
