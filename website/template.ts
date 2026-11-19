import { escapeHtml, styleOf, wedge } from './demos';

export interface NavItem {
  id: string;
  title: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** One section of the page: Quickstart, Adjust, Size and so on. */
export interface Section extends NavItem {
  /** The menu group the section sits in, shown above its title. */
  parent: string;
  /** What people search for, shown as the second line of the heading. */
  search: string;
  lede: string;
  /** The section's Markdown twin, for agents. */
  file: string;
  /** Anchors from the old site that now land here. */
  legacy?: string[];
  body: string;
}

interface Preset {
  name: string;
  color: string;
}

interface Site {
  css: string;
  color: string;
  description: string;
  nav: NavGroup[];
  presets: Preset[];
  structuredData: object;
  hero: string;
  overview: string;
  sections: Section[];
}

export const SITE_TITLE = 'color2k: JavaScript color manipulation library in 2.5 kB';

function escapeJsonForHtml(value: object) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

const icons = {
  npm: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M0 0h24v24H0V0Zm4.8 19.2h4.8V9.6H12v9.6h7.2V4.8H4.8v14.4Zm9.6-2.4V9.6h2.4v7.2h-2.4Z" /></svg>',
  github:
    '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.87c.68 0 1.36.09 2 .26 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>',
  system:
    '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M2.5 4h15v9.5h-15zM7 17h6M10 13.5V17" /></svg>',
  light:
    '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="3.6" fill="currentColor" /><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" /></svg>',
  dark: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M16.6 12.6A7.2 7.2 0 0 1 7.4 3.4a7.2 7.2 0 1 0 9.2 9.2Z" /></svg>',
  arrow:
    '<svg class="arrow" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" d="M4 10h11M11 5l5 5-5 5" /></svg>',
};

export { icons };

function renderMenu(nav: NavGroup[]) {
  return nav
    .map(
      ({ title, items }) => `<section>
            <h2>${escapeHtml(title)}</h2>
            <ul>
              ${items
                .map(({ id, title: name }) => `<li><a href="#${id}" data-spy="${id}">${escapeHtml(name)}</a></li>`)
                .join('\n              ')}
            </ul>
          </section>`
    )
    .join('\n          ');
}

function renderSection(section: Section) {
  return `<section class="sec" id="${section.id}" aria-labelledby="${section.id}-title">
          ${(section.legacy || []).map((id) => `<span id="${id}"></span>`).join('')}
          <header class="head">
            <p class="crumb">${escapeHtml(section.parent)}</p>
            <h2 id="${section.id}-title">${escapeHtml(section.title)} <span>${escapeHtml(section.search)}</span></h2>
            <p class="lede">${section.lede}</p>
          </header>
          ${section.body}
          <p class="sec-foot"><a href="/${section.file}">This section as Markdown</a><a href="#top">Back to the top</a></p>
        </section>`;
}

function renderBar(color: string, presets: Preset[]) {
  const dots = (className: string) =>
    presets
      .map(
        ({ name, color: preset }) =>
          `<button type="button" class="${className}" data-pick="${escapeHtml(preset)}" aria-label="${name}" title="${name}"><i class="chk"><i style="background:${escapeHtml(
            preset
          )}"></i></i>${className === 'preset preset-named' ? `<span>${name}</span>` : ''}</button>`
      )
      .join('\n          ');

  return `<div class="bar" id="bar">
      <div class="bar-in">
        <button type="button" class="bar-swatch needs-js" id="pick-open" aria-expanded="false" aria-controls="picker" aria-label="Open the color picker" title="Open the color picker"><i class="chk"><i></i></i></button>
        <label class="bar-field needs-js">
          <span class="sr">Your color. Type any color color2k can parse.</span>
          <input type="text" id="pick-text" value="${escapeHtml(
            color
          )}" maxlength="64" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="pick-error" />
        </label>
        <div class="bar-presets needs-js" role="group" aria-label="Preset colors">
          ${dots('preset')}
        </div>
        <a class="bar-menu" href="#menu" data-menu-open>Menu</a>
      </div>
      <p class="bar-error" id="pick-error" role="status"></p>
      <div class="picker" id="picker" role="group" aria-label="Color picker" hidden>
        <div class="sv" id="pick-sv" role="slider" tabindex="0" aria-label="Saturation and brightness. Use the arrow keys." aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
        <div class="picker-rails">
          <label class="rail">
            <span class="rail-name">Hue <b id="pick-hue-value"></b></span>
            <span class="rail-track"><span class="rail-fill" aria-hidden="true" style="--track:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)"></span><input type="range" id="pick-hue" min="0" max="359" step="1" value="0" /></span>
          </label>
          <label class="rail">
            <span class="rail-name">Alpha <b id="pick-alpha-value"></b></span>
            <span class="rail-track chk"><span class="rail-fill" aria-hidden="true" style="--track:var(--alpha-fill)"></span><input type="range" id="pick-alpha" min="0" max="1" step="0.01" value="1" /></span>
          </label>
          <div class="picker-presets" role="group" aria-label="Preset colors">
            ${dots('preset preset-named')}
          </div>
        </div>
      </div>
    </div>`;
}

/** The one page: the menu, the splash, the color bar and every section. */
export function shell(site: Site) {
  const description = escapeHtml(site.description);
  const url = 'https://color2k.com/';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(SITE_TITLE)}</title>
    <meta name="description" content="${description}" />
    <meta
      name="keywords"
      content="color, javascript color library, lighten, darken, mix colors, hex to rgb, wcag contrast, css-in-js, theming, tinycolor, polished, chroma-js, typescript"
    />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${escapeHtml(SITE_TITLE)}" />
    <meta property="og:site_name" content="color2k" />
    <meta property="og:url" content="${url}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://color2k.com/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="color2k. Fully dynamic colors in 2.5 kB." />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(SITE_TITLE)}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="https://color2k.com/og.png" />
    <meta name="twitter:image:alt" content="color2k. Fully dynamic colors in 2.5 kB." />
    <meta name="author" content="Rico Kahler" />
    <meta name="theme-color" content="#10131f" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
    <link rel="alternate" type="text/plain" href="/llms-full.txt" title="llms-full.txt" />
    ${site.sections
      .map(
        ({ file, title }) =>
          `<link rel="alternate" type="text/markdown" href="/${file}" title="${escapeHtml(title)}" />`
      )
      .join('\n    ')}
    <script src="/theme.js"></script>
    <script src="/color2k.js" defer></script>
    <script src="/site.js" defer></script>
    <style>${site.css}</style>
    <script type="application/ld+json">${escapeJsonForHtml(site.structuredData)}</script>
  </head>
  <body>
    <a class="skip" href="#content">Skip to content</a>
    <header class="side">
      <div class="top">
        <a class="brand" href="#top" aria-label="color2k, back to the top">
          <img src="/logo.svg" alt="color2k" width="154" height="40" />
        </a>
        <button type="button" class="mode needs-js" id="mode" data-current="system" aria-label="Color mode: System. Switch to Light." title="Color mode: System">
          <span class="mode-system">${icons.system}</span><span class="mode-light">${icons.light}</span><span class="mode-dark">${icons.dark}</span>
        </button>
      </div>
      <nav class="menu" id="menu" aria-label="Sections">
        <button type="button" class="menu-close needs-js" data-menu-close>Close</button>
        <div class="menu-groups">
          ${renderMenu(site.nav)}
        </div>
        <ul class="menu-out">
          <li><a href="https://rico.codes">rico.codes</a></li>
          <li><a class="icon-link" href="https://www.npmjs.com/package/color2k" aria-label="npm package" title="npm package">${icons.npm}</a></li>
          <li><a class="icon-link" href="https://github.com/ricokahler/color2k" aria-label="GitHub repository" title="GitHub repository">${icons.github}</a></li>
        </ul>
      </nav>
    </header>
    <div class="main">
      ${site.hero}
      ${renderBar(site.color, site.presets)}
      <main id="content">
        ${site.overview}
        ${site.sections.map(renderSection).join('\n        ')}
      </main>
      <footer class="foot">
        <nav aria-label="More">
          <ul>
            <li><a href="#credits">Credits</a></li>
            <li><a href="/llms.txt">llms.txt</a></li>
            <li><a href="/llms-full.txt">llms-full.txt</a></li>
            <li><a href="https://github.com/ricokahler/color2k">Source</a></li>
            <li><a href="https://www.npmjs.com/package/color2k">npm</a></li>
            <li><a href="/fonts-license.txt">Font license</a></li>
          </ul>
        </nav>
        <nav aria-label="Rico Kahler links">
          <ul class="foot-rico">
            <li><a href="mailto:hello@rico.codes">hello@rico.codes</a></li>
            <li><a href="https://rico.codes">blog</a></li>
            <li><a href="https://github.com/ricokahler">GitHub</a></li>
          </ul>
        </nav>
      </footer>
    </div>
    <p class="toast" id="toast" role="status" aria-live="polite"></p>
  </body>
</html>
`;
}

/** The page for an address that is not there. */
export function notFound(css: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Page not found · color2k</title>
    <meta name="robots" content="noindex" />
    <script src="/theme.js"></script>
    <style>${css}</style>
  </head>
  <body>
    <main class="lost">
      <a class="brand" href="/"><img src="/logo.svg" alt="color2k" width="154" height="40" /></a>
      <h1>That page is not here</h1>
      <p class="lede">color2k.com is one page now. These will get you where you were going.</p>
      <p class="lost-links">
        <a class="btn" href="/">Overview${icons.arrow}</a>
        <a class="btn btn-quiet" href="/#quickstart">Quickstart</a>
        <a class="btn btn-quiet" href="/#functions">API</a>
      </p>
      <p class="note">Reading by machine? Try <a href="/llms.txt">llms.txt</a>.</p>
    </main>
  </body>
</html>
`;
}

