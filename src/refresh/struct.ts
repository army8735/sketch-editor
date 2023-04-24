import Node from '../node/Node';
import Root from '../node/Root';
import ArtBoard from '../node/ArtBoard';
import { RefreshLevel } from './level';
import { bindTexture, createTexture, drawMask, drawTextureCache } from '../gl/webgl';
import { assignMatrix, inverse, multiply, toE } from '../math/matrix';
import inject from '../util/inject';
import { FILL_RULE, MASK } from '../style/define';
import TextureCache from './TextureCache';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';
import Bitmap from '../node/Bitmap';
import { canvasPolygon } from './paint';

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
  const { structs, width: W, height: H } = root;
  const cx = W * 0.5, cy = H * 0.5;
  const mergeList: Array<Merge> = [];
  // 第一次或者每次有重新生产的内容或布局触发内容更新，要先绘制，再寻找合并节点重新合并缓存
  if (rl >= RefreshLevel.REPAINT || rl & (RefreshLevel.CACHE | RefreshLevel.MASK)) {
    for (let i = 0, len = structs.length; i < len; i++) {
      const { node, lv, total } = structs[i];
      const { refreshLevel, computedStyle } = node;
      node.refreshLevel = RefreshLevel.NONE;
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
        }
      }
      const { maskMode, opacity } = computedStyle;
      // 非单节点透明需汇总子树，有mask的也需要
      if (maskMode || opacity > 0 && opacity < 1 && total) {
        mergeList.push({
          i,
          lv,
          total,
          node,
        });
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
        total,
        node,
      } = mergeList[j];
      // 先尝试生成此节点汇总纹理，无论是什么效果，都是对汇总后的起效，单个节点的绘制等于本身纹理缓存
      node.textureTotal = node.textureTarget
        = genTotal(gl, root, node, structs, i, lv, total, W, H);
      // 生成mask
      const computedStyle = node.computedStyle;
      const { maskMode } = computedStyle;
      if (maskMode && node.textureTotal && node.textureTotal.available) {
        node.textureMask = node.textureTarget
          = genMask(gl, root, node, maskMode, structs, i, lv, total, W, H);
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
  // 一般都存在，除非root改逻辑在只有自己的时候进行渲染
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
    if (!computedStyle.visible || computedStyle.opacity <= 0) {
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
    const target = node.textureTarget;
    if (target && target.available) {
      drawTextureCache(gl, W, H, cx, cy, program, [{
        bbox: node._bbox || node.bbox,
        opacity,
        matrix,
        cache: target,
      }], true);
    }
    // 有局部子树缓存可以跳过其所有子孙节点
    if (target && target !== node.textureCache) {
      i += total;
      // mask特殊跳过其后面next节点，除非跳出层级或者中断mask
      if (target === node.textureMask) {
        for (let j = i + 1; j < len; j++) {
          const { node, lv: lv2 } = structs[j];
          if (lv > lv2 || node.computedStyle.breakMask && lv === lv2) {
            i = j - 1;
            break;
          }
        }
      }
    }
    // 特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    else if (node.isShapeGroup) {
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
                  index: number, lv: number, total: number, W: number, H: number) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureTotal && node.textureTotal.available) {
    return node.textureTotal!;
  }
  // 单个叶子节点也不需要，就是本身节点的内容
  if (!total) {
    return node.textureCache!;
  }
  const programs = root.programs;
  const program = programs.program;
  // 创建一个空白纹理来绘制，尺寸由于bbox已包含整棵子树内容可以直接使用
  const { bbox } = node;
  const w = bbox[2] - bbox[0], h = bbox[3] - bbox[1];
  const cx = w * 0.5, cy = h * 0.5;
  const target = TextureCache.getEmptyInstance(gl, w, h);
  const frameBuffer = genFrameBufferWithTexture(gl, target.texture, w, h);
  // 和主循环很类似的，但是以此节点为根视作opacity=1和matrix=E
  for (let i = index, len = index + total + 1; i < len; i++) {
    const { node, total } = structs[i];
    const computedStyle = node.computedStyle;
    if (!computedStyle.visible || computedStyle.opacity <= 0) {
      i += total;
      continue;
    }
    let opacity, matrix;
    // 首个节点即局部根节点
    if (i === index) {
      opacity = node.tempOpacity = 1;
      matrix = toE(node.tempMatrix);
    }
    else {
      const parent = node.parent!;
      opacity = computedStyle.opacity * parent.tempOpacity;
      node.tempOpacity = opacity;
      matrix = multiply(parent.tempMatrix, node.matrix);
      assignMatrix(node.tempMatrix, matrix);
    }
    const target = node.textureTarget;
    if (target && target.available) {
      drawTextureCache(gl, W, H, cx, cy, program, [{
        bbox: node._bbox || node.bbox,
        opacity,
        matrix,
        cache: target,
      }], false);
    }
    // 有局部子树缓存可以跳过其所有子孙节点
    if (target && target !== node.textureCache) {
      i += total;
    }
    // 特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    else if (node.isShapeGroup) {
      i += total;
    }
  }
  // 删除fbo恢复
  releaseFrameBuffer(gl, frameBuffer, W, H);
  return target;
}

