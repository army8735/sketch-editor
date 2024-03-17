import JSZip from 'jszip';
import SketchFormat from '@sketch-hq/sketch-file-format-ts';
import { ArtBoardProps, JNode, Props, TAG_NAME } from '../format';
import { convertCoords2Gl } from '../gl/webgl';
import { calRectPoints } from '../math/matrix';
import { color2gl } from '../style/css';
import Container from './Container';
import Node from './Node';
import Tile from '../refresh/Tile';

const SHADOW_SIZE = 8;

class ArtBoard extends Container {
  hasBackgroundColor: boolean;
  resizesContent: boolean;
  includeBackgroundColorInExport: boolean;

  constructor(props: ArtBoardProps, children: Array<Node>) {
    super(props as Props, children);
    this.hasBackgroundColor = props.hasBackgroundColor;
    this.resizesContent = props.resizesContent;
    this.includeBackgroundColorInExport = props.includeBackgroundColorInExport;
    this.isArtBoard = true;
    this.artBoard = this;
  }

  // 画板有自定义背景色时有内容
  override calContent(): boolean {
    return (this.hasContent = this.hasBackgroundColor);
  }

  override rename(s: string) {
    super.rename(s);
    this.root?.overlay?.updateArtBoard(this);
  }

  // 在没有背景色的情况下渲染默认白色背景，有则渲染颜色
  renderBgc(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    cx: number,
    cy: number,
  ) {
    const programs = this.root!.programs;
    const { width, height, matrixWorld } = this;
    // 白色背景
    const bgColorProgram = programs.bgColorProgram;
    gl.useProgram(bgColorProgram);
    // 矩形固定2个三角形
    const t = calRectPoints(0, 0, width, height, matrixWorld);
    const vtPoint = new Float32Array(8);
    const t1 = convertCoords2Gl(t.x1, t.y1, cx, cy, false);
    const t2 = convertCoords2Gl(t.x2, t.y2, cx, cy, false);
    const t3 = convertCoords2Gl(t.x3, t.y3, cx, cy, false);
    const t4 = convertCoords2Gl(t.x4, t.y4, cx, cy, false);
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
    const a_position = gl.getAttribLocation(bgColorProgram, 'a_position');
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);
    // color
    const u_color = gl.getUniformLocation(bgColorProgram, 'u_color');
    const color = color2gl(this.computedStyle.backgroundColor);
    gl.uniform4f(u_color, color[0], color[1], color[2], color[3]);
    // 渲染并销毁
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.deleteBuffer(pointBuffer);
    gl.disableVertexAttribArray(a_position);

