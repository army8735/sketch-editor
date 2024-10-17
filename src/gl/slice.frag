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
  if (v_position.x >= u_x1 - u_width && v_position.x <= u_x1 + u_width && v_position.y >= u_y1 - u_height && v_position.y <= u_y2 + u_height) {
    if (v_position.y < u_y1 + u_height || v_position.y > u_y2 - u_height) {
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
  if (v_position.x >= u_x2 - u_width && v_position.x <= u_x2 + u_width && v_position.y >= u_y1 - u_height && v_position.y <= u_y2 + u_height) {
    if (v_position.y < u_y1 + u_height || v_position.y > u_y2 - u_height) {
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
  if (v_position.y >= u_y1 - u_height && v_position.y <= u_y1 + u_height && v_position.x >= u_x1 + u_width && v_position.x <= u_x2 - u_width) {
    if (v_position.x < u_x1 + u_width || v_position.x > u_x2 - u_width) {
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
  if (v_position.y >= u_y2 - u_height && v_position.y <= u_y2 + u_height && v_position.x >= u_x1 + u_width && v_position.x <= u_x2 - u_width) {
    if (v_position.x < u_x1 + u_width || v_position.x > u_x2 - u_width) {
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
