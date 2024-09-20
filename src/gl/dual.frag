#ifdef GL_ES
precision mediump float;
#endif

varying vec4 v_position;
varying vec2 v_texCoords;
uniform sampler2D u_texture;
uniform float u_x;
uniform float u_y;
uniform float u_scale;

void main() {
  float scale = abs(u_scale);
  if (v_position.x > scale || v_position.y > scale) {
    discard;
  }
  if (u_scale < 0.0) {
    vec2 c = v_texCoords * 2.0;
    vec4 color = texture2D(u_texture, c) * 4.0;
    color += texture2D(u_texture, c + vec2(u_x, u_y));
    color += texture2D(u_texture, c + vec2(u_x, -u_y));
    color += texture2D(u_texture, c + vec2(-u_x, u_y));
    color += texture2D(u_texture, c + vec2(-u_x, -u_y));
    gl_FragColor = color * 0.125;
  }
  else {
    vec2 c = v_texCoords * 0.5;
    vec4 color = texture2D(u_texture, c + vec2(u_x, u_y)) * 2.0;
    color += texture2D(u_texture, c + vec2(u_x, -u_y)) * 2.0;
    color += texture2D(u_texture, c + vec2(-u_x, u_y)) * 2.0;
    color += texture2D(u_texture, c + vec2(-u_x, -u_y)) * 2.0;
    color += texture2D(u_texture, c + vec2(u_x * 0.5, 0.0));
    color += texture2D(u_texture, c + vec2(-u_x * 0.5, 0.0));
    color += texture2D(u_texture, c + vec2(0.0, u_y * 0.5));
    color += texture2D(u_texture, c + vec2(0.0, -u_y * 0.5));
    gl_FragColor = color / 12.0;
  }
}
