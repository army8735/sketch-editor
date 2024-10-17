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

void main() {
  if (v_position.x >= u_x1 && v_position.x <= u_x1 + u_width * 2.0 && v_position.y >= u_y1 && v_position.y <= u_y2) {
    if (v_position.y <= u_y1 + u_height * 2.0 || v_position.y >= u_y2 - u_height * 2.0) {
      gl_FragColor += vec4(0.0, 0.0, 0.0, 0.2);
    }
    else {
      int y = int((v_position.y - u_y1 + u_height) / u_height);
      int p = int(y / 12);
      if (y - p * 12 >= 6) {
        gl_FragColor += vec4(0.0, 0.0, 0.0, 0.2);
      }
    }
  }
  if (v_position.x >= u_x2 - u_width * 2.0 && v_position.x <= u_x2 && v_position.y >= u_y1 && v_position.y <= u_y2) {
    if (v_position.y < u_y1 + u_height * 2.0 || v_position.y > u_y2 - u_height * 2.0) {
      gl_FragColor += vec4(0.0, 0.0, 0.0, 0.2);
    }
    else {
      int y = int((v_position.y - u_y1 + u_height) / u_height);
      int p = int(y / 12);
      if (y - p * 12 >= 6) {
        gl_FragColor += vec4(0.0, 0.0, 0.0, 0.2);
      }
    }
  }
  if (v_position.y >= u_y1 && v_position.y <= u_y1 + u_height * 2.0 && v_position.x >= u_x1 + u_width * 2.0 && v_position.x <= u_x2 - u_width * 2.0) {
    if (v_position.x < u_x1 + u_width * 4.0 || v_position.x > u_x2 - u_width * 4.0) {
      gl_FragColor += vec4(0.0, 0.0, 0.0, 0.2);
    }
    else {
      int x = int((v_position.x - u_x1 + u_width) / u_width);
      int p = int(x / 12);
      if (x - p * 12 >= 6) {
        gl_FragColor += vec4(0.0, 0.0, 0.0, 0.2);
      }
    }
  }
  if (v_position.y >= u_y2 - u_height * 2.0 && v_position.y <= u_y2 && v_position.x >= u_x1 + u_width * 2.0 && v_position.x <= u_x2 - u_width * 2.0) {
    if (v_position.x < u_x1 + u_width * 4.0 || v_position.x > u_x2 - u_width * 4.0) {
      gl_FragColor += vec4(0.0, 0.0, 0.0, 0.2);
    }
    else {
      int x = int((v_position.x - u_x1 + u_width) / u_width);
      int p = int(x / 12);
      if (x - p * 12 >= 6) {
        gl_FragColor += vec4(0.0, 0.0, 0.0, 0.2);
      }
    }
  }
}