// ------------------------------------------------------------------ home

interface WheelOptions {
  rings: number;
  wedges: number;
  vars: { [name: string]: string };
  hue: number;
  color: string;
}

function renderWheel({ rings, wedges, vars, hue, color }: WheelOptions) {
  // Ring 0 is the outside one. Each ring inward is thinner.
  const radii = [
    [69, 99],
    [50, 69],
    [35, 50],
    [24, 35],
  ];
  const sweep = 360 / wedges;

  return `<div class="hero-stage"><div class="wheel-wrap">
        <div
          class="wheel"
          id="wheel"
          role="slider"
          tabindex="0"
          aria-label="Hue. Drag the wheel, or use the left and right arrow keys."
          aria-valuemin="0"
          aria-valuemax="359"
          aria-valuenow="${Math.round(hue)}"
          aria-valuetext="${escapeHtml(color)}"
          style="${escapeHtml(styleOf(vars))}"
        >
          <svg viewBox="-100 -100 200 200" aria-hidden="true">
            <defs>
              ${Array.from({ length: rings })
                .map((_, ring) => `<path id="wr${ring}" d="${wedge(radii[ring][0], radii[ring][1], sweep)}" />`)
                .join('')}
            </defs>
            <circle class="wheel-back" r="99.5" />
            <g class="wheel-spin" id="wheel-spin" style="transform:rotate(${(-hue).toFixed(2)}deg)">
              ${Array.from({ length: rings })
                .map((_, ring) =>
                  Array.from(
                    { length: wedges },
                    (__, index) =>
                      `<use href="#wr${ring}" transform="rotate(${index * sweep})" style="fill:var(--w${ring}-${index})" data-w="${ring}-${index}" />`
                  ).join('')
                )
                .join('\n              ')}
            </g>
          </svg>
        </div>
        <i class="wheel-notch" aria-hidden="true"></i>
        <p class="wheel-hub" aria-hidden="true"><span data-site="hex">${escapeHtml(color)}</span></p>
      </div></div>`;
}

