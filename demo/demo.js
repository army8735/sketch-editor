const $input = document.querySelector('#file');
const $page = document.querySelector('#page');
const $tree = document.querySelector('#tree');
const $main = document.querySelector('#main');
const $canvasC = document.querySelector('#canvasC');
const $overlap = document.querySelector('#overlap');
const $hover = document.querySelector('#hover');
const $selection = document.querySelector('#selection');

matchMedia(
  `(resolution: ${window.devicePixelRatio}dppx)`
).addEventListener("change", function() {
});

let root;
let originX, originY;
let isDown, isControl, controlType;
let startX, startY, lastX, lastY;
let hoverNode, selectNode;
let metaKey, shiftKey, ctrlKey, altKey, spaceKey;
let dpi = window.devicePixelRatio;
let curPage, pageTx, pageTy;
let style, computedStyle;
let structs = [];
let abHash = {}, pageHash = {};
let hoverTree, selectTree;

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
        const last = $page.querySelector('.current');
        if (last) {
          last.classList.remove('current');
        }
        pageHash[curPage.props.uuid].classList.add('current');
        $tree.innerHTML = '';
        const ol = document.createElement('ol');
        abHash = {};
        const children = curPage.children;
        for(let i = children.length - 1; i >= 0; i--) {
          ol.appendChild(genNodeTree(children[i], abHash));
        }
        $tree.appendChild(ol);
      });

      root.on(editor.util.Event.DID_ADD_DOM, function(node, isInPage) {
        // 防止overlay层的内容
        if (!isInPage) {
          return;
        }
        const li = genNodeTree(node, abHash);
        const parent = node.parent, children = parent.children, uuid = parent.props.uuid;
        const i = children.indexOf(node);
        const ol = abHash[uuid].querySelector('ol');
        if (i === children.length - 1) {
          ol.appendChild(li);
        }
        else if (i === 0) {
          ol.prependChild(li);
        }
        else {
          ol.insertBefore(node, abHash[node.prev.props.uuid]);
        }
      });
    });
  }
}

