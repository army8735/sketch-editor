attribute vec2 a_position;
attribute vec2 a_texCoords;
varying vec2 t;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  t = a_texCoords;
}
