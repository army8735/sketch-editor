const $input = document.querySelector('#file');
const $page = document.querySelector('#page');
const $tree = document.querySelector('#tree');
const $main = document.querySelector('#main');
const $canvasC = $main.querySelector('#canvasC');
const $overlap = $main.querySelector('#overlap');
const $hover = $main.querySelector('#hover');
const $selection = $main.querySelector('#selection');
const $inputContainer = $main.querySelector('#input-container');
const $inputText = $inputContainer.querySelector('input');
const $side = document.querySelector('#side');
const $basic = $side.querySelector('#basic');
const $x = $side.querySelector('#x');
const $y = $side.querySelector('#y');
const $rotate = $side.querySelector('#rotate');
const $w = $side.querySelector('#w');
const $h = $side.querySelector('#h');

matchMedia(
  `(resolution: ${window.devicePixelRatio}dppx)`
).addEventListener("change", function() {
});

let root;
let originX, originY;
let isMouseDown, isMouseMove, isControl, controlType;
let startX, startY, lastX, lastY;
let hoverNode, selectNode;
let metaKey, shiftKey, ctrlKey, altKey, spaceKey;
let dpi = window.devicePixelRatio;
let curPage, pageTx, pageTy;
let style, computedStyle;
let structs = [];
let abHash = {}, pageHash = {};
let hoverTree, selectTree;
let zoom = 1;
let isEditText;

async function initFonts() {
  try {
    const status = await navigator.permissions.query({
      name: 'local-fonts',
    });
    if(status.state !== 'granted') {
      console.error('No Permission.');
      return;
    }
    const fonts = await window.queryLocalFonts();
    editor.style.font.registerLocalFonts(fonts);
  } catch(err) {
    console.error(err.message);
  }
}

initFonts();

[
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/uG6lQ6mO0XIAAAAAAAAAABAADnV5AQBr/AlibabaSans-LightItalic.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/nhktTqHzS_cAAAAAAAAAABAADnV5AQBr/AlibabaSans-Italic.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/aQutTLOY8_0AAAAAAAAAABAADnV5AQBr/AlibabaSans-HeavyItalic.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/iDvGRKYxpFMAAAAAAAAAABAADnV5AQBr/AlibabaSans-BoldItalic.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/03abTJZ_ELkAAAAAAAAAABAADnV5AQBr/AlibabaSans-MediumItalic.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/4XI7Tq31Q2MAAAAAAAAAABAADnV5AQBr/AlibabaSans-Bold.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/XQaWS7V598AAAAAAAAAAABAADnV5AQBr/AlibabaSans-Medium.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/5tY6T4gfeAAAAAAAAAAAABAADnV5AQBr/AlibabaSans-Heavy.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/yX9fSK8Vy1wAAAAAAAAAABAADnV5AQBr/AlibabaSans-Light.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/6cr-Ra-6W88AAAAAAAAAABAADnV5AQBr/AlibabaSans-Black.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/QgUFR5-393IAAAAAAAAAABAADnV5AQBr/AlibabaSans-Regular.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/AF6oQZbHeJIAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-35-Thin.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/_qOARr4eO6oAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-45-Light.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/I6y8QKLB2n8AAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-75-SemiBold.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/w19VS7_VQ2UAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-65-Medium.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/dNLASYAWQW8AAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-115-Black.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/MnqHQqrD0YgAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-95-ExtraBold.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/CY_aTqLT-vMAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-55-Regular.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/1UNUTqtQsyAAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-85-Bold.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/rg89T7ajrsYAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-105-Heavy.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/XW9NRY1ChxcAAAAAAAAAABAADnV5AQBr/Alibaba-PuHuiTi-Medium.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/NM6KQYE2VBwAAAAAAAAAABAADnV5AQBr/Alibaba-PuHuiTi-Heavy.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/sBaWS5Vr5D0AAAAAAAAAABAADnV5AQBr/Alibaba-PuHuiTi-Regular.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/-UceTp6AhxQAAAAAAAAAABAADnV5AQBr/Alibaba-PuHuiTi-Light.ttf',
  'https://mass-office.alipay.com/huamei_koqzbu/afts/file/9ZVPTLIO54MAAAAAAAAAABAADnV5AQBr/Alibaba-PuHuiTi-Bold.ttf',
].forEach(url => {
  // editor.util.inject.loadFont(url, url, (cache, ab) => {
  //   editor.style.font.registerAb(ab);
  // });
});

