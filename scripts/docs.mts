import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import ts from 'typescript';
import prettier from 'prettier';

interface DocInfo {
  functionName: string;
  id: string;
  description: string;
  params: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  returnType: string;
}

function getDocInfo(contents: string): DocInfo {
  const rootNode = ts.createSourceFile(
    'example.ts',
    contents,
    ts.ScriptTarget.ES2015,
    true
  );

  function findFirst<T extends ts.Node>(
    node: ts.Node,
    accept: (node: ts.Node) => node is T
  ): T | null {
    if (accept(node)) return node;
    for (const child of node.getChildren()) {
      const found = findFirst(child, accept);
      if (found) return found;
    }
    return null;
  }

  function getText(node: ts.Node) {
    return contents.substring(node.pos, node.end);
  }

  const functionNode = findFirst(rootNode, ts.isFunctionDeclaration);
  if (!functionNode) throw new Error('No function node');

  const { name } = functionNode;
  if (!name) throw new Error('No function name');

  const functionName = getText(name).trim();

  const jsDoc = findFirst(functionNode, ts.isJSDoc);
  if (!jsDoc) throw new Error('No js doc');

  function getAllJsDocParams(node: ts.Node): ts.Node[] {
    if (node.kind === ts.SyntaxKind.JSDocParameterTag) return [node];
    return node.getChildren().map(getAllJsDocParams).flat();
  }

  const paramDescriptions = getAllJsDocParams(jsDoc)
    .map(getText)
    .map((param) => {
      const match = /@param\s+([\S]*)([\s\S]*)/.exec(param);
      if (!match) throw new Error('Could not parse param');
      const [identifier, description] = Array.from(match)
        .slice(1)
        .map((x) => x.replace(/\n\s*\*/, ' ').trim());

      return { identifier, description };
    })
    .reduce((acc, { identifier, description }) => {
      acc[identifier] = description;
      return acc;
    }, {} as { [identifier: string]: string });

  const description = jsDoc.comment;
  if (typeof description !== 'string') {
    throw new Error('Expected string for description');
  }
  const syntaxList = findFirst(
    functionNode,
    (node): node is ts.SyntaxList => node.kind === ts.SyntaxKind.SyntaxList
  );
  if (!syntaxList) throw new Error('No syntax list');

  function getParamNodes(node: ts.Node): ts.ParameterDeclaration[] {
    if (ts.isParameter(node)) return [node];
    return node.getChildren().map(getParamNodes).flat();
  }

  const paramNodes = getParamNodes(syntaxList);

  const params = paramNodes.map((paramNode) => {
    const identifier = findFirst(paramNode, ts.isIdentifier);
    const colonToken = findFirst(
      paramNode,
      (node): node is ts.Node => node.kind === ts.SyntaxKind.ColonToken
    );

    if (!identifier) throw new Error('No param identifier');
    if (!colonToken) throw new Error('No colon token');

    const name = getText(identifier).trim();
    const type = contents.substring(colonToken.end, paramNode.end).trim();
    const description = paramDescriptions[name] ?? '';

    return { name, type, description };
  });

  const returnTypeColonTokenIndex = functionNode
    .getChildren()
    .findIndex((node) => node.kind === ts.SyntaxKind.ColonToken);

  if (returnTypeColonTokenIndex === -1) throw new Error('No return type colon');

  const returnTypeNode =
    functionNode.getChildren()[returnTypeColonTokenIndex + 1];

  const returnType = getText(returnTypeNode).trim();

  const id = functionName
    .split('')
    .map((character) =>
      character === character.toUpperCase() ? `-${character}` : character
    )
    .join('')
    .toLowerCase();

  return {
    functionName,
    id,
    description,
    params,
    returnType,
  };
}

const rootDir = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  '..'
);

const functionFiles = (
  await fs.promises.readdir(path.resolve(rootDir, './src'))
).filter(
  (filename) =>
    !filename.endsWith('.test.ts') &&
    filename !== 'index.ts' &&
    filename !== 'ColorError.ts'
);

const docs: DocInfo[] = [];
for (const file of functionFiles) {
  try {
    const buffer = await fs.promises.readFile(
      path.resolve(rootDir, `./src/${file}`)
    );
    const contents = buffer.toString();
    docs.push(getDocInfo(contents));
  } catch (e) {
    console.warn(`Failed to create doc for ${file}. ${e.message}`);
  }
}
docs.sort((a, b) => a.functionName.localeCompare(b.functionName));

const tocMarkdown = docs
  .map(({ functionName, id }) => `- [\`${functionName}\`](#${id})`)
  .join('\n');

const apiMarkdown = docs
  .map((docInfo) => {
    const { description, functionName, id, params, returnType } = docInfo;
    const signature = `\`${functionName}(${params
      .map((p) => p.name)
      .join(', ')}): ${returnType}\``;

    return (
      `#### ${signature} | [🔝](#reference)\n\n` +
      `<a name="${id}"></a>\n\n` +
      `${description}\n\n` +
      `| Param | Type | Description |\n` +
      `| ----- | ---- | ------------|\n` +
      params
        .map(
          ({ name, type, description }) =>
            // prettier-ignore
            `| \`${name}\` | \`${type.replace(/\|/g, '\\|')}\` | ${description} | `
        )
        .join('\n') +
      `\n\n[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/${functionName}.ts) &nbsp; ` +
      `[see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/${functionName}.test.ts)\n`
    );
  })
  .join('\n');

const readmePath = path.resolve(rootDir, './README.md');
const readme = await fs.promises.readFile(readmePath, 'utf-8');
const docsMarker = '<!-- begin api docs -->';

const [preApiContent] = readme.split(docsMarker);

const newReadme = await prettier.format(
  `${preApiContent}\n${docsMarker}\njump to:\n\n${tocMarkdown}\n${apiMarkdown}`,
  { filepath: 'README.md' }
);

await fs.promises.writeFile(readmePath, newReadme);
