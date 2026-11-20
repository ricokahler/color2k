// Runs every `js`, `jsx` and `tsx` code block in README.md against the built
// package, so the docs (and the website and llms files generated from them)
// can't show code that doesn't work.
//
// A trailing comment on a one-line statement is an assertion:
//
//   darken('white', 0.1); // 'hsla(0, 0%, 90%, 1)'
//   const hex = toHex('red'); // '#ff0000'
//   console.log(scale(0.5)); // rgba(255, 255, 0, 1)
//
// Put explanations on their own line. `ts` blocks are signatures and are not
// run. Examples must import what they use, except in the generated API
// section, where the JSDoc examples are one-liners.
const fs = require('fs');
const path = require('path');
const { getBlocks, root, run } = require('./examples');

const readme = fs.readFileSync(path.resolve(root, 'README.md'), 'utf8');
const blocks = getBlocks(readme);
const failures = [];
let assertions = 0;

for (const block of blocks) {
  try {
    assertions += run(block).count;
  } catch (error) {
    failures.push(error.message);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else if (blocks.length < 20 || assertions < 20) {
  console.error(`Expected README examples to check; found ${blocks.length} blocks and ${assertions} assertions.`);
  process.exitCode = 1;
} else {
  console.log(
    `README examples passed: ${blocks.length} code blocks ran, ${assertions} results matched.`
  );
}
