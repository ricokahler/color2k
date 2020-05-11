import * as ts from 'typescript';
import showdown from 'showdown';

const converter = new showdown.Converter();

export interface DocInfo {
  functionName: string;
  id: string;
  description: string;
  params: Array<{
    name: string;
    type: string;
    description?: string;
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
  if (!description) throw new Error('No description');

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
    const description = paramDescriptions[name] as string | undefined;

    return {
      name,
      type,
      ...(description && { description }),
    };
  });

  const returnTypeColonTokenIndex = functionNode
    .getChildren()
    .findIndex((node) => node.kind === ts.SyntaxKind.ColonToken);

  if (returnTypeColonTokenIndex === -1) throw new Error('No return type colon');

  const returnTypeNode = functionNode.getChildren()[
    returnTypeColonTokenIndex + 1
  ];

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
    description: converter.makeHtml(description),
    params,
    returnType,
  };
}

export default getDocInfo;
