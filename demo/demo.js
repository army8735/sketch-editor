const { StyleUnit } = editor.style.define;

const $input = document.querySelector('#file');
const $page = document.querySelector('#page');
const $tree = document.querySelector('#tree');
const $main = document.querySelector('#main');
const $canvasC = $main.querySelector('#canvasC');
const $overlap = $main.querySelector('#overlap');
const $hover = $main.querySelector('#hover');
const $actual = $main.querySelector('#actual');
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
const $text = $side.querySelector('#text');
const $family = $text.querySelector('#family');
const $family2 = $text.querySelector('#family2');
const $style = $text.querySelector('#style');
const $style2 = $text.querySelector('#style2');
const $color = $text.querySelector('#color');
const $color2 = $text.querySelector('#color2');
let frameProps;

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

const defaultFont = {
  "alibaba sans": {
  "family": "Alibaba Sans",
    "name": "Alibaba Sans",
    "blr": 1.189,
    "lgr": 0,
    "lhr": 1.551,
    "list": [
    {
      "style": "Light",
      "postscriptName": "alibabasans-light",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/yX9fSK8Vy1wAAAAAAAAAABAADnV5AQBr/AlibabaSans-Light.ttf"
    },
    {
      "style": "Regular",
      "postscriptName": "alibabasans-regular",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/QgUFR5-393IAAAAAAAAAABAADnV5AQBr/AlibabaSans-Regular.ttf"
    },
    {
      "style": "Medium",
      "postscriptName": "alibabasans-medium",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/XQaWS7V598AAAAAAAAAAABAADnV5AQBr/AlibabaSans-Medium.ttf"
    },
    {
      "style": "Bold",
      "postscriptName": "alibabasans-bold",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/4XI7Tq31Q2MAAAAAAAAAABAADnV5AQBr/AlibabaSans-Bold.ttf"
    },
    {
      "style": "Heavy",
      "postscriptName": "alibabasans-heavy",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/5tY6T4gfeAAAAAAAAAAAABAADnV5AQBr/AlibabaSans-Heavy.ttf"
    },
    {
      "style": "Black",
      "postscriptName": "alibabasans-black",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/6cr-Ra-6W88AAAAAAAAAABAADnV5AQBr/AlibabaSans-Black.ttf"
    },
    {
      "style": "Light Italic",
      "postscriptName": "alibabasans-lightitalic",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/uG6lQ6mO0XIAAAAAAAAAABAADnV5AQBr/AlibabaSans-LightItalic.ttf"
    },
    {
      "style": "Italic",
      "postscriptName": "alibabasans-italic",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/nhktTqHzS_cAAAAAAAAAABAADnV5AQBr/AlibabaSans-Italic.ttf"
    },
    {
      "style": "Medium Italic",
      "postscriptName": "alibabasans-mediumitalic",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/03abTJZ_ELkAAAAAAAAAABAADnV5AQBr/AlibabaSans-MediumItalic.ttf"
    },
    {
      "style": "Bold Italic",
      "postscriptName": "alibabasans-bolditalic",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/iDvGRKYxpFMAAAAAAAAAABAADnV5AQBr/AlibabaSans-BoldItalic.ttf"
    }
  ]
},
  "alibaba puhuiti": {
  "family": "Alibaba PuHuiTi",
    "name": "阿里巴巴普惠体",
    "blr": 1.05,
    "lgr": 0,
    "lhr": 1.372,
    "list": [
    {
      "style": "Light",
      "postscriptName": "alibabapuhuiti-light",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/-UceTp6AhxQAAAAAAAAAABAADnV5AQBr/Alibaba-PuHuiTi-Light.ttf"
    },
    {
      "style": "Regular",
      "postscriptName": "alibabapuhuiti-regular",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/sBaWS5Vr5D0AAAAAAAAAABAADnV5AQBr/Alibaba-PuHuiTi-Regular.ttf"
    },
    {
      "style": "Medium",
      "postscriptName": "alibabapuhuiti-medium",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/XW9NRY1ChxcAAAAAAAAAABAADnV5AQBr/Alibaba-PuHuiTi-Medium.ttf"
    },
    {
      "style": "Bold",
      "postscriptName": "alibabapuhuiti-bold",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/9ZVPTLIO54MAAAAAAAAAABAADnV5AQBr/Alibaba-PuHuiTi-Bold.ttf"
    },
    {
      "style": "Heavy",
      "postscriptName": "alibabapuhuiti-heavy",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/NM6KQYE2VBwAAAAAAAAAABAADnV5AQBr/Alibaba-PuHuiTi-Heavy.ttf"
    }
  ]
},
  "alibaba puhuiti 2.0": {
  "family": "Alibaba PuHuiTi 2.0",
    "name": "阿里巴巴普惠体 2.0",
    "blr": 1.06,
    "lgr": 0,
    "lhr": 1.4,
    "list": [
    {
      "style": "35 Thin",
      "postscriptName": "alibabapuhuiti_2_35_thin",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/AF6oQZbHeJIAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-35-Thin.ttf"
    },
    {
      "style": "45 Light",
      "postscriptName": "alibabapuhuiti_2_45_light",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/_qOARr4eO6oAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-45-Light.ttf"
    },
    {
      "style": "65 Medium",
      "postscriptName": "alibabapuhuiti_2_65_medium",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/w19VS7_VQ2UAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-65-Medium.ttf"
    },
    {
      "style": "75 Semibold",
      "postscriptName": "alibabapuhuiti_2_75_semibold",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/I6y8QKLB2n8AAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-75-SemiBold.ttf"
    },
    {
      "style": "85 Bold",
      "postscriptName": "alibabapuhuiti_2_85_bold",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/1UNUTqtQsyAAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-85-Bold.ttf"
    },
    {
      "style": "95 Extrabold",
      "postscriptName": "alibabapuhuiti_2_95_extrabold",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/MnqHQqrD0YgAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-95-ExtraBold.ttf"
    },
    {
      "style": "105 Heavy",
      "postscriptName": "alibabapuhuiti_2_105_heavy",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/rg89T7ajrsYAAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-105-Heavy.ttf"
    },
    {
      "style": "115 Black",
      "postscriptName": "alibabapuhuiti_2_115_black",
      "url": "https://mass-office.alipay.com/huamei_koqzbu/afts/file/dNLASYAWQW8AAAAAAAAAABAADnV5AQBr/AlibabaPuHuiTi-2-115-Black.ttf"
    }
  ]
}
}
for (let k in defaultFont) {
  if (defaultFont.hasOwnProperty(k)) {
    editor.style.font.registerData(defaultFont[k]);
  }
}

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
        else if (children.length === 0) {
          ol.appendChild(li);
        }
        else if (i === 0) {
          ol.insertBefore(li, ol.children[0]);
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
        setFontPanel(selectNode);
      });

      setTimeout(function() {
      root.setPageIndex(json.currentPageIndex || 0);
      }, 0)
    });
  }
}

