#ifdef GL_ES
precision mediump float;
#endif

varying vec2 t;
uniform sampler2D u_texture;
uniform vec2 u_direction;

vec4 a(vec2 coords, float weight) {
  return texture2D(u_texture, coords) * weight;
}

vec4 b(float offset, float weight) {
  return a(t - offset * u_direction, weight)
    + a(t + offset * u_direction, weight);
}

void main() {
  gl_FragColor = vec4(0.0);
  placeholder;
}
