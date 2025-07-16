let canvas;
let input = document.querySelector('#base64');
sketchEditor.gl.ca.preserveDrawingBuffer = true;
sketchEditor.config.historyTime = 0;

sketchEditor.style.font.registerData({
  family: 'Helvetica',
  name: 'Helvetica',
  lhr: 1.14990234375,
  car: 1.14990234375,
  blr: 0.919921875,
  lgr: 0,
  list: [
    {
      style: 'Regular',
      postscriptName: 'Helvetica',
      loaded: true,
    },
    {
      style: 'Bold',
      postscriptName: 'Helvetica-Bold',
      loaded: true,
    },
    {
      style: 'Light',
      postscriptName: 'Helvetica-Light',
      loaded: true,
    },
  ],
});

let count = 0;
let root;
let listener;

function toDataURL() {
  input.value = (count++) + ',' + canvas.toDataURL();
}

function toStyle() {
  const nodes = listener.selected;
  if (nodes.length > 1) {
    input.value = JSON.stringify(nodes.map(node => {
      const style = node.style;
      const computedStyle = node.computedStyle;
      return [
        count,
        style,
        computedStyle,
      ];
    }));
    count++;
  }
  else if (nodes.length) {
    let node = nodes[0];
    if (!node) {
      node = root.getCurPage().children[0];
    }
    const style = node.style;
    const computedStyle = node.computedStyle;
    input.value = JSON.stringify([
      count++,
      style,
      computedStyle,
    ]);
  }
  else {
    input.value = '[' + (count++) + ']';
  }
}

function toRich() {
  const nodes = listener.selected;
  if (nodes.length > 1) {
    input.value = JSON.stringify(nodes.map(node => {
      return [
        count,
        node.rich,
      ];
    }));
    count++;
  }
  else if (nodes.length) {
    let node = nodes[0];
    if (!node) {
      node = root.getCurPage().children[0];
    }
    input.value = JSON.stringify([
      count++,
      node.rich,
    ]);
  }
  else {
    input.value = '[' + (count++) + ']';
  }
}

function toSelect() {
  const nodes = listener.selected;
  if (nodes.length > 1) {
    input.value = JSON.stringify(nodes.map(node => {
      return [
        count,
        node.name,
      ];
    }));
    count++;
  }
  else if (nodes.length) {
    let node = nodes[0];
    if (!node) {
      node = root.getCurPage().children[0];
    }
    input.value = JSON.stringify([
      count++,
      node.name,
    ]);
  }
  else {
    input.value = '[' + (count++) + ']';
  }
}

function toContent() {
  const nodes = listener.selected;
  if (nodes.length > 1) {
    input.value = JSON.stringify(nodes.map(node => {
      return [
        count,
        node.content,
      ];
    }));
    count++;
  }
  else if (nodes.length) {
    let node = nodes[0];
    if (!node) {
      node = root.getCurPage().children[0];
    }
    input.value = JSON.stringify([
      count++,
      node.content,
    ]);
  }
  else {
    input.value = '[' + (count++) + ']';
  }
}

function toPoint() {
  const nodes = listener.selected;
  if (nodes.length > 1) {
    input.value = JSON.stringify(nodes.map(node => {
      return [
        count,
        node.points.map(item => ({
          x: item.x,
          y: item.y,
          cornerRadius: item.cornerRadius,
          curveMode: item.curveMode,
          hasCurveFrom: item.hasCurveFrom,
          hasCurveTo: item.hasCurveTo,
          fx: item.fx,
          fy: item.fy,
          tx: item.tx,
          ty: item.ty,
          absX: item.absX,
          absY: item.absY,
          absTx: item.absTx,
          absTy: item.absTy,
          absFx: item.absFx,
          absFy: item.absFy,
        })),
      ];
    }));
    count++;
  }
  else if (nodes.length) {
    let node = nodes[0];
    if (!node) {
      node = root.getCurPage().children[0];
    }
    input.value = JSON.stringify([
      count++,
      node.points.map(item => ({
        x: item.x,
        y: item.y,
        cornerRadius: item.cornerRadius,
        curveMode: item.curveMode,
        hasCurveFrom: item.hasCurveFrom,
        hasCurveTo: item.hasCurveTo,
        fx: item.fx,
        fy: item.fy,
        tx: item.tx,
        ty: item.ty,
        absX: item.absX,
        absY: item.absY,
        absTx: item.absTx,
        absTy: item.absTy,
        absFx: item.absFx,
        absFy: item.absFy,
      })),
    ]);
  }
  else {
    input.value = '[' + (count++) + ']';
  }
}

