import fs from 'fs';
import path from 'path';
import { terser } from 'rollup-plugin-terser';
import * as rollup from 'rollup';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import postcss from 'postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import template from './template';
import App from './App';

async function render() {
  // render app
  const result = renderToString(<App />);

  // bundle code
  const extensions = ['.js', '.ts', '.tsx'];
  const build = await rollup.rollup({
    input: require.resolve('./App'),
    plugins: [
      resolve({ extensions }),
      babel({
        babelrc: false,
        presets: [
          ['@babel/preset-env', { targets: 'defaults' }],
          '@babel/preset-typescript',
          '@babel/preset-react',
        ],
        babelHelpers: 'bundled',
        extensions,
      }),
      terser(),
    ],
    external: ['react', 'react-dom'],
  });
  const { output } = await build.generate({
    format: 'iife',
    name: 'App',
    globals: {
      react: 'React',
    },
  });
  if (output.length !== 1) {
    throw new Error('expected only one chunk');
  }
  const [chunk] = output;
  const { code } = chunk;

  // process css
  const rawCss = await fs.promises.readFile(
    path.resolve(__dirname, './App.css')
  );
  const { css } = await postcss([cssnano, autoprefixer]).process(rawCss, {
    from: path.resolve(__dirname, './App.css'),
  });

  // ensure build dir
  const buildFolder = path.resolve(__dirname, '../build');
  const exists = await new Promise<boolean>((resolve) => {
    fs.exists(buildFolder, resolve);
  });
  if (!exists) {
    await fs.promises.mkdir(buildFolder);
  }

  // write index.html
  await fs.promises.writeFile(
    path.resolve(buildFolder, './index.html'),
    template(result, code, css)
  );
}

export default render;
