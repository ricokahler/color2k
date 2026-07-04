interface Params {
  bodyHtml: string;
  css: string;
  structuredData: object;
}

function escapeJsonForHtml(value: object) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function template({ bodyHtml, css, structuredData }: Params) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>🌈 color2k</title>
    <meta
      name="description"
      content="A tiny color parsing and manipulation library for JavaScript."
    />
    <meta
      name="keywords"
      content="color, parsing, css, css-in-js, tinycolor, polished, chroma-js, npm, javascript"
    />
    <link rel="canonical" href="https://color2k.com/" />
    <meta property="og:title" content="🌈 color2k" />
    <meta property="og:site_name" content="color2k" />
    <meta property="og:url" content="https://color2k.com/" />
    <meta
      property="og:description"
      content="A tiny color parsing and manipulation library for JavaScript."
    />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://color2k.com/demo-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="🌈 color2k" />
    <meta
      name="twitter:description"
      content="A tiny color parsing and manipulation library for JavaScript."
    />
    <meta name="twitter:image" content="https://color2k.com/demo-image.png" />
    <meta name="author" content="Rico Kahler" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <style>${css}</style>
    <script type="application/ld+json">${escapeJsonForHtml(
      structuredData
    )}</script>
  </head>
  <body>
    <header class="site-header">
      <div class="site-header-inner">
        <a class="site-brand" href="/" aria-label="color2k home">
          <span aria-hidden="true">🌈</span>
          <span>color2k</span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          <a href="https://github.com/ricokahler/color2k">GitHub</a>
          <a href="https://www.npmjs.com/package/color2k">npm</a>
          <a href="https://rico.codes">rico.codes</a>
        </nav>
      </div>
    </header>
    <main class="page-shell">
      <article class="markdown-body">${bodyHtml}</article>
    </main>
    <footer class="site-footer">
      <nav aria-label="Rico Kahler links">
        <ul class="site-footer-links">
          <li><a href="mailto:hello@rico.codes">hello@rico.codes</a></li>
          <li><a href="https://github.com/ricokahler">GitHub</a></li>
          <li><a href="https://twitter.com/rico_kahler">Twitter</a></li>
          <li><a href="https://rico.codes/rss.xml">RSS</a></li>
        </ul>
      </nav>
    </footer>
  </body>
</html>`;
}

export default template;
