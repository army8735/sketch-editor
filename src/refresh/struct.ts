import simpleVert from '../gl/simple.vert';
import gaussFrag from '../gl/gauss.frag';
import {
  bbox2Coords,
  bindTexture,
  createTexture,
  drawBgBlur,
  drawColorMatrix,
  drawGauss,
  drawMask,
  drawMbm,
  drawTextureCache,
  drawTint,
  initShaders,
} from '../gl/webgl';
import { gaussianWeight, kernelSize, outerSizeByD } from '../math/blur';
import { d2r, isRectsOverlap } from '../math/geom';
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
import ArtBoard from '../node/ArtBoard';
import Polyline from '../node/geom/Polyline';
import ShapeGroup from '../node/geom/ShapeGroup';
import Node from '../node/Node';
import Root from '../node/Root';
import Text from '../node/Text';
import Group from '../node/Group';
import { color2gl } from '../style/css';
import { BLUR, ComputedBlur, ComputedShadow, ComputedStyle, FILL_RULE, MASK, MIX_BLEND_MODE, } from '../style/define';
import inject from '../util/inject';
import config from './config';
import { RefreshLevel } from './level';
import { canvasPolygon } from './paint';
import TextureCache from './TextureCache';
import Geom from '../node/geom/Geom';
import Bitmap from '../node/Bitmap';
import { calMatrixByOrigin } from '../style/transform';

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
  valid: boolean;
  subList: Array<Merge>; // 子节点在可视范围外无需merge但父节点在内需要强制子节点merge
  isNew: boolean; // 新生成的merge，老的要么有merge结果，要么可视范围外有tempBbox
  isTop: boolean; // 是否是最上层，当嵌套时子Merge不是顶层
};

