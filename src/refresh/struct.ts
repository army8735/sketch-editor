import { bbox2Coords, createTexture, drawTextureCache, } from '../gl/webgl';
import { assignMatrix, calPoint, calRectPoints, identity, inverse, multiply, multiplyScale } from '../math/matrix';
import ArtBoard from '../node/ArtBoard';
import Container from '../node/Container';
import Node from '../node/Node';
import Root from '../node/Root';
import Bitmap from '../node/Bitmap';
import { MASK, MIX_BLEND_MODE } from '../style/define';
import config from '../util/config';
import {
  checkInScreen,
  checkInWorldRect,
  genBgBlur,
  genFrameBufferWithTexture,
  genMbm,
  genMerge,
  genOutline,
  releaseFrameBuffer,
  shouldIgnoreAndIsBgBlur,
} from './merge';
import Tile from './Tile';
import { isPolygonOverlapRect } from '../math/geom';
import { RefreshLevel } from '../refresh/level';

const DELTA_TIME = 16;

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
  // 由于没有scale变换，所有节点都是通用的，最小为1，然后2的幂次方递增
  let scale = root.getCurPageZoom(),
    scaleIndex = 0;
  if (scale <= 1) {
    scale = 1;
  } else {
    let n = 1;
    while (scale > 1) {
      scale *= 0.5;
      n = n << 1;
      scaleIndex++;
    }
    scale = n;
  }
  // 再普通遍历渲染
  const { imgLoadList } = root;
  const programs = root.programs;
  const bgColorProgram = programs.bgColorProgram;
  // 先渲染Page的背景色，默认透明显示外部css白色，当没有Artboard时，Page渲染为浅灰色
  const page = root.lastPage;
  // page一般都有，防止特殊数据极端情况没有
  if (page) {
    const children = page.children,
      len = children.length;
    let hasArtboard = false;
    // 背景色分开来
    for (let i = 0; i < len; i++) {
      const artBoard = children[i];
      if (artBoard instanceof ArtBoard) {
        hasArtboard = true;
        break;
      }
    }
    if (hasArtboard) {
      gl.useProgram(bgColorProgram);
      const vtPoint = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
      // 顶点buffer
      const pointBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(bgColorProgram, 'a_position');
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_position);
      // color
      const u_color = gl.getUniformLocation(bgColorProgram, 'u_color');
      gl.uniform4f(u_color, 0.95, 0.95, 0.95, 1.0);
      // 渲染并销毁
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.deleteBuffer(pointBuffer);
      gl.disableVertexAttribArray(a_position);
      gl.useProgram(programs.program);
    }
  }
  if (config.tile) {
    if (page) {
      renderWebglTile(gl, root, scale, scaleIndex);
    }
    // 可能手动写的特殊场景没有page
    else {
      renderWebglNoTile(gl, root, scale, scaleIndex);
    }
  } else {
    renderWebglNoTile(gl, root, scale, scaleIndex);
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
   * 在缩放为150%的似乎，scaleB为2*dpi，scaleT为0.75*dpi。
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
  } else {
    scaleB = scale / dpi;
  }
  const scaleT = scaleX / scaleB;
  const tileManager = root.tileManager!;
  tileManager.setPage(page);
  // page的原点相对于屏幕坐标系的偏移
  const { x, y } = calPoint({ x: 0, y: 0 }, pm);
  // 这个unit是考虑了高清方案后的，当前tile在屏幕上占的尺寸，应该在(256,512]
  const unit = Tile.UNIT * scaleT * dpi;
  let nw = 0;
  let nh = 0;
  // console.log(x, y, translateX, translateY, '\n', scale, scaleIndex, scaleX, scaleB, scaleT, '\n', W, H, unit);
  // 先看page的平移造成的左上非对齐部分，除非是0/0或者w/h整数，否则都会占一个不完整的tile，整体宽度要先减掉这部分
  const offsetX = x % unit;
  const offsetY = y % unit;
  const indexX = Math.floor(-x / unit);
  const indexY = Math.floor(-y / unit);
  // 注意正负数，对偏移造成的影响不同，正数右下移左上多出来是漏出的Tile尺寸，负数左上移是本身遮盖的Tile尺寸
  if (offsetX > 0) {
    nw = Math.ceil((W - offsetX) / unit) + 1;
  } else {
    nw = Math.ceil((W - offsetX) / unit);
  }
  if (offsetY > 0) {
    nh = Math.ceil((H - offsetY) / unit) + 1;
  } else {
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
  // console.log(offsetX, offsetY, nw, nh, indexX, indexY);
  // 渲染准备
  const cx = W * 0.5,
    cy = H * 0.5;
  const programs = root.programs;
  const program = programs.program;
  gl.useProgram(programs.program);
  const artBoardIndex: ArtBoard[] = [];
  // 先检查所有tile是否完备，如果是直接渲染跳过遍历节点
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
  // 新增或者移动的元素，检查其对tile的影响，一般数量极少，需要提前计算matrixWorld不能用老的
  for (let i = 0, len = tileRecord.length; i < len; i++) {
    const node = tileRecord[i];
    if (node && node.hasContent && node.computedStyle.maskMode !== MASK.ALPHA) {
      const m = node.matrixWorld;
      const bbox = node.filterBbox;
      if (checkInWorldRect(bbox, m, x1, y1, x2, y2)) {
        const sb = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], m);
        for (let j = 0, len = tileList.length; j < len; j++) {
          const tile = tileList[j];
          const bbox = tile.bbox;
          if (tile.count && isPolygonOverlapRect(
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
  tileRecord.splice(0);
  // 新生成的merge也影响tile，需清空重绘
  const mergeRecord = genMerge(gl, root, scale, scaleIndex, x1, y1, x2, y2);
  for (let i = 0, len = mergeRecord.length; i < len; i++) {
    const { bbox, m } = mergeRecord[i];
    if (checkInWorldRect(bbox, m, x1, y1, x2, y2)) {
      const sb = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], m);
      for (let j = 0, len = tileList.length; j < len; j++) {
        const tile = tileList[j];
        const bbox = tile.bbox;
        if (tile.count && isPolygonOverlapRect(
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
  // 非完备，遍历节点渲染到Tile上
  if (!complete) {
    const startTime = Date.now();
    let firstDraw = true;
    let resFrameBuffer: WebGLFramebuffer | undefined;
    const im = inverse(pm);
    // tile的坐标系，向tile输入不考虑缩放需完整
    const W2 = Tile.UNIT * dpi;
    const cx2 = W2 * 0.5;
    // 续上帧没画完的情况时，可能跳过了画布的裁剪逻辑，需补上
    if (root.tileLastIndex) {
      const { node, total, next } = structs[root.tileLastIndex];
      const artBoard = node.artBoard;
      if (artBoard && node !== artBoard && total + next) {
        artBoardIndex[root.tileLastIndex + total + next] = artBoard as ArtBoard;
        let m = multiply(im, node._matrixWorld || node.matrixWorld);
        const factor = scaleB * dpi;
        if (factor !== 1) {
          const t = identity();
          multiplyScale(t, factor);
          m = multiply(t, m);
        }
        const bbox = artBoard._bbox || artBoard.bbox;
        const ab = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], m);
        for (let j = 0, len = tileList.length; j < len; j++) {
          const tile = tileList[j];
          // 不用再算是否在tile了，上一帧算过了
          if (tile.has(artBoard)) {
            tile.x1 = (ab!.x1 - tile.x * factor - cx2) / cx2;
            tile.y1 = (ab!.y1 - tile.y * factor - cx2) / cx2;
            tile.x2 = (ab!.x3 - tile.x * factor - cx2) / cx2;
            tile.y2 = (ab!.y3 - tile.y * factor - cx2) / cx2;
          }
        }
      }
    }
    // 循环非overlay的节点
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
      );
      // 和普通渲染相比没有检查画板写回Page的过程
      if (shouldIgnore) {
        i += total + next;
        // 在画布end处重置clip
        if (artBoardIndex[i]) {
          resetTileClip(tileList);
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
        isInScreen = checkInWorldRect(target.bbox, matrix, x1, y1, x2, y2);
      }
      // 无merge的是单个节点，判断是否有内容以及是否在可视范围内，首次渲染或更新后会无target
      else {
        isInScreen = checkInWorldRect(
          node._filterBbox || node.filterBbox, matrix,
          x1, y1, x2, y2,
        );
        // 单个的alpha蒙版不渲染
        if (isInScreen && node.hasContent && node.computedStyle.maskMode !== MASK.ALPHA) {
          node.genTexture(gl, scale, scaleIndex);
          target = textureTarget[scaleIndex];
        }
      }
      // 和普通渲染比没有画布索引部分，仅图片检查内容加载计数器
      if (isInScreen && node.isBitmap && (node as Bitmap).checkLoader()) {
        imgLoadList.push(node as Bitmap);
      }
      // 真正的渲染部分，比普通渲染多出的逻辑是遍历tile并且检查是否在tile中，排除非页面元素
      if (isInScreen && !node.isPage && node.page) {
        if (!firstDraw && (Date.now() - startTime) > DELTA_TIME) {
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
         * 还有由于视图存在缩放，但Tile本身尺寸是固定的UNIT*dpi（一般是256*2=512），还根视图情况进行(1,2]缩放，
         * 因此这个矩阵还要考虑预乘一个缩放因子，即(1,2]*dpi，记作factor。
         */
        let m = multiply(im, matrix);
        const factor = scaleB * dpi;
        if (factor !== 1) {
          const t = identity();
          multiplyScale(t, factor);
          m = multiply(t, m);
        }
        const coords = bbox2Coords(bbox, cx2, cx2, 0, 0, false, m);
        let ab: { x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number };
        if (node.isArtBoard) {
          const bbox = node._bbox || node.bbox;
          ab = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], m);
        }
        // console.warn(node.props.name, coords, bbox.join(','), sb);
        for (let j = 0, len = tileList.length; j < len; j++) {
          const tile = tileList[j];
          const bbox = tile.bbox;
          // 不在此tile中跳过，tile也可能是老的已有完备的，或存在于上帧没绘完的
          if (tile.complete || tile.has(node) || !isPolygonOverlapRect(
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
            continue;
          }
          const count = tile.count;
          // 记录节点和tile的关系
          if (!node.isPage && node.page) {
            node.addTile(tile);
            tile.add(node);
          }
          if (!shouldRender && !node.isArtBoard) {
            continue;
          }
          if (firstDraw) {
            firstDraw = false;
          }
          // console.log(j, tile.uuid)
          // tile对象绑定输出FBO，高清下尺寸不一致，用viewport实现
          if (!resFrameBuffer) {
            resFrameBuffer = genFrameBufferWithTexture(gl, tile.texture, W2, W2);
          } else {
            gl.framebufferTexture2D(
              gl.FRAMEBUFFER,
              gl.COLOR_ATTACHMENT0,
              gl.TEXTURE_2D,
              tile.texture!,
              0,
            );
          }
          // 第一次绘制要清空
          if (count === 0) {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
          }
          // 画板的背景色特殊逻辑渲染，以原始屏幕系坐标viewport，传入当前tile和屏幕的坐标差，还要计算tile的裁剪
          if (node.isArtBoard) {
            (node as ArtBoard).renderBgcTile(gl, cx2, cx, cy, factor, tile, ab!);
            if (total + next) {
              artBoardIndex[i + total + next] = node as ArtBoard;
              tile.x1 = (ab!.x1 - tile.x * factor - cx2) / cx2;
              tile.y1 = (ab!.y1 - tile.y * factor - cx2) / cx2;
              tile.x2 = (ab!.x3 - tile.x * factor - cx2) / cx2;
              tile.y2 = (ab!.y3 - tile.y * factor - cx2) / cx2;
              // console.log(i, j, ab!, tile.x1, tile.y1, tile.x2, tile.y2)
            }
            continue;
          }
          if (isBgBlur) {}
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
          drawTextureCache(
            gl,
            cx2,
            cx2,
            program,
            [
              {
                opacity,
                bbox: target!.bbox, // 无用有coords
                coords,
                texture: target!.texture,
              },
            ],
            -tile.x * factor / cx2,
            -tile.y * factor / cx2,
            false,
            tile.x1, tile.y1, tile.x2, tile.y2,
          );
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
        target &&
        target.available &&
        target !== node.textureCache[scaleIndex] ||
        computedStyle.maskMode
      ) {
        i += total + next;
      } else if (node.isShapeGroup) {
        i += total;
      }
      // 在画布end处重置clip
      if (artBoardIndex[i]) {
        resetTileClip(tileList);
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
    // 设置完备，当有节点更新，会重置关联的tile
    if (!hasRemain) {
      tile.complete = true;
    }
  }
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
    const r = 1 / Math.min(cx, cy);
    const u_width = gl.getUniformLocation(tileProgram, 'width');
    gl.uniform1f(u_width, r);
    const u_height = gl.getUniformLocation(tileProgram, 'height');
    gl.uniform1f(u_height, r * cx / cy);
    // 遍历每个渲染
    for (let i = 0, len = tileList.length; i < len; i++) {
      const tile = tileList[i];
      const u_x1 = gl.getUniformLocation(tileProgram, 'x1');
      gl.uniform1f(u_x1, (tile.bbox[0] - cx) / cx);
      const u_y1 = gl.getUniformLocation(tileProgram, 'y1');
      gl.uniform1f(u_y1, (cy - tile.bbox[3]) / cy);
      const u_x2 = gl.getUniformLocation(tileProgram, 'x2');
      gl.uniform1f(u_x2, (tile.bbox[2] - cx) / cx);
      const u_y2 = gl.getUniformLocation(tileProgram, 'y2');
      gl.uniform1f(u_y2, (cy - tile.bbox[1]) / cy);
      const u_count = gl.getUniformLocation(tileProgram, 'count');
      gl.uniform1i(u_count, tile.count);
      // 渲染并销毁
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.deleteBuffer(pointBuffer);
    gl.disableVertexAttribArray(a_position);
    gl.useProgram(program);
  }
  // overlay的内容在tile之上单独渲染
  overlay.update();
  for (let i = structs.indexOf(overlay.struct), len = structs.length; i < len; i++ ) {
    const { node } = structs[i];
    // 继承父的opacity和matrix，仍然要注意root没有parent
    const { parent, textureTarget } = node;
    calWorldMatrixAndOpacity(node, i, parent);
    // 计算后的世界坐标结果
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
          true,
          -1, -1, 1, 1,
        );
      }
    }
  }
  // 因性能限制原因没有绘制完全的情况，下一帧继续
  if (hasRemain) {
    root.addUpdate(root, [], RefreshLevel.CACHE, false, false, undefined);
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
) {
  const { structs, width: W, height: H, imgLoadList } = root;
  // 先生成需要汇总的临时根节点上的纹理
  genMerge(gl, root, scale, scaleIndex, 0, 0, W, H);
  const cx = W * 0.5,
    cy = H * 0.5;
  const programs = root.programs;
  // 初始化工作
  const artBoardIndex: ArtBoard[] = [];
  let pageTexture = root.pageTexture || createTexture(gl, 0, undefined, W, H);
  const resFrameBuffer = genFrameBufferWithTexture(gl, pageTexture, W, H);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  // 一般都存在，除非root改逻辑在只有自己的时候进行渲染，进入overlay后就是上层自定义内容而非sketch内容了
  const overlay = root.overlay;
  let isOverlay = false;
  const program = programs.program;
  gl.useProgram(programs.program);
  let x1 = -1, y1 = -1, x2 = 1, y2 = 1;
  // 循环收集数据，同一个纹理内的一次性给出，只1次DrawCall
  for (let i = 0, len = structs.length; i < len; i++) {
    const { node, total, next } = structs[i];
    // 特殊的工具覆盖层，如画板名称，同步更新translate直接跟着画板位置刷新
    if (overlay === node) {
      overlay.update();
      isOverlay = true;
    }
    // 不可见和透明的跳过，但要排除mask，有背景模糊的合法节点如果是透明也不能跳过，mask和背景模糊互斥，优先mask
    const computedStyle = node.computedStyle;
    const { shouldIgnore, isBgBlur } = shouldIgnoreAndIsBgBlur(
      node,
      computedStyle,
    );
    if (shouldIgnore) {
      i += total + next;
      // 同正常逻辑检查画板end，重置clip
      if (artBoardIndex[i]) {
        x1 = y1 = -1;
        x2 = y2 = 1;
      }
      continue;
    }
    // 继承父的opacity和matrix，仍然要注意root没有parent
    const { parent, textureTarget } = node;
    calWorldMatrixAndOpacity(node, i, parent);
    // 计算后的世界坐标结果
    const opacity = node._opacity;
    const matrix = node._matrixWorld;
    // overlay上的没有高清要忽略
    if (isOverlay) {
      let target = textureTarget[0];
      if (!target && node.hasContent) {
        node.genTexture(gl, 1, 0);
        target = textureTarget[0];
      }
      if (target && target.available) {
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
            -1, -1, 1, 1,
          );
        }
      }
    }
    // 真正的Page内容有高清考虑
    else {
      let target = textureTarget[scaleIndex],
        isInScreen = false;
      // console.log(i, node.props.name, node.matrix.join(','), matrix.join(','))
      // 有merge的直接判断是否在可视范围内，合成结果在merge中做了，可能超出范围不合成
      if (target && target.available) {
        isInScreen = checkInScreen(target.bbox, matrix, W, H);
      }
      // 无merge的是单个节点，判断是否有内容以及是否在可视范围内，首次渲染或更新后会无target
      else {
        isInScreen = checkInScreen(
          node._filterBbox || node.filterBbox,
          matrix,
          W,
          H,
        );
        // 单个的alpha蒙版不渲染
        if (isInScreen && node.hasContent && !node.computedStyle.maskMode) {
          node.genTexture(gl, scale, scaleIndex);
          target = textureTarget[scaleIndex];
        }
      }
      // 画布和Page的FBO切换检测
      if (isInScreen) {
        // 画布开始，新建画布纹理并绑定FBO，计算end索引供切回Page，空画布无效需跳过
        if (node.isArtBoard) {
          (node as ArtBoard).renderBgc(gl, cx, cy);
          if (total + next) {
            artBoardIndex[i + total + next] = node as ArtBoard;
            const bbox = node._bbox || node.bbox;
            const ab = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], matrix);
            x1 = (ab.x1 - cx) / cx;
            y1 = (ab.y1 - cy) / cy;
            x2 = (ab.x3 - cx) / cx;
            y2 = (ab.y3 - cy) / cy;
          }
        }
        // 图片检查内容加载计数器
        if (node.isBitmap && (node as Bitmap).checkLoader()) {
          imgLoadList.push(node as Bitmap);
        }
      }
      // 真正的渲染部分
      if (isInScreen && target && target.available) {
        const { mixBlendMode, blur } = computedStyle;
        /**
         * 背景模糊是个很特殊的渲染，将当前节点区域和主画布重合的地方裁剪出来，
         * 先进行模糊/饱和度调整，再替换回主画布区域。
         * sketch中group无法设置，只能对单个节点（包括ShapeGroup）的轮廓进行类似轮廓蒙版的重合裁剪，
         * 并且它的text也无法设置，这里考虑增加text的支持，因为轮廓比较容易实现
         */
        if (isBgBlur) {
          const outline = (node.textureOutline = genOutline(
            gl,
            node,
            structs,
            i,
            total,
            target.bbox,
            scale,
          ));
          if (outline) {
            genBgBlur(
              gl,
              pageTexture,
              node._matrixWorld || node.matrixWorld,
              outline,
              target,
              blur,
              programs,
              scale,
              cx,
              cy,
              W,
              H,
            );
          }
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
          x1, y1, x2, y2,
        );
        // 这里才是真正生成mbm
        if (mixBlendMode !== MIX_BLEND_MODE.NORMAL) {
          pageTexture = genMbm(
            gl,
            pageTexture,
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
        target &&
        target.available &&
        target !== node.textureCache[scaleIndex] ||
        computedStyle.maskMode
      ) {
        i += total + next;
      } else if (node.isShapeGroup) {
        i += total;
      }
      // 在画布end处重置clip
      if (artBoardIndex[i]) {
        x1 = y1 = -1;
        x2 = y2 = 1;
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
        texture: pageTexture,
      },
    ],
    0,
    0,
    true,
    -1, -1, 1, 1,
  );
  root.pageTexture = pageTexture;
}

// 计算节点的世界坐标系数据
function calWorldMatrixAndOpacity(node: Node, i: number, parent?: Container) {
  // 世界opacity和matrix不一定需要重算，有可能之前调用算过了有缓存
  let hasCacheOp = false;
  let hasCacheMw = false;
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
}
