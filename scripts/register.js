const path = require('path');

require('@babel/register')({ extensions: ['.js', '.ts', '.tsx'] });
const args = process.argv.slice(2);

if (args[0] === '--') {
  const filename = args[1];
  // require relative to the root
  require(path.resolve(__dirname, '../', filename));
}
