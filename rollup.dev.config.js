import glslify from 'rollup-plugin-glslify';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';

export default [{
  input: 'src/index.ts',
  output: {
    name: 'editor',
    file: 'index.js',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    glslify(),
    typescript(),
    json(),
  ],
}];
