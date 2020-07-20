import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { hashElement } from 'folder-hash';
import packageJson from '../package.json';

const args = process.argv.slice(2);

function execute(command: string) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        stdout && console.error(stdout);
        stderr && console.error(stderr);
        reject(error);
      } else {
        stderr && console.warn(stderr);
        stdout && console.log(stdout);
        resolve();
      }
    });
  });
}

async function main() {
  console.log('cleaning…');
  await execute('rm -rf dist');

  console.log('linting…');
  await execute('npx eslint src --ext .ts,.tsx,.js,.jsx');

  console.log('generating types…');
  await execute('npx tsc');

  console.log('rolling…');
  await execute('npx rollup -c');

  const {
    name,
    description,
    repository,
    license,
    version: packageVersion,
    author,
    sideEffects,
  } = packageJson;

  const hash = await hashElement(path.resolve(__dirname, '../dist'), {
    encoding: 'hex',
  });
  const buildHash = hash.hash.substring(0, 9);

  const publishPackageJson = {
    name,
    description,
    version: args.includes('--use-package-version')
      ? packageVersion
      : `0.0.0-${buildHash}`,
    author,
    repository,
    license,
    main: 'index.js',
    module: 'index.esm.js',
    sideEffects,
  };

  await fs.promises.writeFile(
    path.resolve(__dirname, '../dist/package.json'),
    JSON.stringify(publishPackageJson, null, 2)
  );

  console.log('DONE!');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
