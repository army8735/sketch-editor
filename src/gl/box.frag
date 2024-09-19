#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
uniform sampler2D u_texture;
uniform float u_pw;
uniform float u_ph;
uniform int u_r;
uniform int u_direction;

const int MAX_KERNEL_SIZE = 2048;

void main() {
  vec4 color = texture2D(u_texture, v_texCoords);
  float total = 1.0;
  for (int i = 1; i < MAX_KERNEL_SIZE; i++) {
    if (u_direction == 0) {
      float offset = float(i) * u_pw;
      color += texture2D(u_texture, vec2(v_texCoords.x + offset, v_texCoords.y));
      color += texture2D(u_texture, vec2(v_texCoords.x - offset, v_texCoords.y));
    }
    else {
      float offset = float(i) * u_ph;
      color += texture2D(u_texture, vec2(v_texCoords.x, v_texCoords.y + offset));
      color += texture2D(u_texture, vec2(v_texCoords.x, v_texCoords.y - offset));
    }
    total += 2.0;
    if (i == u_r) {
      break;
    }
  }
  gl_FragColor = color / total;
}
