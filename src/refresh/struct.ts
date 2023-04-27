import Node from '../node/Node';
import Root from '../node/Root';
import ArtBoard from '../node/ArtBoard';
import { RefreshLevel } from './level';
import { bindTexture, createTexture, drawMask, drawTextureCache } from '../gl/webgl';
import { assignMatrix, calPoint, calRectPoint, inverse, isE, multiply, multiplyScale, toE } from '../math/matrix';
import inject from '../util/inject';
import { FILL_RULE, MASK } from '../style/define';
import TextureCache from './TextureCache';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';
import Bitmap from '../node/Bitmap';
import { canvasPolygon } from './paint';
import { isRectsOverlap } from '../math/geom';
import config from './config';

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
  // 由于没有scale变换，所有节点都是通用的，最小为1，然后2的幂次方递增
  let scale = root.getCurPageZoom(), scaleIndex = 0;
  if (scale < 1.2) {
    scale = 1;
  }
  else {
    let n = 2;
    scaleIndex = 1;
    while (n < scale) {
      n = n << 1;
      scaleIndex++;
    }
    if (n > 2) {
      const m = (n >> 1) * 1.2;
      // 看0.5n和n之间scale更靠近哪一方（0.5n*1.2分界线），就用那个放大数
      if (scale >= m) {
        scale = n;
      }
      else {
        scale = n >> 1;
        scaleIndex--;
      }
    }
    else {
      scale = n;
    }
  }
  const { structs, width: W, height: H } = root;
  const cx = W * 0.5, cy = H * 0.5;
  const mergeList: Array<Merge> = [], mergeIndex: Array<boolean> = [];
  // 先计算内容matrix等，如果有需要merge合并汇总的记录下来
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
        node.calContent();
        node.textureTarget[scaleIndex] = undefined;
      }
    }
    const { maskMode, opacity } = computedStyle;
    // 非单节点透明需汇总子树，有mask的也需要
    const shouldTotal = opacity > 0 && opacity < 1 && total > 0;
    const needTotal = shouldTotal
      && (!node.textureTotal[scaleIndex] || !node.textureTotal[scaleIndex]!.available);
    const shouldMask = maskMode > 0 && !!node.next;
    const needMask = shouldMask
      && (!node.textureMask[scaleIndex] || !node.textureMask[scaleIndex]?.available);
    // 应该生成汇总和需要生成汇总有区别，可能在可视范围外，虽然应该但不需要，对于遍历可以优化跳过
    if (shouldTotal || shouldMask) {
      mergeIndex[i] = true;
      if (needTotal || needMask) {
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
      node.textureTotal[scaleIndex] = node.textureTarget[scaleIndex]
        = genTotal(gl, root, node, structs, i, lv, total, W, H, scale, scaleIndex);
      // 生成mask
      const computedStyle = node.computedStyle;
      const { maskMode } = computedStyle;
      if (maskMode && node.next && node.textureTarget[scaleIndex]) {
        node.textureMask[scaleIndex] = node.textureTarget[scaleIndex]
          = genMask(gl, root, node, maskMode, structs, i, lv, total, W, H, scale, scaleIndex);
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
  const overlay = root.overlay!;
  let isOverlay = false;
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
      isOverlay = true;
    }
    const computedStyle = node.computedStyle;
    if (!computedStyle.visible && !computedStyle.maskMode || computedStyle.opacity <= 0) {
      i += total + next;
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
    const { parent, textureTarget } = node;
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
    // overlay上的没有高清要忽略
    if (isOverlay) {
      let target = textureTarget[0];
      if (target) {
        const isInScreen = checkInScreen(target.bbox, matrix, W, H);
        if (isInScreen) {
          drawTextureCache(gl, W, H, cx, cy, program, [{
            opacity,
            matrix,
            cache: target,
          }], 0, 0, true);
        }
      }
    }
    // 真正的Page内容有高清考虑
    else {
      let target = textureTarget[scaleIndex],
        isInScreen = false;
      // 有merge的直接判断是否在可视范围内，合成结果在merge中做了，可能超出范围不合成
      if (mergeIndex[i] || target) {
        if (target) {
          isInScreen = checkInScreen(target.bbox, matrix, W, H);
        }
      }
      // 无merge的是单个节点，判断是否有内容以及是否在可视范围内
      else {
        if (node.hasContent) {
          isInScreen = checkInScreen(node._bbox || node.bbox, matrix, W, H);
          if (isInScreen) {
            node.genTexture(gl, scale, scaleIndex);
            target = textureTarget[scaleIndex];
          }
        }
      }
      if (isInScreen && target) {
        drawTextureCache(gl, W, H, cx, cy, program, [{
          opacity,
          matrix,
          cache: target,
        }], 0, 0, true);
      }
      // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
      if (target && target !== node.textureCache[scaleIndex] || node.isShapeGroup) {
        i += total + next;
      }
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
      gl.useProgram(program);
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
          root.addUpdate(overlay, [], RefreshLevel.REPAINT, false, false, undefined)
        });
      }
    }
  }
}