$input.onchange = function(e) {
  const file = $input.files[0];
  $input.value = null;
  $input.blur();
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function() {
    editor.openAndConvertSketchBuffer(reader.result).then(function(json) {
      const canvas = document.createElement('canvas');

      function resize() {
        const { clientWidth, clientHeight } = $canvasC;
        canvas.width = clientWidth * dpi;
        canvas.height = clientHeight * dpi;
        const o = $canvasC.getBoundingClientRect();
        originX = o.left;
        originY = o.top;
        if (root) {
          root.updateStyle({
            width: clientWidth * dpi,
            height: clientHeight * dpi,
          });
        }
      }

      resize();
      window.onresize = resize;
      $canvasC.appendChild(canvas);
      root = editor.parse(json, canvas, dpi);

      // page列表
      const pages = root.getPages();
      pages.forEach(item => {
        const uuid = item.props.uuid;
        const li = document.createElement('li');
        li.setAttribute('uuid', uuid);
        li.innerHTML = '🗒 ' + item.props.name;
        li.title = item.props.name;
        pageHash[uuid] = li;
        $page.appendChild(li);
      });

      $page.addEventListener('click', function(e) {
        const target = e.target;
        if (target.tagName === 'LI' && !target.classList.contains('current')) {
          const children = $page.children;
          const i = Array.from(children).indexOf(target);
          root.setPageIndex(i);
          hideHover();
          hideSelect();
        }
      });

      // 每次切页面更新数据
      root.on(editor.util.Event.PAGE_CHANGED, function(newPage) {
        curPage = newPage;
        zoom = curPage.getZoom();
        const last = $page.querySelector('.current');
        if (last) {
          last.classList.remove('current');
        }
        pageHash[curPage.props.uuid].classList.add('current');
        $tree.innerHTML = '';
        const ol = document.createElement('ol');
        abHash = {
          [curPage.props.uuid]: $tree,
        };
        const children = curPage.children;
        for(let i = children.length - 1; i >= 0; i--) {
          ol.appendChild(genNodeTree(children[i], abHash));
        }
        $tree.appendChild(ol);
      });

      root.on(editor.util.Event.DID_ADD_PAGE, function(newPage) {
        const uuid = newPage.props.uuid;
        const li = document.createElement('li');
        li.setAttribute('uuid', uuid);
        li.innerHTML = '🗒 ' + newPage.props.name;
        li.title = newPage.props.name;
        pageHash[uuid] = li;
        $page.appendChild(li);
      });

      root.on(editor.util.Event.DID_ADD_DOM, function(node) {
        const li = genNodeTree(node, abHash);
        const parent = node.parent, children = parent.children, uuid = parent.props.uuid;
        const i = children.indexOf(node);
        const ol = abHash[uuid].querySelector('ol');
        if (!ol) {
          const ol = document.createElement('ol');
          ol.appendChild(li);
          abHash[uuid].appendChild(ol);
        }
        else if (i === children.length - 1) {
          ol.insertBefore(li, ol.children[i - 1]);
        }
        else if (i === 0) {
          ol.appendChild(li);
        }
        else {
          ol.insertBefore(li, ol.children[ol.children.length - i]);
        }
      });

      root.on(editor.util.Event.WILL_REMOVE_DOM, function(node) {
        const li = abHash[node.props.uuid];
        li.parentElement.removeChild(li);
        delete abHash[node.props.uuid];
      });

      root.on(editor.util.Event.UPDATE_CURSOR, function(x, y, h) {
        showEditText(x / dpi, y / dpi, h / dpi);
        updateSelect();
      });

      root.setPageIndex(0);
    });
  }
}

