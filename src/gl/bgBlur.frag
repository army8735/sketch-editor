#version 100

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoords;

uniform sampler2D u_textureMask;
uniform sampler2D u_textureBg;
uniform sampler2D u_textureBlur;

void main() {
  vec4 colorMask = texture2D(u_textureMask, v_texCoords);
  vec4 colorBg = texture2D(u_textureBg, v_texCoords);
  vec4 colorBlur = texture2D(u_textureBlur, v_texCoords);
  if (colorMask.a <= 0.0) {
    gl_FragColor = colorBg;
  }
  else {
    gl_FragColor = colorBg * (1.0 - colorMask.a) + colorBlur * colorMask.a;
  }
}
