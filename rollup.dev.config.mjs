import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'editor',
      file: 'index.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
      typescript(),
      json(),
    ],
  },
];
