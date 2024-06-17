#ifdef GL_ES
precision mediump float;
#endif

varying vec4 v_position;
uniform float x1;
uniform float y1;
uniform float x2;
uniform float y2;
uniform float width;
uniform float height;
uniform int count;

void main() {
  if (v_position.x > x1 + width && v_position.x < x2 - width && v_position.y > y1 + height && v_position.y < y2 - height) {
    if (count == 0) {
      gl_FragColor += vec4(0.0, 0.0, 0.5, 0.1);
    }
    else {
      gl_FragColor += vec4(0.0, 0.0, 0.0, 0.1);
    }
  }
  if (v_position.x >= x1 - width && v_position.x <= x1 + width && v_position.y >= y1 && v_position.y <= y2) {
    gl_FragColor += vec4(0.5, 0.0, 0.0, 0.2);
  }
  if (v_position.x >= x2 - width && v_position.x <= x2 + width && v_position.y >= y1 && v_position.y <= y2) {
    gl_FragColor += vec4(0.5, 0.0, 0.0, 0.2);
  }
  if (v_position.y >= y1 - height && v_position.y <= y1 + height && v_position.x >= x1 && v_position.x <= x2) {
    gl_FragColor += vec4(0.5, 0.0, 0.0, 0.2);
  }
  if (v_position.y >= y2 - height && v_position.y <= y2 + height && v_position.x >= x1 && v_position.x <= x2) {
    gl_FragColor += vec4(0.5, 0.0, 0.0, 0.2);
  }
}
