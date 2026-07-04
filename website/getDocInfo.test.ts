import fs from 'fs';
import path from 'path';
import getDocInfo, { DocInfo } from './getDocInfo';

function getPublicExports() {
  const index = fs.readFileSync(path.resolve(__dirname, '../src/index.ts'), {
    encoding: 'utf8',
  });

  return Array.from(index.matchAll(/export \{ default as (\w+) \} from '(.+)';/g))
    .map(([, name, source]) => ({
      name,
      source,
      file: path.resolve(__dirname, `../src/${source}.ts`),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readDocInfo(file: string): DocInfo {
  return getDocInfo(fs.readFileSync(file, { encoding: 'utf8' }));
}

test('extracts complete docs for a function', () => {
  expect(readDocInfo(require.resolve('../src/transparentize'))).toEqual({
    description: expect.stringContaining('Makes a color more transparent'),
    functionName: 'transparentize',
    id: 'transparentize',
    kind: 'function',
    params: [
      {
        description: 'The input color.',
        name: 'color',
        type: 'string',
      },
      {
        description:
          'The amount to increase transparency by, given as a decimal between 0 and 1.',
        name: 'amount',
        type: 'number',
      },
    ],
    returnType: 'string',
    returnsDescription:
      'The more transparent color as an `rgba` string.',
    signature:
      'function transparentize(color: string, amount: number): string',
  });
});

test('extracts docs for exported classes', () => {
  expect(readDocInfo(require.resolve('../src/ColorError'))).toEqual({
    description: expect.stringContaining(
      'Error thrown when color2k cannot parse'
    ),
    functionName: 'ColorError',
    id: 'color-error',
    kind: 'class',
    params: [
      {
        description: 'The color value that failed to parse.',
        name: 'color',
        type: 'string',
      },
    ],
    returnType: 'ColorError',
    signature: 'class ColorError extends Error',
  });
});

test('all public exports have complete docs', () => {
  const docs = getPublicExports().map(({ file }) => readDocInfo(file));

  expect(docs.map(({ functionName }) => functionName)).toEqual(
    getPublicExports().map(({ name }) => name)
  );

  for (const doc of docs) {
    expect(doc.description).toBeTruthy();
    expect(doc.signature).toBeTruthy();

    for (const param of doc.params) {
      expect(param.description).toBeTruthy();
      expect(param.type).toBeTruthy();
    }

    if (doc.kind === 'function') {
      expect(doc.returnType).toBeTruthy();
      expect(doc.returnsDescription).toBeTruthy();
    }
  }
});