export function renderWebgl(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
) {
  // 由于没有scale变换，所有节点都是通用的，最小为1，然后2的幂次方递增
  let scale = root.getCurPageZoom(),
    scaleIndex = 0;
  if (scale < 1.1) {
    scale = 1;
  } else {
    let n = 2;
    scaleIndex = 1;
    while (n < scale) {
      n = n << 1;
      scaleIndex++;
    }
    if (n > 2) {
      const m = (n >> 1) * 1.1;
      // 看0.5n和n之间scale更靠近哪一方（0.5n*1.1分界线），就用那个放大数
      if (scale >= m) {
        scale = n;
      } else {
        scale = n >> 1;
        scaleIndex--;
      }
    } else {
      scale = n;
    }
  }
  const { structs, width: W, height: H } = root;
  const cx = W * 0.5,
    cy = H * 0.5;
  const mergeList: Array<Merge> = [],
    mergeHash: Array<Merge> = [];
  // 先计算内容matrix等，如果有需要merge合并汇总的记录下来
  for (let i = 0, len = structs.length; i < len; i++) {
    const { node, lv, total } = structs[i];
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
      (blur.t === BLUR.GAUSSIAN && blur.radius > 0 ||
      blur.t === BLUR.BACKGROUND && (blur.radius > 0 || blur.saturation !== 0)) &&
      (!textureFilter[scaleIndex] || !textureFilter[scaleIndex]?.available);
    const needMask =
      maskMode > 0 &&
      !!node.next &&
      (!textureMask[scaleIndex] || !textureMask[scaleIndex]?.available);
    const needColor = hueRotate || saturate !== 1 || brightness !== 1 || contrast !== 1;
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
  }
  // console.warn(mergeList);
  // 根据收集的需要合并局部根的索引，尝试合并，按照层级从大到小，索引从小到大的顺序，即从叶子节点开始后根遍历
  if (mergeList.length) {
    mergeList.sort(function (a, b) {
      if (a.lv === b.lv) {
        return b.i - a.i;
      }
      return b.lv - a.lv;
    });
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
      const { subList, node, isTop } = item;
      if (isTop) {
        if (checkInScreen(node.tempBbox!, node.matrixWorld, W, H)) {
          item.valid = true;
          // 检查子节点中是否有因为可视范围外暂时忽略的，全部标记valid，这个循环会把数据集中到最上层subList，后面反正不再用了
          while (subList.length) {
            const t = subList.pop()!;
            t.valid = true;
            const subList2 = t.subList;
            while (subList2.length) {
              subList.push(subList2.pop()!);
            }
          }
        }
      }
    }
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
      // 先尝试生成此节点汇总纹理，无论是什么效果，都是对汇总后的起效，单个节点的绘制等于本身纹理缓存
      const t = genTotal(
        gl,
        root,
        node,
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
        node.textureTotal[scaleIndex] = node.textureTarget[scaleIndex] = t;
      }
      // 生成filter，这里直接进去，如果没有filter会返回空，group的tint也视作一种filter
      if (node.textureTarget[scaleIndex]) {
        const t = genFilter(
          gl,
          root,
          node,
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
          node.textureFilter[scaleIndex] = node.textureTarget[scaleIndex] = t;
        }
      }
      // 生成mask
      if (maskMode && node.next) {
        // 可能超过尺寸没有total汇总，暂时防御下
        if (node.textureTarget[scaleIndex]) {
          node.textureMask[scaleIndex] = node.textureTarget[scaleIndex] =
            genMask(
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
        }
      }
    }
  }
  const programs = root.programs;
  // 先渲染artBoard的默认背景色即白色到底层，非默认则是自定义按照普通内容渲染不走这里
  const page = root.lastPage;
  if (page) {
    const children = page.children,
      len = children.length;
    // 背景色分开来
    for (let i = 0; i < len; i++) {
      const artBoard = children[i];
      if (artBoard instanceof ArtBoard) {
        artBoard.renderBgc(gl, cx, cy);
      }
    }
  }
  // 所有内容都渲染到离屏frameBuffer上，最后再绘入主画布，因为中间可能出现需要临时混合运算的mixBlendMode/backgroundBlur
  let resTexture = createTexture(gl, 0, undefined, W, H);
  const resFrameBuffer = genFrameBufferWithTexture(gl, resTexture, W, H);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  // 一般都存在，除非root改逻辑在只有自己的时候进行渲染，进入overlay后就是上层自定义内容而非sketch内容了
  const overlay = root.overlay!;
  let isOverlay = false;
  const program = programs.program;
  gl.useProgram(programs.program);
  // 世界opacity和matrix不一定需要重算，有可能之前调用算过了有缓存
  let hasCacheOp = false,
    hasCacheMw = false;
  // 循环收集数据，同一个纹理内的一次性给出，只1次DrawCall
  for (let i = 0, len = structs.length; i < len; i++) {
    const { node, total, next } = structs[i];
    // 特殊的工具覆盖层，如画板名称，同步更新translate直接跟着画板位置刷新
    if (overlay && overlay === node) {
      overlay.update();
      isOverlay = true;
    }
    // 不可见和透明的跳过，但要排除mask，有背景模糊的合法节点如果是透明也不能跳过，mask和背景模糊互斥，优先mask
    const computedStyle = node.computedStyle;
    const { shouldIgnore, isBgBlur } = shouldIgnoreAndIsBgBlur(node, computedStyle);
    if (shouldIgnore) {
      i += total + next;
      continue;
    }
    // 继承父的opacity和matrix，仍然要注意root没有parent
    const { parent, textureTarget } = node;
    // 第一个是Root层级0
    if (!i) {
      hasCacheOp = node.hasCacheOp;
      hasCacheMw = node.hasCacheMw;
    } else {
      hasCacheOp = node.hasCacheOp && node.parentOpId === parent!.localOpId;
      hasCacheMw = node.hasCacheMw && node.parentMwId === parent!.localMwId;
    }
    // opacity和matrix的世界计算，父子相乘
    if (!hasCacheOp) {
      node._opacity = parent
        ? parent._opacity * node.computedStyle.opacity
        : node.computedStyle.opacity;
      if (parent) {
        node.parentOpId = parent.localOpId;
      }
      node.hasCacheOp = true;
    }
    if (!hasCacheMw) {
      assignMatrix(
        node._matrixWorld,
        parent ? multiply(parent._matrixWorld, node.matrix) : node.matrix,
      );
      if (parent) {
        node.parentMwId = parent.localMwId;
      }
      if (node.hasCacheMw) {
        node.localMwId++;
      }
      node.hasCacheMw = true;
    }

    const opacity = node._opacity;
    const matrix = node._matrixWorld;
    // overlay上的没有高清要忽略
    if (isOverlay) {
      let target = textureTarget[0];
      if (!target && node.hasContent) {
        node.genTexture(gl, 1, 0);
        target = textureTarget[0];
      }
      if (target) {
        const isInScreen = checkInScreen(target.bbox, matrix, W, H);
        if (isInScreen) {
          drawTextureCache(
            gl,
            cx,
            cy,
            program,
            [
              {
                opacity,
                matrix,
                bbox: target.bbox,
                texture: target.texture,
              },
            ],
            0,
            0,
            false,
          );
        }
      }
    }
    // 真正的Page内容有高清考虑
    else {
      let target = textureTarget[scaleIndex],
        isInScreen = false;
      // 有merge的直接判断是否在可视范围内，合成结果在merge中做了，可能超出范围不合成
      if (target) {
        isInScreen = checkInScreen(target.bbox, matrix, W, H);
      }
      // 无merge的是单个节点，判断是否有内容以及是否在可视范围内
      else {
        if (node.hasContent) {
          isInScreen = checkInScreen(
            node._filterBbox || node.filterBbox,
            matrix,
            W,
            H,
          );
          if (isInScreen) {
            node.genTexture(gl, scale, scaleIndex);
            target = textureTarget[scaleIndex];
          }
        }
      }
      if (isInScreen && target) {
        const { mixBlendMode, blur } = computedStyle;
        /**
         * 背景模糊是个很特殊的渲染，将当前节点区域和主画布重合的地方裁剪出来，
         * 先进行模糊/饱和度调整，再替换回主画布区域。
         * sketch中group无法设置，只能对单个节点（包括ShapeGroup）的轮廓进行类似轮廓蒙版的重合裁剪，
         * 并且它的text也无法设置，这里考虑增加text的支持，因为轮廓比较容易实现
         */
        if (isBgBlur) {
          const outline = node.textureOutline = genOutline(
            gl,
            node,
            structs,
            i,
            total,
            target.bbox,
            scale,
          );
          resTexture = genBgBlur(
            gl,
            resTexture,
            node,
            outline!,
            blur,
            programs,
            scale,
            cx,
            cy,
            W,
            H,
          );
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            resTexture,
            0,
          );
        }
        let tex: WebGLTexture | undefined;
        // 有mbm先将本节点内容绘制到和root同尺寸纹理上
        if (mixBlendMode !== MIX_BLEND_MODE.NORMAL) {
          tex = createTexture(gl, 0, undefined, W, H);
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
              bbox: target.bbox,
              texture: target.texture,
            },
          ],
          0,
          0,
          false,
        );
        // 这里才是真正生成mbm
        if (mixBlendMode !== MIX_BLEND_MODE.NORMAL) {
          resTexture = genMbm(
            gl,
            resTexture!,
            tex!,
            mixBlendMode,
            programs,
            W,
            H,
          );
        }
      }
      // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
      if (
        (target && target !== node.textureCache[scaleIndex]) ||
        node.isShapeGroup
      ) {
        i += total + next;
      }
    }
  }
  // 再覆盖渲染artBoard的阴影和标题
  if (page) {
    const children = page.children,
      len = children.length;
    // boxShadow用统一纹理
    if (root.artBoardShadowTexture) {
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
      bindTexture(gl, root.artBoardShadowTexture, 0);
      // 渲染并销毁
      gl.drawArrays(gl.TRIANGLES, 0, count * 48);
      gl.deleteBuffer(pointBuffer);
      gl.deleteBuffer(texBuffer);
      gl.disableVertexAttribArray(a_position);
      gl.disableVertexAttribArray(a_texCoords);
      gl.useProgram(program);
    } else {
      const img = inject.IMG[ArtBoard.BOX_SHADOW];
      // 一般首次不可能有缓存，太特殊的base64了
      if (img && img.source) {
        root.artBoardShadowTexture = createTexture(gl, 0, img.source);
        root.addUpdate(
          overlay,
          [],
          RefreshLevel.REPAINT,
          false,
          false,
          undefined,
        );
      } else {
        inject.measureImg(ArtBoard.BOX_SHADOW, (res: any) => {
          root.artBoardShadowTexture = createTexture(gl, 0, res.source);
          root.addUpdate(
            overlay,
            [],
            RefreshLevel.REPAINT,
            false,
            false,
            undefined,
          );
        });
      }
    }
  }
  // 最后将离屏离屏frameBuffer绘入画布
  releaseFrameBuffer(gl, resFrameBuffer, W, H);
  drawTextureCache(
    gl,
    cx,
    cy,
    program,
    [
      {
        opacity: 1,
        bbox: new Float64Array([0, 0, W, H]),
        texture: resTexture!,
      },
    ],
    0,
    0,
    true,
  );
}