function genNodeTree(node, abHash) {
  let type = getNodeType(node);
  if (node instanceof editor.node.Geom || node instanceof editor.node.ShapeGroup) {
    const { width, height } = node;
    let scale, x = 0, y = 0;
    if (width >= height) {
      scale = 14 / width;
      y = (14 - height * scale) * 0.5;
    }
    else {
      scale = 14 / height;
      x = (14 - width * scale) * 0.5;
    }
    type = `<b style="transform:translate(${x}px, ${y}px) scale(${scale})">` + node.toSvg(scale) + '</b>';
  }
  const li = document.createElement('li');
  if (node.computedStyle.maskMode) {
    li.className = 'layer mask';
  }
  else {
    li.className = 'layer';
  }
  li.setAttribute('uuid', node.props.uuid);
  abHash[node.props.uuid] = li;
  let s = `<div>
<span class="type">${type}</span>
<span class="name">${node.props.name}</span>`
  if (!(node instanceof editor.node.ArtBoard)) {
    s += `<span class="visible ${node.computedStyle.visible ? 't' : ''}">${node.computedStyle.visible ? '可见' : '隐藏'}</span>`;
  }
  s += '</div>';
  li.innerHTML = s;
  if (node instanceof editor.node.Container) {
    const children = node.children;
    if (children.length > 0) {
      const ol = document.createElement('ol');
      for(let i = children.length - 1; i >= 0; i--) {
        ol.appendChild(genNodeTree(children[i], abHash));
      }
      li.appendChild(ol);
    }
  }
  return li;
}

function getNodeType(node) {
  let type = '';
  if (node instanceof editor.node.ArtBoard) {
    type = '🎨';
  }
  else if (node instanceof editor.node.Group) {
    type = '🗂️';
  }
  else if (node instanceof editor.node.Bitmap) {
    type = '🖼️';
  }
  else if (node instanceof editor.node.Text) {
    type = '🔤';
  }
  else if (node instanceof editor.node.Geom) {
    type = '📏';
  }
  else if (node instanceof editor.node.ShapeGroup) {
    type = '📐';
  }
  else {
    type = '❓';
  }
  return type;
}

$tree.addEventListener('click', e => {
  const target = e.target;
  if (target.classList.contains('visible')) {
    const visible = target.classList.contains('t');
    const li = target.parentElement.parentElement;
    const uuid = li.getAttribute('uuid');
    const node = root.refs[uuid];
    node.updateStyle({
      visible: !visible,
      pointerEvents: !visible,
    });
    if (visible) {
      target.classList.remove('t');
      target.innerHTML = '隐藏';
    }
    else {
      target.classList.add('t');
      target.innerHTML = '可见';
    }
  }
  else if (target.classList.contains('name') || target.classList.contains('type') || target.classList.contains('layer')) {
    let li = target, available;
    while (li) {
      if (li.classList.contains('layer')) {
        available = true;
        break;
      }
      li = li.parentElement;
    }
    if (!available) {
      return;
    }
    const uuid = li.getAttribute('uuid');
    const node = root.refs[uuid];
    showSelect(node);
    showBasic();
    selectTree && selectTree.classList.remove('select');
    selectTree = li;
    selectTree && selectTree.classList.add('select');
  }
});

$tree.addEventListener('mousemove', e => {
  let parent = e.target;
  while (parent) {
    if (parent.classList.contains('layer')) {
      if (parent !== selectTree) {
        const uuid = parent.getAttribute('uuid');
        const node = root.refs[uuid];
        showHover(node);
      }
      return;
    }
    parent = parent.parentElement;
  }
});

function showHover(node) {
  // 有选择节点或相等时不展示
  if (hoverNode !== node && (!selectNode || selectNode !== node)) {
    hoverNode = node;
    updateHover();
    $hover.classList.add('show');
    // 左侧列表
    hoverTree && hoverTree.classList.remove('hover');
    const li = abHash[node.props.uuid];
    hoverTree = li;
    hoverTree.classList.add('hover');
  }
}

function updateHover() {
  if (hoverNode) {
    const rect = hoverNode.getBoundingClientRect();
    $hover.style.left = rect.left / dpi + 'px';
    $hover.style.top = rect.top / dpi + 'px';
    $hover.style.width = (rect.right - rect.left) / dpi + 'px';
    $hover.style.height = (rect.bottom - rect.top) / dpi + 'px';
  }
}

function hideHover() {
  if (hoverNode) {
    $hover.classList.remove('show');
    hoverTree.classList.remove('hover');
    hoverNode = null;
    hoverTree = null;
  }
}

