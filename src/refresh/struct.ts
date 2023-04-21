import Node from '../node/Node';
import Root from '../node/Root';
import ArtBoard from '../node/ArtBoard';
import { RefreshLevel } from './level';
import { bindTexture, createTexture, drawTextureCache } from '../gl/webgl';
import { assignMatrix, multiply } from '../math/matrix';
import inject from '../util/inject';
import { MASK } from '../style/define';
import TextureCache from './TextureCache';

export type Struct = {
  node: Node;
  num: number;
  total: number;
  lv: number;
};

type Merge = {
  i: number,
  lv: number,
  total: number,
  node: Node,
};

export function renderWebgl(gl: WebGL2RenderingContext | WebGLRenderingContext,
                            root: Root, rl: RefreshLevel) {
  const { structs, width, height } = root;
  const cx = width * 0.5, cy = height * 0.5;
  const mergeList: Array<Merge> = [];
  // 第一次或者每次有重新生产的内容或布局触发内容更新，要先绘制，再寻找合并节点重新合并缓存
  if (rl >= RefreshLevel.REPAINT) {
    let maskStart = 0, maskLv = 0;
    for (let i = 0, len = structs.length; i < len; i++) {
      const { node, lv } = structs[i];
      const { refreshLevel, computedStyle } = node;
      node.refreshLevel = RefreshLevel.NONE;
      // 检查mask结束，可能本身没有变更，或者到末尾/一个组结束自动关闭mask
      const { maskMode, breakMask } = computedStyle;
      if (maskStart && (breakMask || i === len - 1 || lv < maskLv)) {
        const s = structs[maskStart];
        mergeList.push({
          i: maskStart,
          lv: s.lv,
          total: i - maskStart - (maskMode || i === len - 1 ? 0 : 1), // 自动闭合的索引多了1个
          node: s.node,
        });
        maskStart = 0;
      }
      // 无任何变化即refreshLevel为NONE（0）忽略
      if (refreshLevel) {
        // filter之类的变更
        if (refreshLevel < RefreshLevel.REPAINT) {
        }
        else {
          const hasContent = node.calContent();
          // 有内容才渲染生成纹理
          if (hasContent) {
            node.renderCanvas();
            node.genTexture(gl);
          }
          if (maskMode) {
            maskStart = i;
            maskLv = lv;
          }
        }
      }
    }
  }
  // 根据收集的需要合并局部根的索引，尝试合并，按照层级从大到小，索引从小到大的顺序，即从叶子节点开始
  if(mergeList.length) {
    mergeList.sort(function (a, b) {
      if (a.lv === b.lv) {
        return a.i - b.i;
      }
      return b.lv - a.lv;
    });
    for (let j = 0, len = mergeList.length; j < len; j++) {
      const {
        i,
        lv,
        node,
      } = mergeList[j];
      const textureCache = node.textureCache!;
      let textureTotal = node.textureTotal;
      // 先尝试生成此节点汇总纹理，无论是什么效果，都是对汇总后的起效，单个节点的绘制等于本身纹理缓存
      if (!textureTotal || !textureTotal.available) {
        if (node.struct.total) {
          textureTotal = node.textureTotal = genTotal(gl, root, node, structs, i, lv, width, height);
        }
        else {
          textureTotal = node.textureTotal = textureCache;
        }
      }
      // 生成mask
      const computedStyle = node.computedStyle;
      const { maskMode } = computedStyle;
      if (maskMode && textureTotal) {
        genMask(gl, root, node, maskMode, textureTotal!, structs, i, lv, width, height);
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
  // 一般都存在，除非root改逻辑在只有自己的时候进行渲染，overlay更新实际上是下一帧了
  const overlay = root.overlay;
  const program = programs.program;
  gl.useProgram(programs.program);
  // 世界opacity和matrix不一定需要重算，这里记录个list，按深度lv，如果出现了无缓存，则之后的深度lv都需要重算
  const cacheOpList: Array<boolean> = [];
  const cacheMwList: Array<boolean> = [];
  let lastLv = 0, hasCacheOpLv = false, hasCacheMwLv = false;
  // 循环收集数据，同一个纹理内的一次性给出，只1次DrawCall
  for (let i = 0, len = structs.length; i < len; i++) {
    const { node, lv, total } = structs[i];
    // 特殊的工具覆盖层，如画板名称，同步更新translate直接跟着画板位置刷新
    if (overlay && overlay === node) {
      overlay.update();
    }
    const computedStyle = node.computedStyle;
    if (!computedStyle.visible) {
      i += total;
      continue;
    }
    // 第一个是Root层级0
    if (!i) {
      hasCacheOpLv = node.hasCacheOpLv;
      hasCacheMwLv = node.hasCacheMwLv;
      cacheOpList.push(hasCacheOpLv);
      cacheMwList.push(hasCacheMwLv);
    }
    // lv变大说明是子节点，如果仍有缓存，要判断子节点是否更新，已经没缓存就不用了
    else if (lv > lastLv) {
      if (hasCacheOpLv) {
        hasCacheOpLv = node.hasCacheOpLv;
      }
      cacheOpList.push(hasCacheOpLv);
      if (hasCacheMwLv) {
        hasCacheMwLv = node.hasCacheMwLv;
      }
      cacheMwList.push(hasCacheMwLv);
    }
    // lv变小说明是上层节点，不一定是直接父节点，因为可能跨层，出栈对应数量来到对应lv的数据
    else if (lv < lastLv) {
      const diff = lastLv - lv;
      cacheOpList.splice(-diff);
      hasCacheOpLv = cacheOpList[lv - 1];
      cacheMwList.splice(-diff);
      hasCacheMwLv = cacheMwList[lv - 1];
    }
    // 不变是同级兄弟，无需特殊处理 else {}
    lastLv = lv;
    // 继承父的opacity和matrix，仍然要注意root没有parent
    const parent = node.parent;
    if (!hasCacheOpLv) {
      node._opacity = parent ? parent._opacity * node.computedStyle.opacity : node.computedStyle.opacity;
      node.hasCacheOpLv = true;
    }
    if (!hasCacheMwLv) {
      assignMatrix(node._matrixWorld, parent ? multiply(parent._matrixWorld, node.matrix) : node.matrix);
      node.hasCacheMwLv = true;
    }
    const opacity = node._opacity;
    const matrix = node._matrixWorld;
    // 一般只有一个纹理
    const textureCache = node.textureCache;
    if (textureCache && textureCache.available && opacity > 0) {
      drawTextureCache(gl, width, height, cx, cy, program, [{
        node,
        opacity,
        matrix,
        cache: textureCache,
      }], 1);
    }
    // 特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    if (node.isShapeGroup) {
      i += total;
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
      // 一般首次不可能有缓存，太特殊的base64了
      if (img && img.source) {
        ArtBoard.BOX_SHADOW_TEXTURE = createTexture(gl, 0, img.source);
        root.addUpdate(root, [], RefreshLevel.CACHE, false, false, undefined)
      }
      else {
        inject.measureImg(ArtBoard.BOX_SHADOW, (res: any) => {
          ArtBoard.BOX_SHADOW_TEXTURE = createTexture(gl, 0, res.source);
          root.addUpdate(root, [], RefreshLevel.CACHE, false, false, undefined)
        });
      }
    }
  }
}

function genTotal(gl: WebGL2RenderingContext | WebGLRenderingContext, root: Root, node: Node, structs: Array<Struct>,
                  i: number, lv: number, width: number, height: number) {
  // TODO
  return node.textureCache;
}

function genMask(gl: WebGL2RenderingContext | WebGLRenderingContext, root: Root, node: Node, maskMode: MASK,
                 textureTotal: TextureCache, structs: Array<Struct>, i: number, lv: number, width: number, height: number) {
  console.log(i);
}
