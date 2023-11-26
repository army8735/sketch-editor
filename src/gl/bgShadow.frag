#version 100

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_tl;
uniform vec2 u_br;
uniform float u_radius;
uniform float u_ratio;
uniform vec4 u_color;
varying vec2 v_position;

void main() {
  if (v_position.x < u_tl.x && v_position.y < u_tl.y) {
    float dx = abs(v_position.x - u_tl.x);
    float dy = abs(v_position.y - u_tl.y);
    if (u_ratio > 1.0) {
      dx /= u_ratio;
    }
    else if (u_ratio < 1.0) {
      dy /= u_ratio;
    }
    float d = sqrt(dx * dx + dy * dy);
    if (d <= u_radius) {
      float a = (u_radius - d) / u_radius;
      gl_FragColor = u_color * a * a;
    }
  }
  else if (v_position.x < u_tl.x && v_position.y > u_br.y) {
    float dx = abs(v_position.x - u_tl.x);
    float dy = abs(v_position.y - u_br.y);
    if (u_ratio > 1.0) {
      dx /= u_ratio;
    }
    else if (u_ratio < 1.0) {
      dy /= u_ratio;
    }
    float d = sqrt(dx * dx + dy * dy);
    if (d <= u_radius) {
      float a = (u_radius - d) / u_radius;
      gl_FragColor = u_color * a * a;
    }
  }
  else if (v_position.x > u_br.x && v_position.y > u_br.y) {
    float dx = abs(v_position.x - u_br.x);
    float dy = abs(v_position.y - u_br.y);
    if (u_ratio > 1.0) {
      dx /= u_ratio;
    }
    else if (u_ratio < 1.0) {
      dy /= u_ratio;
    }
    float d = sqrt(dx * dx + dy * dy);
    if (d <= u_radius) {
      float a = (u_radius - d) / u_radius;
      gl_FragColor = u_color * a * a;
    }
  }
  else if (v_position.x > u_br.x && v_position.y < u_tl.y) {
    float dx = abs(v_position.x - u_br.x);
    float dy = abs(v_position.y - u_tl.y);
    if (u_ratio > 1.0) {
      dx /= u_ratio;
    }
    else if (u_ratio < 1.0) {
      dy /= u_ratio;
    }
    float d = sqrt(dx * dx + dy * dy);
    if (d <= u_radius) {
      float a = (u_radius - d) / u_radius;
      gl_FragColor = u_color * a * a;
    }
  }
  else if (v_position.x < u_tl.x) {
    float d = abs(v_position.x - u_tl.x);
    if (u_ratio > 1.0) {
      d /= u_ratio;
    }
    if (d <= u_radius) {
      float a = (u_radius - d) / u_radius;
      gl_FragColor = u_color * a * a;
    }
  }
  else if (v_position.y > u_br.y) {
    float d = abs(v_position.y - u_br.y);
    if (u_ratio < 1.0) {
      d /= u_ratio;
    }
    if (d <= u_radius) {
      float a = (u_radius - d) / u_radius;
      gl_FragColor = u_color * a * a;
    }
  }
  else if (v_position.x > u_br.x) {
    float d = abs(v_position.x - u_br.x);
    if (u_ratio > 1.0) {
      d /= u_ratio;
    }
    if (d <= u_radius) {
      float a = (u_radius - d) / u_radius;
      gl_FragColor = u_color * a * a;
    }
  }
  else if (v_position.y < u_tl.y) {
    float d = abs(v_position.y - u_tl.y);
    if (u_ratio < 1.0) {
      d /= u_ratio;
    }
    if (d <= u_radius) {
      float a = (u_radius - d) / u_radius;
      gl_FragColor = u_color * a * a;
    }
  }
}