interface HomeOptions {
  wheel: WheelOptions;
  size: string;
  /** The lightness slider: where it starts, and the gradient under it. */
  lightness: number;
  track: string;
}

export function renderHero({ wheel, size, lightness, track }: HomeOptions) {
  return `<section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero-copy">
        <h1 id="hero-title">Fully dynamic colors in&nbsp;${size}&nbsp;kB</h1>
        <p class="hero-sub">
          color2k is a small JavaScript color library. Hand it a color while
          your app runs and it gives back the hover state and the text color
          that reads on top. It covers every 8-bit sRGB color, written as hex,
          rgb(a), hsl(a) or a CSS name. No dependencies.
        </p>
        <div class="hero-actions">
          <div class="install">
            <code>npm i color2k</code>
            <button type="button" class="needs-js" data-copy-text="npm i color2k">Copy</button>
          </div>
          <a class="btn" href="#quickstart">Quickstart${icons.arrow}</a>
        </div>
        <div class="hero-tune needs-js">
          <p class="hero-tip">This page is built from one color. Turn the wheel, or tap any wedge.</p>
          <label class="rail">
            <span class="rail-name">Lightness <b id="hero-light-value">${lightness}%</b></span>
            <span class="rail-track"><span class="rail-fill" id="hero-light-fill" aria-hidden="true" style="--track:${track}"></span><input type="range" id="hero-light" min="0" max="100" step="1" value="${lightness}" /></span>
          </label>
        </div>
      </div>
      ${renderWheel(wheel)}
    </section>`;
}
