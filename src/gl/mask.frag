#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  if (color1.a <= 0.0) {
    discard;
  }
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if (color2.a <= 0.0) {
    discard;
  }
  gl_FragColor = color2 * color1.a;
}