function getActiveNodeWhenSelected(node) {
  // 最高优先级，meta按下返回叶子元素
  if (metaKey) {
    return node;
  }
  if (node && selectNode) {
    // 有选择时，hover/select的只能是平级或者上级
    while (node.struct.lv > selectNode.struct.lv) {
      node = node.parent;
    }
    // 可能点相同的或者是组的子级元素
    if (node === selectNode) {
      return node;
    }
    // 检查二者是否有共同group祖先，没有只能展示最上层group，有则看是否为group
    let p1 = node;
    while (p1.parent instanceof editor.node.Group) {
      p1 = p1.parent;
    }
    let p2 = selectNode;
    while (p2.parent instanceof editor.node.Group) {
      p2 = p2.parent;
    }
    if (p1 !== p2) {
      return p1;
    }
    else if ((node instanceof editor.node.Group)) {
      let p = selectNode.parent;
      // 如果需要展示的node是select的祖先group，要忽略
      while (p && p instanceof editor.node.Group) {
        if (p === node) {
          return;
        }
        p = p.parent;
      }
    }
    return node;
  }
  return node;
}

function showSelect(node) {
  selectNode = node;
  style = selectNode.style;
  computedStyle = selectNode.getComputedStyle();
  // console.log('left', style.left, 'right', style.right, 'top', style.top, 'bottom', style.bottom,
  //   'width', style.width, 'height', style.height, 'tx', style.translateX, 'ty', style.translateY,
  //   'cleft', computedStyle.left, 'cright', computedStyle.right, 'ctop', computedStyle.top,
  //   'cbttom', computedStyle.bottom, 'cwidth', computedStyle.width, 'ctx', computedStyle.translateX,
  //   'cty', computedStyle.translateY, 'w', selectNode.width, 'h', selectNode.height,
  //   'm', selectNode.matrix.join(','), 'mw', selectNode.matrixWorld.join(','));
  updateSelect();
  $selection.classList.add('show');
  selectTree && selectTree.classList.remove('select');
  const li = abHash[node.props.uuid];
  li.scrollIntoView();
  selectTree = li;
  selectTree.classList.add('select');
}

function hideSelect() {
  if (selectNode) {
    $selection.classList.remove('show');
    selectTree.classList.remove('select');
    selectNode = null;
    selectTree = null;
  }
}

function updateSelect() {
  if (selectNode) {
    const rect = selectNode.getBoundingClientRect();
    $selection.style.left = rect.left / dpi + 'px';
    $selection.style.top = rect.top / dpi + 'px';
    $selection.style.width = (rect.right - rect.left) / dpi + 'px';
    $selection.style.height = (rect.bottom - rect.top) / dpi + 'px';
    $selection.style.transform = 'none';
  }
}

