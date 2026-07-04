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
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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
          <a href="https://rico.codes">rico.codes</a>
          <a
            class="site-icon-link site-icon-link-npm"
            href="https://www.npmjs.com/package/color2k"
            aria-label="npm package"
            title="npm package"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M0 0h24v24H0V0Zm4.8 19.2h4.8V9.6H12v9.6h7.2V4.8H4.8v14.4Zm9.6-2.4V9.6h2.4v7.2h-2.4Z" />
            </svg>
          </a>
          <a
            class="site-icon-link"
            href="https://github.com/ricokahler/color2k"
            aria-label="GitHub repository"
            title="GitHub repository"
          >
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.87c.68 0 1.36.09 2 .26 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
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
          <li><a href="https://rico.codes">blog</a></li>
          <li><a href="https://github.com/ricokahler">GitHub</a></li>
        </ul>
      </nav>
    </footer>
  </body>
</html>`;
}

export default template;
