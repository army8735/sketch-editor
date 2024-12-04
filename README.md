# sketch-editor
A sketch Render&Editor on Canvas/WebGL.

[![NPM version](https://img.shields.io/npm/v/sketch-editor.svg)](https://npmjs.org/package/sketch-editor)
![CI](https://github.com/army8735/sketch-editor/workflows/CI/badge.svg)

## Install
```shell
npm install sketch-editor
```

## Usage
如果文档有pdf图片，需要前置引入`pdfjs-dist`库，也可以使用cdn文件：
```html
<script src="https://gw.alipayobjects.com/os/lib/pdfjs-dist/3.11.174/build/pdf.min.js"></script>
```
如果需要颜色选择器功能，需要前置引入`vanilla-picker`库，也可以使用cdn文件：
```html
<script src="https://gw.alipayobjects.com/os/lib/vanilla-picker/2.12.3/dist/vanilla-picker.min.js"></script>
```
拿到sketch文件的ArrayBuffer后：
```tsx
import sketchEditor from 'sketch-editor';

// css自行修改引入，这里是举例
import 'sketch-editor/style.css';

// 一些建议的手动配置
sketchEditor.config.tile = true; // 开启tile优化大尺寸大文件（持续改进中）

// 一些有用的前置方法
sketchEditor.style.font.registerLocalFonts(); // 异步注册本地字体

// 真正的读取渲染逻辑
sketchEditor
  .openAndConvertSketchBuffer(arrayBuffer) // 读取sketch的buffer
  // .openAndConvertPsdBuffer(arrayBuffer) // 如果是psd用这个
  .then(json => {
    const dpi = 2;
    
    // 渲染
    const $canvasC = document.querySelector('#canvas-container');
    const { clientWidth, clientHeight } = $canvasC;
    const canvas = document.createElement('canvas');
    canvas.width = clientWidth * dpi;
    canvas.height = clientHeight * dpi;
    $canvasC.appendChild(canvas);
    const root = sketchEditor.parse(json, {
      dpi,
      canvas,
    });
    
    // 可选控制，鼠标键盘基础操作
    const listener = sketchEditor.control.initCanvasControl(root, $canvasC);
    // page列表展示
    sketchEditor.control.initPageList(root, document.querySelector('#page'), listener);
    // 图层树结构展示
    sketchEditor.control.initTree(root, document.querySelector('#tree'), listener);
    // 右侧属性面板展示
    sketchEditor.control.initPanel(root, document.querySelector('#side'), listener);
    // 缩放情况展示
    sketchEditor.control.initZoom(root, document.querySelector('#zoom'), listener);
  });
```

## Dev
```shell
npm run dev
```
sketch-editor的诞生离不开 [karas](https://github.com/karasjs/karas) 开源项目。

## Demo
* demo目录下是一个web端的演示教程示例，build后可直接本地预览
* 在线预览（信任https启用本地字体库）：https://army8735.me/sketch-editor/

# License
[MIT License]