function onMove(e, isOnControl) {
  lastX = e.pageX;
  lastY = e.pageY;
  const nx = lastX - originX;
  const ny = lastY - originY;
  const inRoot = nx >= 0 && ny >= 0 && nx <= root.width && ny <= root.width;
  if (!inRoot) {
    return;
  }
  const dx = lastX - startX, dy = lastY - startY;
  const dx2 = dx / zoom * dpi, dy2 = dy / zoom * dpi;
  // 空格按下拖拽画布
  if (spaceKey) {
    if (isMouseDown) {
      isMouseMove = true;
      curPage.updateStyle({
        translateX: pageTx + dx,
        translateY: pageTy + dy,
      });
      if (selectNode) {
        updateSelect();
      }
      updateHover();
    }
    else if (isOnControl) {
      hideHover();
    }
    else {
      let node = root.getNodeFromCurPage(nx * dpi, ny * dpi, !metaKey, false, (metaKey || selectNode) ? undefined : 1);
      node = getActiveNodeWhenSelected(node);
      if(node) {
        showHover(node);
      }
      else {
        hideHover();
      }
    }
  }
  // 非空格看情况是操作选框还是节点还是仅hover
  else {
    // 拖拽缩放选框，一定有selectNode
    if (isControl) {
      isMouseMove = true;
      if (controlType === 'tl') {}
      else if (controlType === 'tr') {}
      else if (controlType === 'br') {}
      else if (controlType === 'bl') {}
      else if (controlType === 't') {
        if (style.width.u === editor.style.define.StyleUnit.AUTO) {
          const top = (computedStyle.top + dy2) * 100 / selectNode.parent.height + '%';
          selectNode.updateStyle({
            top,
          });
        }
        else {
          const top = (computedStyle.top + dy2) * 100 / selectNode.parent.height + '%';
          const height = computedStyle.height;
          selectNode.updateStyle({
            top,
            height: height - dy2,
          });
        }
      }
      else if (controlType === 'r') {
        if (style.width.u === editor.style.define.StyleUnit.AUTO) {
          const right = (computedStyle.right - dx2) * 100 / selectNode.parent.width + '%';
          selectNode.updateStyle({
            right,
          });
        }
        else {
          const width = computedStyle.width + dx2;
          selectNode.updateStyle({
            width,
          });
        }
      }
      else if (controlType === 'b') {
        if (style.height.u === editor.style.define.StyleUnit.AUTO) {
          const bottom = (computedStyle.bottom - dy2) * 100 / selectNode.parent.height + '%';
          selectNode.updateStyle({
            bottom,
          });
        }
        else {
          const height = computedStyle.height + dy2;
          selectNode.updateStyle({
            height,
          });
        }
      }
      else if (controlType === 'l') {
        if (style.width.u === editor.style.define.StyleUnit.AUTO) {
          const left = (computedStyle.left + dx2) * 100 / selectNode.parent.width + '%';
          selectNode.updateStyle({
            left,
          });
        }
        else {
          const left = (computedStyle.left + dx2) * 100 / selectNode.parent.width + '%';
          const width = computedStyle.width;
          selectNode.updateStyle({
            left,
            width: width - dx2,
          });
        }
      }
      selectNode.checkChangeAsShape();
      updateSelect();
    }
    // 拖拽节点本身
    else if (isMouseDown) {
      isMouseMove = true;
      if(selectNode) {
        // 处于编辑状态时，隐藏光标显示区域
        if(isEditText && selectNode instanceof editor.node.Text) {
          selectNode.setCursorEndByAbsCoord(nx, ny);
          $inputContainer.style.display = 'none';
        }
        // 不变也要更新，并不知道节点的约束类型（size是否auto）
        else {
          selectNode.updateStyle({
            translateX: computedStyle.translateX + dx2,
            translateY: computedStyle.translateY + dy2,
          });
          selectNode.checkChangeAsShape();
          updateSelect();
        }
      }
    }
    else if (isOnControl) {
      hideHover();
    }
    // metaKey按下可以选择最深叶子节点，但排除Group，有选择节点时也排除group
    else {
      let node = root.getNodeFromCurPage(nx * dpi, ny * dpi, !metaKey, false, (metaKey || selectNode) ? undefined : 1);
      node = getActiveNodeWhenSelected(node);
      if(node) {
        showHover(node);
      }
      else {
        hideHover();
      }
    }
  }
}

window.onscroll = function() {
  const o = $canvasC.getBoundingClientRect();
  originX = o.left;
  originY = o.top;
};

$overlap.addEventListener('mousedown', function(e) {
  if (!curPage) {
    return;
  }
  // 左键
  if (e.button === 0) {
    isMouseDown = true;
    isMouseMove = false;
    startX = e.pageX;
    startY = e.pageY;
    // 空格按下移动画布
    if (spaceKey) {
      const o = curPage.getComputedStyle();
      pageTx = o.translateX;
      pageTy = o.translateY;
      $overlap.classList.add('down');
    }
    // 普通是选择或者编辑文本
    else {
      const nx = startX - originX;
      const ny = startY - originY;
      const target = e.target;
      // 注意要判断是否点在选择框上的控制点，进入拖拽拉伸模式，只有几个控制点pointerEvents可以被点击
      if (target.tagName === 'SPAN') {
        isControl = true;
        // 通知引擎开始拖拽，如果是固定尺寸中心点对齐的要内部转换下，防止拖尺寸时以自身中心点扩展
        computedStyle = selectNode.startSizeChange();
        const classList = target.classList;
        if (classList.contains('tl')) {
          controlType = 'tl';
        }
        else if (classList.contains('tr')) {
          controlType = 'tr';
        }
        else if (classList.contains('br')) {
          controlType = 'br';
        }
        else if (classList.contains('bl')) {
          controlType = 'bl';
        }
        else if (classList.contains('t')) {
          controlType = 't';
        }
        else if (classList.contains('r')) {
          controlType = 'r';
        }
        else if (classList.contains('b')) {
          controlType = 'b';
        }
        else if (classList.contains('l')) {
          controlType = 'l';
        }
        $overlap.classList.add(controlType);
      }
      // 普通模式选择节点
      else {
        let node = root.getNodeFromCurPage(nx * dpi, ny * dpi, !metaKey, false, (metaKey || selectNode) ? undefined : 1);
        node = getActiveNodeWhenSelected(node);
        if(node) {
          if (isEditText && node === selectNode) {
            selectNode.hideSelectArea();
            const { offsetX, offsetY } = e;
            const x = $selection.offsetLeft + offsetX;
            const y = $selection.offsetTop + offsetY;
            const p = selectNode.getCursorByAbsCoord(x, y);
            showEditText(p.x / dpi, p.y / dpi, p.h / dpi);
            // 防止触发click事件失焦
            e.preventDefault();
          }
          else {
            hideEditText();
            showSelect(node);
            hideHover();
            showBasic();
          }
        }
        else {
          hideEditText();
          hideSelect();
          hideBasic();
        }
      }
    }
  }
});

