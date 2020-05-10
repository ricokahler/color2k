// rollup.config.js
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';

const extensions = ['.js', '.ts', '.tsx'];

export default [
  {
    input: './src/index.ts',
    plugins: [
      resolve({
        extensions,
      }),
      babel({
        babelrc: false,
        presets: ['@babel/preset-env', '@babel/preset-typescript'],
        babelHelpers: 'bundled',
        extensions,
      }),
    ],
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'parseToRgba',
      sourcemap: true,
    },
  },
  {
    input: './src/index.ts',
    plugins: [
      resolve({
        extensions,
        modulesOnly: true,
      }),
      babel({
        babelrc: false,
        presets: ['@babel/preset-typescript'],
        plugins: ['@babel/plugin-transform-runtime'],
        babelHelpers: 'runtime',
        extensions,
      }),
    ],
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    external: ['@ricokahler/parse-to-rgba'],
  },
];
