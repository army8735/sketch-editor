import { bbox2Coords, createTexture, drawTextureCache, } from '../gl/webgl';
import { assignMatrix, calPoint, calRectPoints, identity, inverse, multiply, multiplyScale } from '../math/matrix';
import ArtBoard from '../node/ArtBoard';
import Container from '../node/Container';
import Node from '../node/Node';
import Root from '../node/Root';
import Bitmap from '../node/Bitmap';
import ShapeGroup from '../node/geom/ShapeGroup';
import Slice from '../node/Slice';
import { MASK, MIX_BLEND_MODE, OVERFLOW, VISIBILITY } from '../style/define';
import config from '../util/config';
import {
  checkInRect,
  checkInScreen,
  genBgBlurRoot,
  genFrameBufferWithTexture,
  genMbm,
  genMerge,
  genOutline,
  releaseFrameBuffer,
  shouldIgnoreAndIsBgBlur,
} from './merge';
import Tile from './Tile';
import { isConvexPolygonOverlapRect } from '../math/geom';
import { RefreshLevel } from './level';

export type Struct = {
  node: Node;
  num: number;
  total: number;
  lv: number;
  next: number; // mask使用影响后续的节点数
};

export function renderWebgl(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
) {
  // 由于没有scale变换，所有节点都是通用的，最小为1，然后2的幂次方递增，这里已经考虑了dpi在内
  const sourceScale = root.getCurPageZoom();
  let scale = sourceScale;
  let scaleIndex = 0;
  if (scale <= 1) {
    if (scale === 1) {
      scale = 2; // 50%且dpi为2时文字模糊不清，特殊处理
      scaleIndex = 1;
    }
    else {
      scale = 1;
    }
  }
  else {
    let n = 1;
    while (scale > 1) {
      scale *= 0.5;
      n = n << 1;
      scaleIndex++;
    }
    scale = n;
  }
  root.scale = scale;
  root.scaleIndex = scaleIndex;
  // 再普通遍历渲染
  const { imgLoadList } = root;
  const page = root.lastPage;
  if (config.tile) {
    if (page) {
      renderWebglTile(gl, root, scale, scaleIndex);
    }
    // 可能手动写的特殊场景没有page
    else {
      renderWebglNoTile(gl, root, scale, scaleIndex, sourceScale);
    }
  }
  else {
    renderWebglNoTile(gl, root, scale, scaleIndex, sourceScale);
  }
  // 收集的需要加载的图片在刷新结束后同一进行，防止过程中触发update进而计算影响bbox
  for (let i = 0, len = imgLoadList.length; i < len; i++) {
    imgLoadList[i].loadAndRefresh();
  }
  imgLoadList.splice(0);
}

/**
 * 瓦片渲染和直接渲染逻辑并不相同，需要原本每个渲染节点拆分成块状，即依次判断是否在当前展示的瓦片列表中，
 * 用判断矩形内部矢量法计算，当在某个瓦片中时，以瓦片为FBO坐标系进行渲染。
 * 每个瓦片记录内部共有多少节点，以及多少节点已经渲染（图片等可能未加载，性能原因可能只渲染了一部分），
 * 如果瓦片内部所有节点均已完全渲染使完备状态，设置标识，这样下次就可跳过判断。
 * 当所有瓦片都是完备状态时，甚至可以跳过所有节点的遍历过程，从而增加性能，
 * 当瓦片没有完备时，但有非对应scale（一般是更小即范围更大更模糊）的时，可以暂时先用低清渲染。
 * 画板的overflow:hidden效果也和直接渲染逻辑不同，无法为每个画板设置一个单独的FBO来简单进行，
 * 需要为每个画板计算mask尺寸，每次瓦片渲染都要应用。
 */
