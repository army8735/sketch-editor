import Node from '../node/Node';
import { calRectPoint } from '../math/matrix';
import TextureCache from '../refresh/TextureCache';

export function createTexture(gl: WebGL2RenderingContext | WebGLRenderingContext, n: number,
                              tex?: TexImageSource, width?: number, height?: number): WebGLTexture {
  let texture = gl.createTexture()!;
  bindTexture(gl, texture, n);
  // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  // 传入需要绑定的纹理
  if (tex) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
  }
  // 或者尺寸来绑定fbo
  else if (width && height) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }
  else {
    throw new Error('Missing texImageSource or w/h');
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

export function bindTexture(gl: WebGL2RenderingContext | WebGLRenderingContext,
                            texture: WebGLTexture, n: number) {
  // @ts-ignore
  gl.activeTexture(gl['TEXTURE' + n]);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

export type DrawData = {
  node: Node,
  opacity: number,
  matrix: Float64Array,
  cache: TextureCache,
};

export function drawTextureCache(gl: WebGL2RenderingContext | WebGLRenderingContext, cx: number, cy: number,
                                 program: any, list: Array<DrawData>, vertCount: number) {
  if (!list.length || !vertCount) {
    return;
  }
  const vtPoint = new Float32Array(vertCount * 12)
  const vtTex = new Float32Array(vertCount * 12);
  const vtOpacity = new Float32Array(vertCount * 6);
  for (let i = 0, len = list.length; i < len; i++) {
    const { node, opacity, matrix, cache } = list[i];
    const { texture } = cache;
    bindTexture(gl, texture, 0);
    const bbox = node._bbox || node.bbox;
    const t = calRectPoint(bbox[0], bbox[1], bbox[2], bbox[3], matrix);
    const t1 = convertCoords2Gl(t.x1, t.y1, cx, cy);
    const t2 = convertCoords2Gl(t.x2, t.y2, cx, cy);
    const t3 = convertCoords2Gl(t.x3, t.y3, cx, cy);
    const t4 = convertCoords2Gl(t.x4, t.y4, cx, cy);
    let k = i * 12;
    vtPoint[k] = t1.x;
    vtPoint[k + 1] = t1.y;
    vtPoint[k + 2] = t4.x;
    vtPoint[k + 3] = t4.y;
    vtPoint[k + 4] = t2.x;
    vtPoint[k + 5] = t2.y;
    vtPoint[k + 6] = t4.x;
    vtPoint[k + 7] = t4.y;
    vtPoint[k + 8] = t2.x;
    vtPoint[k + 9] = t2.y;
    vtPoint[k + 10] = t3.x;
    vtPoint[k + 11] = t3.y;
    vtTex[k] = 0;
    vtTex[k + 1] = 0;
    vtTex[k + 2] = 0;
    vtTex[k + 3] = 1;
    vtTex[k + 4] = 1;
    vtTex[k + 5] = 0;
    vtTex[k + 6] = 0;
    vtTex[k + 7] = 1;
    vtTex[k + 8] = 1;
    vtTex[k + 9] = 0;
    vtTex[k + 10] = 1;
    vtTex[k + 11] = 1;
    k = i * 6;
    vtOpacity[k] = opacity;
    vtOpacity[k + 1] = opacity;
    vtOpacity[k + 2] = opacity;
    vtOpacity[k + 3] = opacity;
    vtOpacity[k + 4] = opacity;
    vtOpacity[k + 5] = opacity;
  }
  // 顶点buffer
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtPoint, gl.STATIC_DRAW);
  const a_position = gl.getAttribLocation(program, 'a_position');
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_position);
  // 纹理buffer
  const texBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtTex, gl.STATIC_DRAW);
  let a_texCoords = gl.getAttribLocation(program, 'a_texCoords');
  gl.vertexAttribPointer(a_texCoords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_texCoords);
  // opacity buffer
  const opacityBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, opacityBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vtOpacity, gl.STATIC_DRAW);
  const a_opacity = gl.getAttribLocation(program, 'a_opacity');
  gl.vertexAttribPointer(a_opacity, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_opacity);
  // 纹理单元
  let u_texture = gl.getUniformLocation(program, 'u_texture');
  gl.uniform1i(u_texture, 0);
  // 渲染并销毁
  gl.drawArrays(gl.TRIANGLES, 0, vertCount * 6);
  gl.deleteBuffer(pointBuffer);
  gl.deleteBuffer(texBuffer);
  gl.deleteBuffer(opacityBuffer);
  gl.disableVertexAttribArray(a_position);
  gl.disableVertexAttribArray(a_texCoords);
  gl.disableVertexAttribArray(a_opacity);

}

export function convertCoords2Gl(x: number, y: number, cx: number, cy: number) {
  if(x === cx) {
    x = 0;
  }
  else {
    x = (x - cx) / cx;
  }
  if(y === cy) {
    y = 0;
  }
  else {
    y = (cy - y) / cy;
  }
  return { x, y };
}
