import { ArtBoardProps, Props } from '../format';
import { convertCoords2Gl } from '../gl/webgl';
import { calRectPoints } from '../math/matrix';
import { color2gl } from '../style/css';
import Container from './Container';
import Node from './Node';

class ArtBoard extends Container {
  hasBackgroundColor: boolean;
  constructor(props: ArtBoardProps, children: Array<Node>) {
    super(props as Props, children);
    this.hasBackgroundColor = props.hasBackgroundColor;
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

  collectBsData(
    index: number,
    bsPoint: Float32Array,
    bsTex: Float32Array,
    cx: number,
    cy: number,
  ) {
    const { width, height, matrixWorld } = this;
    let zoom = this.getZoom();
    if (zoom < 1) {
      zoom = Math.sqrt(zoom);
    }

    // 先boxShadow部分
    const tl = calRectPoints(-4 / zoom, -4 / zoom, 0, 0, matrixWorld);
    const t1 = convertCoords2Gl(tl.x1, tl.y1, cx, cy, false);
    const t2 = convertCoords2Gl(tl.x2, tl.y2, cx, cy, false);
    const t3 = convertCoords2Gl(tl.x3, tl.y3, cx, cy, false);
    const t4 = convertCoords2Gl(tl.x4, tl.y4, cx, cy, false);

    const tr = calRectPoints(
      width,
      -4 / zoom,
      width + 4 / zoom,
      0,
      matrixWorld,
    );
    const t5 = convertCoords2Gl(tr.x1, tr.y1, cx, cy, false);
    const t6 = convertCoords2Gl(tr.x2, tr.y2, cx, cy, false);
    const t7 = convertCoords2Gl(tr.x3, tr.y3, cx, cy, false);
    const t8 = convertCoords2Gl(tr.x4, tr.y4, cx, cy, false);

    const br = calRectPoints(
      width,
      height,
      width + 4 / zoom,
      height + 4 / zoom,
      matrixWorld,
    );
    const t9 = convertCoords2Gl(br.x1, br.y1, cx, cy, false);
    const t10 = convertCoords2Gl(br.x2, br.y2, cx, cy, false);
    const t11 = convertCoords2Gl(br.x3, br.y3, cx, cy, false);
    const t12 = convertCoords2Gl(br.x4, br.y4, cx, cy, false);

    const bl = calRectPoints(
      -4 / zoom,
      height,
      0,
      height + 4 / zoom,
      matrixWorld,
    );
    const t13 = convertCoords2Gl(bl.x1, bl.y1, cx, cy, false);
    const t14 = convertCoords2Gl(bl.x2, bl.y2, cx, cy, false);
    const t15 = convertCoords2Gl(bl.x3, bl.y3, cx, cy, false);
    const t16 = convertCoords2Gl(bl.x4, bl.y4, cx, cy, false);

    const j = index * 96;
    bsPoint[j] = t1.x;
    bsPoint[j + 1] = t1.y;
    bsPoint[j + 2] = t4.x;
    bsPoint[j + 3] = t4.y;
    bsPoint[j + 4] = t2.x;
    bsPoint[j + 5] = t2.y;
    bsPoint[j + 6] = t4.x;
    bsPoint[j + 7] = t4.y;
    bsPoint[j + 8] = t2.x;
    bsPoint[j + 9] = t2.y;
    bsPoint[j + 10] = t3.x;
    bsPoint[j + 11] = t3.y;

    bsPoint[j + 12] = t2.x;
    bsPoint[j + 13] = t2.y;
    bsPoint[j + 14] = t3.x;
    bsPoint[j + 15] = t3.y;
    bsPoint[j + 16] = t5.x;
    bsPoint[j + 17] = t5.y;
    bsPoint[j + 18] = t3.x;
    bsPoint[j + 19] = t3.y;
    bsPoint[j + 20] = t5.x;
    bsPoint[j + 21] = t5.y;
    bsPoint[j + 22] = t8.x;
    bsPoint[j + 23] = t8.y;

    bsPoint[j + 24] = t5.x;
    bsPoint[j + 25] = t5.y;
    bsPoint[j + 26] = t8.x;
    bsPoint[j + 27] = t8.y;
    bsPoint[j + 28] = t6.x;
    bsPoint[j + 29] = t6.y;
    bsPoint[j + 30] = t8.x;
    bsPoint[j + 31] = t8.y;
    bsPoint[j + 32] = t6.x;
    bsPoint[j + 33] = t6.y;
    bsPoint[j + 34] = t7.x;
    bsPoint[j + 35] = t7.y;

    bsPoint[j + 36] = t8.x;
    bsPoint[j + 37] = t8.y;
    bsPoint[j + 38] = t9.x;
    bsPoint[j + 39] = t9.y;
    bsPoint[j + 40] = t7.x;
    bsPoint[j + 41] = t7.y;
    bsPoint[j + 42] = t9.x;
    bsPoint[j + 43] = t9.y;
    bsPoint[j + 44] = t7.x;
    bsPoint[j + 45] = t7.y;
    bsPoint[j + 46] = t10.x;
    bsPoint[j + 47] = t10.y;

    bsPoint[j + 48] = t9.x;
    bsPoint[j + 49] = t9.y;
    bsPoint[j + 50] = t12.x;
    bsPoint[j + 51] = t12.y;
    bsPoint[j + 52] = t10.x;
    bsPoint[j + 53] = t10.y;
    bsPoint[j + 54] = t12.x;
    bsPoint[j + 55] = t12.y;
    bsPoint[j + 56] = t10.x;
    bsPoint[j + 57] = t10.y;
    bsPoint[j + 58] = t11.x;
    bsPoint[j + 59] = t11.y;

    bsPoint[j + 60] = t14.x;
    bsPoint[j + 61] = t14.y;
    bsPoint[j + 62] = t15.x;
    bsPoint[j + 63] = t15.y;
    bsPoint[j + 64] = t9.x;
    bsPoint[j + 65] = t9.y;
    bsPoint[j + 66] = t15.x;
    bsPoint[j + 67] = t15.y;
    bsPoint[j + 68] = t9.x;
    bsPoint[j + 69] = t9.y;
    bsPoint[j + 70] = t12.x;
    bsPoint[j + 71] = t12.y;

    bsPoint[j + 72] = t13.x;
    bsPoint[j + 73] = t13.y;
    bsPoint[j + 74] = t16.x;
    bsPoint[j + 75] = t16.y;
    bsPoint[j + 76] = t14.x;
    bsPoint[j + 77] = t14.y;
    bsPoint[j + 78] = t16.x;
    bsPoint[j + 79] = t16.y;
    bsPoint[j + 80] = t14.x;
    bsPoint[j + 81] = t14.y;
    bsPoint[j + 82] = t15.x;
    bsPoint[j + 83] = t15.y;

    bsPoint[j + 84] = t4.x;
    bsPoint[j + 85] = t4.y;
    bsPoint[j + 86] = t13.x;
    bsPoint[j + 87] = t13.y;
    bsPoint[j + 88] = t3.x;
    bsPoint[j + 89] = t3.y;
    bsPoint[j + 90] = t13.x;
    bsPoint[j + 91] = t13.y;
    bsPoint[j + 92] = t3.x;
    bsPoint[j + 93] = t3.y;
    bsPoint[j + 94] = t14.x;
    bsPoint[j + 95] = t14.y;

    bsTex[j] = 0;
    bsTex[j + 1] = 0;
    bsTex[j + 2] = 0;
    bsTex[j + 3] = 0.3;
    bsTex[j + 4] = 0.3;
    bsTex[j + 5] = 0;
    bsTex[j + 6] = 0;
    bsTex[j + 7] = 0.3;
    bsTex[j + 8] = 0.3;
    bsTex[j + 9] = 0;
    bsTex[j + 10] = 0.3;
    bsTex[j + 11] = 0.3;

    bsTex[j + 12] = 0.3;
    bsTex[j + 13] = 0;
    bsTex[j + 14] = 0.3;
    bsTex[j + 15] = 0.3;
    bsTex[j + 16] = 0.7;
    bsTex[j + 17] = 0;
    bsTex[j + 18] = 0.3;
    bsTex[j + 19] = 0.3;
    bsTex[j + 20] = 0.7;
    bsTex[j + 21] = 0;
    bsTex[j + 22] = 0.7;
    bsTex[j + 23] = 0.3;

    bsTex[j + 24] = 0.7;
    bsTex[j + 25] = 0;
    bsTex[j + 26] = 0.7;
    bsTex[j + 27] = 0.3;
    bsTex[j + 28] = 1;
    bsTex[j + 29] = 0;
    bsTex[j + 30] = 0.7;
    bsTex[j + 31] = 0.3;
    bsTex[j + 32] = 1;
    bsTex[j + 33] = 0;
    bsTex[j + 34] = 1;
    bsTex[j + 35] = 0.3;

    bsTex[j + 36] = 0.7;
    bsTex[j + 37] = 0.3;
    bsTex[j + 38] = 0.7;
    bsTex[j + 39] = 0.7;
    bsTex[j + 40] = 1;
    bsTex[j + 41] = 0.3;
    bsTex[j + 42] = 0.7;
    bsTex[j + 43] = 0.7;
    bsTex[j + 44] = 1;
    bsTex[j + 45] = 0.3;
    bsTex[j + 46] = 1;
    bsTex[j + 47] = 0.7;

    bsTex[j + 48] = 0.7;
    bsTex[j + 49] = 0.7;
    bsTex[j + 50] = 0.7;
    bsTex[j + 51] = 1;
    bsTex[j + 52] = 1;
    bsTex[j + 53] = 0.7;
    bsTex[j + 54] = 0.7;
    bsTex[j + 55] = 1;
    bsTex[j + 56] = 1;
    bsTex[j + 57] = 0.7;
    bsTex[j + 58] = 1;
    bsTex[j + 59] = 1;

    bsTex[j + 60] = 0.3;
    bsTex[j + 61] = 0.7;
    bsTex[j + 62] = 0.3;
    bsTex[j + 63] = 1;
    bsTex[j + 64] = 0.7;
    bsTex[j + 65] = 0.7;
    bsTex[j + 66] = 0.3;
    bsTex[j + 67] = 1;
    bsTex[j + 68] = 0.7;
    bsTex[j + 69] = 0.7;
    bsTex[j + 70] = 0.7;
    bsTex[j + 71] = 1;

    bsTex[j + 72] = 0;
    bsTex[j + 73] = 0.7;
    bsTex[j + 74] = 0;
    bsTex[j + 75] = 1;
    bsTex[j + 76] = 0.3;
    bsTex[j + 77] = 0.7;
    bsTex[j + 78] = 0;
    bsTex[j + 79] = 1;
    bsTex[j + 80] = 0.3;
    bsTex[j + 81] = 0.7;
    bsTex[j + 82] = 0.3;
    bsTex[j + 83] = 1;

    bsTex[j + 84] = 0;
    bsTex[j + 85] = 0.3;
    bsTex[j + 86] = 0;
    bsTex[j + 87] = 0.7;
    bsTex[j + 88] = 0.3;
    bsTex[j + 89] = 0.3;
    bsTex[j + 90] = 0;
    bsTex[j + 91] = 0.7;
    bsTex[j + 92] = 0.3;
    bsTex[j + 93] = 0.3;
    bsTex[j + 94] = 0.3;
    bsTex[j + 95] = 0.7;
  }

  // 在没有背景色的情况下渲染默认白色背景，有则渲染颜色
  renderBgc(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    cx: number,
    cy: number,
    color?: number[], // 传入则指定color替代backgroundColor
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
    let u_color = gl.getUniformLocation(bgColorProgram, 'u_color');
    if (color) {
      gl.uniform4f(u_color, color[0], color[1], color[2], color[3]);
    } else {
      const color = color2gl(this.computedStyle.backgroundColor);
      gl.uniform4f(u_color, color[0], color[1], color[2], color[3]);
    }
    // 渲染并销毁
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.deleteBuffer(pointBuffer);
    gl.disableVertexAttribArray(a_position);
  }

  static BOX_SHADOW =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDkuMC1jMDAwIDc5LjE3MWMyN2ZhYiwgMjAyMi8wOC8xNi0yMjozNTo0MSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6Q0YxOEMzRkFDNTZDMTFFRDhBRDU5QTAxNUFGMjI5QTAiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Q0YxOEMzRjlDNTZDMTFFRDhBRDU5QTAxNUFGMjI5QTAiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCRDFFMUYwM0M0QTExMUVEOTIxOUREMjgyNjUzODRENSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCRDFFMUYwNEM0QTExMUVEOTIxOUREMjgyNjUzODRENSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PrnWkg0AAACjSURBVHja7JXhCsIwDISTLsr2/i8rbjZueMGjbJhJ/+nBQSj0o224VOUllbe4zsi5VgIUWE9AHa6wGMEMHuCMHvAC1xY4rr4CqInTbbD76luc0uiKA2AT4BnggnoOjlEj4qrb2iUJFNqn/Ibc4XD5AKx7DSzSWX/gLwDtIOwR+Mxg8D2gN0GXE9GLfR5Ab4IuXwyHADrHrMv46j5gtfcX8BRgAOX7OzJVtOaeAAAAAElFTkSuQmCC';
}

export default ArtBoard;
