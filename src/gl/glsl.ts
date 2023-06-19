export const mainVert = `#version 100

attribute vec2 a_position;
attribute vec2 a_texCoords;
varying vec2 v_texCoords;
attribute float a_opacity;
varying float v_opacity;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoords = a_texCoords;
  v_opacity = a_opacity;
}`;

export const mainFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
varying float v_opacity;
uniform sampler2D u_texture;

void main() {
  float opacity = v_opacity;
  if(opacity <= 0.0) {
    discard;
  }
  opacity = clamp(opacity, 0.0, 1.0);
  vec4 color = texture2D(u_texture, v_texCoords);
  gl_FragColor = color * opacity;
}`;

export const bgColorVert = `#version 100

attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0, 1);
}`;

export const bgColorFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}`;

export const simpleVert = `#version 100

attribute vec2 a_position;
attribute vec2 a_texCoords;
varying vec2 v_texCoords;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  v_texCoords = a_texCoords;
}`;

export const simpleFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture;

void main() {
  vec4 color = texture2D(u_texture, v_texCoords);
  gl_FragColor = color;
}`;

export const maskVert = `#version 100

attribute vec4 a_position;

attribute vec2 a_texCoords;
varying vec2 v_texCoords;

void main() {
  gl_Position = a_position;
  v_texCoords = a_texCoords;
}`;

export const maskFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  gl_FragColor = color2 * color1.a;
}`;

export const gaussVert = `#version 100

attribute vec4 a_position;
attribute vec2 a_texCoords;
varying vec2 v_texCoords;

void main() {
  gl_Position = a_position;
  v_texCoords = a_texCoords;
}`;

export const gaussFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;
uniform sampler2D u_texture;
uniform vec2 u_direction;

vec4 limit(vec2 coords, float weight) {
  if(coords[0] <= 0.0 || coords[1] <= 0.0 || coords[0] >= 1.0 || coords[1] >= 1.0) {
    //return vec4(0.0, 0.0, 0.0, 0.0);
  }
  return texture2D(u_texture, coords) * weight;
}

void main() {
  gl_FragColor = vec4(0.0);
  \${placeholder}
}`;

export const mbmVert = maskVert;

export const multiplyFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return ((1.0 - a2 / a3) * c1 * 255.0 + a2 / a3 * ((1.0 - a1) * c2 * 255.0 + a1 * c3 * 255.0)) / 255.0;
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = bottom * top;
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const screenFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float op(float a, float b) {
  return a + b - a * b;
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = vec3(op(bottom.r, top.r), op(bottom.g, top.g), op(bottom.b, top.b));
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const overlayFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float op(float a, float b) {
  return b <= 0.5 ? (2.0 * a * b) : (a + 2.0 * b - 1.0 - a * (2.0 * b - 1.0));
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = vec3(op(top.r, bottom.r), op(top.g, bottom.g), op(top.b, bottom.b));
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const darkenFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float op(float a, float b) {
  return min(a, b);
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = vec3(op(bottom.r, top.r), op(bottom.g, top.g), op(bottom.b, top.b));
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const lightenFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float op(float a, float b) {
  return max(a, b);
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = vec3(op(bottom.r, top.r), op(bottom.g, top.g), op(bottom.b, top.b));
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
    alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
    alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
    alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
    a
    );
  }
}`;

