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
        const { clientWidth, clientHeight } = canvas;
        const root = editor.parse(json, canvas, dpi);
        root.setPageIndex(json.currentPageIndex || 0);
        root.on(editor.node.Root.REFRESH_COMPLETE, () => {
          input.value = canvas.toDataURL();
        });
      });
  });

