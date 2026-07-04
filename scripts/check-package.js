const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getPackInfo() {
  const output = cp.execFileSync(
    'npm',
    ['pack', '--dry-run', '--json', '--ignore-scripts'],
    {
      cwd: root,
      encoding: 'utf8',
    }
  );
  const parsed = JSON.parse(output);
  assert(Array.isArray(parsed) && parsed.length === 1, 'Expected one pack entry');
  return parsed[0];
}

async function checkEntrypoints() {
  const cjs = require(path.resolve(root, 'dist/index.main.cjs.js'));
  const requireExport = require(path.resolve(
    root,
    'dist/index.exports.require.cjs.js'
  ));
  const esm = await import(
    pathToFileURL(
      path.resolve(root, 'dist/index.exports.import.es.mjs')
    ).toString()
  );

  for (const api of [cjs, requireExport, esm]) {
    assert(typeof api.darken === 'function', 'Missing darken export');
    assert(typeof api.guard === 'function', 'Missing guard export');
    assert(typeof api.toHex === 'function', 'Missing toHex export');
  }

  assert(
    fs.existsSync(path.resolve(root, 'dist/index.d.ts')),
    'Missing type declarations'
  );
  assert(
    fs.existsSync(path.resolve(root, 'dist/index.unpkg.umd.js')),
    'Missing UMD bundle'
  );
}

async function main() {
  await checkEntrypoints();

  const pack = getPackInfo();
  const files = pack.files.map(({ path: filePath }) => filePath).sort();
  const forbiddenPrefixes = [
    '.github/',
    'coverage/',
    'docs/',
    'node_modules/',
    'scripts/',
    'src/',
    'website/',
  ];
  const forbiddenFiles = [
    '.releaserc.json',
    'babel.config.json',
    'jest.config.js',
    'renovate.json',
    'rollup.config.mjs',
    'tsconfig.json',
  ];

  for (const file of files) {
    assert(
      !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      `Unexpected package file: ${file}`
    );
    assert(!forbiddenFiles.includes(file), `Unexpected package file: ${file}`);
  }

  for (const requiredFile of [
    'LICENSE',
    'README.md',
    'dist/index.d.ts',
    'dist/index.exports.import.es.mjs',
    'dist/index.exports.require.cjs.js',
    'dist/index.main.cjs.js',
    'dist/index.module.es.js',
    'dist/index.unpkg.umd.js',
    'package.json',
  ]) {
    assert(files.includes(requiredFile), `Missing package file: ${requiredFile}`);
  }

  console.log(
    `Package check passed: ${pack.entryCount} files, ${pack.unpackedSize} bytes unpacked.`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
