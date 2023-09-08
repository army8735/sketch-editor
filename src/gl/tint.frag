#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture;
uniform vec4 u_tint;

void main() {
  vec4 color = texture2D(u_texture, v_texCoords);
  if (color.a <= 0.0) {
    discard;
  }
  gl_FragColor = u_tint * color.a;
}
