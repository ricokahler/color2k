// The `module` and UMD builds are loaded by old bundlers and browsers, so
// they must stay within ES2015 syntax. (The CommonJS build is run on a real
// Node 6 in CI; see scripts/check-node6.js.)
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const files = {
  'dist/index.module.es.js': 'module',
  'dist/index.unpkg.umd.js': 'script',
  'dist/index.main.cjs.js': 'script',
};

for (const [file, sourceType] of Object.entries(files)) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');

  try {
    acorn.parse(source, { ecmaVersion: 2015, sourceType });
  } catch (error) {
    console.error(`${file} is not ES2015: ${error.message}`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log(`ES2015 check passed: ${Object.keys(files).join(', ')}.`);
}
