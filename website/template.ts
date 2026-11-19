interface TocItem {
  slug: string;
  title: string;
  children: Array<{ slug: string; title: string }>;
}

interface Theme {
  key: string;
  name: string;
  kicker: string;
  how: string;
  adjusted: boolean;
  codeHtml: string;
  lines: number;
  style: string;
  ratios: { text: string; button: string; chip: string };
  why: Array<{ text: string; code: string }>;
}

interface Params {
  bodyHtml: string;
  comparison: Array<{ name: string; size: number }>;
  css: string;
  description: string;
  exportCount: number;
  fieldColumns: number;
  fieldRows: string[];
  fieldSvg: string;
  functionsHtml: string;
  sizes: { all: string; bytes: string; rounded: string };
  structuredData: object;
  studioColor: string;
  studioPresets: Array<{ name: string; color: string }>;
  studioWash: string;
  themes: Theme[];
  toc: TocItem[];
}

const title = 'color2k: every color job your UI needs, in 2.4 kB';

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

const bars = [0.42, 0.58, 0.5, 0.72, 0.64, 0.86, 1]
  .map((height) => `<i style="--h:${height}"></i>`)
  .join('');

// One theme: a small made-up product screen painted entirely with its
// tokens, then what the builder decided about the color, then the builder.
function renderLook(theme: Theme, index: number) {
  return `<div class="look" data-theme="${theme.key}" id="look-${theme.key}">
          <article class="tcard" data-adjusted="${theme.adjusted}" style="${escapeHtml(theme.style)}">
            <p class="t-top"><i class="t-mark"></i><span class="t-kicker">Theme 0${index + 1}</span><span class="t-chip">${theme.kicker}</span></p>
            <h3 class="t-title">${theme.name}</h3>
            <p class="t-body">${escapeHtml(theme.how)}</p>
            <p class="t-actions"><span class="t-btn">Get started</span><span class="t-link">Learn more</span><span class="t-note">Adjusted</span></p>
            <div class="t-ui" aria-hidden="true">
              <p class="t-tabs"><span class="is-on">Overview</span><span>Activity</span><span>Settings</span></p>
              <div class="t-stats">
                <p class="t-stat t-stat-accent"><small>Revenue</small><b>$48.2k</b></p>
                <p class="t-stat t-stat-soft"><small>Orders</small><b>1,204</b></p>
                <p class="t-stat"><small>Refunds</small><b>12</b></p>
              </div>
              <div class="t-chart">${bars}</div>
              <p class="t-field"><span class="t-input">you@studio.com</span><span class="t-switch"><i></i></span></p>
              <p class="t-person"><i class="t-avatar"></i><span><b>Mina Okafor</b><small>Approved the invoice</small></span><span class="t-tag">Paid</span></p>
              <p class="t-person"><i class="t-avatar t-avatar-2"></i><span><b>Jo Lindqvist</b><small>Left a comment</small></span><span class="t-tag">Draft</span></p>
            </div>
            <p class="t-ratios">
              <span>Text <b data-ratio="text">${theme.ratios.text}</b></span>
              <span>Button <b data-ratio="button">${theme.ratios.button}</b></span>
              <span>Chip <b data-ratio="chip">${theme.ratios.chip}</b></span>
            </p>
          </article>
          <ul class="why">
            ${theme.why
              .map(
                ({ text, code }) =>
                  `<li><p data-why>${escapeHtml(text)}</p><code>${escapeHtml(code)}</code></li>`
              )
              .join('\n            ')}
          </ul>
          <details class="look-code">
            <summary>The whole builder, ${theme.lines} lines</summary>
            ${theme.codeHtml}
          </details>
        </div>`;
}

