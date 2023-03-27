import Node from './Node';
import { ArtBoardProps, Props } from '../format';
import Container from './Container';
import { StyleKey } from '../style';
import { calRectPoint } from '../math/matrix';
import { convertCoords2Gl, createTexture } from '../gl/webgl';
import inject from '../util/inject';
import { RefreshLevel } from '../refresh/level';
import { color2gl } from '../style/css';

const BOX_SHADOW = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAMNJREFUOE/t1dtKA1EMheGv1kNVFA/4/g9YPKBorVYri2bL3HTai33ZQFiTwPyTHbIzExubDLQ9V2qnrBGPrfNy8yniR4PcGK2BfvFT/g88xinOShPvYyt8YVm6SnWpKLALXOESJ5Ufg6ayb7zjDR+BBphjprJr3JXOBn3dBs2RP/GKp9JlAwZwi3vcIHE+NGbpW4AveMRz4gY8L9BDaeJ9gIsCzksXB6BDD3fO4dax6T7YXa9e9+WQ29J1fXVfsF1/AX8dHXBBVpwuPwAAAABJRU5ErkJggg==';
let BOX_SHADOW_TEXTURE: WebGLTexture;

class ArtBoard extends Container {
  hasBackgroundColor: boolean;
  constructor(name: string, props: ArtBoardProps, children: Array<Node>) {
    super(name, props as Props, children);
    this.hasBackgroundColor = props.hasBackgroundColor;
    this.isArtBoard = true;
  }

  override calContent(): boolean {
    return false;
  }

