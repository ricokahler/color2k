require('@babel/register')({
  babelrc: false,
  extensions: ['.js', '.ts'],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
});

require('../website/docs')
  .generateReadme({ check: process.env.CHECK_DOCS === '1' })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