function template({
  bodyHtml,
  comparison,
  css,
  description,
  exportCount,
  fieldColumns,
  fieldRows,
  fieldSvg,
  functionsHtml,
  sizes,
  structuredData,
  studioColor,
  studioPresets,
  studioWash,
  themes,
  toc,
}: Params) {
  const safeDescription = escapeHtml(description);
  const largest = Math.max(...comparison.map(({ size }) => size));

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${safeDescription}" />
    <meta
      name="keywords"
      content="color, parsing, css, css-in-js, theming, contrast, tinycolor, polished, chroma-js, npm, javascript, typescript"
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
    <meta property="og:image:alt" content="color2k. Every color job your UI needs, in 2.4 kB." />
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
    <script src="/color2k.js" defer></script>
    <script src="/site.js" defer></script>
    <style>${css}</style>
    <script type="application/ld+json">${escapeJsonForHtml(
      structuredData
    )}</script>
  </head>
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="site-header">
      <div class="site-header-inner">
        <a class="site-brand" href="#top" aria-label="color2k, back to the top">
          <img src="/logo.svg" alt="color2k" width="131" height="34" />
        </a>
        <nav class="site-nav" aria-label="Sections">
          <a href="#themes" data-spy="themes">Themes</a>
          <a href="#functions" data-spy="functions">Functions</a>
          <a href="#recipes" data-spy="recipes">Recipes</a>
          <a href="#api" data-spy="api">API</a>
          <a class="site-nav-extra" href="https://rico.codes">rico.codes</a>
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
    <section class="hero" id="top">
      <div class="field" id="hero" style="--columns:${fieldColumns}">
        ${fieldSvg}
        <canvas
          id="field"
          width="${fieldColumns}"
          height="${fieldRows.length}"
          role="img"
          aria-label="A wall of color tiles, one row for each of ${fieldRows.length} color2k functions. The colors drift around the color wheel."
        ></canvas>
        <div class="field-grid" aria-hidden="true"></div>
        <ul class="field-rows" aria-hidden="true">
          ${fieldRows.map((name) => `<li><code>${name}</code></li>`).join('')}
        </ul>
        <button type="button" class="field-pause needs-js" id="motion" aria-pressed="false">Pause</button>
      </div>
      <div class="hero-copy">
        <img class="hero-logo" src="/logo.svg" alt="" width="459" height="119" />
        <h1>Every color job your UI needs, in&nbsp;${sizes.rounded}&nbsp;kB.</h1>
        <p class="hero-lead">
          Give color2k one color and get back its hover state, the text color
          that reads on it, a full palette or a whole theme. It is
          ${exportCount - 1} small functions with no dependencies.
        </p>
        <div class="hero-actions">
          <div class="hero-install">
            <code>npm i color2k</code>
            <button type="button" id="copy-install" class="needs-js">Copy</button>
          </div>
          <a class="hero-button" href="#themes">See what it makes</a>
          <a class="hero-link" href="#functions">Find a function</a>
        </div>
      </div>
    </section>
    <section class="studio" id="themes" aria-labelledby="themes-title" data-mode="light">
      <div class="studio-wash" id="studio-wash" style="background:${escapeHtml(studioWash)}" aria-hidden="true"></div>
      <div class="studio-head">
        <p class="eyebrow">Themes</p>
        <h2 id="themes-title">One color in. Three looks out.</h2>
        <p>
          Drag across the strip. All three themes rebuild from your color as
          you go, and each one makes its own calls about it. Their text holds
          WCAG AA whatever you pick.
        </p>
      </div>
      <div class="studio-bar needs-js">
        <div class="studio-bar-inner">
          <div
            class="studio-pad"
            id="studio-slider"
            role="slider"
            tabindex="0"
            aria-label="Color. Drag across it, or use the arrow keys: left and right for hue, up and down for lightness."
            aria-valuemin="0"
            aria-valuemax="360"
            aria-valuenow="0"
            aria-valuetext="${escapeHtml(studioColor)}"
          >
            <canvas id="studio-pad" width="72" height="9" aria-hidden="true"></canvas>
            <i id="studio-thumb" hidden></i>
          </div>
          <div class="studio-row">
            <input type="color" id="studio-picker" value="${escapeHtml(
              studioColor
            )}" aria-label="Pick a color" />
            <input
              type="text"
              id="studio-text"
              value="${escapeHtml(studioColor)}"
              aria-label="Any color string color2k can parse"
              aria-describedby="studio-error"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
            />
            ${studioPresets
              .map(
                ({ name, color }) =>
                  `<button type="button" data-color="${escapeHtml(
                    color
                  )}" style="--dot:${escapeHtml(color)}">${escapeHtml(name)}</button>`
              )
              .join('\n            ')}
            <button type="button" class="studio-tool" id="studio-spin">Spin the wheel</button>
            <button type="button" class="studio-tool" id="studio-mode" aria-pressed="false">Dark</button>
          </div>
          <p class="studio-tiles">
            ${themes
              .map(
                (theme) =>
                  `<a href="#look-${theme.key}" data-tile="${theme.key}" data-theme="${theme.key}" style="${escapeHtml(
                    theme.style
                  )}"><i></i>${theme.name}</a>`
              )
              .join('\n            ')}
          </p>
          <p class="studio-error" id="studio-error" role="status"></p>
        </div>
      </div>
      <div class="looks">
        ${themes.map(renderLook).join('\n        ')}
      </div>
    </section>
    <section class="functions" id="functions" aria-labelledby="functions-title">
      <div class="functions-inner">
        <div class="section-head">
          <p class="eyebrow">Functions</p>
          <h2 id="functions-title">All ${exportCount} exports, on your color.</h2>
          <p>
            Each one is shown with the color you picked above, what it returns
            and what it weighs on its own. Tap a name for its full entry.
          </p>
        </div>
        <p class="fn-find needs-js">
          <label for="fn-search">Find a function</label>
          <input type="search" id="fn-search" placeholder="darken, contrast, hex" autocomplete="off" spellcheck="false" />
        </p>
        <div class="fn-groups">${functionsHtml}</div>
        <p class="fn-none" id="fn-none" hidden>Nothing matches that. Try "mix" or "contrast".</p>
      </div>
    </section>
    <section class="size" id="size" aria-labelledby="size-title">
      <div class="size-inner">
        <p class="eyebrow">Size</p>
        <div class="size-head">
          <p class="size-big" aria-hidden="true">${sizes.rounded}<small>kB</small></p>
          <div>
            <h2 id="size-title">${sizes.rounded} kB is the whole thing.</h2>
            <p>
              That is all ${exportCount} exports, minified and gzipped:
              ${sizes.bytes} bytes. Import a single function and you ship
              about 1.6 kB, because nearly all of them share one parser.
            </p>
          </div>
        </div>
        <div class="size-bars">
          <h3>Next to the others</h3>
          <ul>
            ${comparison
              .map(
                ({ name, size }) =>
                  `<li${name === 'color2k' ? ' class="size-us"' : ''}><span>${escapeHtml(
                    name
                  )}</span><b>${size.toFixed(1)} kB</b><i style="--w:${(
                    size / largest
                  ).toFixed(3)}"></i></li>`
              )
              .join('\n            ')}
          </ul>
        </div>
      </div>
    </section>
    <div class="page-shell">
      <nav class="toc" aria-label="On this page">
        <ul>
          ${renderToc(toc)}
        </ul>
      </nav>
      <main id="content">
        <details class="toc-phone">
          <summary>On this page</summary>
          <ul>
            ${renderToc(toc)}
          </ul>
        </details>
        <article class="markdown-body">${bodyHtml}</article>
      </main>
    </div>
    <footer class="site-footer">
      <nav aria-label="More">
        <ul class="site-footer-links">
          <li><a href="#top">Back to the top</a></li>
          <li><a href="/llms.txt">llms.txt</a></li>
          <li><a href="/llms-full.txt">llms-full.txt</a></li>
          <li><a href="https://github.com/ricokahler/color2k">Source</a></li>
          <li><a href="https://www.npmjs.com/package/color2k">npm</a></li>
          <li><a href="/fonts-license.txt">Font licenses</a></li>
        </ul>
      </nav>
      <nav aria-label="Rico Kahler links">
        <ul class="site-footer-links site-footer-rico">
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
