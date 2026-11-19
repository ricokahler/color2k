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

const ricoNavIndex = html.indexOf('href="https://rico.codes">rico.codes</a>');
const npmNavIndex = html.indexOf('aria-label="npm package"');
const githubNavIndex = html.indexOf('aria-label="GitHub repository"');

/** Every `<tag ...>` in the page, with its attributes parsed. */
function getTags(name) {
  const tags = [];
  const tagPattern = new RegExp(`<${name}\\b([^>]*)>`, 'gi');

  for (const [, source] of html.matchAll(tagPattern)) {
    const attributes = {};
    const attributePattern = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

    for (const [, key, double, single, bare] of source.matchAll(attributePattern)) {
      attributes[key.toLowerCase()] = double ?? single ?? bare ?? '';
    }

    tags.push(attributes);
  }

  return tags;
}

// The page is static. It may run exactly two scripts, both from this site:
// the library itself and the demos. The third tag is JSON-LD data.
const scripts = getTags('script');
const scriptSources = scripts
  .filter((attributes) => 'src' in attributes)
  .map(({ src }) => src);
const inlineScripts = scripts.filter((attributes) => !('src' in attributes));

assert(
  JSON.stringify(scriptSources) === JSON.stringify(['/color2k.js', '/site.js']),
  `Unexpected script sources: ${scriptSources.join(', ')}`
);
assert(
  inlineScripts.length === 1 && inlineScripts[0].type === 'application/ld+json',
  'The only inline script allowed is the JSON-LD data block'
);
assert(
  !/\son\w+\s*=/i.test(html.replace(/<pre[\s\S]*?<\/pre>/g, '')),
  'Unexpected inline event handler'
);

// Nothing on the page loads from another origin.
for (const tag of ['img', 'link', 'script', 'source', 'iframe', 'video', 'audio']) {
  for (const { src, href, rel = '' } of getTags(tag)) {
    const url = src ?? (tag === 'link' && !/canonical/.test(rel) ? href : undefined);
    assert(
      url === undefined || /^\/(?!\/)/.test(url),
      `<${tag}> loads from another origin: ${url}`
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
assert(/^\/\*\n/.test(headers), '_headers must apply the policy to every path');
assert(directives['default-src'] === "'none'", "CSP default-src must be 'none'");
assert(directives['script-src'] === "'self'", "CSP script-src must be 'self' only");
assert(
  directives['base-uri'] === "'none'" && directives['frame-ancestors'] === "'none'",
  'CSP must lock down base-uri and frame-ancestors'
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
  html.includes('id="live"') && html.includes('class="live-cells"'),
  'Missing server-rendered hero palette'
);
for (const name of exportNames) {
  assert(
    html.includes(`data-demo="${name}"`),
    `The gallery is missing a demo for ${name}`
  );
}
assert(
  (html.match(/<figure class="result"><svg/g) || []).length >= 10,
  'Missing recipe results'
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


// The demos load the real library, and their script parses.
const browserGlobal = {};
vm.runInNewContext(read('color2k.js'), browserGlobal);
assert(
  browserGlobal.color2k.toHex('red') === '#ff0000',
  'color2k.js does not define a working color2k global'
);
const site = read('site.js');
new vm.Script(site);
assert(
  site.trimEnd().endsWith('showcase.start(color2k);') &&
    !/\b(eval|fetch|XMLHttpRequest|import)\s*\(|new Function|innerHTML/.test(site),
  'site.js should only start the demos'
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
for (const page of ['', 'llms.txt', 'llms-full.txt']) {
  assert(
    sitemap.includes(`<loc>https://color2k.com/${page}</loc>`),
    `sitemap.xml is missing /${page}`
  );
}

console.log(
  'Website check passed: static HTML, demos, CSP, llms files, structured data, and sitemap are present.'
);
