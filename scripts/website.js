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
        alias: {
          color2k: require.resolve('../src/index.ts'),
        },
      },
    ],
  ],
});
require('../website/index.tsx').default();
