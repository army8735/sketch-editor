let canvas = document.querySelector('canvas');
let input = document.querySelector('#base64');
sketchEditor.gl.ca.preserveDrawingBuffer = true;

let root;
const isPsd = location.href.indexOf('-psd') > -1;

fetch(isPsd ? './psd.psd' : './sketch.sketch')
  .then((res) => {
    return res.arrayBuffer();
  })
  .then((buff) => {
    const open = isPsd ? sketchEditor.openAndConvertPsdBuffer : sketchEditor.openAndConvertSketchBuffer;
    open(buff)
      .then(json => {
        const dpi = 2;
        root = window.root = sketchEditor.parse(json, {
          canvas,
          dpi,
        });
        root.on(sketchEditor.node.Root.REFRESH_COMPLETE, () => {
          input.value = canvas.toDataURL();
        });
      });
  });

