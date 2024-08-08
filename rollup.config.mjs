import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import del from 'rollup-plugin-delete';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
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
      {
        file: 'dist/index.min.js',
        ...publicConfig,
        plugins: [
          terser(),
        ],
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
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'esm',
    },
    plugins: [
      glslify(),
      typescript({
        declaration: false,
      }),
      json(),
    ],
  },
  // 归并 .d.ts 文件
  {
    input: 'types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [
      // 将类型文件全部集中到一个文件中
      dts(),
      // 在构建完成后，删除 types 文件夹
      del({
        targets: 'types',
        hook: 'buildEnd',
      }),
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
  {
    input: 'src/style.less',
    output: {
      file: 'dist/style.min.css',
      sourcemap: true,
    },
    plugins: [
      postcss({
        extract: true,
        minimize: true,
      }),
    ],
  },
];
