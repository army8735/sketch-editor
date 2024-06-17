attribute vec2 a_position;
varying vec4 v_position;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_position = gl_Position;
}
