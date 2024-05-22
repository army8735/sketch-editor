import gaussFrag from '../gl/gauss.frag';
import simpleVert from '../gl/simple.vert';
import {
  createTexture,
  drawColorMatrix,
  drawGauss,
  drawMask,
  drawMbm,
  drawMotion,
  drawRadial,
  drawTextureCache,
  drawTint,
  drawShadow,
  initShaders,
} from '../gl/webgl';
import { gaussianWeight, kernelSize, outerSizeByD } from '../math/blur';
import { d2r, isPolygonOverlapRect, isRectsOverlap } from '../math/geom';
import {
  assignMatrix,
  calPoint,
  calRectPoints,
  identity,
  inverse,
  isE,
  multiply,
  multiplyScale,
  toE,
} from '../math/matrix';
import Bitmap from '../node/Bitmap';
import Geom from '../node/geom/Geom';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';
import Group from '../node/Group';
import Node from '../node/Node';
import Root from '../node/Root';
import Text from '../node/Text';
import config from '../util/config';
import { canvasPolygon } from './paint';
import { color2gl } from '../style/css';
import { BLUR, ComputedBlur, ComputedShadow, ComputedStyle, FILL_RULE, MASK, MIX_BLEND_MODE, } from '../style/define';
import { calMatrixByOrigin } from '../style/transform';
import inject from '../util/inject';
import { RefreshLevel } from './level';
import { Struct } from './struct';
import TextureCache from './TextureCache';
import CanvasCache from './CanvasCache';
import { mergeBbox } from '../math/bbox';

export type Merge = {
  i: number;
  lv: number;
  total: number;
  node: Node;
  valid: boolean;
  subList: Merge[]; // 子节点在可视范围外无需merge但父节点在内需要强制子节点merge
  isNew: boolean; // 新生成的merge，老的要么有merge结果，要么可视范围外有tempBbox
  isTop: boolean; // 是否是最上层，当嵌套时子Merge不是顶层
};

export function genMerge(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  scale: number,
  scaleIndex: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  startTime: number,
) {
  const { structs, width: W, height: H } = root;
  const mergeList: Merge[] = [];
  const mergeHash: Merge[] = [];
  for (let i = 0, len = structs.length; i < len; i++) {
    const { node, lv, total, next } = structs[i];
    const { refreshLevel, computedStyle } = node;
    node.refreshLevel = RefreshLevel.NONE;
    const { textureTotal, textureFilter, textureMask } = node;
    // 无任何变化即refreshLevel为NONE（0）忽略
    if (refreshLevel) {
      // filter之类的变更
      if (refreshLevel < RefreshLevel.REPAINT) {
      }
      // repaint及以上都要重新生成内容
      else {
        node.calContent();
      }
    }
    const {
      maskMode,
      breakMask,
      opacity,
      shadow,
      shadowEnable,
      innerShadow,
      innerShadowEnable,
      blur,
      mixBlendMode,
      fill,
      fillEnable,
      hueRotate,
      saturate,
      brightness,
      contrast,
    } = computedStyle;
    // 特殊的group可以指定唯一的fill用作tint色调功能
    const isGroup = node.isGroup;
    let isGroupTint = false;
    if (isGroup) {
      if (fillEnable[0] && fill[0] && Array.isArray(fill[0])) {
        isGroupTint = true;
      }
    }
    // 非单节点透明需汇总子树，有mask的也需要，已经存在的无需汇总
    const needTotal =
      ((opacity > 0 && opacity < 1) ||
        mixBlendMode !== MIX_BLEND_MODE.NORMAL ||
        isGroupTint) &&
      total > 0 &&
      !node.isShapeGroup &&
      (!textureTotal[scaleIndex] || !textureTotal[scaleIndex]!.available);
    let needShadow = false;
    for (let i = 0, len = shadow.length; i < len; i++) {
      if (shadowEnable[i] && shadow[i].color[3] > 0) {
        needShadow = true;
        break;
      }
    }
    for (let i = 0, len = innerShadow.length; i < len; i++) {
      if (innerShadowEnable[i] && innerShadow[i].color[3] > 0) {
        needShadow = true;
        break;
      }
    }
    if (needShadow && textureFilter[scaleIndex]?.available) {
      needShadow = false;
    }
    const needBlur =
      ((blur.t === BLUR.GAUSSIAN && blur.radius >= 1) ||
        (blur.t === BLUR.BACKGROUND &&
          (blur.radius >= 1 || blur.saturation !== 1) && total) ||
        (blur.t === BLUR.RADIAL && blur.radius >= 1) ||
        (blur.t === BLUR.MOTION && blur.radius >= 1)) &&
      (!textureFilter[scaleIndex] || !textureFilter[scaleIndex]?.available);
    let needMask =
      maskMode > 0 &&
      (!textureMask[scaleIndex] || !textureMask[scaleIndex]?.available);
    // 单个的alpha蒙版不渲染，target指向空的mask纹理汇总，循环时判空跳过，outline不可见蒙版不渲染
    if (needMask) {
      if (maskMode === MASK.ALPHA && (computedStyle.opacity === 0 || !node.next || node.next.computedStyle.breakMask)) {
        needMask = false;
        node.textureTarget[scaleIndex] = undefined;
      }
      else if (maskMode === MASK.OUTLINE && (computedStyle.opacity === 0 || !node.next || node.next.computedStyle.breakMask)) {
        needMask = false;
        if (!computedStyle.visible || computedStyle.opacity === 0) {
          node.textureTarget[scaleIndex] = undefined;
        }
        else {
          node.resetTextureTarget();
        }
      }
    }
    // 兄弟连续的mask，后面的不生效，除非有breakMask
    if (needMask && !breakMask) {
      let prev = node.prev;
      while (prev) {
        if (prev.computedStyle.maskMode) {
          needMask = false;
          break;
        }
        if (prev.computedStyle.breakMask) {
          break;
        }
        prev = prev.prev;
      }
    }
    const needColor =
      hueRotate || saturate !== 1 || brightness !== 1 || contrast !== 1;
    // 记录汇总的同时以下标为k记录个类hash
    if (needTotal || needShadow || needBlur || needMask || needColor) {
      const t: Merge = {
        i,
        lv,
        total,
        node,
        valid: false,
        subList: [],
        isNew: false,
        isTop: true, // 后续遍历检查时子的置false
      };
      mergeList.push(t);
      mergeHash[i] = t;
    }
    // shapeGroup需跳过子节点，忽略子矢量的一切
    if (node instanceof ShapeGroup) {
      i += total;
    }
    if (textureTotal[scaleIndex]?.available) {
      i += total;
      if (textureMask[scaleIndex]?.available) {
        i += next;
      }
    }
  }
  if (mergeList.length) {
    // 后根顺序，即叶子节点在前，兄弟的后节点在前
    mergeList.sort(function (a, b) {
      if (a.lv === b.lv) {
        return b.i - a.i;
      }
      return b.lv - a.lv;
    });
  }
  // console.warn('mergeList', mergeList.slice(0));
  // 先循环求一遍各自merge的bbox汇总，以及是否有嵌套关系
  for (let j = 0, len = mergeList.length; j < len; j++) {
    const item = mergeList[j];
    const { i, total, node } = item;
    // 曾经求过merge汇总但因为可视范围外没展示的，且没有变更过的省略计算，但需要统计嵌套关系
    const isNew = (item.isNew = !node.tempBbox);
    node.tempBbox = genBboxTotal(
      structs,
      node,
      i,
      total,
      isNew,
      scaleIndex,
      item,
      mergeHash,
    );
  }
  // 再循环一遍，判断merge是否在可视范围内，这里只看最上层的即可，在范围内则将其及所有子merge打标valid
  for (let j = 0, len = mergeList.length; j < len; j++) {
    const item = mergeList[j];
    const { node, isTop, i, lv, total } = item;
    if (isTop) {
      if (checkInRect(node.tempBbox!, node.matrixWorld, x1, y1, x2, y2)) {
        // 检查子节点中是否有因为可视范围外暂时忽略的，全部标记valid，这个循环会把数据集中到最上层subList，后面反正不再用了
        setValid(item);
        // 如果是mask，还要看其是否影响被遮罩的merge，可能被遮罩在屏幕外面不可见
        if (node.computedStyle.maskMode !== MASK.NONE) {
          genNextCount(node, structs, i, lv, total);
          for (let k = j; k >= 0; k--) {
            const item2 = mergeList[k];
            if (item2.i > i + total + node.struct.next) {
              break;
            }
            setValid(item2);
          }
        }
      }
    }
  }
  let firstMerge = true;
  let breakMerge: Merge[] | undefined;
  const mergeRecord: Array<{ bbox: Float64Array, m: Float64Array }> = [];
  // 最后一遍循环根据可视范围内valid标记产生真正的merge汇总
  for (let j = 0, len = mergeList.length; j < len; j++) {
    const { i, lv, total, node, valid, isNew } = mergeList[j];
    const { maskMode, visible, opacity } = node.computedStyle;
    // 过滤可视范围外的，如果新生成的，则要统计可能存在mask影响后续节点数量
    if (!valid) {
      if (isNew && maskMode) {
        genNextCount(node, structs, i, lv, total);
      }
      continue;
    }
    // 不可见的，注意蒙版不可见时也生效
    if ((!visible || opacity <= 0) && !maskMode) {
      continue;
    }
    if (!firstMerge && (Date.now() - startTime) > config.deltaTime) {
      breakMerge = mergeList.slice(j);
      break;
    }
    let res: TextureCache | undefined;
    // 先尝试生成此节点汇总纹理，无论是什么效果，都是对汇总后的起效，单个节点的绘制等于本身纹理缓存
    if (!node.textureTotal[scaleIndex]?.available) {
      const t = genTotal(
        gl,
        root,
        node,
        structs,
        i,
        total,
        W,
        H,
        scale,
        scaleIndex,
      );
      if (t) {
        node.textureTotal[scaleIndex] = node.textureTarget[scaleIndex] = t;
        res = t;
        firstMerge = false;
      }
    }
    // 生成filter，这里直接进去，如果没有filter会返回空，group的tint也视作一种filter
    if (node.textureTarget[scaleIndex] && !node.textureFilter[scaleIndex]?.available) {
      const t = genFilter(gl, root, node, W, H, scale, scaleIndex);
      if (t) {
        node.textureFilter[scaleIndex] = node.textureTarget[scaleIndex] = t;
        res = t;
        firstMerge = false;
      }
    }
    // 生成mask，轮廓模板不需要验证有被遮罩对象但也无需生成
    if (maskMode && node.textureTarget[scaleIndex] && !node.textureMask[scaleIndex]?.available && node.next) {
      const t = genMask(
        gl,
        root,
        node,
        maskMode,
        structs,
        i,
        lv,
        total,
        W,
        H,
        scale,
        scaleIndex,
      );
      if (t) {
        node.textureMask[scaleIndex] = node.textureTarget[scaleIndex] = t;
        res = t;
        firstMerge = false;
      }
    }
    // 变更区域影响tile
    if (res && !root.firstDraw) {
      mergeRecord.push({
        bbox: res.bbox,
        m: node._matrixWorld || node.matrixWorld,
      });
    }
  }
  if (breakMerge && breakMerge.length) {
    root.breakMerge = true;
  }
  // 未完成的merge，跨帧渲染
  if (breakMerge && breakMerge.length) {
    for (let i = 0, len = breakMerge.length; i < len; i++) {
      root.addUpdate(breakMerge[i].node, [], RefreshLevel.CACHE, false, false, undefined);
      // update会清空mask的关系，无next计数，导致被遮罩在主循环中被显示出来，这里传lv是CACHE防止清除
    }
  }
  return { mergeRecord, breakMerge };
}

