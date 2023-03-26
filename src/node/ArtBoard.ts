import Node from './Node';
import { ArtBoardProps } from '../format';
import Container from './Container';
import { StyleKey } from '../style';
import { calRectPoint } from '../math/matrix';
import { convertCoords2Gl } from '../gl/webgl';

class ArtBoard extends Container {
  backgroundColor: Array<number>;
  constructor(name: string, props: ArtBoardProps, children: Array<Node>) {
    super(name, props, children);
    this.backgroundColor = props.backgroundColor;
  }

  override calContent(): boolean {
    let res = super.calContent();
    const { backgroundColor, computedStyle } = this;
    if (!res) {
      const {
        [StyleKey.VISIBLE]: visible,
      } = computedStyle;
      if (visible && backgroundColor && backgroundColor[3] > 0) {
        res = true;
      }
    }
    return res;
  }

  renderWebgl(gl: WebGL2RenderingContext | WebGLRenderingContext,
              cx: number, cy: number, dx: number = 0, dy: number = 0) {
    const programs = this.root!.programs;
    const colorProgram = programs.colorProgram;
    gl.useProgram(colorProgram);
    // 矩形固定2个三角形
    const vtPoint = new Float32Array(12);
    const { x, y, width, height, matrixWorld, backgroundColor } = this;
    const t = calRectPoint(x, y, x + width, y + height, matrixWorld);
    const t1 = convertCoords2Gl(t.x1, t.y1, cx, cy);
    const t2 = convertCoords2Gl(t.x2, t.y2, cx, cy);
    const t3 = convertCoords2Gl(t.x3, t.y3, cx, cy);
    const t4 = convertCoords2Gl(t.x4, t.y4, cx, cy);
    vtPoint[0] = t1.x;
    vtPoint[1] = t1.y;
    vtPoint[2] = t4.x;
    vtPoint[3] = t4.y;
    vtPoint[4] = t2.x;
    vtPoint[5] = t2.y;
    vtPoint[6] = t4.x;
    vtPoint[7] = t4.y;
    vtPoint[8] = t2.x;
    vtPoint[9] = t2.y;
    vtPoint[10] = t3.x;
    vtPoint[11] = t3.y;
    // 顶点buffer
    const pointBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
    const a_position = gl.getAttribLocation(colorProgram, 'a_position');
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);
    // color
    let u_color = gl.getUniformLocation(colorProgram, 'u_color');
    gl.uniform4f(u_color, backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);
    // 渲染并销毁
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.deleteBuffer(pointBuffer);
    gl.disableVertexAttribArray(a_position);
    // 恢复program
    gl.useProgram(programs.program);
  }
}

export default ArtBoard;