function genNodeTree(node, abHash) {
  const type = getNodeType(node);
  const li = document.createElement('li');
  li.className = 'layer';
  li.setAttribute('uuid', node.props.uuid);
  abHash[node.props.uuid] = li;
  let s = `<div>
<span class="type">${type}</span>
<span class="name">${node.props.name}</span>`
  if (!(node instanceof editor.node.ArtBoard)) {
    s += `<span class="visible ${node.computedStyle.visible ? 't' : ''}">可见</span>`;
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
  else {
    //
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
        showHover(root.refs[parent.getAttribute('uuid')]);
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
    hoverNode = null;
    $hover.classList.remove('show');
    hoverTree.classList.remove('hover');
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
  updateSelect();
  $selection.classList.add('show');
  selectTree && selectTree.classList.remove('select');
  const li = abHash[node.props.uuid];
  selectTree = li;
  selectTree.classList.add('select');
}

function hideSelect() {
  if (selectNode) {
    selectNode = null;
    $selection.classList.remove('show');
    selectTree.classList.remove('select');
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

function onMove(x, y) {
  lastX = x;
  lastY = y;
  const nx = x - originX;
  const ny = y - originY;
  const inRoot = nx >= 0 && ny >= 0 && nx <= root.width && ny <= root.width;
  if (!inRoot) {
    return;
  }
  const dx = lastX - startX, dy = lastY - startY;
  // 空格按下拖拽画布
  if (spaceKey) {
    if (isDown) {
      curPage.updateStyle({
        translateX: pageTx + dx,
        translateY: pageTy + dy,
      }, () => {
        if (selectNode) {
          updateSelect();
        }
        updateHover();
      });
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
    // 拖拽缩放选框，一定有selectNode，防止bug加个防御
    if (isControl) {
      if (!selectNode) {
        return;
      }
      const dx = lastX - startX, dy = lastY - startY;
      if (controlType === 'tl') {}
      else if (controlType === 'tr') {}
      else if (controlType === 'br') {}
      else if (controlType === 'bl') {}
      else if (controlType === 't') {}
      else if (controlType === 'r') {
        if (style.width.u === editor.style.define.StyleUnit.AUTO) {
          const right = (computedStyle.right - dx) * 100 / selectNode.parent.width + '%';
          selectNode.updateStyle({
            right,
          }, function() {
            updateSelect();
          });
        }
      }
      else if (controlType === 'b') {}
      else if (controlType === 'l') {}
    }
    // 拖拽节点本身
    else if (isDown) {
      if (!selectNode) {
        return;
      }
      selectNode.updateStyle({
        translateX: computedStyle.translateX + dx,
        translateY: computedStyle.translateY + dy,
      }, function() {
        updateSelect();
      });
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
    isDown = true;
    startX = e.pageX;
    startY = e.pageY;
    // 空格按下移动画布
    if (spaceKey) {
      const o = curPage.getComputedStyle();
      pageTx = o.translateX;
      pageTy = o.translateY;
      $overlap.classList.add('down');
    }
    // 普通是选择
    else {
      const nx = startX - originX;
      const ny = startY - originY;
      const target = e.target;
      // 注意要判断是否点在选择框上的控制点，进入拖拽拉伸模式，只有几个控制点pointerEvents可以被点击
      if (target.tagName === 'SPAN') {
        isControl = true;
        // 再更新下，防止重复拖拽数据不及时
        computedStyle = selectNode.getComputedStyle();
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
          showSelect(node);
          hideHover();
        }
        else {
          hideSelect();
        }
      }
    }
  }
});

document.addEventListener('mousemove', function(e) {
  if (!curPage) {
    return;
  }
  onMove(e.pageX, e.pageY);
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
      if(selectNode) {
        const dx = lastX - startX, dy = lastY - startY;
        // 发生了拖动位置变化，结束时需转换过程中translate为布局约束（如有）
        if(dx || dy) {
          selectNode.checkPosChange(selectNode);
        }
      }
    }
    isDown = false;
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
    onMove(lastX, lastY);
  }
  if (e.keyCode === 32) {
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
    onMove(lastX, lastY);
  }
  if (e.keyCode === 32) {
    spaceKey = false;
    $overlap.classList.remove('space');
  }
});

document.addEventListener('wheel', function(e) {
  if (!curPage) {
    return;
  }
  hideHover();
  // 按下时缩放
  if (metaKey) {
    let sc = 1;
    if(e.deltaY < 0) {
      if(e.deltaY < -200) {
        sc = 0.125;
      }
      else if(e.deltaY < -100) {
        sc = 0.25;
      }
      else if(e.deltaY < -50) {
        sc = 0.5;
      }
      else if(e.deltaY < -20) {
        sc = 0.75;
      }
      else {
        sc = 0.875;
      }
    }
    else if(e.deltaY > 0) {
      if(e.deltaY > 200) {
        sc = 2;
      }
      else if(e.deltaY > 100) {
        sc = 1.75;
      }
      else if(e.deltaY > 50) {
        sc = 1.5;
      }
      else if(e.deltaY > 20) {
        sc = 1.25;
      }
      else {
        sc = 1.125;
      }
    }
    const x = lastX - originX;
    const y = lastY - originY;
    const pt = {
      x: x * dpi,
      y: y * dpi,
    };
    const { translateX, translateY, scaleX } = curPage.getComputedStyle();
    const inverse = editor.math.matrix.inverse(curPage.matrixWorld);
    // 求出鼠标屏幕坐标在画布内相对page的坐标
    const pt1 = editor.math.matrix.calPoint(pt, inverse);
    let scale = scaleX * sc;
    if(scale > 10) {
      scale = 10;
    }
    else if(scale < 0.1) {
      scale = 0.1;
    }
    const style = editor.style.css.normalize({
      translateX,
      translateY,
      scaleX: scale,
      scaleY: scale,
    });
    const newMatrix = editor.style.transform.calMatrix(style);
    // 新缩放尺寸，位置不动，相对page坐标在新matrix下的坐标
    const pt2 = editor.math.matrix.calPoint(pt1, newMatrix);
    // 差值是需要调整的距离
    const dx = pt2.x - pt.x / dpi, dy = pt2.y - pt.y / dpi;
    curPage.updateStyle({
      translateX: translateX - dx,
      translateY: translateY - dy,
      scaleX: scale,
      scaleY: scale,
    });
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
});
