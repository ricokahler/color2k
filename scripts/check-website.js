const fs = require('fs');
const path = require('path');
const vm = require('vm');

const buildDir = path.resolve(__dirname, '../build');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const read = (file) =>
  fs.readFileSync(path.resolve(buildDir, file), { encoding: 'utf8' });
const pkg = require('../package.json');
// What the package really exports, from the build itself. Reading names out
// of src/index.ts would miss an export written in a different shape.
const color2k = require('../dist/index.exports.require.cjs.js');
const exportNames = Object.keys(color2k);

// Every page of the site: `/`, `/adjust/`, `/size/` and so on.
const pages = fs
  .readdirSync(buildDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${entry.name}/index.html`)
  .concat('index.html')
  .filter((file) => fs.existsSync(path.resolve(buildDir, file)))
  .map((file) => ({ file, url: `/${file.replace(/index\.html$/, '')}`, html: read(file) }));
const home = pages.find(({ url }) => url === '/');
const html = home.html;
const everyPage = pages.map((page) => page.html).join('\n');

assert(pages.length >= 12, `Expected the site's pages, found ${pages.length}`);

/** Every `<tag ...>` in a page, with its attributes parsed. */
function getTags(name, source = everyPage) {
  const tags = [];
  const tagPattern = new RegExp(`<${name}\\b([^>]*)>`, 'gi');

  for (const [, attributeSource] of source.matchAll(tagPattern)) {
    const attributes = {};
    const attributePattern = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

    for (const [, key, double, single, bare] of attributeSource.matchAll(attributePattern)) {
      attributes[key.toLowerCase()] = double ?? single ?? bare ?? '';
    }

    tags.push(attributes);
  }

  return tags;
}

for (const page of pages) {
  // Each page is static. It may run exactly three scripts, all from this
  // site: the few lines that set the color mode before first paint, the
  // library itself and the demos. The overview also carries JSON-LD data.
  const scripts = getTags('script', page.html);
  const scriptSources = scripts
    .filter((attributes) => 'src' in attributes)
    .map(({ src }) => src);
  const inlineScripts = scripts.filter((attributes) => !('src' in attributes));

  assert(
    JSON.stringify(scriptSources) ===
      JSON.stringify(['/theme.js', '/color2k.js', '/site.js']),
    `${page.url}: unexpected script sources: ${scriptSources.join(', ')}`
  );
  assert(
    inlineScripts.length === (page === home ? 1 : 0) &&
      inlineScripts.every(({ type }) => type === 'application/ld+json'),
    `${page.url}: the only inline script allowed is the JSON-LD data block on the overview`
  );
  assert(
    !/\son\w+\s*=/i.test(page.html.replace(/<pre[\s\S]*?<\/pre>/g, '')),
    `${page.url}: unexpected inline event handler`
  );

  // Nothing on the page loads from another origin.
  for (const tag of ['img', 'link', 'script', 'source', 'iframe', 'video', 'audio']) {
    for (const { src, href, rel = '' } of getTags(tag, page.html)) {
      const url = src ?? (tag === 'link' && !/canonical/.test(rel) ? href : undefined);
      assert(
        url === undefined || /^\/(?!\/)/.test(url),
        `${page.url}: <${tag}> loads from another origin: ${url}`
      );
    }
  }

  // One logo, one menu, one color bar and one h1 on every page.
  assert(
    (page.html.match(/<img src="\/logo\.svg" alt="color2k"/g) || []).length === 1 &&
      (page.html.match(/logo\.svg/g) || []).length === 1,
    `${page.url}: the logo should appear exactly once`
  );
  assert(
    (page.html.match(/<h1[\s>]/g) || []).length === 1,
    `${page.url}: expected exactly one h1`
  );
  assert(
    getTags('nav', page.html).some(({ id }) => id === 'menu') &&
      page.html.includes(`href="${page.url}" aria-current="page"`),
    `${page.url}: the menu must mark the page you are on`
  );
  for (const mode of ['system', 'light', 'dark']) {
    assert(
      page.html.includes(`data-mode="${mode}"`),
      `${page.url}: the menu needs its ${mode} switch`
    );
  }
  assert(
    getTags('input', page.html).some(({ id, type }) => id === 'pick-text' && type === 'text') &&
      getTags('input', page.html).some(({ id, type }) => id === 'pick-alpha' && type === 'range') &&
      getTags('div', page.html).some(
        ({ id, role, tabindex }) => id === 'pick-sv' && role === 'slider' && tabindex === '0'
      ),
    `${page.url}: the color bar needs its text field, alpha slider and a keyboard-reachable square`
  );
  assert(
    page.html.includes(`<link rel="canonical" href="https://color2k.com${page.url}" />`),
    `${page.url}: wrong canonical link`
  );
  assert(
    page.html.includes('class="foot"') &&
      page.html.includes('mailto:hello@rico.codes') &&
      page.html.includes('>blog</a>') &&
      page.html.includes('>GitHub</a>') &&
      !page.html.includes('>Twitter</a>') &&
      !page.html.includes('>RSS</a>') &&
      page.html.includes('href="/llms.txt"') &&
      page.html.includes('href="/llms-full.txt"'),
    `${page.url}: unexpected footer links`
  );

  // Every link inside the site lands on a page, and on an anchor that exists.
  for (const { href } of getTags('a', page.html)) {
    if (!href || /^(https?:|mailto:)/.test(href)) continue;
    const [target, anchor] = href.split('#');
    const destination = target
      ? pages.find(({ url }) => url === target) ||
        (fs.existsSync(path.resolve(buildDir, `.${target}`)) && { html: '' })
      : page;
    assert(destination, `${page.url}: links to ${href}, which is not a page`);
    assert(
      !anchor || !destination.html || destination.html.includes(` id="${anchor}"`),
      `${page.url}: links to ${href}, and that anchor does not exist`
    );
  }
}

// Netlify sends the Content-Security-Policy that enforces all of the above.
const headers = read('_headers');
const csp = (/Content-Security-Policy: (.+)/.exec(headers) || [])[1] || '';
const directives = Object.fromEntries(
  csp.split(';').map((directive) => {
    const [name, ...values] = directive.trim().split(/\s+/);
    return [name, values.join(' ')];
  })
);
assert(/^\/\*\n/m.test(headers), '_headers must apply the policy to every path');
assert(directives['default-src'] === "'none'", "CSP default-src must be 'none'");
assert(
  !('frame-src' in directives) || process.env.CONTEXT === 'deploy-preview',
  'Only deploy previews may allow a frame (for the Netlify toolbar)'
);
assert(directives['script-src'] === "'self'", "CSP script-src must be 'self' only");
assert(directives['font-src'] === "'self'", "CSP font-src must be 'self' only");
assert(
  directives['base-uri'] === "'none'" && directives['frame-ancestors'] === "'none'",
  'CSP must lock down base-uri and frame-ancestors'
);
assert(!everyPage.includes('Preact'), 'Unexpected Preact runtime');
assert(!everyPage.includes('hydrate('), 'Unexpected hydration code');
assert(!everyPage.includes('window.docs'), 'Unexpected client docs payload');
assert(!everyPage.includes('<link rel="stylesheet"'), 'Unexpected external CSS');
assert(
  html.includes('<link rel="icon" href="/favicon.svg" type="image/svg+xml" />'),
  'Missing SVG favicon'
);
assert(
  fs.existsSync(path.resolve(buildDir, 'logo.svg')) &&
    fs.existsSync(path.resolve(buildDir, 'og.png')),
  'Missing color2k logo'
);
// The splash wheel has to work from the keyboard.
assert(
  html.includes('class="hero"') &&
    getTags('div', html).some(
      ({ id, role, tabindex, 'aria-label': label }) =>
        id === 'wheel' && role === 'slider' && tabindex === '0' && label
    ),
  'The splash wheel must be a focusable, labeled slider'
);
// Fonts: at most two, small, served from this site and never render-blocking.
const fonts = fs.readdirSync(buildDir).filter((file) => /\.(woff2?|ttf|otf)$/.test(file));
const fontBytes = fonts.reduce(
  (total, file) => total + fs.statSync(path.resolve(buildDir, file)).size,
  0
);
assert(
  fonts.length <= 2 && fonts.every((file) => file.endsWith('.woff2')) && fontBytes < 30000,
  `Expected at most two small woff2 fonts, found ${fonts.join(', ')} (${fontBytes} bytes)`
);
for (const font of fonts) {
  assert(html.includes(`url("/${font}")`), `${font} is shipped but not used`);
}
assert(
  (html.match(/@font-face/g) || []).length === fonts.length &&
    (html.match(/font-display: ?swap/g) || []).length === fonts.length &&
    !/rel="preload"/.test(everyPage),
  'Fonts must use font-display: swap and must not be preloaded (only the theme samples use them)'
);
assert(
  fs.existsSync(path.resolve(buildDir, 'fonts-license.txt')),
  'Missing the font license'
);

// The site says "2.4 kB" a lot. Hold it to the measured size.
const sizes = require('../docs/sizes.json');
const sizePage = pages.find(({ url }) => url === '/size/').html;
assert(
  (sizes.all / 1000).toFixed(1) === '2.4' &&
    html.includes('in&nbsp;2.4&nbsp;kB') &&
    html.includes(`${sizes.all.toLocaleString('en-US')} bytes`) &&
    sizePage.includes(`${sizes.all.toLocaleString('en-US')} bytes`),
  'The size on the site does not match docs/sizes.json'
);
// The treemap has a tile for every source file, and the tiles add up.
const fileBytes = Object.values(sizes.files).reduce((sum, size) => sum + size, 0);
assert(fileBytes === sizes.all, 'The files in docs/sizes.json do not add up to the bundle');
for (const [file, size] of Object.entries(sizes.files)) {
  assert(
    new RegExp(`<code>${file === 'exports' ? 'export list' : file}(\\.ts)?</code></th><td>${size}</td>`).test(
      sizePage
    ),
    `The size page is missing ${file}`
  );
}
assert(
  (sizePage.match(/class="tile[ "]/g) || []).length === 2 * Object.keys(sizes.files).length,
  'The treemap should draw every file once in each of its two layouts'
);
// Every export has a section with a live demo on a group page, and nothing
// else does.
const listed = Array.from(
  everyPage.matchAll(/class="fn" data-fn="(\w+)" id="(\w+)"/g),
  ([, name, id]) => (name === id ? name : `${name} (id ${id})`)
);
assert(
  listed.slice().sort().join() === exportNames.slice().sort().join(),
  `The function pages do not match the package's exports: ${listed.join(', ')}`
);
for (const name of exportNames) {
  assert(
    new RegExp(`data-fn="${name}"[\\s\\S]*?data-demo="${name}"`).test(everyPage),
    `${name} has no live demo`
  );
}
assert(
  (everyPage.match(/<figure class="result"><svg/g) || []).length >= 10,
  'Missing recipe results'
);
assert(
  html.includes(`content="${pkg.description}"`),
  'Page description does not match package.json'
);
assert(
  html.includes('aria-label="GitHub repository"') &&
    html.includes('aria-label="npm package"'),
  'Missing icon-only package links'
);
assert(
  /\.bar \{\n  position: sticky;/.test(html),
  'The color bar is not sticky'
);
for (const theme of ['soft', 'serious', 'bold']) {
  assert(
    everyPage.includes(`data-demo="theme-${theme}"`) &&
      html.includes(`[data-demo="theme-${theme}"]{--t-bg:#`) &&
      html.includes(`:root[data-theme="dark"] [data-demo="theme-${theme}"]{--t-bg:#`),
    `The ${theme} theme is not rendered with its tokens`
  );
}
assert(everyPage.includes('class="shiki'), 'Missing server-rendered highlighting');
assert(html.includes('SoftwareSourceCode'), 'Missing structured data');
assert(
  fs.existsSync(path.resolve(buildDir, 'robots.txt')),
  'Missing robots.txt'
);
assert(
  fs.existsSync(path.resolve(buildDir, 'sitemap.xml')),
  'Missing sitemap.xml'
);

// The demos load the real library, and their script parses.
const browserGlobal = {};
vm.runInNewContext(read('color2k.js'), browserGlobal);
assert(
  browserGlobal.color2k.toHex('red') === '#ff0000',
  'color2k.js does not define a working color2k global'
);
const site = read('site.js');
new vm.Script(site);
new vm.Script(read('theme.js'));
assert(
  !/\b(eval|fetch|XMLHttpRequest|import)\s*\(|new Function|innerHTML|document\.write/.test(
    site + read('theme.js')
  ),
  'The site scripts should only run the demos'
);

// The site is themed from the visitor's color by `site()` in models.js. Sweep
// it through about 1,300 colors, see-through ones included, in light and dark.
// Every text pair has to hold WCAG AA, and so does highlighted code.
const models = require('../website/models.js')(color2k);
const sweep = [
  'white',
  'black',
  '#808080',
  'gold',
  'tomato',
  '#ffd1e8',
  'transparent',
  'rgba(255, 143, 184, 0.5)',
  'rgba(0, 0, 0, 0.5)',
  '#0d6efd80',
  // A see-through lime: the label on the wheel's hub once dropped to 3.19:1.
  'rgba(187, 255, 17, 0.5)',
  ...models.PRESETS.map(({ color }) => color),
];
const variants = [[1, 0.5], [0.7, 0.6], [0.5, 0.3], [0.9, 0.85], [0.2, 0.5], [1, 0.15], [0.6, 0.93]];
for (let hue = 0; hue < 360; hue += 2) {
  for (const [saturation, lightness] of variants) {
    sweep.push(color2k.toHex(color2k.hsla(hue, saturation, lightness, 1)));
  }
}
const codeColors = {
  light: new Set(Array.from(everyPage.matchAll(/--shiki-light:(#[0-9a-f]{3,8})/gi), ([, color]) => color)),
  dark: new Set(Array.from(everyPage.matchAll(/--shiki-dark:(#[0-9a-f]{3,8})/gi), ([, color]) => color)),
};
assert(codeColors.light.size > 3 && codeColors.dark.size > 3, 'Found no highlighted code to check');
for (const color of sweep) {
  for (const dark of [false, true]) {
    const tokens = models.site(color, dark);
    const label = `${color}${dark ? ' (dark)' : ''}`;
    Object.values(tokens).forEach((token) => color2k.parseToRgba(token));
    for (const [front, back] of models.SITE_PAIRS) {
      assert(
        !color2k.hasBadContrast(tokens[front], 'aa', tokens[back]),
        `The site theme fails AA for ${label}: ${front} on ${back}`
      );
    }
    for (const code of codeColors[dark ? 'dark' : 'light']) {
      assert(
        !color2k.hasBadContrast(code, 'aa', tokens.sunken),
        `Highlighted code fails AA for ${label}: ${code} on ${tokens.sunken}`
      );
    }
  }
}
// The site refuses a color it cannot paint, such as one with a malformed alpha.
assert(
  !models.usable('rgba(255,0,0,.)') && !models.usable('nope') && models.usable(' Tomato '),
  'models.usable should reject colors that parse to NaN'
);
// The label on the wheel's hub sits on the flattened color, never on the
// see-through one.
assert(
  /\.wheel-hub \{[^}]*background: var\(--accent\);[^}]*color: var\(--on-accent\);/.test(html),
  'The wheel hub must paint its label on the flattened color'
);
// The first paint uses the same theme, written into the CSS at build time.
for (const dark of [false, true]) {
  const tokens = models.tokenVars(models.site(models.DEFAULT, dark));
  for (const [name, value] of Object.entries(tokens)) {
    assert(html.includes(`${name}:${value}`), `The CSS is missing ${name}:${value}`);
  }
}
for (const { color } of models.PRESETS) {
  assert(html.includes(`data-pick="${color}"`), `The color bar is missing the ${color} preset`);
}
// Every model the site can run has markup to fill, and runs on awkward colors.
for (const name of Object.keys(models.demos)) {
  if (name === 'overview') continue;
  for (const color of ['transparent', 'white', 'black', '#808080', 'rgba(0, 0, 0, 0.5)']) {
    models.demos[name](color, models.start(name, color), { bg: '#ffffff', dark: false });
  }
}

// llms.txt (https://llmstxt.org): an H1, a blockquote summary, then H2
// sections of links. Both files come from the README and the JSDoc.
const llms = read('llms.txt');
const llmsFull = read('llms-full.txt');
const readme = fs.readFileSync(path.resolve(__dirname, '../README.md'), 'utf8');

assert(
  llms.startsWith(`# color2k\n\n> ${pkg.description}\n`) &&
    llmsFull.startsWith(`# color2k\n\n> ${pkg.description}\n`),
  'llms files must start with the title and package description'
);
assert(
  (llms.match(/^# /gm) || []).length === 1 && /^## Docs$/m.test(llms),
  'llms.txt must have one H1 and a Docs section'
);
assert(
  llms.includes('https://color2k.com/llms-full.txt'),
  'llms.txt must link to llms-full.txt'
);
for (const [, url] of llms.matchAll(/\]\(([^)]+)\)/g)) {
  assert(/^https:\/\//.test(url), `llms.txt link is not absolute: ${url}`);
}
for (const name of exportNames) {
  assert(
    new RegExp(`^- \\[${name}\\b`, 'm').test(llms),
    `llms.txt is missing ${name}`
  );
  assert(
    new RegExp(`^### ${name}\\b`, 'm').test(llmsFull),
    `llms-full.txt is missing ${name}`
  );
}
for (const [heading] of readme.matchAll(/^#{2,3} .+$/gm)) {
  assert(llmsFull.includes(heading), `llms-full.txt is missing "${heading}"`);
}
assert(
  !/<!--|<p align|<img/.test(llms + llmsFull),
  'llms files should not contain HTML comments, images or the README header'
);
assert(
  (llmsFull.match(/^Result:$/gm) || []).length ===
    (readme.match(/^<!-- RESULT: /gm) || []).length,
  'llms-full.txt should give every recipe result as text'
);
assert(
  html.includes('href="/llms.txt"') && html.includes('href="/llms-full.txt"'),
  'Missing llms.txt links'
);

const sitemap = read('sitemap.xml');
for (const page of pages.map(({ url }) => url.slice(1)).concat(['llms.txt', 'llms-full.txt'])) {
  assert(
    sitemap.includes(`<loc>https://color2k.com/${page}</loc>`),
    `sitemap.xml is missing /${page}`
  );
}

console.log(
  `Website check passed: ${pages.length} static pages, demos, CSP, site theme contrast, llms files, structured data, and sitemap are present.`
);
