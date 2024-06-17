#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_tl;
uniform vec2 u_br;
uniform vec2 u_radius;
uniform vec4 u_color;
varying vec2 v_position;

void main() {
  if (v_position.x < u_tl.x && v_position.y < u_tl.y) {
    float dx = abs(v_position.x - u_tl.x);
    float dy = abs(v_position.y - u_tl.y);
    if (dx <= u_radius.x && dy <= u_radius.y) {
      float ax = (u_radius.x - dx) / u_radius.x;
      float ay = (u_radius.y - dy) / u_radius.y;
      gl_FragColor = u_color * ax * ax * ay * ay;
    }
  }
  else if (v_position.x < u_tl.x && v_position.y > u_br.y) {
    float dx = abs(v_position.x - u_tl.x);
    float dy = abs(v_position.y - u_br.y);
    if (dx <= u_radius.x && dy <= u_radius.y) {
      float ax = (u_radius.x - dx) / u_radius.x;
      float ay = (u_radius.y - dy) / u_radius.y;
      gl_FragColor = u_color * ax * ax * ay * ay;
    }
  }
  else if (v_position.x > u_br.x && v_position.y > u_br.y) {
    float dx = abs(v_position.x - u_br.x);
    float dy = abs(v_position.y - u_br.y);
    if (dx <= u_radius.x && dy <= u_radius.y) {
      float ax = (u_radius.x - dx) / u_radius.x;
      float ay = (u_radius.y - dy) / u_radius.y;
      gl_FragColor = u_color * ax * ax * ay * ay;
    }
  }
  else if (v_position.x > u_br.x && v_position.y < u_tl.y) {
    float dx = abs(v_position.x - u_br.x);
    float dy = abs(v_position.y - u_tl.y);
    if (dx <= u_radius.x && dy <= u_radius.y) {
      float ax = (u_radius.x - dx) / u_radius.x;
      float ay = (u_radius.y - dy) / u_radius.y;
      gl_FragColor = u_color * ax * ax * ay * ay;
    }
  }
  else if (v_position.x < u_tl.x) {
    float d = abs(v_position.x - u_tl.x);
    if (d <= u_radius.x) {
      float a = (u_radius.x - d) / u_radius.x;
      gl_FragColor = u_color * a * a;
    }
  }
  else if (v_position.y > u_br.y) {
    float d = abs(v_position.y - u_br.y);
    if (d <= u_radius.y) {
      float a = (u_radius.y - d) / u_radius.y;
      gl_FragColor = u_color * a * a;
    }
  }
  else if (v_position.x > u_br.x) {
    float d = abs(v_position.x - u_br.x);
    if (d <= u_radius.x) {
      float a = (u_radius.x - d) / u_radius.x;
      gl_FragColor = u_color * a * a;
    }
  }
  else if (v_position.y < u_tl.y) {
    float d = abs(v_position.y - u_tl.y);
    if (d <= u_radius.y) {
      float a = (u_radius.y - d) / u_radius.y;
      gl_FragColor = u_color * a * a;
    }
  }
}
