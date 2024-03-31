let canvas = document.querySelector('canvas');
let input = document.querySelector('#base64');

fetch('./sketch.sketch')
  .then((res) => {
    return res.arrayBuffer();
  })
  .then((buff) => {
    editor
      .openAndConvertSketchBuffer(buff)
      .then(json => {
        const dpi = 2;
        const $canvasC = document.querySelector('#canvasC');
        const { clientWidth, clientHeight } = $canvasC;
        const canvas = document.createElement('canvas');
        canvas.width = clientWidth * dpi;
        canvas.height = clientHeight * dpi;
        $canvasC.appendChild(canvas);
        const root = window.root = editor.parse(json, canvas, dpi);
        root.setPageIndex(json.currentPageIndex || 0);
        const listener = editor.control.initCanvasControl(root, $canvasC);
        editor.control.initTreeList(root, document.querySelector('#tree'), listener);
      });
  });

