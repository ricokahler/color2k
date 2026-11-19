// Smoke test for the legacy CommonJS build. CI runs this file on Node 6, so it
// has to stay ES5: no const/let, arrow functions or template literals.
var assert = require('assert');
var path = require('path');
var color2k = require(path.resolve(__dirname, '../dist/index.main.cjs.js'));

assert.deepStrictEqual(color2k.parseToRgba('red'), [255, 0, 0, 1]);
assert.deepStrictEqual(color2k.parseToRgba(' red '), [255, 0, 0, 1]);
assert.strictEqual(color2k.toHex('rgba(255, 0, 0, 0.5)'), '#ff000080');
assert.strictEqual(color2k.mix('red', 'blue', 0.5), 'rgba(128, 0, 128, 1)');
assert.strictEqual(color2k.getContrast('black', 'white'), 21);
assert.strictEqual(color2k.darken('white', 0.1), 'hsla(0, 0%, 90%, 1)');
assert.strictEqual(
  color2k.getScale('red', 'yellow', 'green')(0.5),
  'rgba(255, 255, 0, 1)'
);
assert.throws(function () {
  color2k.parseToRgba('notrealblue');
}, /Failed to parse color: "notrealblue"/);

console.log('dist/index.main.cjs.js works on Node ' + process.version + '.');