  renderWebgl(gl: WebGL2RenderingContext | WebGLRenderingContext,
              cx: number, cy: number, dx: number = 0, dy: number = 0) {
    const programs = this.root!.programs;
    const { x, y, width, height, matrixWorld, computedStyle } = this;
    // boxShadow用静态纹理渲染
    const bs = inject.IMG[BOX_SHADOW];
    if (bs) {
      const simpleProgram = programs.simpleProgram;
      gl.useProgram(simpleProgram);
      if (!BOX_SHADOW_TEXTURE) {
        BOX_SHADOW_TEXTURE = createTexture(gl, 0, bs.source);
      }
      const vtPoint = new Float32Array(96);
      const vtTex = new Float32Array(96);

      const tl = calRectPoint(x - 6, y - 6, x, y, matrixWorld);
      const t1 = convertCoords2Gl(tl.x1, tl.y1, cx, cy);
      const t2 = convertCoords2Gl(tl.x2, tl.y2, cx, cy);
      const t3 = convertCoords2Gl(tl.x3, tl.y3, cx, cy);
      const t4 = convertCoords2Gl(tl.x4, tl.y4, cx, cy);

      const tr = calRectPoint(x + width, y - 6, x + width + 6, y, matrixWorld);
      const t5 = convertCoords2Gl(tr.x1, tr.y1, cx, cy);
      const t6 = convertCoords2Gl(tr.x2, tr.y2, cx, cy);
      const t7 = convertCoords2Gl(tr.x3, tr.y3, cx, cy);
      const t8 = convertCoords2Gl(tr.x4, tr.y4, cx, cy);

      const br = calRectPoint(x + width, y + height, x + width + 6, y + height + 6, matrixWorld);
      const t9 = convertCoords2Gl(br.x1, br.y1, cx, cy);
      const t10 = convertCoords2Gl(br.x2, br.y2, cx, cy);
      const t11 = convertCoords2Gl(br.x3, br.y3, cx, cy);
      const t12 = convertCoords2Gl(br.x4, br.y4, cx, cy);

      const bl = calRectPoint(x - 6, y + height, x, y + height + 6, matrixWorld);
      const t13 = convertCoords2Gl(bl.x1, bl.y1, cx, cy);
      const t14 = convertCoords2Gl(bl.x2, bl.y2, cx, cy);
      const t15 = convertCoords2Gl(bl.x3, bl.y3, cx, cy);
      const t16 = convertCoords2Gl(bl.x4, bl.y4, cx, cy);

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

      vtPoint[12] = t2.x;
      vtPoint[13] = t2.y;
      vtPoint[14] = t3.x;
      vtPoint[15] = t3.y;
      vtPoint[16] = t5.x;
      vtPoint[17] = t5.y;
      vtPoint[18] = t3.x;
      vtPoint[19] = t3.y;
      vtPoint[20] = t5.x;
      vtPoint[21] = t5.y;
      vtPoint[22] = t8.x;
      vtPoint[23] = t8.y;

      vtPoint[24] = t5.x;
      vtPoint[25] = t5.y;
      vtPoint[26] = t8.x;
      vtPoint[27] = t8.y;
      vtPoint[28] = t6.x;
      vtPoint[29] = t6.y;
      vtPoint[30] = t8.x;
      vtPoint[31] = t8.y;
      vtPoint[32] = t6.x;
      vtPoint[33] = t6.y;
      vtPoint[34] = t7.x;
      vtPoint[35] = t7.y;

      vtPoint[36] = t8.x;
      vtPoint[37] = t8.y;
      vtPoint[38] = t9.x;
      vtPoint[39] = t9.y;
      vtPoint[40] = t7.x;
      vtPoint[41] = t7.y;
      vtPoint[42] = t9.x;
      vtPoint[43] = t9.y;
      vtPoint[44] = t7.x;
      vtPoint[45] = t7.y;
      vtPoint[46] = t10.x;
      vtPoint[47] = t10.y;

      vtPoint[48] = t9.x;
      vtPoint[49] = t9.y;
      vtPoint[50] = t12.x;
      vtPoint[51] = t12.y;
      vtPoint[52] = t10.x;
      vtPoint[53] = t10.y;
      vtPoint[54] = t12.x;
      vtPoint[55] = t12.y;
      vtPoint[56] = t10.x;
      vtPoint[57] = t10.y;
      vtPoint[58] = t11.x;
      vtPoint[59] = t11.y;

      vtPoint[60] = t14.x;
      vtPoint[61] = t14.y;
      vtPoint[62] = t15.x;
      vtPoint[63] = t15.y;
      vtPoint[64] = t9.x;
      vtPoint[65] = t9.y;
      vtPoint[66] = t15.x;
      vtPoint[67] = t15.y;
      vtPoint[68] = t9.x;
      vtPoint[69] = t9.y;
      vtPoint[70] = t12.x;
      vtPoint[71] = t12.y;

      vtPoint[72] = t13.x;
      vtPoint[73] = t13.y;
      vtPoint[74] = t16.x;
      vtPoint[75] = t16.y;
      vtPoint[76] = t14.x;
      vtPoint[77] = t14.y;
      vtPoint[78] = t16.x;
      vtPoint[79] = t16.y;
      vtPoint[80] = t14.x;
      vtPoint[81] = t14.y;
      vtPoint[82] = t15.x;
      vtPoint[83] = t15.y;

      vtPoint[84] = t4.x;
      vtPoint[85] = t4.y;
      vtPoint[86] = t13.x;
      vtPoint[87] = t13.y;
      vtPoint[88] = t3.x;
      vtPoint[89] = t3.y;
      vtPoint[90] = t13.x;
      vtPoint[91] = t13.y;
      vtPoint[92] = t3.x;
      vtPoint[93] = t3.y;
      vtPoint[94] = t14.x;
      vtPoint[95] = t14.y;

      vtTex[0] = 0;
      vtTex[1] = 0;
      vtTex[2] = 0;
      vtTex[3] = 0.3;
      vtTex[4] = 0.3;
      vtTex[5] = 0;
      vtTex[6] = 0;
      vtTex[7] = 0.3;
      vtTex[8] = 0.3;
      vtTex[9] = 0;
      vtTex[10] = 0.3;
      vtTex[11] = 0.3;

      vtTex[12] = 0.3;
      vtTex[13] = 0;
      vtTex[14] = 0.3;
      vtTex[15] = 0.3;
      vtTex[16] = 0.7;
      vtTex[17] = 0;
      vtTex[18] = 0.3;
      vtTex[19] = 0.3;
      vtTex[20] = 0.7;
      vtTex[21] = 0;
      vtTex[22] = 0.7;
      vtTex[23] = 0.3;

      vtTex[24] = 0.7;
      vtTex[25] = 0;
      vtTex[26] = 0.7;
      vtTex[27] = 0.3;
      vtTex[28] = 1;
      vtTex[29] = 0;
      vtTex[30] = 0.7;
      vtTex[31] = 0.3;
      vtTex[32] = 1;
      vtTex[33] = 0;
      vtTex[34] = 1;
      vtTex[35] = 0.3;

      vtTex[36] = 0.7;
      vtTex[37] = 0.3;
      vtTex[38] = 0.7;
      vtTex[39] = 0.7;
      vtTex[40] = 1;
      vtTex[41] = 0.3;
      vtTex[42] = 0.7;
      vtTex[43] = 0.7;
      vtTex[44] = 1;
      vtTex[45] = 0.3;
      vtTex[46] = 1;
      vtTex[47] = 0.7;

      vtTex[48] = 0.7;
      vtTex[49] = 0.7;
      vtTex[50] = 0.7;
      vtTex[51] = 1;
      vtTex[52] = 1;
      vtTex[53] = 0.7;
      vtTex[54] = 0.7;
      vtTex[55] = 1;
      vtTex[56] = 1;
      vtTex[57] = 0.7;
      vtTex[58] = 1;
      vtTex[59] = 1;

      vtTex[60] = 0.3;
      vtTex[61] = 0.7;
      vtTex[62] = 0.3;
      vtTex[63] = 1;
      vtTex[64] = 0.7;
      vtTex[65] = 0.7;
      vtTex[66] = 0.3;
      vtTex[67] = 1;
      vtTex[68] = 0.7;
      vtTex[69] = 0.7;
      vtTex[70] = 0.7;
      vtTex[71] = 1;

      vtTex[72] = 0;
      vtTex[73] = 0.7;
      vtTex[74] = 0;
      vtTex[75] = 1;
      vtTex[76] = 0.3;
      vtTex[77] = 0.7;
      vtTex[78] = 0;
      vtTex[79] = 1;
      vtTex[80] = 0.3;
      vtTex[81] = 0.7;
      vtTex[82] = 0.3;
      vtTex[83] = 1;

      vtTex[84] = 0;
      vtTex[85] = 0.3;
      vtTex[86] = 0;
      vtTex[87] = 0.7;
      vtTex[88] = 0.3;
      vtTex[89] = 0.3;
      vtTex[90] = 0;
      vtTex[91] = 0.7;
      vtTex[92] = 0.3;
      vtTex[93] = 0.3;
      vtTex[94] = 0.3;
      vtTex[95] = 0.7;

      // 顶点buffer
      const pointBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(simpleProgram, 'a_position');
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_position);
      // 纹理buffer
      const texBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
      let a_texCoords = gl.getAttribLocation(simpleProgram, 'a_texCoords');
      gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_texCoords);
      // 纹理单元
      let u_texture = gl.getUniformLocation(simpleProgram, 'u_texture');
      gl.uniform1i(u_texture, 0);
      // 渲染并销毁
      gl.drawArrays(gl.TRIANGLES, 0, 48);
      gl.deleteBuffer(pointBuffer);
      gl.deleteBuffer(texBuffer);
      gl.disableVertexAttribArray(a_position);
      gl.disableVertexAttribArray(a_texCoords);
    }
    else {
      // 加载后重新渲染
      inject.measureImg(BOX_SHADOW, () => {
        this.root!.addUpdate(this, [], RefreshLevel.CACHE, false, false, false, undefined);
      });
    }
    // 白色背景
    const colorProgram = programs.colorProgram;
    gl.useProgram(colorProgram);
    // 矩形固定2个三角形
    const t = calRectPoint(x, y, x + width, y + height, matrixWorld);
    const vtPoint = new Float32Array(12);
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
    const color = color2gl(computedStyle[StyleKey.BACKGROUND_COLOR]);
    gl.uniform4f(u_color, color[0], color[1], color[2], color[3]);
    // 渲染并销毁
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.deleteBuffer(pointBuffer);
    gl.disableVertexAttribArray(a_position);
    // 恢复program
    gl.useProgram(programs.program);
  }
}

export default ArtBoard;
