import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import glslify from 'rollup-plugin-glslify';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        name: 'editor',
        file: 'dist/index.js',
        format: 'umd',
        sourcemap: true,
      },
    ],
    plugins: [
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
      glslify(),
      typescript(),
      json(),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      name: 'editor',
      file: 'dist/index.min.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
      glslify(),
      typescript(),
      terser({
      }),
      json(),
    ],
  },
  {
    input: 'src/index.ts', // 你的主入口文件
    output: {
      file: 'dist/index.esm.js', // 输出文件
      format: 'esm', // ES模块格式
    },
    plugins:[
      glslify(),
      typescript(),
      json()
    ]
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }
];
