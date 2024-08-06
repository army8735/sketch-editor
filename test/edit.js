let canvas;
let input = document.querySelector('#base64');
sketchEditor.gl.ca.preserveDrawingBuffer = true;

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
      postscriptName: 'helvetica',
      loaded: true,
    },
    {
      style: 'Bold',
      postscriptName: 'helvetica-bold',
      loaded: true,
    },
    {
      style: 'Light',
      postscriptName: 'helvetica-light',
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
}

function toSelect() {
  const nodes = listener.selected;
  if (nodes.length > 1) {
    input.value = JSON.stringify(nodes.map(node => {
      return [
        count,
        node.props.name,
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
      node.props.name,
    ]);
  }
  else {
    input.value = '[' + (count++) + ']';
  }
}

window.onerror = function(e) {
  input.value = e.toString();
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
        sketchEditor.control.initPageList(root, document.querySelector('#page'));
        listener = sketchEditor.control.initCanvasControl(root, $canvasC);
        sketchEditor.control.initTree(root, document.querySelector('#tree'), listener);
        sketchEditor.control.initPanel(root, document.querySelector('#side'), listener);

        $canvasC.addEventListener('mousedown', (e) => {
          if (e.button === 1) {
            e.preventDefault();
            toDataURL();
          }
          else if (e.button === 2) {
            e.preventDefault();
            toStyle();
          }
        });
        const button1 = document.querySelector('#button1');
        const button2 = document.querySelector('#button2');
        const button3 = document.querySelector('#button3');
        const button4 = document.querySelector('#button4');
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
      });
  });

