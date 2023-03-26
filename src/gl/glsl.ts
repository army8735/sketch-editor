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
attribute vec4 a_color;
varying vec4 v_color;
attribute float a_opacity;
varying float v_opacity;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_color = a_color;
  v_opacity = a_opacity;
}`;

export const colorFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec4 v_color;
varying float v_opacity;

void main() {
  float opacity = v_opacity;
  if(opacity <= 0.0) {
    discard;
  }
  opacity = clamp(opacity, 0.0, 1.0);
  gl_FragColor = v_color * opacity;
}`;
