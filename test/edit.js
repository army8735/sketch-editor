let canvas = document.querySelector('canvas');
let input = document.querySelector('#base64');
sketchEditor.ca.preserveDrawingBuffer = true;

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
        const root = window.root = sketchEditor.parse(json, canvas, dpi);
        const listener = sketchEditor.control.initCanvasControl(root, $canvasC);
        sketchEditor.control.initTreeList(root, document.querySelector('#tree'), listener);
        sketchEditor.control.initPanel(root, document.querySelector('#side'), listener);
        let count = 0;
        $canvasC.addEventListener('mousedown', (e) => {
          if (e.button === 1) {
            e.preventDefault();
            input.value = (count++) + ',' + canvas.toDataURL();
          }
          else if (e.button === 2) {
            e.preventDefault();
            let node = root.getCurPage().children[0];
            if (node instanceof sketchEditor.node.Container) {
              node = node.children[0];
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
        });
      });
  });