/**
 * 汇总作为局部根节点的bbox，注意作为根节点自身不会包含filter/mask等，所以用rect，其子节点则是需要考虑的
 * 由于根节点视作E且其rect的原点一定是0，因此子节点可以直接使用matrix预乘父节点，不会产生transformOrigin偏移
 */
function genBboxTotal(
  structs: Struct[],
  node: Node,
  index: number,
  total: number,
  isNew: boolean,
  scaleIndex: number,
  merge: Merge,
  mergeHash: Merge[],
) {
  const res = (node.tempBbox || node._rect || node.rect).slice(0);
  toE(node.tempMatrix);
  for (let i = index + 1, len = index + total + 1; i < len; i++) {
    const { node: node2, total: total2, next: next2 } = structs[i];
    const target = node2.textureTarget[scaleIndex];
    // 已有省略计算
    if (isNew) {
      const parent = node2.parent!;
      const m = multiply(parent.tempMatrix, node2.matrix);
      assignMatrix(node2.tempMatrix, m);
      const b = target?.bbox || node2._filterBbox2 || node2.filterBbox2;
      // 防止空
      if (b[2] - b[0] && b[3] - b[1]) {
        mergeBbox(res, b, m);
      }
    }
    // 有局部缓存跳过，注意可用
    if (
      target &&
      target.available &&
      target !== node2.textureCache[scaleIndex]
    ) {
      i += total2 + next2;
    }
    // 没缓存的shapeGroup仅可跳过孩子
    else if (node2.isShapeGroup) {
      i += total2;
    }
    // 收集子节点中的嵌套关系，子的不是顶层isTop
    const mg = mergeHash[i];
    if (mg) {
      mg.isTop = false;
      merge.subList.push(mg);
    }
  }
  return res;
}

export function checkInScreen(
  bbox: Float64Array,
  matrix: Float64Array | undefined,
  width: number,
  height: number,
) {
  return checkInRect(bbox, matrix, 0, 0, width, height);
}

export function checkInRect(
  bbox: Float64Array,
  matrix: Float64Array | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const box = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], matrix);
  let { x1, y1, x2, y2, x3, y3, x4, y4 } = box;
  // box是无旋转矩形可以加速，注意可能因为镜像导致坐标顺序颠倒
  if (x1 === x4 && y1 === y2 && x2 === x3 && y3 === y4) {
    if (x1 > x2) {
      [x1, x3] = [x3, x1];
    }
    if (y2 > y3) {
      [y1, y3] = [y3, y1];
    }
    return isRectsOverlap(x, y, x + width, y + height, x1, y1, x3, y3, false);
  }
  return isPolygonOverlapRect(x, y, x + width, y + height, [
    { x: x1, y: y1 },
    { x: x2, y: y2 },
    { x: x3, y: y3 },
    { x: x4, y: y4 },
  ], false);
}

// 统计mask节点后续关联跳过的数量
function genNextCount(
  node: Node,
  structs: Struct[],
  index: number,
  lv: number,
  total: number,
) {
  for (let i = index + total + 1, len = structs.length; i < len; i++) {
    const { node: node2, lv: lv2 } = structs[i];
    const computedStyle = node2.computedStyle;
    if (lv > lv2) {
      node.struct.next = i - index - total - 1;
      break;
    }
    else if (i === len || (computedStyle.breakMask && lv === lv2)) {
      node.struct.next = i - index - total - 1;
      break;
    }
  }
}

function genTotal(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  node: Node,
  structs: Struct[],
  index: number,
  total: number,
  W: number,
  H: number,
  scale: number,
  scaleIndex: number,
) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureTotal[scaleIndex]?.available) {
    return node.textureTotal[scaleIndex];
  }
  const bbox = node.tempBbox!;
  node.tempBbox = undefined;
  bbox[0] = Math.floor(bbox[0]);
  bbox[1] = Math.floor(bbox[1]);
  bbox[2] = Math.ceil(bbox[2]);
  bbox[3] = Math.ceil(bbox[3]);
  // 单个叶子节点也不需要，就是本身节点的内容
  if (!total || node.isShapeGroup) {
    let target = node.textureCache[scaleIndex];
    if ((!target || !target.available) && node.hasContent) {
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
  const x2 = x * scale,
    y2 = y * scale;
  const w = Math.ceil(bbox[2] - x),
    h = Math.ceil(bbox[3] - y);
  const w2 = w * scale,
    h2 = h * scale;
  const res = TextureCache.getEmptyInstance(gl, bbox);
  const list = res.list;
  let frameBuffer: WebGLFramebuffer | undefined;
  const UNIT = config.maxTextureSize;
  const listRect: { x: number, y: number }[] = [];
  // 要先按整数创建纹理块，再反向计算bbox（真实尺寸/scale），创建完再重新遍历按节点顺序渲染，因为有bgBlur存在
  for (let i = 0, len = Math.ceil(h2 / UNIT); i < len; i++) {
    for (let j = 0, len2 = Math.ceil(w2 / UNIT); j < len2; j++) {
      const width = j === len2 - 1 ? (w2 - j * UNIT) : UNIT;
      const height = i === len - 1 ? (h2 - i * UNIT) : UNIT;
      const t = createTexture(gl, 0, undefined, width, height);
      const x0 = x + j * UNIT / scale,
        y0 = y + i * UNIT / scale;
      const w0 = width / scale,
        h0 = height / scale;
      const bbox = new Float64Array([
        x0,
        y0,
        x0 + w0,
        y0 + h0,
      ]);
      list.push({
        bbox,
        w: width,
        h: height,
        t,
      });
      // checkInRect用
      const x1 = x2 + j * UNIT,
        y1 = y2 + i * UNIT;
      listRect.push({ x: x1, y: y1 });
    }
  }
  // 再外循环按节点序，内循环按分块，确保节点序内容先渲染，从而正确生成分块的bgBlur
  for (let i = index, len = index + total + 1; i < len; i++) {
    const { node: node2, total: total2, next: next2 } = structs[i];
    const computedStyle = node2.computedStyle;
    // 这里和主循环类似，不可见或透明考虑跳过，但mask和背景模糊特殊对待
    const { shouldIgnore, isBgBlur } = shouldIgnoreAndIsBgBlur(
      node2,
      computedStyle,
      scaleIndex,
    );
    if (shouldIgnore) {
      i += total2 + next2;
      continue;
    }
    // 图片检查内容加载计数器
    if (node2.isBitmap && (node2 as Bitmap).checkLoader()) {
      root.imgLoadList.push(node2 as Bitmap);
    }
    let opacity: number, matrix: Float64Array;
    // 首个节点即局部根节点，需要考虑scale放大
    if (i === index) {
      opacity = node2.tempOpacity = 1;
      toE(node2.tempMatrix);
      matrix = multiplyScale(node2.tempMatrix, scale);
    }
    // 子节点的matrix计算比较复杂，可能dx/dy不是0原点，造成transformOrigin偏移需重算matrix
    else {
      const parent = node2.parent!;
      opacity = node2.tempOpacity = computedStyle.opacity * parent.tempOpacity;
      if (x || y) {
        const transform = node2.transform;
        const tfo = computedStyle.transformOrigin;
        const m = calMatrixByOrigin(transform, tfo[0] - x, tfo[1] - y);
        matrix = multiply(parent.tempMatrix, m);
      }
      else {
        matrix = multiply(parent.tempMatrix, node2.matrix);
      }
    }
    assignMatrix(node2.tempMatrix, matrix);
    let target2 = node2.textureTarget[scaleIndex];
    // 可能没生成，存在于一开始在可视范围外的节点情况，且当时也没有进行合成
    if (!target2 && node2.hasContent) {
      node2.genTexture(gl, scale, scaleIndex);
      target2 = node2.textureTarget[scaleIndex];
    }
    if (target2 && target2.available) {
      const { mixBlendMode, blur } = computedStyle;
      // 同主循环的bgBlur，先提取总的outline，在分块渲染时每块单独对背景blur
      if (isBgBlur && i > index) {
        const outline = node.textureOutline[scale] = genOutline(gl, node2, structs, i, total2, target2.bbox, scale);
        // outline会覆盖这个值，恶心
        assignMatrix(node2.tempMatrix, matrix);
        genBgBlur(gl, root, res, matrix, outline, blur, programs, scale, w, h);
        if (frameBuffer) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        }
      }
      const list2 = target2.list;
      // 内循环目标分块
      for (let j = 0, len = list.length; j < len; j++) {
        const area = list[j];
        const rect = listRect[j];
        const { w, h, t } = area;
        if (frameBuffer) {
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            t,
            0,
          );
          gl.viewport(0, 0, w, h);
        }
        else {
          frameBuffer = genFrameBufferWithTexture(gl, t, w, h);
        }
        const cx = w * 0.5,
          cy = h * 0.5;
        // 再循环当前target的分块
        for (let k = 0, len = list2.length; k < len; k++) {
          const { bbox: bbox2, t: t2 } = list2[k];
          if (checkInRect(bbox2, matrix, rect.x, rect.y, w, h)) {
            let tex: WebGLTexture | undefined;
            // 有mbm先将本节点内容绘制到同尺寸纹理上
            if (mixBlendMode !== MIX_BLEND_MODE.NORMAL && i > index) {
              tex = createTexture(gl, 0, undefined, w, h);
              gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                tex,
                0,
              );
            }
            // 有无mbm都复用这段逻辑
            drawTextureCache(
              gl,
              cx,
              cy,
              program,
              [
                {
                  opacity,
                  matrix,
                  bbox: bbox2,
                  texture: t2,
                },
              ],
              -rect.x,
              -rect.y,
              false,
              -1, -1, 1, 1,
            );
            // 这里才是真正生成mbm
            if (mixBlendMode !== MIX_BLEND_MODE.NORMAL && tex) {
              area.t = genMbm(
                gl,
                t,
                tex,
                mixBlendMode,
                programs,
                w,
                h,
              );
            }
          }
        }
      }
    }
    // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    if (
      target2 &&
      target2.available &&
      target2 !== node2.textureCache[scaleIndex] ||
      computedStyle.maskMode && i !== index
    ) {
      i += total2 + next2;
    }
    else if (node2.isShapeGroup) {
      i += total2;
    }
  }
  // 删除fbo恢复
  releaseFrameBuffer(gl, frameBuffer!, W, H);
  return res;
}

export function genFrameBufferWithTexture(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  texture: WebGLTexture | undefined,
  width: number,
  height: number,
) {
  const frameBuffer = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  if (texture) {
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
  }
  gl.viewport(0, 0, width, height);
  return frameBuffer;
}

export function releaseFrameBuffer(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  frameBuffer: WebGLFramebuffer,
  width: number,
  height: number,
) {
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    null,
    0,
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(frameBuffer);
  gl.viewport(0, 0, width, height);
}

