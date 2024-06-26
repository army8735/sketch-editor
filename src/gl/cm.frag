#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_texture;
//uniform float u_m[20];
uniform float u_m0;
uniform float u_m1;
uniform float u_m2;
uniform float u_m3;
uniform float u_m4;
uniform float u_m5;
uniform float u_m6;
uniform float u_m7;
uniform float u_m8;
uniform float u_m9;
uniform float u_m10;
uniform float u_m11;
uniform float u_m12;
uniform float u_m13;
uniform float u_m14;
uniform float u_m15;
uniform float u_m16;
uniform float u_m17;
uniform float u_m18;
uniform float u_m19;

void main() {
  vec4 c = texture2D(u_texture, v_texCoords);
  if (c.a > 0.0) {
    c.rgb /= c.a;
  }
  vec4 result;
  result.r = (u_m0 * c.r);
  result.r += (u_m1 * c.g);
  result.r += (u_m2 * c.b);
  result.r += (u_m3 * c.a);
  result.r += u_m4;

  result.g = (u_m5 * c.r);
  result.g += (u_m6 * c.g);
  result.g += (u_m7 * c.b);
  result.g += (u_m8 * c.a);
  result.g += u_m9;

  result.b = (u_m10 * c.r);
  result.b += (u_m11 * c.g);
  result.b += (u_m12 * c.b);
  result.b += (u_m13 * c.a);
  result.b += u_m14;

  result.a = (u_m15 * c.r);
  result.a += (u_m16 * c.g);
  result.a += (u_m17 * c.b);
  result.a += (u_m18 * c.a);
  result.a += u_m19;

  gl_FragColor = vec4(result.rgb * result.a, result.a);
}
