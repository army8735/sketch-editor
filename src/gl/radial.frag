#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
uniform sampler2D u_texture;
uniform int u_kernel;
uniform vec2 u_center;
uniform float u_ratio;

const int MAX_KERNEL_SIZE = 2048;

void main(void) {
  if (v_texCoords.x == u_center.x && v_texCoords.y == u_center.y) {
    gl_FragColor = texture2D(u_texture, v_texCoords);
    return;
  }

  vec4 color = texture2D(u_texture, v_texCoords);
  int k = u_kernel - 1;
  float total = 1.0;
  for(int i = 1; i < MAX_KERNEL_SIZE - 1; i++) {
    if (i == k) {
      break;
    }
    total++;
    vec2 velocity = -(v_texCoords - u_center) * u_ratio;
    vec2 bias = velocity * (float(i) / float(k));
    color += texture2D(u_texture, v_texCoords + bias);
  }
  gl_FragColor = color / total;
}