function genFilter(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  node: Node,
  W: number,
  H: number,
  scale: number,
  scaleIndex: number,
) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureFilter[scaleIndex]?.available) {
    return node.textureFilter[scaleIndex];
  }
  let res: TextureCache | undefined;
  const {
    shadow,
    shadowEnable,
    blur,
    fill,
    fillEnable,
    fillOpacity,
    hueRotate,
    saturate,
    brightness,
    contrast,
  } = node.computedStyle;
  const source = node.textureTarget[scaleIndex]!;
  // group特殊的tint，即唯一的fill颜色用作色调tint替换当前非透明像素
  if (node.isGroup) {
    if (fillEnable[0] && fill[0] && Array.isArray(fill[0])) {
      res = genTint(
        gl,
        root,
        source,
        fill[0] as number[],
        fillOpacity[0],
        W,
        H,
      );
    }
  }
  const sd: ComputedShadow[] = [];
  shadow.forEach((item, i) => {
    if (shadowEnable[i] && item.color[3] > 0) {
      sd.push(item);
    }
  });
  // 内阴影由canvas实现，这里只有外阴影，以原本图像为基准生成，最后统一绘入原图
  if (sd.length) {
    const t = genShadow(gl, root, res || source, sd, W, H, scale);
    if (res) {
      res.release();
    }
    res = t;
  }
  // 高斯模糊
  if (blur.t === BLUR.GAUSSIAN && blur.radius >= 1) {
    const t = genGaussBlur(gl, root, res || source, blur.radius, W, H, scale);
    if (res) {
      res.release();
    }
    res = t;
  }
  // 径向模糊/缩放模糊
  else if (blur.t === BLUR.RADIAL && blur.radius >= 1) {
    const t = genRadialBlur(
      gl,
      root,
      res || source,
      blur.radius,
      blur.center!,
      W,
      H,
      scale,
    );
    if (res) {
      res.release();
    }
    res = t;
  }
  // 运动模糊/方向模糊
  else if (blur.t === BLUR.MOTION && blur.radius >= 1) {
    const t = genMotionBlur(
      gl,
      root,
      res || source,
      blur.radius,
      blur.angle!,
      W,
      H,
      scale,
    );
    if (res) {
      res.release();
    }
    res = t;
  }
  // 颜色调整
  if (hueRotate || saturate !== 1 || brightness !== 1 || contrast !== 1) {
    const t = genColorMatrix(
      gl,
      root,
      res || source,
      hueRotate,
      saturate,
      brightness,
      contrast,
      W,
      H,
    );
    if (res) {
      res.release();
    }
    res = t;
  }
  return res;
}

// 因为blur原因，原本内容先绘入一个更大尺寸的fbo中
function drawInSpreadBbox(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  program: WebGLProgram,
  textureTarget: TextureCache,
  temp: TextureCache,
  x: number, y: number, scale: number,
  w2: number, h2: number,
) {
  const UNIT = config.maxTextureSize;
  const listS = textureTarget.list;
  const listT = temp.list;
  let frameBuffer: WebGLFramebuffer | undefined;
  for (let i = 0, len = Math.ceil(h2 / UNIT); i < len; i++) {
    for (let j = 0, len2 = Math.ceil(w2 / UNIT); j < len2; j++) {
      const width = j === len2 - 1 ? (w2 - j * UNIT) : UNIT;
      const height = i === len - 1 ? (h2 - i * UNIT) : UNIT;
      const t = createTexture(gl, 0, undefined, width, height);
      const x0 = x + j * UNIT / scale,
        y0 = y + i * UNIT / scale;
      const w0 = width / scale,
        h0 = height / scale;
      const bbox = new Float64Array([
        x0,
        y0,
        x0 + w0,
        y0 + h0,
      ]);
      const area = {
        bbox,
        w: width,
        h: height,
        t,
      };
      listT.push(area);
      if (frameBuffer) {
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          t,
          0,
        );
        gl.viewport(0, 0, width, height);
      }
      else {
        frameBuffer = genFrameBufferWithTexture(gl, t, width, height);
      }
      const cx = width * 0.5,
        cy = height * 0.5;
      for (let i = 0, len = listS.length; i < len; i++) {
        const { bbox: bbox2, t: t2 } = listS[i];
        if (checkInRect(bbox2, undefined, x0, y0, w0, h0)) {
          drawTextureCache(
            gl,
            cx,
            cy,
            program,
            [
              {
                opacity: 1,
                bbox: new Float64Array([
                  bbox2[0] * scale,
                  bbox2[1] * scale,
                  bbox2[2] * scale,
                  bbox2[3] * scale,
                ]),
                texture: t2,
              },
            ],
            -x0 * scale,
            -y0 * scale,
            false,
            -1, -1, 1, 1,
          );
        }
      }
    }
  }
  return frameBuffer!;
}

// 因blur原因，生成扩展好的尺寸后，交界处根据spread扩展因子，求出交界处的一块范围重叠区域，重新blur并覆盖交界处
function createInOverlay(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  res: TextureCache,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
  spread: number, // 不考虑scale
) {
  const UNIT = config.maxTextureSize;
  const unit = UNIT - spread * scale * 2; // 去除spread的单位
  const listO: {
    bbox: Float64Array,
    w: number, h: number,
    x1: number, y1: number, x2: number, y2: number, // 中间覆盖渲染的部分
    t: WebGLTexture,
  }[] = [];
  const bboxR = res.bbox;
  const w2 = w * scale,
    h2 = h * scale;
  // 左右2个之间的交界处需要重新blur的，宽度是spread*4，中间一半是需要的，上下则UNIT各缩spread到unit
  for (let i = 0, len = Math.ceil(h2 / unit); i < len; i++) {
    for (let j = 1, len2 = Math.ceil(w2 / UNIT); j < len2; j++) {
      let x1 = Math.max(bboxR[0], x + j * UNIT / scale - spread * 2),
        y1 = Math.max(bboxR[1], y + i * unit / scale - spread);
      let x2 = Math.min(bboxR[2], x1 + spread * 4),
        y2 = Math.min(bboxR[3], y1 + unit / scale + spread * 2);
      const bbox = new Float64Array([x1, y1, x2, y2]);
      if (x1 > bboxR[2] - spread * 2) {
        x1 = bbox[0] = Math.max(bboxR[0], bboxR[2] - spread * 2);
        x2 = bbox[2] = bboxR[2];
      }
      if (y1 > bboxR[3] - spread * 2) {
        y1 = bbox[1] = Math.max(bboxR[1], bboxR[3] - spread * 2);
        y2 = bbox[3] = bboxR[3];
      }
      // 边界处假如尺寸不够，要往回（左上）收缩，避免比如最下方很细的长条（高度不足spread）
      const w = (bbox[2] - bbox[0]) * scale,
        h = (bbox[3] - bbox[1]) * scale;
      listO.push({
        bbox,
        w,
        h,
        t: createTexture(gl, 0, undefined, w, h),
        x1: Math.max(bboxR[0], x1 + spread),
        y1: Math.max(bboxR[1], i ? (y1 + spread) : y1),
        x2: Math.min(bboxR[2], x2 - spread),
        y2: Math.min(bboxR[3], (i === len - 1) ? y2 : (y1 + unit + spread)),
      });
    }
  }
  // 上下2个之间的交界处需要重新blur的，高度是spread*4，中间一半是需要的，左右则UNIT各缩spread到unit
  for (let i = 1, len = Math.ceil(h2 / UNIT); i < len; i++) {
    for (let j = 0, len2 = Math.ceil(w2 / unit); j < len2; j++) {
      let x1 = Math.max(bboxR[0], x + j * unit / scale - spread),
        y1 = Math.max(bboxR[1], y + i * UNIT / scale - spread * 2);
      let x2 = Math.min(bboxR[2], x1 + unit / scale + spread * 2),
        y2 = Math.min(bboxR[3], y1 + spread * 4);
      const bbox = new Float64Array([x1, y1, x2, y2]);
      if (x1 > bboxR[2] - spread * 2) {
        x1 = bbox[0] = Math.max(bboxR[0], bboxR[2] - spread * 2);
        x2 = bbox[2] = bboxR[2];
      }
      if (y1 > bboxR[3] - spread * 2) {
        y1 = bbox[1] = Math.max(bboxR[1], bboxR[3] - spread * 2);
        y2 = bbox[3] = bboxR[3];
      }
      const w = (bbox[2] - bbox[0]) * scale,
        h = (bbox[3] - bbox[1]) * scale;
      listO.push({
        bbox,
        w,
        h,
        t: createTexture(gl, 0, undefined, w, h),
        x1: Math.max(bboxR[0], j ? (x1 + spread) : x1),
        y1: Math.max(bboxR[1], y1 + spread),
        x2: Math.min(bboxR[2], (j === len2 - 1) ? x2 : (x1 + unit + spread)),
        y2: Math.min(bboxR[3], y2 - spread),
      });
    }
  }
  return listO;
}

// 将交界处单独生成的模糊覆盖掉原本区块模糊的边界
function drawInOverlay(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  program: WebGLProgram,
  scale: number,
  res: TextureCache,
  listO: {
    bbox: Float64Array,
    w: number, h: number,
    x1: number, y1: number, x2: number, y2: number,
    t: WebGLTexture,
  }[],
  bboxR: Float64Array,
  spread: number,
) {
  gl.useProgram(program);
  gl.blendFunc(gl.ONE, gl.ZERO);
  const listR = res.list;
  for (let i = 0, len = listR.length; i < len; i++) {
    const item = listR[i];
    const { bbox, w, h, t } = item;
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      t,
      0,
    );
    gl.viewport(0, 0, w, h);
    const cx = w * 0.5,
      cy = h * 0.5;
    for (let j = 0, len = listO.length; j < len; j++) {
      const { bbox: bbox2, w: w2, h: h2, t: t2 } = listO[j];
      const bbox3 = bbox2.slice(0);
      // 中间一块儿区域，但是如果是原始图形边界处，不应该取边界
      if (bbox3[0] !== bboxR[0]) {
        bbox3[0] += spread;
      }
      if (bbox3[1] !== bboxR[1]) {
        bbox3[1] += spread;
      }
      if (bbox3[2] !== bboxR[2]) {
        bbox3[2] -= spread;
      }
      if (bbox3[3] !== bboxR[3]) {
        bbox3[3] -= spread;
      }
      const w3 = bbox3[2] - bbox3[0],
        h3 = bbox3[3] - bbox3[1];
      if (checkInRect(bbox, undefined, bbox3[0], bbox3[1], w3, h3)) {
        drawTextureCache(
          gl,
          cx,
          cy,
          program,
          [
            {
              opacity: 1,
              bbox: new Float64Array([
                bbox3[0] * scale,
                bbox3[1] * scale,
                bbox3[2] * scale,
                bbox3[3] * scale,
              ]),
              texture: t2,
              tc: {
                x1: (bbox3[0] === bboxR[0] ? 0 : spread * scale) / w2,
                y1: (bbox3[1] === bboxR[1] ? 0 : spread * scale) / h2,
                x3: (bbox3[2] === bboxR[2] ? w2 : (w2 - spread * scale)) / w2,
                y3: (bbox3[3] === bboxR[3] ? h2 : (h2 - spread * scale)) / h2,
              },
            },
          ],
          -bbox[0] * scale,
          -bbox[1] * scale,
          false,
          -1, -1, 1, 1,
        );
      }
    }
  }
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  listO.forEach(item => gl.deleteTexture(item.t));
}

/**
 * https://www.w3.org/TR/2018/WD-filter-effects-1-20181218/#feGaussianBlurElement
 * 按照css规范的优化方法执行3次，避免卷积核d扩大3倍性能慢
 * 规范的优化方法对d的值分奇偶优化，这里再次简化，d一定是奇数，即卷积核大小
 * 先动态生成gl程序，根据sigma获得d（一定奇数，省略偶数情况），再计算权重
 * 然后将d尺寸和权重拼接成真正程序并编译成program，再开始绘制
 */
