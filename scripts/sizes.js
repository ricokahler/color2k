// Measures what color2k costs in a bundle: everything, and each export on its
// own after tree shaking (Rollup), minifying (Terser) and gzip. The numbers go
// into docs/sizes.json, which the README and the website both read.
//
// `node scripts/sizes.js` rewrites the file. With `--check` it fails if the
// file is out of date.
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { rollup } = require('rollup');
const { minify } = require('terser');

const root = path.resolve(__dirname, '..');
const entry = path.resolve(root, 'dist/index.exports.import.es.mjs');
const output = path.resolve(root, 'docs/sizes.json');

async function measure(names) {
  const input = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'color2k-size-')),
    'entry.mjs'
  );
  fs.writeFileSync(
    input,
    names
      ? `export { ${names.join(', ')} } from ${JSON.stringify(entry)};\n`
      : `export * from ${JSON.stringify(entry)};\n`
  );

  const bundle = await rollup({ input, onwarn() {} });
  const { output: chunks } = await bundle.generate({ format: 'es' });
  const { code } = await minify(chunks[0].code, {
    module: true,
    compress: { passes: 2 },
    mangle: true,
  });

  fs.rmSync(path.dirname(input), { recursive: true });
  return zlib.gzipSync(code, { level: 9 }).length;
}

async function main() {
  // The names come from the build, so nothing exported can go unmeasured.
  const names = Object.keys(
    require(path.resolve(root, 'dist/index.exports.require.cjs.js'))
  ).sort((a, b) => a.localeCompare(b));

  const sizes = { all: await measure(), exports: {} };
  for (const name of names) sizes.exports[name] = await measure([name]);

  const next = `${JSON.stringify(sizes, null, 2)}\n`;
  const current = fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '';

  if (process.argv.includes('--check')) {
    if (current !== next) {
      throw new Error(
        'docs/sizes.json is out of date. Run `npm run docs:generate`.'
      );
    }
    console.log(
      `Sizes are up to date: ${sizes.all} bytes for everything, min + gzip.`
    );
    return;
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, next);
  console.log(`Wrote docs/sizes.json (${sizes.all} bytes for everything).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