    // 阴影部分的计算渲染
    const bgShadowProgram = programs.bgShadowProgram;
    gl.useProgram(bgShadowProgram);
    // 顶点buffer
    const pointBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const a_position2 = gl.getAttribLocation(bgShadowProgram, 'a_position');
    gl.vertexAttribPointer(a_position2, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position2);
    const u_tl = gl.getUniformLocation(bgShadowProgram, 'u_tl');
    gl.uniform2f(u_tl, t1.x, t1.y);
    const u_br = gl.getUniformLocation(bgShadowProgram, 'u_br');
    gl.uniform2f(u_br, t3.x, t3.y);
    // color
    const u_color2 = gl.getUniformLocation(bgShadowProgram, 'u_color');
    gl.uniform4f(u_color2, 0.0, 0.0, 0.0, 0.2);
    const u_radius = gl.getUniformLocation(bgShadowProgram, 'u_radius');
    gl.uniform2f(u_radius, SHADOW_SIZE / cx, SHADOW_SIZE / cy);
    // 渲染并销毁
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.deleteBuffer(pointBuffer2);
    gl.disableVertexAttribArray(a_position2);
    gl.useProgram(programs.program);
  }

  renderBgcTile(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    cx2: number,
    cx: number,
    cy: number,
    factor: number,
    tile: Tile,
    ab: { x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number },
  ) {
    const programs = this.root!.programs;
    // 白色背景
    const bgColorProgram = programs.bgColorProgram;
    gl.useProgram(bgColorProgram);
    // 矩形固定2个三角形
    const t = {
      x1: ab.x1 - tile.x * factor,
      y1: ab.y1 - tile.y * factor,
      x2: ab.x2 - tile.x * factor,
      y2: ab.y2 - tile.y * factor,
      x3: ab.x3 - tile.x * factor,
      y3: ab.y3 - tile.y * factor,
      x4: ab.x4 - tile.x * factor,
      y4: ab.y4 - tile.y * factor,
    };
    const vtPoint = new Float32Array(8);
    const t1 = convertCoords2Gl(t.x1, t.y1, cx2, cx2, false);
    const t2 = convertCoords2Gl(t.x2, t.y2, cx2, cx2, false);
    const t3 = convertCoords2Gl(t.x3, t.y3, cx2, cx2, false);
    const t4 = convertCoords2Gl(t.x4, t.y4, cx2, cx2, false);
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
    const a_position = gl.getAttribLocation(bgColorProgram, 'a_position');
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);
    // color
    const u_color = gl.getUniformLocation(bgColorProgram, 'u_color');
    const color = color2gl(this.computedStyle.backgroundColor);
    gl.uniform4f(u_color, color[0], color[1], color[2], color[3]);
    // 渲染并销毁
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.deleteBuffer(pointBuffer);
    gl.disableVertexAttribArray(a_position);

    // 阴影部分的计算渲染
    const bgShadowProgram = programs.bgShadowProgram;
    gl.useProgram(bgShadowProgram);
    // 顶点buffer
    const pointBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const a_position2 = gl.getAttribLocation(bgShadowProgram, 'a_position');
    gl.vertexAttribPointer(a_position2, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position2);
    const u_tl = gl.getUniformLocation(bgShadowProgram, 'u_tl');
    gl.uniform2f(u_tl, t1.x, t1.y);
    const u_br = gl.getUniformLocation(bgShadowProgram, 'u_br');
    gl.uniform2f(u_br, t3.x, t3.y);
    // color
    const u_color2 = gl.getUniformLocation(bgShadowProgram, 'u_color');
    gl.uniform4f(u_color2, 0.0, 0.0, 0.0, 0.2);
    const u_radius = gl.getUniformLocation(bgShadowProgram, 'u_radius');
    gl.uniform2f(u_radius, SHADOW_SIZE / cx, SHADOW_SIZE / cy);
    // 渲染并销毁
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.deleteBuffer(pointBuffer2);
    gl.disableVertexAttribArray(a_position2);
    gl.useProgram(programs.program);
  }

  override toJson(): JNode {
    const res = super.toJson();
    res.tagName = TAG_NAME.ART_BOARD;
    return res;
  }

  override async toSketchJson(zip: JSZip, filter?: (node: Node) => boolean): Promise<SketchFormat.Artboard> {
    const json = await super.toSketchJson(zip, filter) as SketchFormat.Artboard;
    json._class = SketchFormat.ClassValue.Artboard;
    json.hasClickThrough = false;
    json.includeBackgroundColorInExport = false;
    json.isFlowHome = false;
    json.resizesContent = this.resizesContent;
    json.includeBackgroundColorInExport = this.includeBackgroundColorInExport;
    json.horizontalRulerData = {
      _class: 'rulerData',
      base: 0,
      guides: [],
    };
    json.verticalRulerData = {
      _class: 'rulerData',
      base: 0,
      guides: [],
    };
    const computedStyle = this.computedStyle;
    json.backgroundColor = {
      alpha: computedStyle.backgroundColor[3],
      blue: computedStyle.backgroundColor[2] / 255,
      green: computedStyle.backgroundColor[1] / 255,
      red: computedStyle.backgroundColor[0] / 255,
      _class: 'color',
    };
    json.hasBackgroundColor = this.hasBackgroundColor;
    const list = await Promise.all(this.children.filter(item => {
      if (filter) {
        return filter(item);
      }
      return true;
    }).map(item => {
      return item.toSketchJson(zip, filter);
    }));
    json.layers = list.map(item => {
      return item as SketchFormat.Group |
        SketchFormat.Oval |
        SketchFormat.Polygon |
        SketchFormat.Rectangle |
        SketchFormat.ShapePath |
        SketchFormat.Star |
        SketchFormat.Triangle |
        SketchFormat.ShapeGroup |
        SketchFormat.Text |
        SketchFormat.SymbolInstance |
        SketchFormat.Slice |
        SketchFormat.Hotspot |
        SketchFormat.Bitmap;
    });
    return json;
  }

  override get filterBbox() {
    let res = this._filterBbox;
    if (!res) {
      const rect = this._bbox || this.bbox;
      res = this._filterBbox = rect.slice(0);
      res[0] -= SHADOW_SIZE;
      res[1] -= SHADOW_SIZE;
      res[2] += SHADOW_SIZE;
      res[3] += SHADOW_SIZE;
    }
    return res;
  }
}

export default ArtBoard;