export const colorDodgeFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float op(float a, float b) {
  if(b == 1.0) {
    return a == 0.0 ? a : 1.0;
  }
  return min(1.0, a / (1.0 - b));
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = vec3(op(bottom.r, top.r), op(bottom.g, top.g), op(bottom.b, top.b));
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const colorBurnFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float op(float a, float b) {
  if(b == 0.0) {
    return a == 1.0 ? a : 0.0;
  }
  return 1.0 - min(1.0, (1.0 - a) / b);
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = vec3(op(bottom.r, top.r), op(bottom.g, top.g), op(bottom.b, top.b));
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const hardLightFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float op(float a, float b) {
  return b <= 0.5 ? (2.0 * a * b) : (a + 2.0 * b - 1.0 - a * (2.0 * b - 1.0));
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = vec3(op(bottom.r, top.r), op(bottom.g, top.g), op(bottom.b, top.b));
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const softLightFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float op(float a, float b) {
  return b <= 0.5
    ? a - (1.0 - 2.0 * b) * a * (1.0 - a)
    : a + (2.0 * b - 1.0) * (a <= 0.25
      ? ((16.0 * a - 12.0) * a + 4.0) * a
      : sqrt(a) - a);
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = vec3(op(bottom.r, top.r), op(bottom.g, top.g), op(bottom.b, top.b));
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const differenceFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float op(float a, float b) {
  return abs(a - b);
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = vec3(op(bottom.r, top.r), op(bottom.g, top.g), op(bottom.b, top.b));
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const exclusionFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float op(float a, float b) {
  return a + b - 2.0 * a * b;
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = vec3(op(bottom.r, top.r), op(bottom.g, top.g), op(bottom.b, top.b));
    float a = color1.a + color2.a - color1.a * color2.a;
      gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const hueFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float getLuminosity(vec3 color) {
  return 0.3 * color[0] + 0.59 * color[1] + 0.11 * color[2];
}

float clipLowest(float channel, float lowestChannel, float luminosity) {
  return luminosity + ((channel - luminosity) * luminosity) / (luminosity - lowestChannel);
}

float clipHighest(float channel, float highestChannel, float luminosity) {
  return luminosity + ((channel - luminosity) * (1.0 - luminosity)) / (highestChannel - luminosity);
}

vec3 clipColor(vec3 rgb) {
  float luminosity = getLuminosity(rgb);
  float lowestChannel = min(rgb[0], min(rgb[1], rgb[2]));
  float highestChannel = max(rgb[0], max(rgb[1], rgb[2]));
  float r = rgb[0], g = rgb[1], b = rgb[2];
  if(lowestChannel < 0.0) {
    r = clipLowest(r, lowestChannel, luminosity);
    g = clipLowest(g, lowestChannel, luminosity);
    b = clipLowest(b, lowestChannel, luminosity);
  }
  if(highestChannel > 1.0) {
    r = clipHighest(r, highestChannel, luminosity);
    g = clipHighest(g, highestChannel, luminosity);
    b = clipHighest(b, highestChannel, luminosity);
  }
  return vec3(r, g, b);
}

vec3 setLuminosity(vec3 rgb, float luminosity) {
  float delta = luminosity - getLuminosity(rgb);
  float r = rgb[0], g = rgb[1], b = rgb[2];
  return clipColor(vec3(r + delta, g + delta, b + delta));
}

float getSaturation(vec3 rgb) {
  return max(rgb[0], max(rgb[1], rgb[2])) - min(rgb[0], min(rgb[1], rgb[2]));
}

vec3 setSaturation(vec3 rgb, float saturation) {
  float r = rgb[0], g = rgb[1], b = rgb[2];
  float maxC = 0.0, minC = 0.0, midC = 0.0;
  int maxI = 0, minI = 0, midI = 0;
  if(r >= g && r >= b) {
    maxI = 0;
    maxC = r;
    if(g >= b) {
      minI = 2;
      midI = 1;
      minC = b;
      midC = g;
    }
    else {
      minI = 1;
      midI = 2;
      minC = g;
      midC = b;
    }
  }
  else if(g >= r && g >= b) {
    maxI = 1;
    maxC = g;
    if(r >= b) {
      minI = 2;
      midI = 0;
      minC = b;
      midC = r;
    }
    else {
      minI = 0;
      midI = 2;
      minC = r;
      midC = b;
    }
  }
  else if(b >= r && b >= g) {
    maxI = 2;
    maxC = b;
    if(r >= g) {
      minI = 1;
      midI = 0;
      minC = g;
      midC = r;
    }
    else {
      minI = 0;
      midI = 1;
      minC = r;
      midC = g;
    }
  }
  vec3 result = vec3(r, g, b);
  if(maxC > minC) {
    midC = (midC - minC) * saturation / (maxC - minC);
    maxC = saturation;
  }
  else {
    maxC = midC = 0.0;
  }
  minC = 0.0;
  if(maxI == 0) {
    result[0] = maxC;
  }
  else if(maxI == 1) {
    result[1] = maxC;
  }
  else if(maxI == 2) {
    result[2] = maxC;
  }
  if(minI == 0) {
    result[0] = minC;
  }
  else if(minI == 1) {
    result[1] = minC;
  }
  else if(minI == 2) {
    result[2] = minC;
  }
  if(midI == 0) {
    result[0] = midC;
  }
  else if(midI == 1) {
    result[1] = midC;
  }
  else if(midI == 2) {
    result[2] = midC;
  }
  return result;
}

vec3 op(vec3 a, vec3 b) {
  float s = getSaturation(a);
  float l = getLuminosity(a);
  return setLuminosity(setSaturation(b, s), l);
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = op(bottom, top);
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const saturationFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float getLuminosity(vec3 color) {
  return 0.3 * color[0] + 0.59 * color[1] + 0.11 * color[2];
}

float clipLowest(float channel, float lowestChannel, float luminosity) {
  return luminosity + ((channel - luminosity) * luminosity) / (luminosity - lowestChannel);
}

float clipHighest(float channel, float highestChannel, float luminosity) {
  return luminosity + ((channel - luminosity) * (1.0 - luminosity)) / (highestChannel - luminosity);
}

vec3 clipColor(vec3 rgb) {
  float luminosity = getLuminosity(rgb);
  float lowestChannel = min(rgb[0], min(rgb[1], rgb[2]));
  float highestChannel = max(rgb[0], max(rgb[1], rgb[2]));
  float r = rgb[0], g = rgb[1], b = rgb[2];
  if(lowestChannel < 0.0) {
    r = clipLowest(r, lowestChannel, luminosity);
    g = clipLowest(g, lowestChannel, luminosity);
    b = clipLowest(b, lowestChannel, luminosity);
  }
  if(highestChannel > 1.0) {
    r = clipHighest(r, highestChannel, luminosity);
    g = clipHighest(g, highestChannel, luminosity);
    b = clipHighest(b, highestChannel, luminosity);
  }
  return vec3(r, g, b);
}

vec3 setLuminosity(vec3 rgb, float luminosity) {
  float delta = luminosity - getLuminosity(rgb);
  float r = rgb[0], g = rgb[1], b = rgb[2];
  return clipColor(vec3(r + delta, g + delta, b + delta));
}

float getSaturation(vec3 rgb) {
  return max(rgb[0], max(rgb[1], rgb[2])) - min(rgb[0], min(rgb[1], rgb[2]));
}

vec3 setSaturation(vec3 rgb, float saturation) {
  float r = rgb[0], g = rgb[1], b = rgb[2];
  float maxC = 0.0, minC = 0.0, midC = 0.0;
  int maxI = 0, minI = 0, midI = 0;
  if(r >= g && r >= b) {
    maxI = 0;
    maxC = r;
    if(g >= b) {
      minI = 2;
      midI = 1;
      minC = b;
      midC = g;
    }
    else {
      minI = 1;
      midI = 2;
      minC = g;
      midC = b;
    }
  }
  else if(g >= r && g >= b) {
    maxI = 1;
    maxC = g;
    if(r >= b) {
      minI = 2;
      midI = 0;
      minC = b;
      midC = r;
    }
    else {
      minI = 0;
      midI = 2;
      minC = r;
      midC = b;
    }
  }
  else if(b >= r && b >= g) {
    maxI = 2;
    maxC = b;
    if(r >= g) {
      minI = 1;
      midI = 0;
      minC = g;
      midC = r;
    }
    else {
      minI = 0;
      midI = 1;
      minC = r;
      midC = g;
    }
  }
  vec3 result = vec3(r, g, b);
  if(maxC > minC) {
    midC = (midC - minC) * saturation / (maxC - minC);
    maxC = saturation;
  }
  else {
    maxC = midC = 0.0;
  }
  minC = 0.0;
  if(maxI == 0) {
    result[0] = maxC;
  }
  else if(maxI == 1) {
    result[1] = maxC;
  }
  else if(maxI == 2) {
    result[2] = maxC;
  }
  if(minI == 0) {
    result[0] = minC;
  }
  else if(minI == 1) {
    result[1] = minC;
  }
  else if(minI == 2) {
    result[2] = minC;
  }
  if(midI == 0) {
    result[0] = midC;
  }
  else if(midI == 1) {
    result[1] = midC;
  }
  else if(midI == 2) {
    result[2] = midC;
  }
  return result;
}

vec3 op(vec3 a, vec3 b) {
  float s = getSaturation(b);
  float l = getLuminosity(a);
  return setLuminosity(setSaturation(a, s), l);
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = op(bottom, top);
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const colorFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float getLuminosity(vec3 color) {
  return 0.3 * color[0] + 0.59 * color[1] + 0.11 * color[2];
}

float clipLowest(float channel, float lowestChannel, float luminosity) {
  return luminosity + ((channel - luminosity) * luminosity) / (luminosity - lowestChannel);
}

float clipHighest(float channel, float highestChannel, float luminosity) {
  return luminosity + ((channel - luminosity) * (1.0 - luminosity)) / (highestChannel - luminosity);
}

vec3 clipColor(vec3 rgb) {
  float luminosity = getLuminosity(rgb);
  float lowestChannel = min(rgb[0], min(rgb[1], rgb[2]));
  float highestChannel = max(rgb[0], max(rgb[1], rgb[2]));
  float r = rgb[0], g = rgb[1], b = rgb[2];
  if(lowestChannel < 0.0) {
    r = clipLowest(r, lowestChannel, luminosity);
    g = clipLowest(g, lowestChannel, luminosity);
    b = clipLowest(b, lowestChannel, luminosity);
  }
  if(highestChannel > 1.0) {
    r = clipHighest(r, highestChannel, luminosity);
    g = clipHighest(g, highestChannel, luminosity);
    b = clipHighest(b, highestChannel, luminosity);
  }
  return vec3(r, g, b);
}

vec3 setLuminosity(vec3 rgb, float luminosity) {
  float delta = luminosity - getLuminosity(rgb);
  float r = rgb[0], g = rgb[1], b = rgb[2];
  return clipColor(vec3(r + delta, g + delta, b + delta));
}

float getSaturation(vec3 rgb) {
  return max(rgb[0], max(rgb[1], rgb[2])) - min(rgb[0], min(rgb[1], rgb[2]));
}

vec3 setSaturation(vec3 rgb, float saturation) {
  float r = rgb[0], g = rgb[1], b = rgb[2];
  float maxC = 0.0, minC = 0.0, midC = 0.0;
  int maxI = 0, minI = 0, midI = 0;
  if(r >= g && r >= b) {
    maxI = 0;
    maxC = r;
    if(g >= b) {
      minI = 2;
      midI = 1;
      minC = b;
      midC = g;
    }
    else {
      minI = 1;
      midI = 2;
      minC = g;
      midC = b;
    }
  }
  else if(g >= r && g >= b) {
    maxI = 1;
    maxC = g;
    if(r >= b) {
      minI = 2;
      midI = 0;
      minC = b;
      midC = r;
    }
    else {
      minI = 0;
      midI = 2;
      minC = r;
      midC = b;
    }
  }
  else if(b >= r && b >= g) {
    maxI = 2;
    maxC = b;
    if(r >= g) {
      minI = 1;
      midI = 0;
      minC = g;
      midC = r;
    }
    else {
      minI = 0;
      midI = 1;
      minC = r;
      midC = g;
    }
  }
  vec3 result = vec3(r, g, b);
  if(maxC > minC) {
    midC = (midC - minC) * saturation / (maxC - minC);
    maxC = saturation;
  }
  else {
    maxC = midC = 0.0;
  }
  minC = 0.0;
  if(maxI == 0) {
    result[0] = maxC;
  }
  else if(maxI == 1) {
    result[1] = maxC;
  }
  else if(maxI == 2) {
    result[2] = maxC;
  }
  if(minI == 0) {
    result[0] = minC;
  }
  else if(minI == 1) {
    result[1] = minC;
  }
  else if(minI == 2) {
    result[2] = minC;
  }
  if(midI == 0) {
    result[0] = midC;
  }
  else if(midI == 1) {
    result[1] = midC;
  }
  else if(midI == 2) {
    result[2] = midC;
  }
  return result;
}

vec3 op(vec3 a, vec3 b) {
  float l = getLuminosity(a);
  return setLuminosity(b, l);
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = op(bottom, top);
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const luminosityFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

float getLuminosity(vec3 color) {
  return 0.3 * color[0] + 0.59 * color[1] + 0.11 * color[2];
}

float clipLowest(float channel, float lowestChannel, float luminosity) {
  return luminosity + ((channel - luminosity) * luminosity) / (luminosity - lowestChannel);
}

float clipHighest(float channel, float highestChannel, float luminosity) {
  return luminosity + ((channel - luminosity) * (1.0 - luminosity)) / (highestChannel - luminosity);
}

vec3 clipColor(vec3 rgb) {
  float luminosity = getLuminosity(rgb);
  float lowestChannel = min(rgb[0], min(rgb[1], rgb[2]));
  float highestChannel = max(rgb[0], max(rgb[1], rgb[2]));
  float r = rgb[0], g = rgb[1], b = rgb[2];
  if(lowestChannel < 0.0) {
    r = clipLowest(r, lowestChannel, luminosity);
    g = clipLowest(g, lowestChannel, luminosity);
    b = clipLowest(b, lowestChannel, luminosity);
  }
  if(highestChannel > 1.0) {
    r = clipHighest(r, highestChannel, luminosity);
    g = clipHighest(g, highestChannel, luminosity);
    b = clipHighest(b, highestChannel, luminosity);
  }
  return vec3(r, g, b);
}

vec3 setLuminosity(vec3 rgb, float luminosity) {
  float delta = luminosity - getLuminosity(rgb);
  float r = rgb[0], g = rgb[1], b = rgb[2];
  return clipColor(vec3(r + delta, g + delta, b + delta));
}

float getSaturation(vec3 rgb) {
  return max(rgb[0], max(rgb[1], rgb[2])) - min(rgb[0], min(rgb[1], rgb[2]));
}

vec3 setSaturation(vec3 rgb, float saturation) {
  float r = rgb[0], g = rgb[1], b = rgb[2];
  float maxC = 0.0, minC = 0.0, midC = 0.0;
  int maxI = 0, minI = 0, midI = 0;
  if(r >= g && r >= b) {
    maxI = 0;
    maxC = r;
    if(g >= b) {
      minI = 2;
      midI = 1;
      minC = b;
      midC = g;
    }
    else {
      minI = 1;
      midI = 2;
      minC = g;
      midC = b;
    }
  }
  else if(g >= r && g >= b) {
    maxI = 1;
    maxC = g;
    if(r >= b) {
      minI = 2;
      midI = 0;
      minC = b;
      midC = r;
    }
    else {
      minI = 0;
      midI = 2;
      minC = r;
      midC = b;
    }
  }
  else if(b >= r && b >= g) {
    maxI = 2;
    maxC = b;
    if(r >= g) {
      minI = 1;
      midI = 0;
      minC = g;
      midC = r;
    }
    else {
      minI = 0;
      midI = 1;
      minC = r;
      midC = g;
    }
  }
  vec3 result = vec3(r, g, b);
  if(maxC > minC) {
    midC = (midC - minC) * saturation / (maxC - minC);
    maxC = saturation;
  }
  else {
    maxC = midC = 0.0;
  }
  minC = 0.0;
  if(maxI == 0) {
    result[0] = maxC;
  }
  else if(maxI == 1) {
    result[1] = maxC;
  }
  else if(maxI == 2) {
    result[2] = maxC;
  }
  if(minI == 0) {
    result[0] = minC;
  }
  else if(minI == 1) {
    result[1] = minC;
  }
  else if(minI == 2) {
    result[2] = minC;
  }
  if(midI == 0) {
    result[0] = midC;
  }
  else if(midI == 1) {
    result[1] = midC;
  }
  else if(midI == 2) {
    result[2] = midC;
  }
  return result;
}

vec3 op(vec3 a, vec3 b) {
  float l = getLuminosity(b);
  return setLuminosity(a, l);
}

vec3 premultipliedAlpha(vec4 color) {
  float a = color.a;
  if(a == 0.0) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(color.r / a, color.g / a, color.b / a);
}

float alphaCompose(float a1, float a2, float a3, float c1, float c2, float c3) {
  return (1.0 - a2 / a3) * c1 + a2 / a3 * ((1.0 - a1) * c2 + a1 * c3);
}

void main() {
  vec4 color1 = texture2D(u_texture1, v_texCoords);
  vec4 color2 = texture2D(u_texture2, v_texCoords);
  if(color1.a == 0.0) {
    gl_FragColor = color2;
  }
  else if(color2.a == 0.0) {
    gl_FragColor = color1;
  }
  else {
    vec3 bottom = premultipliedAlpha(color1);
    vec3 top = premultipliedAlpha(color2);
    vec3 res = op(bottom, top);
    float a = color1.a + color2.a - color1.a * color2.a;
    gl_FragColor = vec4(
      alphaCompose(color1.a, color2.a, a, bottom.r, top.r, res.r) * a,
      alphaCompose(color1.a, color2.a, a, bottom.g, top.g, res.g) * a,
      alphaCompose(color1.a, color2.a, a, bottom.b, top.b, res.b) * a,
      a
    );
  }
}`;

export const dropShadowFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture;
uniform vec4 u_color;

void main() {
  vec4 c = texture2D(u_texture, v_texCoords);
  gl_FragColor = u_color * c.a;
}`;

export const innerShadowFrag = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture;
uniform vec4 u_color;

void main() {
  vec4 c = texture2D(u_texture, v_texCoords);
  if (c.a > 0.0) {
    discard;
  }
  gl_FragColor = u_color;
}`;

export const innerShadowFragR = `#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

void main() {
  vec4 c = texture2D(u_texture1, v_texCoords);
  if (c.a <= 0.0) {
    discard;
  }
  gl_FragColor = texture2D(u_texture2, v_texCoords);
}`;