function genGaussBlur(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  textureTarget: TextureCache,
  sigma: number,
  W: number,
  H: number,
  scale: number,
) {
  const d = kernelSize(sigma);
  const spread = outerSizeByD(d);
  const bboxS = textureTarget.bbox;
  const bboxR = bboxS.slice(0);
  bboxR[0] -= spread;
  bboxR[1] -= spread;
  bboxR[2] += spread;
  bboxR[3] += spread;
  // 写到一个扩展好尺寸的tex中方便后续处理
  const x = bboxR[0],
    y = bboxR[1];
  const w = bboxR[2] - bboxR[0],
    h = bboxR[3] - bboxR[1];
  // const x2 = x * scale,
  //   y2 = y * scale;
  const w2 = w * scale,
    h2 = h * scale;
  const programs = root.programs;
  const program = programs.program;
  const temp = TextureCache.getEmptyInstance(gl, bboxR);
  const listT = temp.list;
  // 由于存在扩展，原本的位置全部偏移，需要重算
  const frameBuffer = drawInSpreadBbox(gl, program, textureTarget, temp, x, y, scale, w2, h2);
  // 生成模糊，先不考虑多块情况下的边界问题，各个块的边界各自为政
  const programGauss = genGaussShader(gl, programs, sigma * scale, kernelSize(sigma * scale));
  gl.useProgram(programGauss);
  const res = TextureCache.getEmptyInstance(gl, bboxR);
  const listR = res.list;
  for (let i = 0, len = listT.length; i < len; i++) {
    const { bbox, w, h, t } = listT[i];
    gl.viewport(0, 0, w, h);
    const tex = drawGauss(gl, programGauss, t, w, h);
    listR.push({
      bbox: bbox.slice(0),
      w,
      h,
      t: tex,
    });
  }
  // 如果有超过1个区块，相邻部位需重新提取出来进行模糊替换
  if (listT.length > 1) {
    const listO = createInOverlay(gl, res, x, y, w, h, scale, spread);
    // 遍历这些相邻部分，先绘制原始图像
    for (let i = 0, len = listO.length; i < len; i++) {
      const item = listO[i];
      const { bbox, w, h, t } = item;
      gl.useProgram(program);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        t,
        0,
      );
      gl.viewport(0, 0, w, h);
      const cx = w * 0.5,
        cy = h * 0.5;
      let hasDraw = false;
      // 用temp而非原始的，因为位图存在缩放，bbox会有误差
      for (let j = 0, len = listT.length; j < len; j++) {
        const { bbox: bbox2, t: t2 } = listT[j];
        const w2 = bbox2[2] - bbox2[0],
          h2 = bbox2[3] - bbox2[1];
        if (checkInRect(bbox, undefined, bbox2[0], bbox2[1], w2, h2)) {
          drawTextureCache(
            gl,
            cx,
            cy,
            program,
            [
              {
                opacity: 1,
                bbox: new Float64Array([
                  bbox2[0] * scale,
                  bbox2[1] * scale,
                  bbox2[2] * scale,
                  bbox2[3] * scale,
                ]),
                texture: t2,
              },
            ],
            -bbox[0] * scale,
            -bbox[1] * scale,
            false,
            -1, -1, 1, 1,
          );
          hasDraw = true;
        }
      }
      // 一定会有，没有就是计算错了，这里预防下
      if (hasDraw) {
        gl.useProgram(programGauss);
        item.t = drawGauss(gl, programGauss, t, w, h);
      }
      gl.deleteTexture(t);
    }
    // 所有相邻部分回填
    drawInOverlay(gl, program, scale, res, listO, bboxR, spread);
  }
  // 删除fbo恢复
  temp.release();
  gl.useProgram(program);
  releaseFrameBuffer(gl, frameBuffer!, W, H);
  return res;
}

function genGaussShader(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  programs: Record<string, WebGLProgram>,
  sigma: number,
  d: number,
) {
  const key = 'programGauss,' + sigma + ',' + d;
  if (programs.hasOwnProperty(key)) {
    return programs[key];
  }
  const weights = gaussianWeight(sigma, d);
  let frag = '';
  const r = Math.floor(d * 0.5);
  for (let i = 0; i < r; i++) {
    // u_direction传入基数为100，因此相邻的像素点间隔百分之一
    let c = (r - i) * 0.01;
    frag += `gl_FragColor += limit(v_texCoords + vec2(-${c}, -${c}) * u_direction, ${weights[i]});
      gl_FragColor += limit(v_texCoords + vec2(${c}, ${c}) * u_direction, ${weights[i]});\n`;
  }
  frag += `gl_FragColor += limit(v_texCoords, ${weights[r]});`;
  frag = gaussFrag.replace('placeholder;', frag);
  return (programs[key] = initShaders(gl, simpleVert, frag));
}

/**
 * 原理：https://zhuanlan.zhihu.com/p/125744132
 * 源码借鉴pixi：https://github.com/pixijs/filters
 */
function genMotionBlur(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  textureTarget: TextureCache,
  sigma: number,
  angle: number,
  W: number,
  H: number,
  scale: number,
) {
  const radian = d2r(angle);
  const d = kernelSize(sigma);
  const spread = outerSizeByD(d);
  const bboxS = textureTarget.bbox;
  const bboxR = bboxS.slice(0);
  bboxR[0] -= spread;
  bboxR[1] -= spread;
  bboxR[2] += spread;
  bboxR[3] += spread;
  // 写到一个扩展好尺寸的tex中方便后续处理
  const x = bboxR[0],
    y = bboxR[1];
  const w = bboxR[2] - bboxR[0],
    h = bboxR[3] - bboxR[1];
  // const x2 = x * scale,
  //   y2 = y * scale;
  const w2 = w * scale,
    h2 = h * scale;
  const programs = root.programs;
  const program = programs.program;
  const temp = TextureCache.getEmptyInstance(gl, bboxR);
  const listT = temp.list;
  // 由于存在扩展，原本的位置全部偏移，需要重算
  const frameBuffer = drawInSpreadBbox(gl, program, textureTarget, temp, x, y, scale, w2, h2);
  // 迭代运动模糊，先不考虑多块情况下的边界问题，各个块的边界各自为政
  const programMotion = programs.motionProgram;
  gl.useProgram(programMotion);
  const res = TextureCache.getEmptyInstance(gl, bboxR);
  const listR = res.list;
  for (let i = 0, len = listT.length; i < len; i++) {
    const { bbox, w, h, t } = listT[i];
    gl.viewport(0, 0, w, h);
    const tex = drawMotion(gl, programMotion, t, spread * 0.5 * scale, radian, w, h);
    listR.push({
      bbox: bbox.slice(0),
      w,
      h,
      t: tex,
    });
  }
  // 如果有超过1个区块，相邻部位需重新提取出来进行模糊替换
  if (listT.length > 1) {
    const listO = createInOverlay(gl, res, x, y, w, h, scale, spread);
    for (let i = 0, len = listO.length; i < len; i++) {
      const item = listO[i];
      const { bbox, w, h, t } = item;
      gl.useProgram(program);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        t,
        0,
      );
      gl.viewport(0, 0, w, h);
      const cx = w * 0.5,
        cy = h * 0.5;
      let hasDraw = false;
      // 用temp而非原始的，因为位图存在缩放，bbox会有误差
      for (let j = 0, len = listT.length; j < len; j++) {
        const { bbox: bbox2, t: t2 } = listT[j];
        const w2 = bbox2[2] - bbox2[0],
          h2 = bbox2[3] - bbox2[1];
        if (checkInRect(bbox, undefined, bbox2[0], bbox2[1], w2, h2)) {
          drawTextureCache(
            gl,
            cx,
            cy,
            program,
            [
              {
                opacity: 1,
                bbox: new Float64Array([
                  bbox2[0] * scale,
                  bbox2[1] * scale,
                  bbox2[2] * scale,
                  bbox2[3] * scale,
                ]),
                texture: t2,
              },
            ],
            -bbox[0] * scale,
            -bbox[1] * scale,
            false,
            -1, -1, 1, 1,
          );
          hasDraw = true;
        }
      }
      if (hasDraw) {
        gl.useProgram(programMotion);
        item.t = drawMotion(gl, programMotion, t, spread * 0.5 * scale, radian, w, h);
      }
      gl.deleteTexture(t);
    }
    drawInOverlay(gl, program, scale, res, listO, bboxR, spread);
  }
  // 删除fbo恢复
  temp.release();
  gl.useProgram(program);
  releaseFrameBuffer(gl, frameBuffer, W, H);
  return res;
}

function genRadialBlur(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  textureTarget: TextureCache,
  sigma: number,
  center: [number, number],
  W: number,
  H: number,
  scale: number,
) {
  const bboxS = textureTarget.bbox;
  const d = kernelSize(sigma);
  const spread = outerSizeByD(d);
  const bboxR = bboxS.slice(0);
  // 根据center和shader算法得四周扩展，中心点和四边距离是向量长度r，spread*2/diagonal是扩展比例
  const w1 = bboxR[2] - bboxR[0],
    h1 = bboxR[3] - bboxR[1];
  const cx = center[0] * w1,
    cy = center[1] * h1;
  const diagonal = Math.sqrt(w1 * w1 + h1 * h1);
  const ratio = spread * 2 / diagonal;
  const left = Math.ceil(ratio * cx);
  const right = Math.ceil(ratio * (w1 - cx));
  const top = Math.ceil(ratio * cy);
  const bottom = Math.ceil(ratio * (h1 - cy));
  bboxR[0] -= left;
  bboxR[1] -= top;
  bboxR[2] += right;
  bboxR[3] += bottom;
  // 写到一个扩展好尺寸的tex中方便后续处理
  const x = bboxR[0],
    y = bboxR[1];
  const w = bboxR[2] - bboxR[0],
    h = bboxR[3] - bboxR[1];
  // const x2 = x * scale,
  //   y2 = y * scale;
  const w2 = w * scale,
    h2 = h * scale;
  const programs = root.programs;
  const program = programs.program;
  const temp = TextureCache.getEmptyInstance(gl, bboxR);
  const listT = temp.list;
  // 由于存在扩展，原本的位置全部偏移，需要重算
  const frameBuffer = drawInSpreadBbox(gl, program, textureTarget, temp, x, y, scale, w2, h2);
  // 生成模糊，先不考虑多块情况下的边界问题，各个块的边界各自为政
  const programRadial = programs.radialProgram;
  gl.useProgram(programRadial);
  const res = TextureCache.getEmptyInstance(gl, bboxR);
  const listR = res.list;
  const cx0 = cx + left,
    cy0 = cy + top;
  for (let i = 0, len = listT.length; i < len; i++) {
    const { bbox, w, h, t } = listT[i];
    gl.viewport(0, 0, w, h);
    const w2 = bbox[2] - bbox[0],
      h2 = bbox[3] - bbox[1];
    const center2 = [
      (cx0 - bbox[0] + bboxR[0]) / w2,
      (cy0 - bbox[1] + bboxR[1]) / h2,
    ] as [number, number];
    const tex = drawRadial(gl, programRadial, t, ratio, spread * scale, center2, w, h);
    listR.push({
      bbox: bbox.slice(0),
      w,
      h,
      t: tex,
    });
  }
  // 如果有超过1个区块，相邻部位需重新提取出来进行模糊替换
  if (listT.length > 1) {
    const listO = createInOverlay(gl, res, x, y, w, h, scale, spread);
    for (let i = 0, len = listO.length; i < len; i++) {
      const item = listO[i];
      const { bbox, w, h, t } = item;
      gl.useProgram(program);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        t,
        0,
      );
      gl.viewport(0, 0, w, h);
      const center2 = [
        (cx0 - bbox[0] + bboxR[0]) / (bbox[2] - bbox[0]),
        (cy0 - bbox[1] + bboxR[0]) / (bbox[3] - bbox[1]),
      ] as [number, number];
      const cx = w * 0.5,
        cy = h * 0.5;
      let hasDraw = false;
      // 用temp而非原始的，因为位图存在缩放，bbox会有误差
      for (let j = 0, len = listT.length; j < len; j++) {
        const { bbox: bbox2, t: t2 } = listT[j];
        const w2 = bbox2[2] - bbox2[0],
          h2 = bbox2[3] - bbox2[1];
        if (checkInRect(bbox, undefined, bbox2[0], bbox2[1], w2, h2)) {
          drawTextureCache(
            gl,
            cx,
            cy,
            program,
            [
              {
                opacity: 1,
                bbox: new Float64Array([
                  bbox2[0] * scale,
                  bbox2[1] * scale,
                  bbox2[2] * scale,
                  bbox2[3] * scale,
                ]),
                texture: t2,
              },
            ],
            -bbox[0] * scale,
            -bbox[1] * scale,
            false,
            -1, -1, 1, 1,
          );
          hasDraw = true;
        }
      }
      if (hasDraw) {
        gl.useProgram(programRadial);
        item.t = drawRadial(gl, programRadial, t, ratio, spread * scale, center2, w, h);
      }
      gl.deleteTexture(t);
    }
    drawInOverlay(gl, program, scale, res, listO, bboxR, spread);
  }
  // 删除fbo恢复
  temp.release();
  gl.useProgram(program);
  releaseFrameBuffer(gl, frameBuffer, W, H);
  return res;
}