function genMask(gl: WebGL2RenderingContext | WebGLRenderingContext, root: Root, node: Node, maskMode: MASK,
                 structs: Array<Struct>, index: number, lv: number, total: number, W: number, H: number) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureMask && node.textureMask.available) {
    return node.textureMask!;
  }
  const programs = root.programs;
  const program = programs.program;
  // 创建一个空白纹理来绘制，尺寸由于bbox已包含整棵子树内容可以直接使用
  const { bbox, matrix } = node;
  const w = bbox[2] - bbox[0], h = bbox[3] - bbox[1];
  const cx = w * 0.5, cy = h * 0.5;
  const summary = createTexture(gl, 0, undefined, w, h);
  const frameBuffer = genFrameBufferWithTexture(gl, summary, w, h);
  // 作为mask节点视作E，next后的节点要除以它的matrix即点乘逆矩阵
  const im = inverse(matrix);
  // 先循环收集此节点后面的内容汇总，直到结束或者打断mask
  for (let i = index, len = structs.length; i < len; i++) {
    const { node, lv: lv2, total } = structs[i];
    const computedStyle = node.computedStyle;
    // mask只会影响next同层级以及其子节点，跳出后实现（比如group结束）
    if (lv > lv2 || computedStyle.breakMask && lv === lv2) {
      break;
    }
    let opacity, matrix;
    // 同层级的next作为特殊的局部根节点
    if (lv === lv2) {
      opacity = node.tempOpacity = computedStyle.opacity;
      matrix = multiply(im, node.matrix);
      assignMatrix(node.tempMatrix, matrix);
    }
    else {
      const parent = node.parent!;
      opacity = computedStyle.opacity * parent.tempOpacity;
      node.tempOpacity = opacity;
      matrix = multiply(parent.tempMatrix, node.matrix);
      assignMatrix(node.tempMatrix, matrix);
    }
    const target = node.textureTarget;
    // 轮廓mask特殊包含自身
    if (target && target.available && (i > index || maskMode === MASK.OUTLINE)) {
      drawTextureCache(gl, W, H, cx, cy, program, [{
        bbox: node._bbox || node.bbox,
        opacity,
        matrix,
        cache: target,
      }], false);
    }
    // 有局部子树缓存可以跳过其所有子孙节点
    if (target && target !== node.textureCache) {
      i += total;
      // mask特殊跳过其后面next节点，除非跳出层级或者中断mask
      if (target === node.textureMask) {
        for (let j = i + 1; j < len; j++) {
          const { node, lv: lv2 } = structs[j];
          if (lv > lv2 || node.computedStyle.breakMask && lv === lv2) {
            i = j - 1;
            break;
          }
        }
      }
    }
    // 特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    else if (node.isShapeGroup) {
      i += total;
    }
  }
  const target = TextureCache.getEmptyInstance(gl, w, h);
  const maskProgram = programs.maskProgram;
  gl.useProgram(maskProgram);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
  // alpha直接应用，汇总乘以mask本身的alpha即可
  if (maskMode === MASK.ALPHA) {
    drawMask(gl, w, h, maskProgram, node.textureTarget!.texture, summary);
  }
  // 轮廓需收集mask的轮廓并渲染出来，作为遮罩应用
  else if (maskMode === MASK.OUTLINE) {
    node.textureOutline = genOutline(gl, root, node, structs, index, lv, total, w, h);
    drawMask(gl, w, h, maskProgram, node.textureOutline!.texture, summary);
  }
  // 删除fbo恢复
  gl.deleteTexture(summary);
  releaseFrameBuffer(gl, frameBuffer, W, H);
  gl.useProgram(program);
  return target;
}

function genOutline(gl: WebGL2RenderingContext | WebGLRenderingContext, root: Root, node: Node, structs: Array<Struct>,
                    index: number, lv: number, total: number, w: number, h: number) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureOutline && node.textureOutline.available) {
    return node.textureOutline;
  }
  const os = inject.getOffscreenCanvas(w, h, 'maskOutline');
  const ctx = os.ctx;
  ctx.fillStyle = '#FFF';
  // 这里循环收集这个作为轮廓mask的节点的所有轮廓，用普通canvas模式填充白色到内容区域
  for (let i = index, len = index + total + 1; i < len; i++) {
    const { node } = structs[i];
    let matrix;
    if (i === index) {
      matrix = toE(node.tempMatrix);
    }
    else {
      const parent = node.parent!;
      matrix = multiply(parent.tempMatrix, node.matrix);
      assignMatrix(node.tempMatrix, matrix);
    }
    const fillRule = node.computedStyle.fillRule === FILL_RULE.EVEN_ODD ? 'evenodd' : 'nonzero';
    ctx.setTransform(matrix[0], matrix[1], matrix[4], matrix[5], matrix[12], matrix[13]);
    // 矢量很特殊
    if (node instanceof Polyline) {
      const points = node.points!;
      canvasPolygon(ctx, points, 0, 0);
      ctx.closePath();
      ctx.fill(fillRule);
    }
    else if (node instanceof ShapeGroup) {
      const points = node.points!;
      points.forEach(item => {
        canvasPolygon(ctx, item, 0, 0);
        ctx.closePath();
      });
      ctx.fill(fillRule);
    }
    // 普通节点就是个矩形
    else if (node instanceof Bitmap) {
      ctx.fillRect(0, 0, node.width, node.height);
    }
  }
  const target = TextureCache.getInstance(gl, os.canvas);
  os.release();
  return target;
}

function genFrameBufferWithTexture(gl: WebGL2RenderingContext | WebGLRenderingContext, texture: WebGLTexture,
                                   width: number, height: number) {
  const frameBuffer = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, width, height);
  return frameBuffer;
}

function releaseFrameBuffer(gl: WebGL2RenderingContext | WebGLRenderingContext, frameBuffer: WebGLFramebuffer,
                            width: number, height: number) {
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(frameBuffer);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.viewport(0, 0, width, height);
}
