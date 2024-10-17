#ifdef GL_ES
precision mediump float;
#endif

varying vec4 v_position;
uniform float u_x1;
uniform float u_y1;
uniform float u_x2;
uniform float u_y2;
uniform float u_width;
uniform float u_height;
uniform int u_count;

void main() {
  if (v_position.x > u_x1 + u_width && v_position.x < u_x2 - u_width && v_position.y > u_y1 + u_height && v_position.y < u_y2 - u_height) {
    if (u_count == 0) {
      gl_FragColor += vec4(0.0, 0.0, 0.5, 0.1);
    }
    else {
      gl_FragColor += vec4(0.0, 0.0, 0.0, 0.1);
    }
  }
  if (v_position.x >= u_x1 - u_width && v_position.x <= u_x1 + u_width && v_position.y >= u_y1 && v_position.y <= u_y2) {
    gl_FragColor += vec4(0.5, 0.0, 0.0, 0.2);
  }
  if (v_position.x >= u_x2 - u_width && v_position.x <= u_x2 + u_width && v_position.y >= u_y1 && v_position.y <= u_y2) {
    gl_FragColor += vec4(0.5, 0.0, 0.0, 0.2);
  }
  if (v_position.y >= u_y1 - u_height && v_position.y <= u_y1 + u_height && v_position.x >= u_x1 + u_width && v_position.x <= u_x2 - u_width) {
    gl_FragColor += vec4(0.5, 0.0, 0.0, 0.2);
  }
  if (v_position.y >= u_y2 - u_height && v_position.y <= u_y2 + u_height && v_position.x >= u_x1 + u_width && v_position.x <= u_x2 - u_width) {
    gl_FragColor += vec4(0.5, 0.0, 0.0, 0.2);
  }
}
