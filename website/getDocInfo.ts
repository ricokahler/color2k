import ts from 'typescript';

export interface DocInfo {
  functionName: string;
  id: string;
  kind: 'function' | 'class';
  description: string;
  params: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  returnType: string;
  returnsDescription?: string;
  signature: string;
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

  function commentToString(comment: ts.JSDoc['comment']): string {
    if (!comment) return '';
    if (typeof comment === 'string') return comment.trim();
    return comment.map((part) => part.getText(rootNode)).join('').trim();
  }

  function getJsDoc(node: ts.Node): ts.JSDoc {
    const jsDoc = (node as ts.Node & { jsDoc?: ts.JSDoc[] }).jsDoc?.[0];
    if (!jsDoc) throw new Error('No js doc');
    return jsDoc;
  }

  function getNodeName(
    node: ts.FunctionDeclaration | ts.ClassDeclaration
  ): string {
    if (!node.name) throw new Error('No public name');
    return node.name.getText(rootNode).trim();
  }

  function getId(name: string): string {
    return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  function getParamType(param: ts.ParameterDeclaration): string {
    if (!param.type) throw new Error(`No type for param ${param.name.getText()}`);

    const baseType = param.type.getText(rootNode);
    return param.initializer
      ? `${baseType} = ${param.initializer.getText(rootNode)}`
      : baseType;
  }

  function getParamDocs(jsDoc: ts.JSDoc) {
    return (jsDoc.tags ? Array.from(jsDoc.tags) : [])
      .filter(ts.isJSDocParameterTag)
      .reduce((acc, tag) => {
        acc[tag.name.getText(rootNode)] = commentToString(tag.comment);
        return acc;
      }, {} as { [name: string]: string });
  }

  function getReturnDoc(jsDoc: ts.JSDoc): string | undefined {
    const tag = (jsDoc.tags ? Array.from(jsDoc.tags) : []).find(
      ts.isJSDocReturnTag
    );
    return tag ? commentToString(tag.comment) : undefined;
  }

  function getParams(
    params: ts.NodeArray<ts.ParameterDeclaration>,
    jsDoc: ts.JSDoc
  ): DocInfo['params'] {
    const paramDocs = getParamDocs(jsDoc);

    return params.map((param) => {
      const name = param.name.getText(rootNode);
      const description = paramDocs[name];

      if (!description) {
        throw new Error(`Missing @param documentation for ${name}`);
      }

      return {
        name,
        type: getParamType(param),
        description,
      };
    });
  }

  const functionNode = findFirst(rootNode, ts.isFunctionDeclaration);
  if (functionNode) {
    const functionName = getNodeName(functionNode);
    const jsDoc = getJsDoc(functionNode);
    const description = commentToString(jsDoc.comment);
    const returnsDescription = getReturnDoc(jsDoc);

    if (!description) throw new Error(`No description for ${functionName}`);
    if (!functionNode.type) throw new Error(`No return type for ${functionName}`);
    if (!returnsDescription) {
      throw new Error(`Missing @returns documentation for ${functionName}`);
    }

    const params = getParams(functionNode.parameters, jsDoc);
    const returnType = functionNode.type.getText(rootNode);
    const signature = `function ${functionName}(${params
      .map(({ name, type }) => `${name}: ${type}`)
      .join(', ')}): ${returnType}`;

    return {
      functionName,
      id: getId(functionName),
      kind: 'function',
      description,
      params,
      returnType,
      returnsDescription,
      signature,
    };
  }

  const classNode = findFirst(rootNode, ts.isClassDeclaration);
  if (!classNode) throw new Error('No documentable node');

  const functionName = getNodeName(classNode);
  const jsDoc = getJsDoc(classNode);
  const description = commentToString(jsDoc.comment);
  if (!description) throw new Error(`No description for ${functionName}`);

  const constructorNode = classNode.members.find(ts.isConstructorDeclaration);
  const params = constructorNode ? getParams(constructorNode.parameters, jsDoc) : [];
  const heritage = classNode.heritageClauses
    ?.map((clause) => clause.getText(rootNode))
    .join(' ');
  const signature = `class ${functionName}${heritage ? ` ${heritage}` : ''}`;

  return {
    functionName,
    id: getId(functionName),
    kind: 'class',
    description,
    params,
    returnType: functionName,
    signature,
  };
}

export default getDocInfo;
