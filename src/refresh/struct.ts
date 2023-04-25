import Node from '../node/Node';
import Root from '../node/Root';
import ArtBoard from '../node/ArtBoard';
import { RefreshLevel } from './level';
import { bindTexture, createTexture, drawMask, drawTextureCache } from '../gl/webgl';
import { assignMatrix, calPoint, inverse, isE, multiply, toE } from '../math/matrix';
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
  next: number; // mask使用影响后续的节点数
};

type Merge = {
  i: number;
  lv: number;
  total: number;
  node: Node;
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
      if (maskMode && node.next || opacity > 0 && opacity < 1 && total) {
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
  if (mergeList.length) {
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
      if (maskMode && node.next && node.textureTarget) {
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
    const { node, lv, total, next } = structs[i];
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
    }
    // lv变大说明是子节点，如果仍有缓存，要判断子节点是否更新，已经没缓存就不用了
    else if (lv > lastLv) {
      cacheOpList.push(hasCacheOpLv);
      cacheMwList.push(hasCacheMwLv);
      if (hasCacheOpLv) {
        hasCacheOpLv = node.hasCacheOpLv;
      }
      if (hasCacheMwLv) {
        hasCacheMwLv = node.hasCacheMwLv;
      }
    }
    // lv变小说明是上层节点，不一定是直接父节点，因为可能跨层，出栈对应数量来到对应lv的数据
    else if (lv < lastLv) {
      const diff = lastLv - lv;
      cacheOpList.splice(-diff);
      hasCacheOpLv = cacheOpList[lv - 1];
      cacheMwList.splice(-diff);
      hasCacheMwLv = cacheMwList[lv - 1];
      // 还需考虑本层
      if (hasCacheOpLv) {
        hasCacheOpLv = node.hasCacheOpLv;
      }
      if (hasCacheMwLv) {
        hasCacheMwLv = node.hasCacheMwLv;
      }
    }
    // 不变是同级兄弟，只需考虑自己
    else {
      if (hasCacheOpLv) {
        hasCacheOpLv = node.hasCacheOpLv;
      }
      if (hasCacheMwLv) {
        hasCacheMwLv = node.hasCacheMwLv;
      }
    }
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
    if (target) {
      drawTextureCache(gl, W, H, cx, cy, program, [{
        opacity,
        matrix,
        cache: target,
      }], 0, 0, true);
    }
    // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    if (target && target !== node.textureCache || node.isShapeGroup) {
      i += total + next;
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

// 汇总作为局部根节点的bbox
function genBboxTotal(structs: Array<Struct>, node: Node, index: number, total: number) {
  const res = (node.textureTarget ? node.textureTarget.bbox : (node._bbox || node.bbox)).slice(0);
  toE(node.tempMatrix);
  for (let i = index + 1, len = index + total + 1; i < len; i++) {
    const { node, total } = structs[i];
    const parent = node.parent!;
    const m = multiply(parent.tempMatrix, node.matrix);
    assignMatrix(node.tempMatrix, m);
    const textureTarget = node.textureTarget;
    const b = (textureTarget && textureTarget.available)
      ? textureTarget.bbox : (node._bbox || node.bbox);
    if (b[2] - b[0] && b[3] - b[1]) {
      mergeBbox(res, transformBbox(b, m));
    }
    if (textureTarget !== node.textureCache) {
      i += total;
    }
  }
  return res;
}

function transformBbox(bbox: Float64Array, matrix: Float64Array) {
  if (isE(matrix)) {
    return bbox.slice(0);
  }
  else {
    const [x1, y1, x2, y2] = bbox;
    const t = calPoint({ x: x1, y: y1 }, matrix);
    let xa = t.x,
      ya = t.y,
      xb = t.x,
      yb = t.y;
    const list = [x2, y1, x1, y2, x2, y2];
    for (let i = 0; i < 6; i += 2) {
      const t = calPoint({ x: list[i], y: list[i + 1] }, matrix);
      xa = Math.min(xa, t.x);
      ya = Math.min(ya, t.y);
      xb = Math.max(xb, t.x);
      yb = Math.max(yb, t.y);
    }
    return new Float64Array([xa, ya, xb, yb]);
  }
}

function mergeBbox(bbox: Float64Array, t: Float64Array) {
  bbox[0] = Math.min(bbox[0], t[0]);
  bbox[1] = Math.min(bbox[1], t[1]);
  bbox[2] = Math.max(bbox[2], t[2]);
  bbox[3] = Math.max(bbox[3], t[3]);
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
  const bbox = genBboxTotal(structs, node, index, total);
  const x = bbox[0],
    y = bbox[1],
    w = bbox[2] - x,
    h = bbox[3] - y;
  const cx = w * 0.5, cy = h * 0.5;
  const target = TextureCache.getEmptyInstance(gl, bbox);
  const frameBuffer = genFrameBufferWithTexture(gl, target.texture, w, h);
  // 和主循环很类似的，但是以此节点为根视作opacity=1和matrix=E
  for (let i = index, len = index + total + 1; i < len; i++) {
    const { node: node2, total: total2, next: next2 } = structs[i];
    const computedStyle = node.computedStyle;
    if (!computedStyle.visible || computedStyle.opacity <= 0) {
      i += total2;
      continue;
    }
    let opacity;
    // 首个节点即局部根节点
    if (i === index) {
      opacity = node2.tempOpacity = 1;
    }
    else {
      const parent = node2.parent!;
      opacity = computedStyle.opacity * parent.tempOpacity;
      node2.tempOpacity = opacity;
    }
    const target = node2.textureTarget;
    if (target) {
      drawTextureCache(gl, W, H, cx, cy, program, [{
        opacity,
        matrix: node2.tempMatrix,
        cache: target,
      }], -x, -y, false);
    }
    // 有局部子树缓存可以跳过其所有子孙节点
    if (target && target !== node2.textureCache) {
      i += total2;
      // mask特殊跳过其后面next节点，除非跳出层级或者中断mask
      if (target === node.textureMask) {
        i += next2;
      }
    }
    // 特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    else if (node2.isShapeGroup) {
      i += total2;
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
  // 可能是个单叶子节点，mask申明无效
  if (!node.next) {
    return node.textureTarget!;
  }
  const programs = root.programs;
  const program = programs.program;
  gl.useProgram(program);
  // 创建一个空白纹理来绘制，尺寸由于bbox已包含整棵子树内容可以直接使用
  const bbox = node.textureTarget!.bbox;
  const { matrix } = node;
  const x = bbox[0],
    y = bbox[1];
  const w = bbox[2] - x,
    h = bbox[3] - y;
  const cx = w * 0.5,
    cy = h * 0.5;
  const summary = createTexture(gl, 0, undefined, w, h);
  const frameBuffer = genFrameBufferWithTexture(gl, summary, w, h);
  // 作为mask节点视作E，next后的节点要除以它的matrix即点乘逆矩阵
  const im = inverse(matrix);
  // 先循环收集此节点后面的内容汇总，直到结束或者打断mask
  for (let i = index + total + 1, len = structs.length; i < len; i++) {
    const { node: node2, lv: lv2, total: total2, next: next2 } = structs[i];
    const computedStyle = node.computedStyle;
    // mask只会影响next同层级以及其子节点，跳出后实现（比如group结束）
    if (lv > lv2) {
      node.struct.next = i - index - total - 1;
      break;
    }
    else if (i === len || computedStyle.breakMask && lv === lv2) {
      node.struct.next = i - index - total + total2 + next2;
      break;
    }
    // 需要保存引用，当更改时取消mask节点的缓存重新生成
    node2.mask = node;
    let opacity, matrix;
    // 同层级的next作为特殊的局部根节点
    if (lv === lv2) {
      opacity = node2.tempOpacity = computedStyle.opacity;
      matrix = multiply(im, node2.matrix);
      assignMatrix(node2.tempMatrix, matrix);
    }
    else {
      const parent = node2.parent!;
      opacity = computedStyle.opacity * parent.tempOpacity;
      node2.tempOpacity = opacity;
      matrix = multiply(parent.tempMatrix, node2.matrix);
      assignMatrix(node2.tempMatrix, matrix);
    }
    const target = node2.textureTarget;
    if (target) {
      drawTextureCache(gl, W, H, cx, cy, program, [{
        opacity,
        matrix,
        cache: target,
      }], -x, -y, false);
    }
    // 有局部子树缓存可以跳过其所有子孙节点
    if (target && target !== node2.textureCache || node2.isShapeGroup) {
      i += total2 + next2;
    }
  }
  const target = TextureCache.getEmptyInstance(gl, bbox);
  const textureTarget = node.textureTarget!;
  const maskProgram = programs.maskProgram;
  gl.useProgram(maskProgram);
  // alpha直接应用，汇总乘以mask本身的alpha即可
  if (maskMode === MASK.ALPHA) {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    drawMask(gl, w, h, maskProgram, textureTarget.texture, summary);
  }
  // 轮廓需收集mask的轮廓并渲染出来，作为遮罩应用，再底部叠加自身非轮廓内容
  else if (maskMode === MASK.OUTLINE) {
    node.textureOutline = genOutline(gl, root, node, structs, index, total, bbox);
    const temp = TextureCache.getEmptyInstance(gl, bbox);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, temp.texture, 0);
    drawMask(gl, w, h, maskProgram, node.textureOutline!.texture, summary);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    // 将mask本身和汇总应用的mask内容绘制到一起
    gl.useProgram(program);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    toE(node.tempMatrix);
    drawTextureCache(gl, w, h, cx, cy, program, [{
      opacity: 1,
      matrix: node.tempMatrix,
      cache: textureTarget,
    }], -x, -y, false);
    drawTextureCache(gl, w, h, cx, cy, program, [{
      opacity: 1,
      matrix: node.tempMatrix,
      cache: temp,
    }], -x, -y, false);
    temp.release();
  }
  // 删除fbo恢复
  gl.deleteTexture(summary);
  releaseFrameBuffer(gl, frameBuffer, W, H);
  gl.useProgram(program);
  return target;
}

function genOutline(gl: WebGL2RenderingContext | WebGLRenderingContext, root: Root, node: Node, structs: Array<Struct>,
                    index: number, total: number, bbox: Float64Array) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureOutline && node.textureOutline.available) {
    return node.textureOutline;
  }
  const x = bbox[0],
    y = bbox[1];
  const w = bbox[2] - x,
    h = bbox[3] - y;
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
      canvasPolygon(ctx, points, -x, -y);
      ctx.closePath();
      ctx.fill(fillRule);
    }
    else if (node instanceof ShapeGroup) {
      const points = node.points!;
      points.forEach(item => {
        canvasPolygon(ctx, item, -x, -y);
        ctx.closePath();
      });
      ctx.fill(fillRule);
    }
    // 普通节点就是个矩形
    else if (node instanceof Bitmap) {
      ctx.fillRect(-x, -y, node.width, node.height);
    }
  }
  const target = TextureCache.getInstance(gl, os.canvas, bbox);
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
  gl.viewport(0, 0, width, height);
}
