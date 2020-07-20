// rollup.config.js
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';

const extensions = ['.js', '.ts', '.tsx'];

const umdPlugins = [
  resolve({
    extensions,
  }),
  babel({
    babelrc: false,
    presets: ['@babel/preset-env', '@babel/preset-typescript'],
    babelHelpers: 'bundled',
    extensions,
  }),
];

const esmPlugins = [
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
];

export default [
  // COLOR2K
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.js',
      format: 'umd',
      sourcemap: true,
      name: 'color2k',
    },
    plugins: umdPlugins,
    external: [/^@babel\/runtime/],
  },
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: esmPlugins,
    external: [/^@babel\/runtime/],
  },
];
