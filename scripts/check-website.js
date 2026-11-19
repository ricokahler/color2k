const fs = require('fs');
const path = require('path');
const vm = require('vm');

const buildDir = path.resolve(__dirname, '../build');
const indexPath = path.resolve(buildDir, 'index.html');
const html = fs.readFileSync(indexPath, { encoding: 'utf8' });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const read = (file) =>
  fs.readFileSync(path.resolve(buildDir, file), { encoding: 'utf8' });
const pkg = require('../package.json');
const exportNames = Array.from(
  fs
    .readFileSync(path.resolve(__dirname, '../src/index.ts'), 'utf8')
    .matchAll(/export \{ default as (\w+) \}/g),
  ([, name]) => name
);

const scriptTags = html.match(/<script\b/gi) || [];
const ricoNavIndex = html.indexOf('href="https://rico.codes">rico.codes</a>');
const npmNavIndex = html.indexOf('aria-label="npm package"');
const githubNavIndex = html.indexOf('aria-label="GitHub repository"');

// The page is static. Its only scripts are the structured data, the library
// itself (for the playground) and one inline script that drives the playground.
assert(
  scriptTags.length === 3 &&
    html.includes('<script type="application/ld+json">') &&
    html.includes('<script src="/color2k.js"></script>'),
  'Expected only the JSON-LD, color2k.js and playground script tags'
);
assert(
  (html.match(/<script src=/g) || []).length === 1,
  'Unexpected external script'
);
assert(!html.includes('Preact'), 'Unexpected Preact runtime');
assert(!html.includes('hydrate('), 'Unexpected hydration code');
assert(!html.includes('window.docs'), 'Unexpected client docs payload');
assert(!html.includes('<link rel="stylesheet"'), 'Unexpected external CSS');
assert(
  html.includes('<link rel="icon" href="/favicon.svg" type="image/svg+xml" />'),
  'Missing SVG favicon'
);
assert(
  html.includes('<img src="/logo.svg" alt="color2k"') &&
    fs.existsSync(path.resolve(buildDir, 'logo.svg')) &&
    fs.existsSync(path.resolve(buildDir, 'og.png')),
  'Missing color2k logo'
);
assert(html.includes('class="hero"'), 'Missing hero');
assert(
  html.includes('id="play-out"') && html.includes('class="play-tile"'),
  'Missing server-rendered playground'
);
assert(
  html.includes(`content="${pkg.description}"`),
  'Page description does not match package.json'
);
assert(html.includes('class="site-header"'), 'Missing site header');
assert(
  html.includes('aria-label="GitHub repository"') &&
    html.includes('aria-label="npm package"'),
  'Missing icon-only package links'
);
assert(
  ricoNavIndex !== -1 &&
    npmNavIndex !== -1 &&
    githubNavIndex !== -1 &&
    ricoNavIndex < npmNavIndex &&
    npmNavIndex < githubNavIndex,
  'Unexpected site nav order'
);
assert(
  html.includes('class="site-footer"') &&
    html.includes('https://rico.codes') &&
    html.includes('mailto:hello@rico.codes') &&
    html.includes('>blog</a>') &&
    html.includes('>GitHub</a>') &&
    !html.includes('>Twitter</a>') &&
    !html.includes('>RSS</a>'),
  'Unexpected Rico footer links'
);
assert(
  html.includes('.site-header{position:sticky') ||
    html.includes('.site-header {\n  position: sticky;'),
  'Site header is not sticky'
);
assert(html.includes('id="api"'), 'Missing API heading');
assert(html.includes('id="guardlow-high-value"'), 'Missing guard API anchor');
assert(html.includes('class="shiki'), 'Missing server-rendered highlighting');
assert(html.includes('SoftwareSourceCode'), 'Missing structured data');
assert(
  fs.existsSync(path.resolve(buildDir, 'robots.txt')),
  'Missing robots.txt'
);
assert(
  fs.existsSync(path.resolve(buildDir, 'sitemap.xml')),
  'Missing sitemap.xml'
);


// The playground loads the real library.
const browserGlobal = {};
vm.runInNewContext(read('color2k.js'), browserGlobal);
assert(
  browserGlobal.color2k.toHex('red') === '#ff0000',
  'color2k.js does not define a working color2k global'
);

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
  !/<!--|<p align/.test(llms + llmsFull),
  'llms files should not contain HTML comments or the README header'
);
assert(
  html.includes('href="/llms.txt"') && html.includes('href="/llms-full.txt"'),
  'Missing llms.txt links'
);

const sitemap = read('sitemap.xml');
for (const page of ['', 'llms.txt', 'llms-full.txt']) {
  assert(
    sitemap.includes(`<loc>https://color2k.com/${page}</loc>`),
    `sitemap.xml is missing /${page}`
  );
}

console.log(
  'Website check passed: static HTML, playground, llms files, structured data, and sitemap are present.'
);
