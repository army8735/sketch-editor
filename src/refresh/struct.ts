import Node from '../node/Node';
import Root from '../node/Root';
import { RefreshLevel } from './level';
import { bindTexture, createTexture, drawTextureCache } from '../gl/webgl';
import { assignMatrix, multiply } from '../math/matrix';
import ArtBoard from '../node/ArtBoard';
import inject from '../util/inject';

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
            node.renderCanvas();
            node.genTexture(gl);
          }
        }
      }
    }
  }
  const programs = root.programs;
  // 先渲染artBoard的背景色
  const page = root.lastPage;
  if (page) {
    const children = page.children, len = children.length;
    // 背景色分开来
    for (let i = 0; i < len; i++) {
      const artBoard = children[i];
      if (artBoard instanceof ArtBoard) {
        artBoard.renderBgc(gl, cx, cy);
      }
    }
  }
  const program = programs.program;
  gl.useProgram(programs.program);
  // 循环收集数据，同一个纹理内的一次性给出，只1次DrawCall
  for(let i = 0, len = structs.length; i < len; i++) {
    const { node, total } = structs[i];
    const computedStyle = node.computedStyle;
    if (!computedStyle.visible) {
      i += total;
      continue;
    }
    // 继承父的opacity和matrix TODO 优化路径缓存
    let opacity = computedStyle.opacity;
    let matrix = node.matrix;
    const parent = node.parent;
    if (parent) {
      const op = parent.opacity, mw = parent._matrixWorld;
      if (op !== 1) {
        opacity *= op;
      }
      matrix = multiply(mw, matrix);
    }
    node._opacity = opacity;
    assignMatrix(node._matrixWorld, matrix);
    // 一般只有一个纹理
    const textureCache = node.textureCache;
    if (textureCache && textureCache.available && opacity > 0) {
      drawTextureCache(gl, cx, cy, program, [{
        node,
        opacity,
        matrix,
        cache: textureCache,
      }], 1);
    }
  }
  // 再覆盖渲染artBoard的阴影和标题
  if (page) {
    const children = page.children, len = children.length;
    // boxShadow用统一纹理
    if (ArtBoard.BOX_SHADOW_TEXTURE) {
      let count = 0;
      for (let i = 0; i < len; i++) {
        const artBoard = children[i];
        if (artBoard instanceof ArtBoard) {
          count++;
        }
      }
      const bsPoint = new Float32Array(count * 96);
      const bsTex = new Float32Array(count * 96);
      let count2 = 0;
      for (let i = 0; i < len; i++) {
        const artBoard = children[i];
        if (artBoard instanceof ArtBoard) {
          artBoard.collectBsData(count2++, bsPoint, bsTex, cx, cy);
        }
      }
      const simpleProgram = programs.simpleProgram;
      gl.useProgram(simpleProgram);
      // 顶点buffer
      const pointBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, bsPoint, gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(simpleProgram, 'a_position');
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_position);
      // 纹理buffer
      const texBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, bsTex, gl.STATIC_DRAW);
      let a_texCoords = gl.getAttribLocation(simpleProgram, 'a_texCoords');
      gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_texCoords);
      // 纹理单元
      let u_texture = gl.getUniformLocation(simpleProgram, 'u_texture');
      gl.uniform1i(u_texture, 0);
      bindTexture(gl, ArtBoard.BOX_SHADOW_TEXTURE, 0);
      // 渲染并销毁
      gl.drawArrays(gl.TRIANGLES, 0, count * 48);
      gl.deleteBuffer(pointBuffer);
      gl.deleteBuffer(texBuffer);
      gl.disableVertexAttribArray(a_position);
      gl.disableVertexAttribArray(a_texCoords);
    }
    else {
      const img = inject.IMG[ArtBoard.BOX_SHADOW];
      // 一般不可能有缓存，太特殊的base64了
      if (img) {
        ArtBoard.BOX_SHADOW_TEXTURE = createTexture(gl, 0, img);
        root.addUpdate(root, [], RefreshLevel.CACHE, false, false, undefined)
      }
      else {
        inject.measureImg(ArtBoard.BOX_SHADOW, (res: any) => {
          ArtBoard.BOX_SHADOW_TEXTURE = createTexture(gl, 0, res.source);
          root.addUpdate(root, [], RefreshLevel.CACHE, false, false, undefined)
        });
      }
    }
    // 一般都存在，除非root改逻辑在只有自己的时候进行渲染，overlay更新实际上是下一帧了
    const overlay = root.overlay;
    if (overlay) {
      overlay.update();
    }
  }
}