function genColorMatrix(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  textureTarget: TextureCache,
  hueRotate: number,
  saturate: number,
  brightness: number,
  contrast: number,
  W: number,
  H: number,
) {
  const programs = root.programs;
  const cmProgram = programs.cmProgram;
  gl.useProgram(cmProgram);
  let res: TextureCache = textureTarget;
  let frameBuffer: WebGLFramebuffer | undefined;
  if (hueRotate) {
    const rotation = d2r(hueRotate % 360);
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const m = [
      0.213 + cosR * 0.787 - sinR * 0.213, 0.715 - cosR * 0.715 - sinR * 0.715, 0.072 - cosR * 0.072 + sinR * 0.928, 0,
      0, 0.213 - cosR * 0.213 + sinR * 0.143, 0.715 + cosR * 0.285 + sinR * 0.14, 0.072 - cosR * 0.072 - sinR * 0.283,
      0, 0, 0.213 - cosR * 0.213 - sinR * 0.787, 0.715 - cosR * 0.715 + sinR * 0.715,
      0.072 + cosR * 0.928 + sinR * 0.072, 0, 0, 0,
      0, 0, 1, 0,
    ];
    const old = res;
    const t = genColorByMatrix(gl, cmProgram, old, m, frameBuffer);
    res = t.res;
    frameBuffer = t.frameBuffer;
    if (old !== textureTarget) {
      old.release();
    }
  }
  if (saturate !== 1) {
    const m = [
      0.213 + 0.787 * saturate, 0.715 - 0.715 * saturate, 0.072 - 0.072 * saturate, 0,
      0, 0.213 - 0.213 * saturate, 0.715 + 0.285 * saturate, 0.072 - 0.072 * saturate,
      0, 0, 0.213 - 0.213 * saturate, 0.715 - 0.715 * saturate,
      0.072 + 0.928 * saturate, 0, 0, 0,
      0, 0, 1, 0,
    ];
    const old = res;
    const t = genColorByMatrix(gl, cmProgram, old, m, frameBuffer);
    res = t.res;
    frameBuffer = t.frameBuffer;
    if (old !== textureTarget) {
      old.release();
    }
  }
  if (brightness !== 1) {
    const b = brightness;
    const m = [
      1, 0, 0, 0,
      b - 1, 0, 1, 0,
      0, b - 1, 0, 0,
      1, 0, b - 1, 0,
      0, 0, 1, 0,
    ];
    const old = res;
    const t = genColorByMatrix(gl, cmProgram, old, m, frameBuffer);
    res = t.res;
    frameBuffer = t.frameBuffer;
    if (old !== textureTarget) {
      old.release();
    }
  }
  if (contrast !== 1) {
    const a = contrast;
    const o = -0.5 * a + 0.5;
    const m = [
      a, 0, 0, 0,
      o, 0, a, 0,
      0, o, 0, 0,
      a, 0, o, 0,
      0, 0, 1, 0,
    ];
    const old = res;
    const t = genColorByMatrix(gl, cmProgram, old, m, frameBuffer);
    res = t.res;
    frameBuffer = t.frameBuffer;
    if (old !== textureTarget) {
      old.release();
    }
  }
  gl.useProgram(programs.program);
  if (frameBuffer) {
    releaseFrameBuffer(gl, frameBuffer, W, H);
    return res;
  }
  else {
    gl.viewport(0, 0, W, H);
  }
}

function genColorByMatrix(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  cmProgram: WebGLProgram,
  old: TextureCache,
  m: number[],
  frameBuffer?: WebGLFramebuffer,
) {
  const res = TextureCache.getEmptyInstance(gl, old.bbox);
  const list = old.list;
  const listR = res.list;
  for (let i = 0, len = list.length; i < len; i++) {
    const { bbox, w, h, t } = list[i];
    const tex = createTexture(gl, 0, undefined, w, h);
    if (frameBuffer) {
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        tex,
        0,
      );
      gl.viewport(0, 0, w, h);
    }
    else {
      frameBuffer = genFrameBufferWithTexture(gl, tex, w, h);
    }
    drawColorMatrix(gl, cmProgram, t, m);
    listR.push({
      bbox: bbox.slice(0),
      w,
      h,
      t: tex,
    });
  }
  return { res, frameBuffer };
}

function genTint(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  textureTarget: TextureCache,
  tint: number[],
  opacity: number,
  W: number,
  H: number,
) {
  const { bbox, list } = textureTarget;
  const programs = root.programs;
  const tintProgram = programs.tintProgram;
  gl.useProgram(tintProgram);
  const res = TextureCache.getEmptyInstance(gl, bbox);
  const listR = res.list;
  let frameBuffer: WebGLFramebuffer | undefined;
  for (let i = 0, len = list.length; i < len; i++) {
    const { bbox, w, h, t } = list[i];
    const tex = createTexture(gl, 0, undefined, w, h);
    if (frameBuffer) {
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        tex,
        0,
      );
      gl.viewport(0, 0, w, h);
    }
    else {
      frameBuffer = genFrameBufferWithTexture(gl, tex, w, h);
    }
    drawTint(gl, tintProgram, t, tint, opacity);
    listR.push({
      bbox: bbox.slice(0),
      w,
      h,
      t: tex,
    });
  }
  gl.useProgram(programs.program);
  releaseFrameBuffer(gl, frameBuffer!, W, H);
  return res;
}

function genShadow(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  textureTarget: TextureCache,
  shadow: ComputedShadow[],
  W: number,
  H: number,
  scale: number,
) {
  // 先求出最终的bbox，多个shadow汇总，并生成每个的spread数据
  const bboxS = textureTarget.bbox;
  const bboxR2 = bboxS.slice(0);
  const sb = [0, 0, 0, 0];
  const data: number[] = [];
  for (let i = 0, len = shadow.length; i < len; i++) {
    const item = shadow[i];
    const d = kernelSize(item.blur * 0.5);
    const spread = outerSizeByD(d);
    data.push(spread);
    // 除了模糊增量还需考虑偏移增量
    if (item.x || item.y || spread) {
      sb[0] = Math.min(sb[0], item.x - spread);
      sb[1] = Math.min(sb[1], item.y - spread);
      sb[2] = Math.max(sb[2], item.x + spread);
      sb[3] = Math.max(sb[3], item.y + spread);
    }
  }
  bboxR2[0] += sb[0];
  bboxR2[1] += sb[1];
  bboxR2[2] += sb[2];
  bboxR2[3] += sb[3];
  const x = bboxR2[0],
    y = bboxR2[1];
  const w = bboxR2[2] - bboxR2[0],
    h = bboxR2[3] - bboxR2[1];
  const w2 = w * scale,
    h2 = h * scale;
  const programs = root.programs;
  const program = programs.program;
  const dropShadowProgram = programs.dropShadowProgram;
  // 先生成最终的尺寸结果，空白即可，后面的shadow依次绘入，最上层是图像本身
  const res2 = TextureCache.getEmptyInstance(gl, bboxR2);
  const listR2 = res2.list;
  const UNIT = config.maxTextureSize;
  for (let i = 0, len = Math.ceil(h2 / UNIT); i < len; i++) {
    for (let j = 0, len2 = Math.ceil(w2 / UNIT); j < len2; j++) {
      const width = j === len2 - 1 ? (w2 - j * UNIT) : UNIT;
      const height = i === len - 1 ? (h2 - i * UNIT) : UNIT;
      const t = createTexture(gl, 0, undefined, width, height);
      const x0 = x + j * UNIT / scale,
        y0 = y + i * UNIT / scale;
      const w0 = width / scale,
        h0 = height / scale;
      const bbox = new Float64Array([
        x0,
        y0,
        x0 + w0,
        y0 + h0,
      ]);
      listR2.push({
        bbox,
        w: width,
        h: height,
        t,
      });
    }
  }
  // 高清/scale
  let matrix: Float64Array | undefined;
  if (scale !== 1) {
    matrix = identity();
    multiplyScale(matrix, scale);
  }
  // 循环遍历每个shadow，分别生成后再合成在一起，先忽略掉偏移，按原位置渲染，最后用bbox偏移的方式做
  for (let i = 0, len = shadow.length; i < len; i++) {
    const spread = data[i];
    const { x: dx, y: dy, blur, color } = shadow[i];
    const bboxR = bboxS.slice(0);
    bboxR[0] -= spread;
    bboxR[1] -= spread;
    bboxR[2] += spread;
    bboxR[3] += spread;
    // 写到一个扩展好尺寸的tex中方便后续处理
    const x = bboxR[0],
      y = bboxR[1];
    const w = bboxR[2] - bboxR[0],
      h = bboxR[3] - bboxR[1];
    // const x2 = x * scale,
    //   y2 = y * scale;
    const w2 = w * scale,
      h2 = h * scale;
    const temp = TextureCache.getEmptyInstance(gl, bboxR);
    const listT = temp.list;
    // 由于存在扩展，原本的位置全部偏移，需要重算
    const frameBuffer = drawInSpreadBbox(gl, program, textureTarget, temp, x, y, scale, w2, h2);
    let res = TextureCache.getEmptyInstance(gl, bboxR);
    let listR = res.list;
    gl.useProgram(dropShadowProgram);
    // 使用这个尺寸的纹理，遍历shadow，仅生成shadow部分
    for (let i = 0, len = listT.length; i < len; i++) {
      const { bbox, w, h, t } = listT[i];
      gl.viewport(0, 0, w, h);
      const b = bbox.slice(0);
      b[0] += dx;
      b[1] += dy;
      b[2] += dx;
      b[3] += dy;
      const tex = createTexture(gl, 0, undefined, w, h);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        tex,
        0,
      );
      drawShadow(gl, dropShadowProgram, t, color2gl(color), w, h);
      listR.push({
        bbox: b,
        w,
        h,
        t: tex,
      });
    }
    temp.release();
    // blur是可选的，有才生成
    if (blur) {
      const sigma = blur * 0.5;
      const d = kernelSize(sigma);
      const spread = outerSizeByD(d);
      const programGauss = genGaussShader(gl, programs, sigma * scale, kernelSize(sigma * scale));
      gl.useProgram(programGauss);
      const temp = TextureCache.getEmptyInstance(gl, bboxR);
      const listT = temp.list;
      for (let i = 0, len = listR.length; i < len; i++) {
        const { bbox, w, h, t } = listR[i];
        gl.viewport(0, 0, w, h);
        const tex = drawGauss(gl, programGauss, t, w, h);
        listT.push({
          bbox: bbox.slice(0),
          w,
          h,
          t: tex,
        });
      }
      if (listR.length > 1) {
        const listO = createInOverlay(gl, temp, x, y, w, h, scale, spread);
        for (let i = 0, len = listO.length; i < len; i++) {
          const item = listO[i];
          const { bbox, w, h, t } = item;
          gl.useProgram(program);
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            t,
            0,
          );
          gl.viewport(0, 0, w, h);
          const cx = w * 0.5,
            cy = h * 0.5;
          let hasDraw = false;
          // 用temp而非原始的，因为位图存在缩放，bbox会有误差
          for (let j = 0, len = listR.length; j < len; j++) {
            const { bbox: bbox2, w: w2, h: h2, t: t2 } = listR[j];
            if (checkInRect(bbox, undefined, bbox2[0], bbox2[1], w2, h2)) {
              drawTextureCache(
                gl,
                cx,
                cy,
                program,
                [
                  {
                    opacity: 1,
                    bbox: bbox2,
                    texture: t2,
                  },
                ],
                -bbox[0],
                -bbox[1],
                false,
                -1, -1, 1, 1,
              );
              hasDraw = true;
            }
          }
          if (hasDraw) {
            gl.useProgram(programGauss);
            item.t = drawGauss(gl, programGauss, t, w, h);
          }
          gl.deleteTexture(t);
        }
        drawInOverlay(gl, program, scale, res, listO, bboxR, spread);
      }
      res.release();
      res = temp;
      listR = res.list;
    }
    gl.useProgram(program);
    // 将这个shadow汇入最终结果上，要考虑偏移
    for (let i = 0, len = listR2.length; i < len; i++) {
      const { bbox, w, h, t } = listR2[i];
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        t,
        0,
      );
      gl.viewport(0, 0, w, h);
      const cx = w * 0.5,
        cy = h * 0.5;
      for (let j = 0, len = listR.length; j < len; j++) {
        const { bbox: bbox2, w: w2, h: h2, t: t2 } = listR[j];
        if (checkInRect(bbox, undefined, bbox2[0], bbox2[1], w2, h2)) {
          drawTextureCache(
            gl,
            cx,
            cy,
            program,
            [
              {
                opacity: 1,
                matrix,
                bbox: bbox2,
                texture: t2,
              },
            ],
            -bbox[0] * scale,
            -bbox[1] * scale,
            false,
            -1, -1, 1, 1,
          );
        }
      }
    }
    // 删除fbo恢复
    res.release();
    releaseFrameBuffer(gl, frameBuffer!, W, H);
  }
  // 将原本的图层绘到最上方
  let frameBuffer: WebGLFramebuffer | undefined;
  const listS = textureTarget.list;
  for (let i = 0, len = listR2.length; i < len; i++) {
    const { bbox, w, h, t } = listR2[i];
    if (frameBuffer) {
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        t,
        0,
      );
      gl.viewport(0, 0, w, h);
    }
    else {
      frameBuffer = genFrameBufferWithTexture(gl, t, w, h);
    }
    const cx = w * 0.5,
      cy = h * 0.5;
    for (let j = 0, len = listS.length; j < len; j++) {
      const { bbox: bbox2, w: w2, h: h2, t: t2 } = listS[j];
      if (checkInRect(bbox, undefined, bbox2[0], bbox2[1], w2, h2)) {
        drawTextureCache(
          gl,
          cx,
          cy,
          program,
          [
            {
              opacity: 1,
              matrix,
              bbox: bbox2,
              texture: t2,
            },
          ],
          -bbox[0] * scale,
          -bbox[1] * scale,
          false,
          -1, -1, 1, 1,
        );
      }
    }
  }
  releaseFrameBuffer(gl, frameBuffer!, W, H);
  return res2;
}