function renderWebglTile(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  scale: number,
  scaleIndex: number,
) {
  const { structs, lastPage: page, width: W, height: H, dpi, imgLoadList, tileRecord } = root;
  const { scaleX } = page!.computedStyle;
  const pm = page!.matrixWorld;
  /**
   * 根据缩放、位置、尺寸计算出当前在屏幕内的瓦片，注意scaleT（瓦片专用）是跟随渲染缩放范围的(0.5,1]，
   * 在缩放为100%的时候，scaleB为1*dpi，scaleT为1*dpi，
   * 在缩放为75%的时候，scaleB为1*dpi，scaleT为0.75*dpi，
   * 在缩放为49%的时候，scaleB为0.5*dpi，scaleT为0.98%dpi，
   * 在缩放为150%的时候，scaleB为2*dpi，scaleT为0.75*dpi。
   * 即scaleT始终是page真实缩放占scale比率。
   * 为此，先要求出当前缩放所对应的幂值，在缩放>=100%的时候，它就是scale，
   * 在<100%的时候，由于贴图纹理不再缩小，最低为1，因此需要重新计算。
   * 瓦片是从Page的0/0坐标开始平铺的。
   */
  let scaleP = scaleX;
  let scaleB = 1;
  if (scaleP < 0.5) {
    while (scaleP < 0.5) {
      scaleP *= 2;
      scaleB *= 0.5;
    }
  }
  else {
    scaleB = scale / dpi;
  }
  const scaleT = scaleX / scaleB;
  const tileManager = root.tileManager!;
  tileManager.setPage(page!);
  // page的原点相对于屏幕坐标系的偏移
  const { x, y } = calPoint({ x: 0, y: 0 }, pm);
  // 这个unit是考虑了高清方案后的，当前tile在屏幕上占的尺寸，应该在(256,512]
  const unit = Tile.UNIT * scaleT * dpi;
  let nw = 0;
  let nh = 0;
  // console.log(x, y, ';', scale, scaleIndex, ';', scaleX, scaleB, scaleT, ';', W, H, unit);
  // 先看page的平移造成的左上非对齐部分，除非是0/0或者w/h整数，否则都会占一个不完整的tile，整体宽度要先减掉这部分
  const offsetX = x % unit;
  const offsetY = y % unit;
  const indexX = Math.floor(-x / unit);
  const indexY = Math.floor(-y / unit);
  // 注意正负数，对偏移造成的影响不同，正数右下移，左上多出来是漏出的Tile尺寸，负数左上移，是本身遮盖的Tile尺寸
  if (offsetX > 0) {
    nw = Math.ceil((W - offsetX) / unit) + 1;
  }
  else {
    nw = Math.ceil((W - offsetX) / unit);
  }
  if (offsetY > 0) {
    nh = Math.ceil((H - offsetY) / unit) + 1;
  }
  else {
    nh = Math.ceil((H - offsetY) / unit);
  }
  const size = Math.round(Tile.UNIT / scaleB);
  const tileList = tileManager.active(
    scaleB,
    indexX * size,
    indexY * size,
    nw,
    nh,
  );
  // console.log(offsetX, offsetY, ';', nw, nh, ';', indexX, indexY);
  // 渲染准备
  const cx = W * 0.5,
    cy = H * 0.5;
  const programs = root.programs;
  const program = programs.program;
  gl.useProgram(programs.program);
  // artboard的裁剪，以及记录artboard的画布rect来判断节点是否超出范围外
  const artBoardIndex: ArtBoard[] = [];
  const abRect = new Float64Array([0, 0, W, H]);
  // 先检查所有tile是否完备，如果是直接渲染跳过遍历节点，一般是为了平移画布的场景优化，所有tile都渲染好了无需遍历节点
  let complete = true;
  for (let i = 0, len = tileList.length; i < len; i++) {
    const tile = tileList[i];
    tile.init(dpi);
    if (!tile.complete) {
      complete = false;
    }
    // 更新tile的屏幕坐标
    const { x: x1, y: y1 } = tile;
    const x2 = x1 + size;
    const y2 = y1 + size;
    const bbox = calRectPoints(x1, y1, x2, y2, pm);
    tile.bbox[0] = bbox.x1;
    tile.bbox[1] = bbox.y1;
    tile.bbox[2] = bbox.x3;
    tile.bbox[3] = bbox.y3;
  }
  // console.log(tileList.map(item => item.toString()));
  // 这里生成merge的检查和普通不一样，由于tile可能只漏出一部分，因此屏幕范围比可视区域要大一些
  let x1 = 0, y1 = 0, x2 = W, y2 = H;
  if (tileList.length) {
    const first = tileList[0], last = tileList[tileList.length - 1];
    x1 = first.bbox[0];
    y1 = first.bbox[1];
    x2 = last.bbox[2];
    y2 = last.bbox[3];
  }
  // console.log(x1, y1, ';', x2, y2, ';', W, H);
  // merge提前算，因为有hasContent计算
  const startTime = Date.now();
  const { mergeRecord, breakMerge } = genMerge(gl, root, scale, scaleIndex, x1, y1, x2, y2, startTime);
  // console.log('record', keys, mergeRecord);
  // 新增或者移动等有位置尺寸变化的元素，检查其对tile的影响，一般数量较少，需要提前计算matrixWorld/filterBbox不能用老的
  const keys = Object.keys(tileRecord);
  // console.log(tileRecord)
  for (let i = 0, len = keys.length; i < len; i++) {
    const node = tileRecord[keys[i]];
    // 可能是无内容的组，这里粗粒度全部移除
    if (node
      && node.computedStyle.maskMode !== MASK.ALPHA
      && node.computedStyle.opacity
      && node.computedStyle.visibility === VISIBILITY.VISIBLE
    ) {
      const m = node.matrixWorld;
      const bbox = node.filterBbox;
      if (checkInRect(bbox, m, x1, y1, x2 - x1, y2 - y1)) {
        const sb = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], m);
        // console.log('in', sb)
        for (let j = 0, len = tileList.length; j < len; j++) {
          const tile = tileList[j];
          const bbox = tile.bbox;
          // console.log(j, bbox.join(','), tile.count)
          // 已经标明需清除重绘的tile无需重复判断
          if (!tile.needClear && isConvexPolygonOverlapRect(
            bbox[0], bbox[1], bbox[2], bbox[3],
            [{
              x: sb.x1, y: sb.y1,
            }, {
              x: sb.x2, y: sb.y2,
            }, {
              x: sb.x3, y: sb.y3,
            }, {
              x: sb.x4, y: sb.y4,
            }],
          )) {
            tile.clean();
            complete = false;
          }
        }
      }
    }
  }
  root.tileRecord = {};
  // 新生成的merge也影响tile，需清空重绘
  for (let i = 0, len = mergeRecord.length; i < len; i++) {
    const { bbox, m } = mergeRecord[i];
    if (checkInRect(bbox, m, x1, y1, x2 - x1, y2 - y1)) {
      const sb = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], m);
      for (let j = 0, len = tileList.length; j < len; j++) {
        const tile = tileList[j];
        const bbox = tile.bbox;
        if (tile.count && isConvexPolygonOverlapRect(
          bbox[0], bbox[1], bbox[2], bbox[3],
          [{
            x: sb.x1, y: sb.y1,
          }, {
            x: sb.x2, y: sb.y2,
          }, {
            x: sb.x3, y: sb.y3,
          }, {
            x: sb.x4, y: sb.y4,
          }],
        )) {
          tile.clean();
          complete = false;
        }
      }
    }
  }
  const overlay = root.overlay;
  let hasRemain = false;
  // console.error('complete', complete, root.tileLastIndex)
  // 非完备，遍历节点渲染到Tile上
  if (!complete) {
    let firstDraw = true;
    let resFrameBuffer: WebGLFramebuffer | undefined;
    const im = inverse(pm);
    // tile的坐标系，向tile输入不考虑缩放需完整
    const W2 = Tile.UNIT * dpi;
    const cx2 = W2 * 0.5;
    // 续上帧没画完的情况时，可能跳过了画布的裁剪逻辑，需补上
    if (root.tileLastIndex) {
      const { node } = structs[root.tileLastIndex];
      const artBoard = node.artBoard;
      if (artBoard && node !== artBoard) {
        const { total, next } = artBoard.struct;
        if (total + next) {
          const i = structs.indexOf(artBoard.struct);
          artBoardIndex[i + total + next] = artBoard;
          const bbox = artBoard._bbox || artBoard.bbox;
          const ab = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], artBoard.matrixWorld);
          abRect[0] = ab.x1;
          abRect[1] = ab.y1;
          abRect[2] = ab.x3;
          abRect[3] = ab.y3;
        }
      }
    }
    // 先把空tile清空，可能是原本有内容的变为空了
    for (let i = 0, len = tileList.length; i < len; i++) {
      const tile = tileList[i];
      if (!tile.count && !tile.complete && tile.texture && tile.needClear) {
        tile.needClear = false;
        if (!resFrameBuffer) {
          resFrameBuffer = genFrameBufferWithTexture(gl, tile.texture, W2, W2);
        }
        else {
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            tile.texture!,
            0,
          );
        }
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }
    // 循环非overlay的节点，依旧是从上帧没画完的开始
    for (let i = root.tileLastIndex, len = structs.length; i < len; i++) {
      const { node, total, next } = structs[i];
      // tile不收集overlay的东西
      if (overlay === node) {
        break;
      }
      const computedStyle = node.computedStyle;
      const { shouldIgnore, isBgBlur } = shouldIgnoreAndIsBgBlur(
        node,
        computedStyle,
        scaleIndex,
      );
      // 和普通渲染相比没有检查画板写回Page的过程
      if (shouldIgnore) {
        for (let j = i + 1; j < i + total + next; j++) {
          const node = structs[j].node;
          calWorldMatrixAndOpacity(node, j, node.parent);
        }
        i += total + next;
        // 在画布end处重置clip
        if (artBoardIndex[i]) {
          resetTileClip(tileList);
          abRect[0] = 0;
          abRect[1] = 0;
          abRect[2] = W;
          abRect[3] = H;
        }
        continue;
      }
      // 继承父的opacity和matrix，仍然要注意root没有parent
      const { parent, textureTarget } = node;
      calWorldMatrixAndOpacity(node, i, parent);
      // 计算后的世界坐标结果
      const opacity = node._opacity;
      const matrix = node._matrixWorld;
      let target = textureTarget[scaleIndex],
        isInScreen = false;
      // 有merge的直接判断是否在可视范围内，合成结果在merge中做了，可能超出范围不合成
      if (target && target.available) {
        isInScreen = checkInRect(
          target.bbox, matrix,
          x1, y1, x2 - x1, y2 - y1,
        );
      }
      // 无merge的是单个节点，判断是否有内容以及是否在可视范围内，首次渲染或更新后会无target
      else {
        isInScreen = checkInRect(
          node._filterBbox || node.filterBbox, matrix,
          x1, y1, x2 - x1, y2 - y1,
        );
        // 单个的alpha蒙版不渲染
        if (isInScreen && node.hasContent && node.computedStyle.maskMode !== MASK.ALPHA) {
          node.genTexture(gl, scale, scaleIndex);
          target = textureTarget[scaleIndex];
        }
      }
      // 这里只做计算画板的rect，和noTile不太一样，其它计算在后面步骤
      if (isInScreen) {
        if (node instanceof ArtBoard) {
          if (total + next) {
            const bbox = node._bbox || node.bbox;
            const ab = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], matrix);
            abRect[0] = ab.x1;
            abRect[1] = ab.y1;
            abRect[2] = ab.x3;
            abRect[3] = ab.y3;
          }
        }
        // 检查画布内节点是否在画布范围内，否则可以跳过
        else if (abRect[0] !== 0 || abRect[1] !== 0 || abRect[2] !== W || abRect[3] !== H) {
          if (target && target.available) {
            isInScreen = checkInRect(target.bbox, matrix, abRect[0], abRect[1], abRect[2] - abRect[0], abRect[3] - abRect[1]);
          }
          else {
            isInScreen = checkInRect(
              node._filterBbox || node.filterBbox, // 检测用原始的渲染用取整的
              matrix,
              abRect[0], abRect[1], abRect[2] - abRect[0], abRect[3] - abRect[1]
            );
          }
        }
      }
      else if (node instanceof ArtBoard) {
        resetTileClip(tileList);
        abRect[0] = 0;
        abRect[1] = 0;
        abRect[2] = W;
        abRect[3] = H;
        continue;
      }
      // 和普通渲染比没有画布索引部分，仅图片检查内容加载计数器
      if (isInScreen && node instanceof Bitmap && node.checkLoader()) {
        imgLoadList.push(node);
      }
      // 真正的渲染部分，比普通渲染多出的逻辑是遍历tile并且检查是否在tile中，排除非页面元素
      if (isInScreen) {
        if (!firstDraw && (Date.now() - startTime) > config.deltaTime) {
          hasRemain = true;
          root.tileLastIndex = i;
          break;
        }
        const shouldRender = (target && target.available) || false;
        const { mixBlendMode } = computedStyle;
        const bbox = shouldRender ? target!.bbox : (node._filterBbox || node.filterBbox);
        const sb = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], matrix);
        /**
         * 按照page坐标系+左上原点tile坐标算出target的渲染坐标，后续每个tile渲染时都用此数据不变，
         * 但是每个tile都有一定的偏移值，这个值用tile的x/y-原点tile的x/y得出即可。
         * 需先求出相对于page的matrix，即忽略掉page及其父的matrix，逆矩阵运算。
         * 还有由于视图存在缩放，但Tile本身尺寸是固定的UNIT*dpi（一般是256*2=512），还看视图情况进行(1,2]缩放，
         * 因此这个矩阵还要考虑预乘一个缩放因子，即(1,2]*dpi，记作factor。
         */
        let m = multiply(im, matrix);
        const factor = scaleB * dpi;
        if (factor !== 1) {
          const t = identity();
          multiplyScale(t, factor);
          m = multiply(t, m);
        }
        // 只有1个渲染块时等同于不分块
        let coords: {
          t1: { x: number, y: number },
          t2: { x: number, y: number },
          t3: { x: number, y: number },
          t4: { x: number, y: number },
        } | undefined = (shouldRender && target!.list.length === 1)
          ? bbox2Coords(bbox, cx2, cx2, 0, 0, false, m)
          : undefined;
        // >1个，即多个渲染区块，在首次遍历时计算坐标并存储下来
        const coords2: {
          t1: { x: number, y: number },
          t2: { x: number, y: number },
          t3: { x: number, y: number },
          t4: { x: number, y: number },
        }[] = [];
        let ab: { x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number };
        const isArtBoard = node instanceof ArtBoard;
        if (isArtBoard) {
          const bbox = node._bbox || node.bbox;
          ab = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], m);
          artBoardIndex[i + total + next] = node;
          const ab2 = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], node.matrixWorld);
          abRect[0] = ab2.x1;
          abRect[1] = ab2.y1;
          abRect[2] = ab2.x3;
          abRect[3] = ab2.y3;
        }
        // console.warn(i, node.name, shouldRender, coords, bbox.join(','), sb);
        for (let j = 0, len = tileList.length; j < len; j++) {
          const tile = tileList[j];
          const bboxT = tile.bbox;
          // console.log(j, tile.complete, tile.has(node))
          if (isArtBoard) {
            tile.x1 = (ab!.x1 - tile.x * factor - cx2) / cx2;
            tile.y1 = (ab!.y1 - tile.y * factor - cx2) / cx2;
            tile.x2 = (ab!.x3 - tile.x * factor - cx2) / cx2;
            tile.y2 = (ab!.y3 - tile.y * factor - cx2) / cx2;
          }
          // 不在此tile中跳过，tile也可能是老的已有完备的，或存在于上帧没绘完的
          if ((!target?.available && !isArtBoard) || tile.complete || tile.has(node) || !isConvexPolygonOverlapRect(
            bboxT[0], bboxT[1], bboxT[2], bboxT[3],
            [{
              x: sb.x1, y: sb.y1,
            }, {
              x: sb.x2, y: sb.y2,
            }, {
              x: sb.x3, y: sb.y3,
            }, {
              x: sb.x4, y: sb.y4,
            }],
          )) {
            continue;
          }
          // 记录节点和tile的关系，发生变化清空所在tile
          node.addTile(tile);
          if (!shouldRender && !isArtBoard) {
            continue;
          }
          // 画板缘故可能tile在画板之外
          if (tile.x1 > 1 || tile.y1 > 1 || tile.x2 < -1 || tile.y2 < -1) {
            continue;
          }
          if (firstDraw) {
            firstDraw = false;
          }
          // console.log('tile', j, tile)
          // tile对象绑定输出FBO
          if (!resFrameBuffer) {
            resFrameBuffer = genFrameBufferWithTexture(gl, tile.texture, W2, W2);
          }
          else {
            gl.framebufferTexture2D(
              gl.FRAMEBUFFER,
              gl.COLOR_ATTACHMENT0,
              gl.TEXTURE_2D,
              tile.texture!,
              0,
            );
          }
          // 第一次绘制要清空
          const count = tile.count;
          if (count === 0) {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
          }
          // 画板的背景色特殊逻辑渲染，以原始屏幕系坐标viewport，传入当前tile和屏幕的坐标差，还要计算tile的裁剪
          if (isArtBoard) {
            node.renderBgcTile(gl, cx2, cx, cy, factor, tile, ab!);
          }
          // 一般都有内容，画板没有，但特殊情况下脏数据比如设置了opacity形成merge画板就有了
          const list = target?.list;
          if (!list || !list.length) {
            continue;
          }
          if (isBgBlur && i) {
          }
          let tex: WebGLTexture | undefined;
          // 有mbm先将本节点内容绘制到和root同尺寸纹理上
          if (mixBlendMode !== MIX_BLEND_MODE.NORMAL) {
            tex = createTexture(gl, 0, undefined, W2, W2);
            gl.framebufferTexture2D(
              gl.FRAMEBUFFER,
              gl.COLOR_ATTACHMENT0,
              gl.TEXTURE_2D,
              tex,
              0,
            );
          }
          // 有无mbm都复用这段逻辑
          // 特殊优化，对象只有1个渲染目标时等同于不分块，省略一些计算判断
          if (list.length === 1) {
            list[0].t && drawTextureCache(
              gl,
              cx2,
              cx2,
              program,
              [
                {
                  opacity,
                  bbox, // 无用有coords
                  coords,
                  texture: list[0].t,
                },
              ],
              -tile.x * factor / cx2,
              -tile.y * factor / cx2,
              false,
              tile.x1, tile.y1, tile.x2, tile.y2,
            );
          }
          // >1个时分块，每块都要单独计算坐标值
          else if (list.length > 1) {
            for (let k = 0, len = list.length; k < len; k++) {
              const { bbox, t } = list[k];
              const sb = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], matrix);
              // 再次判断，节点可能有多区块，每个区块不一定都在对应tile上
              if (!isConvexPolygonOverlapRect(
                bboxT[0], bboxT[1], bboxT[2], bboxT[3],
                [{
                  x: sb.x1, y: sb.y1,
                }, {
                  x: sb.x2, y: sb.y2,
                }, {
                  x: sb.x3, y: sb.y3,
                }, {
                  x: sb.x4, y: sb.y4,
                }],
              )) {
                continue;
              }
              // tile循环第一次，即第0个tile时计算避免重复
              coords2[k] = coords2[k] || bbox2Coords(bbox, cx2, cx2, 0, 0, false, m);
              t && drawTextureCache(
                gl,
                cx2,
                cx2,
                program,
                [
                  {
                    opacity,
                    bbox, // 无用有coords
                    coords: coords2[k],
                    texture: t,
                  },
                ],
                -tile.x * factor / cx2,
                -tile.y * factor / cx2,
                false,
                tile.x1, tile.y1, tile.x2, tile.y2,
              );
            }
          }
          // 这里才是真正生成mbm
          if (mixBlendMode !== MIX_BLEND_MODE.NORMAL) {
            const t = genMbm(
              gl,
              tile.texture!,
              tex!,
              mixBlendMode,
              programs,
              W2,
              W2,
            );
            tile.updateTex(t);
          }
        }
      }
      // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
      if (
        target?.available && target !== node.textureCache[scaleIndex]
        || computedStyle.maskMode
        || !isInScreen && computedStyle.overflow === OVERFLOW.HIDDEN // Frame裁剪不在范围内
      ) {
        // 有种特殊情况，group没内容且没next，但children有内容，outline蒙版需要渲染出来
        if ([MASK.OUTLINE, MASK.ALPHA_WITH, MASK.GRAY_WITH].includes(computedStyle.maskMode)
          && (!node.next || node.next.computedStyle.breakMask)) {
        }
        else {
          i += total + next;
        }
      }
      else if (node instanceof ShapeGroup) {
        i += total;
      }
      // 在画布end处重置clip
      if (artBoardIndex[i]) {
        resetTileClip(tileList);
        abRect[0] = 0;
        abRect[1] = 0;
        abRect[2] = W;
        abRect[3] = H;
      }
    }
    // 释放回主画布
    if (resFrameBuffer) {
      releaseFrameBuffer(gl, resFrameBuffer, W, H);
    }
  }
  // 遍历tile，渲染，可能某个未完备，检查是否有低清版本
  for (let i = 0, len = tileList.length; i < len; i++) {
    const tile = tileList[i];
    if (tile.available && tile.count) {
      drawTextureCache(
        gl,
        cx,
        cy,
        program,
        [
          {
            opacity: 1,
            bbox: tile.bbox,
            texture: tile.texture!,
          },
        ],
        0,
        0,
        true,
        -1, -1, 1, 1,
      );
    }
    else {
      const { x, y } = tile;
      const down = tileManager.getDowngrade(scaleB, x, y);
      if (down && down.length) {
        for (let j = 0, len = down.length; j < len; j++) {
          const item = down[j];
          const ratio = item.scale / scaleB;
          // <1是更大的纹理，用其中一部分
          if (ratio < 1) {
            const x1 = (x - item.tile.x) / item.tile.size;
            const y1 = (y - item.tile.y) / item.tile.size;
            drawTextureCache(
              gl,
              cx,
              cy,
              program,
              [
                {
                  opacity: 1,
                  bbox: tile.bbox,
                  texture: item.tile.texture!,
                  tc: {
                    x1, y1, x3: x1 + ratio, y3: y1 + ratio,
                  },
                },
              ],
              0,
              0,
              true,
              -1, -1, 1, 1,
            );
          }
          // >1是全部绘制但只占原本的一部分
          else if (ratio > 1) {
            const x1 = (item.tile.x - x) / tile.size;
            const y1 = (item.tile.y - y) / tile.size;
            const bbox = tile.bbox;
            const w = bbox[2] - bbox[0];
            const h = bbox[3] - bbox[1];
            const x0 = bbox[0] + x1 * w;
            const y0 = bbox[1] + y1 * h;
            drawTextureCache(
              gl,
              cx,
              cy,
              program,
              [
                {
                  opacity: 1,
                  bbox: new Float64Array([
                    x0,
                    y0,
                    x0 + w / ratio,
                    y0 + h / ratio,
                  ]),
                  texture: item.tile.texture!,
                },
              ],
              0,
              0,
              true,
              -1, -1, 1, 1,
            );
          }
        }
      }
    }
    // 设置完备，当有节点更新，会重置关联的tile
    if (!hasRemain) {
      tile.complete = true;
    }
  }
  // tile的辅助展示区块范围
  if (config.debug) {
    const tileProgram = programs.tileProgram;
    gl.useProgram(tileProgram);
    // 顶点buffer
    const pointBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const a_position = gl.getAttribLocation(tileProgram, 'a_position');
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);
    // 边宽
    const u_width = gl.getUniformLocation(tileProgram, 'u_width');
    gl.uniform1f(u_width, 1 / cx);
    const u_height = gl.getUniformLocation(tileProgram, 'u_height');
    gl.uniform1f(u_height, 1 / cy);
    // 遍历每个渲染
    for (let i = 0, len = tileList.length; i < len; i++) {
      const tile = tileList[i];
      const u_x1 = gl.getUniformLocation(tileProgram, 'u_x1');
      gl.uniform1f(u_x1, (tile.bbox[0] - cx) / cx);
      const u_y1 = gl.getUniformLocation(tileProgram, 'u_y1');
      gl.uniform1f(u_y1, (cy - tile.bbox[3]) / cy);
      const u_x2 = gl.getUniformLocation(tileProgram, 'u_x2');
      gl.uniform1f(u_x2, (tile.bbox[2] - cx) / cx);
      const u_y2 = gl.getUniformLocation(tileProgram, 'u_y2');
      gl.uniform1f(u_y2, (cy - tile.bbox[1]) / cy);
      const u_count = gl.getUniformLocation(tileProgram, 'u_count');
      gl.uniform1i(u_count, tile.count);
      // 渲染并销毁
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.deleteBuffer(pointBuffer);
    gl.disableVertexAttribArray(a_position);
    gl.useProgram(program);
  }
  // overlay的内容在tile之上单独渲染
  renderOverlay(gl, cx, cy, W, H, root, true);
  // 因性能限制原因没有绘制完全的情况，下一帧继续
  if (hasRemain) {
    root.tileRemain = true;
    root.addUpdate(root, [], RefreshLevel.CACHE, false, false, undefined);
  }
  // merge中断跨帧重新生成，影响的节点会往上（根），索引会未知，从头重新渲染
  if (breakMerge && breakMerge.length) {
    root.tileLastIndex = 0;
  }
  // 未完成的merge，跨帧渲染
  if (breakMerge && breakMerge.length) {
    for (let i = 0, len = breakMerge.length; i < len; i++) {
      root.addUpdate(breakMerge[i].node, [], RefreshLevel.CACHE, false, false, undefined);
    }
  }
}

