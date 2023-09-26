#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
uniform sampler2D u_texture;
uniform int u_kernel;
uniform vec2 u_velocity;

const int MAX_KERNEL_SIZE = 2048;

void main(void) {
  vec4 color = texture2D(u_texture, v_texCoords);
  int k = u_kernel - 1;
  for(int i = 0; i < MAX_KERNEL_SIZE - 1; i++) {
    if (i == k) {
      break;
    }
    vec2 bias = u_velocity * (float(i) / float(k) - 0.5);
    color += texture2D(u_texture, v_texCoords + bias);
  }
  gl_FragColor = color / float(u_kernel);
}
