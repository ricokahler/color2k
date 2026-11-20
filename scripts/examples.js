// Runs README code blocks against the built package. Used by
// `check-examples.js` and `readme-assets.js`.
const assert = require('assert');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const color2k = require(path.resolve(root, 'dist/index.exports.require.cjs.js'));

// Just enough of React and a CSS-in-JS library to execute the examples:
// components are called when rendered and style interpolations are evaluated.
const react = {
  createElement: (type, props, ...children) =>
    typeof type === 'function'
      ? type({ ...props, children })
      : { type, props: { ...props, children } },
  useMemo: (create) => create(),
};
const styledTag =
  (strings, ...values) =>
  (props = {}) =>
    strings.reduce((css, string, index) => {
      const value = values[index];
      const resolved = typeof value === 'function' ? value(props) : value;
      return css + string + (index < values.length ? resolved : '');
    }, '');
const styled = new Proxy(() => styledTag, { get: () => styledTag });

const modules = {
  color2k,
  react,
  'styled-components': { __esModule: true, default: styled },
};

function getBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  let block = null;
  let inApi = false;

  lines.forEach((line, index) => {
    if (line === '<!-- API-DOCS-START -->') inApi = true;
    if (line === '<!-- API-DOCS-END -->') inApi = false;
    const fence = /^```(\w*)\s*$/.exec(line);

    if (!block) {
      if (fence) block = { lang: fence[1], line: index + 2, code: [], inApi };
    } else if (fence) {
      blocks.push({ ...block, end: index, code: block.code.join('\n') });
      block = null;
    } else {
      block.code.push(line);
    }
  });

  return blocks.filter(({ lang }) => ['js', 'jsx', 'tsx'].includes(lang));
}

function addAssertions(code, firstLine) {
  let count = 0;

  const instrumented = code
    .split('\n')
    .map((line, index) => {
      const match = /^(\s*)(\S.*);\s*\/\/ (.+)$/.exec(line);
      if (!match) return line;

      const [, indent, statement, expected] = match;
      const declaration = /^(?:const|let) (\w+) = /.exec(statement);
      const log = /^console\.log\((.+)\)$/.exec(statement);
      const args = `${JSON.stringify(expected)}, ${firstLine + index}`;
      count += 1;

      if (declaration) {
        return `${indent}${statement}; __expect(${declaration[1]}, ${args});`;
      }

      return `${indent}__expect(${log ? log[1] : statement}, ${args});`;
    })
    .join('\n');

  return { count, instrumented };
}

function expectValue(actual, expected, line) {
  let parsed;
  let isLiteral = true;

  try {
    // Parsed in this realm so arrays compare equal to the arrays color2k returns.
    parsed = vm.runInThisContext(`(${expected})`);
  } catch {
    isLiteral = false;
  }

  try {
    if (isLiteral) assert.deepStrictEqual(actual, parsed);
    else assert.strictEqual(String(actual), expected);
  } catch {
    // `console.log(color); // rgba(255, 0, 0, 1)` shows a string without quotes.
    if (String(actual) === expected) return;

    throw new Error(
      `README.md:${line} expected ${expected} but received ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Runs one code block. `capture` is an expression evaluated in the block's
 * scope after it runs (`scripts/readme-assets.js` uses it to draw a recipe's
 * result from the recipe's own variables).
 */
function run({ code, lang, line, inApi }, { capture } = {}) {
  const { count, instrumented } = addAssertions(code, line);
  const source = capture
    ? `${instrumented}\n;__capture(${capture});`
    : instrumented;
  let captured;
  const { outputText, diagnostics } = ts.transpileModule(source, {
    reportDiagnostics: true,
    fileName: `example.${lang === 'js' ? 'jsx' : lang}`,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
    },
  });

  if (diagnostics.length) {
    const message = ts.flattenDiagnosticMessageText(
      diagnostics[0].messageText,
      '\n'
    );
    throw new Error(`README.md:${line} does not parse: ${message}`);
  }

  const requireModule = (name) => {
    if (!(name in modules)) {
      throw new Error(`README.md:${line} imports "${name}", which the example runner does not provide`);
    }
    return modules[name];
  };

  try {
    const scope = {
      require: requireModule,
      exports: {},
      module: { exports: {} },
      React: react,
      __expect: expectValue,
      __capture: (value) => {
        captured = value;
      },
      console: { ...console, log() {} },
      ...(inApi ? color2k : {}),
    };

    new Function(...Object.keys(scope), outputText)(...Object.values(scope));
  } catch (error) {
    if (/^README\.md:/.test(error.message)) throw error;
    throw new Error(`README.md:${line} example threw ${error.stack}`);
  }

  return { count, captured };
}


module.exports = { color2k, getBlocks, root, run };