function resetTileClip(tileList: Tile[]) {
  tileList.forEach(item => {
    item.x1 = item.y1 = -1;
    item.x2 = item.y2 = 1;
  });
}

/**
 * Page的孩子可能是直接的渲染对象，也可能是画板，画板需要实现overflow:hidden的效果，如果用画板本身尺寸离屏绘制，
 * 创建的离屏FBO纹理可能会非常大，因为画板并未限制尺寸，超大尺寸情况下实现会非常复杂。
 * 使用坐标判断如果超过画布尺寸则discard掉，需要计算出画布所在屏幕的gl坐标范围。
 * 另外，Page的非画布孩子无需clip逻辑，只要判断是否在可视范围外即可。
 * mixBlendMode/backgroundBlur需要离屏混入，画布本身就已经离屏无需再申请，因此Page的非画布孩子绘入一个相同离屏即可。
 * sketch里，一个渲染对象只要和画布重叠相交，就一定在画布内，所以无需关心Page的非画布孩子和画布的zIndex问题。
 * 在遍历渲染过程中，记录一个索引hash，当画板开始时切换到画板FBO，结束时切换到PageFBO，
 * 每进入画板则生成画板FBO，退出将结果汇入Page，删除FBO且置undefined。
 */
function renderWebglNoTile(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  root: Root,
  scale: number,
  scaleIndex: number,
  sourceScale: number,
) {
  const { structs, width: W, height: H, imgLoadList } = root;
  // 先生成需要汇总的临时根节点上的纹理
  const startTime = Date.now();
  const { breakMerge } = genMerge(gl, root, scale, scaleIndex, 0, 0, W, H, startTime);
  const cx = W * 0.5,
    cy = H * 0.5;
  const programs = root.programs;
  // 初始化工作
  let pageTexture = root.pageTexture || createTexture(gl, 0, undefined, W, H);
  // let artBoardTexture: WebGLTexture | undefined; // 画布的背景色单独渲染，会干扰mbm的透明判断
  let resTexture = pageTexture;
  let resFrameBuffer = genFrameBufferWithTexture(gl, resTexture, W, H);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  // 一般都存在，除非root改逻辑在只有自己的时候进行渲染，进入overlay后就是上层自定义内容而非sketch内容了
  const overlay = root.overlay;
  const program = programs.program;
  gl.useProgram(programs.program);
  // artboard的裁剪，以及记录artboard的画布rect来判断节点是否超出范围外
  const artBoardIndex: ArtBoard[] = [];
  let x1 = -1, y1 = -1, x2 = 1, y2 = 1;
  const abRect = new Float64Array([0, 0, W, H]);
  // 循环收集数据，同一个纹理内的一次性给出，只1次DrawCall
  for (let i = 0, len = structs.length; i < len; i++) {
    const { node, total, next } = structs[i];
    // 特殊的工具覆盖层，如画板名称，同步更新translate直接跟着画板位置刷新
    if (overlay === node) {
      break;
    }
    // 不可见和透明的跳过，但要排除mask，有背景模糊的合法节点如果是透明也不能跳过，mask和背景模糊互斥，优先mask
    const computedStyle = node.computedStyle;
    const { shouldIgnore, isBgBlur } = shouldIgnoreAndIsBgBlur(
      node,
      computedStyle,
      scaleIndex,
    );
    if (shouldIgnore) {
      for (let j = i + 1; j < i + total + next; j++) {
        const node = structs[j].node;
        calWorldMatrixAndOpacity(node, j, node.parent);
      }
      i += total + next;
      // 同正常逻辑检查画板end，重置clip
      if (artBoardIndex[i]) {
        abRect[0] = 0;
        abRect[1] = 0;
        abRect[2] = W;
        abRect[3] = H;
        x1 = y1 = -1;
        x2 = y2 = 1;
        // resTexture = drawArtBoard2Page(gl, program, cx, cy, W, H, pageTexture, resTexture);
      }
      continue;
    }
    // 继承父的opacity和matrix，仍然要注意root没有parent
    const { parent, textureTarget } = node;
    calWorldMatrixAndOpacity(node, i, parent);
    // 计算后的世界坐标结果
    const opacity = node._opacity;
    const matrix = node._matrixWorld;
    let target = textureTarget[scaleIndex];
    let isInScreen = false;
    // 有merge的直接判断是否在可视范围内，合成结果在merge中做了，可能超出范围不合成
    if (target?.available) {
      isInScreen = checkInScreen(target.bbox, matrix, W, H);
    }
    // 无merge的是单个节点，判断是否有内容以及是否在可视范围内，首次渲染或更新后会无target
    else {
      isInScreen = checkInScreen(
        node._filterBbox || node.filterBbox, // 检测用原始的渲染用取整的
        matrix,
        W,
        H,
      );
      // 单个的alpha蒙版不渲染
      if (isInScreen && node.hasContent && node.computedStyle.maskMode !== MASK.ALPHA) {
        node.genTexture(gl, scale, scaleIndex);
        target = textureTarget[scaleIndex];
      }
    }
    // 画布和Page的FBO切换检测
    if (isInScreen) {
      // 画布开始，新建画布纹理并绑定FBO，计算end索引供切回Page，空画布无效需跳过
      if (node instanceof ArtBoard) {
        node.renderBgc(gl, cx, cy);
        if (total + next) {
          artBoardIndex[i + total + next] = node;
          const bbox = node._bbox || node.bbox;
          const ab = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], matrix);
          abRect[0] = ab.x1;
          abRect[1] = ab.y1;
          abRect[2] = ab.x3;
          abRect[3] = ab.y3;
          x1 = (ab.x1 - cx) / cx;
          y1 = (ab.y1 - cy) / cy;
          x2 = (ab.x3 - cx) / cx;
          y2 = (ab.y3 - cy) / cy;
          // artBoardTexture = createTexture(gl, 0, undefined, W, H);
          // gl.framebufferTexture2D(
          //   gl.FRAMEBUFFER,
          //   gl.COLOR_ATTACHMENT0,
          //   gl.TEXTURE_2D,
          //   artBoardTexture,
          //   0,
          // );
          // resTexture = artBoardTexture;
        }
      }
      // 检查画布内节点是否在画布范围内，否则可以跳过
      else if (abRect[0] !== 0 || abRect[1] !== 0 || abRect[2] !== W || abRect[3] !== H) {
        if (target && target.available) {
          isInScreen = checkInRect(target.bbox, matrix, abRect[0], abRect[1], abRect[2] - abRect[0], abRect[3] - abRect[1]);
        }
        else {
          isInScreen = checkInRect(
            node._filterBbox || node.filterBbox, // 检测用原始的渲染用取整的
            matrix,
            abRect[0], abRect[1], abRect[2] - abRect[0], abRect[3] - abRect[1],
          );
        }
      }
    }
    // 画布外的画板直接跳过
    else if (node instanceof ArtBoard) {
      i += total + next;
      continue;
    }
    // 图片检查内容加载计数器
    if (isInScreen && node instanceof Bitmap && node.checkLoader()) {
      imgLoadList.push(node);
    }
    // console.log(i, node.name, isInScreen, target?.available, x1, y1, x2, y2, abRect.join(','))
    // 真正的渲染部分
    if (isInScreen && target?.available) {
      const { mixBlendMode, blur } = computedStyle;
      /**
       * 背景模糊是个很特殊的渲染，将当前节点区域和主画布重合的地方裁剪出来，
       * 先进行模糊/饱和度调整，再替换回主画布区域。
       * sketch中group无法设置，只能对单个节点（包括ShapeGroup）的轮廓进行类似轮廓蒙版的重合裁剪，
       * 并且它的text也无法设置，这里考虑增加text的支持，因为轮廓比较容易实现
       */
      if (isBgBlur && i) {
        const outline = node.textureOutline[scale] = genOutline(
          gl,
          node,
          structs,
          i,
          total,
          target.bbox,
          scale,
        );
        resTexture = genBgBlurRoot(gl, root, resTexture, matrix, outline, blur, programs, sourceScale, W, H);
        gl.bindFramebuffer(gl.FRAMEBUFFER, resFrameBuffer);
        gl.viewport(0, 0, W, H);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          resTexture,
          0,
        );
      }
      // 有mbm先将本节点内容绘制到和root同尺寸纹理上
      let tex: WebGLTexture | undefined;
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
      const list = target.list;
      for (let i = 0, len = list.length; i < len; i++) {
        const { bbox, t } = list[i];
        t && drawTextureCache(
          gl,
          cx,
          cy,
          program,
          [
            {
              opacity,
              matrix,
              bbox,
              texture: t,
            },
          ],
          0,
          0,
          false,
          x1, y1, x2, y2,
        );
      }
      // 这里才是真正生成mbm
      if (mixBlendMode !== MIX_BLEND_MODE.NORMAL) {
        resTexture = genMbm(
          gl,
          resTexture,
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
      target?.available && target !== node.textureCache[scaleIndex]
      || computedStyle.maskMode
      || !isInScreen && computedStyle.overflow === OVERFLOW.HIDDEN // Frame裁剪不在范围内
    ) {
      // 有种特殊情况，group没内容且没next，但children有内容，outline蒙版需要渲染出来
      if ([MASK.OUTLINE, MASK.ALPHA_WITH, MASK.GRAY_WITH].includes(computedStyle.maskMode)
        && (!node.next || node.next.computedStyle.breakMask)) {
      }
      else {
        i += total + next;
      }
    }
    else if (node instanceof ShapeGroup) {
      i += total;
    }
    // 在画布end处重置clip
    if (artBoardIndex[i]) {
      abRect[0] = 0;
      abRect[1] = 0;
      abRect[2] = W;
      abRect[3] = H;
      x1 = y1 = -1;
      x2 = y2 = 1;
      // resTexture = drawArtBoard2Page(gl, program, cx, cy, W, H, pageTexture, resTexture);
    }
  }
  renderOverlay(gl, cx, cy, W, H, root, false);
  // 最后将离屏frameBuffer绘入画布
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
        texture: resTexture,
      },
    ],
    0,
    0,
    true,
    -1, -1, 1, 1,
  );
  root.pageTexture = resTexture;
  // 未完成的merge，跨帧渲染
  if (breakMerge && breakMerge.length) {
    for (let i = 0, len = breakMerge.length; i < len; i++) {
      root.addUpdate(breakMerge[i].node, [], RefreshLevel.CACHE, false, false, undefined);
    }
  }
}