$overlap.addEventListener('dblclick', function(e) {
  const { offsetX, offsetY } = e;
  const x = $selection.offsetLeft + offsetX;
  const y = $selection.offsetTop + offsetY;
  if (selectNode && selectNode instanceof editor.node.Text) {
    const p = selectNode.getCursorByAbsCoord(x, y);
    showEditText(p.x / dpi, p.y / dpi, p.h / dpi);
  }
});

function showEditText(x, y, h) {
  isEditText = true;
  const style = $inputContainer.style;
  style.left = x + 'px';
  style.top = y + 'px';
  style.height = h + 'px';
  style.display = 'block';
  $inputText.focus();
}

function hideEditText() {
  if (isEditText) {
    if (selectNode && selectNode instanceof editor.node.Text) {
      selectNode.hideSelectArea();
    }
    isEditText = false;
    $inputContainer.style.display = 'none';
    $inputText.blur();
  }
}

let isIme = false;
$inputText.addEventListener('keydown', (e) => {
  const keyCode = e.keyCode;
  if (keyCode === 13) {
    // 回车等候一下让input先触发，输入法状态不会触发
    setTimeout(() => {
      selectNode.enter();
    }, 1);
  } else if (keyCode === 8) {
    e.stopPropagation();
    selectNode.delete();
  } else if (keyCode >= 37 && keyCode <= 40) {
    selectNode.moveCursor(keyCode);
  }
});
$inputText.addEventListener('input', (e) => {
  if (!isIme) {
    const s = e.data;
    selectNode.inputContent(s);
    $inputText.value = '';
  }
});
$inputText.addEventListener('compositionstart', (e) => {
  isIme = true;
});
$inputText.addEventListener('compositionend', (e) => {
  isIme = false;
  const s = e.data;
  selectNode.inputContent(s);
  $inputText.value = '';
});

document.addEventListener('mousemove', function(e) {
  if (!curPage) {
    return;
  }
  // e.preventDefault();
  const target = e.target;
  let isOnControl = false;
  if (target === $selection || target.parentElement === $selection || target.parentElement && target.parentElement.parentElement === $selection) {
    isOnControl = true;
  }
  onMove(e, isOnControl);
});

document.addEventListener('mouseup', function(e) {
  if (!curPage) {
    return;
  }
  if (e.button === 0) {
    if (isControl) {
      $overlap.classList.remove(controlType);
      selectNode.checkSizeChange();
      updateSelect();
    }
    else {
      if(selectNode && isMouseMove) {
        // 发生了拖动位置变化，结束时需转换过程中translate为布局约束（如有）
        selectNode.checkPosChange();
      }
    }
    isMouseDown = false;
    isMouseMove = false;
    isControl = false;
    if(spaceKey) {
      $overlap.classList.remove('down');
    }
  }
});

document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  if (!curPage) {
    return;
  }
  hideSelect();
});

document.addEventListener('keydown', function(e) {
  const m = metaKey;
  metaKey = e.metaKey;
  altKey = e.altKey;
  ctrlKey = e.ctrlKey;
  shiftKey = e.shiftKey;
  if (!curPage) {
    return;
  }
  if (m !== e.metaKey) {
    // onMove(lastX, lastY);
  }
  if (e.keyCode === 8) {
    selectNode && selectNode.remove();
    updateHover();
    hideSelect();
  }
  else if (e.keyCode === 32) {
    spaceKey = true;
    $overlap.classList.add('space');
  }
});

document.addEventListener('keyup', function(e) {
  const m = metaKey;
  metaKey = e.metaKey;
  altKey = e.altKey;
  ctrlKey = e.ctrlKey;
  shiftKey = e.shiftKey;
  if (!curPage) {
    return;
  }
  if (m !== e.metaKey) {
    // onMove(lastX, lastY);
  }
  if (e.keyCode === 32) {
    spaceKey = false;
    $overlap.classList.remove('space');
  }
});

