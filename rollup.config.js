// rollup.config.js
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import stripCode from 'rollup-plugin-strip-code';
import { get } from 'lodash';

const extensions = ['.js', '.ts', '.tsx'];

const nodePlugins = [
  resolve({ extensions, preferBuiltins: true }),
  babel({
    babelrc: false,
    presets: [
      ['@babel/preset-env', { targets: { node: true } }],
      '@babel/preset-typescript',
    ],
    babelHelpers: 'bundled',
    extensions,
    include: ['packages/**/*'],
  }),
];

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

const getExternal = (name) => [
  ...Object.keys(require(`./packages/${name}/package.json`).dependencies || []),
  ...Object.keys(
    require(`./packages/${name}/package.json`).peerDependencies || []
  ),
  ...Object.keys(
    get(
      require(`./packages/${name}/tsconfig.json`),
      ['compilerOptions', 'paths'],
      {}
    )
  ),
  // mark all babel runtime deps are external
  ...(require(`./packages/${name}/package.json`).dependencies['@babel/runtime']
    ? [/^@babel\/runtime/]
    : []),
];

export default [
  // PARSE-TO-RGBA
  {
    input: './packages/parse-to-rgba/src/index.ts',
    output: {
      file: './dist/parse-to-rgba/index.js',
      format: 'umd',
      sourcemap: true,
      name: 'parseToRgba',
    },
    plugins: [
      ...umdPlugins,
      stripCode({
        start_comment: 'START.TESTS_ONLY',
        end_comment: 'END.TESTS_ONLY',
      }),
    ],
    external: getExternal('parse-to-rgba'),
  },
  {
    input: './packages/parse-to-rgba/src/index.ts',
    output: {
      file: './dist/parse-to-rgba/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      ...esmPlugins,
      stripCode({
        start_comment: 'START.TESTS_ONLY',
        end_comment: 'END.TESTS_ONLY',
      }),
    ],
    external: getExternal('parse-to-rgba'),
  },
  // NODE
  {
    input: './packages/node/src/index.ts',
    output: {
      file: './dist/node/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: nodePlugins,
    external: getExternal('node'),
  },
  // COLOR2K
  {
    input: './packages/color2k/src/index.ts',
    output: {
      file: './dist/color2k/index.js',
      format: 'umd',
      sourcemap: true,
      name: 'color2k',
      globals: {
        '@color2k/parse-to-rgba': 'parseToRgba',
      },
    },
    plugins: umdPlugins,
    external: getExternal('color2k'),
  },
  {
    input: './packages/color2k/src/index.ts',
    output: {
      file: './dist/color2k/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: esmPlugins,
    external: getExternal('color2k'),
  },
];
