require('@babel/register')({
  babelrc: false,
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
});
require('../website/index.tsx').default();