$main.addEventListener('wheel', function(e) {
  if (!curPage) {
    return;
  }
  hideHover();
  // 按下时缩放
  if (metaKey) {
    let sc = 1;
    if(e.deltaY < 0) {
      if(e.deltaY < -300) {
        sc = 0.125;
      }
      else if(e.deltaY < -200) {
        sc = 0.25;
      }
      else if(e.deltaY < -100) {
        sc = 0.5;
      }
      else if(e.deltaY < -50) {
        sc = 0.75;
      }
      else if(e.deltaY < -20) {
        sc = 0.875;
      }
      else {
        sc = 0.9375;
      }
    }
    else if(e.deltaY > 0) {
      if(e.deltaY > 300) {
        sc = 2;
      }
      else if(e.deltaY > 200) {
        sc = 1.75;
      }
      else if(e.deltaY > 100) {
        sc = 1.5;
      }
      else if(e.deltaY > 50) {
        sc = 1.25;
      }
      else if(e.deltaY > 20) {
        sc = 1.125;
      }
      else {
        sc = 1.0625;
      }
    }
    const x = lastX - originX;
    const y = lastY - originY;
    const x1 = x * dpi / root.width;
    const y1 = y * dpi / root.height;
    const scaleX = curPage.computedStyle.scaleX;
    let scale = scaleX * sc;
    if(scale > 32) {
      scale = 32;
    }
    else if(scale < 0.03125) {
      scale = 0.03125;
    }
    root.zoomTo(scale, x1, y1);
    zoom = curPage.getZoom();
  }
  // shift+滚轮是移动
  else {
    if (shiftKey) {
      let sc = 0;
      if(e.deltaX< 0) {
        if(e.deltaX < -200) {
          sc = 50;
        }
        else if(e.deltaX < -100) {
          sc = 40;
        }
        else if(e.deltaX < -50) {
          sc = 30;
        }
        else if(e.deltaX < -20) {
          sc = 20;
        }
        else {
          sc = 10;
        }
      }
      else if(e.deltaX > 0) {
        if(e.deltaX > 200) {
          sc = -50;
        }
        else if(e.deltaX > 100) {
          sc = -40;
        }
        else if(e.deltaX > 50) {
          sc = -30;
        }
        else if(e.deltaX > 20) {
          sc = -20;
        }
        else {
          sc = -10;
        }
      }
      const { translateX } = curPage.getComputedStyle();
      curPage.updateStyle({
        translateX: translateX + sc,
      });
    }
    else {
      let sc = 0;
      if(e.deltaY < 0) {
        if(e.deltaY < -200) {
          sc = 50;
        }
        else if(e.deltaY < -100) {
          sc = 40;
        }
        else if(e.deltaY < -50) {
          sc = 30;
        }
        else if(e.deltaY < -20) {
          sc = 20;
        }
        else {
          sc = 10;
        }
      }
      else if(e.deltaY > 0) {
        if(e.deltaY > 200) {
          sc = -50;
        }
        else if(e.deltaY > 100) {
          sc = -40;
        }
        else if(e.deltaY > 50) {
          sc = -30;
        }
        else if(e.deltaY > 20) {
          sc = -20;
        }
        else {
          sc = -10;
        }
      }
      const { translateY } = curPage.getComputedStyle();
      curPage.updateStyle({
        translateY: translateY + sc,
      });
    }
  }
  updateSelect();
});

function showBasic() {
  $basic.classList.add('show');
  const info = selectNode.getFrameProps();
  $basic.querySelectorAll('.num').forEach(item => {
    item.disabled = false;
  });
  $x.value = editor.math.geom.toPrecision(info.x, 2);
  $y.value = editor.math.geom.toPrecision(info.y, 2);
  $rotate.value = editor.math.geom.toPrecision(info.rotation, 2);
  $w.value = editor.math.geom.toPrecision(info.w, 2);
  $h.value = editor.math.geom.toPrecision(info.h, 2);
}

function hideBasic() {
  $basic.classList.remove('show');
  $basic.querySelectorAll('.num').forEach(item => {
    item.disabled = true;
  });
  $x.value = '';
  $y.value = '';
  $rotate.value = '';
  $w.value = '';
  $h.value = '';
}
