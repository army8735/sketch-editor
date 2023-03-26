import { terser } from 'rollup-plugin-terser';
import glslify from 'rollup-plugin-glslify';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';

export default [{
  input: 'src/index.js',
  output: [
    {
      name: 'editor',
      file: 'index.js',
      format: 'umd',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript(),
    json(),
    glslify(),
  ],
}, {
  input: 'src/index.js',
  output: {
    name: 'editor',
    file: 'index.min.js',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    typescript(),
    terser({
    }),
    json(),
    glslify(),
  ],
}];
