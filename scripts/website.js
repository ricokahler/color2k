const path = require('path');

require('@babel/register')({
  babelrc: false,
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: [path.resolve(__dirname, '../packages')],
        alias: {
          color2k: require.resolve('../packages/color2k/src/index.ts'),
          '@color2k/parse-to-rgba': require.resolve(
            '../packages/parse-to-rgba/src/index.ts'
          ),
        },
      },
    ],
  ],
});
require('../website/index.tsx').default();