/**
 * 汇总作为局部根节点的bbox，注意作为根节点自身不会包含filter/mask等，所以用rect，其子节点则是需要考虑的
 * 由于根节点视作E且其rect的原点一定是0，因此子节点可以直接使用matrix预乘父节点，不会产生transformOrigin偏移
 */
function genBboxTotal(
  structs: Array<Struct>,
  node: Node,
  index: number,
  total: number,
  isNew: boolean,
  scaleIndex: number,
  merge: Merge,
  mergeHash: Array<Merge>,
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
      const b = target?.bbox || node2._filterBbox || node2.filterBbox;
      // 防止空
      if (b[2] - b[0] && b[3] - b[1]) {
        mergeBbox(res, b, m);
      }
    }
    if (
      (target && target !== node2.textureCache[scaleIndex]) ||
      node2.isShapeGroup
    ) {
      i += total2 + next2;
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

function mergeBbox(bbox: Float64Array, t: Float64Array, matrix: Float64Array) {
  let [x1, y1, x2, y2] = t;
  if (!isE(matrix)) {
    const t1 = calPoint({ x: x1, y: y1 }, matrix);
    const t2 = calPoint({ x: x1, y: y2 }, matrix);
    const t3 = calPoint({ x: x2, y: y1 }, matrix);
    const t4 = calPoint({ x: x2, y: y2 }, matrix);
    x1 = Math.min(t1.x, t2.x, t3.x, t4.x);
    y1 = Math.min(t1.y, t2.y, t3.y, t4.y);
    x2 = Math.max(t1.x, t2.x, t3.x, t4.x);
    y2 = Math.max(t1.y, t2.y, t3.y, t4.y);
  }
  bbox[0] = Math.min(bbox[0], x1);
  bbox[1] = Math.min(bbox[1], y1);
  bbox[2] = Math.max(bbox[2], x2);
  bbox[3] = Math.max(bbox[3], y2);
}

function genTotal(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  node: Node,
  structs: Array<Struct>,
  index: number,
  lv: number,
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
  // 单个叶子节点也不需要，就是本身节点的内容
  if (!total) {
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
  let w = bbox[2] - x,
    h = bbox[3] - y;
  while (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
    ) {
    if (scale <= 1) {
      break;
    }
    scale = scale >> 1;
  }
  if (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE ||
    !w ||
    !h
  ) {
    return;
  }
  const dx = -x,
    dy = -y;
  w *= scale;
  h *= scale;
  const cx = w * 0.5,
    cy = h * 0.5;
  const target = TextureCache.getEmptyInstance(gl, bbox, scale);
  const frameBuffer = genFrameBufferWithTexture(gl, target.texture, w, h);
  // 和主循环很类似的，但是以此节点为根视作opacity=1和matrix=E
  for (let i = index, len = index + total + 1; i < len; i++) {
    const { node: node2, total: total2, next: next2 } = structs[i];
    const computedStyle = node2.computedStyle;
    if (!computedStyle.visible || computedStyle.opacity <= 0) {
      i += total2 + next2;
      continue;
    }
    let opacity, matrix;
    // 首个节点即局部根节点，需要考虑scale放大
    if (i === index) {
      opacity = node2.tempOpacity = 1;
      toE(node2.tempMatrix);
      matrix = multiplyScale(node2.tempMatrix, scale);
    }
    // 子节点的matrix计算比较复杂，可能dx/dy不是0原点，造成transformOrigin偏移需重算matrix
    else {
      const parent = node2.parent!;
      opacity = computedStyle.opacity * parent.tempOpacity;
      node2.tempOpacity = opacity;
      if (dx || dy) {
        const transform = node2.transform;
        const tfo = computedStyle.transformOrigin;
        const t = calMatrixByOrigin(transform, tfo[0] + dx, tfo[1] + dy);
        matrix = multiply(parent.tempMatrix, t);
      } else {
        matrix = multiply(parent.tempMatrix, node2.matrix);
      }
      assignMatrix(node2.tempMatrix, matrix);
    }
    let target2 = node2.textureTarget[scaleIndex];
    // 可能没生成，存在于一开始在可视范围外的节点情况，且当时也没有进行合成
    if (!target2 && node2.hasContent) {
      node2.genTexture(gl, scale, scaleIndex);
      target2 = node2.textureTarget[scaleIndex];
    }
    if (target2) {
      const mixBlendMode = computedStyle.mixBlendMode;
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
            bbox: target2.bbox,
            texture: target2.texture,
          },
        ],
        dx,
        dy,
        false,
      );
      // 这里才是真正生成mbm
      if (mixBlendMode !== MIX_BLEND_MODE.NORMAL && tex) {
        target.texture = genMbm(
          gl,
          target.texture,
          tex,
          mixBlendMode,
          programs,
          w,
          h,
        );
      }
    }
    // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    if (
      (target2 && target2 !== node2.textureCache[scaleIndex]) ||
      node2.isShapeGroup
    ) {
      i += total2 + next2;
    }
  }
  // 删除fbo恢复
  releaseFrameBuffer(gl, frameBuffer, W, H);
  return target;
}

