import Node from '../node/Node';
import Root from '../node/Root';
import { RefreshLevel } from './level';
import Bitmap from '../node/Bitmap';
import ImgCanvasCache from './ImgCanvasCache';
import { StyleKey } from '../style';
import { drawTextureCache } from '../gl/webgl';
import { assignMatrix, multiply } from '../math/matrix';

export type Struct = {
  node: Node;
  num: number;
  total: number;
  lv: number;
};

export function renderWebgl(gl: WebGL2RenderingContext | WebGLRenderingContext,
                            root: Root, rl: RefreshLevel) {
  const { structs, width, height } = root;
  const cx = width * 0.5, cy = height * 0.5;
  // 第一次或者每次有重新生产的内容或布局触发内容更新，要先绘制，再寻找合并节点重新合并缓存
  if (rl >= RefreshLevel.REPAINT) {
    for(let i = 0, len = structs.length; i < len; i++) {
      const { node } = structs[i];
      const { refreshLevel } = node;
      node.refreshLevel = RefreshLevel.NONE;
      // 无任何变化即refreshLevel为NONE（0）忽略
      if(refreshLevel) {
        // filter之类的变更
        if(refreshLevel < RefreshLevel.REPAINT) {}
        else {
          const hasContent = node.calContent();
          // 有内容先以canvas模式绘制到离屏画布上
          if (hasContent) {
            if (node instanceof Bitmap) {
              const loader = node.loader;
              // 肯定有source，因为hasContent预防过，这里判断特殊的纯位图，要共享源节省内存
              if (loader.onlyImg) {
                const canvasCache = node.canvasCache = ImgCanvasCache.getInstance(loader.width, loader.height, -node.x, -node.y, node.src!);
                // 第一张图像才绘制，图片解码到canvas上
                if (canvasCache.count === 1) {
                  canvasCache.offscreen.ctx.drawImage(loader.source!, 0, 0);
                }
                node.genTexture(gl);
              }
            }
          }
        }
      }
    }
  }
  // 循环收集数据，同一个纹理内的一次性给出，只1次DrawCall
  const programs = root.programs;
  for(let i = 0, len = structs.length; i < len; i++) {
    const { node, total } = structs[i];
    const computedStyle = node.computedStyle;
    if (!computedStyle[StyleKey.VISIBLE]) {
      i += total;
      continue;
    }
    // 继承父的opacity和matrix
    let opacity = computedStyle[StyleKey.OPACITY];
    let matrix = node.matrix;
    const parent = node.parent;
    if (parent) {
      const op = parent.opacity, mw = parent.matrixWorld;
      if (op !== 1) {
        opacity *= op;
      }
      matrix = multiply(mw, matrix);
    }
    node.opacity = opacity;
    assignMatrix(node.matrixWorld, matrix);
    // 一般只有一个纹理
    const textureCache = node.textureCache;
    if (textureCache && opacity > 0) {
      drawTextureCache(gl, cx, cy, programs, [{
        node,
        opacity,
        matrix,
        cache: textureCache,
      }], 1);
    }
  }
}