// 汇总作为局部根节点的bbox
function genBboxTotal(structs: Array<Struct>, node: Node, index: number, total: number, scaleIndex: number) {
  const res = (node.textureTarget[scaleIndex]?.bbox || node._bbox || node.bbox).slice(0);
  toE(node.tempMatrix);
  for (let i = index + 1, len = index + total + 1; i < len; i++) {
    const { node: node2, total: total2, next: next2 } = structs[i];
    const parent = node2.parent!;
    const m = multiply(parent.tempMatrix, node2.matrix);
    assignMatrix(node2.tempMatrix, m);
    const target = node2.textureTarget[scaleIndex];
    const b = target?.bbox || node2._bbox || node2.bbox;
    if (b[2] - b[0] && b[3] - b[1]) {
      mergeBbox(res, transformBbox(b, m));
    }
    if (target !== node2.textureCache[scaleIndex] || node2.isShapeGroup) {
      i += total2 + next2;
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
                  index: number, lv: number, total: number, W: number, H: number, scale: number, scaleIndex: number) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureTotal[scaleIndex]?.available) {
    return node.textureTotal[scaleIndex];
  }
  // 先检查范围内，因为可能还没有真实渲染生成内容
  const bbox = genBboxTotal(structs, node, index, total, scaleIndex);
  if (!checkInScreen(bbox, node.matrixWorld, W, H)) {
    return;
  }
  // 单个叶子节点也不需要，就是本身节点的内容
  if (!total) {
    let target = node.textureCache[scaleIndex];
    if (!target && node.hasContent) {
      node.genTexture(gl, scale, scaleIndex);
      target = node.textureCache[scaleIndex];
    }
    return target;
  }
  const programs = root.programs;
  const program = programs.program;
  // 创建一个空白纹理来绘制，尺寸由于bbox已包含整棵子树内容可以直接使用
  const x = bbox[0],
    y = bbox[1];
  let w = bbox[2] - x,
    h = bbox[3] - y;
  while (w * scale > config.MAX_TEXTURE_SIZE || h * scale > config.MAX_TEXTURE_SIZE) {
    if (scale <= 1) {
      break;
    }
    scale = scale >> 1;
  }
  if (w * scale > config.MAX_TEXTURE_SIZE || h * scale > config.MAX_TEXTURE_SIZE) {
    return;
  }
  const dx = -x * scale, dy = -y * scale;
  w *= scale;
  h *= scale;
  const cx = w * 0.5, cy = h * 0.5;
  const target = TextureCache.getEmptyInstance(gl, bbox, scale);
  const frameBuffer = genFrameBufferWithTexture(gl, target.texture, w, h);
  // 和主循环很类似的，但是以此节点为根视作opacity=1和matrix=E
  for (let i = index, len = index + total + 1; i < len; i++) {
    const { node: node2, total: total2, next: next2 } = structs[i];
    const computedStyle = node.computedStyle;
    if (!computedStyle.visible && !computedStyle.maskMode || computedStyle.opacity <= 0) {
      i += total2 + next2;
      continue;
    }
    let opacity, matrix;
    // 首个节点即局部根节点
    if (i === index) {
      opacity = node2.tempOpacity = 1;
      matrix = multiplyScale(node2.tempMatrix, scale); // 求bbox时已经是E了
    }
    else {
      const parent = node2.parent!;
      opacity = computedStyle.opacity * parent.tempOpacity;
      node2.tempOpacity = opacity;
      matrix = multiply(parent.tempMatrix, node2.matrix);
      assignMatrix(node2.tempMatrix, matrix);
    }
    let target2 = node2.textureTarget[scaleIndex];
    // 可能没生成，存在于一开始在可视范围外的节点情况，且当时也没有进行合成
    if (!target2 && node2.hasContent) {
      node2.genTexture(gl, scale, scaleIndex);
      target2 = node2.textureTarget[scaleIndex];
    }
    if (target2) {
      drawTextureCache(gl, W, H, cx, cy, program, [{
        opacity,
        matrix: node2.tempMatrix,
        cache: target2,
      }], dx, dy, false);
    }
    // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    if (target2 && target2 !== node2.textureCache[scaleIndex] || node2.isShapeGroup) {
      i += total2 + next2;
    }
  }
  // 删除fbo恢复
  releaseFrameBuffer(gl, frameBuffer, W, H);
  return target;
}

