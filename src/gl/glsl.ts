export const mainVert = `#version 100

attribute vec2 a_position;
attribute vec2 a_texCoords;
varying vec2 v_texCoords;
attribute float a_opacity;
varying float v_opacity;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoords = a_texCoords;
  v_opacity = a_opacity;
}`;

export const mainFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
varying float v_opacity;

uniform sampler2D u_texture;

void main() {
  float opacity = v_opacity;
  if(opacity <= 0.0) {
    discard;
  }
  opacity = clamp(opacity, 0.0, 1.0);
  vec4 color = texture2D(u_texture, v_texCoords);
  gl_FragColor = color * opacity;
}`;

export const colorVert = `#version 100

attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0, 1);
}`;

export const colorFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}`;

export const simpleVert = `#version 100

attribute vec2 a_position;
attribute vec2 a_texCoords;
varying vec2 v_texCoords;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoords = a_texCoords;
}`;

export const simpleFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture;

void main() {
  vec4 color = texture2D(u_texture, v_texCoords);
  gl_FragColor = color;
}`;

export const maskVert = `#version 100

attribute vec4 a_position;

attribute vec2 a_texCoords;
varying vec2 v_texCoords;

void main() {
  gl_Position = a_position;
  v_texCoords = a_texCoords;
}`;

export const maskFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

uniform int mode;

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  float a = color1.a * color2.a;
  if (a <= 0.0) {
    discard;
  }
  gl_FragColor = vec4(color2.rgb, a);
}`;
