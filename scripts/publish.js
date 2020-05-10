const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { createInterface } = require('readline');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

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

async function publish() {
  const folderNames = await fs.promises.readdir(
    path.resolve(__dirname, '../dist')
  );

  if (folderNames.length <= 0) {
    throw new Error(
      'Nothing found in dist folder. Please run `npm run build` first.'
    );
  }

  const tag = await question('tag (experimental): ');
  const otp = await question('npm OTP: ');

  for (const folderName of folderNames.slice().reverse()) {
    console.log(`Publishing ${folderName}`);
    try {
      await execute(
        `npm publish --otp=${otp} --access=public --tag=${
          tag || 'experimental'
        } ${path.resolve(__dirname, `../dist/${folderName}`)}`
      );
    } catch (e) {
      console.warn(e);
    }
  }
}

publish()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
