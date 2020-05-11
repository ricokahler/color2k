const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { hashElement } = require('folder-hash');
const { get } = require('lodash');

const args = process.argv.slice(2);

function execute(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(stdout);
        console.error(stderr);
        reject(error);
      } else {
        console.warn(stderr);
        console.log(stdout);
        resolve();
      }
    });
  });
}

async function main() {
  console.log('cleaning…');
  await execute('rm -rf dist');

  console.log('linting…');
  await execute('npx eslint packages --ext .ts,.tsx,.js,.jsx');

  console.log('generating types…');
  await execute('npx tsc');

  console.log('rolling…');
  await execute('npx rollup -c');

  const hash = await hashElement(path.resolve(__dirname, '../dist'), {
    encoding: 'hex',
  });
  const buildHash = hash.hash.substring(0, 9);

  console.log('writing `package.json`s…');
  const topLevelPackageJson = require('../package.json');

  const {
    private: _private,
    scripts: _scripts,
    devDependencies: _devDependencies,
    peerDependencies: _peerDependencies,
    name: _name,
    description: _description,
    version: packageVersion,
    ...restOfTopLevelPackageJson
  } = topLevelPackageJson;

  const folderNames = await fs.promises.readdir(
    path.resolve(__dirname, '../packages')
  );

  const packageNames = folderNames.map(
    (folderName) => require(`../packages/${folderName}/package.json`).name
  );

  const version = args.includes('--use-package-version')
    ? packageVersion
    : `0.0.0-${buildHash}`;

  for (const folder of folderNames) {
    const {
      name,
      dependencies,
      peerDependencies,
      description,
    } = require(`../packages/${folder}/package.json`);

    const tsconfig = require(`../packages/${folder}/tsconfig.json`);

    const siblingDependencies = Object.keys(
      get(tsconfig, ['compilerOptions', 'paths'], {})
    ).reduce((acc, next) => {
      acc[next] = version;
      return acc;
    }, {});

    const buildFiles = await fs.promises.readdir(
      path.resolve(__dirname, `../dist/${folder}`)
    );
    const containsEsmBuild = buildFiles.includes('index.esm.js');

    const fixedPeerDeps = Object.entries(peerDependencies || {})
      .map(([packageName, packageVersion]) => {
        if (packageNames.includes(packageName)) return [packageName, version];
        return [packageName, packageVersion];
      })
      .reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {});

    const packageJson = {
      name,
      version,
      description,
      ...restOfTopLevelPackageJson,
      main: './index.js',
      types: './src',
      ...(containsEsmBuild && {
        module: './index.esm.js',
      }),
      dependencies: {
        ...siblingDependencies,
        ...dependencies,
      },
      ...(peerDependencies && { peerDependencies: fixedPeerDeps }),
      sideEffects: false,
    };

    await fs.promises.writeFile(
      path.resolve(__dirname, `../dist/${folder}/package.json`),
      JSON.stringify(packageJson, null, 2)
    );
  }

  console.log('DONE!');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
