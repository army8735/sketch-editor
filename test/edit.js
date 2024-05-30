let canvas = document.querySelector('canvas');
let input = document.querySelector('#base64');
sketchEditor.ca.preserveDrawingBuffer = true;

let count = 0;
let root;
let listener;

function toDataURL() {
  input.value = (count++) + ',' + canvas.toDataURL();
}

function toStyle() {
  let node = listener.selected[0];
  if (!node) {
    node = root.getCurPage().children[0];
    if (node instanceof sketchEditor.node.Container) {
      node = node.children[0];
    }
  }
  const style = node.style;
  const computedStyle = node.computedStyle;
  input.value = JSON.stringify([
    count++,
    style.left,
    style.right,
    style.top,
    style.bottom,
    style.width,
    style.height,
    style.translateX,
    style.translateY,
    computedStyle.left,
    computedStyle.right,
    computedStyle.top,
    computedStyle.bottom,
    computedStyle.width,
    computedStyle.height,
    computedStyle.translateX,
    computedStyle.translateY,
  ]);
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
        const canvas = document.createElement('canvas');
        canvas.width = 500 * dpi;
        canvas.height = 500 * dpi;
        $canvasC.appendChild(canvas);
        root = window.root = sketchEditor.parse(json, canvas, dpi);
        listener = sketchEditor.control.initCanvasControl(root, $canvasC);
        sketchEditor.control.initTreeList(root, document.querySelector('#tree'), listener);
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
      });
  });