function genMask(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  node: Node,
  maskMode: MASK,
  structs: Struct[],
  index: number,
  lv: number,
  total: number,
  W: number,
  H: number,
  scale: number,
  scaleIndex: number,
) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureMask[scaleIndex]?.available) {
    return node.textureMask[scaleIndex];
  }
  const textureTarget = node.textureTarget[scaleIndex]!;
  // 可能是个单叶子节点，mask申明无效
  if (!node.next) {
    return textureTarget;
  }
  const listM = textureTarget.list;
  const programs = root.programs;
  const program = programs.program;
  gl.useProgram(program);
  // 创建一个空白纹理来绘制，尺寸由于bbox已包含整棵子树内容可以直接使用
  const bbox = textureTarget.bbox;
  const { matrix, computedStyle } = node;
  const x = bbox[0],
    y = bbox[1];
  const x2 = x * scale,
    y2 = y * scale;
  const w = bbox[2] - x,
    h = bbox[3] - y;
  const w2 = w * scale,
    h2 = h * scale;
  const summary = TextureCache.getEmptyInstance(gl, bbox);
  const listS = summary.list;
  let frameBuffer: WebGLFramebuffer | undefined;
  const UNIT = config.maxTextureSize;
  const m = identity();
  assignMatrix(m, matrix);
  multiplyScale(m, 1 / scale);
  // 作为mask节点视作E，next后的节点要除以它的matrix即点乘逆矩阵
  const im = inverse(m);
  // 先循环收集此节点后面的内容汇总，直到结束或者打断mask
  for (let i = 0, len = Math.ceil(h2 / UNIT); i < len; i++) {
    for (let j = 0, len2 = Math.ceil(w2 / UNIT); j < len2; j++) {
      // 这里的逻辑和genTotal几乎一样
      const width = j === len2 - 1 ? (w2 - j * UNIT) : UNIT;
      const height = i === len - 1 ? (h2 - i * UNIT) : UNIT;
      const t = createTexture(gl, 0, undefined, width, height);
      const x0 = x + j * UNIT / scale,
        y0 = y + i * UNIT / scale;
      const w0 = width / scale,
        h0 = height / scale;
      const bbox = new Float64Array([
        x0,
        y0,
        x0 + w0,
        y0 + h0,
      ]);
      const area = {
        bbox,
        w: width,
        h: height,
        t,
      };
      listS.push(area);
      const x1 = x2 + j * UNIT,
        y1 = y2 + i * UNIT;
      const isFirst = !i && !j;
      if (frameBuffer) {
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          t,
          0,
        );
        gl.viewport(0, 0, width, height);
      }
      else {
        frameBuffer = genFrameBufferWithTexture(gl, t, width, height);
      }
      const cx = width * 0.5,
        cy = height * 0.5;
      for (let i = index + total + 1, len = structs.length; i < len; i++) {
        const { node: node2, lv: lv2, total: total2, next: next2 } = structs[i];
        const computedStyle = node2.computedStyle;
        // mask只会影响next同层级以及其子节点，跳出后实现（比如group结束）
        if (lv > lv2) {
          node.struct.next = i - index - total - 1;
          break;
        }
        else if (i === len || (computedStyle.breakMask && lv === lv2)) {
          node.struct.next = i - index - total - 1;
          break;
        }
        // 需要保存引用，当更改时取消mask节点的缓存重新生成
        if (isFirst) {
          node2.mask = node;
        }
        // 这里和主循环类似，不可见或透明考虑跳过，但mask和背景模糊特殊对待
        const { shouldIgnore, isBgBlur } = shouldIgnoreAndIsBgBlur(
          node2,
          computedStyle,
          scaleIndex,
        );
        if (shouldIgnore) {
          i += total2 + next2;
          continue;
        }
        // 图片检查内容加载计数器
        if (isFirst && node2.isBitmap && (node2 as Bitmap).checkLoader()) {
          root.imgLoadList.push(node2 as Bitmap);
        }
        let opacity: number,
          matrix: Float64Array;
        if (isFirst) {
          // 同层级的next作为特殊的局部根节点，注意dx/dy偏移对transformOrigin的影响
          if (lv === lv2) {
            opacity = node2.tempOpacity = computedStyle.opacity;
            if (x || y) {
              const transform = node2.transform;
              const tfo = computedStyle.transformOrigin;
              const m = calMatrixByOrigin(transform, tfo[0] - x, tfo[1] - y);
              matrix = multiply(im, m);
            }
            else {
              matrix = multiply(im, node2.matrix);
            }
          }
          else {
            const parent = node2.parent!;
            opacity = node2.tempOpacity = computedStyle.opacity * parent.tempOpacity;
            if (x || y) {
              const transform = node2.transform;
              const tfo = computedStyle.transformOrigin;
              const m = calMatrixByOrigin(transform, tfo[0] - x, tfo[1] - y);
              matrix = multiply(parent.tempMatrix, m);
            }
            else {
              matrix = multiply(parent.tempMatrix, node2.matrix);
            }
          }
          assignMatrix(node2.tempMatrix, matrix);
        }
        else {
          opacity = node2.tempOpacity;
          matrix = node2.tempMatrix;
        }
        let target2 = node2.textureTarget[scaleIndex];
        // 可能没生成，存在于一开始在可视范围外的节点情况，且当时也没有进行合成
        if (!target2 && node2.hasContent) {
          node2.genTexture(gl, scale, scaleIndex);
          target2 = node2.textureTarget[scaleIndex];
        }
        if (target2 && target2.available) {
          const { mixBlendMode, blur } = computedStyle;
          // 同主循环的bgBlur
          if (isBgBlur && i > index + total + 1) {
            const outline = node.textureOutline[scale] = genOutline(gl, node2, structs, i, total2, target2.bbox, scale);
            // outline会覆盖这个值，恶心
            assignMatrix(node2.tempMatrix, matrix);
            genBgBlur(gl, root, summary, matrix, outline, blur, programs, scale, w, h);
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
            gl.viewport(0, 0, width, height);
          }
          const list2 = target2.list;
          for (let j = 0, len2 = list2.length; j < len2; j++) {
            const { bbox: bbox2, t: t2 } = list2[j];
            if (checkInRect(bbox2, matrix, x1, y1, width, height)) {
              let tex: WebGLTexture | undefined;
              // 有mbm先将本节点内容绘制到同尺寸纹理上
              if (mixBlendMode !== MIX_BLEND_MODE.NORMAL && i > index) {
                tex = createTexture(gl, 0, undefined, width, height);
                if (frameBuffer) {
                  gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_2D,
                    tex,
                    0,
                  );
                  gl.viewport(0, 0, w, h);
                }
                else {
                  frameBuffer = genFrameBufferWithTexture(gl, tex, w, h);
                }
              }
              // 有无mbm都复用这段逻辑
              drawTextureCache(
                gl,
                cx,
                cy,
                program,
                [
                  {
                    opacity,
                    matrix,
                    bbox: bbox2,
                    texture: t2,
                  },
                ],
                -x1,
                -y1,
                false,
                -1, -1, 1, 1,
              );
              // 这里才是真正生成mbm
              if (mixBlendMode !== MIX_BLEND_MODE.NORMAL && tex) {
                area.t = genMbm(
                  gl,
                  area.t,
                  tex,
                  mixBlendMode,
                  programs,
                  width,
                  height,
                );
              }
            }
          }
        }
        // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
        if (
          target2 &&
          target2.available &&
          target2 !== node2.textureCache[scaleIndex] ||
          computedStyle.maskMode
        ) {
          i += total2 + next2;
        }
        else if (node2.isShapeGroup) {
          i += total2;
        }
      }
    }
  }
  let res = TextureCache.getEmptyInstance(gl, bbox);
  const maskProgram = programs.maskProgram;
  gl.useProgram(maskProgram);
  // alpha直接应用，汇总乘以mask本身的alpha即可
  if (maskMode === MASK.ALPHA) {
    const listR = res.list;
    for (let i = 0, len = listS.length; i < len; i++) {
      const { bbox, w, h, t } = listS[i];
      const tex = createTexture(gl, 0, undefined, w, h);
      if (frameBuffer) {
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          tex,
          0,
        );
        gl.viewport(0, 0, w, h);
      }
      else {
        frameBuffer = genFrameBufferWithTexture(gl, tex, w, h);
      }
      drawMask(gl, maskProgram, listM[i].t, t);
      listR.push({
        bbox: bbox.slice(0),
        w,
        h,
        t: tex,
      });
    }
    gl.useProgram(program);
  }
  // 轮廓需收集mask的轮廓并渲染出来，作为遮罩应用，再底部叠加自身非轮廓内容
  else if (maskMode === MASK.OUTLINE) {
    const outline = node.textureOutline[scale] = genOutline(
      gl,
      node,
      structs,
      index,
      total,
      bbox,
      scale,
    );
    const listO = outline.list;
    const temp = TextureCache.getEmptyInstance(gl, bbox);
    const listT = temp.list;
    // summary的list和outline的list是完全对应的，直接应用mask
    for (let i = 0, len = listS.length; i < len; i++) {
      const { bbox, w, h, t } = listS[i];
      const tex = createTexture(gl, 0, undefined, w, h);
      if (frameBuffer) {
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          tex,
          0,
        );
        gl.viewport(0, 0, w, h);
      }
      else {
        frameBuffer = genFrameBufferWithTexture(gl, tex, w, h);
      }
      drawMask(gl, maskProgram, listO[i].t, t);
      listT.push({
        bbox: bbox.slice(0),
        w,
        h,
        t: tex,
      });
    }
    // 将mask本身和生成的mask内容temp绘制到一起，mask可能不可见，轮廓类型不可见就不绘制
    gl.useProgram(program);
    toE(node.tempMatrix);
    multiplyScale(node.tempMatrix, scale);
    if (computedStyle.visible && computedStyle.opacity > 0 && textureTarget.available) {
      const listR = res.list;
      for (let i = 0, len = listT.length; i < len; i++) {
        const { bbox, w, h, t } = listT[i];
        const tex = createTexture(gl, 0, undefined, w, h);
        if (frameBuffer) {
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            tex,
            0,
          );
          gl.viewport(0, 0, w, h);
        }
        else {
          frameBuffer = genFrameBufferWithTexture(gl, tex, w, h);
        }
        drawTextureCache(
          gl,
          w * 0.5,
          h * 0.5,
          program,
          [
            {
              opacity: 1,
              bbox: new Float64Array([0, 0, w, h]),
              texture: listM[i].t,
            }
          ],
          0,
          0,
          false,
          -1, -1, 1, 1,
        );
        drawTextureCache(
          gl,
          w * 0.5,
          h * 0.5,
          program,
          [
            {
              opacity: 1,
              bbox: new Float64Array([0, 0, w, h]),
              texture: t,
            }
          ],
          0,
          0,
          false,
          -1, -1, 1, 1,
        );
        listR.push({
          bbox: bbox.slice(0),
          w,
          h,
          t: tex,
        });
      }
    }
    else {
      res.release();
      res = temp;
    }
  }
  // 删除fbo恢复
  summary.release();
  if (frameBuffer) {
    releaseFrameBuffer(gl, frameBuffer, W, H);
  }
  else {
    gl.viewport(0, 0, W, H);
  }
  return res;
}

