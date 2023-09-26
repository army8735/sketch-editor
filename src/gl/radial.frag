#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
uniform sampler2D u_texture;
uniform int u_kernel;
uniform vec2 u_center;
uniform vec2 u_size;

const int MAX_KERNEL_SIZE = 2048;

void main(void) {
  vec4 color = texture2D(u_texture, v_texCoords);
  int k = u_kernel - 1;
  for(int i = 0; i < MAX_KERNEL_SIZE - 1; i++) {
    if (i == k) {
      break;
    }
    vec2 velocity = (u_center - v_texCoords) * float(u_kernel * 2) / u_size;
    vec2 bias = velocity * (float(i) / float(k));
    color += texture2D(u_texture, v_texCoords + bias);
  }
  gl_FragColor = color / float(u_kernel);
}
