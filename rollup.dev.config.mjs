import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import del from 'rollup-plugin-delete'
import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import glslify from 'rollup-plugin-glslify';

const publicConfig = {
    format: 'umd',
    name: 'editor'
}
import postcss from 'rollup-plugin-postcss';

export default [
  {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.js',
            ...publicConfig
        },
        {
            file: 'dist/index.min.js',
            ...publicConfig,
            plugins: [
                terser()
            ]
        }
    ],
    plugins: [
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
      glslify(),
      typescript({
        declaration: false,
        target: "ES5"
      }),
      json(),
    ]
  },
  {
    input: 'demo/style.less',
    output: {
      file: 'demo/style.css',
      sourcemap: true,
    },
    plugins: [
      postcss({
        extract: true,
      }),
    ],
  },
];