// 创建一个和画布一样大的纹理，将画布和即将mbm混合的节点作为输入，结果重新赋值给画布
export function genMbm(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  tex1: WebGLTexture,
  tex2: WebGLTexture,
  mixBlendMode: MIX_BLEND_MODE,
  programs: Record<string, WebGLProgram>,
  w: number,
  h: number,
) {
  // 获取对应的mbm程序
  let program: WebGLProgram;
  if (mixBlendMode === MIX_BLEND_MODE.MULTIPLY) {
    program = programs.multiplyProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.SCREEN) {
    program = programs.screenProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.OVERLAY) {
    program = programs.overlayProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.DARKEN) {
    program = programs.darkenProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.LIGHTEN) {
    program = programs.lightenProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.COLOR_DODGE) {
    program = programs.colorDodgeProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.COLOR_BURN) {
    program = programs.colorBurnProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.HARD_LIGHT) {
    program = programs.hardLightProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.SOFT_LIGHT) {
    program = programs.softLightProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.DIFFERENCE) {
    program = programs.differenceProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.EXCLUSION) {
    program = programs.exclusionProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.HUE) {
    program = programs.hueProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.SATURATION) {
    program = programs.saturationProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.COLOR) {
    program = programs.colorProgram;
  }
  else if (mixBlendMode === MIX_BLEND_MODE.LUMINOSITY) {
    program = programs.luminosityProgram;
  }
  else {
    inject.error('Unknown mixBlendMode: ' + mixBlendMode);
    program = programs.program;
  }
  gl.useProgram(program);
  const res = createTexture(gl, 0, undefined, w, h);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    res,
    0,
  );
  drawMbm(gl, program, tex1, tex2);
  gl.deleteTexture(tex1);
  gl.deleteTexture(tex2);
  gl.useProgram(programs.program);
  return res;
}

// 创建一个和背景一样大的纹理，先将背景按mask逆矩阵绘制，再进行blur，再和节点进行mask保留重合的部分
export function genBgBlur(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  target: TextureCache, // 画布/背景
  matrix: Float64Array | undefined, // outline相对于target的
  outline: TextureCache,
  blur: ComputedBlur,
  programs: Record<string, WebGLProgram>,
  scale: number,
  W: number,
  H: number,
) {
  const program = programs.program;
  // 先背景blur
  const bg = genGaussBlur(gl, root, target, blur.radius, W, H, scale);
  const listB = bg.list;
  const listO = outline.list;
  let frameBuffer: WebGLFramebuffer | undefined;
  // {
  //   const arr: HTMLImageElement[] = [];
  //   listB.forEach((item, i) => {
  //     const { w, h, t } = item;
  //     frameBuffer = genFrameBufferWithTexture(gl, t, w, h);
  //     const pixels = new Uint8Array(w * h * 4);
  //     gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  //     const os = inject.getOffscreenCanvas(w, h);
  //     const id = os.ctx.getImageData(0, 0, w, h);
  //     for (let i = 0, len = w * h * 4; i < len ;i++) {
  //       id.data[i] = pixels[i];
  //     }
  //     os.ctx.putImageData(id, 0, 0);
  //     const img = document.createElement('img');
  //     img.setAttribute('name', i.toString());
  //     os.canvas.toBlob(blob => {
  //       img.src = URL.createObjectURL(blob!);
  //       img.style.width = w * 0.5 + 'px';
  //       img.style.height = h * 0.5 + 'px';
  //       arr.push(img);
  //       if (arr.length === listB.length) {
  //         arr.sort((a, b) => {
  //           return parseInt(a.getAttribute('name')!)
  //             - parseInt(b.getAttribute('name')!);
  //         });
  //         arr.forEach(img => {
  //           document.body.appendChild(img);
  //         });
  //       }
  //     });
  //   });
  // }
  // const arr: HTMLImageElement[] = [];
  // outline扩展和背景blur一样大，方便后续mask
  const listO2: WebGLTexture[] = [];
  for (let i = 0, len = listB.length; i < len; i++) {
    const { bbox, w, h } = listB[i];
    const cx = w * 0.5,
      cy = h * 0.5;
    const tex = createTexture(gl, 0, undefined, w, h);
    listO2.push(tex);
    if (frameBuffer) {
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        tex,
        0,
      );
      gl.viewport(0, 0, w, h);
    }
    else {
      frameBuffer = genFrameBufferWithTexture(gl, tex, w, h);
    }
    for (let j = 0, len = listO.length; j < len; j++) {
      const { bbox: bbox2, t: t2 } = listO[j];
      if (checkInRect(bbox2, matrix,
        bbox[0] * scale, bbox[1] * scale,
        (bbox[2] - bbox[0]) * scale, (bbox[3] - bbox[1]) * scale)) {
        drawTextureCache(
          gl,
          cx,
          cy,
          program,
          [
            {
              opacity: 1,
              matrix,
              bbox: bbox2,
              texture: t2,
            },
          ],
          -bbox[0] * scale,
          -bbox[1] * scale,
          false,
          -1, -1, 1, 1,
        );
      }
    }
    // const pixels = new Uint8Array(w * h * 4);
    // gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    // const os = inject.getOffscreenCanvas(w, h);
    // const id = os.ctx.getImageData(0, 0, w, h);
    // for (let i = 0, len = w * h * 4; i < len ;i++) {
    //   id.data[i] = pixels[i];
    // }
    // os.ctx.putImageData(id, 0, 0);
    // const img = document.createElement('img');
    // img.setAttribute('name', i.toString());
    // os.canvas.toBlob(blob => {
    //   img.src = URL.createObjectURL(blob!);
    //   img.style.width = w * 0.5 + 'px';
    //   img.style.height = h * 0.5 + 'px';
    //   arr.push(img);
    //   if (arr.length === listB.length) {
    //     arr.sort((a, b) => {
    //       return parseInt(a.getAttribute('name')!)
    //         - parseInt(b.getAttribute('name')!);
    //     });
    //     arr.forEach(img => {
    //       document.body.appendChild(img);
    //     });
    //   }
    // });
  }
  // 应用mask，将模糊的背景用outline作为mask保留重合
  const maskProgram = programs.maskProgram;
  gl.useProgram(maskProgram);
  for (let i = 0, len = listB.length; i < len; i++) {
    const item = listB[i];
    const { w, h, t } = item;
    const tex = createTexture(gl, 0, undefined, w, h);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0,
    );
    gl.viewport(0, 0, w, h);
    drawMask(gl, maskProgram, listO2[i], t);
    gl.deleteTexture(t);
    gl.deleteTexture(listO2[i]);
    item.t = tex;
  }
  // {
  //   const arr: HTMLImageElement[] = [];
  //   listB.forEach((item, i) => {
  //     const { w, h, t } = item;
  //     frameBuffer = genFrameBufferWithTexture(gl, t, w, h);
  //     const pixels = new Uint8Array(w * h * 4);
  //     gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  //     const os = inject.getOffscreenCanvas(w, h);
  //     const id = os.ctx.getImageData(0, 0, w, h);
  //     for (let i = 0, len = w * h * 4; i < len ;i++) {
  //       id.data[i] = pixels[i];
  //     }
  //     os.ctx.putImageData(id, 0, 0);
  //     const img = document.createElement('img');
  //     img.setAttribute('name', i.toString());
  //     os.canvas.toBlob(blob => {
  //       img.src = URL.createObjectURL(blob!);
  //       img.style.width = w * 0.5 + 'px';
  //       img.style.height = h * 0.5 + 'px';
  //       arr.push(img);
  //       if (arr.length === listB.length) {
  //         arr.sort((a, b) => {
  //           return parseInt(a.getAttribute('name')!)
  //             - parseInt(b.getAttribute('name')!);
  //         });
  //         arr.forEach(img => {
  //           document.body.appendChild(img);
  //         });
  //       }
  //     });
  //   });
  // }
  // 可能存在的饱和度 TODO 没生效
  if (blur.saturation !== undefined && blur.saturation !== 1) {
    const t = genColorMatrix(
      gl,
      root,
      bg,
      0,
      blur.saturation!,
      1,
      1,
      W,
      H,
    );
    if (t) {
      for (let i = 0, len = listB.length; i < len; i++) {
        gl.deleteTexture(listB[i].t);
        listB[i].t = t.list[i].t;
      }
      if (frameBuffer) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
      }
    }
  }
  // 原本背景则用outline作为clip裁剪掉重合，同样需要先扩展outline和bg一样大
  // const arr2: HTMLImageElement[] = [];
  gl.useProgram(program);
  const listO3: WebGLTexture[] = [];
  const listT = target.list;
  for (let i = 0, len = listT.length; i < len; i++) {
    const { bbox, w, h, t } = listT[i];
    const cx = w * 0.5,
      cy = h * 0.5;
    const tex = createTexture(gl, 0, undefined, w, h);
    listO3.push(tex);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0,
    );
    gl.viewport(0, 0, w, h);
    for (let j = 0, len = listO.length; j < len; j++) {
      const { bbox: bbox2, t: t2 } = listO[j];
      if (checkInRect(bbox2, matrix,
        bbox[0] * scale, bbox[1] * scale,
        (bbox[2] - bbox[0]) * scale, (bbox[3] - bbox[1]) * scale)) {
        drawTextureCache(
          gl,
          cx,
          cy,
          program,
          [
            {
              opacity: 1,
              matrix,
              bbox: bbox2,
              texture: t2,
            },
          ],
          -bbox[0] * scale,
          -bbox[1] * scale,
          false,
          -1, -1, 1, 1,
        );
      }
    }
    // const pixels = new Uint8Array(w * h * 4);
    // gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    // const os = inject.getOffscreenCanvas(w, h);
    // const id = os.ctx.getImageData(0, 0, w, h);
    // for (let i = 0, len = w * h * 4; i < len ;i++) {
    //   id.data[i] = pixels[i];
    // }
    // os.ctx.putImageData(id, 0, 0);
    // const img = document.createElement('img');
    // img.setAttribute('name', i.toString());
    // os.canvas.toBlob(blob => {
    //   img.src = URL.createObjectURL(blob!);
    //   img.style.width = w * 0.5 + 'px';
    //   img.style.height = h * 0.5 + 'px';
    //   arr2.push(img);
    //   if (arr2.length === listT.length) {
    //     arr2.sort((a, b) => {
    //       return parseInt(a.getAttribute('name')!)
    //         - parseInt(b.getAttribute('name')!);
    //     });
    //     arr2.forEach(img => {
    //       document.body.appendChild(img);
    //     });
    //   }
    // });
  }
  // 开始clip过程，去掉outline重合
  const clipProgram = programs.clipProgram;
  gl.useProgram(clipProgram);
  // const arr3: HTMLImageElement[] = [];
  for (let i = 0, len = listT.length; i < len; i++) {
    const item = listT[i];
    const { w, h, t } = item;
    const tex = createTexture(gl, 0, undefined, w, h);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0,
    );
    gl.viewport(0, 0, w, h);
    drawMask(gl, clipProgram, listO3[i], t);
    gl.deleteTexture(t);
    gl.deleteTexture(listO3[i]);
    item.t = tex;
    // const pixels = new Uint8Array(w * h * 4);
    // gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    // const os = inject.getOffscreenCanvas(w, h);
    // const id = os.ctx.getImageData(0, 0, w, h);
    // for (let i = 0, len = w * h * 4; i < len ;i++) {
    //   id.data[i] = pixels[i];
    // }
    // os.ctx.putImageData(id, 0, 0);
    // const img = document.createElement('img');
    // img.setAttribute('name', i.toString());
    // os.canvas.toBlob(blob => {
    //   img.src = URL.createObjectURL(blob!);
    //   img.style.width = w * 0.5 + 'px';
    //   img.style.height = h * 0.5 + 'px';
    //   arr3.push(img);
    //   if (arr3.length === listT.length) {
    //     arr3.sort((a, b) => {
    //       return parseInt(a.getAttribute('name')!)
    //         - parseInt(b.getAttribute('name')!);
    //     });
    //     arr3.forEach(img => {
    //       document.body.appendChild(img);
    //     });
    //   }
    // });
  }
  // 原始纹理上绘入结果，即root或者局部根节点
  gl.useProgram(program);
  const m = identity();
  if (scale !== 1) {
    multiplyScale(m, scale);
  }
  // 注意混合，非blur的bg可能是半透明，加上blur的bg混在一起，透明度由frag处理，不能再特殊混合
  gl.blendFunc(gl.ONE, gl.ONE);
  for (let i = 0, len = listT.length; i < len; i++) {
    const { bbox, w, h, t } = listT[i];
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      t,
      0,
    );
    gl.viewport(0, 0, w, h);
    for (let j = 0, len = listB.length; j < len; j++) {
      const { bbox: bbox2, t: t2 } = listB[j];
      if (checkInRect(bbox2, undefined, bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1])) {
        drawTextureCache(
          gl,
          w * 0.5,
          h * 0.5,
          program,
          [
            {
              opacity: 1,
              matrix: m,
              bbox: bbox2,
              texture: t2,
            },
          ],
          -bbox[0] * scale,
          -bbox[1] * scale,
          false,
          -1, -1, 1, 1,
        );
      }
    }
  }
  // 还原
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  if (frameBuffer) {
    releaseFrameBuffer(gl, frameBuffer, W, H);
  }
  else {
    gl.viewport(0, 0, W, H);
  }
}