function genNodeTree(node, abHash) {
  let type = getNodeType(node);
  if (node instanceof editor.node.Geom || node instanceof editor.node.ShapeGroup) {
    const rect = node.rect;
    let width = rect[2] - rect[0];
    let height = rect[3] - rect[1];
    if (!width || !height) {
      type = `<b><svg width="14" height="14"><path d="M0,0L10,0L10,10L0,10L0,0ZM4,4L14,4L14,14L4,14,L4,4Z" fill="#D8D8D8" fill-rule="evenodd" stroke="#979797" stroke-width="1"></path></svg></b>`;
    }
    else {
      let scale, x = 0, y = 0;
      if(width >= height) {
        scale = 14 / width;
        y = (14 - height * scale) * 0.5;
      }
      else {
        scale = 14 / height;
        x = (14 - width * scale) * 0.5;
      }
      x -= rect[0] * scale;
      y -= rect[1] * scale;
      type = `<b style="transform:translate(${x}px, ${y}px) scale(${scale})">` + node.toSvg(scale) + '</b>';
    }
  }
  const li = document.createElement('li');
  const classNames = ['layer'];
  if (node.computedStyle.maskMode) {
    classNames.push('mask');
  }
  if (node instanceof editor.node.SymbolMaster) {
    classNames.push('symbol-master');
  }
  li.className = classNames.join(' ');
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
  else if (node instanceof editor.node.SymbolInstance) {
    type = '🔷';
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
  $actual.classList.add('show');
  selectTree && selectTree.classList.remove('select');
  const li = abHash[node.props.uuid];
  li.scrollIntoView();
  selectTree = li;
  selectTree.classList.add('select');
  if (node instanceof editor.node.Text) {
    setFontPanel(node);
    $text.classList.add('show');
  }
}

function hideSelect() {
  if (selectNode) {
    $selection.classList.remove('show');
    $actual.classList.remove('show');
    selectTree.classList.remove('select');
    selectNode = null;
    selectTree = null;
    $text.classList.remove('show');
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
    const rect2 = selectNode.getActualRect();
    $actual.style.left = rect2.left / dpi + 'px';
    $actual.style.top = rect2.top / dpi + 'px';
    $actual.style.width = (rect2.right - rect2.left) / dpi + 'px';
    $actual.style.height = (rect2.bottom - rect2.top) / dpi + 'px';
    if (isEditText) {
      updateEditText();
    }
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
        const o = {};
        if (style.top.u === StyleUnit.PX) {
          o.top = computedStyle.top + dy2;
          if (style.height.u === StyleUnit.PX || style.bottom.u === StyleUnit.AUTO) {
            o.height = computedStyle.height - dy2;
          }
        }
        else if (style.height.u === StyleUnit.AUTO) {
          o.top = (computedStyle.top + dy2) * 100 / selectNode.parent.height + '%';
          if (style.height.u === StyleUnit.PX || style.bottom.u === StyleUnit.AUTO) {
            o.height = computedStyle.height - dy2;
          }
        }
        else {
          o.top = (computedStyle.top + dy2) * 100 / selectNode.parent.height + '%';
          o.height = computedStyle.height - dy2;
        }
        selectNode.updateStyle(o);
      }
      else if (controlType === 'r') {
        const o = {};
        if (style.right.u === StyleUnit.PX) {
          o.right = computedStyle.right - dx2;
          if (style.width.u === StyleUnit.PX || style.left.u === StyleUnit.AUTO) {
            o.width = computedStyle.width + dx2;
          }
        }
        else if (style.width.u === StyleUnit.AUTO) {
          o.right = (computedStyle.right - dx2) * 100 / selectNode.parent.width + '%';
        }
        else {
          o.width = computedStyle.width + dx2;
        }
        selectNode.updateStyle(o);
      }
      else if (controlType === 'b') {
        const o = {};
        if (style.bottom.u === StyleUnit.PX) {
          o.bottom = computedStyle.bottom - dy2;
          if (style.height.u === StyleUnit.PX || style.top.u === StyleUnit.AUTO) {
            o.height = computedStyle.height + dy2;
          }
        }
        else if (style.height.u === StyleUnit.AUTO) {
          o.bottom = (computedStyle.bottom - dy2) * 100 / selectNode.parent.height + '%';
        }
        else {
          o.height = computedStyle.height + dy2;
        }
        selectNode.updateStyle(o);
      }
      else if (controlType === 'l') {
        const o = {};
        if (style.left.u === StyleUnit.PX) {
          o.left = computedStyle.left + dx2;
          if (style.width.u === StyleUnit.PX || style.right.u === StyleUnit.AUTO) {
            o.width = computedStyle.width - dx2;
          }
        }
        else if (style.width.u === StyleUnit.AUTO) {
          o.left = (computedStyle.left + dx2) * 100 / selectNode.parent.width + '%';
          if (style.width.u === StyleUnit.PX || style.right.u === StyleUnit.AUTO) {
            o.width = computedStyle.width - dx2;
          }
        }
        else {
          o.left = (computedStyle.left + dx2) * 100 / selectNode.parent.width + '%';
          o.width = computedStyle.width - dx2;
        }
        selectNode.updateStyle(o);
      }
      selectNode.checkShapeChange();
      updateSelect();
    }
    // 拖拽节点本身
    else if (isMouseDown) {
      isMouseMove = true;
      if(selectNode) {
        // 处于编辑状态时，隐藏光标显示区域
        if(isEditText && selectNode instanceof editor.node.Text) {
          selectNode.setCursorEndByAbsCoord(nx * dpi, ny * dpi);
          // $inputContainer.style.display = 'none';
          $inputContainer.style.opacity = 0;
        }
        // 不变也要更新，并不知道节点的约束类型（size是否auto）
        else {
          selectNode.updateStyle({
            translateX: computedStyle.translateX + dx2,
            translateY: computedStyle.translateY + dy2,
          });
          selectNode.checkShapeChange();
          updateSelect();
        }
      }
    }
    else if (isOnControl) {
      hideHover();
    }
    // metaKey按下可以选择最深叶子节点，但排除Group，有选择节点时也排除group
    else {
      let node = root.getNodeFromCurPage(nx * dpi, ny * dpi, !metaKey, metaKey, (metaKey || selectNode) ? undefined : 1);
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
            const p = selectNode.setCursorStartByAbsCoord(x * dpi, y * dpi);
            showEditText(p.x / dpi, p.y / dpi, p.h / dpi);
            setFontPanel(node);
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
    const p = selectNode.setCursorStartByAbsCoord(x * dpi, y * dpi);
    showEditText(p.x / dpi, p.y / dpi, p.h / dpi);
    setFontPanel(selectNode);
  }
});

