import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import glslify from 'rollup-plugin-glslify';
import postcss from 'rollup-plugin-postcss';

const publicConfig = {
  format: 'umd',
  name: 'sketchEditor',
  sourcemap: true,
};

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        ...publicConfig,
      },
    ],
    plugins: [
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
      glslify(),
      typescript({
        declaration: false,
        target: "ES5",
      }),
      json(),
    ],
  },
  {
    input: 'src/style.less',
    output: {
      file: 'dist/style.css',
      sourcemap: true,
    },
    plugins: [
      postcss({
        extract: true,
      }),
    ],
  },
];