// 仅叶子结点矢量文本图片可用，组不可用，会干扰merge过程中生成的tempMatrix，记得结束后还原
export function genOutline(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  node: Node,
  structs: Struct[],
  index: number,
  total: number,
  bbox: Float64Array,
  scale: number,
) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureOutline[scale]?.available) {
    return node.textureOutline[scale]!;
  }
  const x = bbox[0],
    y = bbox[1];
  const w = bbox[2] - x,
    h = bbox[3] - y;
  const dx = -x * scale,
    dy = -y * scale;
  const w2 = w * scale,
    h2 = h * scale;
  const canvasCache = CanvasCache.getInstance(w2, h2, dx, dy);
  canvasCache.available = true;
  const list = canvasCache.list;
  for (let i = 0, len = list.length; i < len; i++) {
    const { x, y, os: { ctx } } = list[i];
    const dx2 = -x;
    const dy2 = -y;
    ctx.fillStyle = '#FFF';
    // 这里循环收集这个作为轮廓mask的节点的所有轮廓，用普通canvas模式填充白色到内容区域
    for (let i = index, len = index + total + 1; i < len; i++) {
      const { node, total, next } = structs[i];
      let matrix: Float64Array;
      if (i === index) {
        matrix = toE(node.tempMatrix);
      }
      else {
        const parent = node.parent!;
        matrix = multiply(parent.tempMatrix, node.matrix);
        assignMatrix(node.tempMatrix, matrix);
      }
      const fillRule =
        node.computedStyle.fillRule === FILL_RULE.EVEN_ODD
          ? 'evenodd'
          : 'nonzero';
      ctx.setTransform(
        matrix[0],
        matrix[1],
        matrix[4],
        matrix[5],
        matrix[12],
        matrix[13],
      );
      // 矢量很特殊
      if (node instanceof Polyline) {
        const coords = node.coords!;
        ctx.beginPath();
        canvasPolygon(ctx, coords, scale, dx2, dy2);
        ctx.closePath();
        ctx.fill(fillRule);
      }
      // 忽略子节点
      else if (node instanceof ShapeGroup) {
        const coords = node.coords!;
        ctx.beginPath();
        coords.forEach((item) => {
          canvasPolygon(ctx, item, scale, dx2, dy2);
        });
        ctx.closePath();
        ctx.fill(fillRule);
        i += total + next;
      }
      // 文本忽略透明度渲染
      else if (node instanceof Text) {
        const lineBoxList = node.lineBoxList;
        for (let i = 0, len = lineBoxList.length; i < len; i++) {
          const lineBox = lineBoxList[i];
          if (lineBox.y >= h) {
            break;
          }
          const list = lineBox.list;
          const len = list.length;
          for (let i = 0; i < len; i++) {
            const textBox = list[i];
            Text.setFontAndLetterSpacing(ctx, textBox, scale);
            ctx.fillText(
              textBox.str,
              textBox.x * scale + dx2,
              (textBox.y + textBox.baseline) * scale + dy2,
            );
          }
        }
      }
      // 普通节点就是个矩形，组要跳过子节点
      else {
        ctx.fillRect(dx2, dy2, node.width * scale, node.height * scale);
        if (node instanceof Group) {
          i += total + next;
        }
      }
    }
  }
  // list.forEach(item => {
  //   item.os.canvas.toBlob(blob => {
  //     if (blob) {
  //       const img = document.createElement('img');
  //       img.src = URL.createObjectURL(blob);
  //       img.setAttribute('name', 'outline ' + node.props.name);
  //       document.body.appendChild(img);
  //     }
  //   });
  // });
  const target = TextureCache.getInstance(gl, canvasCache, bbox);
  canvasCache.release();
  return target;
}

// 不可见和透明的跳过，但要排除mask，有背景模糊的合法节点如果是透明也不能跳过，mask和背景模糊互斥，优先mask
export function shouldIgnoreAndIsBgBlur(
  node: Node,
  computedStyle: ComputedStyle,
  scaleIndex: number,
) {
  const blur = computedStyle.blur;
  const isBgBlur =
    blur.t === BLUR.BACKGROUND &&
    (blur.radius > 0 || blur.saturation !== 1) &&
    (node instanceof ShapeGroup ||
      node instanceof Geom ||
      node instanceof Bitmap ||
      node instanceof Text);
  let shouldIgnore = !computedStyle.visible || computedStyle.opacity <= 0;
  if (shouldIgnore && computedStyle.maskMode && node.next) {
    shouldIgnore = false;
  }
  if (shouldIgnore && computedStyle.maskMode && computedStyle.opacity > 0) {
    const textureTarget = node.textureTarget[scaleIndex];
    // 轮廓模板如果opacity看不见，那么整个包含蒙版都看不见，如果visible看不见，仅自身看不见，还有可能未形成mask内容（被遮罩未加载）
    if (computedStyle.maskMode === MASK.OUTLINE) {
      if (computedStyle.visible) {
        shouldIgnore = false;
      }
      else if (textureTarget !== node.textureTotal[scaleIndex] && textureTarget !== node.textureCache[scaleIndex]) {
        shouldIgnore = false;
      }
    }
    // alpha，visible仅影响自身且自身一定不显示
    else if (computedStyle.maskMode === MASK.ALPHA && node.next) {
      if (textureTarget !== node.textureTotal[scaleIndex] && textureTarget !== node.textureCache[scaleIndex]) {
        shouldIgnore = false;
      }
    }
  }
  if (shouldIgnore && isBgBlur && computedStyle.visible) {
    shouldIgnore = false;
  }
  return { shouldIgnore, isBgBlur };
}

function setValid(merge: Merge) {
  merge.valid = true;
  const subList = merge.subList;
  while (subList.length) {
    const t = subList.pop()!;
    t.valid = true;
    const subList2 = t.subList;
    while (subList2.length) {
      subList.push(subList2.pop()!);
    }
  }
}
