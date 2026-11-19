interface TocItem {
  slug: string;
  title: string;
  children: Array<{ slug: string; title: string }>;
}

interface Params {
  bodyHtml: string;
  css: string;
  description: string;
  exportCount: number;
  heroCodeHtml: string;
  playgroundColor: string;
  playgroundHtml: string;
  playgroundPresets: string[];
  playgroundSource: string;
  structuredData: object;
  toc: TocItem[];
}

const title = 'color2k: color parsing and manipulation in 2.4 kB';

function escapeJsonForHtml(value: object) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderToc(toc: TocItem[]) {
  return toc
    .map(
      ({ slug, title, children }) => `<li>
            <a href="#${slug}">${escapeHtml(title)}</a>${
        children.length
          ? `
            <ul>
              ${children
                .map(
                  (child) =>
                    `<li><a href="#${child.slug}">${escapeHtml(child.title)}</a></li>`
                )
                .join('\n              ')}
            </ul>`
          : ''
      }
          </li>`
    )
    .join('\n          ');
}

// The only JavaScript on the page. Everything is rendered at build time; this
// re-renders the playground when the color changes and wires the copy button.
function clientScript(playgroundSource: string) {
  return `${playgroundSource.replace(/\nif \(typeof module[^\n]*\n?$/, '\n')}
(function () {
  var out = document.getElementById('play-out');
  var text = document.getElementById('play-text');
  var picker = document.getElementById('play-picker');
  var error = document.getElementById('play-error');
  var controls = document.getElementById('play-controls');
  if (!out || !window.color2k) return;

  function update(value, from) {
    try {
      out.innerHTML = playground(color2k, value);
      error.textContent = '';
      text.removeAttribute('aria-invalid');
      if (from !== text) text.value = value;
      if (from !== picker) picker.value = color2k.toHex(value).slice(0, 7);
    } catch (e) {
      error.textContent = e.message;
      text.setAttribute('aria-invalid', 'true');
    }
  }

  controls.hidden = false;
  text.addEventListener('input', function () { update(text.value, text); });
  picker.addEventListener('input', function () { update(picker.value, picker); });
  controls.addEventListener('click', function (event) {
    var color = event.target.getAttribute && event.target.getAttribute('data-color');
    if (color) update(color);
  });

  var copy = document.getElementById('copy-install');
  if (copy && navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText('npm i color2k').then(function () {
        copy.textContent = 'Copied';
        setTimeout(function () { copy.textContent = 'Copy'; }, 1500);
      });
    });
  }
})();`;
}

function template({
  bodyHtml,
  css,
  description,
  exportCount,
  heroCodeHtml,
  playgroundColor,
  playgroundHtml,
  playgroundPresets,
  playgroundSource,
  structuredData,
  toc,
}: Params) {
  const safeDescription = escapeHtml(description);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${safeDescription}" />
    <meta
      name="keywords"
      content="color, parsing, css, css-in-js, tinycolor, polished, chroma-js, npm, javascript, typescript"
    />
    <link rel="canonical" href="https://color2k.com/" />
    <meta property="og:title" content="${title}" />
    <meta property="og:site_name" content="color2k" />
    <meta property="og:url" content="https://color2k.com/" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://color2k.com/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="color2k: color parsing and manipulation in 2.4 kB" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="https://color2k.com/og.png" />
    <meta name="author" content="Rico Kahler" />
    <meta name="theme-color" content="#10131f" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
    <link rel="alternate" type="text/plain" href="/llms-full.txt" title="llms-full.txt" />
    <style>${css}</style>
    <script type="application/ld+json">${escapeJsonForHtml(
      structuredData
    )}</script>
  </head>
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="site-header">
      <div class="site-header-inner">
        <a class="site-brand" href="/" aria-label="color2k home">
          <img src="/logo.svg" alt="color2k" width="115" height="30" />
        </a>
        <nav class="site-nav" aria-label="Primary">
          <a class="site-nav-text" href="#recipes">Recipes</a>
          <a class="site-nav-text" href="#api">API</a>
          <a class="site-nav-text" href="/llms.txt">llms.txt</a>
          <a class="site-nav-text site-nav-rico" href="https://rico.codes">rico.codes</a>
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
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
        <img class="hero-logo" src="/logo.svg" alt="" width="460" height="120" />
        <h1>Color parsing and manipulation in&nbsp;2.4&nbsp;kB.</h1>
        <p class="hero-lead">
          Darken, lighten, mix, convert and check contrast with plain
          functions. Zero dependencies, tree-shakeable, TypeScript included.
        </p>
        <div class="hero-actions">
          <div class="hero-install">
            <code>npm i color2k</code>
            <button type="button" id="copy-install" hidden>Copy</button>
          </div>
          <a class="hero-button" href="#quickstart">Quickstart</a>
          <a class="hero-link" href="#api">API reference</a>
        </div>
        <dl class="hero-stats">
          <div><dt>min + gzip</dt><dd>2.4 kB</dd></div>
          <div><dt>dependencies</dt><dd>0</dd></div>
          <div><dt>functions</dt><dd>${exportCount}</dd></div>
          <div><dt>types</dt><dd>built in</dd></div>
        </dl>
        </div>
        <div class="hero-code">${heroCodeHtml}</div>
      </div>
      <div class="hero-stripes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    </div>
    <section class="play" id="playground" aria-labelledby="playground-title">
      <div class="play-inner">
        <div class="play-head">
          <h2 id="playground-title">Try it</h2>
          <p>This page loads the real 2.4 kB library. It is also in your console as <code>color2k</code>.</p>
        </div>
        <div class="play-controls" id="play-controls" hidden>
          <input type="color" id="play-picker" value="${escapeHtml(
            playgroundColor
          )}" aria-label="Pick a color" />
          <input
            type="text"
            id="play-text"
            value="${escapeHtml(playgroundColor)}"
            aria-label="Any CSS color string"
            aria-describedby="play-error"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
          />
          ${playgroundPresets
            .map(
              (preset) =>
                `<button type="button" data-color="${escapeHtml(
                  preset
                )}">${escapeHtml(preset)}</button>`
            )
            .join('\n          ')}
        </div>
        <p class="play-error" id="play-error" role="status"></p>
        <div id="play-out">${playgroundHtml}</div>
      </div>
    </section>
    <div class="page-shell">
      <nav class="toc" aria-label="On this page">
        <ul>
          ${renderToc(toc)}
        </ul>
      </nav>
      <main id="content">
        <article class="markdown-body">${bodyHtml}</article>
      </main>
    </div>
    <footer class="site-footer">
      <nav aria-label="Rico Kahler links">
        <ul class="site-footer-links">
          <li><a href="mailto:hello@rico.codes">hello@rico.codes</a></li>
          <li><a href="https://rico.codes">blog</a></li>
          <li><a href="https://github.com/ricokahler">GitHub</a></li>
          <li><a href="/llms.txt">llms.txt</a></li>
          <li><a href="/llms-full.txt">llms-full.txt</a></li>
        </ul>
      </nav>
    </footer>
    <script src="/color2k.js"></script>
    <script>${clientScript(playgroundSource)}</script>
  </body>
</html>`;
}

export default template;