function genMask(gl: WebGL2RenderingContext | WebGLRenderingContext, root: Root, node: Node, maskMode: MASK,
                 structs: Array<Struct>, index: number, lv: number, total: number, W: number, H: number,
                 scale: number, scaleIndex: number) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureMask[scaleIndex]?.available) {
    return node.textureMask[scaleIndex];
  }
  // 可能是个单叶子节点，mask申明无效；或者因为可视范围外还未生成汇总total
  if (!node.next || !node.textureTarget[scaleIndex]) {
    return node.textureTarget[scaleIndex];
  }
  const textureTarget = node.textureTarget[scaleIndex]!;
  const programs = root.programs;
  const program = programs.program;
  gl.useProgram(program);
  // 创建一个空白纹理来绘制，尺寸由于bbox已包含整棵子树内容可以直接使用
  const bbox = textureTarget.bbox;
  const { matrix, computedStyle } = node;
  const x = bbox[0],
    y = bbox[1];
  let w = bbox[2] - x,
    h = bbox[3] - y;
  while (w * scale > config.MAX_TEXTURE_SIZE || h * scale > config.MAX_TEXTURE_SIZE) {
    if (scale <= 1) {
      break;
    }
    scale = scale >> 1;
  }
  if (w * scale > config.MAX_TEXTURE_SIZE || h * scale > config.MAX_TEXTURE_SIZE) {
    return;
  }
  const dx = -x * scale, dy = -y * scale;
  w *= scale;
  h *= scale;
  const cx = w * 0.5,
    cy = h * 0.5;
  const summary = createTexture(gl, 0, undefined, w, h);
  const frameBuffer = genFrameBufferWithTexture(gl, summary, w, h);
  // 作为mask节点视作E，next后的节点要除以它的matrix即点乘逆矩阵
  const im = inverse(matrix);
  multiplyScale(im, scale);
  // 先循环收集此节点后面的内容汇总，直到结束或者打断mask
  for (let i = index + total + 1, len = structs.length; i < len; i++) {
    const { node: node2, lv: lv2, total: total2, next: next2 } = structs[i];
    const computedStyle = node2.computedStyle;
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
    let target2 = node2.textureTarget[scaleIndex];
    // 可能没生成，存在于一开始在可视范围外的节点情况，且当时也没有进行合成
    if (!target2 && node2.hasContent) {
      node2.genTexture(gl, scale, scaleIndex);
      target2 = node2.textureTarget[scaleIndex];
    }
    if (target2) {
      drawTextureCache(gl, W, H, cx, cy, program, [{
        opacity,
        matrix,
        cache: target2,
      }], dx, dy, false);
    }
    // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    if (target2 && target2 !== node2.textureCache[scaleIndex] || node2.isShapeGroup) {
      i += total2 + next2;
    }
  }
  const target = TextureCache.getEmptyInstance(gl, bbox, scale);
  const maskProgram = programs.maskProgram;
  gl.useProgram(maskProgram);
  // alpha直接应用，汇总乘以mask本身的alpha即可
  if (maskMode === MASK.ALPHA) {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    drawMask(gl, w, h, maskProgram, textureTarget.texture, summary);
  }
  // 轮廓需收集mask的轮廓并渲染出来，作为遮罩应用，再底部叠加自身非轮廓内容
  else if (maskMode === MASK.OUTLINE) {
    node.textureOutline = genOutline(gl, root, node, structs, index, total, bbox, scale);
    const temp = TextureCache.getEmptyInstance(gl, bbox, scale);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, temp.texture, 0);
    drawMask(gl, w, h, maskProgram, node.textureOutline!.texture, summary);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    // 将mask本身和汇总应用的mask内容绘制到一起
    gl.useProgram(program);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    toE(node.tempMatrix);
    multiplyScale(node.tempMatrix, scale);
    // mask本身可能不可见
    if (computedStyle.visible && computedStyle.opacity > 0) {
      drawTextureCache(gl, w, h, cx, cy, program, [{
        opacity: 1,
        matrix: node.tempMatrix,
        cache: textureTarget,
      }], dx, dy, false);
    }
    drawTextureCache(gl, w, h, cx, cy, program, [{
      opacity: 1,
      matrix: node.tempMatrix,
      cache: temp,
    }], dx, dy, false);
    temp.release();
  }
  // 删除fbo恢复
  gl.deleteTexture(summary);
  releaseFrameBuffer(gl, frameBuffer, W, H);
  gl.useProgram(program);
  return target;
}

