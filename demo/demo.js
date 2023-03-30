const input = document.querySelector('#file');
const tree = document.querySelector('#tree');
const main = document.querySelector('#main');
const canvasC = document.querySelector('#canvasC');
const overlap = document.querySelector('#overlap');
const hover = document.querySelector('#hover');
const selection = document.querySelector('#selection');

matchMedia(
  `(resolution: ${window.devicePixelRatio}dppx)`
).addEventListener("change", function() {
});

let root;
let originX, originY;
let isDown, isControl;
let startX, startY, lastX, lastY;
let hoverNode, selectNode;
let metaKey, shiftKey, ctrlKey, altKey, spaceKey;
let dpi = window.devicePixelRatio;
let curPage, pageTx, pageTy;
let style, computedStyle;
let structs = [];

input.onchange = function(e) {
  const file = input.files[0];
  input.value = null;
  input.blur();
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function() {
    editor.openAndConvertSketchBuffer(reader.result).then(function(json) {
      const canvas = document.createElement('canvas');

      function resize() {
        const { clientWidth, clientHeight } = canvasC;
        canvas.width = clientWidth * dpi;
        canvas.height = clientHeight * dpi;
        const o = canvasC.getBoundingClientRect();
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
      canvasC.appendChild(canvas);
      root = editor.parse(json, canvas, dpi);
      curPage = root.getCurPage();

      root.on('refresh', function(lv) {
        if (lv & editor.refresh.level.RefreshLevel.REBUILD) {
          let s = '';
          structs = root.getCurPageStructs();
          structs.forEach((item, i) => {
            const { node, lv } = item;
            let type = 'n', className = '';
            if (node.isArtBoard) {
              type = 'a';
              className = 'ab';
            }
            else if (node.isGroup) {
              type = 'g';
              className = 'group';
            }
            else if (node instanceof editor.node.Bitmap) {
              type = 'i';
              className = 'img';
            }
            const visible = node.computedStyle[editor.style.define.StyleKey.VISIBLE];
            s += `<li class="${className}" style="margin-left:${(lv - 3) * 16}px" index="${i}">
<span class="type">${type}.</span>
<span class="name">${node.props.name}</span>`;
            if (!node.isArtBoard) {
              s += `<span class="visible" visible="${visible}">${visible ? '可见' : '隐藏'}</span>`;
            }
            s += '</li>';
          });
          tree.innerHTML = s;
        }
      });
    });
  }
}

tree.addEventListener('click', e => {
  const target = e.target;
  if (target.classList.contains('visible')) {
    const visible = target.getAttribute('visible') === 'true';
    const index = parseInt(target.parentElement.getAttribute('index'));
    const node = structs[index].node;
    node.updateStyle({
      visible: !visible,
      pointerEvents: !visible,
    });
    target.setAttribute('visible', (!visible).toString());
    target.innerHTML = visible ? '隐藏' : '可见';
  }
});

function showHover(node) {
  if (hoverNode !== node) {
    hoverNode = node;
    const rect = hoverNode.getBoundingClientRect();
    hover.style.left = rect.left / dpi + 'px';
    hover.style.top = rect.top / dpi + 'px';
    hover.style.width = (rect.right - rect.left) / dpi + 'px';
    hover.style.height = (rect.bottom - rect.top) / dpi + 'px';
    hover.classList.add('show');
  }
}

function hideHover() {
  if (hoverNode) {
    hoverNode = null;
    hover.classList.remove('show');
  }
}

function showSelect(node) {
  if (selectNode !== node) {
    selectNode = node;
    style = selectNode.style;
    computedStyle = selectNode.getComputedStyle();
    const rect = selectNode.getBoundingClientRect();
    selection.style.left = rect.left / dpi + 'px';
    selection.style.top = rect.top / dpi + 'px';
    selection.style.width = (rect.right - rect.left) / dpi + 'px';
    selection.style.height = (rect.bottom - rect.top) / dpi + 'px';
    selection.style.transform = 'none';
    selection.classList.add('show');
  }
}

function hideSelect() {
  if (selectNode) {
    selectNode = null;
    selection.classList.remove('show');
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
      });
    }
    else {
      const node = root.getNodeFromCurPage(nx * dpi, ny * dpi, !metaKey, false,
        (metaKey || selectNode) ? undefined : 1, selectNode);
      if(node && node !== selectNode) {
        showHover(node);
      }
      else {
        hideHover();
      }
    }
  }
  // 非空格看情况是操作选框还是节点还是仅hover
  else {
    // 拖拽缩放选框
    if (isControl) {
      if (!selectNode) {
        return;
      }
    }
    // 拖拽节点本身
    else if (isDown) {
      if (!selectNode) {
        return;
      }
      selectNode.updateStyle({
        translateX: computedStyle.translateX + dx,
        translateY: computedStyle.translateY + dy,
      });
      selection.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    // metaKey按下可以选择最深叶子节点，但排除Group，有选择节点时也排除group
    else {
      const node = root.getNodeFromCurPage(nx * dpi, ny * dpi, !metaKey, false,
        (metaKey || selectNode) ? undefined : 1, selectNode);
      if(node && node !== selectNode) {
        showHover(node);
      }
      else {
        hideHover();
      }
    }
  }
}

window.onscroll = function() {
  const o = canvasC.getBoundingClientRect();
  originX = o.left;
  originY = o.top;
};

main.addEventListener('mousedown', function(e) {
  if (!root) {
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
      overlap.classList.add('down');
    }
    // 普通是选择
    else {
      const nx = startX - originX;
      const ny = startY - originY;
      const target = e.target;
      // 注意要判断是否点在选择框上的控制点，进入拖拽
      if (target.tagName === 'SPAN') {
        isControl = true;
        const classList = target.classList;
        if (classList.contains('tl')) {}
        else if (classList.contains('tr')) {}
        else if (classList.contains('br')) {}
        else if (classList.contains('bl')) {}
        else if (classList.contains('t')) {}
        else if (classList.contains('r')) {}
        else if (classList.contains('b')) {}
        else if (classList.contains('l')) {}
      }
      else {
        const node = root.getNodeFromCurPage(nx * dpi, ny * dpi, !metaKey, false,
          (metaKey || selectNode) ? undefined : 1, selectNode);
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
  if (!root) {
    return;
  }
  onMove(e.pageX, e.pageY);
});

document.addEventListener('mouseup', function(e) {
  if (!root) {
    return;
  }
  if (e.button === 0) {
    isDown = false;
    isControl = false;
    if(spaceKey) {
      overlap.classList.remove('down');
    }
  }
});

document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  if (!root) {
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
  if (!root) {
    return;
  }
  if (m !== e.metaKey) {
    onMove(lastX, lastY);
  }
  if (e.keyCode === 32) {
    spaceKey = true;
    overlap.classList.add('space');
  }
});

document.addEventListener('keyup', function(e) {
  const m = metaKey;
  metaKey = e.metaKey;
  altKey = e.altKey;
  ctrlKey = e.ctrlKey;
  shiftKey = e.shiftKey;
  if (!root) {
    return;
  }
  if (m !== e.metaKey) {
    onMove(lastX, lastY);
  }
  if (e.keyCode === 32) {
    spaceKey = false;
    overlap.classList.remove('space');
  }
});

document.addEventListener('wheel', function(e) {
  if (!root) {
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
    const newMatrix = editor.style.transform.calMatrix({
      translateX,
      translateY,
      scaleX: scale,
      scaleY: scale,
    });
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
