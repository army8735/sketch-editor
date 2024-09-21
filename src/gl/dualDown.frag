#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
uniform float u_x;
uniform float u_y;
uniform sampler2D u_texture;

void main() {
  vec4 color = texture2D(u_texture, v_texCoords) * 4.0;
  color += texture2D(u_texture, v_texCoords + vec2(u_x, u_y));
  color += texture2D(u_texture, v_texCoords + vec2(u_x, -u_y));
  color += texture2D(u_texture, v_texCoords + vec2(-u_x, u_y));
  color += texture2D(u_texture, v_texCoords + vec2(-u_x, -u_y));
  gl_FragColor = color * 0.125;
}
