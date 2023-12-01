#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec4 v_position;
varying vec2 v_texCoords;
varying float v_opacity;
uniform float x1;
uniform float y1;
uniform float x2;
uniform float y2;
uniform sampler2D u_texture;

void main() {
  if (v_position.x < x1 || v_position.x > x2 || v_position.y < y1 || v_position.y > y2) {
    discard;
  }
  float opacity = v_opacity;
  if(opacity <= 0.0) {
    discard;
  }
  opacity = clamp(opacity, 0.0, 1.0);
  vec4 color = texture2D(u_texture, v_texCoords);
  gl_FragColor = color * opacity;
}