function genFilter(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  node: Node,
  structs: Array<Struct>,
  index: number,
  lv: number,
  total: number,
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
        scale,
      );
    }
  }
  const sd: ComputedShadow[] = [];
  shadow.forEach((item, i) => {
    if (shadowEnable[i] && item.color[3] > 0) {
      sd.push(item);
    }
  });
  // 2种阴影不能互相干扰，因此都以原本图像为基准生成，最后统一绘入原图
  if (sd.length) {
    res = genShadow(
      gl,
      root,
      res || source,
      sd,
      W,
      H,
      scale,
    );
  }
  // 高斯模糊
  if (blur.t === BLUR.GAUSSIAN && blur.radius) {
    res = genGaussBlur(
      gl,
      root,
      res || source,
      blur.radius,
      W,
      H,
      scale,
    );
  }
  // 颜色调整
  if (hueRotate || saturate !== 1 || brightness !== 1 || contrast !== 1) {
    res = genColorMatrix(
      gl,
      root,
      res || source,
      hueRotate,
      saturate,
      brightness,
      contrast,
      W,
      H,
      scale,
    );
  }
  return res;
}

/**
 * https://www.w3.org/TR/2018/WD-filter-effects-1-20181218/#feGaussianBlurElement
 * 按照css规范的优化方法执行3次，避免卷积核d扩大3倍性能慢
 * 规范的优化方法对d的值分奇偶优化，这里再次简化，d一定是奇数，即卷积核大小
 * 先动态生成gl程序，默认3核源码示例已注释，根据sigma获得d（一定奇数），再计算权重
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
  const d = kernelSize(sigma * scale);
  const spread = outerSizeByD(d);
  const bbox = textureTarget.bbox.slice(0);
  bbox[0] -= spread;
  bbox[1] -= spread;
  bbox[2] += spread;
  bbox[3] += spread;
  // 写到一个扩展好尺寸的tex中方便后续处理
  const x = bbox[0],
    y = bbox[1];
  let w = bbox[2] - bbox[0],
    h = bbox[3] - bbox[1];
  while (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
    ) {
    if (scale <= 1) {
      break;
    }
    scale = scale >> 1;
  }
  if (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
  ) {
    return;
  }
  const programs = root.programs;
  const program = programs.program;
  const dx = -x,
    dy = -y;
  w *= scale;
  h *= scale;
  const cx = w * 0.5,
    cy = h * 0.5;
  const target = TextureCache.getEmptyInstance(gl, bbox, scale);
  const frameBuffer = genFrameBufferWithTexture(gl, target.texture, w, h);
  const matrix = multiplyScale(identity(), scale);
  // 原本内容绘入扩展好的
  drawTextureCache(
    gl,
    cx,
    cy,
    program,
    [
      {
        opacity: 1,
        matrix,
        bbox: textureTarget.bbox,
        texture: textureTarget.texture,
      },
    ],
    dx,
    dy,
    false,
  );
  // 再建一个空白尺寸纹理，2个纹理互相写入对方，循环3次模糊，水平垂直分开
  const programGauss = genBlurShader(gl, programs, sigma * scale, d);
  gl.useProgram(programGauss);
  const res = drawGauss(gl, programGauss, target.texture, w, h);
  gl.deleteTexture(target.texture);
  target.texture = res;
  // 删除fbo恢复
  gl.useProgram(program);
  releaseFrameBuffer(gl, frameBuffer, W, H);
  return target;
}

function genBlurShader(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  programs: any,
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
  scale: number,
) {
  const bbox = textureTarget.bbox.slice(0);
  let w = bbox[2] - bbox[0],
    h = bbox[3] - bbox[1];
  while (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
    ) {
    if (scale <= 1) {
      break;
    }
    scale = scale >> 1;
  }
  if (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
  ) {
    return;
  }
  w *= scale;
  h *= scale;
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
      0.213 + cosR * 0.787 - sinR * 0.213, 0.715 - cosR * 0.715 - sinR * 0.715, 0.072 - cosR * 0.072 + sinR * 0.928, 0, 0,
      0.213 - cosR * 0.213 + sinR * 0.143, 0.715 + cosR * 0.285 + sinR * 0.140, 0.072 - cosR * 0.072 - sinR * 0.283, 0, 0,
      0.213 - cosR * 0.213 - sinR * 0.787, 0.715 - cosR * 0.715 + sinR * 0.715, 0.072 + cosR * 0.928 + sinR * 0.072, 0, 0,
      0, 0, 0, 1, 0,
    ];
    const old = res;
    res = TextureCache.getEmptyInstance(gl, bbox, scale);
    frameBuffer = frameBuffer || genFrameBufferWithTexture(gl, res.texture, w, h);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      res.texture,
      0,
    );
    drawColorMatrix(gl, cmProgram, old.texture, m);
    if (old !== textureTarget) {
      old.release();
    }
  }
  if (saturate !== 1) {
    const m = [
      0.213 + 0.787 * saturate,  0.715 - 0.715 * saturate, 0.072 - 0.072 * saturate, 0, 0,
      0.213 - 0.213 * saturate,  0.715 + 0.285 * saturate, 0.072 - 0.072 * saturate, 0, 0,
      0.213 - 0.213 * saturate,  0.715 - 0.715 * saturate, 0.072 + 0.928 * saturate, 0, 0,
      0, 0, 0, 1, 0,
    ];
    const old = res;
    res = TextureCache.getEmptyInstance(gl, bbox, scale);
    frameBuffer = frameBuffer || genFrameBufferWithTexture(gl, res.texture, w, h);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      res.texture,
      0,
    );
    drawColorMatrix(gl, cmProgram, old.texture, m);
    if (old !== textureTarget) {
      old.release();
    }
  }
  if (brightness !== 1) {
    const b = brightness;
    const m = [
      1, 0, 0, 0, b - 1,
      0, 1, 0, 0, b - 1,
      0, 0, 1, 0, b - 1,
      0, 0, 0, 1, 0,
    ];
    const old = res;
    res = TextureCache.getEmptyInstance(gl, bbox, scale);
    frameBuffer = frameBuffer || genFrameBufferWithTexture(gl, res.texture, w, h);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      res.texture,
      0,
    );
    drawColorMatrix(gl, cmProgram, old.texture, m);
    if (old !== textureTarget) {
      old.release();
    }
  }
  if (contrast !== 1) {
    const a = contrast;
    const o = -0.5 * a + 0.5;
    const m = [
      a, 0, 0, 0, o,
      0, a, 0, 0, o,
      0, 0, a, 0, o,
      0, 0, 0, 1, 0,
    ];
    const old = res;
    res = TextureCache.getEmptyInstance(gl, bbox, scale);
    frameBuffer = frameBuffer || genFrameBufferWithTexture(gl, res.texture, w, h);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      res.texture,
      0,
    );
    drawColorMatrix(gl, cmProgram, old.texture, m);
    if (old !== textureTarget) {
      old.release();
    }
  }
  gl.useProgram(programs.program);
  if (frameBuffer) {
    releaseFrameBuffer(gl, frameBuffer, W, H);
  }
  return res;
}

function genTint(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  textureTarget: TextureCache,
  tint: number[],
  opacity: number,
  W: number,
  H: number,
  scale: number,
) {
  const bbox = textureTarget.bbox.slice(0);
  let w = bbox[2] - bbox[0],
    h = bbox[3] - bbox[1];
  while (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
    ) {
    if (scale <= 1) {
      break;
    }
    scale = scale >> 1;
  }
  if (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
  ) {
    return;
  }
  w *= scale;
  h *= scale;
  const programs = root.programs;
  const tintProgram = programs.tintProgram;
  gl.useProgram(tintProgram);
  const res = TextureCache.getEmptyInstance(gl, bbox, scale);
  const frameBuffer = genFrameBufferWithTexture(gl, res.texture, w, h);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    res.texture,
    0,
  );
  drawTint(gl, tintProgram, textureTarget.texture, tint, opacity);
  gl.useProgram(programs.program);
  releaseFrameBuffer(gl, frameBuffer, W, H);
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
  const bbox = textureTarget.bbox.slice(0);
  const sb = [0, 0, 0, 0];
  for (let i = 0, len = shadow.length; i < len; i++) {
    const item = shadow[i];
    const d = kernelSize(item.blur * scale * 0.5);
    const spread = outerSizeByD(d);
    // 除了模糊增量还需考虑偏移增量
    if (item.x || item.y || spread) {
      sb[0] = Math.min(sb[0], item.x - spread);
      sb[1] = Math.min(sb[1], item.y - spread);
      sb[2] = Math.max(sb[2], item.x + spread);
      sb[3] = Math.max(sb[3], item.y + spread);
    }
  }
  bbox[0] += sb[0];
  bbox[1] += sb[1];
  bbox[2] += sb[2];
  bbox[3] += sb[3];
  // 写到一个扩展好尺寸的tex中方便后续处理
  const x = bbox[0],
    y = bbox[1];
  let w = bbox[2] - bbox[0],
    h = bbox[3] - bbox[1];
  while (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
    ) {
    if (scale <= 1) {
      break;
    }
    scale = scale >> 1;
  }
  if (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
  ) {
    return;
  }
  const programs = root.programs;
  const program = programs.program;
  const dx = -x,
    dy = -y;
  w *= scale;
  h *= scale;
  const cx = w * 0.5,
    cy = h * 0.5;
  // 扩展好尺寸的原节点纹理
  const target = TextureCache.getEmptyInstance(gl, bbox, scale);
  const frameBuffer = genFrameBufferWithTexture(gl, target.texture, w, h);
  const matrix = multiplyScale(identity(), scale);
  drawTextureCache(
    gl,
    cx,
    cy,
    program,
    [
      {
        opacity: 1,
        matrix,
        bbox: textureTarget.bbox,
        texture: textureTarget.texture,
      },
    ],
    dx,
    dy,
    false,
  );
  // 使用这个尺寸的纹理，遍历shadow，仅生成shadow部分
  const dropShadowProgram = programs.dropShadowProgram;
  const vtPoint = new Float32Array(8);
  const vtTex = new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]);
  const list = shadow.map((item) => {
    gl.useProgram(dropShadowProgram);
    // 先生成无blur的
    const temp = TextureCache.getEmptyInstance(gl, bbox, scale);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      temp.texture,
      0,
    );
    // 这里顶点计算需要考虑shadow本身的偏移，将其加到dx/dy上即可
    const { t1, t2, t3, t4 } = bbox2Coords(
      bbox,
      cx,
      cy,
      dx + item.x,
      dy + item.y,
      false,
      matrix,
    );
    vtPoint[0] = t1.x;
    vtPoint[1] = t1.y;
    vtPoint[2] = t4.x;
    vtPoint[3] = t4.y;
    vtPoint[4] = t2.x;
    vtPoint[5] = t2.y;
    vtPoint[6] = t3.x;
    vtPoint[7] = t3.y;
    // 顶点buffer
    const pointBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
    const a_position = gl.getAttribLocation(dropShadowProgram, 'a_position');
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);
    // 纹理buffer
    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
    let a_texCoords = gl.getAttribLocation(dropShadowProgram, 'a_texCoords');
    gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_texCoords);
    // 纹理单元
    bindTexture(gl, target.texture, 0);
    const u_texture = gl.getUniformLocation(dropShadowProgram, 'u_texture');
    gl.uniform1i(u_texture, 0);
    // shadow颜色
    const u_color = gl.getUniformLocation(dropShadowProgram, 'u_color');
    const color = color2gl(item.color);
    const a = color[3];
    gl.uniform4f(u_color, color[0] * a, color[1] * a, color[2] * a, a);
    // 渲染并销毁
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.deleteBuffer(pointBuffer);
    gl.deleteBuffer(texBuffer);
    gl.disableVertexAttribArray(a_position);
    gl.disableVertexAttribArray(a_texCoords);
    // 有blur再生成
    if (item.blur > 0) {
      const sigma = item.blur * scale * 0.5;
      const d = kernelSize(sigma);
      const programGauss = genBlurShader(
        gl,
        programs,
        sigma,
        d,
      );
      gl.useProgram(programGauss);
      const res = drawGauss(gl, programGauss, temp.texture, w, h);
      temp.release();
      return res;
    }
    return temp.texture;
  });
  // 将生成的shadow纹理和节点源纹理进行混合
  gl.useProgram(program);
  const target2 = TextureCache.getEmptyInstance(gl, bbox, scale);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    target2.texture,
    0,
  );
  list.forEach((item) => {
    drawTextureCache(
      gl,
      cx,
      cy,
      program,
      [
        {
          opacity: 1,
          matrix,
          bbox,
          texture: item,
        },
      ],
      dx,
      dy,
      false,
    );
    gl.deleteTexture(item);
  });
  drawTextureCache(
    gl,
    cx,
    cy,
    program,
    [
      {
        opacity: 1,
        matrix,
        bbox: target.bbox,
        texture: target.texture,
      },
    ],
    dx,
    dy,
    false,
  );
  target.release();
  gl.useProgram(program);
  // 删除fbo恢复
  releaseFrameBuffer(gl, frameBuffer, W, H);
  return target2;
}

function genMask(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  node: Node,
  maskMode: MASK,
  structs: Array<Struct>,
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
  // 可能是个单叶子节点，mask申明无效；或者因为可视范围外还未生成汇总total
  if (!node.next || !node.textureTarget[scaleIndex]) {
    return node.textureTarget[scaleIndex];
  }
  const textureTarget = node.textureTarget[scaleIndex]!;
  const programs = root.programs;
  const program = programs.program;
  // 创建一个空白纹理来绘制，尺寸由于bbox已包含整棵子树内容可以直接使用
  const bbox = textureTarget.bbox;
  const { matrix, computedStyle } = node;
  const x = bbox[0],
    y = bbox[1];
  let w = bbox[2] - x,
    h = bbox[3] - y;
  while (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
    ) {
    if (scale <= 1) {
      break;
    }
    scale = scale >> 1;
  }
  if (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
  ) {
    return;
  }
  const dx = -x,
    dy = -y;
  w *= scale;
  h *= scale;
  const cx = w * 0.5,
    cy = h * 0.5;
  let summary = createTexture(gl, 0, undefined, w, h);
  const frameBuffer = genFrameBufferWithTexture(gl, summary, w, h);
  const m = identity();
  assignMatrix(m, matrix);
  multiplyScale(m, 1 / scale);
  // 作为mask节点视作E，next后的节点要除以它的matrix即点乘逆矩阵
  const im = inverse(m);
  // 先循环收集此节点后面的内容汇总，直到结束或者打断mask
  for (let i = index + total + 1, len = structs.length; i < len; i++) {
    const { node: node2, lv: lv2, total: total2, next: next2 } = structs[i];
    const computedStyle = node2.computedStyle;
    // mask只会影响next同层级以及其子节点，跳出后实现（比如group结束）
    if (lv > lv2) {
      node.struct.next = i - index - total - 1;
      break;
    } else if (i === len || (computedStyle.breakMask && lv === lv2)) {
      node.struct.next = i - index - total - 1;
      break;
    }
    // 需要保存引用，当更改时取消mask节点的缓存重新生成
    node2.mask = node;
    // 这里和主循环类似，不可见或透明考虑跳过，但mask和背景模糊特殊对待
    const { shouldIgnore } = shouldIgnoreAndIsBgBlur(node, computedStyle);
    if (shouldIgnore) {
      i += total2 + next2;
      continue;
    }
    let opacity, matrix;
    // 同层级的next作为特殊的局部根节点，注意dx/dy偏移对transformOrigin的影响
    if (lv === lv2) {
      opacity = node2.tempOpacity = computedStyle.opacity;
      if (dx || dy) {
        const transform = node2.transform;
        const tfo = computedStyle.transformOrigin;
        const t = calMatrixByOrigin(transform, tfo[0] + dx, tfo[1] + dy);
        matrix = multiply(im, t);
      } else {
        matrix = multiply(im, node2.matrix);
      }
      assignMatrix(node2.tempMatrix, matrix);
    } else {
      const parent = node2.parent!;
      opacity = computedStyle.opacity * parent.tempOpacity;
      node2.tempOpacity = opacity;
      if (dx || dy) {
        const transform = node2.transform;
        const tfo = computedStyle.transformOrigin;
        const t = calMatrixByOrigin(transform, tfo[0] + dx, tfo[1] + dy);
        matrix = multiply(parent.tempMatrix, t);
      }
      else {
        matrix = multiply(parent.tempMatrix, node2.matrix);
      }
      assignMatrix(node2.tempMatrix, matrix);
    }
    let target2 = node2.textureTarget[scaleIndex];
    // 可能没生成，存在于一开始在可视范围外的节点情况，且当时也没有进行合成
    if (!target2 && node2.hasContent) {
      node2.genTexture(gl, scale, scaleIndex);
      target2 = node2.textureTarget[scaleIndex];
    }
    if (target2) {
      const mixBlendMode = computedStyle.mixBlendMode;
      let tex: WebGLTexture | undefined;
      // 有mbm先将本节点内容绘制到同尺寸纹理上
      if (mixBlendMode !== MIX_BLEND_MODE.NORMAL && i > index + 1) {
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
            bbox: target2.bbox,
            texture: target2.texture,
          },
        ],
        dx,
        dy,
        false,
      );
      // 这里才是真正生成mbm
      if (mixBlendMode !== MIX_BLEND_MODE.NORMAL && tex) {
        summary = genMbm(
          gl,
          summary,
          tex,
          mixBlendMode,
          programs,
          w,
          h,
        );
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          summary,
          0,
        );
      }
    }
    // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
    if (
      (target2 && target2 !== node2.textureCache[scaleIndex]) ||
      node2.isShapeGroup
    ) {
      i += total2 + next2;
    }
  }
  const target = TextureCache.getEmptyInstance(gl, bbox, scale);
  const maskProgram = programs.maskProgram;
  gl.useProgram(maskProgram);
  // alpha直接应用，汇总乘以mask本身的alpha即可
  if (maskMode === MASK.ALPHA) {
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      target.texture,
      0,
    );
    drawMask(gl, maskProgram, textureTarget.texture, summary);
    gl.useProgram(program);
  }
  // 轮廓需收集mask的轮廓并渲染出来，作为遮罩应用，再底部叠加自身非轮廓内容
  else if (maskMode === MASK.OUTLINE) {
    const outline = node.textureOutline = genOutline(
      gl,
      node,
      structs,
      index,
      total,
      bbox,
      scale,
    );
    const temp = TextureCache.getEmptyInstance(gl, bbox, scale);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      temp.texture,
      0,
    );
    drawMask(gl, maskProgram, outline!.texture, summary);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      null,
      0,
    );
    // 将mask本身和汇总应用的mask内容绘制到一起
    gl.useProgram(program);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      target.texture,
      0,
    );
    toE(node.tempMatrix);
    multiplyScale(node.tempMatrix, scale);
    // mask本身可能不可见
    if (computedStyle.visible && computedStyle.opacity > 0) {
      drawTextureCache(
        gl,
        cx,
        cy,
        program,
        [
          {
            opacity: 1,
            matrix: node.tempMatrix,
            bbox: textureTarget.bbox,
            texture: textureTarget.texture,
          },
        ],
        dx,
        dy,
        false,
      );
    }
    drawTextureCache(
      gl,
      cx,
      cy,
      program,
      [
        {
          opacity: 1,
          matrix: node.tempMatrix,
          bbox: temp.bbox,
          texture: temp.texture,
        },
      ],
      dx,
      dy,
      false,
    );
    temp.release();
  }
  // 删除fbo恢复
  gl.deleteTexture(summary);
  releaseFrameBuffer(gl, frameBuffer, W, H);
  return target;
}

// 创建一个和画布一样大的纹理，将画布和即将mbm混合的节点作为输入，结果重新赋值给画布
function genMbm(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  tex1: WebGLTexture,
  tex2: WebGLTexture,
  mixBlendMode: MIX_BLEND_MODE,
  programs: any,
  w: number,
  h: number,
) {
  // 获取对应的mbm程序
  let program: any;
  if (mixBlendMode === MIX_BLEND_MODE.MULTIPLY) {
    program = programs.multiplyProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.SCREEN) {
    program = programs.screenProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.OVERLAY) {
    program = programs.overlayProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.DARKEN) {
    program = programs.darkenProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.LIGHTEN) {
    program = programs.lightenProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.COLOR_DODGE) {
    program = programs.colorDodgeProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.COLOR_BURN) {
    program = programs.colorBurnProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.HARD_LIGHT) {
    program = programs.hardLightProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.SOFT_LIGHT) {
    program = programs.softLightProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.DIFFERENCE) {
    program = programs.differenceProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.EXCLUSION) {
    program = programs.exclusionProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.HUE) {
    program = programs.hueProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.SATURATION) {
    program = programs.saturationProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.COLOR) {
    program = programs.colorProgram;
  } else if (mixBlendMode === MIX_BLEND_MODE.LUMINOSITY) {
    program = programs.luminosityProgram;
  } else {
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
  gl.useProgram(programs.program);
  return res;
}

// 创建一个和画布一样大的纹理，线将画布和节点进行mask操作，保留重合的部分，再进行blur，再和节点进行mask保留重合的部分
function genBgBlur(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  tex: WebGLTexture,
  node: Node,
  target: TextureCache,
  blur: ComputedBlur,
  programs: any,
  scale: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
) {
  // 将节点绘制到一张空画布
  const mask = createTexture(gl, 0, undefined, w, h);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    mask,
    0,
  );
  const program = programs.program;
  drawTextureCache(
    gl,
    cx,
    cy,
    program,
    [
      {
        opacity: 1,
        matrix: node._matrixWorld,
        bbox: target.bbox,
        texture: target.texture,
      },
    ],
    0,
    0,
    false,
  );
  // 画布内容进行blur
  const sigma = blur.radius * scale;
  const d = kernelSize(sigma);
  const programGauss = genBlurShader(gl, programs, sigma, d);
  gl.useProgram(programGauss);
  const blurContent = drawGauss(gl, programGauss, tex, w, h);
  // 将节点视作特殊mask，重合部分使用blur内容，非重合部分使用原本tex内容
  const bgBlurProgram = programs.bgBlurProgram;
  gl.useProgram(bgBlurProgram);
  const res = createTexture(gl, 0, undefined, w, h);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    res,
    0,
  );
  drawBgBlur(gl, bgBlurProgram, mask, tex, blurContent);
  gl.deleteTexture(mask);
  gl.deleteTexture(blurContent);
  gl.deleteTexture(tex);
  gl.useProgram(program);
  return res;
}

function genOutline(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  node: Node,
  structs: Array<Struct>,
  index: number,
  total: number,
  bbox: Float64Array,
  scale: number,
) {
  // 缓存仍然还在直接返回，无需重新生成
  if (node.textureOutline?.available) {
    return node.textureOutline;
  }
  const x = bbox[0],
    y = bbox[1];
  const w = bbox[2] - x,
    h = bbox[3] - y;
  while (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
    ) {
    if (scale <= 1) {
      break;
    }
    scale = scale >> 1;
  }
  if (
    w * scale > config.MAX_TEXTURE_SIZE ||
    h * scale > config.MAX_TEXTURE_SIZE
  ) {
    return;
  }
  // canvas模式特殊的dx和matrix
  const dx = -x * scale,
    dy = -y * scale;
  const os = inject.getOffscreenCanvas(w * scale, h * scale);
  const ctx = os.ctx;
  ctx.fillStyle = '#FFF';
  // 这里循环收集这个作为轮廓mask的节点的所有轮廓，用普通canvas模式填充白色到内容区域
  for (let i = index, len = index + total + 1; i < len; i++) {
    const { node, total, next } = structs[i];
    let matrix;
    if (i === index) {
      matrix = toE(node.tempMatrix);
    } else {
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
      const points = node.points!;
      ctx.beginPath();
      canvasPolygon(ctx, points, scale, dx, dy);
      ctx.closePath();
      ctx.fill(fillRule);
    }
    // 忽略子节点
    else if (node instanceof ShapeGroup) {
      const points = node.points!;
      ctx.beginPath();
      points.forEach((item) => {
        canvasPolygon(ctx, item, scale, dx, dy);
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
            textBox.x * scale + dx,
            (textBox.y + textBox.baseline) * scale + dy,
          );
        }
      }
    }
    // 普通节点就是个矩形，组要跳过子节点
    else {
      ctx.fillRect(dx, dy, node.width * scale, node.height * scale);
      if (node instanceof Group) {
        i += total + next;
      }
    }
  }
  const target = TextureCache.getInstance(gl, os.canvas, bbox);
  os.release();
  return target;
}

function genFrameBufferWithTexture(
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

function releaseFrameBuffer(
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

function checkInScreen(
  bbox: Float64Array,
  matrix: Float64Array,
  width: number,
  height: number,
) {
  const t = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], matrix);
  const { x1, y1, x2, y2, x3, y3, x4, y4 } = t;
  // 不在画布显示范围内忽略，用比较简单的方法，无需太过精确，提高性能
  const xa = Math.min(x1, x2, x3, x4);
  const ya = Math.min(y1, y2, y3, y4);
  const xb = Math.max(x1, x2, x3, x4);
  const yb = Math.max(y1, y2, y3, y4);
  return isRectsOverlap(xa, ya, xb, yb, 0, 0, width, height, true);
}

// 统计mask节点后续关联跳过的数量
function genNextCount(
  node: Node,
  structs: Array<Struct>,
  index: number,
  lv: number,
  total: number,
) {
  for (let i = index + total + 1, len = structs.length; i < len; i++) {
    const { node: node2, lv: lv2, total: total2, next: next2 } = structs[i];
    const computedStyle = node2.computedStyle;
    if (lv > lv2) {
      node.struct.next = i - index - total - 1;
      break;
    } else if (i === len || (computedStyle.breakMask && lv === lv2)) {
      node.struct.next = i - index - total + total2 + next2;
      break;
    }
  }
}

// 不可见和透明的跳过，但要排除mask，有背景模糊的合法节点如果是透明也不能跳过，mask和背景模糊互斥，优先mask
function shouldIgnoreAndIsBgBlur(node: Node, computedStyle: ComputedStyle) {
  const blur = computedStyle.blur;
  const isBgBlur = blur.t === BLUR.BACKGROUND &&
    (blur.radius > 0 || blur.saturation !== 0) &&
    (node instanceof ShapeGroup || node instanceof Geom || node instanceof Bitmap || node instanceof Text);
  let shouldIgnore = !computedStyle.visible || computedStyle.opacity <= 0;
  if (shouldIgnore && computedStyle.maskMode && node.next) {
    shouldIgnore = false;
  }
  if (shouldIgnore && isBgBlur && computedStyle.visible) {
    shouldIgnore = false;
  }
  return { shouldIgnore, isBgBlur };
}
