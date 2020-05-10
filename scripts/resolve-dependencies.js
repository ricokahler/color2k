const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const semver = require('semver');
const { isEqual } = require('lodash');

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

const parseVersion = version => {
  const match = /\D?([\d.]*)/.exec(version);
  if (!match) throw new Error('could not parse version');
  return match[1];
};

async function resolveDependencies() {
  await execute('node ./scripts/check-dependencies');

  const folderNames = await fs.promises.readdir(
    path.resolve(__dirname, '../packages'),
  );

  const folders = folderNames.map(folderName =>
    path.resolve(__dirname, `../packages/${folderName}`),
  );

  const allDependencies = folders
    .map(folder => {
      const { dependencies } = require(`${folder}/package.json`);

      return Object.entries(dependencies || []);
    })
    .flat()
    .filter(([k, v]) => Boolean(k) && Boolean(v));

  const allPeerDependencies = folders
    .map(folder => {
      const { peerDependencies } = require(`${folder}/package.json`);

      return Object.entries(peerDependencies || []);
    })
    .flat()
    .filter(([k, v]) => Boolean(k) && Boolean(v));

  const devDependencies = allDependencies.reduce(
    (deps, [packageName, version]) => {
      if (!deps[packageName]) {
        deps[packageName] = version;
        return deps;
      }

      const incomingVersion = parseVersion(version);
      const currentVersion = parseVersion(deps[packageName]);

      if (semver.gt(incomingVersion, currentVersion)) {
        deps[packageName] = incomingVersion;
        return deps;
      }

      return deps;
    },
    {},
  );

  const peerDependencies = allPeerDependencies.reduce(
    (deps, [packageName, version]) => {
      if (!deps[packageName]) {
        deps[packageName] = version;
        return deps;
      }

      const incomingVersion = parseVersion(version);
      const currentVersion = parseVersion(deps[packageName]);

      if (semver.lt(incomingVersion, currentVersion)) {
        deps[packageName] = incomingVersion;
        return deps;
      }

      return deps;
    },
    {},
  );

  const topLevelPackageJson = require('../package.json');
  await fs.promises.writeFile(
    require.resolve('../package.json'),
    JSON.stringify(
      {
        ...topLevelPackageJson,
        devDependencies: {
          ...topLevelPackageJson.devDependencies,
          ...devDependencies,
        },
        peerDependencies,
      },
      null,
      2,
    ),
  );

  const packageLockBefore = JSON.parse(
    (await fs.promises.readFile(require.resolve('../package-lock.json'))).toString(),
  );
  await execute('npm i');
  const packageLockAfter = JSON.parse(
    (await fs.promises.readFile(require.resolve('../package-lock.json'))).toString(),
  );

  if (!isEqual(packageLockBefore, packageLockAfter)) {
    throw new Error('package-lock.json changed after install');
  }
}

resolveDependencies()
  .then(() => {
    console.log('Dependencies resolved!');
    process.exit(0);
  })
  .catch(e => {
    console.error(e && e.message);
    process.exit(1);
  });
