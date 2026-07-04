const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname, '../build');
const indexPath = path.resolve(buildDir, 'index.html');
const html = fs.readFileSync(indexPath, { encoding: 'utf8' });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptTags = html.match(/<script\b/gi) || [];

assert(
  scriptTags.length === 1 &&
    html.includes('<script type="application/ld+json">'),
  'Expected only one JSON-LD script tag'
);
assert(!html.includes('<script src='), 'Unexpected external script');
assert(!html.includes('Preact'), 'Unexpected Preact runtime');
assert(!html.includes('hydrate('), 'Unexpected hydration code');
assert(!html.includes('window.docs'), 'Unexpected client docs payload');
assert(!html.includes('<link rel="stylesheet"'), 'Unexpected external CSS');
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

console.log('Website check passed: static HTML, structured data, and sitemap are present.');
