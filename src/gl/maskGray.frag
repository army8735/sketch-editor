#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform vec2 u_d;

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  if (color1.a <= 0.0) {
    discard;
  }
  vec4 color2 = texture2D(u_texture2, v_texCoords + u_d);
  if (color2.a <= 0.0) {
    discard;
  }
  float gray = max(color1.r, max(color1.g, color1.b));
  gl_FragColor = color2 * color1.a * gray;
}
