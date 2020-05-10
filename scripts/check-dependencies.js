const fs = require('fs');
const path = require('path');

async function checkDependencies() {
  const folderNames = await fs.promises.readdir(
    path.resolve(__dirname, '../packages')
  );

  const packageNames = folderNames.map(
    (folderName) => require(`../packages/${folderName}/package.json`).name
  );

  const topLevelPackageJson = require('../package.json');

  if (topLevelPackageJson.dependencies) {
    throw new Error('Top-level package.json dependencies is not allowed');
  }

  for (const folderName of folderNames) {
    const folderPath = path.resolve(`./packages/${folderName}`);
    const packageFolders = await fs.promises.readdir(folderPath);

    if (packageFolders.includes('node_modules')) {
      throw new Error(`[${folderName}] had node_modules`);
    }

    if (packageFolders.includes('package-lock.json')) {
      throw new Error(`[${folderName}] had package-lock.json`);
    }

    const packageJson = require(`${folderPath}/package.json`);
    const {
      name,
      devDependencies,
      dependencies,
      peerDependencies,
    } = packageJson;

    if (!name) {
      throw new Error(`[${folderName}] did not have a name in package.json`);
    }

    if (!dependencies) {
      throw new Error(`[${folderName}] did not have a dependencies object.`);
    }

    if (devDependencies) {
      throw new Error(`[${folderName}] had devDependencies`);
    }

    for (const [packageName, incomingVersion] of Object.entries(dependencies)) {
      const expectedVersion = topLevelPackageJson.devDependencies[packageName];
      if (incomingVersion !== expectedVersion) {
        throw new Error(
          `[${folderName}] had a mismatching dependency. Saw '"${packageName}": "${incomingVersion}"' but expected '"${packageName}": ${expectedVersion}'`
        );
      }
    }

    for (const [packageName, incomingVersion] of Object.entries(
      peerDependencies || {}
    )) {
      const expectedVersion = topLevelPackageJson.peerDependencies[packageName];
      // ignore internal packages because they're versions will be resolved during build
      if (packageNames.includes(packageName)) {
        continue;
      }

      if (incomingVersion !== expectedVersion) {
        throw new Error(
          `[${folderName}] had a mismatching peer-dependency. Saw '"${packageName}": "${incomingVersion}"' but expected '"${packageName}": ${expectedVersion}'`
        );
      }
    }
  }
}

checkDependencies()
  .then(() => {
    console.log('Dependencies good!');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e && e.message);
    process.exit(1);
  });
