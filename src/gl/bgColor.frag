#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