function toTree() {
  const tree = document.querySelector('#tree');
  function scan(node) {
    const res = {
      name: node.querySelector('dt .name').title,
      children: [],
    };
    const children = node.children;
    for (let i = 1, len = children.length; i < len; i++) {
      res.children.push(scan(children[i].children[0]));
    }
    return res;
  }
  const list = [count++];
  const children = tree.children[1].children;
  for (let i = 0, len = children.length; i < len; i++) {
    list.push(scan(children[i].children[0]));
  }
  input.value = JSON.stringify(list);
}

function toHistory() {
  input.value = JSON.stringify([count++, listener.history.commands.length, listener.history.commandsR.length, sketchEditor.control.picker.aaa]);
}

window.onerror = function(e) {
  input.value = e.toString();
  requestAnimationFrame(function () {
    input.value = e.toString();
  });
  setTimeout(function () {
    input.value = e.toString();
  });
}

fetch('./sketch.sketch')
  .then((res) => {
    return res.arrayBuffer();
  })
  .then((buff) => {
    sketchEditor
      .openAndConvertSketchBuffer(buff)
      .then(json => {
        const dpi = 2;
        const $canvasC = document.querySelector('#canvasC');
        canvas = document.createElement('canvas');
        canvas.width = 500 * dpi;
        canvas.height = 500 * dpi;
        $canvasC.appendChild(canvas);
        root = sketchEditor.parse(json, {
          canvas,
          dpi,
        });
        listener = sketchEditor.control.initCanvasControl(root, $canvasC, window.disabled || {
          disabled: {
            guides: true,
          },
        });

        const page = document.querySelector('#page');
        const tree = document.querySelector('#tree');
        const side = document.querySelector('#side .panel');
        const toolbar = document.querySelector('#toolbar');
        if (page) {
          sketchEditor.control.initPageList(root, page, listener);
        }
        if (tree) {
          sketchEditor.control.initTree(root, tree, listener);
        }
        if (side) {
          sketchEditor.control.initPanel(root, side, listener);
        }
        if (toolbar) {
          sketchEditor.control.initToolbar(root, toolbar, listener);
        }

        const button1 = document.querySelector('#button1');
        const button2 = document.querySelector('#button2');
        const button3 = document.querySelector('#button3');
        const button4 = document.querySelector('#button4');
        const button5 = document.querySelector('#button5');
        const button6 = document.querySelector('#button6');
        const button7 = document.querySelector('#button7');
        const button8 = document.querySelector('#button8');
        if (button1) {
          button1.addEventListener('click', () => {
            toDataURL();
          });
        }
        if (button2) {
          button2.addEventListener('click', () => {
            toStyle();
          });
        }
        if (button3) {
          button3.addEventListener('click', () => {
            toRich();
          });
        }
        if (button4) {
          button4.addEventListener('click', () => {
            toSelect();
          });
        }
        if (button5) {
          button5.addEventListener('click', () => {
            toContent();
          });
        }
        if (button6) {
          button6.addEventListener('click', () => {
            toPoint();
          });
        }
        if (button7) {
          button7.addEventListener('click', () => {
            toTree();
          });
        }
        if (button8) {
          button8.addEventListener('click', () => {
            toHistory();
          });
        }
      });
  });