// 计算节点的世界坐标系数据
export function calWorldMatrixAndOpacity(node: Node, i: number, parent?: Container) {
  // 世界opacity和matrix不一定需要重算，有可能之前调用算过了有缓存
  let hasCacheOp = false;
  let hasCacheMw = false;
  // 第一个是Root层级0
  if (!i) {
    hasCacheOp = node.hasCacheOp;
    hasCacheMw = node.hasCacheMw;
  }
  else {
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
}

// function drawArtBoard2Page(
//   gl: WebGLRenderingContext | WebGL2RenderingContext,
//   program: WebGLProgram,
//   cx: number, cy: number, W: number, H: number,
//   pageTexture: WebGLTexture,
//   artBoardTexture: WebGLTexture,
// ) {
//   gl.framebufferTexture2D(
//     gl.FRAMEBUFFER,
//     gl.COLOR_ATTACHMENT0,
//     gl.TEXTURE_2D,
//     pageTexture,
//     0,
//   );
//   drawTextureCache(
//     gl,
//     cx,
//     cy,
//     program,
//     [
//       {
//         opacity: 1,
//         bbox: new Float64Array([0, 0, W, H]),
//         texture: artBoardTexture,
//       },
//     ],
//     0,
//     0,
//     false,
//     -1, -1, 1, 1,
//   );
//   gl.deleteTexture(artBoardTexture);
//   return pageTexture;
// }

function renderOverlay(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  cx: number, cy: number, W: number, H: number,
  root: Root,
  flipY: boolean,
) {
  const { overlay, structs, programs } = root;
  overlay.update();
  const start = structs.indexOf(overlay.struct);
  const program = programs.program;
  // artboard的名字
  for (let i = start, len = structs.length; i < len; i++) {
    const { node } = structs[i];
    const { parent, textureTarget } = node;
    calWorldMatrixAndOpacity(node, i, parent);
    const opacity = node._opacity;
    const matrix = node._matrixWorld;
    let target = textureTarget[0];
    if (!target && node.hasContent) {
      node.genTexture(gl, 1, 0);
      target = textureTarget[0];
    }
    if (target && target.available) {
      const isInScreen = checkInScreen(target.bbox, matrix, W, H);
      if (isInScreen) {
        const list = target.list;
        for (let i = 0, len = list.length; i < len; i++) {
          const { bbox, t } = list[i];
          t && drawTextureCache(
            gl,
            cx,
            cy,
            program,
            [
              {
                opacity,
                matrix,
                bbox: bbox,
                texture: t,
              },
            ],
            0,
            0,
            flipY,
            -1, -1, 1, 1,
          );
        }
      }
    }
  }
  // slice盖在最上面
  const sliceProgram = programs.sliceProgram;
  gl.useProgram(sliceProgram);
  // 顶点buffer
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(sliceProgram, 'a_position');
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_position);
  // 边宽
  const u_width = gl.getUniformLocation(sliceProgram, 'u_width');
  gl.uniform1f(u_width, 1 / cx);
  const u_height = gl.getUniformLocation(sliceProgram, 'u_height');
  gl.uniform1f(u_height, 1 / cy);
  for (let i = 0; i < start; i++) {
    const { node } = structs[i];
    if (node instanceof Slice) {
      const matrix = node._matrixWorld;
      const bbox = node._rect || node.rect;
      const isInScreen = checkInScreen(bbox, matrix, W, H);
      if (isInScreen) {
        const r = node.getBoundingClientRect();
        const u_x1 = gl.getUniformLocation(sliceProgram, 'u_x1');
        gl.uniform1f(u_x1, (r.left - cx) / cx);
        const u_x2 = gl.getUniformLocation(sliceProgram, 'u_x2');
        gl.uniform1f(u_x2, (r.right - cx) / cx);
        const u_y1 = gl.getUniformLocation(sliceProgram, 'u_y1');
        const u_y2 = gl.getUniformLocation(sliceProgram, 'u_y2');
        if (flipY) {
          gl.uniform1f(u_y2, (cy - r.top) / cy);
          gl.uniform1f(u_y1, (cy - r.bottom) / cy);
        }
        else {
          gl.uniform1f(u_y1, (r.top - cy) / cy);
          gl.uniform1f(u_y2, (r.bottom - cy) / cy);
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
  }
  gl.deleteBuffer(pointBuffer);
  gl.disableVertexAttribArray(a_position);
  gl.useProgram(program);
}

export default {
  renderWebgl,
  renderWebglNoTile,
  renderWebglTile,
  renderOverlay,
};
