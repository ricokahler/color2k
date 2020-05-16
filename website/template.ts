import { DocInfo } from './getDocInfo';

interface Params {
  reactHtml: string;
  reactCode: string;
  css: string;
  docs: DocInfo[];
  readmeHtml: string;
}

function template({ reactCode, reactHtml, css, docs, readmeHtml }: Params) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <title>color2k</title>
      <meta
        name="description"
        content="a color parsing and manipulation lib served in 2kB or less"
      />
      <meta
        name="keywords"
        content="color, parsing, polished, chroma-js, css, css-in-js, tinycolor2, npm, javascript"
      />
      <meta
        name="twitter:title"
        content="color2k"
      />
      <meta
        name="twitter:description"
        content="a color parsing and manipulation lib served in 2kB or less"
      />
      <meta property="og:title" content="color2k">
      <meta property="og:site_name" content="color2k">
      <meta property="og:url" content="https://color2k.com">
      <meta property="og:description" content="a color parsing and manipulation lib served in 2kB or less">
      <meta property="og:type" content="website">
      <meta property="og:image" content="https://og-image.now.sh/**color**2k.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-white.svg&widths=100&heights=150">
      <meta name="copyright" content="Copyright © 2020 Rico Kahler" />
      <meta name="author" content="Rico Kahler" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
      <link rel="manifest" href="/site.webmanifest">
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/normalize.css@8.0.1/normalize.css">
      <style>${css}</style>
    </head>
    <body>
      ${reactHtml}
      <script>${reactCode}</script>
      <script>window.docs = ${JSON.stringify(docs)};</script>
      <script>window.readmeHtml = ${JSON.stringify(readmeHtml)};</script>
      <script>
        Preact.hydrate(Preact.createElement(App, { docs: window.docs, readmeHtml: window.readmeHtml }, []), document.body);
      </script>
    </body>
  </html>`;
}

export default template;
