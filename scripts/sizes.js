// Measures what color2k costs in a bundle: everything, each export on its own
// after tree shaking (Rollup), minifying (Terser) and gzip, and what each
// source file adds to the whole bundle. The numbers go into docs/sizes.json,
// which the README and the website both read.
//
// `node scripts/sizes.js` rewrites the file. With `--check` it fails if the
// file is out of date.
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const acorn = require('acorn');
const { rollup } = require('rollup');
const { minify } = require('terser');

const root = path.resolve(__dirname, '..');
const entry = path.resolve(root, 'dist/index.exports.import.es.mjs');
const output = path.resolve(root, 'docs/sizes.json');

// The imports an app makes to style a button from one brand color: its hover
// and active states, a see-through focus ring, the label that reads on it and
// a hex string to store. The website's treemap fills in what these pull in.
const TYPICAL = [
  'darken',
  'lighten',
  'mix',
  'readableColor',
  'toHex',
  'transparentize',
];

const COLOR_MAP = 'named colors';
const terserOptions = { module: true, compress: { passes: 2 }, mangle: true };
const gzip = (code) => zlib.gzipSync(code, { level: 9 }).length;

async function bundle(names) {
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

  const build = await rollup({ input, onwarn() {} });
  const { output: chunks } = await build.generate({ format: 'es' });

  fs.rmSync(path.dirname(input), { recursive: true });
  return chunks[0].code;
}

async function measure(names) {
  const { code } = await minify(await bundle(names), terserOptions);
  return gzip(code);
}

/** The source file behind each line of the built module, from its source map. */
function getLineSources() {
  const map = JSON.parse(fs.readFileSync(`${entry}.map`, 'utf8'));
  const digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let source = 0;

  return map.mappings.split(';').map((line) => {
    let first;

    for (const segment of line.split(',')) {
      // Each segment is a list of base64 VLQ numbers. The second is the
      // source file, as a difference from the one before.
      const fields = [];
      let value = 0;
      let shift = 0;

      for (const character of segment) {
        const digit = digits.indexOf(character);
        value += (digit & 31) << shift;
        shift += 5;
        if (!(digit & 32)) {
          fields.push(value & 1 ? -(value >> 1) : value >> 1);
          value = 0;
          shift = 0;
        }
      }

      if (fields.length > 1) {
        source += fields[1];
        if (first === undefined) first = source;
      }
    }

    return first === undefined
      ? undefined
      : path.basename(map.sources[first], '.ts');
  });
}

/**
 * What each source file adds to the gzipped bundle.
 *
 * Gzip sizes do not add up file by file, because each file compresses against
 * the ones before it. So this measures them in the order they sit in the
 * bundle: the size of the bundle up to and including a file, minus the size up
 * to the file before. The parts sum to the whole.
 */
async function measureFiles() {
  const code = fs
    .readFileSync(entry, 'utf8')
    .replace(/\n\/\/# sourceMappingURL=.*\n?$/, '\n');
  const lineSources = getLineSources();
  const program = acorn.parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
  });

  // Tag every top-level statement with its file, in a comment Terser keeps.
  let tagged = '';
  let position = 0;
  for (const statement of program.body) {
    const file =
      statement.type === 'ExportNamedDeclaration'
        ? 'exports'
        : lineSources[statement.loc.start.line - 1];
    if (!file) throw new Error('A statement in dist has no source file.');
    tagged += `${code.slice(position, statement.start)}/*!@${file}@*/`;
    position = statement.start;
  }
  tagged += code.slice(position);

  const plain = (await minify(code, terserOptions)).code;
  const marked = (
    await minify(tagged, { ...terserOptions, format: { comments: /^!@/ } })
  ).code;
  const parts = marked.split(/\n?\/\*!@(.+?)@\*\/\n?/);

  if (parts.filter((part, index) => index % 2 === 0).join('') !== plain) {
    throw new Error('Tagging the bundle by file changed how it minifies.');
  }

  // The named colors are one long string in the parser. Give it its own tile.
  const pieces = [];
  for (let index = 1; index < parts.length; index += 2) {
    const text = parts[index + 1];
    const colorMap = /(["'`])(?:\\.|(?!\1).){500,}\1/.exec(text);
    if (colorMap) {
      const end = colorMap.index + colorMap[0].length;
      pieces.push(
        [parts[index], text.slice(0, colorMap.index)],
        [COLOR_MAP, colorMap[0]],
        [parts[index], text.slice(end)]
      );
    } else {
      pieces.push([parts[index], text]);
    }
  }

  const files = {};
  let prefix = parts[0];
  let before = gzip(prefix);

  for (const [file, text] of pieces) {
    prefix += text;
    const size = gzip(prefix);
    files[file] = (files[file] || 0) + size - before;
    before = size;
  }
  // The 20 bytes an empty gzip file costs go to the first file.
  files[pieces[0][0]] += gzip('');

  return files;
}

/** The files a tree-shaken bundle of these exports still holds. */
async function getFilesFor(names, files) {
  const code = await bundle(names);
  return Object.keys(files).filter((file) =>
    file === COLOR_MAP
      ? /\bcolorMap\b/.test(code)
      : new RegExp(`(function|class) ${file}\\b`).test(code)
  );
}

async function main() {
  // The names come from the build, so nothing exported can go unmeasured.
  const names = Object.keys(
    require(path.resolve(root, 'dist/index.exports.require.cjs.js'))
  ).sort((a, b) => a.localeCompare(b));

  const sizes = { all: await measure(), exports: {} };
  for (const name of names) sizes.exports[name] = await measure([name]);

  sizes.files = await measureFiles();
  const total = Object.values(sizes.files).reduce((sum, size) => sum + size, 0);
  if (total !== sizes.all) {
    throw new Error(`Files add up to ${total} bytes, not ${sizes.all}.`);
  }

  sizes.typical = {
    imports: TYPICAL,
    size: await measure(TYPICAL),
    files: await getFilesFor(TYPICAL, sizes.files),
  };

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