function showEditText(x, y, h) {
  isEditText = true;
  const style = $inputContainer.style;
  style.left = x + 'px';
  style.top = y + 'px';
  style.height = h + 'px';
  // style.display = 'block';
  style.opacity = 1;
  $inputText.focus();
}

function updateEditText() {
  if (isEditText) {
    const { x, y } = selectNode.getCursorAbsCoord();
    const style = $inputContainer.style;
    style.left = x / dpi + 'px';
    style.top = y / dpi + 'px';
    // style.display = 'block';
    style.opacity = 1;
  }
}

function hideEditText() {
  if (isEditText) {
    if (selectNode && selectNode instanceof editor.node.Text) {
      selectNode.hideSelectArea();
    }
    isEditText = false;
    // $inputContainer.style.display = 'none';
    $inputContainer.style.opacity = 0;
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
      updateSelect();
    }, 1);
  } else if (keyCode === 8) {
    e.stopPropagation();
    selectNode.delete();
    updateSelect();
  } else if (keyCode >= 37 && keyCode <= 40) {
    selectNode.moveCursor(keyCode);
  }
});
$inputText.addEventListener('input', (e) => {
  if (!isIme) {
    const s = e.data;
    selectNode.input(s);
    updateSelect();
    $inputText.value = '';
  }
});
$inputText.addEventListener('compositionstart', (e) => {
  isIme = true;
});
$inputText.addEventListener('compositionend', (e) => {
  isIme = false;
  const s = e.data;
  selectNode.input(s);
  updateSelect();
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
        if (isEditText) {
          // 可能选区为空，展示光标
          const multi = selectNode.checkCursorMulti();
          if (!multi) {
            updateEditText();
          }
          else {
            // 选区需要聚焦但不展示光标
            // $inputContainer.style.display = 'block';
            $inputContainer.style.opacity = 0;
          }
          $inputText.focus();
          setFontPanel(selectNode);
        }
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
    if (e.target && e.target.tagName !== 'INPUT') {
      selectNode && selectNode.remove();
      updateHover();
      hideSelect();
    }
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
  frameProps = selectNode.getFrameProps();
  $basic.querySelectorAll('.num').forEach(item => {
    item.disabled = false;
  });
  $x.value = editor.math.geom.toPrecision(frameProps.x, 2);
  $y.value = editor.math.geom.toPrecision(frameProps.y, 2);
  $rotate.value = editor.math.geom.toPrecision(frameProps.rotation, 2);
  $w.value = editor.math.geom.toPrecision(frameProps.w, 2);
  $h.value = editor.math.geom.toPrecision(frameProps.h, 2);
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

$x.addEventListener('change', function() {
  const nv = parseFloat($x.value);
  const delta = nv - frameProps.x;
  selectNode.updateStyle({
    translateX: selectNode.computedStyle.translateX + delta,
  });
  selectNode.checkPosChange();
  selectNode.checkShapeChange();
  frameProps.x += delta;
  updateSelect();
});

$y.addEventListener('change', function() {
  const nv = parseFloat($y.value);
  const delta = nv - frameProps.y;
  selectNode.updateStyle({
    translateY: selectNode.computedStyle.translateY + delta,
  });
  selectNode.checkPosChange();
  selectNode.checkShapeChange();
  frameProps.y += delta;
  updateSelect();
});

function setFontPanel(node) {
  const { info, data } = editor.style.font;
  let s = '';
  for (let i in info) {
    if (info.hasOwnProperty(i)) {
      const item = info[i];
      const list = item.list || [];
      if (list.length) {
        s += `<option value="${i}">${item.name || i}</option>`;
      }
    }
  }
  const res = isEditText ? editor.tools.text.getEditData(node) : editor.tools.text.getData([node]);
  if (res.fontFamily.length > 1) {
    s = '<option value="多种字体" disabled="disabled">多种字体</option>' + s;
  }
  else if (!res.valid) {
    s = `<option value="${res.fontFamily[0]}" disabled="disabled">${res.name[0]}</option>` + s;
  }
  const name = res.name.length > 1 ? '多种字体' : res.name[0];
  const ff = res.fontFamily[0];
  $family.innerHTML = s;
  $family.value = ff;
  $family2.innerHTML = name;
  $style2.innerHTML = res.fontWeight;
  if (!res.valid) {
    $family2.classList.add('family-n');
    $style2.classList.add('style-n');
    $style.disabled = true;
  }
  else {
    const list = $family.querySelectorAll(`option`);
    for (let i = 0, len = list.length; i < len; i++) {
      const option = list[i];
      if (data[ff].family.toLowerCase() === option.value) {
        option.selected = true;
        break;
      }
    }
    $family2.classList.remove('family-n');
    const fontWeightList = res.fontWeightList;
    let s = '';
    for (let i = 0, len = fontWeightList.length; i < len; i++) {
      const item = fontWeightList[i];
      s += `<option value="${item.value}">${item.label}</option>`;
    }
    $style.innerHTML = s;
    $style.value = ff;
    $style2.classList.remove('style-n');
    $style.disabled = !res.fontWeightList.length || res.fontFamily.length > 1;
  }
  $color.value = editor.style.css.color2hexStr(res.color[0]).slice(0, 7);
  if (res.color.length > 1) {
    $color2.style.display = 'block';
  }
  else {
    $color2.style.display = 'none';
  }
}

$family.addEventListener('change', function() {
  const list = editor.style.font.data[$family.value.toLowerCase()].list;
  const fontFamily = list[0].postscriptName;
  if (isEditText) {
    if (selectNode.cursor.isMulti) {
      selectNode.updateTextRangeStyle({ fontFamily });
    } else {}
  } else {
    selectNode.updateTextStyle({ fontFamily });
  }
  setFontPanel(selectNode);
});

$style.addEventListener('change', function() {
  $style2.innerHTML = $style.selectedOptions[0].innerHTML;
  const fontFamily = $style.value;
  if (isEditText) {
    if (selectNode.cursor.isMulti) {
      selectNode.updateTextRangeStyle({ fontFamily });
    } else {}
  } else {
    selectNode.updateTextStyle({ fontFamily });
  }
});

$color.addEventListener('input', function() {
  const color = $color.value;
  if (isEditText) {
    if (selectNode.cursor.isMulti) {
      selectNode.updateTextRangeStyle({ color });
    } else {}
  } else {
    selectNode.updateTextStyle({ color });
  }
});
