#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
uniform sampler2D u_texture;
uniform vec2 u_direction;

vec4 a(vec2 coords, float weight) {
  return texture2D(u_texture, coords) * weight;
}

vec4 b(float offset, float weight) {
  return a(v_texCoords - offset * u_direction, weight)
    + a(v_texCoords + offset * u_direction, weight);
}

void main() {
  gl_FragColor = vec4(0.0);
  placeholder;
}