function genOutline(gl: WebGL2RenderingContext | WebGLRenderingContext, root: Root, node: Node, structs: Array<Struct>,
                    index: number, total: number, bbox: Float64Array, scale: number) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureOutline?.available) {
    return node.textureOutline;
  }
  const x = bbox[0],
    y = bbox[1];
  const w = bbox[2] - x,
    h = bbox[3] - y;
  while (w * scale > config.MAX_TEXTURE_SIZE || h * scale > config.MAX_TEXTURE_SIZE) {
    if (scale <= 1) {
      break;
    }
    scale = scale >> 1;
  }
  if (w * scale > config.MAX_TEXTURE_SIZE || h * scale > config.MAX_TEXTURE_SIZE) {
    return;
  }
  const dx = -x * scale, dy = -y * scale;
  const os = inject.getOffscreenCanvas(w * scale, h * scale, 'maskOutline');
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
      canvasPolygon(ctx, points, scale, dx, dy);
      ctx.closePath();
      ctx.fill(fillRule);
    }
    else if (node instanceof ShapeGroup) {
      const points = node.points!;
      points.forEach(item => {
        canvasPolygon(ctx, item, scale, dx, dy);
        ctx.closePath();
      });
      ctx.fill(fillRule);
    }
    // 普通节点就是个矩形
    else if (node instanceof Bitmap) {
      ctx.fillRect(dx, dy, node.width * scale, node.height * scale);
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

function checkInScreen(bbox: Float64Array, matrix: Float64Array, width: number, height: number) {
  const t = calRectPoint(bbox[0], bbox[1], bbox[2], bbox[3], matrix);
  const { x1, y1, x2, y2, x3, y3, x4, y4 } = t;
  // 不在画布显示范围内忽略，用比较简单的方法，无需太过精确，提高性能
  const xa = Math.min(x1, x2, x3, x4);
  const ya = Math.min(y1, y2, y3, y4);
  const xb = Math.max(x1, x2, x3, x4);
  const yb = Math.max(y1, y2, y3, y4);
  return isRectsOverlap(xa, ya, xb, yb, 0, 0, width, height, true);
}
