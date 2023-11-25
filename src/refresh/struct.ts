import { bindTexture, createTexture, drawMask, drawTextureCache, } from '../gl/webgl';
import { assignMatrix, calRectPoints, multiply } from '../math/matrix';
import ArtBoard from '../node/ArtBoard';
import Container from '../node/Container';
import Node from '../node/Node';
import Root from '../node/Root';
import Bitmap from '../node/Bitmap';
import { MIX_BLEND_MODE } from '../style/define';
import config from '../util/config';
import inject from '../util/inject';
import { RefreshLevel } from './level';
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
import TileManager from './TileManager';
import Tile from './Tile';
import { isConvexPolygonOverlapRect } from '../math/geom';

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
  if (scale < 1.01) {
    scale = 1;
  } else {
    let n = 2;
    scaleIndex = 1;
    while (n < scale) {
      n = n << 1;
      scaleIndex++;
    }
    if (n > 2) {
      const m = (n >> 1) * 1.01;
      // 看0.5n和n之间scale更靠近哪一方（0.5n*1.01分界线），就用那个放大数
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
  // 先生成需要汇总的临时根节点上的纹理
  genMerge(gl, root, scale, scaleIndex);
  // 再普通遍历渲染
  const { width: W, height: H, imgLoadList } = root;
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
      let u_color = gl.getUniformLocation(bgColorProgram, 'u_color');
      gl.uniform4f(u_color, 0.95, 0.95, 0.95, 1.0);
      // 渲染并销毁
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.deleteBuffer(pointBuffer);
      gl.disableVertexAttribArray(a_position);
    }
  }
  // 瓦片分析切割，每个page独立区分，可能page为空，内部做了识别封装
  const tileManager = TileManager.getSingleInstance(gl, page);
  let tileList: Tile[] = [];
  if (config.tile && page) {
    const { translateX, translateY, scaleX } = page.computedStyle;
    /**
     * 根据缩放、位置、尺寸计算出当前在屏幕内的瓦片，注意scale是跟随渲染整数倍范围的，
     * 但scaleX是真实的缩放倍数有小数，一定范围内scale是不变的，scaleX会发生变化，
     * 因此这个范围内瓦片实际尺寸虽然不变，但渲染尺寸会变化，屏幕内的瓦片数量也会发生变化。
     * 瓦片是从Page的0/0坐标开始平铺的。
     */
    const x = Math.floor(translateX * root.dpi);
    const y = Math.floor(translateY * root.dpi);
    // 这个unit是考虑了高清方案后的
    const unit = (Tile.UNIT * root.dpi) * scaleX;
    let nw = 0;
    let nh = 0;
    // console.log(x, y, translateX, translateY, scale, scaleIndex, scaleX, W, H, unit);
    // 先看page的平移造成的左上非对齐部分，除非是0/0或者w/h整数，否则都会占一个不完整的tile，整体宽度要先减掉这部分
    const offsetX = x % unit;
    const offsetY = y % unit;
    let indexX = Math.floor(-x / unit);
    let indexY = Math.floor(-y / unit);
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
    // console.log(offsetX, offsetY, nw, nh, indexX, indexY);
    tileList = tileManager.active(
      scale,
      root.dpi,
      indexX * Tile.UNIT,
      indexY * Tile.UNIT,
      nw,
      nh,
    );
  }
  if (config.tile) {
    renderWebglNoTile(gl, root, scale, scaleIndex);
    renderWebglTile(gl, root, tileManager, tileList, scale, scaleIndex);
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
  tileManager: TileManager,
  tileList: Tile[],
  scale: number,
  scaleIndex: number,
) {
  console.log(tileList)
  const { structs, width: W, height: H, imgLoadList } = root;
  const cx = W * 0.5,
    cy = H * 0.5;
  const W2 = Tile.UNIT * scale;
  const cx2 = W2 * 0.5;
  const programs = root.programs;
  const page = root.lastPage;
  // 先检查所有tile是否完备，如果是直接渲染跳过遍历节点
  let complete = true;
  for (let i = 0, len = tileList.length; i < len; i++) {
    const tile = tileList[i];
    // console.log(i, tile);
    if (!tile.complete) {
      complete = false;
      break;
    }
  }
  const overlay = root.overlay;
  // 非完备，遍历节点渲染到Tile上
  if (!complete) {
    const page = root.lastPage!;
    const pm = page._matrixWorld || page.matrixWorld;
    // 先收集所有的Tile在当前Page的matrix下的坐标，要和节点比对
    for (let i = 0, len = tileList.length; i < len; i++) {
      const tile = tileList[i];
      tile.initTex();
      const { x: x1, y: y1, size } = tile;
      const x2 = x1 + size;
      const y2 = y1 + size;
      const bbox = calRectPoints(x1, y1, x2, y2, pm);
      tile.bbox[0] = bbox.x1;
      tile.bbox[1] = bbox.y1;
      tile.bbox[2] = bbox.x3;
      tile.bbox[3] = bbox.y3;
    }
    // 循环非overlay的节点
    for (let i = 0, len = structs.length; i < len; i++) {
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
      // 和普通渲染比没有画布索引部分，仅图片检查内容加载计数器
      if (isInScreen && node.isBitmap && (node as Bitmap).checkLoader()) {
        imgLoadList.push(node as Bitmap);
      }
      // 真正的渲染部分，比普通渲染多出的逻辑是遍历tile并且检查是否在tile中
      if (isInScreen && target && target.available) {
        const { mixBlendMode, blur } = computedStyle;
        const bbox = target.bbox;
        const sb = calRectPoints(bbox[0], bbox[1], bbox[2], bbox[3], matrix);
        // console.warn(node.props.name, sb.x1, sb.y1, sb.x2, sb.y2, sb.x3, sb.y3, sb.x4, sb.y4)
        for (let j = 0, len = tileList.length; j < len; j++) {
          const tile = tileList[j];
          const bbox = tile.bbox;
          if (!isConvexPolygonOverlapRect(
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
          // console.log(j, bbox.join(','));
          if (isBgBlur) {}
          if (mixBlendMode !== MIX_BLEND_MODE.NORMAL) {}
          // 这里才是真正生成mbm
          if (mixBlendMode !== MIX_BLEND_MODE.NORMAL) {}
        }
      }
      // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
      if (
        target &&
        target.available &&
        target !== node.textureCache[scaleIndex]
      ) {
        i += total + next;
      } else if (node.isShapeGroup) {
        i += total;
      }
    }
    // for (let j = 0, len = tileList.length; j < len; j++) {
    //   const tile = tileList[j];
    //   if (tile.complete) {
    //     continue;
    //   }
    // }
  }
  // 遍历tile，渲染，可能某个未完备，检查是否有低清版本
}

/**
 * Page的孩子可能是直接的渲染对象，也可能是画板，画板需要实现overflow:hidden的效果，如果用画板本身尺寸离屏绘制，
 * 创建的离屏FBO纹理可能会非常大，因为画板并未限制尺寸，超大尺寸情况下实现会非常复杂。可以用和画布同尺寸的一个FBO，
 * 所有的内容依旧照常绘入（可视范围外还可以跳过节省资源），最后再用mask功能裁剪掉画布范围外的即可。
 * 另外，Page的非画布孩子无需mask逻辑，只要判断是否在可视范围外即可。
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
  const cx = W * 0.5,
    cy = H * 0.5;
  const programs = root.programs;
  const page = root.lastPage;
  // 初始化工作
  const artBoardIndex: ArtBoard[] = [];
  let pageTexture = createTexture(gl, 0, undefined, W, H);
  let artBoardTexture: WebGLTexture | undefined;
  let resTexture = pageTexture;
  const resFrameBuffer = genFrameBufferWithTexture(gl, resTexture, W, H);
  // gl.clearColor(0, 0, 0, 0);
  // gl.clear(gl.COLOR_BUFFER_BIT);
  // 一般都存在，除非root改逻辑在只有自己的时候进行渲染，进入overlay后就是上层自定义内容而非sketch内容了
  const overlay = root.overlay;
  let isOverlay = false;
  const program = programs.program;
  gl.useProgram(programs.program);
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
      // 同正常逻辑检查画板end，写回Page
      if (artBoardIndex[i]) {
        resTexture = pageTexture;
        drawArtBoardClip(
          gl,
          programs,
          resTexture,
          artBoardTexture!,
          artBoardIndex[i],
          W,
          H,
          cx,
          cy,
        );
        artBoardTexture = undefined;
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
          );
        }
      }
    }
    // 真正的Page内容有高清考虑
    else {
      let target = textureTarget[scaleIndex],
        isInScreen = false;
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
        if (node.isArtBoard && total + next) {
          pageTexture = resTexture; // 防止mbm导致新生成纹理，需赋值回去给page
          artBoardIndex[i + total + next] = node as ArtBoard;
          artBoardTexture = createTexture(gl, 0, undefined, W, H);
          resTexture = artBoardTexture;
          // 背景色需要画在page，否则会干扰mbm
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            pageTexture,
            0,
          );
          (node as ArtBoard).renderBgc(gl, cx, cy);
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            resTexture,
            0,
          );
          gl.useProgram(program);
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
          resTexture = genBgBlur(
            gl,
            resTexture,
            node,
            node._matrixWorld,
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
          if (artBoardTexture) {
            artBoardTexture = resTexture;
          } else {
            pageTexture = resTexture;
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
          if (artBoardTexture) {
            artBoardTexture = resTexture;
          } else {
            pageTexture = resTexture;
          }
        }
      }
      // 有局部子树缓存可以跳过其所有子孙节点，特殊的shapeGroup是个bo运算组合，已考虑所有子节点的结果
      if (
        target &&
        target.available &&
        target !== node.textureCache[scaleIndex]
      ) {
        i += total + next;
      } else if (node.isShapeGroup) {
        i += total;
      }
      // 在end处切回Page，需要先把画布的FBO实现overflow:hidden，再绘制回Page
      if (artBoardIndex[i]) {
        resTexture = pageTexture;
        drawArtBoardClip(
          gl,
          programs,
          resTexture,
          artBoardTexture!,
          artBoardIndex[i],
          W,
          H,
          cx,
          cy,
        );
        artBoardTexture = undefined;
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
        texture: pageTexture,
      },
    ],
    0,
    0,
    true,
  );
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

function drawArtBoardClip(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  programs: any,
  resTexture: WebGLTexture,
  artBoardTexture: WebGLTexture,
  artBoard: ArtBoard,
  W: number,
  H: number,
  cx: number,
  cy: number,
) {
  // 可能画板内没有超出的子节点，先判断下，节省绘制
  let needMask = false;
  const children = artBoard.children;
  const rect = artBoard._rect || artBoard.rect;
  const matrixWorld = artBoard._matrixWorld || artBoard.matrixWorld;
  // 画板一定没有旋转
  const abRect = calRectPoints(rect[0], rect[1], rect[2], rect[3], matrixWorld);
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    const bbox = child._filterBbox2 || child.filterBbox2;
    const matrix = child._matrixWorld || child.matrixWorld;
    if (checkInWorldRect(bbox, matrix, abRect.x1, abRect.y1, abRect.x3, abRect.y3)) {
      needMask = true;
      break;
    }
  }
  // 先画出类似背景色的遮罩，再绘入Page
  if (needMask) {
    const tex = createTexture(gl, 0, undefined, W, H);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0,
    );
    artBoard.renderBgc(gl, cx, cy, [1.0, 1.0, 1.0, 1.0]);
    const tex2 = createTexture(gl, 0, undefined, W, H);
    const maskProgram = programs.maskProgram;
    gl.useProgram(maskProgram);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex2,
      0,
    );
    drawMask(gl, maskProgram, tex, artBoardTexture!);
    gl.deleteTexture(tex);
    gl.deleteTexture(artBoardTexture!);
    artBoardTexture = tex2;
    gl.useProgram(programs.program);
  }
  // 无超出的直接绘制回Page即可，mask也复用这段逻辑
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    resTexture,
    0,
  );
  drawTextureCache(
    gl,
    cx,
    cy,
    programs.program,
    [
      {
        opacity: 1,
        bbox: new Float64Array([0, 0, W, H]),
        texture: artBoardTexture!,
      },
    ],
    0,
    0,
    false,
  );
  // 退出画板删除且置空标明回到Page上
  gl.deleteTexture(artBoardTexture!);
}
