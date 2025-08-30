import url from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import showdown from 'showdown';
import { darken, readableColor, parseToRgba, toHex } from 'color2k';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

interface Props {
  color: string;
  title?: string;
}

function Swatch({ color, title }: Props) {
  const colorText = toHex(color).toUpperCase();

  return (
    <div className="swatch" style={{ backgroundColor: color }}>
      <span className="swatch-color" style={{ color: readableColor(color) }}>
        {title || colorText}
      </span>
    </div>
  );
}

const css = (strings: TemplateStringsArray, ...values: any[]) =>
  strings.reduce((result, string, i) => {
    return result + string + (i < values.length ? values[i] : '');
  }, '');

const converter = new showdown.Converter();
converter.setFlavor('github');

const rootDir = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  '..'
);

const readme = await fs.promises.readFile(
  path.resolve(rootDir, './README.md'),
  'utf-8'
);

const html = renderToStaticMarkup(
  <html>
    <head>
      <style>
        {css`
          :root {
            font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir,
              segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, roboto,
              noto, arial, sans-serif;

            font-size: 16px;

            color: #1f2328;
          }

          a {
            color: palevioletred;
          }

          .content h1 {
            position: sticky;
            top: 0;
            /* border-bottom: 1px solid rgb(216, 222, 228); */
            background: white;
            font-weight: 600;
          }

          h2 {
            font-weight: 600;
            border-bottom: 1px solid rgb(216, 222, 228);
            padding-bottom: 7.2px;
            position: sticky;
            top: 42px;
            background: white;
            padding: 0.5rem 0;
          }

          h1 a {
            text-decoration: none;
            color: inherit;
          }

          blockquote {
            margin: 0;
            padding: 0 0 0 1rem;
            border-left: 4px solid rgb(208, 215, 222);
            color: #656d76;
          }

          body {
            margin: 0;
          }

          .content {
            max-width: 720px;
            margin: 1rem auto;
            padding: 0.25rem 1rem;
            background: white;
            border-radius: 0.5rem;
          }

          pre {
            background: rgb(246, 248, 250);
            border-radius: 0.5rem;
            overflow: auto;
            padding: 1rem;
          }

          .landing {
            min-height: 100vh;
            display: flex;
          }

          .landing--left {
            flex: auto;
            display: flex;
          }

          .landing--right {
            flex: 0 1 auto;
          }

          .jumbotron {
            margin: auto;
          }

          .jumbotron h1 {
            font-size: 5rem;
            margin: 0;
          }

          .jumbotron p {
            font-size: 2rem;
          }

          table {
          }

          .swatch-set {
            display: flex;
          }

          .swatch {
            width: 128px;
            height: 128px;
            display: flex;
            padding: 8px;
          }

          .swatch-color {
            margin-top: auto;
            margin-left: auto;
            font-size: 12px;
            text-align: right;
            font-weight: bold;
          }
        `}
      </style>
    </head>
    <body>
      <main>
        <section className="landing">
          <div className="landing--left">
            <div className="jumbotron">
              <h1>color2k</h1>
              <p>
                an extremely simple color parsing and transformation library
                composed of pure, tree-shakable functions.
              </p>
            </div>
          </div>
          <div className="landing--right">
            <div className="swatch-set">
              {[
                'palevioletred',
                'peachpuff',
                'papayawhip',
                'lavenderblush',
              ].map((color) => (
                // eslint-disable-next-line react/jsx-key
                <div key={color}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Swatch
                      key={i}
                      {...(i === 0 && { title: color })}
                      color={darken(color, i / 10)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          className="content"
          dangerouslySetInnerHTML={{ __html: converter.makeHtml(readme) }}
        ></section>
      </main>
    </body>
  </html>
);

await fs.promises.writeFile(path.resolve(rootDir, './test.html'), html);
